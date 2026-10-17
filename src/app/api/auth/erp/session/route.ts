import { NextRequest, NextResponse } from 'next/server';
import { erpSessionCookieOptions, ERP_SESSION_COOKIE, readErpSession } from '@/lib/server/erp/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Quién está en el panel con su usuario de CyberPOS (o 401 si nadie). */
export async function GET(request: NextRequest) {
  const session = readErpSession(request.cookies.get(ERP_SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({
    user: {
      uid: `erp:${session.userId}`,
      email: session.email,
      tenantId: session.tenantId,
      role: session.role,
      displayName: session.name || undefined,
      provider: 'erp',
    },
  });
}

/** Cerrar sesión. */
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ERP_SESSION_COOKIE, '', erpSessionCookieOptions(0));
  return response;
}
