"use client";

import { ChevronDown } from 'lucide-react';
import { useStorefront } from '../StorefrontRoot';

/**
 * Preguntas frecuentes de la tienda. Visibles en la página (Google pide que lo
 * marcado como FAQPage esté a la vista) y en la guía para IAs (llms.txt).
 */
export default function StoreFaq() {
  const { theme } = useStorefront();
  if (!theme.faq.length) return null;

  return (
    <section id="preguntas" aria-labelledby="preguntas-title" className="container mx-auto px-4 py-12 max-w-3xl">
      <h2 id="preguntas-title" className="text-xl md:text-2xl mb-6">
        Preguntas frecuentes
      </h2>
      <div className="divide-y divide-sf-border rounded-sf-card border border-sf-border bg-sf-bg">
        {theme.faq.map((item) => (
          <details key={item.q} className="group px-5 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold [&::-webkit-details-marker]:hidden">
              <span>{item.q}</span>
              <ChevronDown size={18} aria-hidden="true" className="shrink-0 transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-sf-text/80">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
