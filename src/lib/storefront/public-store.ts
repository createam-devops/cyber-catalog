// Lo que la vitrina puede mostrar de una tienda. El documento completo de la
// tienda (correo, aprobaciones, suscripción, configuración de Firebase) se
// queda en el servidor: al navegador solo viaja esta lista cerrada de campos.

import type { PlanId } from '../plans';
import type { TenantConfig } from '../types';
import type { StorefrontSettings } from './theme';

export interface PublicStore {
  id: string;
  name: string;
  logo?: string;
  colors?: { primary?: string; secondary?: string; accent?: string };
  primaryColor?: string;
  heroSlides?: TenantConfig['heroSlides'];
  /** Solo dígitos con código de país, o null si la tienda no tiene un número usable. */
  whatsapp: string | null;
  socialMedia?: TenantConfig['socialMedia'];
  storefront?: StorefrontSettings | null;
  plan?: PlanId;
}

export interface StoreCategory {
  /** Valor guardado en `product.category`. */
  id: string;
  label: string;
  icon?: string;
}

export function toPublicStore(tenant: TenantConfig): PublicStore {
  return {
    id: tenant.id,
    name: tenant.name,
    logo: tenant.logo || undefined,
    colors: tenant.colors ?? undefined,
    primaryColor: tenant.primaryColor || undefined,
    heroSlides: tenant.heroSlides ?? [],
    whatsapp: normalizeWhatsapp(tenant.whatsapp),
    socialMedia: tenant.socialMedia ?? undefined,
    storefront: tenant.storefront ?? null,
    plan: tenant.plan,
  };
}

/**
 * Número de WhatsApp listo para `wa.me`: solo dígitos y con el 51 de Perú si
 * vino como celular local de 9 dígitos. Devuelve null si no sirve, incluidos
 * los números de relleno como 51999999999 (todos los dígitos iguales), para
 * que la tienda no mande pedidos a un número que no es de nadie.
 */
export function normalizeWhatsapp(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, '');
  if (digits.length === 9 && digits.startsWith('9')) digits = `51${digits}`;
  if (digits.length < 10 || digits.length > 15) return null;
  const local = digits.startsWith('51') ? digits.slice(2) : digits;
  if (/^(\d)\1+$/.test(local)) return null;
  return digits;
}

const SOCIAL_BASE = {
  instagram: 'https://www.instagram.com/',
  facebook: 'https://www.facebook.com/',
  tiktok: 'https://www.tiktok.com/@',
} as const;

/** Enlace a una red social a partir de lo que guardó la tienda: URL, dominio o @usuario. */
export function socialUrl(network: keyof typeof SOCIAL_BASE, value: string | undefined | null): string | null {
  const raw = value?.trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^(www\.)?(instagram|facebook|tiktok)\.com\//i.test(raw)) return `https://${raw.replace(/^www\./i, 'www.')}`;
  const handle = raw.replace(/^@/, '');
  return /^[\w.]+$/.test(handle) ? `${SOCIAL_BASE[network]}${handle}` : null;
}

/** `cajas-personalizadas` → `Cajas personalizadas`, para categorías sin nombre propio. */
export function labelFromCategoryValue(value: string): string {
  const text = value.replace(/[-_]+/g, ' ').trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatPrice(price: number): string {
  return `S/ ${Number(price || 0).toFixed(2)}`;
}
