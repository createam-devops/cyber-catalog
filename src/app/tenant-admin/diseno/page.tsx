"use client";

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Loader2, RotateCcw, Save } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import StorefrontPreviewFrame from '@/components/tenant-admin/design/StorefrontPreviewFrame';
import { ColorField, ContrastNotes, RubroPicker, StylePicker } from '@/components/tenant-admin/design/pickers';
import { tenantApiFetch } from '@/lib/tenant-api';
import { getPlan } from '@/lib/plans';
import type { TenantConfig } from '@/lib/types';
import type { StoreCatalog, StoreProduct } from '@/lib/storefront/catalog';
import { CONTENT_FIELDS, CONTENT_KEYS, type StorefrontContent } from '@/lib/storefront/content';
import { FONT_IDS, FONT_LABELS, type FontId } from '@/lib/storefront/font-ids';
import { STYLE_PRESETS, type CardStyle, type FooterStyle } from '@/lib/storefront/presets';
import { normalizeWhatsapp, type PublicStore, type StoreCategory } from '@/lib/storefront/public-store';
import { sampleCatalog, type PreviewPayload } from '@/lib/storefront/preview';
import { RUBROS } from '@/lib/storefront/rubros';
import { resolveStorefront, type HeroMode, type StorefrontSettings } from '@/lib/storefront/theme';
import { isHexColor } from '@/lib/storefront/color';

type BrandColors = { primary: string; secondary: string; accent: string };

