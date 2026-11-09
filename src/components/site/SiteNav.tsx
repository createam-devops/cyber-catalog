"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, m } from "framer-motion";
import { ChevronDown, Menu, X } from "lucide-react";
import { ACCENTS, type Accent } from "./theme";

export interface NavItem {
  name: string;
  href: string;
  text?: string;
  accent?: Accent;
}

export interface SiteNavProps {
  /** El logo, armado en el servidor (SVG en línea) */
  logo: React.ReactNode;
  products: NavItem[];
  modules: NavItem[];
  rubros: NavItem[];
  logins: NavItem[];
  allModulesHref: string;
  customPlanHref: string;
  /** shortLabel: el texto en celular, donde el largo empuja el botón de menú fuera de la pantalla */
  cta: { label: string; shortLabel?: string; href: string; track?: string };
}

type MenuId = "productos" | "rubros" | "ingresar";

const container = "mx-auto w-full max-w-[1180px] px-5 sm:px-8 lg:px-10";

/** Enlace del menú: <Link> para las páginas del sitio, <a> para los demás sitios y para /ingresar (redirige fuera). */
function NavAnchor({
  href,
  className,
  onClick,
  track,
  children,
}: {
  href: string;
  className: string;
  onClick?: () => void;
  track?: string;
  children: React.ReactNode;
}) {
  const internal = href.startsWith("/") && !href.startsWith("/ingresar");
  return internal ? (
    <Link href={href} className={className} onClick={onClick} data-track={track}>
      {children}
    </Link>
  ) : (
    <a href={href} className={className} onClick={onClick} data-track={track}>
      {children}
    </a>
  );
}

function ItemList({ items, onNavigate, withText = true }: { items: NavItem[]; onNavigate: () => void; withText?: boolean }) {
  return (
    <ul className="flex flex-col gap-0.5">
      {items.map((item) => (
        <li key={item.href}>
          <NavAnchor href={item.href} onClick={onNavigate} className="flex min-h-[44px] items-start gap-3 rounded-xl px-3 py-2 hover:bg-site-bg">
            <span className={`mt-[9px] h-2 w-2 flex-none rounded-full ${ACCENTS[item.accent ?? "createam"].dot}`} />
            <span className="flex flex-col">
              <span className="font-bold text-site-ink">{item.name}</span>
              {withText && item.text && <span className="text-sm font-medium text-site-text-faint">{item.text}</span>}
            </span>
          </NavAnchor>
        </li>
      ))}
    </ul>
  );
}

// Los paneles bajan y aparecen; los centrados conservan su -50 % horizontal en
// el estilo de framer (que reemplaza el transform de las clases).
const PANEL_MOTION = { initial: { opacity: 0, y: -8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 }, transition: { duration: 0.18 } };
const CENTERED = { x: "-50%" };

const panelHeading = "px-3 pb-1.5 text-xs font-bold uppercase tracking-wider text-site-text-faint";
const moreLink = "mt-1 flex min-h-[44px] items-center px-3 text-[15px] font-bold text-site-ink hover:underline";

/**
 * Cabecera del sitio: logo, menús «Productos» y «Rubros», Precios, Aliados,
 * «Ingresar» y el botón principal. En celular y tableta todo va en un panel
 * que se abre con el botón de menú.
 */
