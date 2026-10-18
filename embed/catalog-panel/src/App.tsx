import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, RotateCcw } from 'lucide-react';
import { resolveStorefront } from '@shared/storefront/theme';
import { normalizeWhatsapp, type PublicStore } from '@shared/storefront/public-store';
import { sampleCatalog, type PreviewPayload } from '@shared/storefront/preview';
import { ApiError, createApi, HostProvider, type PanelHost } from './host';
import { diffDraft, toDraft, type Draft, type PreviewCatalog, type StoreResponse } from './store';
import { Button } from './ui';
import Inicio from './sections/Inicio';
import Diseno from './sections/Diseno';
import Ajustes from './sections/Ajustes';
import Bienvenida from './sections/Bienvenida';

export type Section = 'inicio' | 'diseno' | 'ajustes' | 'bienvenida';

const SECTION_PATHS: Record<Section, string> = { inicio: '/', diseno: '/diseno', ajustes: '/ajustes', bienvenida: '/bienvenida' };

function sectionOf(path: string): Section {
  const clean = path.split('?')[0].replace(/\/+$/, '') || '/';
  if (clean === '/diseno') return 'diseno';
  if (clean === '/ajustes') return 'ajustes';
  if (clean === '/bienvenida') return 'bienvenida';
  return 'inicio';
}

type Toast = { tone: 'ok' | 'error'; text: string } | null;

