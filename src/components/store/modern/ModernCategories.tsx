"use client";

import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { useStorefront } from '../StorefrontRoot';
import { getStorefrontIcon } from '@/lib/storefront/icons';
import { categoryPath } from '@/lib/storefront/catalog';

interface ModernCategoriesProps {
  /** null = todas. */
  activeCategory: string | null;
  /** Solo en la vista previa del panel: filtra sin cambiar de página. */
  onCategoryChange?: (category: string | null) => void;
}

/**
 * Categorías de la tienda. Cada una es un enlace a su página
 * (/categoria/<slug>), que Google puede seguir e indexar; en la vista previa
 * del panel filtran en el lugar.
 */
export default function ModernCategories({ activeCategory, onCategoryChange }: ModernCategoriesProps) {
  const { theme, categories, preview } = useStorefront();

  // Con una sola categoría el filtro no aporta nada.
  if (categories.length < 2) return null;

  const items = [
    { id: null as string | null, label: 'Todo', Icon: Sparkles, href: '/' },
    ...categories.map((c) => ({ id: c.id as string | null, label: c.label, Icon: getStorefrontIcon(c.icon), href: categoryPath(c) })),
  ];

  return (
    <nav className="py-6 container mx-auto px-4" aria-labelledby="categorias-title">
      <h2 id="categorias-title" className="text-xl font-bold mb-4">
        {theme.content.categoriesTitle}
      </h2>
      <ul className="flex gap-3 overflow-x-auto py-3 px-4 -mx-4 scrollbar-hide snap-x">
        {items.map(({ id, label, Icon, href }) => {
          const isActive = activeCategory === id;
          const className = `flex items-center gap-2 px-5 py-2.5 rounded-sf-chip whitespace-nowrap snap-start border transition-all ${
            isActive
              ? 'bg-sf-primary border-sf-primary text-sf-on-primary shadow-md'
              : 'bg-sf-bg border-sf-border text-sf-text/70 hover:border-sf-primary hover:text-sf-primary'
          }`;
          const inner = (
            <>
              <Icon size={18} aria-hidden="true" className={isActive ? '' : 'opacity-60'} />
              <span className="text-sm font-bold tracking-wide">{label}</span>
            </>
          );
          return (
            <li key={id ?? 'todo'} className="shrink-0">
              {preview ? (
                <button type="button" aria-pressed={isActive} onClick={() => onCategoryChange?.(id)} className={className}>
                  {inner}
                </button>
              ) : (
                <Link href={href} aria-current={isActive ? 'page' : undefined} className={className}>
                  {inner}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
