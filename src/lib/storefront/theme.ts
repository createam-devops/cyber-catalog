// El tema de una vitrina = estilo base + rubro + lo que la tienda personalizó.
// La tienda guarda solo sus cambios (`storefront` en su documento); todo lo
// demás sale del estilo y del rubro elegidos. Una tienda sin `storefront`
// (las creadas antes de esto) se ve con el estilo Moderno y textos neutros.

import { hexToRgbChannels, mixHex, normalizeHex, readableTextOn } from './color';
import { CONTENT_KEYS, type StorefrontContent } from './content';
import { fontCssVar, type FontId } from './font-ids';
import { STYLE_PRESETS, type CardStyle, type FooterStyle, type StylePreset, type StylePresetId } from './presets';
import { RUBROS, type RubroId } from './rubros';

export const HERO_MODES = ['carousel', 'banner', 'none'] as const;
export type HeroMode = (typeof HERO_MODES)[number];

export const GRID_COLUMNS = [3, 4] as const;
export type GridColumns = (typeof GRID_COLUMNS)[number];

/** Lo que guarda la tienda en `tenants/{id}.storefront`. Todo es opcional. */
export interface StorefrontSettings {
  rubro?: RubroId;
  style?: StylePresetId;
  /** Fondo y texto de la página. Los colores de marca van en `tenant.colors`. */
  colors?: { background?: string; text?: string };
  fonts?: { heading?: FontId; body?: FontId };
  layout?: {
    hero?: HeroMode;
    gridColumns?: GridColumns;
    cardStyle?: CardStyle;
    footer?: FooterStyle;
    showStock?: boolean;
  };
  content?: Partial<StorefrontContent>;
  /**
   * Ícono elegido por la tienda para cada categoría del ERP (id → nombre de
   * STOREFRONT_ICONS). Sin elegir, se sugiere uno por el nombre.
   */
  categoryIcons?: Record<string, string>;
}

/** Lo mínimo de una tienda que hace falta para armar su tema. */
export interface ThemeSource {
  colors?: { primary?: string; secondary?: string; accent?: string } | null;
  primaryColor?: string | null;
  storefront?: StorefrontSettings | null;
}

export interface ResolvedStorefront {
  rubro: RubroId;
  style: StylePresetId;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    /** Texto que se lee sobre el color principal (blanco u oscuro). */
    onPrimary: string;
    onSecondary: string;
  };
  fonts: { heading: FontId; body: FontId };
  radius: StylePreset['radius'];
  headingTransform: StylePreset['headingTransform'];
  headingTracking: string;
  heroOverlay: number;
  layout: {
    hero: HeroMode;
    gridColumns: GridColumns;
    cardStyle: CardStyle;
    footer: FooterStyle;
    showStock: boolean;
  };
  content: StorefrontContent;
}

export function resolveStorefront(source: ThemeSource): ResolvedStorefront {
  const settings = source.storefront ?? {};
  const rubro = RUBROS[settings.rubro ?? 'general'] ?? RUBROS.general;
  const style = STYLE_PRESETS[settings.style ?? rubro.suggestedStyle] ?? STYLE_PRESETS.moderno;

  const primary = normalizeHex(source.colors?.primary ?? source.primaryColor, rubro.palette.primary);
  const secondary = normalizeHex(source.colors?.secondary, rubro.palette.secondary);
  const accent = normalizeHex(source.colors?.accent, rubro.palette.accent);
  const background = normalizeHex(settings.colors?.background, '#ffffff');
  const text = normalizeHex(settings.colors?.text, '#111827');

  const content = { ...rubro.content };
  for (const key of CONTENT_KEYS) {
    const value = settings.content?.[key];
    // Una cadena vacía también cuenta: así la tienda puede ocultar un texto.
    if (typeof value === 'string') content[key] = value;
  }

  return {
    rubro: rubro.id,
    style: style.id,
    colors: {
      primary,
      secondary,
      accent,
      background,
      text,
      onPrimary: readableTextOn(primary),
      onSecondary: readableTextOn(secondary),
    },
    fonts: {
      heading: settings.fonts?.heading ?? style.fonts.heading,
      body: settings.fonts?.body ?? style.fonts.body,
    },
    radius: style.radius,
    headingTransform: style.headingTransform,
    headingTracking: style.headingTracking,
    heroOverlay: style.heroOverlay,
    layout: {
      hero: settings.layout?.hero ?? 'carousel',
      gridColumns: settings.layout?.gridColumns ?? 4,
      cardStyle: settings.layout?.cardStyle ?? style.cardStyle,
      footer: settings.layout?.footer ?? style.footer,
      showStock: settings.layout?.showStock ?? false,
    },
    content,
  };
}

const SERIF_FONTS: FontId[] = ['playfair'];

function fontStack(id: FontId): string {
  return `${fontCssVar(id)}, ${SERIF_FONTS.includes(id) ? 'Georgia, serif' : 'system-ui, sans-serif'}`;
}

/**
 * Variables CSS del tema. Van en la raíz de la tienda; los componentes las usan
 * con las utilidades `sf-*` de Tailwind (ver tailwind.config.ts). `--font-heading`
 * y `--font-body` pisan las globales, así que los h1/h2/h3 toman la tipografía
 * de la tienda sin tocarlos uno por uno.
 */
export function storefrontCssVars(theme: ResolvedStorefront): Record<string, string> {
  const { colors } = theme;
  return {
    '--sf-primary': colors.primary,
    '--sf-primary-rgb': hexToRgbChannels(colors.primary),
    '--sf-on-primary': colors.onPrimary,
    '--sf-secondary': colors.secondary,
    '--sf-secondary-rgb': hexToRgbChannels(colors.secondary),
    '--sf-on-secondary': colors.onSecondary,
    '--sf-accent': colors.accent,
    '--sf-accent-rgb': hexToRgbChannels(colors.accent),
    '--sf-bg': colors.background,
    '--sf-bg-rgb': hexToRgbChannels(colors.background),
    '--sf-text': colors.text,
    '--sf-text-rgb': hexToRgbChannels(colors.text),
    '--sf-surface': mixHex(colors.text, colors.background, 0.04),
    '--sf-border': mixHex(colors.text, colors.background, 0.12),
    '--sf-muted': mixHex(colors.text, colors.background, 0.6),
    '--sf-radius-card': theme.radius.card,
    '--sf-radius-btn': theme.radius.button,
    '--sf-radius-hero': theme.radius.hero,
    '--sf-radius-chip': theme.radius.chip,
    '--sf-heading-transform': theme.headingTransform,
    '--sf-heading-tracking': theme.headingTracking,
    '--font-heading': fontStack(theme.fonts.heading),
    '--font-body': fontStack(theme.fonts.body),
  };
}
