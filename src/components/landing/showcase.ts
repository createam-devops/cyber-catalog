import { findStoreByDomain, getStoreCatalog, storefrontAvailability } from "@/lib/server/storefront-data";
import { categoryPath, productPath } from "@/lib/storefront/catalog";

/**
 * Los productos de la tienda de Createam (equipos POS) para la sección
 * «Explora productos» de la portada. Salen del mismo catálogo que la tienda,
 * con enlaces a sus fichas: así Google llega a ellas desde createam.cloud.
 */
export const SHOWCASE_DOMAIN = "catalogo.createam.cloud";
export const SHOWCASE_URL = `https://${SHOWCASE_DOMAIN}`;

export interface ShowcaseProduct {
  id: string;
  name: string;
  href: string;
  image: string;
  price: number;
  compareAtPrice: number | null;
  category?: string;
}

export interface Showcase {
  products: ShowcaseProduct[];
  categories: Array<{ label: string; href: string }>;
}

/** Lo más que la portada espera a la tienda; si tarda más, sale sin la sección y la próxima visita ya la trae. */
const SHOWCASE_TIMEOUT_MS = 1500;

/** Sin tienda, sin productos, si algo falla o si tarda, la portada se muestra sin la sección. */
export function getShowcase(limit = 8): Promise<Showcase | null> {
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), SHOWCASE_TIMEOUT_MS));
  return Promise.race([loadShowcase(limit), timeout]);
}

async function loadShowcase(limit: number): Promise<Showcase | null> {
  try {
    const tenant = await findStoreByDomain(SHOWCASE_DOMAIN);
    if (!tenant || storefrontAvailability(tenant) !== "open") return null;
    const catalog = await getStoreCatalog(tenant);
    const labels = new Map(catalog.categories.map((c) => [c.id, c.label]));
    const now = Date.now();

    const products = [...catalog.products]
      .filter((p) => p.imageUrls[0])
      // Los destacados primero; el resto en el orden de la tienda.
      .sort((a, b) => Number(b.featured) - Number(a.featured))
      .slice(0, limit)
      .map((p) => {
        const onSale = p.compareAtPrice && p.compareAtPrice > p.price && !(p.saleEndsAt && Date.parse(p.saleEndsAt) <= now);
        return {
          id: p.id,
          name: p.name,
          href: `${SHOWCASE_URL}${productPath(p)}`,
          image: p.imageUrls[0],
          price: p.price,
          compareAtPrice: onSale ? p.compareAtPrice! : null,
          category: labels.get(p.category),
        };
      });
    if (!products.length) return null;

    return {
      products,
      categories: catalog.categories.map((c) => ({ label: c.label, href: `${SHOWCASE_URL}${categoryPath(c)}` })),
    };
  } catch (error) {
    console.error("[landing] No se pudo leer la tienda de Createam para «Explora productos».", error);
    return null;
  }
}