export default function SiteNav({ logo, products, modules, rubros, logins, allModulesHref, customPlanHref, cta }: SiteNavProps) {
  const [open, setOpen] = useState<MenuId | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const closeAll = () => {
    setOpen(null);
    setMobileOpen(false);
  };

  // Al cambiar de página se cierra todo.
  useEffect(() => {
    setOpen(null);
    setMobileOpen(false);
  }, [pathname]);

  // Escape cierra; un clic fuera del menú, también.
  useEffect(() => {
    if (!open && !mobileOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(null);
        setMobileOpen(false);
      }
    };
    const onPointer = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(null);
        setMobileOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open, mobileOpen]);

  const toggle = (id: MenuId) => setOpen((current) => (current === id ? null : id));

  const menuButton = (id: MenuId, label: string, extra = "") => (
    <button
      type="button"
      aria-expanded={open === id}
      aria-controls={`menu-${id}`}
      onClick={() => toggle(id)}
      className={`inline-flex min-h-[44px] items-center gap-1 rounded-xl px-3 text-[15px] font-semibold hover:text-site-ink ${open === id ? "text-site-ink" : ""} ${extra}`}
    >
      {label}
      <ChevronDown size={16} aria-hidden="true" className={`transition-transform ${open === id ? "rotate-180" : ""}`} />
    </button>
  );

  const panel = "absolute top-full z-50 mt-1 rounded-[18px] border border-site-line bg-white p-3 text-[15px] shadow-[0_20px_48px_rgba(11,27,58,0.16)]";
  const isActive = (href: string) => pathname === href;

  return (
    <header className="sticky top-0 z-40 border-b border-site-line bg-white">
      <div ref={rootRef} className={`${container} relative flex items-center justify-between gap-x-2 py-2.5 sm:gap-x-3`}>
        <Link href="/" className="group flex min-h-[44px] flex-none items-center" aria-label="Createam, ir al inicio">
          {logo}
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-1 lg:flex">
          {menuButton("productos", "Productos")}
          <AnimatePresence>
          {open === "productos" && (
            <m.div key="productos" {...PANEL_MOTION} style={CENTERED} id="menu-productos" className={`${panel} left-1/2 grid w-[760px] grid-cols-[1.1fr_1fr] gap-4`}>
              <div>
                <p className={panelHeading}>Productos</p>
                <ItemList items={products} onNavigate={closeAll} />
              </div>
              <div className="rounded-[14px] bg-site-bg p-2">
                <p className={`${panelHeading} pt-1.5`}>Módulos del ERP</p>
                <ItemList items={modules} onNavigate={closeAll} withText={false} />
                <NavAnchor href={allModulesHref} onClick={closeAll} className={moreLink}>
                  Ver todos los módulos →
                </NavAnchor>
              </div>
            </m.div>
          )}
          </AnimatePresence>
          {menuButton("rubros", "Rubros")}
          <AnimatePresence>
          {open === "rubros" && (
            <m.div key="rubros" {...PANEL_MOTION} style={CENTERED} id="menu-rubros" className={`${panel} left-1/2 w-[440px]`}>
              <p className={panelHeading}>Soluciones por rubro</p>
              <ItemList items={rubros} onNavigate={closeAll} />
              <NavAnchor href={customPlanHref} onClick={closeAll} className={moreLink}>
                ¿Otro rubro? Armamos tu plan →
              </NavAnchor>
            </m.div>
          )}
          </AnimatePresence>
          {[
            { name: "Precios", href: "/precios" },
            { name: "Aliados", href: "/aliados" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={`flex min-h-[44px] items-center rounded-xl px-3 text-[15px] font-semibold hover:text-site-ink ${isActive(link.href) ? "text-site-ink" : ""}`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="flex flex-none items-center gap-1.5 sm:gap-2">
          <div className="hidden sm:block">
            {menuButton("ingresar", "Ingresar", "rounded-full border-[1.5px] border-site-line-strong px-4 font-bold hover:border-site-ink hover:text-site-ink")}
          </div>
          <AnimatePresence>
            {open === "ingresar" && (
              <m.div key="ingresar" {...PANEL_MOTION} id="menu-ingresar" className={`${panel} right-5 w-[260px] sm:right-8 lg:right-10`}>
                <p className={panelHeading}>Ingresar a</p>
                <ItemList items={logins} onNavigate={closeAll} />
              </m.div>
            )}
          </AnimatePresence>
          <NavAnchor
            href={cta.href}
            onClick={closeAll}
            track={cta.track}
            className="inline-flex min-h-[44px] items-center whitespace-nowrap rounded-full bg-site-accent px-3.5 text-[14px] font-bold text-site-on-accent transition-colors hover:bg-site-accent-hover max-[359px]:hidden sm:px-5 sm:text-[15px]"
          >
            <span className="sm:hidden">{cta.shortLabel ?? cta.label}</span>
            <span className="hidden sm:inline">{cta.label}</span>
          </NavAnchor>
          <button
            type="button"
            aria-expanded={mobileOpen}
            aria-controls="menu-movil"
            aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
            onClick={() => {
              setOpen(null);
              setMobileOpen((v) => !v);
            }}
            className="grid h-11 w-11 place-items-center rounded-full border-[1.5px] border-site-line-strong lg:hidden"
          >
            {mobileOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </div>

        <AnimatePresence>
        {mobileOpen && (
          <m.div
            key="movil"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
            id="menu-movil"
            className="absolute inset-x-0 top-full max-h-[calc(100dvh-64px)] overflow-y-auto border-b border-site-line bg-white shadow-[0_20px_40px_rgba(11,27,58,0.14)] lg:hidden"
          >
            <nav aria-label="Menú" className={`${container} flex flex-col gap-5 py-5 text-[15px]`}>
              <div>
                <p className={panelHeading}>Productos</p>
                <ItemList items={products} onNavigate={closeAll} />
              </div>
              <div>
                <p className={panelHeading}>Rubros</p>
                <ItemList items={rubros} onNavigate={closeAll} withText={false} />
                <NavAnchor href={customPlanHref} onClick={closeAll} className={moreLink}>
                  ¿Otro rubro? Armamos tu plan →
                </NavAnchor>
              </div>
              <div>
                <p className={panelHeading}>Módulos del ERP</p>
                <ItemList items={modules} onNavigate={closeAll} withText={false} />
                <NavAnchor href={allModulesHref} onClick={closeAll} className={moreLink}>
                  Ver todos los módulos →
                </NavAnchor>
              </div>
              <div className="flex flex-col border-t border-site-line pt-3">
                {[
                  { name: "Precios", href: "/precios" },
                  { name: "Aliados", href: "/aliados" },
                ].map((link) => (
                  <Link key={link.href} href={link.href} onClick={closeAll} className="flex min-h-[48px] items-center px-3 text-base font-bold">
                    {link.name}
                  </Link>
                ))}
              </div>
              <div className="border-t border-site-line pt-3">
                <p className={panelHeading}>Ingresar a</p>
                <ItemList items={logins} onNavigate={closeAll} />
              </div>
            </nav>
          </m.div>
        )}
        </AnimatePresence>
      </div>
    </header>
  );
}
