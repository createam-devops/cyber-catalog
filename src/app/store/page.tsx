import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ModernStoreHome from "@/components/store/modern/ModernStoreHome";
import CartProviderWrapper from "@/components/store/CartProviderWrapper";
import StorefrontRoot from "@/components/store/StorefrontRoot";
import StoreUnavailable from "@/components/store/StoreUnavailable";
import { findStoreByDomain, getStoreCatalog, storeAdminUrl, storefrontAvailability } from "@/lib/server/storefront-data";
import { isAppNotEnabled } from "@/lib/server/erp/client";
import { FULL_CATALOG_THRESHOLD } from "@/lib/storefront/catalog";
import { toPublicStore } from "@/lib/storefront/public-store";
import { resolveStorefront } from "@/lib/storefront/theme";
import { absoluteUrl, jsonLdHtml, storeJsonLd } from "@/lib/storefront/structured-data";

// El dominio llega como parámetro: la página se arma en cada visita, pero el
// catálogo sale de la caché en memoria de storefront-data (como mucho una
// consulta a la base por minuto y por tienda).
export const dynamic = 'force-dynamic';

interface StorePageProps {
  searchParams: { _domain?: string; q?: string };
}

export default async function StorePage({ searchParams }: StorePageProps) {
  const domain = searchParams._domain;
  if (!domain) {
    return notFound();
  }

  const tenant = await findStoreByDomain(domain);
  const availability = storefrontAvailability(tenant);
  if (!tenant || availability !== 'open') {
    return <StoreUnavailable reason={availability === 'open' ? 'missing' : availability} storeName={tenant?.name} />;
  }

  let catalog;
  try {
    catalog = await getStoreCatalog(tenant);
  } catch (error) {
    // El plan del negocio en el ERP ya no incluye el catálogo: tienda en pausa, no una falla.
    if (isAppNotEnabled(error)) return <StoreUnavailable reason="paused" storeName={tenant.name} />;
    throw error;
  }
  const total = catalog.products.length;
  const initialProducts = total <= FULL_CATALOG_THRESHOLD ? catalog.products : catalog.products.slice(0, 24);

  return (
    <StorefrontRoot store={{ ...toPublicStore(tenant), adminUrl: storeAdminUrl(tenant) }} categories={catalog.categories}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(storeJsonLd(tenant, `https://${domain}`)) }} />
      <CartProviderWrapper storeId={tenant.id}>
        <ModernStoreHome
          initialProducts={initialProducts}
          total={total}
          domain={domain}
          initialQuery={typeof searchParams.q === 'string' ? searchParams.q.slice(0, 80) : ''}
        />
      </CartProviderWrapper>
    </StorefrontRoot>
  );
}

export async function generateMetadata({ searchParams }: StorePageProps): Promise<Metadata> {
  const domain = searchParams._domain;
  const tenant = domain ? await findStoreByDomain(domain) : null;

  if (!tenant || storefrontAvailability(tenant) === 'missing') {
    return { title: 'Tienda no encontrada', robots: { index: false } };
  }

  const theme = resolveStorefront(tenant);
  const title = tenant.seoTitle?.trim() || tenant.name;
  const description =
    tenant.seoDescription?.trim() ||
    [theme.content.heroTitle, `Mira el catálogo de ${tenant.name} y haz tu pedido por WhatsApp.`].filter(Boolean).join('. ');
  // Las imágenes guardadas en el catálogo son relativas (/media/...): se completan con el dominio de la tienda.
  const image = absoluteUrl(tenant.heroSlides?.find((s) => s.image)?.image || tenant.logo, `https://${domain}`);
  const url = `https://${domain}/`;

  return {
    metadataBase: new URL(`https://${domain}`),
    title,
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
