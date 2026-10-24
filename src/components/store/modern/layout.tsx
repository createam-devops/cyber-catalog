import type { ReactNode } from 'react';

/**
 * El mismo ancho y los mismos márgenes en todas las secciones de la tienda
 * (portada, beneficios, categorías, productos, ficha, preguntas y pie): así
 * todo empieza y termina en la misma línea.
 */
export const CONTAINER = 'mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8';

/** Título de sección con un solo estilo en toda la tienda. */
export function SectionTitle({ id, title, subtitle, className = '' }: { id?: string; title: ReactNode; subtitle?: ReactNode; className?: string }) {
  return (
    <div className={`mb-6 ${className}`}>
      <h2 id={id} className="text-xl font-bold leading-tight md:text-2xl">
        {title}
      </h2>
      {subtitle && <p className="mt-1 text-sm text-sf-muted">{subtitle}</p>}
    </div>
  );
}
