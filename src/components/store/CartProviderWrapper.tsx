"use client";

import { CartProvider } from "@/contexts/CartContext";

interface CartProviderWrapperProps {
  storeId: string;
  children: React.ReactNode;
}

export default function CartProviderWrapper({ storeId, children }: CartProviderWrapperProps) {
  return <CartProvider tenantId={storeId}>{children}</CartProvider>;
}
