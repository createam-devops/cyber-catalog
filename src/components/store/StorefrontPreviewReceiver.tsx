"use client";

import { useEffect, useState } from 'react';
import StorefrontRoot from './StorefrontRoot';
import ModernStoreHome from './modern/ModernStoreHome';
import { CartProvider } from '@/contexts/CartContext';
import { PREVIEW_MESSAGE, PREVIEW_READY, type PreviewPayload } from '@/lib/storefront/preview';

/**
 * Página dentro del iframe de la vista previa. Solo acepta mensajes de su
 * mismo origen (el panel) y no navega: StorefrontRoot va en modo `preview`.
 */
export default function StorefrontPreviewReceiver() {
  const [payload, setPayload] = useState<PreviewPayload | null>(null);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== PREVIEW_MESSAGE) return;
      setPayload(event.data.payload as PreviewPayload);
    };
    window.addEventListener('message', onMessage);
    window.parent?.postMessage({ type: PREVIEW_READY }, window.location.origin);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  if (!payload) {
    return <div className="min-h-screen bg-white" />;
  }

  return (
    <StorefrontRoot store={payload.store} categories={payload.categories} preview>
      <CartProvider tenantId="vista-previa">
        <ModernStoreHome initialProducts={payload.products} total={payload.products.length} domain="" />
      </CartProvider>
    </StorefrontRoot>
  );
}
