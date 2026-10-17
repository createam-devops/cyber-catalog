// Identificadores y nombres de las tipografías elegibles. Va separado de
// fonts.ts para que la validación del servidor no cargue next/font.

export const FONT_IDS = ['days-one', 'outfit', 'inter', 'playfair', 'dm-sans', 'poppins', 'nunito', 'oswald'] as const;

export type FontId = (typeof FONT_IDS)[number];

export const FONT_LABELS: Record<FontId, string> = {
  'days-one': 'Days One',
  outfit: 'Outfit',
  inter: 'Inter',
  playfair: 'Playfair Display',
  'dm-sans': 'DM Sans',
  poppins: 'Poppins',
  nunito: 'Nunito',
  oswald: 'Oswald',
};

/** Valor CSS de cada tipografía; la variable la declara fonts.ts en la raíz de la tienda. */
export function fontCssVar(id: FontId): string {
  return `var(--sf-font-${id})`;
}
