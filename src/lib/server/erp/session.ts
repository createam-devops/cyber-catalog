// Sesión del panel para quien entró con su usuario del ERP: una cookie propia
// del catálogo, httpOnly y firmada (HMAC-SHA256 con ERP_SESSION_SECRET). No
// guarda el token del ERP.

import { createHmac, timingSafeEqual } from 'node:crypto';
import { getErpConfig } from './config';

export const ERP_SESSION_COOKIE = 'catalog_erp_session';
export const ERP_SESSION_MAX_AGE_SECONDS = 12 * 60 * 60;

export interface ErpSession {
  tenantId: string;
  partnerId: number;
  userId: number;
  email: string;
  name: string;
  role: 'owner' | 'admin';
  /** Vence (segundos Unix). */
  exp: number;
}

function sessionSecret(): string | null {
  const secret = process.env.ERP_SESSION_SECRET?.trim();
  return secret && secret.length >= 32 ? secret : null;
}

/** El ingreso con el ERP necesita la integración configurada y un secreto de sesión de 32+ caracteres. */
export function erpLoginEnabled(): boolean {
  return Boolean(getErpConfig() && sessionSecret());
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function createErpSessionCookie(session: Omit<ErpSession, 'exp'>): string {
  const secret = sessionSecret();
  if (!secret) throw new Error('ERP_SESSION_SECRET no está configurado (mínimo 32 caracteres).');
  const payload = Buffer.from(
    JSON.stringify({ ...session, exp: Math.floor(Date.now() / 1000) + ERP_SESSION_MAX_AGE_SECONDS })
  ).toString('base64url');
  return `${payload}.${sign(payload, secret)}`;
}

export function readErpSession(value: string | undefined | null): ErpSession | null {
  const secret = sessionSecret();
  if (!value || !secret) return null;
  const [payload, signature] = value.split('.');
  if (!payload || !signature) return null;

  const expected = Buffer.from(sign(payload, secret));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as ErpSession;
    if (typeof session.exp !== 'number' || session.exp < Math.floor(Date.now() / 1000)) return null;
    if (!session.tenantId || !Number.isInteger(session.partnerId)) return null;
    return session;
  } catch {
    return null;
  }
}

export function erpSessionCookieOptions(maxAge = ERP_SESSION_MAX_AGE_SECONDS) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}
