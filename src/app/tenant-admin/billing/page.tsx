"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { auth } from '@/lib/auth';
import { toast } from 'sonner';
import { doc, getDoc } from 'firebase/firestore';
import { centralDb } from '@/lib/firebase';
import { TenantConfig } from '@/lib/types';
import { PLANS, isTrialExpired } from '@/lib/plans';
import { Check, Zap, ArrowLeft, Loader2, Lock, Star } from 'lucide-react';
import Link from 'next/link';

function getTrialDaysLeft(trialEndsAt?: Date | string | null): number | null {
  if (!trialEndsAt) return null;
  const end = trialEndsAt instanceof Date ? trialEndsAt : new Date(trialEndsAt as string);
  return Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86400000));
}

function BillingContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [tenant, setTenant] = useState<TenantConfig | null>(null);
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.tenantId) return;
    getDoc(doc(centralDb, 'tenants', user.tenantId)).then(snap => {
      if (snap.exists()) {
        setTenant({ id: snap.id, ...snap.data() } as TenantConfig);
      }
    });
  }, [user]);

  async function handleSubscribe(planId: 'starter' | 'pro') {
    if (!user) return;
    setLoadingPlan(planId);

    try {
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) throw new Error('Sin sesión');

      const res = await fetch('/api/billing/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ plan: planId, cycle }),
      });

      const data = await res.json();

      if (!res.ok || !data.checkoutUrl) {
        throw new Error(data.error || 'Error al iniciar pago');
      }

      // Redirigir a MercadoPago
      window.location.href = data.checkoutUrl;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      if (msg.includes('no configurad') || msg.includes('configurados')) {
        toast.error('Pagos no disponibles aún', {
          description: 'Contáctanos por WhatsApp para activar tu plan.',
          action: {
            label: 'WhatsApp',
            onClick: () => window.open('https://wa.me/51945111310?text=Hola, quiero activar el plan ' + planId, '_blank'),
          },
        });
      } else {
        toast.error(msg);
      }
    } finally {
      setLoadingPlan(null);
    }
  }

  const starterPlan = PLANS.starter;
  const proPlan = PLANS.pro;
  const currentPlan = tenant?.plan ?? 'starter';
  const isTrialActive = tenant?.status === 'trial' && !isTrialExpired(
    tenant?.trialEndsAt ? (tenant.trialEndsAt instanceof Date ? tenant.trialEndsAt : new Date(tenant.trialEndsAt as string)) : null
  );
  const trialDays = getTrialDaysLeft(tenant?.trialEndsAt);

  const features = [
    { label: 'Productos en catálogo', starter: 'Hasta 30', pro: 'Ilimitados' },
    { label: 'Categorías', starter: 'Hasta 5', pro: 'Ilimitadas' },
    { label: 'Slides en el hero', starter: '1 slide', pro: '10 slides' },
    { label: 'Imágenes por producto', starter: '5', pro: '20' },
    { label: 'Redes sociales', starter: false, pro: true },
    { label: 'Control de stock', starter: false, pro: true },
    { label: 'SEO personalizado', starter: false, pro: true },
    { label: 'Analytics de visitas', starter: false, pro: true },
    { label: 'Dominio personalizado', starter: false, pro: true },
  ];

  return (
    <div className="min-h-screen bg-[#F1F5F9] pb-24 p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/tenant-admin">
            <button className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-900 transition-colors">
              <ArrowLeft size={20} />
            </button>
          </Link>
          <div>
            <h2 className="text-2xl font-black text-gray-900">Planes & Facturación</h2>
            <p className="text-gray-500 text-sm font-medium mt-0.5">Elige el plan que mejor se adapte a tu negocio</p>
          </div>
        </div>

        {/* Estado actual */}
        {tenant && (
          <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-1">Plan actual</p>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-extrabold uppercase ${
                    currentPlan === 'pro' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {currentPlan === 'pro' ? '⚡ Pro' : 'Starter'}
                  </span>
                  {isTrialActive && trialDays !== null && (
                    <span className="text-xs text-amber-600 font-bold bg-amber-50 px-2 py-1 rounded-full">
                      {trialDays} días de prueba
                    </span>
                  )}
                  {tenant.status === 'active' && (
                    <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded-full">
                      ✓ Activo
                    </span>
                  )}
                </div>
              </div>
              {isTrialActive && (
                <p className="text-sm text-gray-500">
                  Tu prueba gratuita termina el{' '}
                  <strong className="text-gray-800">
                    {tenant.trialEndsAt ? new Date(tenant.trialEndsAt as string).toLocaleDateString('es-PE', { day: 'numeric', month: 'long' }) : '—'}
                  </strong>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Toggle mensual/anual */}
        <div className="flex justify-center">
          <div className="bg-white rounded-2xl p-1.5 border border-gray-100 shadow-sm flex gap-1">
            <button
              onClick={() => setCycle('monthly')}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                cycle === 'monthly' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => setCycle('yearly')}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                cycle === 'yearly' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Anual
              <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                cycle === 'yearly' ? 'bg-white/20 text-white' : 'bg-green-100 text-green-700'
              }`}>
                -5%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Starter */}
          <div className={`bg-white rounded-[2rem] p-8 border shadow-sm flex flex-col ${
            currentPlan === 'starter' ? 'border-gray-300' : 'border-gray-100'
          }`}>
            <div className="mb-6">
              <p className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-2">Starter</p>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-black text-gray-900">
                  S/.{cycle === 'yearly'
                    ? (starterPlan.yearlyPrice / 12).toFixed(2)
                    : starterPlan.monthlyPrice.toFixed(2)}
                </span>
                <span className="text-gray-400 text-sm font-semibold mb-1">/mes</span>
              </div>
              {cycle === 'yearly' && (
                <p className="text-xs text-gray-400 mt-1">S/.{starterPlan.yearlyPrice.toFixed(2)} al año</p>
              )}
              <p className="text-sm text-gray-500 mt-3">Ideal para empezar tu catálogo online.</p>
            </div>

            <div className="space-y-3 flex-1 mb-8">
              {features.map(f => (
                <div key={f.label} className="flex items-center gap-3">
                  {typeof f.starter === 'boolean' ? (
                    f.starter ? (
                      <Check size={16} className="text-green-500 shrink-0" strokeWidth={3} />
                    ) : (
                      <Lock size={14} className="text-gray-200 shrink-0" />
                    )
                  ) : (
                    <Check size={16} className="text-green-500 shrink-0" strokeWidth={3} />
                  )}
                  <span className={`text-sm font-medium ${
                    typeof f.starter === 'boolean' && !f.starter ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {f.label}
                    {typeof f.starter === 'string' && (
                      <span className="text-gray-400 ml-1">({f.starter})</span>
                    )}
                  </span>
                </div>
              ))}
            </div>

            {currentPlan === 'starter' && tenant?.status === 'active' ? (
              <div className="w-full py-3 rounded-2xl text-center text-sm font-bold text-gray-400 bg-gray-50">
                Plan actual
              </div>
            ) : (
              <button
                onClick={() => handleSubscribe('starter')}
                disabled={loadingPlan !== null}
                className="w-full py-3 rounded-2xl border-2 border-gray-200 text-sm font-bold text-gray-700 hover:border-gray-400 transition-all disabled:opacity-50"
              >
                {loadingPlan === 'starter' ? (
                  <Loader2 size={16} className="animate-spin mx-auto" />
                ) : 'Elegir Starter'}
              </button>
            )}
          </div>

          {/* Pro */}
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-[2rem] p-8 border border-transparent shadow-xl shadow-gray-900/20 flex flex-col relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <span className="flex items-center gap-1 bg-purple-500 text-white text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full">
                <Star size={9} strokeWidth={3} fill="white" /> Recomendado
              </span>
            </div>

            <div className="mb-6">
              <p className="text-xs font-extrabold text-purple-300 uppercase tracking-widest mb-2">Pro</p>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-black text-white">
                  S/.{cycle === 'yearly'
                    ? (proPlan.yearlyPrice / 12).toFixed(2)
                    : proPlan.monthlyPrice.toFixed(2)}
                </span>
                <span className="text-gray-400 text-sm font-semibold mb-1">/mes</span>
              </div>
              {cycle === 'yearly' && (
                <p className="text-xs text-gray-400 mt-1">S/.{proPlan.yearlyPrice.toFixed(2)} al año</p>
              )}
              <p className="text-sm text-gray-400 mt-3">Para negocios que quieren crecer sin límites.</p>
            </div>

            <div className="space-y-3 flex-1 mb-8">
              {features.map(f => (
                <div key={f.label} className="flex items-center gap-3">
                  <Check size={16} className="text-purple-400 shrink-0" strokeWidth={3} />
                  <span className="text-sm font-medium text-gray-200">
                    {f.label}
                    {typeof f.pro === 'string' && (
                      <span className="text-gray-400 ml-1">({f.pro})</span>
                    )}
                  </span>
                </div>
              ))}
            </div>

            {currentPlan === 'pro' && tenant?.status === 'active' ? (
              <div className="w-full py-3 rounded-2xl text-center text-sm font-bold text-purple-300 bg-white/10">
                ✓ Plan actual
              </div>
            ) : (
              <button
                onClick={() => handleSubscribe('pro')}
                disabled={loadingPlan !== null}
                className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {loadingPlan === 'pro' ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <Zap size={16} strokeWidth={2.5} />
                    Mejorar a Pro
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Info footer */}
        <div className="text-center text-xs text-gray-400 space-y-1">
          <p>Los pagos son procesados de forma segura por MercadoPago.</p>
          <p>¿Tienes preguntas? <a href="https://wa.me/51945111310" target="_blank" rel="noopener noreferrer" className="text-gray-600 font-semibold hover:underline">Escríbenos por WhatsApp</a></p>
        </div>
      </div>
    </div>
  );
}

export default function BillingPage() {
  return (
    <ProtectedRoute>
      <BillingContent />
    </ProtectedRoute>
  );
}
