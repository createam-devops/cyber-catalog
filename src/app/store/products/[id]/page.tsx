import { notFound } from 'next/navigation';
import { getTenantByDomain } from '@/lib/server/tenants';
import ModernProductDetail from '@/components/store/modern/ModernProductDetail';

export const dynamic = 'force-dynamic';

interface ProductPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ _domain?: string }>;
}

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const domain = resolvedSearchParams._domain;

  if (!domain) {
    return notFound();
  }

  const tenant = await getTenantByDomain(domain);
  
  if (!tenant || tenant.status !== 'active') {
    return notFound();
  }

  const { id } = resolvedParams;

  return (
    <ModernProductDetail productId={id} tenant={tenant} domain={domain} />
  );
}
