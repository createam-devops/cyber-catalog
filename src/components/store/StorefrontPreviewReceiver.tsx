"use client";

import { useEffect, useState } from 'react';
import StorefrontRoot from './StorefrontRoot';
import ModernStoreHome from './modern/ModernStoreHome';
import { CartProvider } from '@/contexts/CartContext';
import { isAllowedPreviewParent, PREVIEW_MESSAGE, PREVIEW_READY, type PreviewPayload } from '@/lib/storefront/preview';

const ALLOW_LOCALHOST = process.env.NODE_ENV !== 'production';

/** Origen de quien encuadra esta página, si es uno permitido. */
function parentOrigin(): string {
  const own = window.location.origin;
  try {
    const origin = new URL(document.referrer).origin;
    return isAllowedPreviewParent(origin, own, ALLOW_LOCALHOST) ? origin : own;
  } catch {
    return own;
  }
}

/**
 * Página dentro del iframe de la vista previa. La encuadran el panel del
 * catálogo y el editor dentro del ERP: solo acepta mensajes de esos orígenes,
 * y responde con un origen explícito, nunca `*`. No navega: StorefrontRoot va
 * en modo `preview`.
 */
export default function StorefrontPreviewReceiver() {
  const [payload, setPayload] = useState<PreviewPayload | null>(null);

  useEffect(() => {
    const own = window.location.origin;
    const onMessage = (event: MessageEvent) => {
      if (!isAllowedPreviewParent(event.origin, own, ALLOW_LOCALHOST)) return;
      if (event.data?.type !== PREVIEW_MESSAGE) return;
      setPayload(event.data.payload as PreviewPayload);
    };
    window.addEventListener('message', onMessage);
    if (window.parent !== window) {
      window.parent.postMessage({ type: PREVIEW_READY }, parentOrigin());
    }
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
