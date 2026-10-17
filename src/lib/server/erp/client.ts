// Cliente del ERP para el servidor del catálogo. Usa la credencial de la app
// (Basic client_id:client_secret) para pedir un token corto por negocio y con
// ese token lee /integrations/catalog/*. El navegador nunca habla con el ERP.
// Contrato: cyberERP/RESPUESTA_ADECUACIONES_ERP_CATALOGO.md §H.

import { getErpConfig, type ErpConfig } from './config';

export class ErpError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string
  ) {
    super(message);
    this.name = 'ErpError';
  }
}

/**
 * El plan del negocio ya no incluye la app (o el negocio no existe). Es una
 * decisión comercial, no una falla: la vitrina se muestra "en pausa".
 */
export function isAppNotEnabled(error: unknown): boolean {
  return error instanceof ErpError && error.code === 'APP_NOT_ENABLED';
}

const TIMEOUT_MS = 10_000;
/** Se renueva el token un minuto antes de que venza (dura 15). */
const TOKEN_MARGIN_MS = 60_000;

interface CachedToken {
  token: string;
  expiresAt: number;
}

const tokens = new Map<number, CachedToken>();
const pendingTokens = new Map<number, Promise<string>>();

function requireConfig(): ErpConfig {
  const config = getErpConfig();
  if (!config) throw new ErpError('La integración con el ERP no está configurada.', 503, 'ERP_NOT_CONFIGURED');
  return config;
}

async function fetchJson(url: string, init: RequestInit): Promise<{ status: number; body: Record<string, unknown> }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    // Sin caché de Next: cada lectura va al ERP y la caché la lleva storefront-data.
    const res = await fetch(url, { ...init, signal: controller.signal, cache: 'no-store' });
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return { status: res.status, body };
  } catch (error) {
    const reason = controller.signal.aborted ? `no respondió en ${TIMEOUT_MS / 1000} s` : String(error);
    throw new ErpError(`El ERP ${reason}.`, 504, 'ERP_UNREACHABLE');
  } finally {
    clearTimeout(timer);
  }
}

async function issueAppToken(config: ErpConfig, partnerId: number): Promise<string> {
  const basic = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
  const { status, body } = await fetchJson(`${config.baseUrl}/integrations/app-token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ partner_id: partnerId }),
  });
  const token = typeof body.access_token === 'string' ? body.access_token : '';
  if (status !== 200 || !token) {
    throw new ErpError(String(body.error || `El ERP no entregó el token (HTTP ${status}).`), status || 502, body.code ? String(body.code) : undefined);
  }
  const expiresIn = typeof body.expires_in === 'number' ? body.expires_in : 900;
  tokens.set(partnerId, { token, expiresAt: Date.now() + expiresIn * 1000 });
  return token;
}

/** Token de la app para un negocio, reutilizado mientras no esté por vencer. */
export async function getAppToken(partnerId: number): Promise<string> {
  const cached = tokens.get(partnerId);
  if (cached && cached.expiresAt - TOKEN_MARGIN_MS > Date.now()) return cached.token;

  const pending = pendingTokens.get(partnerId);
  if (pending) return pending;

  const request = issueAppToken(requireConfig(), partnerId).finally(() => pendingTokens.delete(partnerId));
  pendingTokens.set(partnerId, request);
  return request;
}

/**
 * GET a la API del ERP en nombre de un negocio. Si el token fue rechazado
 * (vencido, o la app se quitó del plan) se pide uno nuevo una sola vez.
 */
export async function erpGet<T>(partnerId: number, path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  const config = requireConfig();
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') query.set(key, String(value));
  }
  const search = query.toString();
  const url = `${config.baseUrl}${path}${search ? `?${search}` : ''}`;

  for (let attempt = 0; attempt < 2; attempt++) {
    const token = await getAppToken(partnerId);
    const { status, body } = await fetchJson(url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
    if (status === 401 && attempt === 0) {
      tokens.delete(partnerId);
      continue;
    }
    if (status < 200 || status >= 300) {
      throw new ErpError(String(body.error || `El ERP respondió HTTP ${status} en ${path}.`), status, body.code ? String(body.code) : undefined);
    }
    return body as T;
  }
  throw new ErpError('El ERP rechazó la credencial de la app.', 401);
}
