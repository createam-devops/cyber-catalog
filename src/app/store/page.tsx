import { notFound } from "next/navigation";
import { getTenantByDomain } from "@/lib/server/tenants";
import { extractDomain } from "@/lib/utils";
import { getTenantProducts } from "@/lib/products-server";
import ModernStoreHome from "@/components/store/modern/ModernStoreHome";
import CartProviderWrapper from "@/components/store/CartProviderWrapper";

// Cache por 60 segundos para mejorar rendimiento
export const revalidate = 60;
export const dynamic = 'force-dynamic';

interface StorePageProps {
  searchParams: Promise<{ _domain?: string }>;
}

export default async function StorePage({ searchParams }: StorePageProps) {
  const params = await searchParams;
  const domain = params._domain;

  if (!domain) {
    return notFound();
  }

  // Obtener configuración del tenant
  const tenant = await getTenantByDomain(domain);

  if (!tenant || tenant.status !== 'active') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Tienda no encontrada</h1>
          <p className="text-muted-foreground mb-8">
            Esta tienda no existe o está temporalmente deshabilitada.
          </p>
          <a 
            href="https://createam.cloud" 
            className="text-primary hover:underline"
          >
            Volver a Createam
          </a>
        </div>
      </div>
    );
  }

  // Cargar solo 12 productos iniciales (3 filas) para optimizar primera carga y SEO
  const products = await getTenantProducts(tenant.id, tenant.firebaseConfig, {
    limit: 12, // Solo 3 filas iniciales para carga rápida
  });

  return (
    <CartProviderWrapper tenant={tenant}>
      <ModernStoreHome tenant={tenant} domain={domain} initialProducts={products} />
    </CartProviderWrapper>
  );
}

export async function generateMetadata({ searchParams }: StorePageProps) {
  const params = await searchParams;
  const domain = params._domain;

  if (!domain) {
    return {
      title: 'Tienda no encontrada',
    };
  }

  const tenant = await getTenantByDomain(domain);

  if (!tenant) {
    return {
      title: 'Tienda no encontrada',
    };
  }

  return {
    title: `${tenant.name} - Tienda Online`,
    description: `Compra en ${tenant.name}. Los mejores productos con envío rápido.`,
  };
}
