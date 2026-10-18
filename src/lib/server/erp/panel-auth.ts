// Editor de la tienda dentro del ERP (<catalog-panel>, en Venta online › Tienda).
// Contrato: cyberERP/PETICION_ERP_AL_CATALOGO_PANEL.md §4.
//
// El ERP sirve esta API desde su propio dominio (/apps/catalog/api/ → nuestro
// /erp-panel/api/), así que las llamadas son del mismo origen: sin CORS ni
// cookies. Cada una trae `Authorization: Bearer` con un token aud=catalog que
// el ERP saca de /auth/app-session, el mismo tipo que ya valida el login con
// CyberPOS. Los permisos son los del rol del usuario en el ERP.

import { NextRequest, NextResponse } from 'next/server';
import { getErpConfig } from './config';
import { verifyErpAccessToken, type ErpUserClaims } from './jwt';
import { tenantIdsForPartner } from './webhooks';

export type PanelAccess = 'view' | 'manage';

export type PanelAuthResult =
  | { ok: true; claims: ErpUserClaims; tenantId: string | null; canManage: boolean }
  | { ok: false; status: number; code: string; error: string };

/** Respuesta JSON del panel. Los errores van como `{ code, error }`, igual que el ERP. */
export function panelJson(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export function panelError(status: number, code: string, error: string): NextResponse {
  return panelJson({ code, error }, status);
}

/**
 * Dirección pública del catálogo. Las peticiones llegan por el proxy del ERP,
 * con su dominio, pero la vista previa (/vista-previa) y las imágenes (/media)
 * se piden directo al catálogo.
 */
export function catalogPublicUrl(request: NextRequest): string {
  const configured = process.env.CATALOG_PUBLIC_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/+$/, '');
  const host = request.nextUrl.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return request.nextUrl.origin;
  return `https://${process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'createam.cloud'}`;
}

function hasPermission(claims: ErpUserClaims, permission: string): boolean {
  return claims.permissions.includes(permission) || claims.permissions.includes('*');
}

/**
 * Quién llama y qué puede hacer. El negocio sale del token (`partner_id`),
 * nunca de la petición; su tienda es la que tiene `erp.partnerId` igual.
 */
export async function verifyPanelRequest(request: NextRequest, access: PanelAccess): Promise<PanelAuthResult> {
  if (!getErpConfig()) {
    return { ok: false, status: 503, code: 'ERP_NOT_CONFIGURED', error: 'La tienda online no está disponible en este servidor.' };
  }

  const header = request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return { ok: false, status: 401, code: 'UNAUTHORIZED', error: 'Necesitas iniciar sesión de nuevo.' };

  let claims: ErpUserClaims;
  try {
    claims = await verifyErpAccessToken(token);
  } catch {
    return { ok: false, status: 401, code: 'UNAUTHORIZED', error: 'Necesitas iniciar sesión de nuevo.' };
  }

  const canManage = hasPermission(claims, 'online_sales.manage');
  const canView = canManage || hasPermission(claims, 'online_sales.view');
  if (!canView) {
    return { ok: false, status: 403, code: 'FORBIDDEN', error: 'Tu usuario no tiene acceso a la tienda online.' };
  }
  if (access === 'manage' && !canManage) {
    return { ok: false, status: 403, code: 'FORBIDDEN', error: 'Tu usuario puede ver la tienda, pero no cambiarla.' };
  }

  const tenantIds = await tenantIdsForPartner(claims.partnerId);
  return { ok: true, claims, tenantId: tenantIds[0] ?? null, canManage };
}

export const STORE_NOT_CREATED = () => panelError(404, 'STORE_NOT_CREATED', 'Tu negocio todavía no tiene una tienda online.');
