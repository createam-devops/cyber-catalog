// Base de datos propia del catálogo. Guarda lo que es solo de cada tienda
// nacida de un negocio del ERP: diseño, banners, textos, SEO, redes, su
// dirección (subdominio o dominio) y sus visitas. Productos, fotos, stock,
// usuarios, plan, nombre comercial, logo y WhatsApp son del ERP. Las tiendas
// viejas siguen en Firestore hasta que migren.
//
// Es SQLite en un archivo (DATA_DIR/catalog.db, en un volumen de Docker): la
// lee el mismo proceso de Next, sin otro servidor que cuidar, en microsegundos.
// Cada tienda es una fila con su configuración en una columna JSON; lo que se
// busca en cada visita (dirección, negocio) va en columnas con índice único,
// así dos tiendas nunca quedan con la misma dirección.

import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomInt } from 'node:crypto';
import type { PlanId } from '@/lib/plans';
import type { TenantConfig, TenantStatus } from '@/lib/types';

/** Carpeta de los datos: la base, sus copias y las imágenes de las tiendas. */
export function dataDir(): string {
  return path.resolve(process.env.DATA_DIR?.trim() || path.join(process.cwd(), 'data'));
}

const now = () => new Date().toISOString();

// Cada cambio de esquema es una entrada nueva al final; nunca se edita una ya publicada.
const MIGRATIONS = [
  `
  CREATE TABLE stores (
    id              TEXT PRIMARY KEY,
    partner_id      INTEGER NOT NULL,
    erp_api         TEXT NOT NULL,
    subdomain       TEXT UNIQUE,
    domain          TEXT UNIQUE,
    status          TEXT NOT NULL DEFAULT 'active',
    plan            TEXT NOT NULL DEFAULT 'starter',
    email           TEXT NOT NULL DEFAULT '',
    settings        TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(settings)),
    views           INTEGER NOT NULL DEFAULT 0,
    whatsapp_clicks INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT NOT NULL,
    updated_at      TEXT NOT NULL,
    UNIQUE (partner_id, erp_api)
  );
  CREATE TABLE audit_log (
    id         INTEGER PRIMARY KEY,
    store_id   TEXT NOT NULL,
    action     TEXT NOT NULL,
    actor      TEXT NOT NULL,
    metadata   TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL
  );
  CREATE INDEX audit_log_store ON audit_log (store_id, created_at);
  `,
  `
  CREATE TABLE signup_codes (
    email      TEXT PRIMARY KEY,
    code_hash  TEXT NOT NULL,
    attempts   INTEGER NOT NULL DEFAULT 0,
    expires_at TEXT NOT NULL,
    data       TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(data)),
    created_at TEXT NOT NULL
  );
  `,
  // Opiniones de clientes por producto: entran pendientes y la tienda las aprueba.
  `
  CREATE TABLE reviews (
    id          INTEGER PRIMARY KEY,
    store_id    TEXT NOT NULL,
    product_id  TEXT NOT NULL,
    rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    name        TEXT NOT NULL,
    text        TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at  TEXT NOT NULL,
    reviewed_at TEXT
  );
  CREATE INDEX reviews_store_status ON reviews (store_id, status, created_at);
  CREATE INDEX reviews_store_product ON reviews (store_id, product_id, status);
  `,
];

type Db = Database.Database;
const globalForDb = globalThis as unknown as { __catalogStoreDb?: Db };

/** La base, abierta una sola vez por proceso (también con la recarga en caliente de desarrollo). */
export function getStoreDb(): Db {
  if (globalForDb.__catalogStoreDb) return globalForDb.__catalogStoreDb;
  const dir = dataDir();
  fs.mkdirSync(dir, { recursive: true });
  const db = new Database(path.join(dir, 'catalog.db'));
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('busy_timeout = 5000');
  migrate(db);
  globalForDb.__catalogStoreDb = db;
  scheduleBackups(db, dir);
  return db;
}

function migrate(db: Db) {
  const version = Number(db.pragma('user_version', { simple: true }));
  for (let i = version; i < MIGRATIONS.length; i++) {
    db.transaction(() => {
      db.exec(MIGRATIONS[i]);
      db.pragma(`user_version = ${i + 1}`);
    })();
  }
}

// --- Copias: una por día en DATA_DIR/backups, se guardan las últimas 14. Protegen
// de un borrado o un error; contra la pérdida del disco hace falta copiarlas fuera.
const BACKUPS_KEPT = 14;
const BACKUP_FILE = /^catalog-\d{4}-\d{2}-\d{2}\.db$/;

