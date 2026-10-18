import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { Check, Copy, ExternalLink, Eye, MessageCircle, Package, Share2 } from 'lucide-react';
import { normalizeWhatsapp } from '@shared/storefront/public-store';
import { RUBROS } from '@shared/storefront/rubros';
import { useHost, type Api } from '../host';
import type { Draft, StatsResponse, StoreResponse } from '../store';
import type { Section } from '../App';
import { Button, Pill } from '../ui';

interface Props {
  data: StoreResponse;
  draft: Draft;
  setDraft: Dispatch<SetStateAction<Draft | null>>;
  canManage: boolean;
  api: Api;
  goTo: (section: Section) => void;
}

const formatNumber = (n: number | null) => (n === null ? '—' : new Intl.NumberFormat('es-PE').format(n));

export default function Inicio({ data, draft, api, goTo }: Props) {
  const host = useHost();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api<StatsResponse>('/stats').then(setStats).catch(() => setStats({ products: null, views: 0, whatsappClicks: 0 }));
  }, [api]);

  const url = data.storeUrl;
  const live = data.store.status === 'active' || data.store.status === 'trial';
  const toSalesOnline = () => host.navigate('/app/admin/venta-online');

  const copy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sin permiso de portapapeles: el enlace igual está a la vista.
    }
  };

  const steps = [
    { done: Boolean(draft.storefront.rubro), title: 'Elige tu rubro y tu estilo', detail: draft.storefront.rubro ? RUBROS[draft.storefront.rubro].label : 'Define los textos y la forma de tu tienda', action: () => goTo('diseno') },
    { done: Boolean(normalizeWhatsapp(draft.whatsapp)), title: 'Agrega tu WhatsApp', detail: 'Ahí te llegan los pedidos', action: () => goTo('ajustes') },
    { done: Boolean(draft.logo || draft.heroSlides.length), title: 'Sube tu logo o una portada', detail: 'Tu marca en la parte de arriba', action: () => goTo('ajustes') },
    { done: (stats?.products ?? 0) > 0, title: 'Publica tus productos', detail: 'En Venta online eliges qué se ve en la tienda', action: toSalesOnline },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <div className="space-y-3">
      {/* La tienda y su dirección */}
      <section className="cs-card space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-cm-display font-bold leading-tight text-cm-ink">{draft.name || data.store.name}</h2>
          <Pill tone={live ? 'ok' : 'warn'}>{live ? 'En línea' : 'En pausa'}</Pill>
        </div>
        {url && (
          <>
            <a href={url} target="_blank" rel="noopener noreferrer" className="block break-all text-cm-body font-semibold text-cm-primary-deep hover:underline">
              {url.replace(/^https:\/\//, '')}
            </a>
            <div className="flex flex-wrap gap-2">
              <Button icon={copied ? <Check size={16} /> : <Copy size={16} />} onClick={() => void copy()}>
                {copied ? 'Copiado' : 'Copiar enlace'}
              </Button>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center gap-2 rounded-cm-md border border-cm-line bg-cm-field px-4 text-cm-body font-semibold text-cm-ink hover:border-cm-primary-line"
              >
                <ExternalLink size={16} /> Abrir tienda
              </a>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Mira mi tienda: ${url}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center gap-2 rounded-cm-md border border-cm-line bg-cm-field px-4 text-cm-body font-semibold text-cm-ink hover:border-cm-primary-line"
              >
                <Share2 size={16} /> Compartir
              </a>
            </div>
          </>
        )}
      </section>

      {/* Números */}
      <div className="grid grid-cols-1 gap-3 @md:grid-cols-3">
        {[
          { icon: <Package size={18} />, label: 'Productos publicados', value: stats ? formatNumber(stats.products) : '…', action: { text: 'Administrar', run: toSalesOnline } },
          { icon: <Eye size={18} />, label: 'Visitas a productos', value: stats ? formatNumber(stats.views) : '…' },
          { icon: <MessageCircle size={18} />, label: 'Pedidos por WhatsApp', value: stats ? formatNumber(stats.whatsappClicks) : '…' },
        ].map((tile) => (
          <div key={tile.label} className="cs-card flex items-center gap-3 @md:block">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-cm-md bg-cm-primary-bg text-cm-primary-deep">{tile.icon}</span>
            <div className="min-w-0 flex-1 @md:mt-2">
              <p className="text-cm-display font-bold leading-none text-cm-ink">{tile.value}</p>
              <p className="mt-1 text-cm-label text-cm-muted">{tile.label}</p>
            </div>
            {tile.action && (
              <button type="button" onClick={tile.action.run} className="text-cm-label font-semibold text-cm-primary-deep hover:underline @md:mt-2">
                {tile.action.text}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Lo que falta */}
      <section className="cs-card space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-cm-title font-bold text-cm-ink">Deja lista tu tienda</h2>
          <span className="text-cm-label font-semibold text-cm-muted">
            {doneCount} de {steps.length}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-cm-primary-bg">
          <div className="h-full rounded-full bg-cm-primary transition-all" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
        </div>
        <ul className="divide-y divide-cm-line">
          {steps.map((step) => (
            <li key={step.title}>
              <button type="button" onClick={step.action} className="flex min-h-14 w-full items-center gap-3 py-2 text-left">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                    step.done ? 'border-cm-primary bg-cm-primary text-white' : 'border-cm-line text-transparent'
                  }`}
                >
                  <Check size={14} strokeWidth={3} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-cm-body font-semibold ${step.done ? 'text-cm-muted line-through' : 'text-cm-ink'}`}>{step.title}</span>
                  <span className="block text-cm-caption text-cm-muted">{step.detail}</span>
                </span>
                {!step.done && <span className="text-cm-label font-semibold text-cm-primary-deep">Hacerlo</span>}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
