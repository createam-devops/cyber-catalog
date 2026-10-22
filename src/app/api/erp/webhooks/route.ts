import { NextRequest, NextResponse } from 'next/server';
import { getErpConfig } from '@/lib/server/erp/config';
import { alreadyProcessed, tenantIdsForPartner, verifyErpSignature } from '@/lib/server/erp/webhooks';
import { forgetPartnerProfile } from '@/lib/server/erp/partner-profile';
import { forgetPartnerStatus } from '@/lib/server/erp/plan-features';
import { invalidateStoreCatalog } from '@/lib/server/storefront-data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Dirección de avisos de la app `catalog` en el ERP. Cada aviso dice "cambió
 * algo del negocio X"; aquí solo se borra la copia en caché de su catálogo, y
 * la siguiente visita lo vuelve a leer del ERP. Responde 2xx enseguida: si no,
 * el ERP reintenta cada 30 s.
 */
export async function POST(request: NextRequest) {
  const secret = getErpConfig()?.webhookSecret;
  if (!secret) {
    return NextResponse.json({ error: 'Webhooks not configured' }, { status: 404 });
  }

  const body = await request.text();
  const check = verifyErpSignature(request.headers.get('x-signature'), body, secret);
  if (!check.ok) {
    console.warn(`[erp/webhooks] Aviso rechazado: ${check.reason}`);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: { event_id?: string; event_type?: string; data?: { partner_id?: number } };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventId = request.headers.get('x-event-id') || event.event_id || '';
  if (eventId && alreadyProcessed(eventId)) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const partnerId = Number(event.data?.partner_id);
  if (!Number.isInteger(partnerId) || partnerId <= 0) {
    return NextResponse.json({ ok: true, ignored: 'sin partner_id' });
  }

  // Cambió el nombre, el logo o el teléfono del negocio: su perfil se vuelve a leer.
  if (event.event_type === 'partner.updated') {
    forgetPartnerProfile(partnerId);
    forgetPartnerStatus(partnerId);
  }

  try {
    const tenantIds = await tenantIdsForPartner(partnerId);
    tenantIds.forEach(invalidateStoreCatalog);
    return NextResponse.json({ ok: true, invalidated: tenantIds.length });
  } catch (error) {
    // Sin poder ubicar la tienda, que el ERP reintente.
    console.error('[erp/webhooks] No se pudo ubicar la tienda del negocio', partnerId, error);
    return NextResponse.json({ error: 'Temporary failure' }, { status: 503 });
  }
}
