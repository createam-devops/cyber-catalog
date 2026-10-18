// Vista previa del diseño en el panel. El panel dibuja la vitrina dentro de un
// iframe (/vista-previa) y le pasa por postMessage lo que debe mostrar: la
// tienda con el diseño en borrador y sus productos (o los de muestra del rubro).
// La página del iframe no pide nada por su cuenta.

import type { StoreCatalog, StoreProduct } from './catalog';
import type { PublicStore, StoreCategory } from './public-store';
import { RUBROS, type RubroId } from './rubros';

export const PREVIEW_PATH = '/vista-previa';

/**
 * Quién puede mandarle el borrador a la vista previa: el propio catálogo (su
 * panel) y el ERP, que la encuadra en el editor <catalog-panel>
 * (cyberERP/PETICION_ERP_AL_CATALOGO_PANEL.md §6). Debe coincidir con el
 * frame-ancestors de /vista-previa en next.config.mjs.
 */
export const PREVIEW_PARENT_ORIGINS = ['https://app-dev.createam.cloud', 'https://cyberposapp.createam.cloud'];

export function isAllowedPreviewParent(origin: string, ownOrigin: string, allowLocalhost: boolean): boolean {
  if (origin === ownOrigin || PREVIEW_PARENT_ORIGINS.includes(origin)) return true;
  return allowLocalhost && /^http:\/\/localhost(:\d+)?$/.test(origin);
}
export const PREVIEW_MESSAGE = 'createam:storefront-preview';
export const PREVIEW_READY = 'createam:storefront-preview-ready';

export interface PreviewPayload {
  store: PublicStore;
  products: StoreProduct[];
  categories: StoreCategory[];
}

/** Productos y categorías de muestra del rubro, para tiendas que aún no cargan los suyos. */
export function sampleCatalog(rubroId: RubroId): StoreCatalog {
  const rubro = RUBROS[rubroId] ?? RUBROS.general;
  const products: StoreProduct[] = rubro.sampleProducts.map((p, i) => ({
    id: `muestra-${i + 1}`,
    name: p.name,
    price: p.price,
    category: p.category,
    imageUrls: [],
    featured: i === 0,
    stock: null,
  }));
  const used = new Set(products.map((p) => p.category));
  const categories = rubro.categories
    .filter((c) => used.has(c.value))
    .map((c) => ({ id: c.value, label: c.label, icon: c.icon }));
  return { products, categories };
}
