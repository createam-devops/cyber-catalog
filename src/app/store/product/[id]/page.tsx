import { notFound } from "next/navigation";
import { getTenantByDomain } from "@/lib/server/tenants";
import { getTenantProductById, getRelatedProducts } from "@/lib/products-server";
import ModernProductDetail from "@/components/store/modern/ModernProductDetail";
import CartProviderWrapper from "@/components/store/CartProviderWrapper";

// Cache por 60 segundos para mejorar rendimiento
export const revalidate = 60;
export const dynamic = 'force-dynamic';

interface StoreProductPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ _domain?: string }>;
}

export default async function StoreProductPage({ params, searchParams }: StoreProductPageProps) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const _domain = resolvedSearchParams._domain;

  // Log para depuración
  console.log('[StoreProductPage]', {
    productId: id,
    _domain,
    allSearchParams: resolvedSearchParams,
    hasDomain: !!_domain
  });

  if (!_domain) {
    console.error('[StoreProductPage] ERROR: No _domain parameter found', { 
      searchParams: resolvedSearchParams,
      allParams: Object.keys(resolvedSearchParams)
    });
    return notFound();
  }

  const tenant = await getTenantByDomain(_domain);
  
  console.log('[StoreProductPage] Tenant lookup:', {
    domain: _domain,
    tenantFound: !!tenant,
    tenantId: tenant?.id,
    tenantStatus: tenant?.status
  });

  if (!tenant || tenant.status !== 'active') {
    console.error('[StoreProductPage] ERROR: Tenant not found or inactive', { 
      domain: _domain, 
      tenant: tenant ? { id: tenant.id, status: tenant.status } : null 
    });
    return notFound();
  }

  // Cargar producto y productos relacionados en paralelo en el servidor
  const [product, relatedProducts] = await Promise.all([
    getTenantProductById(tenant.id, tenant.firebaseConfig, id),
    getRelatedProducts(tenant.id, tenant.firebaseConfig, id, undefined, 4),
  ]);

  if (!product) {
    return notFound();
  }

  return (
    <CartProviderWrapper tenant={tenant}>
      <ModernProductDetail 
        tenant={tenant} 
        productId={id} 
        domain={_domain}
        initialProduct={product}
        initialRelatedProducts={relatedProducts}
      />
    </CartProviderWrapper>
  );
}
