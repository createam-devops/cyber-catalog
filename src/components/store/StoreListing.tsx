import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ModernStoreHome from '@/components/store/modern/ModernStoreHome';
import CartProviderWrapper from '@/components/store/CartProviderWrapper';
import StorefrontRoot from '@/components/store/StorefrontRoot';
import StoreUnavailable from '@/components/store/StoreUnavailable';
import { findStoreByDomain, getStoreCatalog, storeAdminUrl, storefrontAvailability } from '@/lib/server/storefront-data';
import { isAppNotEnabled } from '@/lib/server/erp/client';
import { withRatings } from '@/lib/server/reviews';
import { FULL_CATALOG_THRESHOLD, categoryPath, type StoreCatalog } from '@/lib/storefront/catalog';
import { toPublicStore } from '@/lib/storefront/public-store';
import { resolveStorefront } from '@/lib/storefront/theme';
import {
  absoluteUrl,
  breadcrumbJsonLd,
  defaultStoreDescription,
  defaultStoreTitle,
  faqJsonLd,
  itemListJsonLd,
  jsonLdHtml,
  storeJsonLd,
  websiteJsonLd,
} from '@/lib/storefront/structured-data';

/**
 * Portada de la tienda o página de una de sus categoría (/categoria/<slug>).
 * Las dos se arman igual en el servidor: productos ya dibujados (Google los lee
 * sin JavaScript) y sus datos estructurados.
 */
export default async function StoreListing({ domain, query = '', categorySlug }: { domain: string; query?: string; categorySlug?: string }) {
  const tenant = await findStoreByDomain(domain);
  const availability = storefrontAvailability(tenant);
  if (!tenant || availability !== 'open') {
    return <StoreUnavailable reason={availability === 'open' ? 'missing' : availability} storeName={tenant?.name} />;
  }

  let catalog: StoreCatalog;
  try {
    catalog = await getStoreCatalog(tenant);
  } catch (error) {
    // El plan del negocio en el ERP ya no incluye el catálogo: tienda en pausa, no una falla.
    if (isAppNotEnabled(error)) return <StoreUnavailable reason="paused" storeName={tenant.name} />;
    throw error;
  }

  const category = categorySlug ? catalog.categories.find((c) => c.slug === categorySlug) : undefined;
  if (categorySlug && !category) notFound();

  // Con el promedio de sus opiniones aprobadas (estrellas en las tarjetas).
  const products = withRatings(tenant.id, category ? catalog.products.filter((p) => p.category === category.id) : catalog.products);
  const total = products.length;
  const initialProducts = total <= FULL_CATALOG_THRESHOLD ? products : products.slice(0, 24);
  const theme = resolveStorefront(tenant);
  const origin = `https://${domain}`;

  const jsonLd = category
    ? [
        breadcrumbJsonLd([
          { name: tenant.name, url: `${origin}/` },
          { name: category.label, url: `${origin}${categoryPath(category)}` },
        ]),
        itemListJsonLd(products, origin, category.label),
      ]
    : [
        storeJsonLd(tenant, origin, defaultStoreDescription(tenant, theme, catalog.categories)),
        websiteJsonLd(tenant, origin),
        itemListJsonLd(products, origin, theme.content.productsTitle),
        ...(theme.faq.length ? [faqJsonLd(theme.faq)] : []),
      ];

  return (
    <StorefrontRoot store={{ ...toPublicStore(tenant), adminUrl: storeAdminUrl(tenant) }} categories={catalog.categories}>
      {jsonLd.map((data, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(data) }} />
      ))}
      <CartProviderWrapper storeId={tenant.id}>
        <ModernStoreHome
          initialProducts={initialProducts}
          total={total}
          domain={domain}
          initialQuery={query.slice(0, 80)}
          category={category ? { id: category.id, label: category.label } : undefined}
        />
      </CartProviderWrapper>
    </StorefrontRoot>
  );
}

export async function storeListingMetadata(domain: string | undefined, categorySlug?: string): Promise<Metadata> {
  const tenant = domain ? await findStoreByDomain(domain) : null;
  if (!domain || !tenant || storefrontAvailability(tenant) === 'missing') {
    return { title: 'Tienda no encontrada', robots: { index: false } };
  }

  const theme = resolveStorefront(tenant);
  const catalog = await getStoreCatalog(tenant).catch(() => ({ products: [], categories: [] }) as StoreCatalog);
  const origin = `https://${domain}`;
  const category = categorySlug ? catalog.categories.find((c) => c.slug === categorySlug) : undefined;
  if (categorySlug && !category) return { title: 'Página no encontrada', robots: { index: false } };

  let title: string;
  let description: string;
  let url: string;
  let image: string | undefined;
  if (category) {
    const count = catalog.products.filter((p) => p.category === category.id).length;
    title = `${category.label} | ${tenant.name}`;
    description = `${count} ${count === 1 ? 'producto' : 'productos'} de ${category.label.toLowerCase()} en ${tenant.name}, con precios y fotos. Elige y haz tu pedido por WhatsApp.`;
    url = `${origin}${categoryPath(category)}`;
    image = absoluteUrl(catalog.products.find((p) => p.category === category.id && p.imageUrls[0])?.imageUrls[0], origin);
  } else {
    title = defaultStoreTitle(tenant, theme);
    description = defaultStoreDescription(tenant, theme, catalog.categories);
    url = `${origin}/`;
    // Las imágenes guardadas en el catálogo son relativas (/media/...): se completan con el dominio de la tienda.
    image = absoluteUrl(tenant.heroSlides?.find((s) => s.image)?.image || tenant.logo, origin);
  }

  return {
    metadataBase: new URL(origin),
    // Sin la plantilla del sitio: el título ya trae el nombre de la tienda.
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      siteName: tenant.name,
      title,
      description,
      locale: 'es_PE',
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: { card: image ? 'summary_large_image' : 'summary', title, description },
  };
}
