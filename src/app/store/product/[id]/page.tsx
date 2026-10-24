import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import ModernProductDetail from "@/components/store/modern/ModernProductDetail";
import CartProviderWrapper from "@/components/store/CartProviderWrapper";
import StorefrontRoot from "@/components/store/StorefrontRoot";
import StoreUnavailable from "@/components/store/StoreUnavailable";
import { findStoreByDomain, getStoreCatalog, storeAdminUrl, storefrontAvailability } from "@/lib/server/storefront-data";
import { isAppNotEnabled } from "@/lib/server/erp/client";
import { formatPrice, toPublicStore } from "@/lib/storefront/public-store";
import { categoryPath, productPath, type StoreCatalog, type StoreProduct } from "@/lib/storefront/catalog";
import { absoluteUrl, breadcrumbJsonLd, jsonLdHtml, productJsonLd } from "@/lib/storefront/structured-data";

export const dynamic = 'force-dynamic';

interface StoreProductPageProps {
  params: { id: string };
  searchParams: { _domain?: string };
}

/** Hasta 4 productos de la misma categoría; si no alcanzan, se completa con los más nuevos. */
function relatedTo(product: StoreProduct, catalog: StoreCatalog, count = 4): StoreProduct[] {
  const others = catalog.products.filter((p) => p.id !== product.id);
  const sameCategory = others.filter((p) => p.category === product.category);
  const rest = others.filter((p) => p.category !== product.category);
  return [...sameCategory, ...rest].slice(0, count);
}

async function load(domain: string | undefined, id: string) {
  if (!domain) return null;
  const tenant = await findStoreByDomain(domain);
  const availability = storefrontAvailability(tenant);
  if (!tenant || availability !== 'open') return { tenant, availability, catalog: null, product: null };
  let catalog: StoreCatalog;
  try {
    catalog = await getStoreCatalog(tenant);
  } catch (error) {
    // El plan del negocio en el ERP ya no incluye el catálogo: tienda en pausa.
    if (isAppNotEnabled(error)) return { tenant, availability: 'paused' as const, catalog: null, product: null };
    throw error;
  }
  // La ficha vive en /product/<slug>; por número (enlaces viejos) también se encuentra.
  const product = catalog.products.find((p) => p.slug === id) ?? catalog.products.find((p) => p.id === id) ?? null;
  return { tenant, availability, catalog, product };
}

export default async function StoreProductPage({ params, searchParams }: StoreProductPageProps) {
  const data = await load(searchParams._domain, params.id);
  if (!data) return notFound();

  const { tenant, availability, catalog, product } = data;
  if (!tenant || availability !== 'open') {
    return <StoreUnavailable reason={availability === 'open' ? 'missing' : availability} storeName={tenant?.name} />;
  }
  if (!catalog || !product) {
    return notFound();
  }
  // Entró por el número o por otra forma del slug: a su dirección única (301 para Google).
  if (productPath(product) !== `/product/${encodeURIComponent(params.id)}`) {
    permanentRedirect(productPath(product));
  }

  const origin = `https://${searchParams._domain}`;
  const category = catalog.categories.find((c) => c.id === product.category);
  const jsonLd = [
    productJsonLd(product, tenant, origin, category?.label),
    breadcrumbJsonLd([
      { name: tenant.name, url: `${origin}/` },
      ...(category ? [{ name: category.label, url: `${origin}${categoryPath(category)}` }] : []),
      { name: product.name, url: `${origin}${productPath(product)}` },
    ]),
  ];

  return (
    <StorefrontRoot store={{ ...toPublicStore(tenant), adminUrl: storeAdminUrl(tenant) }} categories={catalog.categories}>
      {jsonLd.map((data, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(data) }} />
      ))}
      <CartProviderWrapper storeId={tenant.id}>
        <ModernProductDetail product={product} relatedProducts={relatedTo(product, catalog)} />
      </CartProviderWrapper>
    </StorefrontRoot>
  );
}

export async function generateMetadata({ params, searchParams }: StoreProductPageProps): Promise<Metadata> {
  const data = await load(searchParams._domain, params.id);
  if (!data?.tenant || !data.product) {
    return { title: 'Producto no encontrado', robots: { index: false } };
  }

  const { tenant, product } = data;
  const title = `${product.name} | ${tenant.name}`;
  const description = (product.description?.trim() || `${product.name} a ${formatPrice(product.price)} en ${tenant.name}. Pide por WhatsApp.`).slice(0, 200);
  const url = `https://${searchParams._domain}${productPath(product)}`;
  const image = absoluteUrl(product.imageUrls[0], `https://${searchParams._domain}`);

  return {
    metadataBase: new URL(`https://${searchParams._domain}`),
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
      ...(image ? { images: [{ url: image, alt: product.name }] } : {}),
    },
    twitter: { card: image ? 'summary_large_image' : 'summary', title, description },
  };
}
