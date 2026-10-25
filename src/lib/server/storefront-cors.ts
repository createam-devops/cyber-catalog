// Permiso (CORS) para que la web propia de una tienda (p. ej. bellasorpresa.pe,
// que se publica aparte) llame a las APIs públicas de la vitrina desde el
// navegador: solo su dominio guardado, con o sin www, y localhost para probar.

/** El origen que se autoriza, o null si no es el de la tienda. */
export function allowedStoreOrigin(origin: string | null, storeDomain: string | undefined | null): string | null {
  if (!origin) return null;
  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();
  if ((host === 'localhost' || host === '127.0.0.1') && (url.protocol === 'http:' || url.protocol === 'https:')) return origin;
  const domain = storeDomain?.toLowerCase().replace(/^www\./, '');
  if (domain && url.protocol === 'https:' && (host === domain || host === `www.${domain}`)) return origin;
  return null;
}

/** Cabeceras CORS para ese origen (sin origen autorizado, solo `Vary`). */
export function storeCorsHeaders(origin: string | null, methods = 'GET, OPTIONS'): Record<string, string> {
  return origin
    ? {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': methods,
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
        Vary: 'Origin',
      }
    : { Vary: 'Origin' };
}

/** El dominio de la tienda que pide la web propia: `domain` o `_domain` en la consulta. */
export function requestedStoreDomain(searchParams: URLSearchParams): string | null {
  const domain = (searchParams.get('domain') || searchParams.get('_domain') || '').trim().toLowerCase();
  return /^[a-z0-9.-]{3,253}$/.test(domain) ? domain : null;
}
