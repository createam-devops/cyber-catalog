// Datos de la vitrina pública. Toda lectura de la vitrina pasa por aquí: las
// páginas de /store y la API /api/storefront/*. El navegador nunca lee la base
// de una tienda directamente.
//
// La fuente de datos es intercambiable (`StorefrontDataSource`): hoy Firebase
// (el proyecto de cada tienda), después el ERP (ver
// PETICION_ADECUACIONES_ERP_CATALOGO.md). Cambiar de fuente no toca la vitrina.

import { cache } from 'react';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import type { TenantConfig } from '@/lib/types';
import type { StoreCatalog, StoreProduct } from '@/lib/storefront/catalog';
import { labelFromCategoryValue, type StoreCategory } from '@/lib/storefront/public-store';
import { getTenantDbFromConfig } from './tenant-firestore';
import { getTenantByDomain } from './tenants';
import { getErpConfig, linkedToCurrentErp } from './erp/config';
import { loadErpCatalog } from './erp/catalog-source';
import { withPartnerProfile } from './erp/partner-profile';

export interface StorefrontDataSource {
  /** Todo el catálogo de la tienda. Lanza si la fuente no responde. */
  loadCatalog(store: TenantConfig): Promise<StoreCatalog>;
}

const MAX_PRODUCTS = 500;

interface RawCategory {
  value: string;
  label?: string;
  icon?: string;
  order?: number;
}

function toStoreProduct(id: string, data: Record<string, unknown>): StoreProduct {
  const imageUrls = Array.isArray(data.imageUrls)
    ? data.imageUrls.filter((url): url is string => typeof url === 'string' && url.length > 0)
    : [];
  const stock = typeof data.stock === 'number' && Number.isFinite(data.stock) ? data.stock : null;
  return {
    id,
    name: String(data.name ?? ''),
    description: typeof data.description === 'string' && data.description.trim() ? data.description : undefined,
    price: Number(data.price) || 0,
    category: String(data.category ?? ''),
    imageUrls,
    featured: data.featured === true,
    stock,
  };
}

/**
 * Categorías de la vitrina: las que tienen productos, con el nombre e ícono que
 * la tienda les puso en su panel. Si un producto usa una categoría que no está
 * en la lista, se muestra igual con un nombre legible.
 */
export function buildStoreCategories(products: StoreProduct[], defined: RawCategory[]): StoreCategory[] {
  const used = new Set(products.map((p) => p.category).filter(Boolean));
  const byValue = new Map(defined.map((c) => [c.value, c]));

  const ordered = [...defined]
    .filter((c) => used.has(c.value))
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || (a.label ?? '').localeCompare(b.label ?? '', 'es'))
    .map((c) => ({ id: c.value, label: c.label?.trim() || labelFromCategoryValue(c.value), icon: c.icon }));

  const orphans = Array.from(used)
    .filter((value) => !byValue.has(value))
    .map((value) => ({ id: value, label: labelFromCategoryValue(value) }));

  return [...ordered, ...orphans];
}

const firebaseDataSource: StorefrontDataSource = {
  async loadCatalog(store) {
    // Las tiendas nuevas todavía no tienen base de productos: su vitrina abre vacía.
    if (!store.firebaseConfig?.projectId) {
      return { products: [], categories: [] };
    }
    const db = getTenantDbFromConfig(store.id, store.firebaseConfig);
    const [productsSnap, categoriesSnap] = await Promise.all([
      getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(MAX_PRODUCTS))),
      getDocs(collection(db, 'categories')),
    ]);

    const products = productsSnap.docs
      .map((doc) => toStoreProduct(doc.id, doc.data()))
      .filter((p) => p.name);
    const categories = categoriesSnap.docs
      .map((doc) => doc.data() as Partial<RawCategory>)
      .filter((c): c is RawCategory => typeof c.value === 'string' && c.value.length > 0);

    return { products, categories: buildStoreCategories(products, categories) };
  },
};

const erpDataSource: StorefrontDataSource = { loadCatalog: loadErpCatalog };
// Tienda enlazada a otro ERP (una de prueba de api-dev, con la integración ya en producción).
const emptyDataSource: StorefrontDataSource = { loadCatalog: async () => ({ products: [], categories: [] }) };

/**
 * Las tiendas con negocio en el ERP leen del ERP; las demás, de su Firebase.
 * Si la integración no está configurada (sin URL o sin secreto), todas siguen
 * en Firebase: el paso a producción es solo configurar las variables ERP_*.
 */
function dataSourceFor(store: TenantConfig): StorefrontDataSource {
  if (!store.erp?.partnerId || !getErpConfig()) return firebaseDataSource;
  return linkedToCurrentErp(store.erp) ? erpDataSource : emptyDataSource;
}