function scheduleBackups(db: Db, dir: string) {
  if (process.env.NODE_ENV !== 'production') return;
  const run = () => backupToday(db, dir).catch((error) => console.error('[store-db] No se pudo copiar la base:', error));
  void run();
  setInterval(run, 6 * 60 * 60 * 1000).unref();
}

async function backupToday(db: Db, dir: string) {
  const folder = path.join(dir, 'backups');
  fs.mkdirSync(folder, { recursive: true });
  const file = path.join(folder, `catalog-${now().slice(0, 10)}.db`);
  if (fs.existsSync(file)) return;
  await db.backup(file);
  const old = fs.readdirSync(folder).filter((name) => BACKUP_FILE.test(name)).sort().reverse().slice(BACKUPS_KEPT);
  for (const name of old) fs.rmSync(path.join(folder, name), { force: true });
}

// --- Tiendas

/** Lo que cada tienda personaliza. `name`, `logo` y `whatsapp` son de respaldo: valen los del ERP. */
export type StoreSettings = Partial<
  Pick<TenantConfig, 'name' | 'logo' | 'whatsapp' | 'primaryColor' | 'colors' | 'heroSlides' | 'socialMedia' | 'seoTitle' | 'seoDescription' | 'storefront'>
>;

interface StoreRow {
  id: string;
  partner_id: number;
  erp_api: string;
  subdomain: string | null;
  domain: string | null;
  status: string;
  plan: string;
  email: string;
  settings: string;
  views: number;
  whatsapp_clicks: number;
  created_at: string;
  updated_at: string;
}

