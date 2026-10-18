// Verificación de los tokens de usuario del ERP (RS256) contra sus llaves
// públicas (JWKS), sin compartir secretos con el ERP. Usa node:crypto: no
// hace falta ninguna dependencia. Mismo criterio que OnTurn
// (onturn-v2/lib/panel/erpAuth.ts): emisor auth-microservice y audiencia de
// la app (catalog).

import { createPublicKey, verify as cryptoVerify, type JsonWebKey, type KeyObject } from 'node:crypto';
import { getErpConfig } from './config';

export interface ErpUserClaims {
  userId: number;
  partnerId: number;
  email: string;
  role: string;
  permissions: string[];
  /** La contraseña la puso un administrador y el ERP pide cambiarla. */
  mustChangePassword: boolean;
}

const JWKS_TTL_MS = 10 * 60 * 1000;
/** Tolerancia de reloj entre servidores. */
const CLOCK_SKEW_SECONDS = 30;

let jwksCache: { url: string; at: number; keys: Map<string, KeyObject> } | null = null;

/** Las llaves están en la raíz del gateway, no bajo /api/v1. */
function jwksUrl(baseUrl: string): string {
  return process.env.ERP_JWKS_URL?.trim() || `${new URL(baseUrl).origin}/.well-known/jwks.json`;
}

async function loadJwks(url: string, force = false): Promise<Map<string, KeyObject>> {
  if (!force && jwksCache && jwksCache.url === url && Date.now() - jwksCache.at < JWKS_TTL_MS) {
    return jwksCache.keys;
  }
  const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`No se pudieron leer las llaves del ERP (HTTP ${res.status}).`);
  const body = (await res.json()) as { keys?: Array<JsonWebKey & { kid?: string }> };
  const keys = new Map<string, KeyObject>();
  for (const jwk of body.keys ?? []) {
    if (jwk.kty === 'RSA' && jwk.kid) keys.set(jwk.kid, createPublicKey({ key: jwk, format: 'jwk' }));
  }
  jwksCache = { url, at: Date.now(), keys };
  return keys;
}

function decodePart(part: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(part, 'base64url').toString('utf8')) as Record<string, unknown>;
}

/** Valida un access token del ERP. Lanza si es inválido, vencido o de otra app (audiencia `catalog`). */
export async function verifyErpAccessToken(token: string): Promise<ErpUserClaims> {
  const config = getErpConfig();
  if (!config) throw new Error('La integración con el ERP no está configurada.');

  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Token mal formado.');
  const header = decodePart(parts[0]);
  if (header.alg !== 'RS256') throw new Error('Algoritmo de firma no permitido.');

  const url = jwksUrl(config.baseUrl);
  const kid = typeof header.kid === 'string' ? header.kid : '';
  let keys = await loadJwks(url);
  let key = kid ? keys.get(kid) : keys.size === 1 ? [...keys.values()][0] : undefined;
  if (!key && kid) {
    // El ERP rota llaves: una desconocida obliga a releer el JWKS una vez.
    keys = await loadJwks(url, true);
    key = keys.get(kid);
  }
  if (!key) throw new Error('El token está firmado con una llave desconocida.');

  const signed = Buffer.from(`${parts[0]}.${parts[1]}`);
  if (!cryptoVerify('RSA-SHA256', signed, key, Buffer.from(parts[2], 'base64url'))) {
    throw new Error('Firma del token inválida.');
  }

  const payload = decodePart(parts[1]);
  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== 'number' || payload.exp < now - CLOCK_SKEW_SECONDS) throw new Error('Token vencido.');
  if (typeof payload.nbf === 'number' && payload.nbf > now + CLOCK_SKEW_SECONDS) throw new Error('Token todavía no válido.');

  const issuer = process.env.ERP_JWT_ISSUER?.trim() || 'auth-microservice';
  if (payload.iss !== issuer) throw new Error('Emisor del token inesperado.');
  const audience = process.env.ERP_JWT_AUDIENCE?.trim() || config.clientId;
  const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!audiences.includes(audience)) throw new Error('El token es de otra aplicación.');
  if (typeof payload.token_type === 'string' && payload.token_type !== 'access') throw new Error('Se esperaba un token de acceso.');

  const userId = Number(payload.user_id);
  const partnerId = Number(payload.partner_id);
  if (!Number.isInteger(userId) || !Number.isInteger(partnerId) || partnerId <= 0) {
    throw new Error('El token no trae usuario o negocio.');
  }

  return {
    userId,
    partnerId,
    email: typeof payload.email === 'string' ? payload.email.toLowerCase() : '',
    role: typeof payload.role === 'string' ? payload.role : '',
    permissions: Array.isArray(payload.permissions) ? payload.permissions.map(String) : [],
    mustChangePassword: payload.must_change_password === true,
  };
}
