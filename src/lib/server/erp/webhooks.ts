// Avisos del ERP (cambió un producto, su stock, sus fotos, su publicación, una
// categoría o una marca). Llegan firmados a la dirección de la app con
// `X-Signature: t=<unix>,v1=<hex HMAC-SHA256(secreto, "<unix>." + cuerpo)>`.
// Contrato: cyberERP/RESPUESTA_ADECUACIONES_ERP_CATALOGO.md §H.4.

import { createHmac, timingSafeEqual } from 'node:crypto';
import { getCentralAdminDb } from '../central-admin';
import { listDevStores } from '../storefront-data';

/** Avisos más viejos que esto se rechazan (un reenvío de un aviso capturado). */
export const MAX_SIGNATURE_AGE_SECONDS = 300;

export type SignatureCheck = { ok: true } | { ok: false; reason: string };

export function verifyErpSignature(header: string | null, body: string, secret: string, nowSeconds = Math.floor(Date.now() / 1000)): SignatureCheck {
  if (!header) return { ok: false, reason: 'falta X-Signature' };
  const parts = Object.fromEntries(
    header.split(',').map((part) => {
      const [key, ...rest] = part.trim().split('=');
      return [key, rest.join('=')];
    })
  );
  const timestamp = Number(parts.t);
  if (!Number.isFinite(timestamp) || !parts.v1) return { ok: false, reason: 'firma mal formada' };
  if (Math.abs(nowSeconds - timestamp) > MAX_SIGNATURE_AGE_SECONDS) return { ok: false, reason: 'firma vencida' };

  const expected = createHmac('sha256', secret).update(`${timestamp}.`).update(body).digest();
  const received = Buffer.from(String(parts.v1), 'hex');
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return { ok: false, reason: 'firma inválida' };
  }
  return { ok: true };
}

// --- Avisos repetidos: el ERP reintenta hasta 10 veces; cada event_id se procesa una vez.
const SEEN_TTL_MS = 60 * 60 * 1000;
const SEEN_MAX = 5000;
const seen = new Map<string, number>();

export function alreadyProcessed(eventId: string): boolean {
  const now = Date.now();
  if (seen.size > SEEN_MAX) {
    for (const [id, at] of seen) {
      if (now - at > SEEN_TTL_MS || seen.size > SEEN_MAX / 2) seen.delete(id);
    }
  }
  if (seen.has(eventId)) return true;
  seen.set(eventId, now);
  return false;
}

// --- Qué tiendas usan un negocio del ERP (normalmente una).
const TENANTS_TTL_MS = 5 * 60 * 1000;
const tenantsByPartner = new Map<number, { at: number; ids: string[] }>();

export async function tenantIdsForPartner(partnerId: number): Promise<string[]> {
  // En desarrollo, las tiendas de prueba (STOREFRONT_DEV_STORES) van primero.
  const devIds = listDevStores()
    .filter((store) => store.erp?.partnerId === partnerId)
    .map((store) => store.id);
  if (devIds.length) return devIds;

  const cached = tenantsByPartner.get(partnerId);
  if (cached && Date.now() - cached.at < TENANTS_TTL_MS) return cached.ids;
  const snap = await getCentralAdminDb().collection('tenants').where('erp.partnerId', '==', partnerId).get();
  const ids = snap.docs.map((doc) => doc.id);
  tenantsByPartner.set(partnerId, { at: Date.now(), ids });
  return ids;
}
