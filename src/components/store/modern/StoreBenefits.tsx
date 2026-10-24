"use client";

import { useStorefront } from '../StorefrontRoot';
import { WHATSAPP_GREEN, benefitIconName, getStorefrontIcon } from '@/lib/storefront/icons';
import { CONTAINER } from './layout';

/**
 * Beneficios de la tienda (delivery, pedidos por WhatsApp, garantía…). Los
 * escribe la tienda en Diseño; sin escribirlos, salen los que valen para toda
 * tienda. En la portada es una línea corta con íconos de color, como en las
 * tiendas grandes; `compact` es la lista de la ficha del producto, con detalle.
 */
export default function StoreBenefits({ compact = false }: { compact?: boolean }) {
  const { theme } = useStorefront();
  const items = theme.benefits.map((item) => {
    const icon = benefitIconName(item.icon, item.title);
    return { ...item, Icon: getStorefrontIcon(icon), color: icon === 'WhatsApp' ? WHATSAPP_GREEN : undefined };
  });
  if (!items.length) return null;

  if (compact) {
    return (
      <ul className="space-y-2.5 text-sm" aria-label="Beneficios">
        {items.map(({ Icon, color, title, text }) => (
          <li key={title} className="flex items-start gap-2.5">
            <Icon size={18} aria-hidden="true" className="mt-px shrink-0 text-sf-primary" style={color ? { color } : undefined} />
            <span className="leading-snug">
              <span className="font-bold">{title}</span>
              {text && <span className="text-sf-muted"> · {text}</span>}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <section aria-label="Beneficios" className={`${CONTAINER} pt-5`}>
      <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] font-semibold sm:gap-x-10 sm:text-sm">
        {items.map(({ Icon, color, title }) => (
          <li key={title} className="flex items-center gap-1.5">
            <Icon size={17} aria-hidden="true" className="shrink-0 text-sf-primary" style={color ? { color } : undefined} />
            {title}
          </li>
        ))}
      </ul>
    </section>
  );
}
