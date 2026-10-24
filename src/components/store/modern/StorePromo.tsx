"use client";

import { Tag } from 'lucide-react';
import { useStorefront } from '../StorefrontRoot';
import { isPromoActive } from '@/lib/storefront/theme';
import Countdown, { useCountdown } from './Countdown';

/**
 * Aviso de oferta de toda la tienda, con contador si tiene fecha de fin. Lo
 * escribe la tienda en Diseño; al llegar la fecha se apaga solo (en el
 * servidor no se dibuja y en una página abierta desaparece).
 */
export default function StorePromo({ variant = 'band' }: { variant?: 'band' | 'inline' }) {
  const { theme } = useStorefront();
  const promo = theme.promo;
  const left = useCountdown(promo?.endsAt);
  if (!promo || !isPromoActive(promo) || left === 'over') return null;

  if (variant === 'inline') {
    return (
      <p className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-sf-card border border-sf-primary/30 bg-sf-primary/10 px-4 py-3 text-sm">
        <Tag size={16} aria-hidden="true" className="text-sf-primary" />
        <span className="font-bold">{promo.text}</span>
        {promo.endsAt && (
          <span className="text-sf-muted">
            · Termina en <Countdown endsAt={promo.endsAt} className="font-bold text-sf-text" />
          </span>
        )}
      </p>
    );
  }

  return (
    <section aria-label="Oferta" className="container mx-auto px-4 pt-6">
      <div className="flex flex-col gap-3 rounded-sf-card bg-sf-primary px-5 py-4 text-sf-on-primary shadow-md sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-base font-bold md:text-lg">
          <Tag size={20} aria-hidden="true" className="shrink-0" />
          {promo.text}
        </p>
        {promo.endsAt && (
          <p className="text-sm">
            Termina en <Countdown endsAt={promo.endsAt} className="ml-1 rounded-md bg-black/15 px-2 py-1 font-mono text-base font-bold" />
          </p>
        )}
      </div>
    </section>
  );
}
