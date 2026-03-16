import { NextRequest, NextResponse } from 'next/server';
import { getCentralAdminDb } from '@/lib/server/central-admin';
import { verifyTenantAdminRequest } from '@/lib/server/tenant-auth';
import { getPlanPrice, getPlan } from '@/lib/plans';
import type { BillingCycle, PlanId } from '@/lib/plans';

function getMercadoPagoToken(): string {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) {
    throw new Error('MP_ACCESS_TOKEN no configurado');
  }
  return token;
}

export async function POST(request: NextRequest) {
  // Verificar autenticación
  const authResult = await verifyTenantAdminRequest(request);
  if (!authResult.ok || !authResult.context) {
    return NextResponse.json({ error: 'No autorizado' }, { status: authResult.status || 401 });
  }
  const { tenantId } = authResult.context;

  let body: { plan?: unknown; cycle?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const plan = body.plan as PlanId;
  const cycle = (body.cycle ?? 'monthly') as BillingCycle;

  if (!plan || !['starter', 'pro'].includes(plan)) {
    return NextResponse.json({ error: 'Plan inválido' }, { status: 400 });
  }

  const price = getPlanPrice(plan, cycle);
  const planDef = getPlan(plan);
  const cycleLabel = cycle === 'yearly' ? 'Anual' : 'Mensual';
  const description = `Createam ${planDef.name} - ${cycleLabel}`;

  let token: string;
  try {
    token = getMercadoPagoToken();
  } catch {
    return NextResponse.json(
      { error: 'Pagos no configurados. Contacta al soporte.' },
      { status: 503 }
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://createam.cloud';

  try {
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        items: [
          {
            id: `${plan}-${cycle}`,
            title: description,
            quantity: 1,
            unit_price: price,
            currency_id: 'PEN',
          },
        ],
        payer: {
          // Pre-fill con email del tenant si está disponible
        },
        back_urls: {
          success: `${baseUrl}/tenant-admin/billing/success`,
          failure: `${baseUrl}/tenant-admin/billing`,
          pending: `${baseUrl}/tenant-admin/billing/pending`,
        },
        auto_return: 'approved',
        external_reference: JSON.stringify({ tenantId, plan, cycle }),
        notification_url: `${baseUrl}/api/billing/webhook`,
        statement_descriptor: 'CREATEAM',
        expires: false,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error('[billing/subscribe] MP error:', errData);
      return NextResponse.json({ error: 'Error al crear preferencia de pago' }, { status: 502 });
    }

    const preference = await response.json();

    // Guardar intención de pago en Firestore
    await getCentralAdminDb()
      .collection('tenants')
      .doc(tenantId)
      .update({
        pendingPlan: plan,
        pendingCycle: cycle,
        pendingPreferenceId: preference.id,
      });

    // En sandbox usar init_point para ir al checkout
    const checkoutUrl = preference.init_point;

    return NextResponse.json({ checkoutUrl, preferenceId: preference.id });
  } catch (error) {
    console.error('[billing/subscribe] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
