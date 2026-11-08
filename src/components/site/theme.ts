// Colores de cada línea del sitio. Las clases van escritas completas porque
// Tailwind solo genera las que encuentra literalmente en el código.

export type Accent = "cyberpos" | "catalogo" | "onturn" | "createam";

export interface AccentClasses {
  /** Botón o fondo sólido */
  solid: string;
  /** Texto e íconos sobre fondo claro */
  text: string;
  /** Etiqueta: fondo suave y texto oscuro */
  tag: string;
  /** Fondo suave de una tarjeta destacada */
  soft: string;
  /** Borde de una tarjeta destacada */
  border: string;
  /** Borde grueso del plan recomendado */
  strongBorder: string;
  /** Punto de una lista */
  dot: string;
  /** Íconos y viñetas sobre el azul marino del encabezado */
  onDark: string;
}

export const ACCENTS: Record<Accent, AccentClasses> = {
  cyberpos: {
    solid: "bg-site-ink",
    text: "text-site-ink",
    tag: "bg-site-soft text-site-ink",
    soft: "bg-site-soft",
    border: "border-site-soft-line",
    strongBorder: "border-site-ink",
    dot: "bg-site-accent",
    onDark: "text-site-accent",
  },
  catalogo: {
    solid: "bg-site-ink",
    text: "text-site-ink",
    tag: "bg-site-soft text-site-ink",
    soft: "bg-site-soft",
    border: "border-site-soft-line",
    strongBorder: "border-site-ink",
    dot: "bg-site-accent",
    onDark: "text-site-accent",
  },
  onturn: {
    solid: "bg-site-ink",
    text: "text-site-ink",
    tag: "bg-site-soft text-site-ink",
    soft: "bg-site-soft",
    border: "border-site-soft-line",
    strongBorder: "border-site-ink",
    dot: "bg-site-accent",
    onDark: "text-site-accent",
  },
  createam: {
    solid: "bg-site-ink",
    text: "text-site-ink",
    tag: "bg-site-soft text-site-ink-deep",
    soft: "bg-site-soft",
    border: "border-site-soft-line",
    strongBorder: "border-site-ink",
    dot: "bg-site-accent",
    onDark: "text-site-on-ink",
  },
};

/**
 * Paleta del sitio (ver .site-theme en globals.css): azul marino o verde
 * petróleo, las dos con el amarillo sol de acento. Se cambia solo aquí.
 */
export const SITE_PALETTE: "marino" | "petroleo" = "petroleo";
