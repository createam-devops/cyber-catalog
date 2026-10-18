import { NextRequest } from 'next/server';
import { z } from 'zod';
import { catalogPublicUrl, panelError, panelJson, STORE_NOT_CREATED, verifyPanelRequest } from '@/lib/server/erp/panel-auth';
import { toPublicMediaUrl, toStoredMediaUrl } from '@/lib/server/store-media';
import { getAppToken, isAppNotEnabled } from '@/lib/server/erp/client';
import { erpApiHost } from '@/lib/server/erp/config';
import { getPartnerProfile, withPartnerProfile } from '@/lib/server/erp/partner-profile';
import { createLocalStore, isUniqueViolation, localStoreIdsForPartner } from '@/lib/server/store-db';
import { getTenantById } from '@/lib/server/tenants';
import { applyTenantSettingsPatch } from '@/lib/server/tenant-settings-update';
import { tenantSettingsPatchSchema } from '@/lib/server/tenant-settings-validation';
import { uniqueSubdomain } from '@/lib/server/subdomain';
import { logTenantAdminEvent } from '@/lib/server/tenant-audit';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { getPlan } from '@/lib/plans';
import { normalizeWhatsapp } from '@/lib/storefront/public-store';
import { RUBRO_IDS, type RubroId } from '@/lib/storefront/rubros';
import type { TenantConfig } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const platformDomain = () => process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'createam.cloud';

/** La presentación de la tienda del negocio. 404 STORE_NOT_CREATED si todavía no tiene. */
export async function GET(request: NextRequest) {
  const auth = await verifyPanelRequest(request, 'view');
  if (!auth.ok) return panelError(auth.status, auth.code, auth.error);

  const stored = auth.tenantId ? await getTenantById(auth.tenantId) : null;
  if (!stored) return STORE_NOT_CREATED();
  // Nombre, logo y WhatsApp del negocio en el ERP; `fromErp` dice cuáles el editor muestra sin editar.
  const { tenant, fromErp } = await withPartnerProfile(stored);

  // Las imágenes guardadas en el catálogo van con su URL absoluta: el editor vive en el dominio del ERP.
  const base = catalogPublicUrl(request);
  const address = tenant.domain || (tenant.subdomain ? `${tenant.subdomain}.${platformDomain()}` : null);
  return panelJson({
    canManage: auth.canManage,
    fromErp,
    store: {
      id: tenant.id,
      name: tenant.name,
      status: tenant.status,
      plan: tenant.plan ?? 'starter',
      logo: toPublicMediaUrl(tenant.logo ?? '', base),
      colors: tenant.colors ?? null,
      primaryColor: tenant.primaryColor ?? null,
      heroSlides: (tenant.heroSlides ?? []).map((slide) => ({ ...slide, image: toPublicMediaUrl(slide.image, base) })),
      whatsapp: tenant.whatsapp ?? '',
      socialMedia: tenant.socialMedia ?? {},
      storefront: tenant.storefront ?? {},
      subdomain: tenant.subdomain ?? null,
      domain: tenant.domain ?? null,
      seoTitle: tenant.seoTitle ?? '',
      seoDescription: tenant.seoDescription ?? '',
    },
    storeUrl: address ? `https://${address}` : null,
    previewUrl: `${base}/vista-previa`,
    platformDomain: platformDomain(),
    features: getPlan(tenant.plan).features,
    limits: getPlan(tenant.plan).limits,
  });
}

/** Guardar cambios. Mismas reglas que el panel del catálogo. */
export async function PATCH(request: NextRequest) {
  const rateLimit = checkRateLimit(request, 'erp-panel-store-patch', 60);
  if (rateLimit.limited) return panelError(429, 'RATE_LIMITED', 'Demasiados cambios seguidos. Espera un momento.');

  const auth = await verifyPanelRequest(request, 'manage');
  if (!auth.ok) return panelError(auth.status, auth.code, auth.error);
  if (!auth.tenantId) return STORE_NOT_CREATED();

  try {
    const payload = tenantSettingsPatchSchema.parse(await request.json());
    // Las imágenes del catálogo vuelven absolutas; se guardan como ruta (/media/...).
    const base = catalogPublicUrl(request);
    if (typeof payload.logo === 'string') payload.logo = toStoredMediaUrl(payload.logo, base);
    if (Array.isArray(payload.heroSlides)) {
      payload.heroSlides = payload.heroSlides.map((slide) => ({ ...slide, image: toStoredMediaUrl(slide.image, base) }));
    }
    const { claims } = auth;
    const result = await applyTenantSettingsPatch(auth.tenantId, payload, {
      uid: `erp:${claims.userId}`,
      email: claims.email,
      role: claims.role,
    });
    if (!result.ok) return panelError(result.status, 'INVALID', result.error);
    return panelJson({ ok: true, changed: result.changedFields });
  } catch (error) {
    if (error instanceof z.ZodError) return panelError(400, 'INVALID', 'Revisa los datos: alguno no es válido.');
    console.error('[erp-panel/store] No se pudo guardar:', error);
    return panelError(500, 'SAVE_FAILED', 'No se pudo guardar. Inténtalo de nuevo.');
  }
}

