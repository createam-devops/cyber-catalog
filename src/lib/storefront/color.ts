// Utilidades de color para el tema de la vitrina. Sin dependencias: se usan
// tanto en el servidor (variables CSS) como en el panel (avisos de contraste).

const HEX = /^#(?:[0-9a-fA-F]{3}){1,2}$/;

export function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && HEX.test(value.trim());
}

/** `#abc` → `#aabbcc`, en minúsculas. Devuelve `fallback` si no es un hex válido. */
export function normalizeHex(value: string | undefined | null, fallback: string): string {
  if (!isHexColor(value)) return fallback;
  const hex = value.trim().toLowerCase();
  if (hex.length === 4) {
    return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  return hex;
}

/** `#e76ec1` → `"231 110 193"`, para usar con `rgb(var(--x) / <alpha>)` en Tailwind. */
export function hexToRgbChannels(hex: string): string {
  const h = normalizeHex(hex, '#000000');
  return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)).join(' ');
}

function relativeLuminance(hex: string): number {
  const h = normalizeHex(hex, '#000000');
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contraste WCAG entre dos colores (1 a 21). */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Mezcla `a` sobre `b` en la proporción `weight` (0 = solo b, 1 = solo a). */
export function mixHex(a: string, b: string, weight: number): string {
  const ha = normalizeHex(a, '#000000');
  const hb = normalizeHex(b, '#ffffff');
  const channel = (h: string, i: number) => parseInt(h.slice(i, i + 2), 16);
  return `#${[1, 3, 5]
    .map((i) => Math.round(channel(ha, i) * weight + channel(hb, i) * (1 - weight)))
    .map((c) => c.toString(16).padStart(2, '0'))
    .join('')}`;
}

export const LIGHT_TEXT = '#ffffff';
export const DARK_TEXT = '#111827';

/** El color de texto (blanco u oscuro) que mejor se lee sobre `background`. */
export function readableTextOn(background: string): string {
  return contrastRatio(background, LIGHT_TEXT) >= contrastRatio(background, DARK_TEXT)
    ? LIGHT_TEXT
    : DARK_TEXT;
}
