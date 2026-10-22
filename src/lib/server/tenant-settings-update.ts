// Guardar los ajustes de una tienda. Lo usan el panel del catálogo
// (/api/tenant-admin/settings) y el editor dentro de CyberPOS
// (/erp-panel/api/store): mismas reglas en los dos lados.

import { FieldValue } from 'firebase-admin/firestore';
import { getCentralAdminDb } from './central-admin';
import { isLocalStore, isUniqueViolation, updateLocalStore } from './store-db';
import { getTenantPlanInfo } from './tenant-plan';
import { logTenantAdminEvent } from './tenant-audit';
import { listDevStores } from './storefront-data';
import { addressTakenByOther, RESERVED_SUBDOMAINS } from './subdomain';
import type { TenantSettingsPatchPayload } from './tenant-settings-validation';
import { getStoreEntitlementsById } from './erp/plan-features';
import { normalizeWhatsapp } from '@/lib/storefront/public-store';

type TenantAuditActor = Parameters<typeof logTenantAdminEvent>[0]['actor'];

export type SettingsUpdateResult = { ok: true; changedFields: string[] } | { ok: false; status: number; error: string };

const fail = (status: number, error: string): SettingsUpdateResult => ({ ok: false, status, error });

export async function applyTenantSettingsPatch(
  tenantId: string,
  payload: TenantSettingsPatchPayload,
  actor: TenantAuditActor
): Promise<SettingsUpdateResult> {
  if (listDevStores().some((store) => store.id === tenantId)) {
    return fail(501, 'Es una tienda de prueba local (STOREFRONT_DEV_STORES): los cambios no se guardan.');
  }

  const changes: Record<string, unknown> = {};
  const changedFields: string[] = [];
  const set = (field: string, value: unknown) => {
    changes[field] = value;
    changedFields.push(field);
  };

  // Tiendas del ERP: las funciones del plan de su negocio en CyberPOS. Las viejas: su plan del catálogo.
  const entitlements = await getStoreEntitlementsById(tenantId, isLocalStore(tenantId) ? undefined : (await getTenantPlanInfo(tenantId)).plan);
  const planFeatures = entitlements.features;
  const maxSlides = entitlements.limits.heroSlides;

  if (Array.isArray(payload.heroSlides) && payload.heroSlides.length > maxSlides) {
    return fail(403, `Tu plan permite hasta ${maxSlides} ${maxSlides === 1 ? 'banner' : 'banners'} en la portada.`);
  }

  if (typeof payload.name === 'string') set('name', payload.name);
  if (typeof payload.logo === 'string') set('logo', payload.logo);
  if (typeof payload.primaryColor === 'string') set('primaryColor', payload.primaryColor);

  if (typeof payload.whatsapp === 'string') {
    // Se guarda listo para wa.me. Un número que no sirve se rechaza: los
    // pedidos de la tienda llegan a ese número.
    const whatsapp = payload.whatsapp ? normalizeWhatsapp(payload.whatsapp) : '';
    if (whatsapp === null) {
      return fail(400, 'El número de WhatsApp no es válido. Escríbelo con código de país, por ejemplo 51987654321.');
    }
    set('whatsapp', whatsapp);
  }

  // El SEO personalizado es del plan Pro; en los demás se ignora.
  if (planFeatures.seo && typeof payload.seoTitle === 'string') set('seoTitle', payload.seoTitle);
  if (planFeatures.seo && typeof payload.seoDescription === 'string') set('seoDescription', payload.seoDescription);

  if (payload.storefront) {
    const storefront = { ...payload.storefront };
    // Mostrar el stock en la vitrina también es del plan Pro.
    if (storefront.layout?.showStock && !planFeatures.stock) {
      storefront.layout = { ...storefront.layout, showStock: false };
    }
    set('storefront', storefront);
  }

  // Dirección de la tienda: libre, y nunca la de otra tienda ni la de un servicio de Createam.
  const platform = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'createam.cloud';
  if (typeof payload.subdomain === 'string') {
    if (RESERVED_SUBDOMAINS.has(payload.subdomain)) return fail(409, 'Esa dirección está reservada. Elige otra.');
    if (await addressTakenByOther('subdomain', payload.subdomain, tenantId)) return fail(409, 'Esa dirección ya la usa otra tienda. Elige otra.');
    set('subdomain', payload.subdomain);
  } else if (payload.subdomain === null) {
    set('subdomain', null);
  }
  if (typeof payload.domain === 'string') {
    const domain = payload.domain.toLowerCase();
    if (domain === platform || domain === `www.${platform}`) return fail(409, 'Esa dirección es de Createam.');
    if (domain.endsWith(`.${platform}`)) {
      // Un *.createam.cloud solo puede ser el propio subdominio de la tienda.
      const label = domain.slice(0, -platform.length - 1);
      const ownSubdomain = typeof payload.subdomain === 'string' ? payload.subdomain : null;
      if (label !== ownSubdomain && (await addressTakenByOther('subdomain', label, tenantId))) {
        return fail(409, 'Esa dirección ya la usa otra tienda.');
      }
    }
    if (await addressTakenByOther('domain', domain, tenantId)) return fail(409, 'Ese dominio ya lo usa otra tienda.');
    set('domain', domain);
  } else if (payload.domain === null) {
    set('domain', null);
  }

  if (payload.colors && typeof payload.colors === 'object') set('colors', payload.colors);
  if (payload.socialMedia && typeof payload.socialMedia === 'object') set('socialMedia', payload.socialMedia);
  if (Array.isArray(payload.heroSlides)) set('heroSlides', payload.heroSlides);

  // Tiendas del ERP: base propia. Las viejas: su documento de Firestore.
  if (isLocalStore(tenantId)) {
    const { subdomain, domain, ...settings } = changes;
    try {
      updateLocalStore(tenantId, {
        ...('subdomain' in changes ? { subdomain: subdomain as string | null } : {}),
        ...('domain' in changes ? { domain: domain as string | null } : {}),
        settings,
      });
    } catch (error) {
      // Otra tienda tomó la misma dirección entre la revisión y el guardado.
      if (isUniqueViolation(error)) return fail(409, 'Esa dirección ya la usa otra tienda. Elige otra.');
      throw error;
    }
  } else {
    await getCentralAdminDb()
      .collection('tenants')
      .doc(tenantId)
      .update({ ...changes, updatedAt: FieldValue.serverTimestamp() });
  }

  await logTenantAdminEvent({
    tenantId,
    action: 'tenant.settings.updated',
    resource: 'tenant',
    resourceId: tenantId,
    actor,
    metadata: { changedFields },
  });

  return { ok: true, changedFields };
}