// ---------------------------------------------------------------------------
// Caché en memoria por tienda. Una vitrina se visita mucho y cambia poco: la
// base se consulta como mucho una vez por minuto y por tienda. Si la base falla
// y había una copia, se sigue mostrando la copia. Guardar desde el panel borra
// la copia (invalidateStoreCatalog) para que el cambio se vea al instante.
// ---------------------------------------------------------------------------

const TTL_MS = 60_000;
/** Si la fuente falla y no hay copia, el error se recuerda este tiempo para no insistir en cada visita. */
const ERROR_TTL_MS = 15_000;

interface CacheEntry {
  at: number;
  data?: StoreCatalog;
  pending?: Promise<StoreCatalog>;
  error?: unknown;
}

const catalogs = new Map<string, CacheEntry>();

export async function getStoreCatalog(store: TenantConfig): Promise<StoreCatalog> {
  const entry = catalogs.get(store.id);
  if (entry?.data && Date.now() - entry.at < TTL_MS) {
    return entry.data;
  }
  if (entry?.error !== undefined && Date.now() - entry.at < ERROR_TTL_MS) {
    throw entry.error;
  }
  if (entry?.pending) {
    return entry.data ?? entry.pending;
  }

  const pending = dataSourceFor(store)
    .loadCatalog(store)
    .then((data) => {
      catalogs.set(store.id, { at: Date.now(), data });
      return data;
    })
    .catch((error) => {
      const current = catalogs.get(store.id);
      if (current?.data) {
        console.error(`[storefront] La base de la tienda ${store.id} no respondió; se muestra la última copia.`, error);
        // La copia sigue valiendo y se vuelve a intentar en ERROR_TTL_MS, no en cada visita.
        catalogs.set(store.id, { at: Date.now() - TTL_MS + ERROR_TTL_MS, data: current.data });
        return current.data;
      }
      catalogs.set(store.id, { at: Date.now(), error });
      throw error;
    });

  catalogs.set(store.id, { at: entry?.data ? entry.at : 0, data: entry?.data, pending });
  // Con una copia vencida se responde con ella mientras se renueva por detrás.
  return entry?.data ?? pending;
}

export function invalidateStoreCatalog(tenantId: string): void {
  catalogs.delete(tenantId);
}

// ---------------------------------------------------------------------------
// Tienda por dominio y si su vitrina está abierta.
// ---------------------------------------------------------------------------

/**
 * Tiendas de prueba para desarrollo local, sin Firebase: `STOREFRONT_DEV_STORES`
 * es un JSON con una lista de tiendas (como mínimo `domain` y `name`; para leer
 * del ERP, `erp: { partnerId }`). Se ignora en producción.
 *
 *   STOREFRONT_DEV_STORES=[{"domain":"demo.localhost","name":"Tienda demo","erp":{"partnerId":1},"storefront":{"rubro":"ferreteria-tecnologia"}}]
 *
 * y se abre con http://localhost:3000/store?_domain=demo.localhost
 */
export function listDevStores(): TenantConfig[] {
  const raw = process.env.STOREFRONT_DEV_STORES;
  if (process.env.NODE_ENV === 'production' || !raw) return [];
  try {
    const now = new Date();
    return (JSON.parse(raw) as Array<Partial<TenantConfig>>).map(
      (store, index) =>
        ({
          id: `dev-${index + 1}`,
          email: '',
          status: 'active',
          firebaseConfig: {} as TenantConfig['firebaseConfig'],
          createdAt: now,
          updatedAt: now,
          ...store,
          name: store.name || store.domain || `Tienda ${index + 1}`,
        }) as TenantConfig
    );
  } catch (error) {
    console.error('[storefront] STOREFRONT_DEV_STORES no es un JSON válido:', error);
    return [];
  }
}

/**
 * Una sola consulta por petición aunque la pidan la página y sus metadatos.
 * Las tiendas del ERP salen con el nombre, el logo y el WhatsApp de su negocio.
 */
export const findStoreByDomain = cache(async (domain: string) => {
  const store = listDevStores().find((dev) => dev.domain === domain) ?? (await getTenantByDomain(domain));
  return store ? (await withPartnerProfile(store)).tenant : null;
});

export type StorefrontAvailability = 'open' | 'paused' | 'missing';

/**
 * - `open`: activa, o en prueba sin vencer. La tienda se ve desde que termina
 *   el asistente de alta, sin esperar aprobación.
 * - `paused`: prueba vencida o suspendida. La tienda existe y puede volver.
 * - `missing`: no existe, pendiente o rechazada.
 */
export function storefrontAvailability(tenant: TenantConfig | null): StorefrontAvailability {
  if (!tenant) return 'missing';
  if (tenant.status === 'active') return 'open';
  if (tenant.status === 'trial') {
    const end = tenant.trialEndsAt ? new Date(tenant.trialEndsAt) : null;
    return !end || Number.isNaN(end.getTime()) || end.getTime() > Date.now() ? 'open' : 'paused';
  }
  if (tenant.status === 'suspended') return 'paused';
  return 'missing';
}
