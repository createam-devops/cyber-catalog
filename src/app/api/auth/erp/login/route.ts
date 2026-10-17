import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { erpLogin, isStoreManagerRole } from '@/lib/server/erp/login';
import { createErpSessionCookie, erpLoginEnabled, erpSessionCookieOptions, ERP_SESSION_COOKIE } from '@/lib/server/erp/session';
import { tenantIdsForPartner } from '@/lib/server/erp/webhooks';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** ¿Está disponible el ingreso con CyberPOS? Lo usa la pantalla de ingreso para mostrar la opción. */
export async function GET() {
  return NextResponse.json({
    enabled: erpLoginEnabled(),
    appUrl: process.env.ERP_APP_URL?.trim() || null,
  });
}

/**
 * Ingreso del dueño con su usuario de CyberPOS. Entra si: el ERP acepta sus
 * credenciales para la app del catálogo, su rol administra el negocio y ese
 * negocio tiene una tienda en el catálogo (`tenant.erp.partnerId`).
 */
export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(request, 'erp-login', 10);
  if (rateLimit.limited) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Espera un minuto y vuelve a intentarlo.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } }
    );
  }
  if (!erpLoginEnabled()) {
    return NextResponse.json({ error: 'El ingreso con CyberPOS no está disponible.' }, { status: 503 });
  }

  const body = (await request.json().catch(() => ({}))) as { email?: unknown; password?: unknown };
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!email || !password || email.length > 200 || password.length > 200) {
    return NextResponse.json({ error: 'Escribe tu correo y tu contraseña.' }, { status: 400 });
  }

  const result = await erpLogin(email, password);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const { claims } = result;
  if (!isStoreManagerRole(claims.role)) {
    return NextResponse.json(
      { error: 'Tu usuario de CyberPOS no administra el negocio. Pide acceso a quien lo administra.' },
      { status: 403 }
    );
  }

  let tenantIds: string[];
  try {
    tenantIds = await tenantIdsForPartner(claims.partnerId);
  } catch (error) {
    console.error('[auth/erp/login] No se pudo buscar la tienda del negocio', claims.partnerId, error);
    return NextResponse.json({ error: 'No pudimos abrir tu tienda. Inténtalo en unos minutos.' }, { status: 503 });
  }
  if (tenantIds.length === 0) {
    return NextResponse.json(
      { error: 'Tu negocio todavía no tiene una tienda en el catálogo. Escríbenos para activarla.' },
      { status: 403 }
    );
  }

  const user = {
    tenantId: tenantIds[0],
    partnerId: claims.partnerId,
    userId: claims.userId,
    email: claims.email || email,
    name: result.name,
    role: /(owner|due[nñ]|propietar)/i.test(claims.role) ? ('owner' as const) : ('admin' as const),
  };

  const response = NextResponse.json({
    ok: true,
    user: { uid: `erp:${user.userId}`, email: user.email, tenantId: user.tenantId, role: user.role, displayName: user.name || undefined, provider: 'erp' },
    mustChangePassword: claims.mustChangePassword,
  });
  response.cookies.set(ERP_SESSION_COOKIE, createErpSessionCookie(user), erpSessionCookieOptions());
  return response;
}
