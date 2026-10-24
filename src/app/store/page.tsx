import type { Metadata } from "next";
import { notFound } from "next/navigation";
import StoreListing, { storeListingMetadata } from "@/components/store/StoreListing";

// El dominio llega como parámetro: la página se arma en cada visita, pero el
// catálogo sale de la caché en memoria de storefront-data (como mucho una
// consulta a la base por minuto y por tienda).
export const dynamic = 'force-dynamic';

interface StorePageProps {
  searchParams: { _domain?: string; q?: string };
}

export default async function StorePage({ searchParams }: StorePageProps) {
  const domain = searchParams._domain;
  if (!domain) return notFound();
  return <StoreListing domain={domain} query={typeof searchParams.q === 'string' ? searchParams.q : ''} />;
}

export async function generateMetadata({ searchParams }: StorePageProps): Promise<Metadata> {
  return storeListingMetadata(searchParams._domain);
}
