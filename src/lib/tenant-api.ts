"use client";

import { auth } from '@/lib/auth';

/** Llama a /api/tenant-admin/* con el token de la sesión del dueño. */
export async function tenantApiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) {
    throw new Error('No hay sesión activa');
  }

  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, { ...options, headers, credentials: 'include' });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || 'No se pudo completar la operación');
  }
  return payload as T;
}
