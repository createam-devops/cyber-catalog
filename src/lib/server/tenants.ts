import { getCentralAdminDb } from './central-admin';
import type { TenantConfig } from '@/lib/types';

/**
 * La tienda que atiende un dominio, o `null` si ninguna lo usa.
 *
 * Se lee con el Admin SDK, no con el de cliente. La vitrina se renderiza en el
 * servidor y sin sesión: con el SDK de cliente la lectura dependía de las
 * reglas de Firestore, y cuando esas reglas pasaron a pedir sesión (marzo de
 * 2026) TODAS las tiendas empezaron a responder "Tienda no encontrada" sin que
 * nada lo avisara.
 *
 * Un fallo de la base de datos NO se devuelve como `null`: se lanza. "No
 * existe" y "no se pudo consultar" son cosas distintas, y la página las cuenta
 * distinto (ver `src/app/store/error.tsx`).
 *
 * Devuelve la tienda en cualquier estado: si su vitrina se ve o no lo decide
 * `storefrontAvailability` (una tienda en prueba se ve; una suspendida muestra
 * "en pausa"). Si dos tiendas comparten dominio o subdominio, gana la de mejor
 * estado.
 *
 * Busca, en este orden: dominio exacto, subdominio de la plataforma y, como
 * último recurso, una tienda abierta cuyo nombre coincida con el subdominio.
 */
export async function getTenantByDomain(domain: string): Promise<TenantConfig | null> {
  const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'createam.cloud';
  const subdomain = domain.endsWith(`.${platformDomain}`) ? domain.split('.')[0] : null;

  const tenants = getCentralAdminDb().collection('tenants');

  let docs = (await tenants.where('domain', '==', domain).limit(5).get()).docs;

  if (docs.length === 0 && subdomain) {
    docs = (await tenants.where('subdomain', '==', subdomain).limit(5).get()).docs;
  }

  // Tiendas dadas de alta sin subdominio: se reconocen por el nombre.
  if (docs.length === 0 && subdomain) {
    const buscado = normalizar(subdomain);
    const abiertas = (await tenants.where('status', 'in', ['active', 'trial']).get()).docs;
    const porNombre = abiertas.find((doc) => {
      const nombre = normalizar(String(doc.data().name ?? ''));
      return nombre !== '' && (nombre.includes(buscado) || buscado.includes(nombre));
    });
    docs = porNombre ? [porNombre] : [];
  }

  const elegida = [...docs].sort((a, b) => rangoEstado(a.data().status) - rangoEstado(b.data().status))[0];

  if (!elegida) {
    console.log(`[getTenantByDomain] No se encontró tenant para dominio: ${domain}`);
    return null;
  }

  return { id: elegida.id, ...(plano(elegida.data()) as object) } as TenantConfig;
}

const ORDEN_ESTADOS = ['active', 'trial', 'suspended', 'pending', 'rejected'];

function rangoEstado(status: unknown): number {
  const i = ORDEN_ESTADOS.indexOf(String(status));
  return i === -1 ? ORDEN_ESTADOS.length : i;
}

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Deja el documento como datos planos: la tienda viaja como prop a componentes
 * de cliente, y un `Timestamp` de Firestore no se puede pasar tal cual.
 */
function plano(valor: unknown): unknown {
  if (valor === null || typeof valor !== 'object' || valor instanceof Date) {
    return valor;
  }
  if (typeof (valor as { toDate?: unknown }).toDate === 'function') {
    return (valor as { toDate: () => Date }).toDate();
  }
  if (Array.isArray(valor)) {
    return valor.map(plano);
  }
  return Object.fromEntries(Object.entries(valor).map(([clave, v]) => [clave, plano(v)]));
}
