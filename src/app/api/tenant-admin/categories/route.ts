import { NextRequest, NextResponse } from 'next/server';
import { addDoc, collection, getDocs, orderBy, query } from 'firebase/firestore';
import { z } from 'zod';
import { verifyTenantAdminRequest } from '@/lib/server/tenant-auth';
import { getCentralAdminDb } from '@/lib/server/central-admin';
import { getTenantDbFromConfig } from '@/lib/server/tenant-firestore';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { tenantCategoryPayloadSchema } from '@/lib/server/tenant-category-validation';
import { logTenantAdminEvent } from '@/lib/server/tenant-audit';
import { checkCategoryLimit } from '@/lib/server/tenant-plan';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

export async function GET(request: NextRequest) {
  const rateLimit = checkRateLimit(request, 'tenant-categories-get');
  if (rateLimit.limited) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const authResult = await verifyTenantAdminRequest(request);
  if (!authResult.ok || !authResult.context) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
  }

  try {
    const db = await getTenantDb(authResult.context.tenantId);
    const snapshot = await getDocs(query(collection(db, 'categories'), orderBy('order', 'asc')));

    const categories = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('[tenant-admin/categories] Failed to list categories:', error);
    return NextResponse.json({ error: 'Failed to load categories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(request, 'tenant-categories-post');
  if (rateLimit.limited) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const authResult = await verifyTenantAdminRequest(request);
  if (!authResult.ok || !authResult.context) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
  }

  try {
    const rawPayload = (await request.json()) as unknown;
    const payload = tenantCategoryPayloadSchema.parse(rawPayload);
    const db = await getTenantDb(authResult.context.tenantId);

    // Verificar límite de plan
    const currentSnapshot = await getDocs(query(collection(db, 'categories'), orderBy('order', 'asc')));
    const limitCheck = await checkCategoryLimit(authResult.context.tenantId, currentSnapshot.size);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: `Límite de categorías alcanzado (${limitCheck.limit}). Actualiza tu plan para agregar más.`, limitReached: true },
        { status: 403 }
      );
    }

    const categoryRef = await addDoc(collection(db, 'categories'), {
      label: payload.label,
      value: payload.value,
      icon: payload.icon,
      order: payload.order,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await logTenantAdminEvent({
      tenantId: authResult.context.tenantId,
      action: 'category.created',
      resource: 'category',
      resourceId: categoryRef.id,
      actor: {
        uid: authResult.context.uid,
        email: authResult.context.email,
        role: authResult.context.role,
      },
      metadata: {
        label: payload.label,
        value: payload.value,
        icon: payload.icon,
        order: payload.order,
      },
    });

    return NextResponse.json({ ok: true, id: categoryRef.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid payload', details: error.flatten() }, { status: 400 });
    }

    console.error('[tenant-admin/categories] Failed to create category:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
