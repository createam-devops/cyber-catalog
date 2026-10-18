import type { StorefrontSettings } from '@shared/storefront/theme';
import type { StoreCatalog } from '@shared/storefront/catalog';

export interface HeroSlide {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  buttonText: string;
  order?: number;
}

export interface StoreSnapshot {
  id: string;
  name: string;
  status: string;
  plan: string;
  logo: string;
  colors: { primary?: string; secondary?: string; accent?: string } | null;
  primaryColor: string | null;
  heroSlides: HeroSlide[];
  whatsapp: string;
  socialMedia: { instagram?: string; facebook?: string; tiktok?: string };
  storefront: StorefrontSettings;
  subdomain: string | null;
  domain: string | null;
  seoTitle: string;
  seoDescription: string;
}

export interface StoreResponse {
  canManage: boolean;
  store: StoreSnapshot;
  storeUrl: string | null;
  /** /vista-previa en el dominio del catálogo (va en un iframe, no por el proxy del ERP). */
  previewUrl: string;
  platformDomain: string;
  features: { customDomain: boolean; socialMedia: boolean; stock: boolean; seo: boolean; analytics: boolean };
  limits: { products: number | null; categories: number | null; heroSlides: number; imagesPerProduct: number };
}

export interface StatsResponse {
  products: number | null;
  views: number;
  whatsappClicks: number;
}

export type PreviewCatalog = StoreCatalog;

/** Lo que la persona edita. Se guarda solo lo que cambió respecto del original. */
export interface Draft {
  name: string;
  logo: string;
  colors: { primary: string; secondary: string; accent: string };
  storefront: StorefrontSettings;
  heroSlides: HeroSlide[];
  whatsapp: string;
  socialMedia: { instagram: string; facebook: string; tiktok: string };
  subdomain: string;
  domain: string;
  seoTitle: string;
  seoDescription: string;
}

export function toDraft(store: StoreSnapshot, resolvedColors: { primary: string; secondary: string; accent: string }, platformDomain: string): Draft {
  return {
    name: store.name,
    logo: store.logo,
    colors: resolvedColors,
    storefront: store.storefront ?? {},
    heroSlides: store.heroSlides ?? [],
    whatsapp: store.whatsapp,
    socialMedia: {
      instagram: store.socialMedia?.instagram ?? '',
      facebook: store.socialMedia?.facebook ?? '',
      tiktok: store.socialMedia?.tiktok ?? '',
    },
    subdomain: store.subdomain ?? '',
    // Solo un dominio propio; el subdominio de la plataforma se edita aparte.
    domain: store.domain && !store.domain.endsWith(`.${platformDomain}`) ? store.domain : '',
    seoTitle: store.seoTitle,
    seoDescription: store.seoDescription,
  };
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Quita claves vacías para guardar solo lo que la tienda cambió. */
function compact<T extends object>(obj: T | undefined): T | undefined {
  if (!obj) return undefined;
  const entries = Object.entries(obj).filter(([, v]) => v !== undefined && !(typeof v === 'object' && v !== null && !Array.isArray(v) && Object.keys(v).length === 0));
  return entries.length ? (Object.fromEntries(entries) as T) : undefined;
}

/** Cuerpo del PATCH: solo los campos que cambiaron. */
export function diffDraft(original: Draft, draft: Draft): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  if (draft.name.trim() !== original.name) patch.name = draft.name.trim();
  if (draft.logo !== original.logo) patch.logo = draft.logo;
  if (!same(draft.colors, original.colors)) {
    patch.colors = draft.colors;
    patch.primaryColor = draft.colors.primary;
  }
  if (!same(draft.storefront, original.storefront)) {
    const s = draft.storefront;
    patch.storefront =
      compact({
        rubro: s.rubro,
        style: s.style,
        colors: compact(s.colors),
        fonts: compact(s.fonts),
        layout: compact(s.layout),
        content: compact(s.content),
        categoryIcons: compact(s.categoryIcons),
      }) ?? {};
  }
  if (!same(draft.heroSlides, original.heroSlides)) patch.heroSlides = draft.heroSlides.map((slide, order) => ({ ...slide, order }));
  if (draft.whatsapp.trim() !== original.whatsapp) patch.whatsapp = draft.whatsapp.trim();
  if (!same(draft.socialMedia, original.socialMedia)) patch.socialMedia = draft.socialMedia;
  if (draft.subdomain !== original.subdomain) patch.subdomain = draft.subdomain;
  if (draft.domain.trim() !== original.domain) patch.domain = draft.domain.trim() || null;
  if (draft.seoTitle !== original.seoTitle) patch.seoTitle = draft.seoTitle;
  if (draft.seoDescription !== original.seoDescription) patch.seoDescription = draft.seoDescription;
  return patch;
}
