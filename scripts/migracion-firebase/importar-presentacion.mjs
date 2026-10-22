#!/usr/bin/env node
/*
 * Pasa la presentación de una tienda a la base del catálogo (C-4 de
 * cyberERP/PETICION_ERP_AL_CATALOGO_MIGRACION.md): logo, colores, redes, SEO,
 * íconos y orden de categorías y dirección. Los productos ya los subió
 * migrar-tienda.mjs al ERP; de su reporte salen el negocio, el correo del dueño
 * y la tabla de categorías de Firebase → ERP.
 *
 *   node scripts/migracion-firebase/importar-presentacion.mjs --migracion reporte.json \
 *     (--presentacion tienda.json | --ficha ficha.json) [--logo archivo.webp] [--data DATA_DIR] \
 *     [--sin-direccion] [--dry-run]
 *   node scripts/migracion-firebase/importar-presentacion.mjs --deshacer <id de la tienda> [--data DATA_DIR]
 *
 * - --presentacion: los datos de la tienda real (p. ej. bellasorpresa-pe.json). Sin
 *   él se usan los de la ficha del Firestore central, con sus visitas.
 * - La tienda recibe un id nuevo; al repetirlo se actualiza la fila del mismo negocio.
 * - --sin-direccion: la importa sin subdominio ni dominio (para revisarla antes).
 * - --logo: el logo vigente (PNG, JPG o WebP). Sin él se baja el de la presentación
 *   o la ficha; si no sirve, la tienda usa el logo del negocio en el ERP.
 * - --deshacer borra la fila y sus imágenes.
 * - La base tiene que existir (la crea la plataforma al arrancar con ese DATA_DIR).
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { randomInt, randomUUID } from 'node:crypto';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, arg, i, all) => {
    if (!arg.startsWith('--')) return acc;
    const next = all[i + 1];
    acc.push([arg.slice(2), next && !next.startsWith('--') ? next : true]);
    return acc;
  }, [])
);
const fail = (msg) => {
  console.error(`✖ ${msg}`);
  process.exit(1);
};

const DATA_DIR = path.resolve(typeof args.data === 'string' ? args.data : process.env.DATA_DIR?.trim() || path.join(process.cwd(), 'data'));
const DB_FILE = path.join(DATA_DIR, 'catalog.db');
if (!fs.existsSync(DB_FILE)) fail(`No existe ${DB_FILE}. Arranca la plataforma una vez con DATA_DIR=${DATA_DIR} para crearla.`);

// better-sqlite3 de la plataforma (en el contenedor está en /app/node_modules).
const require = createRequire(path.join(process.cwd(), 'importar.cjs'));
const Database = require('better-sqlite3');
const db = new Database(DB_FILE);
db.pragma('busy_timeout = 5000');
if (Number(db.pragma('user_version', { simple: true })) < 1) fail('La base no tiene las tablas del catálogo: arranca la plataforma una vez.');

const ID = /^[A-Za-z0-9_-]{1,64}$/;
const now = () => new Date().toISOString();
const audit = (storeId, action, metadata) =>
  db
    .prepare('INSERT INTO audit_log (store_id, action, actor, metadata, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(storeId, action, JSON.stringify({ type: 'script', name: 'migracion-firebase' }), JSON.stringify(metadata), now());

// ---------- deshacer ----------
if (args.deshacer) {
  const id = String(args.deshacer);
  if (!ID.test(id)) fail('Id de tienda no válido.');
  const row = db.prepare('SELECT id, partner_id, subdomain, domain FROM stores WHERE id = ?').get(id);
  if (!row) fail(`No hay tienda ${id} en ${DB_FILE}.`);
  db.prepare('DELETE FROM stores WHERE id = ?').run(id);
  audit(id, 'store.import_undone', { partnerId: row.partner_id, subdomain: row.subdomain, domain: row.domain });
  fs.rmSync(path.join(DATA_DIR, 'media', 'stores', id), { recursive: true, force: true });
  console.log(`Tienda ${id} borrada de ${DB_FILE} con sus imágenes.`);
  process.exit(0);
}

// ---------- importar ----------
if (!args.migracion) fail('Falta --migracion (el reporte de migrar-tienda.mjs).');
if (!args.presentacion && !args.ficha) fail('Falta --presentacion (los datos de la tienda real) o --ficha.');
const DRY = Boolean(args['dry-run']);
const migration = JSON.parse(fs.readFileSync(args.migracion, 'utf8'));
const source = JSON.parse(fs.readFileSync(args.presentacion || args.ficha, 'utf8'));
const fromFicha = !args.presentacion;
const partnerId = migration.negocio?.partnerId;
if (!partnerId) fail('El reporte no trae el negocio del ERP (¿el migrador terminó el alta?).');
if (!migration.erp) fail('El reporte no dice a qué ERP se migró.');
const erpApi = new URL(migration.erp).host;

const categories = (migration.categorias || []).filter((c) => c.erpId);
const icons = Object.fromEntries(categories.filter((c) => /^[A-Za-z][A-Za-z0-9]{0,40}$/.test(c.icono || '')).map((c) => [String(c.erpId), c.icono]));
const storefront = {
  ...(source.storefront || {}),
  ...(Object.keys(icons).length ? { categoryIcons: icons } : {}),
  // El orden de Firebase (por fecha de creación) se queda: el ERP no ordena categorías.
  ...(categories.length ? { categoryOrder: categories.map((c) => String(c.erpId)) } : {}),
};
const social = source.socialMedia && Object.values(source.socialMedia).some(Boolean)
  ? Object.fromEntries(Object.entries(source.socialMedia).filter(([, v]) => v))
  : undefined;
const whatsappDigits = String(source.whatsapp || '').replace(/\D/g, '');
const settings = Object.fromEntries(
  Object.entries({
    // Respaldo: la vitrina usa el nombre y el WhatsApp del negocio en el ERP.
    name: source.name || source.businessName,
    // 51999999999 y parecidos son el marcador del alta vieja, no un número real.
    whatsapp: whatsappDigits && !/^(51)?9{9}$/.test(whatsappDigits) ? source.whatsapp : undefined,
    primaryColor: source.primaryColor || source.colors?.primary,
    colors: source.colors,
    socialMedia: social,
    heroSlides: Array.isArray(source.heroSlides) && source.heroSlides.length ? source.heroSlides : undefined,
    seoTitle: source.seoTitle,
    seoDescription: source.seoDescription,
    storefront: Object.keys(storefront).length ? storefront : undefined,
  }).filter(([, v]) => v !== undefined && v !== null && v !== '')
);
const subdomain = args['sin-direccion'] ? null : source.subdomain?.toLowerCase() || null;
const domain = args['sin-direccion'] ? null : source.domain?.toLowerCase() || null;
const email = String(migration.dueno?.correo || source.email || '').toLowerCase();
// Las visitas de la ficha solo valen si la presentación es la de esa misma tienda.
const views = fromFicha ? Number(source.analyticsViews) || 0 : 0;
const clicks = fromFicha ? Number(source.analyticsWhatsapp) || 0 : 0;

const ID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const newStoreId = () => Array.from({ length: 20 }, () => ID_CHARS[randomInt(ID_CHARS.length)]).join('');

const LOGO_TYPES = { png: 'png', webp: 'webp', jpg: 'jpg', jpeg: 'jpg' };
async function readLogo(file, url) {
  if (file) {
    const ext = LOGO_TYPES[path.extname(file).slice(1).toLowerCase()];
    if (!ext) return { ok: false, reason: `${file} no es PNG, JPG ni WebP` };
    if (!fs.existsSync(file)) return { ok: false, reason: `no existe ${file}` };
    return { ok: true, ext, data: fs.readFileSync(file) };
  }
  const res = await fetch(url).catch((error) => ({ ok: false, status: error.message }));
  if (!res.ok) return { ok: false, reason: `${url} responde ${res.status}` };
  const type = res.headers.get('content-type') || '';
  const ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : type.includes('jpeg') || type.includes('jpg') ? 'jpg' : null;
  if (!ext) return { ok: false, reason: `${url} no es PNG, JPG ni WebP (${type || 'sin tipo'})` };
  return { ok: true, ext, data: Buffer.from(await res.arrayBuffer()) };
}

(async () => {
  // Repetirlo actualiza la fila del mismo negocio.
  const existing = db.prepare('SELECT id, settings FROM stores WHERE partner_id = ? AND erp_api = ?').get(partnerId, erpApi);
  const id = existing?.id ?? newStoreId();
  // La dirección no puede ser de otra tienda de esta base.
  for (const [field, value] of [['subdomain', subdomain], ['domain', domain]]) {
    if (!value) continue;
    const other = db.prepare(`SELECT id FROM stores WHERE ${field} = ? AND id <> ?`).get(value, id);
    if (other) fail(`El ${field} ${value} ya es de la tienda ${other.id} en esta base.`);
  }

  console.log(
    `${DRY ? 'ENSAYO · ' : ''}Tienda «${settings.name}» → negocio ${partnerId} de ${erpApi} · ${subdomain ?? '(sin subdominio)'} / ${domain ?? '(sin dominio)'} · ${existing ? `actualiza ${id}` : 'fila nueva'}`
  );
  console.log(`  ajustes: ${Object.keys(settings).join(', ')}; íconos ${Object.keys(icons).length}, orden de ${categories.length} categorías; visitas ${views}.`);

  // Logo: va al disco del catálogo (Firebase se apaga). El de --logo manda; si no,
  // el que ya se copió antes; si no, el de la presentación o la ficha.
  let logo = existing ? JSON.parse(existing.settings).logo : undefined;
  const logoFile = typeof args.logo === 'string' ? args.logo : null;
  if (logoFile || (source.logo && !(typeof logo === 'string' && logo.startsWith('/media/')))) {
    const image = await readLogo(logoFile, source.logo);
    if (!image.ok) console.log(`  aviso: sin logo propio (${image.reason}); la vitrina usa el del negocio en el ERP.`);
    else if (DRY) console.log(`  logo: se copiaría ${logoFile ?? source.logo} al disco del catálogo.`);
    else {
      const folder = path.join(DATA_DIR, 'media', 'stores', id, 'logo');
      fs.mkdirSync(folder, { recursive: true });
      const name = `${Date.now()}-${randomUUID().slice(0, 8)}.${image.ext}`;
      fs.writeFileSync(path.join(folder, name), image.data);
      logo = `/media/stores/${id}/logo/${name}`;
      console.log(`  logo: copiado a ${logo}.`);
    }
  }
  if (logo) settings.logo = logo;
  const firebaseImages = (settings.heroSlides || []).filter((s) => /firebasestorage|googleapis/.test(s?.image || '')).length;
  if (firebaseImages) console.log(`  aviso: ${firebaseImages} banners siguen en Firebase; hay que volver a subirlos antes de apagarlo.`);
  if (DRY) {
    console.log('Ensayo listo: nada se escribió.');
    return;
  }

  const at = now();
  db.transaction(() => {
    if (existing) {
      db.prepare('UPDATE stores SET subdomain = ?, domain = ?, email = ?, settings = ?, updated_at = ? WHERE id = ?').run(
        subdomain,
        domain,
        email,
        JSON.stringify(settings),
        at,
        id
      );
    } else {
      db.prepare(
        `INSERT INTO stores (id, partner_id, erp_api, subdomain, domain, status, plan, email, settings, views, whatsapp_clicks, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'active', 'starter', ?, ?, ?, ?, ?, ?)`
      ).run(id, partnerId, erpApi, subdomain, domain, email, JSON.stringify(settings), views, clicks, at, at);
    }
    audit(id, existing ? 'store.reimported_from_firebase' : 'store.imported_from_firebase', {
      partnerId,
      erpApi,
      subdomain,
      domain,
      firebaseProject: migration.tienda?.proyecto,
      firebaseTenant: migration.tienda?.firebaseId,
    });
  })();
  console.log(`Listo: tienda ${id} en ${DB_FILE}. Para deshacer: --deshacer ${id}`);
})().catch((error) => fail(error.message));
