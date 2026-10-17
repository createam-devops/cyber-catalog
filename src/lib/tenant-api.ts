"use client";

import { auth } from '@/lib/auth';

/**
 * Llama a /api/tenant-admin/* como el dueño de la tienda. Con sesión de
 * Firebase manda su token; si entró con CyberPOS, la sesión viaja en la cookie
 * del servidor (credentials: 'include').
 */
export async function tenantApiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const token = await auth.currentUser?.getIdToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, { ...options, headers, credentials: 'include' });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || (response.status === 401 ? 'Tu sesión venció. Vuelve a entrar.' : 'No se pudo completar la operación'));
  }
  return payload as T;
}
