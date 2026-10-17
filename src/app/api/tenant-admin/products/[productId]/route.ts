import { NextRequest, NextResponse } from 'next/server';
import { deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { z } from 'zod';
import { verifyTenantAdminRequest } from '@/lib/server/tenant-auth';
import { getCentralAdminDb } from '@/lib/server/central-admin';
import { getTenantDbFromConfig } from '@/lib/server/tenant-firestore';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { tenantProductPayloadSchema } from '@/lib/server/tenant-product-validation';
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

type ProductDocData = {
  createdAt?: { toDate?: () => Date };
  updatedAt?: { toDate?: () => Date };
  [key: string]: unknown;
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

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  const rateLimit = checkRateLimit(request, 'tenant-product-get');
  if (rateLimit.limited) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const authResult = await verifyTenantAdminRequest(request);
  if (!authResult.ok || !authResult.context) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
  }

  const productId = params.productId;
  if (!productId) {
    return NextResponse.json({ error: 'Missing productId' }, { status: 400 });
  }

  try {
    const db = await getTenantDb(authResult.context.tenantId);
    const productSnap = await getDoc(doc(db, 'products', productId));

    if (!productSnap.exists()) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const data = productSnap.data() as ProductDocData;
    const product = {
      id: productSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString?.() || null,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || null,
    };

    return NextResponse.json({ product });
  } catch (error) {
    console.error('[tenant-admin/products/:id] Failed to load product:', error);
    return NextResponse.json({ error: 'Failed to load product' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  const rateLimit = checkRateLimit(request, 'tenant-product-patch');
  if (rateLimit.limited) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const authResult = await verifyTenantAdminRequest(request);
  if (!authResult.ok || !authResult.context) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
  }

  const productId = params.productId;
  if (!productId) {
    return NextResponse.json({ error: 'Missing productId' }, { status: 400 });
  }

  try {
    const rawPayload = (await request.json()) as unknown;
    const payload = tenantProductPayloadSchema.parse(rawPayload);
    const db = await getTenantDb(authResult.context.tenantId);
    const productRef = doc(db, 'products', productId);
    const existingSnap = await getDoc(productRef);

    if (!existingSnap.exists()) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const existing = existingSnap.data() as Record<string, unknown>;

    await updateDoc(productRef, {
      ...payload,
      updatedAt: new Date(),
    });

    invalidateStoreCatalog(authResult.context.tenantId);
    await logTenantAdminEvent({
      tenantId: authResult.context.tenantId,
      action: 'product.updated',
      resource: 'product',
      resourceId: productId,
      actor: {
        uid: authResult.context.uid,
        email: authResult.context.email,
        role: authResult.context.role,
      },
      metadata: {
        previousName: existing.name || null,
        previousPrice: existing.price || null,
        nextName: payload.name,
        nextPrice: payload.price,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid payload', details: error.flatten() }, { status: 400 });
    }

    console.error('[tenant-admin/products/:id] Failed to update product:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  const rateLimit = checkRateLimit(request, 'tenant-product-delete');
  if (rateLimit.limited) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const authResult = await verifyTenantAdminRequest(request);
  if (!authResult.ok || !authResult.context) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
  }

  const productId = params.productId;
  if (!productId) {
    return NextResponse.json({ error: 'Missing productId' }, { status: 400 });
  }

  try {
    const db = await getTenantDb(authResult.context.tenantId);
    const productRef = doc(db, 'products', productId);
    const existingSnap = await getDoc(productRef);

    if (!existingSnap.exists()) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const existing = existingSnap.data() as Record<string, unknown>;

    await deleteDoc(productRef);

    invalidateStoreCatalog(authResult.context.tenantId);
    await logTenantAdminEvent({
      tenantId: authResult.context.tenantId,
      action: 'product.deleted',
      resource: 'product',
      resourceId: productId,
      actor: {
        uid: authResult.context.uid,
        email: authResult.context.email,
        role: authResult.context.role,
      },
      metadata: {
        deletedName: existing.name || null,
        deletedPrice: existing.price || null,
        deletedCategory: existing.category || null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[tenant-admin/products/:id] Failed to delete product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
