"use client";

import { useEffect, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Search, Instagram, Facebook, MessageCircle, MoreVertical } from 'lucide-react';
import { useStorefront } from '../StorefrontRoot';
import { socialUrl } from '@/lib/storefront/public-store';
import type { HeroTone } from './ModernHero';

const TikTokIcon = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" className={className} height={size} width={size} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z"></path>
  </svg>
);

interface ModernNavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  isScrolled: boolean;
  onGoHome?: () => void;
  /**
   * Sobre qué está la barra cuando la página no se ha desplazado: una foto,
   * el color de la marca o nada (barra sólida desde el inicio).
   */
  heroTone?: HeroTone;
  searchQuery?: string;
  /** Búsqueda en vivo. Sin ella, Enter lleva a la portada con la búsqueda. */
  onSearchChange?: (query: string) => void;
}

function isHttpUrl(value?: string): boolean {
  if (!value?.trim()) return false;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export default function ModernNavbar({
  cartCount,
  onOpenCart,
  isScrolled,
  onGoHome,
  heroTone = 'none',
  searchQuery = '',
  onSearchChange,
}: ModernNavbarProps) {
  const router = useRouter();
  const { store, theme, preview } = useStorefront();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [query, setQuery] = useState(searchQuery);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => setQuery(searchQuery), [searchQuery]);
  useEffect(() => setLogoError(false), [store.logo]);

  const solid = isScrolled || heroTone === 'none';
  // Color del texto de la barra según lo que tiene detrás.
  const navStyle = {
    '--sf-nav-fg': solid ? 'var(--sf-text)' : heroTone === 'brand' ? 'var(--sf-on-primary)' : '#ffffff',
  } as CSSProperties;

  const socials = [
    { key: 'tiktok', label: 'TikTok', href: socialUrl('tiktok', store.socialMedia?.tiktok), icon: <TikTokIcon size={22} /> },
    { key: 'instagram', label: 'Instagram', href: socialUrl('instagram', store.socialMedia?.instagram), icon: <Instagram size={22} strokeWidth={2.25} /> },
    { key: 'facebook', label: 'Facebook', href: socialUrl('facebook', store.socialMedia?.facebook), icon: <Facebook size={22} strokeWidth={2.25} /> },
    { key: 'whatsapp', label: 'WhatsApp', href: store.whatsapp ? `https://wa.me/${store.whatsapp}` : null, icon: <MessageCircle size={22} strokeWidth={2.25} /> },
  ].filter((s): s is typeof s & { href: string } => Boolean(s.href));

  const showLogo = isHttpUrl(store.logo) && !logoError;

  const submitSearch = () => {
    const value = query.trim();
    if (onSearchChange) {
      onSearchChange(value);
    } else if (value && !preview) {
      router.push(`/?q=${encodeURIComponent(value)}`);
    }
  };

  return (
    <nav className="fixed top-0 md:top-4 left-0 right-0 z-50 px-0 md:px-4 flex justify-center" style={navStyle}>
      <div
        className={`flex flex-wrap md:flex-nowrap items-center justify-between gap-y-2 px-4 py-2 md:px-6 md:py-3 md:rounded-full transition-all duration-300 w-full text-[color:var(--sf-nav-fg)] ${
          solid
            ? 'bg-sf-bg/80 backdrop-blur-md shadow-lg border-b md:border border-sf-border max-w-5xl'
            : 'bg-transparent border-transparent max-w-7xl'
        }`}
      >
        {/* Marca */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            onGoHome?.();
          }}
          className="flex items-center gap-2 flex-1 md:flex-none mr-2 md:mr-6 min-w-0"
        >
          {showLogo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={store.logo!.trim()} alt={store.name} className="h-8 md:h-10 w-auto max-w-[140px] object-contain" onError={() => setLogoError(true)} />
          )}
          <span className={`brand-font text-lg md:text-2xl tracking-tight truncate ${showLogo ? 'hidden md:inline' : ''}`}>
            {store.name}
          </span>
        </a>

        {/* Buscador: en celular va en su propia fila, a todo el ancho */}
        <form
          role="search"
          className="order-last basis-full md:order-none md:basis-auto md:flex-1 max-w-2xl md:mx-2"
          onSubmit={(e) => {
            e.preventDefault();
            submitSearch();
          }}
        >
          <label
            className={`flex items-center w-full rounded-full transition-all duration-300 overflow-hidden ${
              solid ? 'bg-sf-surface focus-within:ring-2 focus-within:ring-sf-primary/30' : 'bg-white/20 backdrop-blur-md border border-white/30'
            }`}
          >
            <span className="pl-3 md:pl-4 opacity-80">
              <Search size={18} aria-hidden="true" />
            </span>
            <span className="sr-only">Buscar productos</span>
            <input
              type="search"
              placeholder={theme.content.searchPlaceholder}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                onSearchChange?.(e.target.value);
              }}
              className="w-full py-2.5 px-3 bg-transparent border-none outline-none text-sm md:text-base font-medium text-[color:var(--sf-nav-fg)] placeholder:text-[color:var(--sf-nav-fg)] placeholder:opacity-70"
            />
          </label>
        </form>

        {/* Acciones */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0 ml-1">
          {socials.length > 0 && (
            <div className={`hidden lg:flex items-center gap-4 border-r pr-4 mr-1 ${solid ? 'border-sf-border' : 'border-white/40'}`}>
              {socials.map((s) => (
                <a key={s.key} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="transition-all duration-200 hover:scale-110 hover:text-sf-primary">
                  {s.icon}
                </a>
              ))}
            </div>
          )}

          {socials.length > 0 && (
            <div className="lg:hidden relative">
              <button type="button" aria-label="Redes sociales" onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-full">
                <MoreVertical size={20} />
              </button>
              {isMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                  <div className="absolute right-0 top-12 bg-sf-bg/95 backdrop-blur-md rounded-2xl shadow-xl border border-sf-border py-3 px-3 min-w-[200px] z-50 text-sf-text">
                    {socials.map((s) => (
                      <a
                        key={s.key}
                        href={s.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sf-surface transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {s.icon}
                        <span className="text-sm font-medium">{s.label}</span>
                      </a>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={onOpenCart}
            aria-label={`${theme.content.cartTitle} (${cartCount})`}
            className={`relative p-2.5 rounded-full shadow-md hover:opacity-90 active:scale-95 transition-all ${
              // Sobre una portada del color de la marca el botón se invierte para no perderse.
              !solid && heroTone === 'brand' ? 'bg-sf-on-primary text-sf-primary' : 'bg-sf-primary text-sf-on-primary'
            }`}
          >
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 bg-sf-bg text-sf-text text-[10px] font-bold flex items-center justify-center rounded-full shadow-sm border border-sf-border">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
