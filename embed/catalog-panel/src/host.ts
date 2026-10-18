import { createContext, useContext } from 'react';

/*
 * Lo que el ERP le entrega al editor cuando lo monta
 * (cyberERP/PETICION_ERP_AL_CATALOGO_PANEL.md §3):
 *
 *   appBase        '/apps/catalog/': donde vive el paquete; la API está en `${appBase}api/`
 *   getToken(opts) Promise<string>: token aud=catalog de quien está en el ERP; { force: true } pide uno nuevo
 *   navigate(to)   pedirle al ERP que cambie de sección ('/ajustes') o vaya a otra parte ('/app/...')
 *   onSessionLost  el token ya no sirve ni renovado: el ERP manda a entrar de nuevo
 *
 * El editor no inicia sesión ni guarda el token: lo pide antes de cada llamada.
 */
export interface PanelHost {
  appBase: string;
  getToken: (opts?: { force?: boolean }) => Promise<string>;
  navigate: (to: string, opts?: { replace?: boolean }) => void;
  onSessionLost?: () => void;
}

const HostContext = createContext<PanelHost | null>(null);
export const HostProvider = HostContext.Provider;

export function useHost(): PanelHost {
  const host = useContext(HostContext);
  if (!host) throw new Error('El editor no está montado dentro del ERP');
  return host;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status = 0,
    readonly code: string | null = null
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const OFFLINE = 'No se pudo conectar. Revisa tu conexión e inténtalo de nuevo.';
const FALLBACK = 'No se pudo completar la operación. Inténtalo de nuevo.';

export type Api = <T>(path: string, options?: { method?: string; body?: unknown; form?: FormData }) => Promise<T>;

/** Cliente de la API del editor (`${appBase}api`), con el token que da el ERP. */
export function createApi(host: PanelHost): Api {
  const base = `${String(host.appBase ?? '/').replace(/\/+$/, '')}/api`;

  async function call(path: string, options: { method?: string; body?: unknown; form?: FormData }, force: boolean) {
    const token = await host.getToken({ force });
    const headers: Record<string, string> = { Authorization: `Bearer ${token}`, Accept: 'application/json' };
    let body: BodyInit | undefined;
    if (options.form) body = options.form;
    else if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(options.body);
    }
    return fetch(base + path, { method: options.method ?? 'GET', headers, body });
  }

  return async function api<T>(path: string, options: { method?: string; body?: unknown; form?: FormData } = {}): Promise<T> {
    let res: Response;
    try {
      res = await call(path, options, false);
      // El token pudo vencer entre que el ERP lo entregó y la llamada: una sola vuelta con uno nuevo.
      if (res.status === 401) res = await call(path, options, true);
    } catch {
      throw new ApiError(OFFLINE);
    }
    if (res.status === 401) {
      host.onSessionLost?.();
      throw new ApiError('Necesitas iniciar sesión de nuevo.', 401, 'unauthorized');
    }
    const data = (await res.json().catch(() => null)) as (T & { error?: string; code?: string }) | null;
    if (!res.ok) throw new ApiError(data?.error || FALLBACK, res.status, data?.code ?? null);
    return data as T;
  };
}
