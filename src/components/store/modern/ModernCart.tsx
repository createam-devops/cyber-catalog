"use client";

import Image from 'next/image';
import { X, Trash2, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useStorefront } from '../StorefrontRoot';
import { canOptimizeImage } from './StoreProductCard';
import { formatPrice } from '@/lib/storefront/public-store';
import type { CartItem } from '@/contexts/CartContext';

interface ModernCartProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onRemoveItem: (productId: string) => void;
  onUpdateQuantity?: (productId: string, quantity: number) => void;
}

/** Mensaje de WhatsApp con el pedido: saludo de la tienda, una línea por producto y el total. */
export function buildOrderMessage(greeting: string, cart: CartItem[]): string {
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const lines = cart.map((item) => `• ${item.name} x${item.quantity} - ${formatPrice(item.price * item.quantity)}`);
  return `${greeting}\n\n${lines.join('\n')}\n\nTotal: ${formatPrice(total)}`;
}

export default function ModernCart({ isOpen, onClose, cart, onRemoveItem, onUpdateQuantity }: ModernCartProps) {
  const { store, theme, preview } = useStorefront();
  if (!isOpen) return null;

  const { content } = theme;
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = () => {
    if (!store.whatsapp || preview) return;
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId: store.id, event: 'whatsapp_click' }),
    }).catch(() => {});
    const message = buildOrderMessage(content.orderGreeting, cart);
    window.open(`https://wa.me/${store.whatsapp}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={onClose} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={content.cartTitle}
        className="fixed top-0 right-0 h-full w-full sm:w-[450px] bg-sf-bg text-sf-text z-[60] shadow-2xl p-6 flex flex-col"
      >
        <div className="flex justify-between items-center border-b border-sf-border pb-4 mb-4">
          <h2 className="text-xl font-bold">{content.cartTitle}</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="p-2 hover:bg-sf-surface rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-20 h-20 bg-sf-surface rounded-full flex items-center justify-center mb-4 text-sf-muted">
                <ShoppingBag size={32} />
              </div>
              <p className="font-medium">Todavía no agregas productos</p>
              <p className="text-sm text-sf-muted mt-1">Elige lo que te guste y arma tu pedido.</p>
            </div>
          ) : (
            cart.map((item) => {
              const image = item.imageUrls?.[0];
              return (
                <div key={item.id} className="flex gap-4 p-3 rounded-sf-card hover:bg-sf-surface transition-colors">
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-sf-surface">
                    {image && (
                      <Image src={image} alt={item.name} fill sizes="80px" unoptimized={!canOptimizeImage(image)} className="object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-sf-body font-bold text-sm line-clamp-2">{item.name}</h3>
                    <p className="text-xs text-sf-muted mt-1">{formatPrice(item.price)} c/u</p>
                    {onUpdateQuantity ? (
                      <div className="mt-2 inline-flex items-center gap-3 rounded-full border border-sf-border px-2 py-1">
                        <button type="button" aria-label="Quitar uno" onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}>
                          <Minus size={14} />
                        </button>
                        <span className="text-sm font-bold w-5 text-center">{item.quantity}</span>
                        <button type="button" aria-label="Agregar uno" onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}>
                          <Plus size={14} />
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-sf-muted mt-1">Cantidad: {item.quantity}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      aria-label={`Quitar ${item.name}`}
                      className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                    <p className="text-sm font-bold text-sf-primary">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {cart.length > 0 && (
          <div className="pt-4 border-t border-sf-border mt-auto space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sf-muted font-medium">Total</span>
              <span className="text-2xl font-bold">{formatPrice(total)}</span>
            </div>
            <button
              type="button"
              onClick={handleCheckout}
              disabled={!store.whatsapp}
              className="block w-full bg-sf-primary text-sf-on-primary text-center py-4 rounded-sf-btn font-bold hover:opacity-90 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {content.orderButton}
            </button>
            {!store.whatsapp && (
              <p className="text-xs text-center text-sf-muted">Esta tienda todavía no configuró su número de WhatsApp para recibir pedidos.</p>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
