// Ingreso del dueño de una tienda con su usuario del ERP. El servidor del
// catálogo hace el login contra el ERP con `app: catalog` (el ERP comprueba
// que el usuario tenga acceso a la app por su plan) y valida el token con las
// llaves públicas. El token del ERP nunca llega al navegador.

import { getErpConfig } from './config';
import { verifyErpAccessToken, type ErpUserClaims } from './jwt';

export type ErpLoginResult =
  | { ok: true; claims: ErpUserClaims; name: string }
  | { ok: false; status: number; error: string };

export async function erpLogin(email: string, password: string): Promise<ErpLoginResult> {
  const config = getErpConfig();
  if (!config) {
    return { ok: false, status: 503, error: 'El ingreso con CyberPOS no está disponible.' };
  }

  let res: Response;
  try {
    res = await fetch(`${config.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email, password, app: config.clientId }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return { ok: false, status: 503, error: 'No pudimos comunicarnos con CyberPOS. Inténtalo en unos minutos.' };
  }

  const body = (await res.json().catch(() => ({}))) as {
    error?: string;
    tokens?: { access_token?: string };
    user?: { name?: string };
  };

  // El ERP ya responde en español y distingue cuenta bloqueada, inactiva o
  // suspendida; las credenciales malas son opacas a propósito.
  if (res.status === 401 || res.status === 403) {
    return { ok: false, status: 401, error: body.error || 'Correo o contraseña incorrectos.' };
  }
  if (res.status === 429) {
    return { ok: false, status: 429, error: 'Demasiados intentos. Espera un momento y vuelve a intentarlo.' };
  }
  const accessToken = body.tokens?.access_token;
  if (!res.ok || !accessToken) {
    return { ok: false, status: 503, error: 'CyberPOS no respondió como esperábamos. Inténtalo en unos minutos.' };
  }

  try {
    const claims = await verifyErpAccessToken(accessToken);
    return { ok: true, claims, name: body.user?.name?.trim() || '' };
  } catch (error) {
    console.error('[erp/login] Token del ERP rechazado:', error);
    return { ok: false, status: 503, error: 'No pudimos validar tu sesión de CyberPOS.' };
  }
}

/**
 * Solo quienes administran el negocio entran al panel de la tienda: un cajero
 * con acceso al ERP no. Los roles del ERP son editables por negocio; se
 * reconocen por el nombre, igual que en OnTurn.
 */
export function isStoreManagerRole(role: string): boolean {
  return /(owner|admin|due[nñ]|propietar|gerente|manager)/i.test(role);
}
