import {
  CalendarCheck,
  Handshake,
  LayoutDashboard,
  Ruler,
  Scissors,
  ShoppingBag,
  SlidersHorizontal,
  Store,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import type { Accent } from "./theme";

// Identidad visual del sitio: el logo (una nube geométrica con el punto de la
// idea) y los mosaicos de íconos, que son piezas: se «conectan» al pasar el
// mouse, como los módulos del ERP (ver ModuleAssembly). Los colores salen de las variables de globals.css (.site-theme), así
// que todo sigue a la paleta elegida. Todo es SVG o CSS: no suma peticiones.

/**
 * La marca: tres círculos que forman una nube y el punto amarillo de la idea.
 * La nube toma el color del texto (currentColor).
 */
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 44 30" aria-hidden="true" className={className}>
      <g fill="currentColor">
        <circle cx="12" cy="19" r="8" />
        <circle cx="22" cy="13" r="10.5" />
        <circle cx="32" cy="18" r="9" />
        <rect x="12" y="17" width="20" height="10" />
      </g>
      <circle
        cx="39.5"
        cy="5.5"
        r="3.4"
        fill="var(--c-accent)"
        className="origin-[39.5px_5.5px] transition-transform duration-300 group-hover:scale-125 motion-reduce:transition-none"
      />
    </svg>
  );
}

/** Logo completo: la nube y el nombre en minúsculas. */
export function BrandLogo({ tone = "color", size = "md" }: { tone?: "color" | "light"; size?: "sm" | "md" }) {
  const mark = size === "md" ? "h-[26px] w-[38px] sm:h-[30px] sm:w-[44px]" : "h-[24px] w-[35px]";
  const text = size === "md" ? "text-[22px] sm:text-[25px]" : "text-[21px]";
  return (
    <span className="flex items-center gap-2">
      <BrandMark className={`${mark} ${tone === "light" ? "text-site-on-ink" : "text-site-ink"}`} />
      <span className={`font-landing-display font-extrabold lowercase leading-none tracking-[-0.035em] ${text} ${tone === "light" ? "text-white" : "text-site-ink"}`}>
        createam
      </span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Mosaicos de íconos: línea fina, un solo color.

const TILE_SIZES = {
  sm: { box: "h-8 w-8 rounded-[10px]", icon: "h-4 w-4" },
  md: { box: "h-11 w-11 rounded-xl", icon: "h-5 w-5" },
  lg: { box: "h-14 w-14 rounded-2xl", icon: "h-[26px] w-[26px]" },
};

/**
 * Ícono en su mosaico. `soft`: tono suave de la marca con el ícono oscuro.
 * `solid`: mosaico oscuro con el ícono claro, que sirve igual sobre fondo claro
 * que sobre el encabezado oscuro.
 */
export function IconTile({
  icon: Icon,
  variant = "soft",
  size = "md",
  children,
  className = "",
}: {
  /** Compatibilidad con las tarjetas: el color ya no depende del producto */
  accent?: Accent;
  icon?: LucideIcon;
  variant?: "soft" | "solid";
  size?: "sm" | "md" | "lg";
  children?: React.ReactNode;
  className?: string;
}) {
  const s = TILE_SIZES[size];
  const look =
    variant === "solid"
      ? "bg-site-ink-raise text-site-on-ink ring-1 ring-inset ring-site-ink-line"
      : "bg-site-soft text-site-ink ring-1 ring-inset ring-site-soft-line";
  const plug =
    variant === "solid" ? "bg-site-ink-raise ring-site-ink-line" : "bg-site-soft ring-site-soft-line";
  return (
    <span className={`relative inline-grid flex-none place-items-center ${s.box} ${look} ${className}`}>
      {Icon ? <Icon className={s.icon} strokeWidth={1.75} aria-hidden /> : children}
      {/* El conector de la pieza: se enciende cuando la tarjeta se activa, como un módulo que se acopla */}
      <span
        aria-hidden="true"
        className={`absolute -right-[4px] top-1/2 h-2 w-2 -translate-y-1/2 rounded-full ring-1 transition-colors duration-300 group-hover:bg-site-accent group-hover:ring-site-accent ${plug}`}
      />
    </span>
  );
}

// Íconos de productos, rubros y aliados.
export type BrandIconName = "cyberpos" | "catalogo" | "onturn" | "aliados" | "restaurantes" | "bodegas" | "fabricacion" | "barberias" | "medida";

export const BRAND_ICONS: Record<BrandIconName, LucideIcon> = {
  cyberpos: LayoutDashboard,
  catalogo: ShoppingBag,
  onturn: CalendarCheck,
  aliados: Handshake,
  restaurantes: UtensilsCrossed,
  bodegas: Store,
  fabricacion: Ruler,
  barberias: Scissors,
  medida: SlidersHorizontal,
};

export function BrandIcon({ name, className = "h-5 w-5" }: { name: BrandIconName; className?: string }) {
  const Icon = BRAND_ICONS[name];
  return <Icon className={className} strokeWidth={1.75} aria-hidden />;
}
