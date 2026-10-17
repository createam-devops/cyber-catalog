import { permanentRedirect } from 'next/navigation';

// Ruta antigua (/products/[id]). La ficha vive en /product/[id].
export default function LegacyProductPage({ params }: { params: { id: string } }) {
  permanentRedirect(`/product/${encodeURIComponent(params.id)}`);
}