/**
 * Crear la tienda (sección Bienvenida). El plan del negocio tiene que incluir
 * la app del catálogo: se comprueba pidiendo el token de la app para ese negocio.
 */
export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(request, 'erp-panel-store-create', 10);
  if (rateLimit.limited) return panelError(429, 'RATE_LIMITED', 'Demasiados intentos. Espera un momento.');

  const auth = await verifyPanelRequest(request, 'manage');
  if (!auth.ok) return panelError(auth.status, auth.code, auth.error);
  if (auth.tenantId) return panelJson({ ok: true, tenantId: auth.tenantId, alreadyCreated: true });

  const body = (await request.json().catch(() => ({}))) as { name?: unknown; rubro?: unknown; whatsapp?: unknown };
  const typedName = typeof body.name === 'string' ? body.name.trim() : '';
  const rubro = (RUBRO_IDS as readonly string[]).includes(String(body.rubro)) ? (body.rubro as RubroId) : undefined;
  const whatsappRaw = typeof body.whatsapp === 'string' ? body.whatsapp.trim() : '';
  const whatsapp = whatsappRaw ? normalizeWhatsapp(whatsappRaw) : '';
  if (whatsapp === null) return panelError(400, 'INVALID', 'El número de WhatsApp no es válido. Escribe tu celular de 9 dígitos.');

  const { claims } = auth;
  try {
    await getAppToken(claims.partnerId);
  } catch (error) {
    if (isAppNotEnabled(error)) return panelError(403, 'APP_NOT_ENABLED', 'El plan de tu negocio no incluye la tienda online.');
    console.error('[erp-panel/store] El ERP no confirmó la app del negocio', claims.partnerId, error);
    return panelError(503, 'ERP_UNAVAILABLE', 'No pudimos confirmar tu plan con CyberPOS. Inténtalo en unos minutos.');
  }

  // Nombre comercial y WhatsApp del negocio en el ERP, si los entrega. Se guardan también
  // en la tienda, de respaldo, por si el ERP deja de entregarlos.
  const profile = await getPartnerProfile(claims.partnerId);
  const name = typedName || profile?.name || '';
  if (name.length < 2 || name.length > 60) return panelError(400, 'INVALID', 'Escribe el nombre de tu tienda (de 2 a 60 caracteres).');

  const erpApi = erpApiHost();
  if (!erpApi) return panelError(503, 'ERP_NOT_CONFIGURED', 'La tienda online no está disponible en este servidor.');

  try {
    let store: TenantConfig | null = null;
    for (let attempt = 0; !store; attempt++) {
      const subdomain = await uniqueSubdomain(name);
      try {
        store = createLocalStore({
          partnerId: claims.partnerId,
          erpApi,
          email: claims.email,
          subdomain,
          // El plan comercial y el cobro son del ERP (D3); aquí solo limita funciones.
          plan: 'starter',
          status: 'active',
          settings: { name, whatsapp: whatsapp || profile?.whatsapp || undefined, storefront: rubro ? { rubro } : {} },
        });
      } catch (error) {
        if (!isUniqueViolation(error) || attempt >= 2) throw error;
        // Otro pedido creó la tienda del negocio, o tomó el subdominio, al mismo tiempo.
        const existing = localStoreIdsForPartner(claims.partnerId, erpApi)[0];
        if (existing) return panelJson({ ok: true, tenantId: existing, alreadyCreated: true });
      }
    }

    await logTenantAdminEvent({
      tenantId: store.id,
      action: 'tenant.created',
      resource: 'tenant',
      resourceId: store.id,
      actor: { uid: `erp:${claims.userId}`, email: claims.email, role: claims.role },
      metadata: { source: 'cyberpos', partnerId: claims.partnerId, subdomain: store.subdomain },
    });

    return panelJson({ ok: true, tenantId: store.id, storeUrl: `https://${store.subdomain}.${platformDomain()}` }, 201);
  } catch (error) {
    console.error('[erp-panel/store] No se pudo crear la tienda:', error);
    return panelError(500, 'CREATE_FAILED', 'No pudimos crear tu tienda. Inténtalo de nuevo.');
  }
}