export default function App({ host, path }: { host: PanelHost; path: string }) {
  const api = useMemo(() => createApi(host), [host]);
  const section = sectionOf(path);
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');
  const [data, setData] = useState<StoreResponse | null>(null);
  const [loadError, setLoadError] = useState('');
  const [original, setOriginal] = useState<Draft | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [catalog, setCatalog] = useState<PreviewCatalog | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  const go = useCallback((to: Section, replace = false) => host.navigate(SECTION_PATHS[to], { replace }), [host]);

  const load = useCallback(async () => {
    setState('loading');
    try {
      const res = await api<StoreResponse>('/store');
      const theme = resolveStorefront({ colors: res.store.colors, primaryColor: res.store.primaryColor, storefront: res.store.storefront });
      const next = toDraft(res.store, { primary: theme.colors.primary, secondary: theme.colors.secondary, accent: theme.colors.accent }, res.platformDomain);
      setData(res);
      setOriginal(next);
      setDraft(next);
      setState('ready');
      api<PreviewCatalog>('/store/preview').then(setCatalog).catch(() => setCatalog({ products: [], categories: [] }));
    } catch (error) {
      if (error instanceof ApiError && error.code === 'STORE_NOT_CREATED') {
        setState('missing');
        return;
      }
      setLoadError(error instanceof Error ? error.message : 'No se pudo cargar tu tienda.');
      setState('error');
    }
  }, [api]);

  useEffect(() => {
    void load();
  }, [load]);

  // Sin tienda, siempre a Bienvenida; con tienda, Bienvenida ya no aplica.
  useEffect(() => {
    if (state === 'missing' && section !== 'bienvenida') go('bienvenida', true);
    if (state === 'ready' && section === 'bienvenida') go('inicio', true);
  }, [state, section, go]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const dirty = Boolean(original && draft && JSON.stringify(original) !== JSON.stringify(draft));

  const save = async () => {
    if (!original || !draft) return;
    const patch = diffDraft(original, draft);
    if (Object.keys(patch).length === 0) return;
    if (typeof patch.whatsapp === 'string' && patch.whatsapp && !normalizeWhatsapp(patch.whatsapp)) {
      setToast({ tone: 'error', text: 'El número de WhatsApp no es válido. Escribe tu celular de 9 dígitos.' });
      return;
    }
    setSaving(true);
    try {
      await api('/store', { method: 'PATCH', body: patch });
      setOriginal(draft);
      setToast({ tone: 'ok', text: 'Cambios guardados. Ya se ven en tu tienda.' });
    } catch (error) {
      setToast({ tone: 'error', text: error instanceof Error ? error.message : 'No se pudo guardar.' });
    } finally {
      setSaving(false);
    }
  };

  // Lo que dibuja la vista previa: el borrador, con los productos reales o los de muestra del rubro.
  const preview = useMemo<PreviewPayload | null>(() => {
    if (!data || !draft) return null;
    const products = catalog?.products?.length ? catalog : sampleCatalog(draft.storefront.rubro ?? 'general');
    const store: PublicStore = {
      id: data.store.id,
      name: draft.name || data.store.name,
      logo: draft.logo || undefined,
      colors: draft.colors,
      primaryColor: draft.colors.primary,
      heroSlides: draft.heroSlides,
      whatsapp: normalizeWhatsapp(draft.whatsapp),
      socialMedia: draft.socialMedia,
      storefront: draft.storefront,
    };
    return { store, products: products.products, categories: products.categories };
  }, [data, draft, catalog]);

  let content: JSX.Element;
  if (state === 'loading') {
    content = (
      <div className="flex min-h-[40vh] items-center justify-center text-cm-muted">
        <Loader2 className="animate-spin" size={28} aria-label="Cargando" />
      </div>
    );
  } else if (state === 'error') {
    content = (
      <div className="cs-card mx-auto max-w-md space-y-3 text-center">
        <AlertCircle className="mx-auto text-cm-danger" size={28} />
        <p className="font-semibold">{loadError}</p>
        <Button icon={<RotateCcw size={16} />} onClick={() => void load()}>
          Reintentar
        </Button>
      </div>
    );
  } else if (state === 'missing') {
    content = <Bienvenida api={api} onCreated={() => void load()} />;
  } else if (data && draft) {
    const props = { data, draft, setDraft, canManage: data.canManage };
    content = (
      <>
        <nav role="tablist" aria-label="Secciones de la tienda" className="flex gap-1 overflow-x-auto rounded-cm-md border border-cm-line bg-cm-field p-1">
          {(['inicio', 'diseno', 'ajustes'] as const).map((s) => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={section === s}
              onClick={() => go(s)}
              className={`min-h-9 flex-1 whitespace-nowrap rounded-cm-sm px-3 text-cm-body font-semibold transition ${
                section === s ? 'bg-cm-primary text-white' : 'text-cm-ink-soft hover:bg-cm-primary-bg'
              }`}
            >
              {s === 'inicio' ? 'Inicio' : s === 'diseno' ? 'Diseño' : 'Ajustes'}
            </button>
          ))}
        </nav>
        {!data.canManage && (
          <p className="rounded-cm-md bg-cm-info-bg px-3 py-2 text-cm-label font-medium text-cm-info">
            Puedes ver la tienda, pero tu usuario no puede cambiarla.
          </p>
        )}
        {section === 'inicio' && <Inicio {...props} api={api} goTo={go} />}
        {section === 'diseno' && preview && <Diseno {...props} preview={preview} previewUrl={data.previewUrl} />}
        {section === 'ajustes' && preview && <Ajustes {...props} api={api} preview={preview} previewUrl={data.previewUrl} />}
      </>
    );
  } else {
    content = <></>;
  }

  return (
    <HostProvider value={host}>
      <div className="mx-auto max-w-6xl space-y-3 p-3 pb-6 @lg:p-4">
        {content}

        {dirty && (
          <div className="sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-2 rounded-cm-lg border border-cm-primary-line bg-white/95 p-3 shadow-lg">
            <span className="text-cm-body font-semibold text-cm-ink">Tienes cambios sin guardar</span>
            <span className="flex gap-2">
              <Button variant="ghost" onClick={() => original && setDraft(original)} disabled={saving}>
                Descartar
              </Button>
              <Button variant="primary" loading={saving} onClick={() => void save()}>
                Guardar cambios
              </Button>
            </span>
          </div>
        )}
      </div>

      {toast && (
        <div role="status" className="fixed bottom-5 left-1/2 z-[1200] w-[min(92vw,26rem)] -translate-x-1/2">
          <p
            className={`flex items-center gap-2 rounded-cm-md px-4 py-3 text-cm-body font-semibold shadow-lg ${
              toast.tone === 'ok' ? 'bg-cm-ink text-white' : 'bg-cm-danger text-white'
            }`}
          >
            {toast.tone === 'ok' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {toast.text}
          </p>
        </div>
      )}
    </HostProvider>
  );
}
