import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyTenantAdminRequest } from '@/lib/server/tenant-auth';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { tenantSettingsPatchSchema } from '@/lib/server/tenant-settings-validation';
import { applyTenantSettingsPatch } from '@/lib/server/tenant-settings-update';
import { getTenantById } from '@/lib/server/tenants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rateLimit = checkRateLimit(request, 'tenant-settings-get');
  if (rateLimit.limited) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const authResult = await verifyTenantAdminRequest(request);
  if (!authResult.ok || !authResult.context) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
  }

  try {
    // De la base propia, de Firestore o, en desarrollo, de STOREFRONT_DEV_STORES.
    // Las fechas viajan como texto ISO.
    const tenant = await getTenantById(authResult.context.tenantId);
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    return NextResponse.json({ tenant });
  } catch (error) {
    console.error('[tenant-admin/settings] Failed to load settings:', error);
    return NextResponse.json({ error: 'Failed to load tenant settings' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const rateLimit = checkRateLimit(request, 'tenant-settings-patch');
  if (rateLimit.limited) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const authResult = await verifyTenantAdminRequest(request);
  if (!authResult.ok || !authResult.context) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
  }

  try {
    const payload = tenantSettingsPatchSchema.parse((await request.json()) as unknown);
    const { tenantId, uid, email, role } = authResult.context;
    const result = await applyTenantSettingsPatch(tenantId, payload, { uid, email, role });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid payload', details: error.flatten() }, { status: 400 });
    }

    console.error('[tenant-admin/settings] Failed to update settings:', error);
    return NextResponse.json({ error: 'Failed to update tenant settings' }, { status: 500 });
  }
}
