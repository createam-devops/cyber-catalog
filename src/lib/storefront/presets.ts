// Estilos base de la vitrina. Un estilo fija la forma (tipografías, curvas,
// mayúsculas, pie de página); los colores y los textos van aparte. Colores
// planos en todos: nada de degradados.

import type { FontId } from './font-ids';

export const STYLE_PRESET_IDS = ['moderno', 'minimal', 'clasico', 'vibrante'] as const;
export type StylePresetId = (typeof STYLE_PRESET_IDS)[number];

export const CARD_STYLES = ['soft', 'flat', 'outlined'] as const;
export type CardStyle = (typeof CARD_STYLES)[number];

export const FOOTER_STYLES = ['dark', 'light', 'brand'] as const;
export type FooterStyle = (typeof FOOTER_STYLES)[number];

export interface StylePreset {
  id: StylePresetId;
  label: string;
  description: string;
  fonts: { heading: FontId; body: FontId };
  /** Curvas de tarjetas, botones, portada y chips de categoría. */
  radius: { card: string; button: string; hero: string; chip: string };
  headingTransform: 'uppercase' | 'none';
  headingTracking: string;
  cardStyle: CardStyle;
  footer: FooterStyle;
  /** Oscurecimiento sobre las fotos de la portada para que el texto se lea (0 a 1). */
  heroOverlay: number;
}

export const STYLE_PRESETS: Record<StylePresetId, StylePreset> = {
  moderno: {
    id: 'moderno',
    label: 'Moderno',
    description: 'Títulos en mayúsculas, botones redondos y tarjetas suaves.',
    fonts: { heading: 'days-one', body: 'outfit' },
    radius: { card: '1rem', button: '9999px', hero: '2.5rem', chip: '9999px' },
    headingTransform: 'uppercase',
    headingTracking: '0.04em',
    cardStyle: 'soft',
    footer: 'dark',
    heroOverlay: 0.45,
  },
  minimal: {
    id: 'minimal',
    label: 'Minimal',
    description: 'Limpio y ordenado: esquinas rectas, bordes finos, mucho blanco.',
    fonts: { heading: 'inter', body: 'inter' },
    radius: { card: '0.375rem', button: '0.375rem', hero: '0', chip: '0.375rem' },
    headingTransform: 'none',
    headingTracking: '-0.01em',
    cardStyle: 'outlined',
    footer: 'light',
    heroOverlay: 0.4,
  },
  clasico: {
    id: 'clasico',
    label: 'Clásico',
    description: 'Títulos con serifa, elegante y sobrio.',
    fonts: { heading: 'playfair', body: 'dm-sans' },
    radius: { card: '0.25rem', button: '0.25rem', hero: '0', chip: '9999px' },
    headingTransform: 'none',
    headingTracking: '0',
    cardStyle: 'flat',
    footer: 'dark',
    heroOverlay: 0.35,
  },
  vibrante: {
    id: 'vibrante',
    label: 'Vibrante',
    description: 'Letras gruesas, curvas amplias y el color de tu marca en todas partes.',
    fonts: { heading: 'poppins', body: 'nunito' },
    radius: { card: '1.5rem', button: '9999px', hero: '2rem', chip: '9999px' },
    headingTransform: 'none',
    headingTracking: '-0.02em',
    cardStyle: 'soft',
    footer: 'brand',
    heroOverlay: 0.5,
  },
};
