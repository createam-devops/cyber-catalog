"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Check, ExternalLink, Loader2, PartyPopper } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import StorefrontPreviewFrame from '@/components/tenant-admin/design/StorefrontPreviewFrame';
import { ColorField, ContrastNotes, RubroPicker, StylePicker } from '@/components/tenant-admin/design/pickers';
import { tenantApiFetch } from '@/lib/tenant-api';
import type { TenantConfig } from '@/lib/types';
import { isHexColor } from '@/lib/storefront/color';
import { normalizeWhatsapp, type PublicStore } from '@/lib/storefront/public-store';
import { sampleCatalog, type PreviewPayload } from '@/lib/storefront/preview';
import type { StylePresetId } from '@/lib/storefront/presets';
import { RUBROS, type RubroId } from '@/lib/storefront/rubros';

const STEPS = ['Rubro', 'Tu marca', 'Contacto', 'Publicar'] as const;

/** Colores alternativos para elegir con un toque, además de la paleta del rubro. */
const QUICK_COLORS = ['#c2185b', '#7c3aed', '#1d4ed8', '#0f766e', '#15803d', '#c2410c', '#b45309', '#1f2937'];

function storeDomain(tenant: TenantConfig): string | null {
  const platform = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'createam.cloud';
  return tenant.domain || (tenant.subdomain ? `${tenant.subdomain}.${platform}` : null);
}

/**
 * Asistente de alta: en cuatro pasos la tienda queda con rubro, estilo, marca y
 * WhatsApp, y se publica al terminar (sin esperar aprobación).
 */
