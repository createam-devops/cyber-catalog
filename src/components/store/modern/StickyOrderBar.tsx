"use client";

import { ShoppingBag } from 'lucide-react';
import { formatPrice } from '@/lib/storefront/public-store';

/** Botón fijo abajo en el celular: el producto, su precio y pedir, siempre a mano. */
export default function StickyOrderBar({
  name,
  price,
  label,
  disabled = false,
  onClick,
}: {
  name: string;
  price: number;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-sf-border bg-sf-bg/95 px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur md:hidden">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-sf-muted">{name}</p>
          <p className="text-lg font-black leading-tight">{formatPrice(price)}</p>
        </div>
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          className="flex items-center gap-2 rounded-sf-btn bg-sf-primary px-5 py-3 text-sm font-bold text-sf-on-primary shadow-md active:scale-[0.98] disabled:opacity-50"
        >
          <ShoppingBag size={18} strokeWidth={2.5} aria-hidden="true" />
          {label}
        </button>
      </div>
    </div>
  );
}
