// Datos estructurados (schema.org en JSON-LD) de la vitrina: le dicen a Google
// (y a los asistentes de IA) qué es la tienda, qué vende cada producto (precio,
// stock, fotos), cómo se navega y qué preguntas responde, para que puedan
// mostrarlo con precio, ruta y respuestas en los resultados.

import type { TenantConfig } from '@/lib/types';
import { productPath, type StoreProduct } from './catalog';
import { normalizeWhatsapp, socialUrl, type StoreCategory } from './public-store';
import { RUBROS } from './rubros';
import type { ResolvedStorefront, StoreFaq } from './theme';

/** URL absoluta: las imágenes guardadas en el catálogo son relativas (/media/...). */
export function absoluteUrl(url: string | null | undefined, origin: string): string | undefined {
  const value = url?.trim();
  if (!value) return undefined;
  try {
    return new URL(value, origin).toString();
  } catch {
    return undefined;
  }
}

const storeId = (origin: string) => `${origin}/#store`;

// --- Títulos y descripciones por defecto (si la tienda no escribió los suyos).

/** Qué vende la tienda, en pocas palabras: su rubro, o una frase neutra. */
export function storeTagline(theme: ResolvedStorefront): string {
  return theme.rubro === 'general' ? 'Catálogo y pedidos por WhatsApp' : RUBROS[theme.rubro].label;
}

/** «Ramos, Cajas y Cuadros» (hasta 5). */
export function categoryList(categories: StoreCategory[], max = 5): string {
  const labels = categories.slice(0, max).map((c) => c.label);
  if (labels.length <= 1) return labels.join('');
  return `${labels.slice(0, -1).join(', ')} y ${labels[labels.length - 1]}`;
}

export function defaultStoreTitle(tenant: TenantConfig, theme: ResolvedStorefront): string {
  return tenant.seoTitle?.trim() || `${tenant.name} | ${storeTagline(theme)}`;
}

export function defaultStoreDescription(tenant: TenantConfig, theme: ResolvedStorefront, categories: StoreCategory[]): string {
  if (tenant.seoDescription?.trim()) return tenant.seoDescription.trim();
  const list = categoryList(categories);
  return [theme.content.heroTitle, list, `Mira el catálogo de ${tenant.name} y haz tu pedido por WhatsApp.`]
    .filter(Boolean)
    .join('. ')
    .replace(/\.\./g, '.')
    .slice(0, 200);
}

// --- Bloques JSON-LD.

export function storeJsonLd(tenant: TenantConfig, origin: string, description?: string) {
  const phone = normalizeWhatsapp(tenant.whatsapp);
  const sameAs = (['instagram', 'facebook', 'tiktok'] as const).map((network) => socialUrl(network, tenant.socialMedia?.[network])).filter(Boolean);
  const logo = absoluteUrl(tenant.logo, origin);
  const image = absoluteUrl(tenant.heroSlides?.find((slide) => slide.image)?.image, origin) ?? logo;
  const about = tenant.seoDescription?.trim() || description;
  return {
    '@context': 'https://schema.org',
    '@type': 'Store',
    '@id': storeId(origin),
    name: tenant.name,
    url: `${origin}/`,
    ...(logo ? { logo } : {}),
    ...(image ? { image } : {}),
    ...(about ? { description: about } : {}),
    ...(phone ? { telephone: `+${phone}` } : {}),
    ...(sameAs.length ? { sameAs } : {}),
    currenciesAccepted: 'PEN',
  };
}

/** El sitio, con su buscador: Google puede mostrar la caja de búsqueda de la tienda. */
export function websiteJsonLd(tenant: TenantConfig, origin: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: tenant.name,
    url: `${origin}/`,
    inLanguage: 'es-PE',
    publisher: { '@id': storeId(origin) },
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${origin}/?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };
}

/** Los productos de una página (portada o categoría), en orden. */
export function itemListJsonLd(products: StoreProduct[], origin: string, name: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: products.length,
    itemListElement: products.slice(0, 50).map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${origin}${productPath(product)}`,
      name: product.name,
    })),
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name, item: item.url })),
  };
}

/** Solo con preguntas visibles en la página (lo exige Google). */
export function faqJsonLd(faq: StoreFaq[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };
}

export function productJsonLd(product: StoreProduct, tenant: TenantConfig, origin: string, categoryLabel?: string) {
  const url = `${origin}${productPath(product)}`;
  const images = product.imageUrls.map((image) => absoluteUrl(image, origin)).filter(Boolean);
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    url,
    sku: product.id,
    brand: { '@type': 'Brand', name: tenant.name },
    ...(product.description?.trim() ? { description: product.description.trim().slice(0, 5000) } : {}),
    ...(images.length ? { image: images } : {}),
    ...(categoryLabel ? { category: categoryLabel } : {}),
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'PEN',
      price: product.price.toFixed(2),
      // Oferta con fecha: Google muestra hasta cuándo vale el precio.
      ...(product.saleEndsAt ? { priceValidUntil: product.saleEndsAt.slice(0, 10) } : {}),
      // Sin control de stock, la tienda lo vende: disponible. Con stock en cero, agotado.
      availability: product.stock !== null && product.stock <= 0 ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@id': storeId(origin) },
    },
  };
}

/** JSON para un <script type="application/ld+json">, sin forma de cerrar la etiqueta desde los datos. */
export function jsonLdHtml(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