function WelcomeWizard() {
  const [tenant, setTenant] = useState<TenantConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  const [rubro, setRubro] = useState<RubroId | undefined>();
  const [style, setStyle] = useState<StylePresetId>('moderno');
  const [name, setName] = useState('');
  const [primary, setPrimary] = useState('#2563eb');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [tiktok, setTiktok] = useState('');

  useEffect(() => {
    tenantApiFetch<{ tenant: TenantConfig }>('/api/tenant-admin/settings')
      .then(({ tenant: data }) => {
        setTenant(data);
        setName(data.name || '');
        setWhatsapp(data.whatsapp || '');
        setInstagram(data.socialMedia?.instagram || '');
        setFacebook(data.socialMedia?.facebook || '');
        setTiktok(data.socialMedia?.tiktok || '');
        if (data.storefront?.rubro) setRubro(data.storefront.rubro);
        if (data.storefront?.style) setStyle(data.storefront.style);
        if (data.colors?.primary) setPrimary(data.colors.primary);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  const pickRubro = (id: RubroId) => {
    setRubro(id);
    setStyle(RUBROS[id].suggestedStyle);
    setPrimary(RUBROS[id].palette.primary);
  };

  const pack = RUBROS[rubro ?? 'general'];
  const colors = { primary, secondary: pack.palette.secondary, accent: pack.palette.accent };
  const whatsappDigits = normalizeWhatsapp(whatsapp);

  const preview = useMemo<PreviewPayload | null>(() => {
    if (!tenant) return null;
    const catalog = sampleCatalog(rubro ?? 'general');
    const store: PublicStore = {
      id: tenant.id,
      name: name.trim() || tenant.name,
      logo: tenant.logo,
      colors: isHexColor(primary) ? colors : undefined,
      heroSlides: tenant.heroSlides ?? [],
      whatsapp: whatsappDigits,
      socialMedia: { instagram, facebook, tiktok },
      storefront: { rubro, style },
      plan: tenant.plan,
    };
    return { store, products: catalog.products, categories: catalog.categories };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant, name, primary, rubro, style, whatsappDigits, instagram, facebook, tiktok]);

  const canContinue = [
    Boolean(rubro),
    name.trim().length >= 2 && isHexColor(primary),
    Boolean(whatsappDigits),
    true,
  ][step];

  const publish = async () => {
    if (!tenant || !rubro || !whatsappDigits) return;
    setPublishing(true);
    try {
      await tenantApiFetch('/api/tenant-admin/settings', {
        method: 'PATCH',
        body: JSON.stringify({
          name: name.trim(),
          colors,
          primaryColor: primary,
          whatsapp: whatsappDigits,
          socialMedia: { instagram, facebook, tiktok },
          storefront: { ...(tenant.storefront ?? {}), rubro, style },
        }),
      });

      // Categorías sugeridas del rubro, solo si la tienda todavía no tiene ninguna.
      // Si su base de productos aún no está lista, se crean después desde Categorías.
      if (tenant.firebaseConfig?.projectId && pack.categories.length > 0) {
        try {
          const current = await tenantApiFetch<{ categories?: unknown[] }>('/api/tenant-admin/categories');
          if (!current.categories?.length) {
            for (const [order, category] of pack.categories.entries()) {
              await tenantApiFetch('/api/tenant-admin/categories', {
                method: 'POST',
                body: JSON.stringify({ label: category.label, icon: category.icon, order }),
              });
            }
          }
        } catch (err) {
          console.warn('[bienvenida] No se pudieron crear las categorías sugeridas:', err);
        }
      }

      setPublished(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo publicar tu tienda');
    } finally {
      setPublishing(false);
    }
  };

  if (error) {
    return <p className="m-10 bg-white rounded-2xl p-6 shadow text-gray-700">No pudimos cargar tu tienda: {error}</p>;
  }
  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  const domain = storeDomain(tenant);

  if (published) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] p-6 md:p-10 flex items-center justify-center">
        <div className="bg-white rounded-[2rem] p-8 md:p-12 max-w-xl w-full text-center shadow-sm border border-gray-100">
          <PartyPopper className="mx-auto mb-4 text-gray-900" size={40} />
          <h1 className="text-3xl font-black text-gray-900 mb-2">¡Tu tienda está publicada!</h1>
          {domain && (
            <a href={`https://${domain}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold text-gray-900 underline mb-6">
              {domain} <ExternalLink size={14} />
            </a>
          )}
          <p className="text-gray-500 mb-8">Ahora carga tus productos para que tus clientes puedan pedirte por WhatsApp.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/tenant-admin/products/new" className="rounded-xl bg-gray-900 px-6 py-3 font-bold text-white hover:bg-black">
              Agregar mi primer producto
            </Link>
            <Link href="/tenant-admin/diseno" className="rounded-xl bg-gray-100 px-6 py-3 font-bold text-gray-700 hover:bg-gray-200">
              Ajustar el diseño
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] pb-24 p-4 md:p-10">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Arma tu tienda en 4 pasos</h1>
          <ol className="mt-4 flex flex-wrap gap-2">
            {STEPS.map((label, i) => (
              <li
                key={label}
                className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold ${
                  i === step ? 'bg-gray-900 text-white' : i < step ? 'bg-emerald-100 text-emerald-800' : 'bg-white text-gray-400'
                }`}
              >
                {i < step ? <Check size={14} /> : <span>{i + 1}</span>} {label}
              </li>
            ))}
          </ol>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px] gap-6 items-start">
          <section className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100 space-y-6">
            {step === 0 && (
              <>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">¿Qué vende tu negocio?</h2>
                  <p className="text-sm text-gray-500 mt-1">Con esto preparamos tus categorías, tus textos y un estilo que le queda a tu rubro.</p>
                </div>
                <RubroPicker value={rubro} onChange={pickRubro} />
              </>
            )}

            {step === 1 && (
              <>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Tu marca</h2>
                  <p className="text-sm text-gray-500 mt-1">El nombre que verán tus clientes, tu color y tu estilo. Todo se puede cambiar después.</p>
                </div>
                <label className="block">
                  <span className="block text-sm font-bold text-gray-700 mb-1.5">Nombre de la tienda</span>
                  <input
                    type="text"
                    value={name}
                    maxLength={60}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl bg-gray-50 px-4 py-3 font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-gray-300"
                  />
                </label>
                <div>
                  <p className="text-sm font-bold text-gray-700 mb-2">Color principal</p>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {[pack.palette.primary, ...QUICK_COLORS.filter((c) => c !== pack.palette.primary)].map((c) => (
                      <button
                        key={c}
                        type="button"
                        aria-label={`Usar ${c}`}
                        onClick={() => setPrimary(c)}
                        className={`h-9 w-9 rounded-full border-2 ${primary.toLowerCase() === c ? 'border-gray-900 scale-110' : 'border-white shadow'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <ColorField label="O escribe tu color" value={primary} onChange={setPrimary} />
                  <div className="mt-3">
                    <ContrastNotes primary={primary} background="#ffffff" text="#111827" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-700 mb-2">Estilo</p>
                  <StylePicker value={style} suggested={pack.suggestedStyle} primary={isHexColor(primary) ? primary : '#111827'} onChange={setStyle} />
                </div>
                <p className="text-xs text-gray-400">Tu logo y los banners de portada los puedes subir luego en Ajustes.</p>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">¿Dónde te escriben tus clientes?</h2>
                  <p className="text-sm text-gray-500 mt-1">Los pedidos de tu tienda llegan a este WhatsApp.</p>
                </div>
                <label className="block">
                  <span className="block text-sm font-bold text-gray-700 mb-1.5">WhatsApp (obligatorio)</span>
                  <input
                    type="tel"
                    inputMode="tel"
                    value={whatsapp}
                    placeholder="987 654 321"
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full rounded-xl bg-gray-50 px-4 py-3 font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-gray-300"
                  />
                  <span className={`mt-1 block text-xs ${whatsapp && !whatsappDigits ? 'text-red-600' : 'text-gray-400'}`}>
                    {whatsapp && !whatsappDigits
                      ? 'Ese número no parece válido. Escribe tu celular de 9 dígitos o el número con código de país.'
                      : whatsappDigits
                        ? `Los pedidos llegarán a +${whatsappDigits}`
                        : 'Tu celular de 9 dígitos; agregamos el 51 de Perú.'}
                  </span>
                </label>
                {([
                  ['Instagram', instagram, setInstagram, '@tutienda'],
                  ['Facebook', facebook, setFacebook, 'facebook.com/tutienda'],
                  ['TikTok', tiktok, setTiktok, '@tutienda'],
                ] as const).map(([label, value, setter, placeholder]) => (
                  <label key={label} className="block">
                    <span className="block text-sm font-bold text-gray-700 mb-1.5">{label} (opcional)</span>
                    <input
                      type="text"
                      value={value}
                      placeholder={placeholder}
                      onChange={(e) => setter(e.target.value)}
                      className="w-full rounded-xl bg-gray-50 px-4 py-3 font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-gray-300"
                    />
                  </label>
                ))}
              </>
            )}

            {step === 3 && (
              <>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Todo listo</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Revisa la vista previa. Al publicar, tu tienda queda en línea{domain ? ` en ${domain}` : ''} y puedes empezar a cargar tus productos.
                  </p>
                </div>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li><strong>Rubro:</strong> {pack.label}</li>
                  <li><strong>Nombre:</strong> {name.trim()}</li>
                  <li><strong>WhatsApp:</strong> +{whatsappDigits}</li>
                  {pack.categories.length > 0 && <li><strong>Categorías sugeridas:</strong> {pack.categories.map((c) => c.label).join(', ')}</li>}
                </ul>
              </>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-3 font-bold text-gray-600 hover:bg-gray-100 disabled:invisible"
              >
                <ArrowLeft size={18} /> Atrás
              </button>
              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!canContinue}
                  className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-3 font-bold text-white hover:bg-black disabled:opacity-40"
                >
                  Continuar <ArrowRight size={18} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={publish}
                  disabled={publishing}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {publishing ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />} Publicar mi tienda
                </button>
              )}
            </div>
          </section>

          <aside className="lg:sticky lg:top-6 bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100">
            <StorefrontPreviewFrame payload={preview} />
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <ProtectedRoute>
      <WelcomeWizard />
    </ProtectedRoute>
  );
}
