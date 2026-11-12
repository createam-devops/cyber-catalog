import Link from "next/link";
import Analytics from "@/components/Analytics";
import { CONTACT, LINKS } from "@/components/landing/content";
import { bodyFont, displayFont } from "@/components/landing/fonts";
import SiteNav from "./SiteNav";
import { BrandLogo } from "./brand";
import { MotionRoot } from "./motion";
import {
  ALL_MODULES_HREF,
  CUSTOM_PLAN_HREF,
  LOGIN_LINKS,
  MODULE_LINKS,
  PRODUCT_LINKS,
  RUBRO_LINKS,
  type NavLink,
} from "./nav";
import { SITE_PALETTE } from "./theme";
import { container } from "./ui";

export interface ShellCta {
  label: string;
  /** Texto corto para celular (por debajo de 640 px) */
  shortLabel?: string;
  href: string;
  track?: string;
}

// Por defecto, el botón de la cabecera abre el registro del ERP (plan gratis):
// lleva a crear la cuenta, no a otra sección de la página.
const DEFAULT_CTA: ShellCta = { label: "Crear cuenta gratis", shortLabel: "Crear cuenta", href: LINKS.cyberposRegister, track: "cabecera_registro_erp" };

/**
 * Marco de todas las páginas del sitio: tipografías, cabecera con menús,
 * franja de contacto, pie con el mapa del sitio y la analítica.
 */
export default function SiteShell({
  children,
  cta = DEFAULT_CTA,
  contactBand = true,
}: {
  children: React.ReactNode;
  /** Botón principal de la cabecera: en cada producto lleva a su registro. */
  cta?: ShellCta;
  /** Franja «¿No sabes por cuál empezar?» antes del pie. */
  contactBand?: boolean;
}) {
  return (
    <div
      data-palette={SITE_PALETTE}
      className={`site-theme ${displayFont.variable} ${bodyFont.variable} bg-site-bg font-landing-body text-[17px] leading-[1.55] text-site-text`}
    >
      <Analytics />
      <MotionRoot>
        <SiteNav
          logo={<BrandLogo />}
          products={PRODUCT_LINKS}
          modules={MODULE_LINKS}
          rubros={RUBRO_LINKS}
          logins={LOGIN_LINKS}
          allModulesHref={ALL_MODULES_HREF}
          customPlanHref={CUSTOM_PLAN_HREF}
          cta={cta}
        />
        <main>{children}</main>
        <SiteFooter contactBand={contactBand} />
      </MotionRoot>
    </div>
  );
}

function FooterColumn({ title, links }: { title: string; links: NavLink[] }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <h2 className="mb-1.5 font-landing-body text-sm font-bold uppercase tracking-wider text-site-on-ink">{title}</h2>
      <ul className="flex flex-col">
        {links.map((link) => {
          const internal = link.href.startsWith("/") && !link.href.startsWith("/ingresar");
          const cls = "flex min-h-[40px] items-center text-[15px] text-site-on-ink-muted hover:text-white hover:underline";
          return (
            <li key={`${title}-${link.href}`}>
              {internal ? (
                <Link href={link.href} className={cls}>
                  {link.name}
                </Link>
              ) : (
                <a href={link.href} className={cls}>
                  {link.name}
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SiteFooter({ contactBand }: { contactBand: boolean }) {
  return (
    <footer className="bg-site-ink text-white">
      <div className={`${container} flex flex-col gap-11 pb-9 pt-14 sm:pt-20`}>
        {contactBand && (
          <div id="contacto" data-section="contacto" className="flex flex-wrap items-center justify-between gap-x-12 gap-y-6">
            <div className="min-w-0 flex-[1_1_420px]">
              <h2 className="font-landing-display text-[clamp(28px,3.4vw,44px)] font-bold leading-[1.08] tracking-[-0.006em]">
                ¿No sabes por cuál empezar?
              </h2>
              <p className="mt-2.5 text-site-on-ink-muted">Escríbenos y te orientamos según tu negocio.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href={LINKS.whatsapp}
                data-track="whatsapp_contacto"
                className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-site-accent px-[26px] font-bold text-site-on-accent transition-colors hover:bg-site-accent-hover"
              >
                WhatsApp {CONTACT.phone}
              </a>
              <a
                href={LINKS.email}
                data-track="correo_contacto"
                className="inline-flex min-h-[52px] items-center justify-center rounded-full border-[1.5px] border-site-on-ink-faint px-[26px] font-bold text-white hover:border-white"
              >
                {CONTACT.email}
              </a>
            </div>
          </div>
        )}

        <div className={`grid grid-cols-2 gap-x-6 gap-y-9 md:grid-cols-3 lg:grid-cols-5 ${contactBand ? "border-t border-site-ink-line pt-10" : ""}`}>
          <FooterColumn title="Productos" links={[...PRODUCT_LINKS, { name: "Precios", href: "/precios" }]} />
          <FooterColumn title="Módulos" links={[...MODULE_LINKS, { name: "Todos los módulos", href: ALL_MODULES_HREF }]} />
          <FooterColumn title="Rubros" links={[...RUBRO_LINKS, { name: "Plan a tu medida", href: CUSTOM_PLAN_HREF }]} />
          <FooterColumn
            title="Para clientes"
            links={[
              { name: "Consultar mi comprobante", href: LINKS.invoiceLookup },
              ...LOGIN_LINKS.map((l) => ({ ...l, name: `Ingresar a ${l.name}` })),
            ]}
          />
          <FooterColumn
            title="Createam"
            links={[
              { name: "Programa de Aliados", href: "/aliados" },
              { name: "Desarrollo a medida", href: LINKS.custom },
              { name: "Términos", href: "/terminos" },
              { name: "Privacidad", href: "/privacidad" },
            ]}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-7 gap-y-3 border-t border-site-ink-line pt-6 text-sm text-site-on-ink-muted">
          <Link href="/" className="group flex min-h-[44px] items-center" aria-label="Createam, ir al inicio">
            <BrandLogo tone="light" size="sm" />
          </Link>
          <span>© {new Date().getFullYear()} Createam · Lima, Perú · Software en la nube desde 2017</span>
        </div>
      </div>
    </footer>
  );
}
