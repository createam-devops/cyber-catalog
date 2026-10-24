import type { Metadata } from "next";
import { notFound } from "next/navigation";
import StoreListing, { storeListingMetadata } from "@/components/store/StoreListing";

// Página de una categoría (/categoria/<slug> en el dominio de la tienda): su
// título, su texto y sus productos, para que Google la pueda indexar sola.
export const dynamic = 'force-dynamic';

interface CategoryPageProps {
  params: { slug: string };
  searchParams: { _domain?: string };
}

export default async function StoreCategoryPage({ params, searchParams }: CategoryPageProps) {
  const domain = searchParams._domain;
  if (!domain) return notFound();
  return <StoreListing domain={domain} categorySlug={decodeURIComponent(params.slug)} />;
}

export async function generateMetadata({ params, searchParams }: CategoryPageProps): Promise<Metadata> {
  return storeListingMetadata(searchParams._domain, decodeURIComponent(params.slug));
}
