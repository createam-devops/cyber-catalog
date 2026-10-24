import { useCallback, useEffect, useState } from 'react';
import { Check, Copy, Star, X } from 'lucide-react';
import type { Api } from '../host';
import { Button, Collapsible, Field, Pill } from '../ui';

interface Review {
  id: number;
  productId: string;
  productName: string;
  rating: number;
  name: string;
  text: string;
  createdAt: string;
}

interface ReviewsResponse {
  pending: Review[];
  approved: Review[];
  products: Array<{ id: string; name: string; path: string }>;
}

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });

const StarsRow = ({ value }: { value: number }) => (
  <span className="inline-flex items-center gap-0.5" aria-label={`${value} de 5 estrellas`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Star key={n} size={14} strokeWidth={1.75} className={n <= value ? 'fill-amber-400 text-amber-400' : 'text-cm-faint'} aria-hidden="true" />
    ))}
  </span>
);

function ReviewItem({ review, actions }: { review: Review; actions?: React.ReactNode }) {
  return (
    <li className="space-y-1 py-3">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <StarsRow value={review.rating} />
        <span className="text-cm-body font-semibold text-cm-ink">{review.name}</span>
        <span className="text-cm-caption text-cm-muted">
          sobre {review.productName} · {formatDate(review.createdAt)}
        </span>
      </div>
      <p className="whitespace-pre-line text-cm-body text-cm-ink-soft">{review.text}</p>
      {actions}
    </li>
  );
}

/**
 * Opiniones de clientes en Inicio: las que esperan revisión (publicar o
 * rechazar), las publicadas y un mensaje listo para pedirle una opinión a un
 * cliente por WhatsApp.
 */
export default function Opiniones({ api, canManage, storeUrl }: { api: Api; canManage: boolean; storeUrl: string | null }) {
  const [data, setData] = useState<ReviewsResponse | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);
  const [productId, setProductId] = useState('');
  const [copied, setCopied] = useState(false);

  const load = useCallback(() => {
    api<ReviewsResponse>('/reviews')
      .then((res) => {
        setData(res);
        setFailed(false);
      })
      .catch(() => setFailed(true));
  }, [api]);
  useEffect(load, [load]);

  const decide = async (id: number, status: 'approved' | 'rejected') => {
    setBusy(id);
    try {
      await api('/reviews', { method: 'PATCH', body: { id, status } });
      load();
    } finally {
      setBusy(null);
    }
  };

  const product = data?.products.find((p) => p.id === productId) ?? data?.products[0];
  const message =
    product && storeUrl
      ? `¡Gracias por tu compra! ¿Nos cuentas qué te pareció ${product.name}? Déjanos tu opinión aquí: ${storeUrl}${product.path}#opiniones`
      : '';
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sin permiso para copiar: el mensaje queda a la vista para copiarlo a mano.
    }
  };

  if (failed) return null;

  return (
    <section className="cs-card space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-cm-title font-bold text-cm-ink">Opiniones de clientes</h2>
        {data && data.pending.length > 0 && <Pill tone="warn">{data.pending.length} por revisar</Pill>}
      </div>
      <p className="cs-hint !mt-0">
        Publica todas las opiniones reales, también las críticas: así tus estrellas valen en Google. Rechaza solo spam u ofensas.
      </p>

      {!data ? (
        <p className="text-cm-label text-cm-muted">Cargando…</p>
      ) : data.pending.length === 0 ? (
        <p className="text-cm-label text-cm-muted">No hay opiniones por revisar.</p>
      ) : (
        <ul className="divide-y divide-cm-line">
          {data.pending.map((review) => (
            <ReviewItem
              key={review.id}
              review={review}
              actions={
                canManage && (
                  <div className="flex gap-2 pt-1">
                    <Button variant="primary" icon={<Check size={16} />} loading={busy === review.id} onClick={() => decide(review.id, 'approved')}>
                      Publicar
                    </Button>
                    <Button variant="ghost" icon={<X size={16} />} disabled={busy === review.id} onClick={() => decide(review.id, 'rejected')}>
                      Rechazar
                    </Button>
                  </div>
                )
              }
            />
          ))}
        </ul>
      )}

      {data && data.approved.length > 0 && (
        <Collapsible title={`Publicadas (${data.approved.length})`} description="Las últimas que se ven en tu tienda">
          <ul className="divide-y divide-cm-line">
            {data.approved.map((review) => (
              <ReviewItem
                key={review.id}
                review={review}
                actions={
                  canManage && (
                    <Button variant="ghost" icon={<X size={16} />} loading={busy === review.id} onClick={() => decide(review.id, 'rejected')}>
                      Quitar de la tienda
                    </Button>
                  )
                }
              />
            ))}
          </ul>
        </Collapsible>
      )}

      {data && data.products.length > 0 && storeUrl && (
        <Collapsible title="Pedir una opinión" description="Un mensaje listo para mandarle a tu cliente por WhatsApp después de la venta">
          <div className="space-y-3">
            <Field label="Producto que compró">
              {(id) => (
                <select id={id} className="cs-input" value={product?.id ?? ''} onChange={(e) => setProductId(e.target.value)}>
                  {data.products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <p className="rounded-cm-sm border border-cm-line bg-cm-field p-3 text-cm-body text-cm-ink-soft">{message}</p>
            <Button icon={copied ? <Check size={16} /> : <Copy size={16} />} onClick={copy}>
              {copied ? 'Copiado' : 'Copiar mensaje'}
            </Button>
          </div>
        </Collapsible>
      )}
    </section>
  );
}
