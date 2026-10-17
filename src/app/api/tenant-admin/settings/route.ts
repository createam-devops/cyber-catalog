import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { verifyTenantAdminRequest } from '@/lib/server/tenant-auth';
import { getCentralAdminDb } from '@/lib/server/central-admin';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { tenantSettingsPatchSchema } from '@/lib/server/tenant-settings-validation';
import { logTenantAdminEvent } from '@/lib/server/tenant-audit';
import { getTenantPlanInfo } from '@/lib/server/tenant-plan';
import { getPlan } from '@/lib/plans';
import { normalizeWhatsapp } from '@/lib/storefront/public-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function serializeTenant(data: FirebaseFirestore.DocumentData, tenantId: string) {
  return {
    id: tenantId,
    ...data,
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() || null,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || null,
    approvedAt: data.approvedAt?.toDate?.()?.toISOString?.() || null,
    trialEndsAt: data.trialEndsAt?.toDate?.()?.toISOString?.() || data.trialEndsAt || null,
  };
}

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
    const tenantId = authResult.context.tenantId;
    const tenantDoc = await getCentralAdminDb().collection('tenants').doc(tenantId).get();

    if (!tenantDoc.exists) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    return NextResponse.json({ tenant: serializeTenant(tenantDoc.data() || {}, tenantId) });
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
    const rawPayload = (await request.json()) as unknown;
    const payload = tenantSettingsPatchSchema.parse(rawPayload);
    const tenantId = authResult.context.tenantId;

    const updateData: FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData> = {
      updatedAt: FieldValue.serverTimestamp(),
    };
    const changedFields: string[] = [];

    const planFeatures = getPlan((await getTenantPlanInfo(tenantId)).plan).features;

    if (typeof payload.name === 'string') {
      updateData.name = payload.name;
      changedFields.push('name');
    }
    if (typeof payload.logo === 'string') {
      updateData.logo = payload.logo;
      changedFields.push('logo');
    }
    if (typeof payload.primaryColor === 'string') {
      updateData.primaryColor = payload.primaryColor;
      changedFields.push('primaryColor');
    }
    if (typeof payload.whatsapp === 'string') {
      // Se guarda listo para wa.me. Un número que no sirve se rechaza: los
      // pedidos de la tienda llegan a ese número.
      const whatsapp = payload.whatsapp ? normalizeWhatsapp(payload.whatsapp) : '';
      if (whatsapp === null) {
        return NextResponse.json(
          { error: 'El número de WhatsApp no es válido. Escríbelo con código de país, por ejemplo 51987654321.' },
          { status: 400 }
        );
      }
      updateData.whatsapp = whatsapp;
      changedFields.push('whatsapp');
    }
    // El SEO personalizado es del plan Pro; en los demás se ignora.
    if (planFeatures.seo && typeof payload.seoTitle === 'string') {
      updateData.seoTitle = payload.seoTitle;
      changedFields.push('seoTitle');
    }
    if (planFeatures.seo && typeof payload.seoDescription === 'string') {
      updateData.seoDescription = payload.seoDescription;
      changedFields.push('seoDescription');
    }
    if (payload.storefront) {
      const storefront = { ...payload.storefront };
      // Mostrar el stock en la vitrina también es del plan Pro.
      if (storefront.layout?.showStock && !planFeatures.stock) {
        storefront.layout = { ...storefront.layout, showStock: false };
      }
      updateData.storefront = storefront;
      changedFields.push('storefront');
    }
    if (typeof payload.domain === 'string' || payload.domain === null) {
      updateData.domain = payload.domain;
      changedFields.push('domain');
    }
    if (typeof payload.subdomain === 'string' || payload.subdomain === null) {
      updateData.subdomain = payload.subdomain;
      changedFields.push('subdomain');
    }

    if (payload.colors && typeof payload.colors === 'object') {
      updateData.colors = payload.colors;
      changedFields.push('colors');
    }

    if (payload.socialMedia && typeof payload.socialMedia === 'object') {
      updateData.socialMedia = payload.socialMedia;
      changedFields.push('socialMedia');
    }

    if (Array.isArray(payload.heroSlides)) {
      updateData.heroSlides = payload.heroSlides;
      changedFields.push('heroSlides');
    }

    await getCentralAdminDb().collection('tenants').doc(tenantId).update(updateData);

    await logTenantAdminEvent({
      tenantId,
      action: 'tenant.settings.updated',
      resource: 'tenant',
      resourceId: tenantId,
      actor: {
        uid: authResult.context.uid,
        email: authResult.context.email,
        role: authResult.context.role,
      },
      metadata: {
        changedFields,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid payload', details: error.flatten() }, { status: 400 });
    }

    console.error('[tenant-admin/settings] Failed to update settings:', error);
    return NextResponse.json({ error: 'Failed to update tenant settings' }, { status: 500 });
  }
}
