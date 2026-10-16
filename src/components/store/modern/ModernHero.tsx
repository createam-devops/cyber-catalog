"use client";

import { useEffect, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useStorefront } from '../StorefrontRoot';
import type { PublicStore } from '@/lib/storefront/public-store';
import type { ResolvedStorefront } from '@/lib/storefront/theme';

/** Lo que queda detrás de la barra superior: una foto, el color de la marca o nada. */
export type HeroTone = 'image' | 'brand' | 'none';

function storeSlides(store: PublicStore) {
  return [...(store.heroSlides ?? [])]
    .filter((s) => s.image)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function heroToneFor(store: PublicStore, theme: ResolvedStorefront): HeroTone {
  if (theme.layout.hero === 'none') return 'none';
  return storeSlides(store).length > 0 ? 'image' : 'brand';
}

/**
 * Portada de la tienda. Con banners propios, carrusel (o el primero fijo si la
 * tienda eligió "banner"). Sin banners, un bloque del color de la marca con los
 * textos del rubro: nunca fotos de stock ajenas a la tienda.
 */
export default function ModernHero() {
  const { store, theme } = useStorefront();
  const slides = storeSlides(store);
  const visible = theme.layout.hero === 'banner' ? slides.slice(0, 1) : slides;
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (visible.length <= 1) return;
    const timer = setInterval(() => setCurrent((prev) => (prev + 1) % visible.length), 5000);
    return () => clearInterval(timer);
  }, [visible.length]);

  if (theme.layout.hero === 'none') return null;

  const shell = 'relative h-[45vh] min-h-[420px] w-full overflow-hidden rounded-b-sf-hero pt-20 md:pt-24';

  if (visible.length === 0) {
    const { content } = theme;
    return (
      <section className={`${shell} bg-sf-primary text-sf-on-primary`}>
        <div className="absolute inset-0 flex flex-col justify-end pb-14 px-6 container mx-auto">
          <div className="max-w-4xl">
            {content.heroEyebrow && (
              <span className="inline-block px-3 py-1 mb-3 rounded-sf-chip border border-current text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] opacity-80">
                {content.heroEyebrow}
              </span>
            )}
            <h1 className="text-3xl sm:text-4xl md:text-6xl leading-[1.05] mb-5">{content.heroTitle || store.name}</h1>
            {content.heroButton && (
              <a
                href="#productos"
                className="inline-flex items-center gap-2 bg-sf-on-primary text-sf-primary px-6 py-2.5 md:px-8 md:py-3 rounded-sf-btn font-bold text-xs md:text-sm shadow-lg hover:opacity-90 transition-opacity"
              >
                {content.heroButton} <ArrowUpRight size={16} />
              </a>
            )}
          </div>
        </div>
      </section>
    );
  }

  const slide = visible[current] ?? visible[0];

  return (
    <section className={`${shell} bg-sf-surface`}>
      {visible.map((s, index) => (
        <div
          key={s.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === current ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={s.image}
            alt=""
            className="w-full h-full object-cover"
            loading={index === 0 ? 'eager' : 'lazy'}
          />
          <div className="absolute inset-0 bg-black" style={{ opacity: theme.heroOverlay }} />
        </div>
      ))}

      <div className="absolute inset-0 z-20 flex flex-col justify-end pb-14 px-6 container mx-auto pointer-events-none text-white">
        <div className="max-w-4xl pointer-events-auto">
          {slide.subtitle && (
            <span className="inline-block px-3 py-1 mb-2 rounded-sf-chip border border-white/30 bg-white/10 backdrop-blur-md text-[10px] md:text-xs font-bold uppercase tracking-[0.2em]">
              {slide.subtitle}
            </span>
          )}
          {slide.title && <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl leading-[1] mb-3 drop-shadow-md">{slide.title}</h1>}
          {slide.buttonText && (
            <a
              href="#productos"
              className="inline-flex items-center gap-2 bg-sf-primary text-sf-on-primary px-6 py-2.5 md:px-8 md:py-3 rounded-sf-btn font-bold text-xs md:text-sm shadow-lg hover:opacity-90 transition-opacity"
            >
              {slide.buttonText} <ArrowUpRight size={16} />
            </a>
          )}
        </div>
      </div>

      {visible.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 z-30 flex justify-center gap-2">
          {visible.map((s, index) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Ver banner ${index + 1}`}
              onClick={() => setCurrent(index)}
              className={`h-1.5 rounded-full transition-all duration-300 ${current === index ? 'w-8 bg-white' : 'w-2 bg-white/40'}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
