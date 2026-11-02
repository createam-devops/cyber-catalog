import type { ReactNode } from 'react';
import { ExternalLink, Lock, MessageCircle } from 'lucide-react';

// Tiendas con web propia hecha a medida (p. ej. bellasorpresa.pe). Su web toma
// de la plataforma los productos, banners, WhatsApp, redes y el aviso de
// oferta; el resto (logo, colores, letras, textos, dirección, SEO) es parte de
// su diseño. Aquí se ve, pero bloqueado y con el porqué, para no prometer un
// cambio que la tienda nunca va a mostrar.

/** WhatsApp de Createam, para pedir un cambio de diseño. */
const CREATEAM_WHATSAPP = '51945111310';

const LINK = 'inline-flex min-h-10 items-center gap-2 rounded-cm-md border border-cm-line bg-cm-field px-4 text-cm-body font-semibold text-cm-ink hover:border-cm-primary-line';

export const siteHost = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/+$/, '');

/** Qué se cambia aquí y qué es parte del diseño de su web, con a quién pedir lo demás. */
export function CustomSiteNotice({ url, children }: { url: string; children: ReactNode }) {
  const host = siteHost(url);
  const message = `Hola, Createam. Quisiera un cambio en el diseño de mi tienda ${host}: `;
  return (
    <section className="cs-card space-y-3">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-cm-md bg-cm-primary-bg text-cm-primary-deep">
          <Lock size={18} />
        </span>
        <div className="min-w-0">
          <h2 className="text-cm-title font-bold text-cm-ink">Tu tienda tiene un diseño personalizado</h2>
          <p className="mt-0.5 text-cm-label text-cm-muted">{children}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <a href={`https://wa.me/${CREATEAM_WHATSAPP}?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" className={LINK}>
          <MessageCircle size={16} /> Pedir un cambio de diseño
        </a>
        <a href={url} target="_blank" rel="noopener noreferrer" className={LINK}>
          <ExternalLink size={16} /> Ver {host}
        </a>
      </div>
    </section>
  );
}

/** Lo que su web no muestra: a la vista, pero sin poder cambiarse. */
export function Locked({ locked, children }: { locked: boolean; children: ReactNode }) {
  if (!locked) return <>{children}</>;
  return (
    <div className="space-y-2">
      <p className="flex items-center gap-1.5 px-1 text-cm-label font-semibold text-cm-muted">
        <Lock size={14} className="shrink-0" /> Parte del diseño de tu tienda: no se cambia desde aquí.
      </p>
      <fieldset disabled className="min-w-0 space-y-3 opacity-55">
        {children}
      </fieldset>
    </div>
  );
}

/** Junto al título de algo bloqueado. */
export function LockedPill() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-cm-line bg-cm-field px-2 py-0.5 text-cm-caption font-semibold text-cm-subtle">
      <Lock size={12} /> Diseño personalizado
    </span>
  );
}
