"use client";

import { Sparkles } from 'lucide-react';
import { useStorefront } from '../StorefrontRoot';
import { getStorefrontIcon } from '@/lib/storefront/icons';

interface ModernCategoriesProps {
  /** null = todas. */
  activeCategory: string | null;
  onCategoryChange: (category: string | null) => void;
}

export default function ModernCategories({ activeCategory, onCategoryChange }: ModernCategoriesProps) {
  const { theme, categories } = useStorefront();

  // Con una sola categoría el filtro no aporta nada.
  if (categories.length < 2) return null;

  const items = [
    { id: null as string | null, label: 'Todo', Icon: Sparkles },
    ...categories.map((c) => ({ id: c.id as string | null, label: c.label, Icon: getStorefrontIcon(c.icon) })),
  ];

  return (
    <div className="py-6 container mx-auto px-4">
      <h2 className="text-xl font-bold mb-4">{theme.content.categoriesTitle}</h2>
      <div className="flex gap-3 overflow-x-auto py-3 px-4 -mx-4 scrollbar-hide snap-x" role="tablist" aria-label={theme.content.categoriesTitle}>
        {items.map(({ id, label, Icon }) => {
          const isActive = activeCategory === id;
          return (
            <button
              key={id ?? 'todo'}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onCategoryChange(id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-sf-chip whitespace-nowrap snap-start border transition-all ${
                isActive
                  ? 'bg-sf-primary border-sf-primary text-sf-on-primary shadow-md'
                  : 'bg-sf-bg border-sf-border text-sf-text/70 hover:border-sf-primary hover:text-sf-primary'
              }`}
            >
              <Icon size={18} aria-hidden="true" className={isActive ? '' : 'opacity-60'} />
              <span className="text-sm font-bold tracking-wide">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
