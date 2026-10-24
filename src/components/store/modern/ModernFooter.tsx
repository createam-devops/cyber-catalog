"use client";

import { Settings, Instagram, Facebook, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useStorefront } from '../StorefrontRoot';
import { formatPhone, socialUrl } from '@/lib/storefront/public-store';
import { categoryPath } from '@/lib/storefront/catalog';
import type { FooterStyle } from '@/lib/storefront/presets';
import { CONTAINER } from './layout';

const TikTokIcon = ({ size = 20 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 448 512" fill="currentColor" aria-hidden="true">
    <path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z"/>
  </svg>
);

const SHELL: Record<FooterStyle, { root: string; soft: string; chip: string; line: string }> = {
  dark: { root: 'bg-gray-900 text-white', soft: 'text-white/65', chip: 'bg-white/10 hover:bg-white/20', line: 'border-white/10' },
  light: { root: 'bg-sf-surface text-sf-text border-t border-sf-border', soft: 'text-sf-muted', chip: 'bg-sf-bg hover:bg-sf-border', line: 'border-sf-border' },
  brand: { root: 'bg-sf-primary text-sf-on-primary', soft: 'opacity-75', chip: 'bg-black/10 hover:bg-black/20', line: 'border-black/10' },
};

/**
 * Pie de la tienda en columnas: la marca con sus redes, las categorías y cómo
 * contactarla; abajo, el © y los enlaces de la plataforma. Todo con el mismo
 * ancho que el resto de la página.
 */
export default function ModernFooter() {
  const { store, theme, categories, preview } = useStorefront();
  const shell = SHELL[theme.layout.footer];

  const socials = [
    { key: 'tiktok', label: 'TikTok', href: socialUrl('tiktok', store.socialMedia?.tiktok), icon: <TikTokIcon size={18} /> },
    { key: 'instagram', label: 'Instagram', href: socialUrl('instagram', store.socialMedia?.instagram), icon: <Instagram size={18} /> },
    { key: 'facebook', label: 'Facebook', href: socialUrl('facebook', store.socialMedia?.facebook), icon: <Facebook size={18} /> },
  ].filter((s): s is typeof s & { href: string } => Boolean(s.href));

  // En la vista previa del editor los enlaces de la tienda no llevan a ningún lado.
  const InternalLink = ({ href, children }: { href: string; children: React.ReactNode }) =>
    preview ? (
      <span>{children}</span>
    ) : (
      <Link href={href} className="hover:underline">
        {children}
      </Link>
    );

  return (
    <footer className={`${shell.root} mt-12 rounded-t-sf-hero`}>
      <div className={`${CONTAINER} grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr]`}>
        <div className="sm:col-span-2 lg:col-span-1">
          <p className="brand-font text-2xl font-bold tracking-tight md:text-3xl">{store.name}</p>
          {theme.content.footerTagline && <p className={`mt-2 max-w-sm text-sm ${shell.soft}`}>{theme.content.footerTagline}</p>}
          {socials.length > 0 && (
            <div className="mt-5 flex gap-3">
              {socials.map((s) => (
                <a
                  key={s.key}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${shell.chip}`}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          )}
        </div>

        {categories.length > 0 && (
          <nav aria-label="Categorías">
            <p className="mb-3 text-sm font-bold uppercase tracking-wider">Categorías</p>
            <ul className={`space-y-2 text-sm ${shell.soft}`}>
              {categories.slice(0, 6).map((category) => (
                <li key={category.id}>
                  <InternalLink href={categoryPath(category)}>{category.label}</InternalLink>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div>
          <p className="mb-3 text-sm font-bold uppercase tracking-wider">Atención</p>
          <ul className={`space-y-2 text-sm ${shell.soft}`}>
            {store.whatsapp && (
              <li>
                <a href={`https://wa.me/${store.whatsapp}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:underline">
                  <MessageCircle size={16} aria-hidden="true" />
                  {formatPhone(store.whatsapp)}
                </a>
              </li>
            )}
            <li>Pedidos por WhatsApp</li>
            {theme.faq.length > 0 && (
              <li>
                <InternalLink href="/#preguntas">Preguntas frecuentes</InternalLink>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className={`${CONTAINER} flex flex-col gap-3 border-t py-6 text-xs sm:flex-row sm:items-center sm:justify-between ${shell.line} ${shell.soft}`}>
        <p>
          © {new Date().getFullYear()} {store.name}
        </p>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {!preview &&
            // Las tiendas del ERP se administran en CyberPOS; las viejas, en el panel suelto
            // (sin precarga: trae su propio código y no tiene por qué bajarlo cada visitante).
            (store.adminUrl?.startsWith('http') ? (
              <a href={store.adminUrl} rel="nofollow" className="flex items-center gap-1 hover:underline">
                <Settings size={14} aria-hidden="true" /> Administrar
              </a>
            ) : (
              <Link href={store.adminUrl || '/tenant-admin'} prefetch={false} rel="nofollow" className="flex items-center gap-1 hover:underline">
                <Settings size={14} aria-hidden="true" /> Administrar
              </Link>
            ))}
          <a href="https://createam.cloud" target="_blank" rel="noopener" className="hover:underline">
            Catálogo hecho con <span className="font-bold">Createam</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
