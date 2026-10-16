import { NextRequest, NextResponse } from 'next/server';
import { deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { z } from 'zod';
import { verifyTenantAdminRequest } from '@/lib/server/tenant-auth';
import { getCentralAdminDb } from '@/lib/server/central-admin';
import { getTenantDbFromConfig } from '@/lib/server/tenant-firestore';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { tenantCategoryPayloadSchema } from '@/lib/server/tenant-category-validation';
import { logTenantAdminEvent } from '@/lib/server/tenant-audit';
import { invalidateStoreCatalog } from '@/lib/server/storefront-data';

export const runtime = 'nodejs';

type TenantFirebaseConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

async function getTenantDb(tenantId: string) {
  const tenantDoc = await getCentralAdminDb().collection('tenants').doc(tenantId).get();

  if (!tenantDoc.exists) {
    throw new Error('Tenant not found');
  }

  const tenantData = tenantDoc.data() as { firebaseConfig?: TenantFirebaseConfig };
  if (!tenantData?.firebaseConfig) {
    throw new Error('Missing tenant firebase config');
  }

  return getTenantDbFromConfig(tenantId, tenantData.firebaseConfig);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  const rateLimit = checkRateLimit(request, 'tenant-categories-patch');
  if (rateLimit.limited) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const authResult = await verifyTenantAdminRequest(request);
  if (!authResult.ok || !authResult.context) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
  }

  const categoryId = params.categoryId;
  if (!categoryId) {
    return NextResponse.json({ error: 'Missing categoryId' }, { status: 400 });
  }

  try {
    const rawPayload = (await request.json()) as unknown;
    const payload = tenantCategoryPayloadSchema.parse(rawPayload);
    const db = await getTenantDb(authResult.context.tenantId);
    const categoryRef = doc(db, 'categories', categoryId);
    const existingSnap = await getDoc(categoryRef);

    if (!existingSnap.exists()) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const existing = existingSnap.data() as Record<string, unknown>;

    await updateDoc(categoryRef, {
      label: payload.label,
      value: payload.value,
      icon: payload.icon,
      order: payload.order,
      updatedAt: new Date(),
    });

    invalidateStoreCatalog(authResult.context.tenantId);
    await logTenantAdminEvent({
      tenantId: authResult.context.tenantId,
      action: 'category.updated',
      resource: 'category',
      resourceId: categoryId,
      actor: {
        uid: authResult.context.uid,
        email: authResult.context.email,
        role: authResult.context.role,
      },
      metadata: {
        previousLabel: existing.label || null,
        previousIcon: existing.icon || null,
        previousOrder: existing.order || null,
        nextLabel: payload.label,
        nextIcon: payload.icon,
        nextOrder: payload.order,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid payload', details: error.flatten() }, { status: 400 });
    }

    console.error('[tenant-admin/categories] Failed to update category:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  const rateLimit = checkRateLimit(request, 'tenant-categories-delete');
  if (rateLimit.limited) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const authResult = await verifyTenantAdminRequest(request);
  if (!authResult.ok || !authResult.context) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
  }

  const categoryId = params.categoryId;
  if (!categoryId) {
    return NextResponse.json({ error: 'Missing categoryId' }, { status: 400 });
  }

  try {
    const db = await getTenantDb(authResult.context.tenantId);
    const categoryRef = doc(db, 'categories', categoryId);
    const existingSnap = await getDoc(categoryRef);

    if (!existingSnap.exists()) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const existing = existingSnap.data() as Record<string, unknown>;

    await deleteDoc(categoryRef);

    invalidateStoreCatalog(authResult.context.tenantId);
    await logTenantAdminEvent({
      tenantId: authResult.context.tenantId,
      action: 'category.deleted',
      resource: 'category',
      resourceId: categoryId,
      actor: {
        uid: authResult.context.uid,
        email: authResult.context.email,
        role: authResult.context.role,
      },
      metadata: {
        deletedLabel: existing.label || null,
        deletedIcon: existing.icon || null,
        deletedOrder: existing.order || null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[tenant-admin/categories] Failed to delete category:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
