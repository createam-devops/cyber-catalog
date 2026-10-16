"use client";

import { Settings, Instagram, Facebook, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useStorefront } from '../StorefrontRoot';
import { socialUrl } from '@/lib/storefront/public-store';
import type { FooterStyle } from '@/lib/storefront/presets';

const TikTokIcon = ({ size = 20 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 448 512" fill="currentColor" aria-hidden="true">
    <path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z"/>
  </svg>
);

const SHELL: Record<FooterStyle, { root: string; soft: string; chip: string }> = {
  dark: { root: 'bg-gray-900 text-white', soft: 'text-white/60', chip: 'bg-white/10 hover:bg-white/20' },
  light: { root: 'bg-sf-surface text-sf-text border-t border-sf-border', soft: 'text-sf-muted', chip: 'bg-sf-bg hover:bg-sf-border' },
  brand: { root: 'bg-sf-primary text-sf-on-primary', soft: 'opacity-75', chip: 'bg-black/10 hover:bg-black/20' },
};

export default function ModernFooter() {
  const { store, theme, preview } = useStorefront();
  const shell = SHELL[theme.layout.footer];

  const socials = [
    { key: 'tiktok', label: 'TikTok', href: socialUrl('tiktok', store.socialMedia?.tiktok), icon: <TikTokIcon size={24} /> },
    { key: 'instagram', label: 'Instagram', href: socialUrl('instagram', store.socialMedia?.instagram), icon: <Instagram size={24} /> },
    { key: 'facebook', label: 'Facebook', href: socialUrl('facebook', store.socialMedia?.facebook), icon: <Facebook size={24} /> },
    { key: 'whatsapp', label: 'WhatsApp', href: store.whatsapp ? `https://wa.me/${store.whatsapp}` : null, icon: <MessageCircle size={24} /> },
  ].filter((s): s is typeof s & { href: string } => Boolean(s.href));

  return (
    <footer className={`${shell.root} pt-14 pb-8 mt-20 rounded-t-sf-hero`}>
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-10">
          <div>
            <p className="text-3xl md:text-4xl font-bold tracking-tight mb-2 brand-font">{store.name}</p>
            {theme.content.footerTagline && <p className={`${shell.soft} text-base`}>{theme.content.footerTagline}</p>}
          </div>
          {socials.length > 0 && (
            <div className="flex gap-4">
              {socials.map((s) => (
                <a
                  key={s.key}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-110 ${shell.chip}`}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          )}
        </div>
        <div className={`border-t border-current opacity-10 w-full mb-6`} />
        <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-xs ${shell.soft}`}>
          <p>© {new Date().getFullYear()} {store.name}</p>
          <div className="flex items-center gap-6">
            {!preview && (
              // Sin precarga: el panel trae su propio código y no tiene por qué bajarlo cada visitante.
              <Link href="/tenant-admin" prefetch={false} className="flex items-center gap-1 hover:opacity-100">
                <Settings size={14} /> Administrar
              </Link>
            )}
            <a href="https://createam.cloud" target="_blank" rel="noopener" className="hover:opacity-100">
              Catálogo hecho con <span className="font-bold">Createam</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
