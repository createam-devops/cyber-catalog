"use client";

import { useStorefront } from '../StorefrontRoot';
import { getStorefrontIcon } from '@/lib/storefront/icons';
import { CONTAINER } from './layout';

/**
 * Franja de beneficios (delivery, pedidos por WhatsApp, garantía…). Los
 * escribe la tienda en Diseño; sin escribirlos, salen los que valen para toda
 * tienda. En la portada es una sola franja que reparte los beneficios (se ve
 * bien con dos o con cuatro); `compact` es la versión de la ficha del producto.
 */
export default function StoreBenefits({ compact = false }: { compact?: boolean }) {
  const { theme } = useStorefront();
  const items = theme.benefits;
  if (!items.length) return null;

  if (compact) {
    return (
      <ul className="grid gap-3 sm:grid-cols-2" aria-label="Beneficios">
        {items.map((item) => {
          const Icon = getStorefrontIcon(item.icon);
          return (
            <li key={item.title} className="flex items-start gap-3 rounded-sf-card border border-sf-border bg-sf-bg px-4 py-3">
              <Icon size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-sf-primary" />
              <span className="text-sm leading-snug">
                <span className="block font-bold">{item.title}</span>
                {item.text && <span className="block text-sf-muted">{item.text}</span>}
              </span>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <section aria-label="Beneficios" className={`${CONTAINER} pt-8`}>
      <ul className="flex flex-col gap-4 rounded-sf-card border border-sf-border bg-sf-surface px-5 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-around sm:gap-x-8">
        {items.map((item) => {
          const Icon = getStorefrontIcon(item.icon);
          return (
            <li key={item.title} className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sf-primary/10 text-sf-primary">
                <Icon size={20} aria-hidden="true" />
              </span>
              <span className="min-w-0 text-sm leading-snug">
                <span className="block font-bold">{item.title}</span>
                {item.text && <span className="block text-sf-muted">{item.text}</span>}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
