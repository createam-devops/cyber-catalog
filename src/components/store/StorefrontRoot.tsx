"use client";

import { createContext, useContext, useMemo, type CSSProperties, type ReactNode } from 'react';
import { STOREFRONT_FONT_CLASSNAMES } from '@/lib/storefront/fonts';
import { resolveStorefront, storefrontCssVars, type ResolvedStorefront } from '@/lib/storefront/theme';
import type { PublicStore, StoreCategory } from '@/lib/storefront/public-store';

interface StorefrontContextValue {
  store: PublicStore;
  theme: ResolvedStorefront;
  categories: StoreCategory[];
  /** true en la vista previa del panel: sin enlaces ni llamadas reales. */
  preview: boolean;
}

const StorefrontContext = createContext<StorefrontContextValue | null>(null);

export function useStorefront(): StorefrontContextValue {
  const value = useContext(StorefrontContext);
  if (!value) {
    throw new Error('useStorefront debe usarse dentro de <StorefrontRoot>');
  }
  return value;
}

interface StorefrontRootProps {
  store: PublicStore;
  categories?: StoreCategory[];
  preview?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * Raíz de toda vitrina: arma el tema de la tienda, lo deja en variables CSS y
 * lo comparte con los componentes. La usan las páginas de /store y la vista
 * previa del panel, así que lo que el dueño ve al diseñar es lo que se publica.
 */
export default function StorefrontRoot({ store, categories = [], preview = false, className = '', children }: StorefrontRootProps) {
  const theme = useMemo(() => resolveStorefront(store), [store]);
  const style = useMemo(() => storefrontCssVars(theme) as CSSProperties, [theme]);
  const value = useMemo(() => ({ store, theme, categories, preview }), [store, theme, categories, preview]);

  return (
    <StorefrontContext.Provider value={value}>
      <div
        className={`${STOREFRONT_FONT_CLASSNAMES} sf-root min-h-screen bg-sf-bg text-sf-text font-sf-body ${className}`}
        style={style}
      >
        {children}
      </div>
    </StorefrontContext.Provider>
  );
}
