import { NextRequest } from 'next/server';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { panelError, panelJson, STORE_NOT_CREATED, verifyPanelRequest } from '@/lib/server/erp/panel-auth';
import { getAppToken, isAppNotEnabled } from '@/lib/server/erp/client';
import { erpApiHost } from '@/lib/server/erp/config';
import { forgetPartnerTenants } from '@/lib/server/erp/webhooks';
import { getCentralAdminDb } from '@/lib/server/central-admin';
import { getTenantById } from '@/lib/server/tenants';
import { applyTenantSettingsPatch } from '@/lib/server/tenant-settings-update';
import { tenantSettingsPatchSchema } from '@/lib/server/tenant-settings-validation';
import { uniqueSubdomain } from '@/lib/server/subdomain';
import { logTenantAdminEvent } from '@/lib/server/tenant-audit';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { getPlan } from '@/lib/plans';
import { normalizeWhatsapp } from '@/lib/storefront/public-store';
import { RUBRO_IDS, type RubroId } from '@/lib/storefront/rubros';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const platformDomain = () => process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'createam.cloud';

/**
 * Dirección pública del catálogo, para la vista previa (/vista-previa va en
 * un iframe del dominio del catálogo, no por el proxy del ERP).
 */
function catalogPublicUrl(request: NextRequest): string {
  const configured = process.env.CATALOG_PUBLIC_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/+$/, '');
  const host = request.nextUrl.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return request.nextUrl.origin;
  return `https://${platformDomain()}`;
}

/** La presentación de la tienda del negocio. 404 STORE_NOT_CREATED si todavía no tiene. */
export async function GET(request: NextRequest) {
  const auth = await verifyPanelRequest(request, 'view');
  if (!auth.ok) return panelError(auth.status, auth.code, auth.error);

  const tenant = auth.tenantId ? await getTenantById(auth.tenantId) : null;
  if (!tenant) return STORE_NOT_CREATED();

  const address = tenant.domain || (tenant.subdomain ? `${tenant.subdomain}.${platformDomain()}` : null);
  return panelJson({
    canManage: auth.canManage,
    store: {
      id: tenant.id,
      name: tenant.name,
      status: tenant.status,
      plan: tenant.plan ?? 'starter',
      logo: tenant.logo ?? '',
      colors: tenant.colors ?? null,
      primaryColor: tenant.primaryColor ?? null,
      heroSlides: tenant.heroSlides ?? [],
      whatsapp: tenant.whatsapp ?? '',
      socialMedia: tenant.socialMedia ?? {},
      storefront: tenant.storefront ?? {},
      subdomain: tenant.subdomain ?? null,
      domain: tenant.domain ?? null,
      seoTitle: tenant.seoTitle ?? '',
      seoDescription: tenant.seoDescription ?? '',
    },
    storeUrl: address ? `https://${address}` : null,
    previewUrl: `${catalogPublicUrl(request)}/vista-previa`,
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
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (name.length < 2 || name.length > 60) return panelError(400, 'INVALID', 'Escribe el nombre de tu tienda (de 2 a 60 caracteres).');
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

  try {
    const subdomain = await uniqueSubdomain(name);
    const ref = await getCentralAdminDb().collection('tenants').add({
      name,
      email: claims.email,
      status: 'active',
      // El plan comercial y el cobro son del ERP (D3); aquí solo limita funciones.
      plan: 'starter',
      subdomain,
      domain: null,
      whatsapp,
      erp: { partnerId: claims.partnerId, api: erpApiHost() },
      storefront: rubro ? { rubro } : {},
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      approvedAt: FieldValue.serverTimestamp(),
      approvedBy: 'cyberpos',
    });
    forgetPartnerTenants(claims.partnerId);

    await logTenantAdminEvent({
      tenantId: ref.id,
      action: 'tenant.created',
      resource: 'tenant',
      resourceId: ref.id,
      actor: { uid: `erp:${claims.userId}`, email: claims.email, role: claims.role },
      metadata: { source: 'cyberpos', partnerId: claims.partnerId, subdomain },
    });

    return panelJson({ ok: true, tenantId: ref.id, storeUrl: `https://${subdomain}.${platformDomain()}` }, 201);
  } catch (error) {
    console.error('[erp-panel/store] No se pudo crear la tienda:', error);
    return panelError(500, 'CREATE_FAILED', 'No pudimos crear tu tienda. Inténtalo de nuevo.');
  }
}
