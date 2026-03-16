/**
 * Rate limiter en memoria por IP.
 * Adecuado para un proceso Node.js único (Docker single-instance).
 */

interface Window {
  count: number;
  resetAt: number;
}

const store = new Map<string, Window>();

// Limpiar entradas expiradas cada 5 minutos
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, window] of store.entries()) {
      if (window.resetAt < now) store.delete(key);
    }
  }, 5 * 60 * 1000);
}

/**
 * @param ip        IP del cliente
 * @param limit     Máximo de requests permitidos en el periodo
 * @param windowMs  Duración del periodo en milisegundos
 * @returns { allowed, remaining, resetAt }
 */
export function rateLimit(
  ip: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || entry.resetAt < now) {
    store.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  entry.count += 1;
  const remaining = Math.max(0, limit - entry.count);
  return { allowed: entry.count <= limit, remaining, resetAt: entry.resetAt };
}
