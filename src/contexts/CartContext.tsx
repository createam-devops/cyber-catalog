"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { StoreProduct } from '@/lib/storefront/catalog';

/** Lo que el carrito necesita de un producto, venga de donde venga. */
export type CartProduct = Pick<StoreProduct, 'id' | 'name' | 'price'> & { imageUrls?: string[] };

export interface CartItem extends CartProduct {
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: CartProduct, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'createam-cart';

export function CartProvider({ children, tenantId }: { children: ReactNode; tenantId: string }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Cargar carrito desde localStorage al montar
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`${CART_STORAGE_KEY}-${tenantId}`);
      if (stored) {
        const parsedCart = JSON.parse(stored);
        setCart(parsedCart);
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
    }
  }, [tenantId]);

  // Guardar carrito en localStorage cuando cambie
  useEffect(() => {
    try {
      localStorage.setItem(`${CART_STORAGE_KEY}-${tenantId}`, JSON.stringify(cart));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [cart, tenantId]);

  const addToCart = (product: CartProduct, quantity: number = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        const updated = prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
        return updated;
      }
      const line: CartItem = {
        id: product.id,
        name: product.name,
        price: Number(product.price) || 0,
        imageUrls: product.imageUrls?.slice(0, 1) ?? [],
        quantity,
      };
      return [...prevCart, line];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
