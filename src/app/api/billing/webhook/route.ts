import { NextRequest, NextResponse } from 'next/server';
import { getCentralAdminDb } from '@/lib/server/central-admin';
import * as admin from 'firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { type, data } = body as { type?: string; data?: { id?: string | number } };

  // Solo procesamos notificaciones de pago
  if (type !== 'payment') {
    return NextResponse.json({ ok: true });
  }

  const paymentId = data?.id;
  if (!paymentId) {
    return NextResponse.json({ ok: true });
  }

  const mpToken = process.env.MP_ACCESS_TOKEN;
  if (!mpToken) {
    console.error('[billing/webhook] MP_ACCESS_TOKEN not set');
    return NextResponse.json({ ok: true }); // Respond OK to prevent MP retry storms
  }

  try {
    // Obtener detalles del pago desde MP
    const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${mpToken}` },
    });

    if (!paymentRes.ok) {
      console.error(`[billing/webhook] Failed to fetch payment ${paymentId}`);
      return NextResponse.json({ ok: true });
    }

    const payment = await paymentRes.json();
    const { status, external_reference } = payment as {
      status: string;
      external_reference?: string;
    };

    if (!external_reference) {
      console.warn('[billing/webhook] No external_reference in payment');
      return NextResponse.json({ ok: true });
    }

    let ref: { tenantId?: string; plan?: string; cycle?: string };
    try {
      ref = JSON.parse(external_reference);
    } catch {
      console.warn('[billing/webhook] Could not parse external_reference:', external_reference);
      return NextResponse.json({ ok: true });
    }

    const { tenantId, plan, cycle } = ref;
    if (!tenantId || !plan) {
      return NextResponse.json({ ok: true });
    }

    const db = getCentralAdminDb();

    if (status === 'approved') {
      // Calcular fecha de expiración según ciclo
      const now = new Date();
      const expiresAt = new Date(now);
      if (cycle === 'yearly') {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      }

      await db.collection('tenants').doc(tenantId).update({
        status: 'active',
        plan,
        billingCycle: cycle ?? 'monthly',
        subscriptionStatus: 'authorized',
        subscriptionId: String(paymentId),
        subscriptionExpiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
        pendingPlan: admin.firestore.FieldValue.delete(),
        pendingCycle: admin.firestore.FieldValue.delete(),
        pendingPreferenceId: admin.firestore.FieldValue.delete(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`[billing/webhook] Tenant ${tenantId} activated with plan ${plan} (${cycle})`);
    } else if (status === 'cancelled' || status === 'refunded' || status === 'charged_back') {
      await db.collection('tenants').doc(tenantId).update({
        subscriptionStatus: 'cancelled',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`[billing/webhook] Tenant ${tenantId} subscription cancelled (payment ${status})`);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[billing/webhook] Error processing webhook:', error);
    // Siempre responder OK para evitar reintentos de MP
    return NextResponse.json({ ok: true });
  }
}
