import { centralAdminConfigured, getCentralAdminDb } from './central-admin';
import { localAddressTaken } from './store-db';

// Subdominios de createam.cloud que ya usan otros servicios: una tienda con
// alguno de estos nombres nunca recibiría visitas.
export const RESERVED_SUBDOMAINS = new Set([
  'www', 'api', 'api-dev', 'app', 'app-dev', 'auth', 'admin', 'mail', 'cdn', 'static', 'dev', 'beta',
  'createam', 'cyberpos', 'cyberposapp', 'onturn', 'tenant-admin', 'registro', 'login', 'tienda', 'catalogo-dev',
]);

export const SUBDOMAIN_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

/** "Café Aroma" → "cafe-aroma": sin tildes, solo letras, números y guiones. */
export function slugifySubdomain(name: string): string {
  return (
    name
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 30)
      .replace(/-+$/, '') || 'tienda'
  );
}

/** ¿Otra tienda ya usa este dominio o subdominio? Mira la base propia y Firestore. */
export async function addressTakenByOther(field: 'domain' | 'subdomain', value: string, tenantId: string | null): Promise<boolean> {
  if (localAddressTaken(field, value, tenantId)) return true;
  if (!centralAdminConfigured()) return false;
  const snap = await getCentralAdminDb().collection('tenants').where(field, '==', value).limit(3).get();
  return snap.docs.some((doc) => doc.id !== tenantId);
}

/**
 * Subdominio libre para una tienda nueva a partir de su nombre. Si ya existe,
 * agrega -2, -3…
 */
export async function uniqueSubdomain(businessName: string): Promise<string> {
  const base = slugifySubdomain(businessName);
  for (let i = 1; i <= 20; i++) {
    const candidate = i === 1 ? base : `${base.slice(0, 26).replace(/-+$/, '')}-${i}`;
    if (RESERVED_SUBDOMAINS.has(candidate)) continue;
    if (!(await addressTakenByOther('subdomain', candidate, null))) return candidate;
  }
  return `${base.slice(0, 20).replace(/-+$/, '')}-${Date.now().toString(36)}`;
}
