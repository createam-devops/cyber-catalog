"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, MousePointerClick, Package, Plus, ChevronDown, LogOut, Lock, Zap, Clock } from 'lucide-react';
import { doc, getDoc, collection, getCountFromServer } from 'firebase/firestore';
import { centralDb, initTenantFirebase } from '@/lib/firebase';
import { TenantConfig } from '@/lib/types';
import { logout } from '@/lib/auth';
import { toast } from 'sonner';
import { isTrialExpired } from '@/lib/plans';

function getTrialDaysLeft(trialEndsAt?: Date | string | null): number | null {
  if (!trialEndsAt) return null;
  const end = trialEndsAt instanceof Date ? trialEndsAt : new Date(trialEndsAt as string);
  const diff = end.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function TenantAdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [tenant, setTenant] = useState<TenantConfig | null>(null);
  const [productCount, setProductCount] = useState<number | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Sesión cerrada');
      router.push('/login');
    } catch (error) {
      toast.error('Error al cerrar sesión');
    }
  };

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  useEffect(() => {
    const loadTenant = async () => {
      if (!user?.tenantId) return;
      
      try {
        const tenantDoc = await getDoc(doc(centralDb, 'tenants', user.tenantId));
        if (tenantDoc.exists()) {
          const tenantData = { id: tenantDoc.id, ...tenantDoc.data() } as TenantConfig;
          setTenant(tenantData);

          // Cargar conteo de productos desde Firebase del tenant
          try {
            const { db } = initTenantFirebase(tenantData.id, tenantData.firebaseConfig);
            const snap = await getCountFromServer(collection(db, 'products'));
            setProductCount(snap.data().count);
          } catch {
            // Si falla, dejamos null (no crítico)
          }
        }
      } catch (error) {
        console.error('Error loading tenant:', error);
      }
    };

    loadTenant();
  }, [user]);

  return (
    <div className="max-w-7xl mx-auto p-5 md:p-10">
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
          <div className="w-full sm:w-auto text-center sm:text-left">
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">Dashboard</h2>
            <p className="text-gray-500 font-medium text-sm mt-1">Resumen de actividad.</p>
          </div>
          
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-full border border-gray-100 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-400 to-orange-400 flex items-center justify-center text-white font-bold text-sm">
                {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'A'}
              </div>
              <div className="text-left hidden sm:block">
                <span className="block text-xs font-bold text-gray-800">
                  {user?.displayName || user?.email?.split('@')[0] || 'Admin'}
                </span>
                <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-wide">
                  {user?.role === 'owner' ? 'Propietario' : 'Administrador'}
                </span>
              </div>
              <ChevronDown size={14} className={`text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Menú desplegable del usuario */}
            {showUserMenu && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50">
                <div className="p-4 border-b border-gray-100">
                  <p className="text-sm font-bold text-gray-800 truncate">
                    {user?.displayName || user?.email?.split('@')[0] || 'Admin'}
                  </p>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mt-1">
                    {user?.role === 'owner' ? 'Propietario' : 'Administrador'}
                  </p>
                  <p className="text-xs text-gray-500 mt-2 truncate">
                    {user?.email}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={16} />
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Plan badge */}
        {tenant && (
          <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex flex-wrap items-center gap-4 justify-between">
            <div className="flex items-center gap-3">
              <div className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest ${
                tenant.plan === 'pro'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {tenant.plan === 'pro' ? '⚡ Pro' : 'Starter'}
              </div>
              {tenant.status === 'trial' && (() => {
                const daysLeft = getTrialDaysLeft(tenant.trialEndsAt);
                const expired = isTrialExpired(tenant.trialEndsAt ? (tenant.trialEndsAt instanceof Date ? tenant.trialEndsAt : new Date(tenant.trialEndsAt as string)) : null);
                return (
                  <div className={`flex items-center gap-1.5 text-xs font-bold ${
                    expired ? 'text-red-500' : daysLeft !== null && daysLeft <= 7 ? 'text-amber-500' : 'text-gray-500'
                  }`}>
                    <Clock size={13} />
                    {expired
                      ? 'Prueba expirada'
                      : `${daysLeft} día${daysLeft === 1 ? '' : 's'} de prueba restantes`}
                  </div>
                );
              })()}
            </div>
            {tenant.plan !== 'pro' && (
              <button
                onClick={() => router.push('/tenant-admin/billing')}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-full hover:opacity-90 transition-opacity"
              >
                <Zap size={13} />
                Mejorar a Pro
              </button>
            )}
          </div>
        )}

        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Vistas */}
          {tenant?.plan === 'pro' ? (
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-40">
              <div className="flex justify-between items-start">
                <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
                  <Eye size={20} strokeWidth={2.5} />
                </div>
              </div>
              <div>
                <p className="text-3xl font-black text-gray-900 tracking-tight">
                  {tenant.analyticsViews?.toLocaleString() ?? '0'}
                </p>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Vistas Totales</p>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-6 rounded-[2rem] border border-dashed border-gray-200 flex flex-col justify-between h-40 relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div className="p-3 rounded-2xl bg-gray-100 text-gray-300">
                  <Eye size={20} strokeWidth={2.5} />
                </div>
                <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-lg flex items-center gap-1">
                  <Lock size={9} /> Pro
                </span>
              </div>
              <div>
                <p className="text-3xl font-black text-gray-300 tracking-tight">—</p>
                <p className="text-xs font-bold text-gray-300 uppercase tracking-wider mt-1">Vistas Totales</p>
              </div>
            </div>
          )}

          {/* WhatsApp clicks */}
          {tenant?.plan === 'pro' ? (
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-40">
              <div className="flex justify-between items-start">
                <div className="p-3 rounded-2xl bg-green-50 text-green-600">
                  <MousePointerClick size={20} strokeWidth={2.5} />
                </div>
              </div>
              <div>
                <p className="text-3xl font-black text-gray-900 tracking-tight">
                  {tenant.analyticsWhatsapp?.toLocaleString() ?? '0'}
                </p>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Intención de Compra</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Clics WhatsApp</p>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-6 rounded-[2rem] border border-dashed border-gray-200 flex flex-col justify-between h-40 relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div className="p-3 rounded-2xl bg-gray-100 text-gray-300">
                  <MousePointerClick size={20} strokeWidth={2.5} />
                </div>
                <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-lg flex items-center gap-1">
                  <Lock size={9} /> Pro
                </span>
              </div>
              <div>
                <p className="text-3xl font-black text-gray-300 tracking-tight">—</p>
                <p className="text-xs font-bold text-gray-300 uppercase tracking-wider mt-1">Intención de Compra</p>
              </div>
            </div>
          )}

          {/* Productos activos */}
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-40">
            <div className="flex justify-between items-start">
              <div className="p-3 rounded-2xl bg-purple-50 text-purple-600">
                <Package size={20} strokeWidth={2.5} />
              </div>
            </div>
            <div>
              <p className="text-3xl font-black text-gray-900 tracking-tight">
                {productCount ?? '...'}
              </p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Prod. Activos</p>
              {tenant?.plan === 'starter' && productCount !== null && (
                <p className="text-[10px] text-gray-400 mt-0.5">{productCount}/30 del límite</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => router.push('/tenant-admin/products/new')}
            className="bg-gradient-to-br from-gray-900 to-black text-white rounded-[2rem] p-8 relative overflow-hidden group cursor-pointer shadow-xl shadow-gray-200"
          >
            <div className="relative z-10 flex justify-between items-center h-full">
              <div className="text-left">
                <h3 className="text-xl font-bold mb-1">Crear Producto</h3>
                <p className="text-gray-400 text-sm">Agrega items al catálogo.</p>
              </div>
              <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-white group-hover:text-black transition-all">
                <Plus size={24} />
              </div>
            </div>
          </button>

          <button
            onClick={() => {
              const domain = tenant?.domain || 'localhost';
              window.open(`/store?_domain=${domain}`, '_blank');
            }}
            className="bg-white rounded-[2rem] p-8 border border-gray-100 relative overflow-hidden group cursor-pointer hover:shadow-lg transition-all"
          >
            <div className="relative z-10 flex justify-between items-center h-full">
              <div className="text-left">
                <h3 className="text-xl font-bold mb-1 text-gray-900">Ver Tienda</h3>
                <p className="text-gray-400 text-sm">Revisa cómo se ve.</p>
              </div>
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-900 group-hover:scale-110 group-hover:bg-rose-50 group-hover:text-rose-600 transition-all">
                <Eye size={24} />
              </div>
            </div>
          </button>

          <button
            onClick={() => router.push('/tenant-admin/categories')}
            className="bg-white rounded-[2rem] p-8 border border-gray-100 relative overflow-hidden group cursor-pointer hover:shadow-lg transition-all"
          >
            <div className="relative z-10 flex justify-between items-center h-full">
              <div className="text-left">
                <h3 className="text-xl font-bold mb-1 text-gray-900">Gestionar Categorías</h3>
                <p className="text-gray-400 text-sm">Organiza tus productos.</p>
              </div>
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-900 group-hover:scale-110 group-hover:bg-purple-50 group-hover:text-purple-600 transition-all">
                <Package size={24} />
              </div>
            </div>
          </button>

          <button
            onClick={() => router.push('/tenant-admin/settings')}
            className="bg-white rounded-[2rem] p-8 border border-gray-100 relative overflow-hidden group cursor-pointer hover:shadow-lg transition-all"
          >
            <div className="relative z-10 flex justify-between items-center h-full">
              <div className="text-left">
                <h3 className="text-xl font-bold mb-1 text-gray-900">Configuración</h3>
                <p className="text-gray-400 text-sm">Personaliza tu marca.</p>
              </div>
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-900 group-hover:scale-110 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                <ChevronDown size={24} />
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