function toTenant(row: StoreRow): TenantConfig {
  const settings = JSON.parse(row.settings) as StoreSettings;
  return {
    ...settings,
    id: row.id,
    name: settings.name ?? '',
    email: row.email,
    subdomain: row.subdomain ?? undefined,
    domain: row.domain ?? undefined,
    status: row.status as TenantStatus,
    plan: row.plan as PlanId,
    erp: { partnerId: row.partner_id, api: row.erp_api },
    analyticsViews: row.views,
    analyticsWhatsapp: row.whatsapp_clicks,
    // No tiene Firebase: sus productos salen del ERP.
    firebaseConfig: {} as TenantConfig['firebaseConfig'],
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function findLocalStore(id: string): TenantConfig | null {
  const row = getStoreDb().prepare('SELECT * FROM stores WHERE id = ?').get(id) as StoreRow | undefined;
  return row ? toTenant(row) : null;
}

export function isLocalStore(id: string): boolean {
  return Boolean(getStoreDb().prepare('SELECT 1 FROM stores WHERE id = ?').get(id));
}

export function findLocalStoreByAddress(field: 'domain' | 'subdomain', value: string): TenantConfig | null {
  const sql = field === 'domain' ? 'SELECT * FROM stores WHERE domain = ?' : 'SELECT * FROM stores WHERE subdomain = ?';
  const row = getStoreDb().prepare(sql).get(value.toLowerCase()) as StoreRow | undefined;
  return row ? toTenant(row) : null;
}

/** La tienda del negocio en ese ERP (una como mucho). */
export function localStoreIdsForPartner(partnerId: number, erpApi: string): string[] {
  const rows = getStoreDb().prepare('SELECT id FROM stores WHERE partner_id = ? AND erp_api = ?').all(partnerId, erpApi) as Array<{ id: string }>;
  return rows.map((row) => row.id);
}

export function localAddressTaken(field: 'domain' | 'subdomain', value: string, exceptId: string | null): boolean {
  const sql = field === 'domain' ? 'SELECT id FROM stores WHERE domain = ?' : 'SELECT id FROM stores WHERE subdomain = ?';
  const row = getStoreDb().prepare(sql).get(value.toLowerCase()) as { id: string } | undefined;
  return Boolean(row && row.id !== exceptId);
}

export function listLocalStores(status?: string): TenantConfig[] {
  const rows = (
    status
      ? getStoreDb().prepare('SELECT * FROM stores WHERE status = ? ORDER BY created_at DESC').all(status)
      : getStoreDb().prepare('SELECT * FROM stores ORDER BY created_at DESC').all()
  ) as StoreRow[];
  return rows.map(toTenant);
}

/** Ids como los de Firestore (20 letras y números): los dos tipos de tienda conviven. */
const ID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
function newStoreId(): string {
  let id = '';
  for (let i = 0; i < 20; i++) id += ID_CHARS[randomInt(ID_CHARS.length)];
  return id;
}

/** Ya existe una tienda con ese negocio, subdominio o dominio. */
export function isUniqueViolation(error: unknown): boolean {
  return (error as { code?: string } | null)?.code === 'SQLITE_CONSTRAINT_UNIQUE';
}

export function createLocalStore(input: {
  partnerId: number;
  erpApi: string;
  email: string;
  subdomain: string;
  plan?: PlanId;
  status?: TenantStatus;
  settings: StoreSettings;
}): TenantConfig {
  const id = newStoreId();
  const at = now();
  getStoreDb()
    .prepare(
      `INSERT INTO stores (id, partner_id, erp_api, subdomain, status, plan, email, settings, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(id, input.partnerId, input.erpApi, input.subdomain.toLowerCase(), input.status ?? 'active', input.plan ?? 'starter', input.email, JSON.stringify(input.settings), at, at);
  return findLocalStore(id)!;
}

/**
 * Cambia una tienda. Cada campo de `settings` reemplaza el anterior completo
 * (como `update` de Firestore), y `null` lo borra.
 */
export function updateLocalStore(
  id: string,
  changes: { subdomain?: string | null; domain?: string | null; status?: TenantStatus; plan?: PlanId; settings?: Record<string, unknown> }
): boolean {
  const db = getStoreDb();
  return db.transaction(() => {
    const row = db.prepare('SELECT settings, subdomain, domain, status, plan FROM stores WHERE id = ?').get(id) as
      | Pick<StoreRow, 'settings' | 'subdomain' | 'domain' | 'status' | 'plan'>
      | undefined;
    if (!row) return false;
    const settings = JSON.parse(row.settings) as Record<string, unknown>;
    for (const [key, value] of Object.entries(changes.settings ?? {})) {
      if (value === null || value === undefined) delete settings[key];
      else settings[key] = value;
    }
    const pick = <T>(value: T | undefined, current: T) => (value === undefined ? current : value);
    db.prepare('UPDATE stores SET settings = ?, subdomain = ?, domain = ?, status = ?, plan = ?, updated_at = ? WHERE id = ?').run(
      JSON.stringify(settings),
      pick(changes.subdomain?.toLowerCase() ?? changes.subdomain, row.subdomain),
      pick(changes.domain?.toLowerCase() ?? changes.domain, row.domain),
      pick(changes.status, row.status),
      pick(changes.plan, row.plan),
      now(),
      id
    );
    return true;
  })();
}

/** Suma una visita o un clic a WhatsApp. `false` si la tienda no es de esta base. */
export function incrementLocalStoreStat(id: string, stat: 'views' | 'whatsapp_clicks'): boolean {
  const sql = stat === 'views' ? 'UPDATE stores SET views = views + 1 WHERE id = ?' : 'UPDATE stores SET whatsapp_clicks = whatsapp_clicks + 1 WHERE id = ?';
  return getStoreDb().prepare(sql).run(id).changes > 0;
}

export function logLocalAudit(event: { storeId: string; action: string; actor: unknown; metadata?: unknown }): void {
  getStoreDb()
    .prepare('INSERT INTO audit_log (store_id, action, actor, metadata, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(event.storeId, event.action, JSON.stringify(event.actor ?? {}), JSON.stringify(event.metadata ?? {}), now());
}

// --- Registro con alta en el ERP: el código que se manda por correo para
// verificarlo. Se guarda su hash, nunca el código ni la contraseña.

const SIGNUP_CODE_TTL_MS = 15 * 60 * 1000;
const SIGNUP_MAX_ATTEMPTS = 5;
const codeHash = (email: string, code: string) => createHash('sha256').update(`${email}:${code}`).digest('hex');

export function saveSignupCode(email: string, code: string, data: Record<string, unknown>): void {
  const at = now();
  getStoreDb()
    .prepare(
      `INSERT INTO signup_codes (email, code_hash, attempts, expires_at, data, created_at) VALUES (?, ?, 0, ?, ?, ?)
       ON CONFLICT (email) DO UPDATE SET code_hash = excluded.code_hash, attempts = 0, expires_at = excluded.expires_at, data = excluded.data, created_at = excluded.created_at`
    )
    .run(email, codeHash(email, code), new Date(Date.now() + SIGNUP_CODE_TTL_MS).toISOString(), JSON.stringify(data), at);
}

export type SignupCodeCheck =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; reason: 'missing' | 'expired' | 'attempts' }
  | { ok: false; reason: 'wrong'; remaining: number };

/** Revisa el código del correo. Cada código equivocado cuenta un intento; el correcto no se borra hasta terminar el alta. */
export function checkSignupCode(email: string, code: string): SignupCodeCheck {
  const db = getStoreDb();
  const row = db.prepare('SELECT code_hash, attempts, expires_at, data FROM signup_codes WHERE email = ?').get(email) as
    | { code_hash: string; attempts: number; expires_at: string; data: string }
    | undefined;
  if (!row) return { ok: false, reason: 'missing' };
  if (new Date(row.expires_at) < new Date()) {
    deleteSignupCode(email);
    return { ok: false, reason: 'expired' };
  }
  if (row.attempts >= SIGNUP_MAX_ATTEMPTS) return { ok: false, reason: 'attempts' };
  if (row.code_hash !== codeHash(email, code)) {
    db.prepare('UPDATE signup_codes SET attempts = attempts + 1 WHERE email = ?').run(email);
    return { ok: false, reason: 'wrong', remaining: SIGNUP_MAX_ATTEMPTS - row.attempts - 1 };
  }
  return { ok: true, data: JSON.parse(row.data) as Record<string, unknown> };
}

export function deleteSignupCode(email: string): void {
  getStoreDb().prepare('DELETE FROM signup_codes WHERE email = ?').run(email);
}

// --- Opiniones de clientes (reseñas). Entran pendientes; la tienda las aprueba
// o las rechaza desde su editor. Solo las aprobadas se muestran y van a Google.

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface StoreReview {
  id: number;
  productId: string;
  rating: number;
  name: string;
  text: string;
  status: ReviewStatus;
  createdAt: string;
  reviewedAt: string | null;
}

interface ReviewRow {
  id: number;
  product_id: string;
  rating: number;
  name: string;
  text: string;
  status: ReviewStatus;
  created_at: string;
  reviewed_at: string | null;
}

const toReview = (row: ReviewRow): StoreReview => ({
  id: row.id,
  productId: row.product_id,
  rating: row.rating,
  name: row.name,
  text: row.text,
  status: row.status,
  createdAt: row.created_at,
  reviewedAt: row.reviewed_at,
});

export function addReview(input: { storeId: string; productId: string; rating: number; name: string; text: string }): number {
  const result = getStoreDb()
    .prepare('INSERT INTO reviews (store_id, product_id, rating, name, text, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(input.storeId, input.productId, input.rating, input.name, input.text, 'pending', now());
  return Number(result.lastInsertRowid);
}

/** Las de una tienda (las más nuevas primero), de un estado o de todos. */
export function listReviews(storeId: string, status?: ReviewStatus, limit = 200): StoreReview[] {
  const rows = (
    status
      ? getStoreDb().prepare('SELECT * FROM reviews WHERE store_id = ? AND status = ? ORDER BY created_at DESC LIMIT ?').all(storeId, status, limit)
      : getStoreDb().prepare('SELECT * FROM reviews WHERE store_id = ? ORDER BY created_at DESC LIMIT ?').all(storeId, limit)
  ) as ReviewRow[];
  return rows.map(toReview);
}

/** Las aprobadas de un producto, las más nuevas primero. */
export function approvedReviews(storeId: string, productId: string, limit = 20): StoreReview[] {
  const rows = getStoreDb()
    .prepare("SELECT * FROM reviews WHERE store_id = ? AND product_id = ? AND status = 'approved' ORDER BY created_at DESC LIMIT ?")
    .all(storeId, productId, limit) as ReviewRow[];
  return rows.map(toReview);
}

/** Promedio y cantidad de opiniones aprobadas por producto. */
export function reviewSummaries(storeId: string): Map<string, { average: number; count: number }> {
  const rows = getStoreDb()
    .prepare("SELECT product_id, AVG(rating) AS average, COUNT(*) AS count FROM reviews WHERE store_id = ? AND status = 'approved' GROUP BY product_id")
    .all(storeId) as Array<{ product_id: string; average: number; count: number }>;
  return new Map(rows.map((row) => [row.product_id, { average: Math.round(row.average * 10) / 10, count: row.count }]));
}

/** Aprueba o rechaza una opinión de la tienda. false si no es suya o no existe. */
export function setReviewStatus(storeId: string, reviewId: number, status: Exclude<ReviewStatus, 'pending'>): boolean {
  return (
    getStoreDb().prepare('UPDATE reviews SET status = ?, reviewed_at = ? WHERE id = ? AND store_id = ?').run(status, now(), reviewId, storeId).changes > 0
  );
}
