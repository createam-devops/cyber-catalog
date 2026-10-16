// Íconos de categoría que la vitrina sabe dibujar. Se importan uno por uno para
// no meter toda la librería en el bundle de la tienda. Incluye los nombres que
// guarda el panel de categorías y los que sugieren los paquetes por rubro.

import type { LucideIcon } from 'lucide-react';
import {
  Baby, Beef, Bike, Book, Brush, Cake, Camera, Car, Coffee, Cookie, Cpu, Croissant,
  CupSoda, Diamond, Dog, Drill, Droplet, Dumbbell, Fish, Flame, Flower, Flower2,
  Footprints, Gamepad2, Gem, Gift, Glasses, Hammer, HardHat, Headphones, Heart, Home,
  IceCreamCone, Laptop, Leaf, Lightbulb, Music, Package, PackageOpen, PaintBucket,
  Palette, Pizza, Plug, Ruler, Salad, Sandwich, Scissors, Shield, Shirt, ShoppingBag,
  Smartphone, Sofa, Sparkles, SprayCan, Star, Sun, Tag, Truck, UtensilsCrossed, Watch,
  Wine, Wrench, Zap,
} from 'lucide-react';

export const STOREFRONT_ICONS = {
  Baby, Beef, Bike, Book, Brush, Cake, Camera, Car, Coffee, Cookie, Cpu, Croissant,
  CupSoda, Diamond, Dog, Drill, Droplet, Dumbbell, Fish, Flame, Flower, Flower2,
  Footprints, Gamepad2, Gem, Gift, Glasses, Hammer, HardHat, Headphones, Heart, Home,
  IceCream: IceCreamCone, IceCreamCone, Laptop, Leaf, Lightbulb, Music, Package,
  PackageOpen, PaintBucket, Palette, Pizza, Plug, Ruler, Salad, Sandwich, Scissors,
  Shield, Shirt, ShoppingBag, Smartphone, Sofa, Sparkles, SprayCan, Star, Sun, Tag,
  Truck, UtensilsCrossed, Watch, Wine, Wrench, Zap,
} satisfies Record<string, LucideIcon>;

export type StorefrontIconName = keyof typeof STOREFRONT_ICONS;

export function getStorefrontIcon(name: string | undefined | null): LucideIcon {
  if (name && name in STOREFRONT_ICONS) {
    return STOREFRONT_ICONS[name as StorefrontIconName];
  }
  return Sparkles;
}
