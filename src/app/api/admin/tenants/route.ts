import { NextRequest, NextResponse } from 'next/server';
import { getCentralAdminDb } from '@/lib/server/central-admin';
import { listLocalStores } from '@/lib/server/store-db';
import { verifyPlatformAdminRequest } from '@/lib/server/admin-auth';
import { checkRateLimit } from '@/lib/server/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type TenantStatus = 'pending' | 'active' | 'suspended' | 'rejected';

function serializeTenant(doc: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>) {
  const data = doc.data();

  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() || null,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || null,
    approvedAt: data.approvedAt?.toDate?.()?.toISOString?.() || null,
  };
}

export async function GET(request: NextRequest) {
  const rateLimit = checkRateLimit(request, 'admin-tenants-get');
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

  try {
    const statusParam = request.nextUrl.searchParams.get('status');
    const statusFilter = statusParam === 'all' || !statusParam ? undefined : (statusParam as TenantStatus);
    const db = getCentralAdminDb();

    let query: FirebaseFirestore.Query = db.collection('tenants').orderBy('createdAt', 'desc');

    if (statusFilter) {
      query = db.collection('tenants').where('status', '==', statusFilter).orderBy('createdAt', 'desc');
    }

    const snapshot = await query.get();
    // Primero las tiendas nacidas en CyberPOS (base propia), después las de Firestore.
    const local = listLocalStores(statusFilter).map((tenant) => ({
      ...tenant,
      source: 'cyberpos',
      createdAt: tenant.createdAt.toISOString(),
      updatedAt: tenant.updatedAt.toISOString(),
    }));
    const tenants = [...local, ...snapshot.docs.map(serializeTenant)];

    return NextResponse.json({ tenants });
  } catch (error) {
    console.error('[admin/tenants] Failed to list tenants:', error);
    return NextResponse.json({ error: 'Failed to list tenants' }, { status: 500 });
  }
}
