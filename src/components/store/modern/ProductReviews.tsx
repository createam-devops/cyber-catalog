"use client";

import { useState } from 'react';
import { Star } from 'lucide-react';
import { useStorefront } from '../StorefrontRoot';
import Stars from './Stars';
import { formatRating, type PublicReview } from '@/lib/storefront/reviews';
import type { StoreProduct } from '@/lib/storefront/catalog';

const MONTHS = ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'sep.', 'oct.', 'nov.', 'dic.'];
/** «24 oct. 2026» (a mano, igual en el servidor y en el navegador). */
const formatDate = (date: string) => {
  const [y, m, d] = date.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};

/**
 * Opiniones de un producto: el promedio, las aprobadas por la tienda y el
 * formulario para dejar una. Lo que se envía queda pendiente hasta que la
 * tienda lo revisa en su editor.
 */
export default function ProductReviews({ product, reviews }: { product: StoreProduct; reviews: PublicReview[] }) {
  const { preview } = useStorefront();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const summary = product.rating;

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (preview) return;
    const form = new FormData(event.currentTarget);
    if (!rating) {
      setState('error');
      setMessage('Elige de 1 a 5 estrellas.');
      return;
    }
    setState('sending');
    const res = await fetch('/api/storefront/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: product.id, rating, name: form.get('name'), text: form.get('text'), website: form.get('website') || undefined }),
    }).catch(() => null);
    if (res?.ok) {
      setState('sent');
      return;
    }
    const data = (await res?.json().catch(() => null)) as { error?: string } | null;
    setState('error');
    setMessage(data?.error || 'No pudimos enviar tu opinión. Inténtalo de nuevo.');
  };

  return (
    <section id="opiniones" aria-labelledby="opiniones-title" className="mb-14 scroll-mt-32 md:scroll-mt-24">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="opiniones-title" className="text-2xl md:text-3xl">
            Opiniones de clientes
          </h2>
          {summary && summary.count > 0 ? (
            <p className="mt-2 flex items-center gap-2 text-sm">
              <Stars value={summary.average} size={18} />
              <span className="font-bold">{formatRating(summary.average)} de 5</span>
              <span className="text-sf-muted">
                · {summary.count} {summary.count === 1 ? 'opinión' : 'opiniones'}
              </span>
            </p>
          ) : (
            <p className="mt-2 text-sm text-sf-muted">Todavía no hay opiniones. ¿Lo compraste? Cuéntanos qué te pareció.</p>
          )}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <ul className="space-y-4">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-sf-card border border-sf-border bg-sf-bg p-5">
              <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                <Stars value={review.rating} />
                <span className="sr-only">{review.rating} de 5 estrellas</span>
                <span className="font-bold">{review.name}</span>
                <span className="text-xs text-sf-muted">{formatDate(review.date)}</span>
              </div>
              <p className="whitespace-pre-line text-sm leading-relaxed text-sf-text/80">{review.text}</p>
            </li>
          ))}
          {reviews.length === 0 && <li className="rounded-sf-card border border-dashed border-sf-border p-5 text-sm text-sf-muted">Sé el primero en opinar.</li>}
        </ul>

        <div className="rounded-sf-card border border-sf-border bg-sf-surface p-5">
          {state === 'sent' ? (
            <p className="text-sm">
              <span className="block text-base font-bold">¡Gracias por tu opinión!</span>
              La tienda la revisa y la publica en unos días.
            </p>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <p className="font-bold">Deja tu opinión</p>
              <fieldset>
                <legend className="mb-1 text-sm text-sf-muted">Tu calificación</legend>
                <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      aria-label={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`}
                      aria-pressed={rating === n}
                      onMouseEnter={() => setHover(n)}
                      onClick={() => setRating(n)}
                      className="p-0.5"
                    >
                      <Star size={26} strokeWidth={1.75} className={(hover || rating) >= n ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-sf-muted'} />
                    </button>
                  ))}
                </div>
              </fieldset>
              <label className="block text-sm">
                <span className="mb-1 block text-sf-muted">Tu nombre</span>
                <input name="name" required minLength={2} maxLength={40} autoComplete="given-name" className="w-full rounded-sf-btn border border-sf-border bg-sf-bg px-3 py-2.5" />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-sf-muted">Tu opinión</span>
                <textarea name="text" required minLength={10} maxLength={600} rows={4} className="w-full resize-y rounded-sf-btn border border-sf-border bg-sf-bg px-3 py-2.5" />
              </label>
              {/* Trampa para robots: oculta para las personas. */}
              <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
              {state === 'error' && <p className="text-sm font-bold text-red-700">{message}</p>}
              <button
                type="submit"
                disabled={state === 'sending' || preview}
                className="w-full rounded-sf-btn bg-sf-primary py-3 text-sm font-bold text-sf-on-primary disabled:opacity-60"
              >
                {state === 'sending' ? 'Enviando…' : 'Enviar opinión'}
              </button>
              <p className="text-xs text-sf-muted">La tienda revisa las opiniones antes de publicarlas.</p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
