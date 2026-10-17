import { NextRequest } from 'next/server';
import { getCentralAdminAuth, getCentralAdminDb } from '@/lib/server/central-admin';
import { ERP_SESSION_COOKIE, readErpSession } from '@/lib/server/erp/session';

export interface TenantRequestContext {
  uid: string;
  email: string;
  tenantId: string;
  role: 'admin' | 'owner';
}

export interface TenantAuthResult {
  ok: boolean;
  status?: number;
  error?: string;
  context?: TenantRequestContext;
}

/**
 * Una petición que cambia datos con la cookie del ERP tiene que venir del
 * mismo sitio: así otro sitio no puede usar la sesión del dueño a sus espaldas.
 */
function isSameOriginRequest(request: NextRequest): boolean {
  if (request.method === 'GET' || request.method === 'HEAD') return true;
  const origin = request.headers.get('origin');
  if (!origin) return request.headers.get('sec-fetch-site') === 'same-origin';
  try {
    return new URL(origin).host === (request.headers.get('host') || request.nextUrl.host);
  } catch {
    return false;
  }
}

/** Dueño que entró con su usuario de CyberPOS (cookie firmada, ver lib/server/erp/session.ts). */
function verifyErpSessionRequest(request: NextRequest): TenantAuthResult {
  const session = readErpSession(request.cookies.get(ERP_SESSION_COOKIE)?.value);
  if (!session) {
    return { ok: false, status: 401, error: 'Missing bearer token' };
  }
  if (!isSameOriginRequest(request)) {
    return { ok: false, status: 403, error: 'Cross-site request rejected' };
  }
  return {
    ok: true,
    context: {
      uid: `erp:${session.userId}`,
      email: session.email,
      tenantId: session.tenantId,
      role: session.role,
    },
  };
}

export async function verifyTenantAdminRequest(request: NextRequest): Promise<TenantAuthResult> {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  // Sin token de Firebase, puede ser un dueño que entró con CyberPOS.
  if (!token) {
    return verifyErpSessionRequest(request);
  }

  try {
    const decoded = await getCentralAdminAuth().verifyIdToken(token, true);
    const userDoc = await getCentralAdminDb().collection('users').doc(decoded.uid).get();

    if (!userDoc.exists) {
      return { ok: false, status: 403, error: 'User profile not found' };
    }

    const userData = userDoc.data() as {
      tenantId?: string;
      role?: 'admin' | 'owner';
      email?: string;
    };

    if (!userData?.tenantId) {
      return { ok: false, status: 403, error: 'User is not linked to a tenant' };
    }

    return {
      ok: true,
      context: {
        uid: decoded.uid,
        email: (decoded.email || userData.email || '').toLowerCase(),
        tenantId: userData.tenantId,
        role: userData.role || 'owner',
      },
    };
  } catch {
    return { ok: false, status: 401, error: 'Invalid or expired token' };
  }
}
