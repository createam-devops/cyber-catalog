// Datos estructurados (schema.org en JSON-LD) de la vitrina: le dicen a Google
// qué es la tienda y qué vende cada producto (precio, stock, fotos), para que
// pueda mostrarlos con precio y disponibilidad en los resultados.

import type { TenantConfig } from '@/lib/types';
import type { StoreProduct } from './catalog';
import { normalizeWhatsapp, socialUrl } from './public-store';

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

export function storeJsonLd(tenant: TenantConfig, origin: string) {
  const phone = normalizeWhatsapp(tenant.whatsapp);
  const sameAs = (['instagram', 'facebook', 'tiktok'] as const).map((network) => socialUrl(network, tenant.socialMedia?.[network])).filter(Boolean);
  const logo = absoluteUrl(tenant.logo, origin);
  const image = absoluteUrl(tenant.heroSlides?.find((slide) => slide.image)?.image, origin) ?? logo;
  return {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: tenant.name,
    url: `${origin}/`,
    ...(logo ? { logo } : {}),
    ...(image ? { image } : {}),
    ...(tenant.seoDescription?.trim() ? { description: tenant.seoDescription.trim() } : {}),
    ...(phone ? { telephone: `+${phone}` } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function productJsonLd(product: StoreProduct, tenant: TenantConfig, origin: string, categoryLabel?: string) {
  const url = `${origin}/product/${encodeURIComponent(product.id)}`;
  const images = product.imageUrls.map((image) => absoluteUrl(image, origin)).filter(Boolean);
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    url,
    ...(product.description?.trim() ? { description: product.description.trim().slice(0, 5000) } : {}),
    ...(images.length ? { image: images } : {}),
    ...(categoryLabel ? { category: categoryLabel } : {}),
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'PEN',
      price: product.price.toFixed(2),
      availability: product.stock === 0 ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: tenant.name },
    },
  };
}

/** JSON para un <script type="application/ld+json">, sin forma de cerrar la etiqueta desde los datos. */
export function jsonLdHtml(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
