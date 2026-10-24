"use client";

import { MessageCircle, MousePointerClick, ShoppingBag } from 'lucide-react';
import { useStorefront } from '../StorefrontRoot';

/** Los tres pasos para pedir. Valen para toda tienda de la plataforma: el pedido sale por WhatsApp. */
export default function HowToOrder() {
  const { theme } = useStorefront();
  const steps = [
    { Icon: MousePointerClick, title: 'Elige', text: 'Mira las fotos, el precio y los detalles.' },
    { Icon: ShoppingBag, title: theme.content.addToCart, text: 'Ajusta la cantidad en tu pedido.' },
    { Icon: MessageCircle, title: theme.content.orderButton, text: 'Te llega a nuestro chat y coordinamos pago y entrega.' },
  ];
  return (
    <section aria-labelledby="como-pedir-title" className="container mx-auto px-4 py-12">
      <h2 id="como-pedir-title" className="mb-6 text-center text-xl md:text-2xl">
        Así de fácil es pedir
      </h2>
      <ol className="grid gap-4 md:grid-cols-3">
        {steps.map(({ Icon, title, text }, index) => (
          <li key={title} className="flex items-start gap-4 rounded-sf-card border border-sf-border bg-sf-surface p-5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-sf-primary text-sf-on-primary">
              <Icon size={20} aria-hidden="true" />
            </span>
            <span>
              <span className="block text-xs font-bold uppercase tracking-widest text-sf-muted">Paso {index + 1}</span>
              <span className="block font-bold">{title}</span>
              <span className="block text-sm text-sf-muted">{text}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
