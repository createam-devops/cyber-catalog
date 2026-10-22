// Qué puede usar cada tienda (C-5 de cyberERP/PETICION_ERP_AL_CATALOGO_MIGRACION.md).
//
// Para una tienda del ERP manda el plan de su negocio en CyberPOS: el ERP
// informa sus funciones en GET /integrations/app/partner-status (`features`)
// y sus topes (`limits`). Las viejas de Firebase siguen con el plan del
// catálogo (`src/lib/plans.ts`). Así, una tienda en Catálogo Pro tiene SEO,
// redes, stock, dominio propio, estadísticas y hasta 10 banners, aunque su
// fila en la base diga `starter`.

import type { TenantConfig } from '@/lib/types';
import { getPlan, type Plan } from '@/lib/plans';
import { findLocalStore } from '../store-db';
import { erpGet } from './client';
import { linkedToCurrentErp } from './config';

export interface StoreEntitlements {
  features: Plan['features'];
  limits: Plan['limits'];
  /** Nombre del plan para mostrar (el del ERP en sus tiendas). */
  planName: string;
  source: 'erp' | 'catalog';
}

/** Códigos de función del ERP → funciones del catálogo. */
const FEATURE_CODES = {
  customDomain: 'catalog.custom_domain',
  socialMedia: 'catalog.social_media',
  stock: 'catalog.stock',
  seo: 'catalog.seo',
  analytics: 'catalog.analytics',
} as const;
const HERO_SLIDES_CODE = 'catalog.hero_slides';
/** Banners de la portada: uno sin la función, diez con ella (como el plan Pro). */
const HERO_SLIDES = { without: 1, with: 10 };

interface PartnerStatus {
  plan?: { code?: string; name?: string } | null;
  features?: string[];
  limits?: { products?: number | null; categories?: number | null; product_images?: number | null };
}

const TTL_MS = 5 * 60 * 1000;
const statuses = new Map<number, { at: number; value: StoreEntitlements }>();

export function toEntitlements(status: PartnerStatus): StoreEntitlements {
  const codes = new Set(Array.isArray(status.features) ? status.features : []);
  const limit = (value: number | null | undefined, fallback: number | null) => (value === null ? null : typeof value === 'number' ? value : fallback);
  return {
    features: Object.fromEntries(Object.entries(FEATURE_CODES).map(([key, code]) => [key, codes.has(code)])) as Plan['features'],
    limits: {
      products: limit(status.limits?.products, null),
      categories: limit(status.limits?.categories, null),
      imagesPerProduct: limit(status.limits?.product_images, 20) ?? 20,
      heroSlides: codes.has(HERO_SLIDES_CODE) ? HERO_SLIDES.with : HERO_SLIDES.without,
    },
    planName: status.plan?.name || status.plan?.code || 'Plan del ERP',
    source: 'erp',
  };
}

function fromCatalogPlan(planId: string | undefined): StoreEntitlements {
  const plan = getPlan(planId);
  return { features: plan.features, limits: plan.limits, planName: plan.name, source: 'catalog' };
}

/** Olvida lo recordado de un negocio (aviso `partner.updated` del ERP). */
export function forgetPartnerStatus(partnerId: number): void {
  statuses.delete(partnerId);
}

/**
 * Las funciones y topes de la tienda. `fresh` vuelve a preguntar al ERP (el
 * editor, al abrirse: así un cambio de plan se nota enseguida). Si el ERP no
 * responde, vale lo último que dijo; sin eso, el plan del catálogo.
 */
export async function getStoreEntitlements(tenant: Pick<TenantConfig, 'plan' | 'erp'>, { fresh = false } = {}): Promise<StoreEntitlements> {
  if (!linkedToCurrentErp(tenant.erp)) return fromCatalogPlan(tenant.plan);
  const partnerId = tenant.erp!.partnerId;
  const cached = statuses.get(partnerId);
  if (!fresh && cached && Date.now() - cached.at < TTL_MS) return cached.value;
  try {
    const value = toEntitlements(await erpGet<PartnerStatus>(partnerId, '/integrations/app/partner-status'));
    statuses.set(partnerId, { at: Date.now(), value });
    return value;
  } catch (error) {
    console.warn('[erp/plan-features] No se pudo leer el plan del negocio', partnerId, error);
    return cached?.value ?? fromCatalogPlan(tenant.plan);
  }
}

/** Lo mismo, por id de tienda (para las reglas al guardar). */
export async function getStoreEntitlementsById(tenantId: string, planIdFallback?: string): Promise<StoreEntitlements> {
  const local = findLocalStore(tenantId);
  return local ? getStoreEntitlements(local) : fromCatalogPlan(planIdFallback);
}