function Card({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <div>
      <p className="text-sm font-bold text-gray-700 mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={String(option.value)}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
              value === option.value ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Quita claves vacías para guardar solo lo que la tienda cambió. */
function compactSettings(settings: StorefrontSettings): StorefrontSettings {
  const clean = <T extends object>(obj: T | undefined): T | undefined => {
    if (!obj) return undefined;
    const entries = Object.entries(obj).filter(([, v]) => v !== undefined);
    return entries.length ? (Object.fromEntries(entries) as T) : undefined;
  };
  const result: StorefrontSettings = {
    rubro: settings.rubro,
    style: settings.style,
    colors: clean(settings.colors),
    fonts: clean(settings.fonts),
    layout: clean(settings.layout),
    content: clean(settings.content),
  };
  return clean(result) ?? {};
}

function storeDomain(tenant: TenantConfig): string | null {
  const platform = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'createam.cloud';
  return tenant.domain || (tenant.subdomain ? `${tenant.subdomain}.${platform}` : null);
}

function DesignContent() {
  const [tenant, setTenant] = useState<TenantConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [colors, setColors] = useState<BrandColors>({ primary: '#2563eb', secondary: '#eff6ff', accent: '#f59e0b' });
  const [draft, setDraft] = useState<StorefrontSettings>({});
  const [realCatalog, setRealCatalog] = useState<StoreCatalog | null>(null);

  useEffect(() => {
    tenantApiFetch<{ tenant: TenantConfig }>('/api/tenant-admin/settings')
      .then(({ tenant: data }) => {
        setTenant(data);
        const current = resolveStorefront(data);
        setColors({ primary: current.colors.primary, secondary: current.colors.secondary, accent: current.colors.accent });
        setDraft(data.storefront ?? {});

        const domain = storeDomain(data);
        if (!domain) return;
        fetch(`/api/storefront/products?limit=12&_domain=${encodeURIComponent(domain)}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((page: { items: StoreProduct[]; categories?: StoreCategory[] } | null) => {
            if (page?.items?.length) setRealCatalog({ products: page.items, categories: page.categories ?? [] });
          })
          .catch(() => {});
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  const rubroId = draft.rubro ?? 'general';
  const rubro = RUBROS[rubroId];
  const theme = useMemo(() => resolveStorefront({ colors, storefront: draft }), [colors, draft]);
  const planFeatures = getPlan(tenant?.plan ?? 'starter').features;

  const previewPayload = useMemo<PreviewPayload | null>(() => {
    if (!tenant) return null;
    const catalog = realCatalog ?? sampleCatalog(rubroId);
    const store: PublicStore = {
      id: tenant.id,
      name: tenant.name,
      logo: tenant.logo,
      colors: Object.values(colors).every(isHexColor) ? colors : undefined,
      heroSlides: tenant.heroSlides ?? [],
      whatsapp: normalizeWhatsapp(tenant.whatsapp),
      socialMedia: tenant.socialMedia,
      storefront: draft,
      plan: tenant.plan,
    };
    return { store, products: catalog.products, categories: catalog.categories };
  }, [tenant, colors, draft, realCatalog, rubroId]);

  const setLayout = (patch: NonNullable<StorefrontSettings['layout']>) => setDraft((d) => ({ ...d, layout: { ...d.layout, ...patch } }));
  const setFonts = (patch: NonNullable<StorefrontSettings['fonts']>) => setDraft((d) => ({ ...d, fonts: { ...d.fonts, ...patch } }));
  const setPageColors = (patch: NonNullable<StorefrontSettings['colors']>) => setDraft((d) => ({ ...d, colors: { ...d.colors, ...patch } }));
  const setContent = (key: keyof StorefrontContent, value: string | undefined) =>
    setDraft((d) => {
      const content = { ...d.content };
      if (value === undefined) delete content[key];
      else content[key] = value;
      return { ...d, content };
    });

  const save = async () => {
    const pageColors = [draft.colors?.background, draft.colors?.text].filter(Boolean);
    if (![...Object.values(colors), ...pageColors].every((c) => isHexColor(c))) {
      toast.error('Revisa los colores: alguno no es un código válido (por ejemplo #1D4ED8).');
      return;
    }
    setSaving(true);
    try {
      await tenantApiFetch('/api/tenant-admin/settings', {
        method: 'PATCH',
        body: JSON.stringify({ colors, primaryColor: colors.primary, storefront: compactSettings(draft) }),
      });
      toast.success('Diseño guardado. Ya se ve en tu tienda.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo guardar el diseño');
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <p className="bg-white rounded-2xl p-6 shadow text-gray-700">No pudimos cargar tu tienda: {error}</p>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  const domain = storeDomain(tenant);

  return (
    <div className="min-h-screen bg-[#F1F5F9] pb-24 p-4 md:p-10">
      <div className="max-w-7xl mx-auto">
        <header className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Diseño de tu tienda</h1>
            <p className="text-gray-500 text-sm mt-1">
              Elige tu rubro y tu estilo, y ajusta colores y textos. {domain && (
                <a href={`https://${domain}`} target="_blank" rel="noopener noreferrer" className="font-bold text-gray-900 underline">
                  Ver tienda
                </a>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-6 py-3 font-bold text-white hover:bg-black disabled:opacity-60"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Guardar diseño
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_440px] gap-6 items-start">
          <div className="space-y-6 min-w-0">
            <Card title="Rubro" description="Define las categorías sugeridas y los textos de tu tienda. Los textos que cambies tú se mantienen.">
              <RubroPicker value={draft.rubro} onChange={(id) => setDraft((d) => ({ ...d, rubro: id }))} />
            </Card>

            <Card title="Estilo" description="La forma de tu tienda: tipografías, curvas y mayúsculas.">
              <StylePicker
                value={theme.style}
                suggested={rubro.suggestedStyle}
                primary={theme.colors.primary}
                onChange={(style) => setDraft((d) => ({ ...d, style, fonts: undefined }))}
              />
            </Card>

            <Card title="Colores" description="Colores planos de tu marca y de la página.">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <ColorField label="Principal" hint="Botones y destacados" value={colors.primary} onChange={(primary) => setColors((c) => ({ ...c, primary }))} />
                <ColorField label="Secundario" hint="Fondos suaves" value={colors.secondary} onChange={(secondary) => setColors((c) => ({ ...c, secondary }))} />
                <ColorField label="Acento" hint="Detalles" value={colors.accent} onChange={(accent) => setColors((c) => ({ ...c, accent }))} />
                <ColorField label="Fondo de la página" value={draft.colors?.background ?? theme.colors.background} onChange={(background) => setPageColors({ background })} />
                <ColorField label="Texto" value={draft.colors?.text ?? theme.colors.text} onChange={(text) => setPageColors({ text })} />
              </div>
              <ContrastNotes primary={colors.primary} background={theme.colors.background} text={theme.colors.text} />
              <button
                type="button"
                onClick={() => {
                  setColors({ ...rubro.palette });
                  setDraft((d) => ({ ...d, colors: undefined }));
                }}
                className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-gray-900"
              >
                <span className="flex">
                  {[rubro.palette.primary, rubro.palette.secondary, rubro.palette.accent].map((c) => (
                    <span key={c} className="h-4 w-4 rounded-full border border-white -ml-1 first:ml-0" style={{ backgroundColor: c }} />
                  ))}
                </span>
                Usar la paleta sugerida para {rubro.label.toLowerCase()}
              </button>
            </Card>

            <Card title="Tipografías" description={`Por defecto, las del estilo ${STYLE_PRESETS[theme.style].label}.`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(['heading', 'body'] as const).map((slot) => (
                  <label key={slot} className="block">
                    <span className="block text-sm font-bold text-gray-700 mb-1.5">{slot === 'heading' ? 'Títulos' : 'Textos'}</span>
                    <select
                      value={draft.fonts?.[slot] ?? ''}
                      onChange={(e) => setFonts({ [slot]: (e.target.value || undefined) as FontId | undefined })}
                      className="w-full rounded-xl bg-gray-50 px-4 py-3 font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-gray-300"
                    >
                      <option value="">Del estilo ({FONT_LABELS[STYLE_PRESETS[theme.style].fonts[slot]]})</option>
                      {FONT_IDS.map((id) => (
                        <option key={id} value={id}>
                          {FONT_LABELS[id]}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
            </Card>

            <Card title="Diseño de la página">
              <Segmented<HeroMode>
                label="Portada"
                value={theme.layout.hero}
                onChange={(hero) => setLayout({ hero })}
                options={[
                  { value: 'carousel', label: 'Carrusel de banners' },
                  { value: 'banner', label: 'Un banner fijo' },
                  { value: 'none', label: 'Sin portada' },
                ]}
              />
              <p className="text-xs text-gray-400 -mt-3">
                Las fotos de los banners se suben en <Link href="/tenant-admin/settings" className="underline">Ajustes</Link>. Sin banners, la portada usa el color de tu marca.
              </p>
              <Segmented<3 | 4>
                label="Productos por fila en computadora"
                value={theme.layout.gridColumns}
                onChange={(gridColumns) => setLayout({ gridColumns })}
                options={[
                  { value: 3, label: '3' },
                  { value: 4, label: '4' },
                ]}
              />
              <Segmented<CardStyle>
                label="Tarjetas de producto"
                value={theme.layout.cardStyle}
                onChange={(cardStyle) => setLayout({ cardStyle })}
                options={[
                  { value: 'soft', label: 'Suaves' },
                  { value: 'flat', label: 'Planas' },
                  { value: 'outlined', label: 'Con borde' },
                ]}
              />
              <Segmented<FooterStyle>
                label="Pie de página"
                value={theme.layout.footer}
                onChange={(footer) => setLayout({ footer })}
                options={[
                  { value: 'dark', label: 'Oscuro' },
                  { value: 'light', label: 'Claro' },
                  { value: 'brand', label: 'Color de tu marca' },
                ]}
              />
              <label className={`flex items-center gap-3 ${planFeatures.stock ? '' : 'opacity-60'}`}>
                <input
                  type="checkbox"
                  checked={theme.layout.showStock}
                  disabled={!planFeatures.stock}
                  onChange={(e) => setLayout({ showStock: e.target.checked })}
                  className="h-5 w-5 accent-gray-900"
                />
                <span className="text-sm font-bold text-gray-700">
                  Mostrar stock y “Agotado” en los productos
                  {!planFeatures.stock && <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Pro</span>}
                </span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={theme.layout.showNameWithLogo}
                  onChange={(e) => setLayout({ showNameWithLogo: e.target.checked })}
                  className="h-5 w-5 accent-gray-900"
                />
                <span className="text-sm font-bold text-gray-700">
                  Mostrar el nombre junto al logo
                  <span className="block text-xs font-normal text-gray-500">Úsalo si tu logo es solo un ícono, sin el nombre escrito.</span>
                </span>
              </label>
            </Card>

            <Card title="Textos" description={`Vienen del rubro ${rubro.label.toLowerCase()}. Cambia los que quieras; los vacíos que digan "vacío lo oculta" desaparecen de la tienda.`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {CONTENT_KEYS.map((key) => {
                  const field = CONTENT_FIELDS[key];
                  const override = draft.content?.[key];
                  const value = override ?? rubro.content[key];
                  return (
                    <label key={key} className="block">
                      <span className="flex items-center justify-between text-sm font-bold text-gray-700 mb-1.5">
                        {field.label}
                        {override !== undefined && (
                          <button
                            type="button"
                            onClick={() => setContent(key, undefined)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-gray-700"
                          >
                            <RotateCcw size={12} /> Restablecer
                          </button>
                        )}
                      </span>
                      <input
                        type="text"
                        value={value}
                        maxLength={field.max}
                        placeholder={rubro.content[key] || '(oculto)'}
                        onChange={(e) => setContent(key, e.target.value)}
                        className="w-full rounded-xl bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-gray-300"
                      />
                      {field.hint && <span className="mt-1 block text-xs text-gray-400">{field.hint}</span>}
                    </label>
                  );
                })}
              </div>
            </Card>
          </div>

          <aside className="lg:sticky lg:top-6 bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100">
            <StorefrontPreviewFrame payload={previewPayload} />
            {!realCatalog && (
              <p className="mt-3 text-xs text-gray-500 text-center">
                Mostramos productos de muestra hasta que cargues los tuyos.
              </p>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function DesignPage() {
  return (
    <ProtectedRoute>
      <DesignContent />
    </ProtectedRoute>
  );
}
