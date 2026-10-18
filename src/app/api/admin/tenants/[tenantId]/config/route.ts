import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getCentralAdminDb } from '@/lib/server/central-admin';
import { isLocalStore } from '@/lib/server/store-db';
import { verifyPlatformAdminRequest } from '@/lib/server/admin-auth';
import { checkRateLimit } from '@/lib/server/rate-limit';

export const runtime = 'nodejs';

function pickConfigUpdates(payload: Record<string, unknown>): FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData> {
  const updates: FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData> = {
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (typeof payload.logo === 'string') {
    updates.logo = payload.logo;
  }

  if (typeof payload.whatsapp === 'string') {
    updates.whatsapp = payload.whatsapp;
  }

  if (payload.colors && typeof payload.colors === 'object') {
    updates.colors = payload.colors;
  }

  if (payload.firebaseConfig && typeof payload.firebaseConfig === 'object') {
    updates.firebaseConfig = payload.firebaseConfig;
  }

  if (typeof payload.domain === 'string') {
    updates.domain = payload.domain;
  }

  if (typeof payload.subdomain === 'string') {
    updates.subdomain = payload.subdomain;
  }

  // Negocio del ERP del que la vitrina lee sus productos; null lo desconecta.
  if (payload.erp === null) {
    updates.erp = FieldValue.delete();
  } else if (payload.erp && typeof payload.erp === 'object') {
    const { partnerId: rawPartnerId, api } = payload.erp as { partnerId?: unknown; api?: unknown };
    const partnerId = Number(rawPartnerId);
    if (Number.isInteger(partnerId) && partnerId > 0) {
      // Se conserva el servidor del ERP del enlace, si lo tenía (ver linkedToCurrentErp).
      updates.erp = typeof api === 'string' && api ? { partnerId, api } : { partnerId };
    }
  }

  return updates;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  const rateLimit = checkRateLimit(request, 'admin-tenants-config-patch');
  if (rateLimit.limited) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        retryAfterSeconds: rateLimit.retryAfterSeconds,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.retryAfterSeconds),
        },
      }
    );
  }

  const authResult = await verifyPlatformAdminRequest(request);

  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
  }

  const { tenantId } = params;

  if (!tenantId) {
    return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 });
  }

  // Las tiendas nacidas en CyberPOS se configuran desde su editor, dentro del ERP.
  if (isLocalStore(tenantId)) {
    return NextResponse.json({ error: 'Esta tienda se administra desde CyberPOS (Venta online › Tienda).' }, { status: 409 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const updateData = pickConfigUpdates(body);

    await getCentralAdminDb().collection('tenants').doc(tenantId).update(updateData);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[admin/tenants/config] Failed to update tenant config:', error);
    return NextResponse.json({ error: 'Failed to update tenant config' }, { status: 500 });
  }
}
