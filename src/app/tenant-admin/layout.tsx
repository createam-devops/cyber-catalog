"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutGrid, Package, Layers, Settings as SettingsIcon, LogOut, User, ChevronDown, Zap, Clock, CreditCard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { logout } from '@/lib/auth';
import { toast } from 'sonner';
import { doc, getDoc } from 'firebase/firestore';
import { centralDb } from '@/lib/firebase';
import { isTrialExpired } from '@/lib/plans';

const MENU = [
  { id: 'home', icon: LayoutGrid, label: 'Inicio', path: '/tenant-admin' },
  { id: 'products', icon: Package, label: 'Productos', path: '/tenant-admin/products' },
  { id: 'categories', icon: Layers, label: 'Categorías', path: '/tenant-admin/categories' },
  { id: 'settings', icon: SettingsIcon, label: 'Ajustes', path: '/tenant-admin/settings' },
  { id: 'billing', icon: CreditCard, label: 'Planes', path: '/tenant-admin/billing' },
];

function TenantAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [tenantPlan, setTenantPlan] = useState<{ plan?: string; status?: string; trialEndsAt?: string | null } | null>(null);

  // Cargar info de plan del tenant
  useEffect(() => {
    if (!user?.tenantId) return;
    getDoc(doc(centralDb, 'tenants', user.tenantId)).then(snap => {
      if (snap.exists()) {
        const d = snap.data();
        setTenantPlan({
          plan: d.plan,
          status: d.status,
          trialEndsAt: d.trialEndsAt?.toDate?.()?.toISOString() ?? d.trialEndsAt ?? null,
        });
      }
    }).catch(() => {});
  }, [user?.tenantId]);

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

  const getActiveTab = () => {
    if (pathname === '/tenant-admin') return 'home';
    if (pathname?.startsWith('/tenant-admin/products')) return 'products';
    if (pathname?.startsWith('/tenant-admin/categories')) return 'categories';
    if (pathname?.startsWith('/tenant-admin/settings')) return 'settings';
    if (pathname?.startsWith('/tenant-admin/billing')) return 'billing';
    return 'home';
  };

  const activeTab = getActiveTab();

  return (
    <div className="min-h-screen bg-[#F1F5F9] pb-24 md:pb-0 md:pl-28 font-sans selection:bg-rose-500 selection:text-white">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-28 bg-white/90 backdrop-blur-md border-r border-white/50 flex-col items-center py-8 z-30 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl flex items-center justify-center text-white font-extrabold text-xl mb-12 shadow-lg shadow-rose-500/30">
          B
        </div>
        <nav className="flex-1 flex flex-col gap-6 w-full px-4">
          {MENU.map(item => (
            <button
              key={item.id}
              onClick={() => router.push(item.path)}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all group relative
                ${activeTab === item.id 
                  ? 'text-rose-600 bg-rose-50 font-bold shadow-sm' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50 font-medium'}
              `}
            >
              <item.icon size={24} strokeWidth={activeTab === item.id ? 2.5 : 2} />
              <span className="text-[10px] mt-1.5 tracking-wide">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Plan badge en sidebar */}
        {tenantPlan && (
          <div className="px-2 mb-3">
            {tenantPlan.plan === 'pro' ? (
              <div className="flex items-center justify-center gap-1 bg-purple-50 text-purple-700 text-[9px] font-extrabold uppercase tracking-widest px-2 py-1.5 rounded-xl">
                <Zap size={10} strokeWidth={3} />
                Pro
              </div>
            ) : tenantPlan.status === 'trial' ? (() => {
              const trialEnd = tenantPlan.trialEndsAt ? new Date(tenantPlan.trialEndsAt) : null;
              const expired = isTrialExpired(trialEnd);
              const daysLeft = trialEnd ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / 86400000)) : null;
              return (
                <button
                  onClick={() => router.push('/tenant-admin/billing')}
                  className={`w-full flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl text-[9px] font-extrabold uppercase tracking-widest transition-all hover:opacity-80 ${
                    expired ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                  }`}
                >
                  <Clock size={10} strokeWidth={3} />
                  {expired ? 'Expirado' : `${daysLeft}d`}
                </button>
              );
            })() : (
              <button
                onClick={() => router.push('/tenant-admin/billing')}
                className="w-full flex items-center justify-center gap-1 bg-gray-50 text-gray-400 text-[9px] font-extrabold uppercase tracking-widest px-2 py-1.5 rounded-xl hover:bg-purple-50 hover:text-purple-600 transition-all"
              >
                <Zap size={10} strokeWidth={3} />
                Upgrade
              </button>
            )}
          </div>
        )}

        <button 
          onClick={handleLogout}
          className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all mb-4"
        >
          <LogOut size={20} />
        </button>
      </aside>

      {/* Main Content */}
      <main className="w-full">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 bg-white/90 backdrop-blur-xl border border-white/50 rounded-2xl px-4 py-3 flex justify-between items-center z-40 shadow-2xl shadow-black/5">
        {MENU.map(item => (
          <button
            key={item.id}
            onClick={() => router.push(item.path)}
            className={`flex flex-col items-center gap-1 transition-all duration-300
              ${activeTab === item.id ? 'text-rose-600 -translate-y-1' : 'text-gray-400'}
            `}
          >
            <div className={`p-2 rounded-xl ${activeTab === item.id ? 'bg-rose-50' : 'bg-transparent'}`}>
              <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} />
            </div>
          </button>
        ))}
        
        {/* Botón de Usuario en móvil */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex flex-col items-center gap-1 transition-all duration-300 text-gray-400"
          >
            <div className="p-2 rounded-xl bg-transparent">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-400 to-orange-400 flex items-center justify-center text-white font-bold text-xs">
                {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'A'}
              </div>
            </div>
          </button>
          
          {/* Menú desplegable del usuario */}
          {showUserMenu && (
            <div className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50">
              <div className="p-3 border-b border-gray-100">
                <p className="text-xs font-bold text-gray-800 truncate">
                  {user?.displayName || user?.email?.split('@')[0] || 'Admin'}
                </p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                  {user?.role === 'owner' ? 'Propietario' : 'Administrador'}
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
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <TenantAdminLayout>{children}</TenantAdminLayout>
    </ProtectedRoute>
  );
}
