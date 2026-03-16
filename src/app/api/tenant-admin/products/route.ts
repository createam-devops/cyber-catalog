import { NextRequest, NextResponse } from 'next/server';
import { addDoc, collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { z } from 'zod';
import { verifyTenantAdminRequest } from '@/lib/server/tenant-auth';
import { getCentralAdminDb } from '@/lib/server/central-admin';
import { getTenantDbFromConfig } from '@/lib/server/tenant-firestore';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { tenantProductPayloadSchema } from '@/lib/server/tenant-product-validation';
import { logTenantAdminEvent } from '@/lib/server/tenant-audit';
import { checkProductLimit } from '@/lib/server/tenant-plan';

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

export async function GET(request: NextRequest) {
  const rateLimit = checkRateLimit(request, 'tenant-products-get');
  if (rateLimit.limited) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const authResult = await verifyTenantAdminRequest(request);
  if (!authResult.ok || !authResult.context) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
  }

  try {
    const db = await getTenantDb(authResult.context.tenantId);
    const productsQuery = query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(300));
    const snapshot = await getDocs(productsQuery);

    const products = snapshot.docs.map((doc) => {
      const data = doc.data() as ProductDocData;

      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || null,
      };
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error('[tenant-admin/products] Failed to list products:', error);
    return NextResponse.json({ error: 'Failed to load products' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(request, 'tenant-products-post');
  if (rateLimit.limited) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const authResult = await verifyTenantAdminRequest(request);
  if (!authResult.ok || !authResult.context) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
  }

  try {
    const rawPayload = (await request.json()) as unknown;
    const payload = tenantProductPayloadSchema.parse(rawPayload);
    const db = await getTenantDb(authResult.context.tenantId);
    const { tenantId, uid, email, role } = authResult.context;

    // Verificar límite de plan
    const currentSnapshot = await getDocs(query(collection(db, 'products'), limit(301)));
    const limitCheck = await checkProductLimit(tenantId, currentSnapshot.size);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: `Límite de productos alcanzado (${limitCheck.limit}). Actualiza tu plan para agregar más.`, limitReached: true },
        { status: 403 }
      );
    }

    const now = new Date();
    const productRef = await addDoc(collection(db, 'products'), {
      ...payload,
      createdAt: now,
      updatedAt: now,
    });

    await logTenantAdminEvent({
      tenantId,
      action: 'product.created',
      resource: 'product',
      resourceId: productRef.id,
      actor: { uid, email, role },
      metadata: {
        name: payload.name,
        price: payload.price,
        category: payload.category,
        featured: payload.featured,
        imageCount: Array.isArray(payload.imageUrls) ? payload.imageUrls.length : 0,
      },
    });

    return NextResponse.json({ ok: true, id: productRef.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid payload', details: error.flatten() }, { status: 400 });
    }

    console.error('[tenant-admin/products] Failed to create product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
