// Avisos del ERP (cambió un producto, su stock, sus fotos, su publicación, una
// categoría o una marca). Llegan firmados a la dirección de la app con
// `X-Signature: t=<unix>,v1=<hex HMAC-SHA256(secreto, "<unix>." + cuerpo)>`.
// Contrato: cyberERP/RESPUESTA_ADECUACIONES_ERP_CATALOGO.md §H.4.

import { createHmac, timingSafeEqual } from 'node:crypto';
import { centralAdminConfigured, getCentralAdminDb } from '../central-admin';
import { listDevStores } from '../storefront-data';
import { localStoreIdsForPartner } from '../store-db';
import { erpApiHost, linkedToCurrentErp } from './config';

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
// Las tiendas viejas de Firestore enlazadas a mano por el superadmin se recuerdan 5 minutos.
const LEGACY_TTL_MS = 5 * 60 * 1000;
const legacyByPartner = new Map<number, { at: number; ids: string[] }>();

/**
 * Las tiendas del negocio en el ERP configurado, la de la base propia primero:
 * las de prueba locales (STOREFRONT_DEV_STORES), las de la base propia y las
 * viejas de Firestore enlazadas a mano. Un mismo número de negocio existe en
 * dev y en producción: solo cuentan las enlazadas a este ERP.
 */
export async function tenantIdsForPartner(partnerId: number): Promise<string[]> {
  const api = erpApiHost();
  const ids = [
    ...(api ? localStoreIdsForPartner(partnerId, api) : []),
    ...listDevStores()
      .filter((store) => store.erp?.partnerId === partnerId && linkedToCurrentErp(store.erp))
      .map((store) => store.id),
  ];
  if (!centralAdminConfigured()) return ids;

  let legacy = legacyByPartner.get(partnerId);
  if (!legacy || Date.now() - legacy.at >= LEGACY_TTL_MS) {
    const snap = await getCentralAdminDb().collection('tenants').where('erp.partnerId', '==', partnerId).get();
    legacy = { at: Date.now(), ids: snap.docs.filter((doc) => linkedToCurrentErp(doc.get('erp'))).map((doc) => doc.id) };
    legacyByPartner.set(partnerId, legacy);
  }
  return [...ids, ...legacy.ids];
}
