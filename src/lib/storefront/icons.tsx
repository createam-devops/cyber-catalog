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
  // Beneficios de la tienda (franja de la portada y de la ficha).
  Award, BadgeCheck, Clock, CreditCard, MapPin, MessageCircle, ShieldCheck,
} from 'lucide-react';
import { WhatsAppIcon } from './whatsapp-icon';

export { WhatsAppIcon, WHATSAPP_GREEN } from './whatsapp-icon';

export const STOREFRONT_ICONS = {
  Baby, Beef, Bike, Book, Brush, Cake, Camera, Car, Coffee, Cookie, Cpu, Croissant,
  CupSoda, Diamond, Dog, Drill, Droplet, Dumbbell, Fish, Flame, Flower, Flower2,
  Footprints, Gamepad2, Gem, Gift, Glasses, Hammer, HardHat, Headphones, Heart, Home,
  IceCream: IceCreamCone, IceCreamCone, Laptop, Leaf, Lightbulb, Music, Package,
  PackageOpen, PaintBucket, Palette, Pizza, Plug, Ruler, Salad, Sandwich, Scissors,
  Shield, Shirt, ShoppingBag, Smartphone, Sofa, Sparkles, SprayCan, Star, Sun, Tag,
  Truck, UtensilsCrossed, Watch, Wine, Wrench, Zap,
  Award, BadgeCheck, Clock, CreditCard, MapPin, MessageCircle, ShieldCheck,
  WhatsApp: WhatsAppIcon,
} satisfies Record<string, LucideIcon>;

export type StorefrontIconName = keyof typeof STOREFRONT_ICONS;

/**
 * El nombre de ícono de un beneficio: los guardados con la burbuja genérica
 * cuyo título habla de WhatsApp se dibujan con el logo real.
 */
export function benefitIconName(icon: string | undefined | null, title: string): string | undefined | null {
  return icon === 'MessageCircle' && /whats\s*app/i.test(title) ? 'WhatsApp' : icon;
}

export function getStorefrontIcon(name: string | undefined | null): LucideIcon {
  if (name && name in STOREFRONT_ICONS) {
    return STOREFRONT_ICONS[name as StorefrontIconName];
  }
  return Sparkles;
}
