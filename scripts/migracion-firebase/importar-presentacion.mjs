#!/usr/bin/env node
/*
 * Pasa la presentación de una tienda de Firebase a la base del catálogo (C-4 de
 * cyberERP/PETICION_ERP_AL_CATALOGO_MIGRACION.md): logo, colores, redes, SEO,
 * íconos y orden de categorías, dirección y visitas. Los productos ya los
 * subió migrar-tienda.mjs al ERP; de su reporte salen el negocio y la tabla de
 * categorías de Firebase → ERP.
 *
 *   node scripts/migracion-firebase/importar-presentacion.mjs --ficha ficha.json --migracion reporte.json \
 *     [--data DATA_DIR] [--logo archivo.webp] [--sin-direccion] [--dry-run]
 *   node scripts/migracion-firebase/importar-presentacion.mjs --deshacer <id de la tienda> [--data DATA_DIR]
 *
 * - La tienda conserva su id de Firebase: la plataforma busca primero en esta
 *   base, así que al importarla su dirección deja de leer Firebase y pasa a leer el ERP.
 * - --sin-direccion: la importa sin subdominio ni dominio (para revisarla antes del cambio).
 * - --logo: el logo vigente (PNG, JPG o WebP) en vez del de la ficha. Si no hay
 *   ninguno que sirva, la tienda queda sin logo propio y usa el del negocio en el ERP.
 * - Repetirlo actualiza la misma fila. --deshacer borra la fila y sus imágenes:
 *   la dirección vuelve a la tienda de Firebase.
 * - La base tiene que existir (la crea la plataforma al arrancar con ese DATA_DIR).
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';

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
  console.log(`Tienda ${id} borrada de ${DB_FILE} con sus imágenes. Su dirección vuelve a la tienda de Firebase.`);
  process.exit(0);
}

// ---------- importar ----------
if (!args.ficha) fail('Falta --ficha (la tienda exportada del Firestore central).');
if (!args.migracion) fail('Falta --migracion (el reporte de migrar-tienda.mjs).');
const DRY = Boolean(args['dry-run']);
const ficha = JSON.parse(fs.readFileSync(args.ficha, 'utf8'));
const migration = JSON.parse(fs.readFileSync(args.migracion, 'utf8'));
const partnerId = migration.negocio?.partnerId;
if (!partnerId) fail('El reporte no trae el negocio del ERP (¿el migrador terminó el alta?).');
if (!migration.erp) fail('El reporte no dice a qué ERP se migró.');
const erpApi = new URL(migration.erp).host;
if (!ID.test(ficha.id)) fail('La ficha no trae un id de tienda válido.');

const categories = (migration.categorias || []).filter((c) => c.erpId);
const icons = Object.fromEntries(categories.filter((c) => /^[A-Za-z][A-Za-z0-9]{0,40}$/.test(c.icono || '')).map((c) => [String(c.erpId), c.icono]));
const storefront = {
  ...(ficha.storefront || {}),
  ...(Object.keys(icons).length ? { categoryIcons: icons } : {}),
  // El orden de Firebase (por fecha de creación) se queda: el ERP no ordena categorías.
  ...(categories.length ? { categoryOrder: categories.map((c) => String(c.erpId)) } : {}),
};
const social = ficha.socialMedia && Object.values(ficha.socialMedia).some(Boolean) ? ficha.socialMedia : undefined;
const settings = Object.fromEntries(
  Object.entries({
    // Respaldo: la vitrina usa el nombre y el WhatsApp del negocio en el ERP.
    name: ficha.name || ficha.businessName,
    // 51999999999 y parecidos son el marcador del alta vieja, no un número real.
    whatsapp: /^(51)?9{9}$/.test(String(ficha.whatsapp || '').replace(/\D/g, '')) ? undefined : ficha.whatsapp,
    primaryColor: ficha.primaryColor || ficha.colors?.primary,
    colors: ficha.colors,
    socialMedia: social,
    heroSlides: Array.isArray(ficha.heroSlides) && ficha.heroSlides.length ? ficha.heroSlides : undefined,
    seoTitle: ficha.seoTitle,
    seoDescription: ficha.seoDescription,
    storefront: Object.keys(storefront).length ? storefront : undefined,
  }).filter(([, v]) => v !== undefined && v !== null && v !== '')
);
const subdomain = args['sin-direccion'] ? null : ficha.subdomain?.toLowerCase() || null;
const domain = args['sin-direccion'] ? null : ficha.domain?.toLowerCase() || null;
const views = Number(ficha.analyticsViews) || 0;
const clicks = Number(ficha.analyticsWhatsapp) || 0;

// Las imágenes de Firebase que se quedan (banners) siguen funcionando mientras Firebase viva: avisar.
const firebaseImages = (ficha.heroSlides || []).filter((s) => /firebasestorage|googleapis/.test(s?.imageUrl || s?.image || '')).length;

const LOGO_TYPES = { png: 'png', webp: 'webp', jpg: 'jpg', jpeg: 'jpg' };
async function readLogo(file, url) {
  if (file) {
    const ext = LOGO_TYPES[path.extname(file).slice(1).toLowerCase()];
    if (!ext) return { ok: false, reason: `${file} no es PNG, JPG ni WebP` };
    if (!fs.existsSync(file)) return { ok: false, reason: `no existe ${file}` };
    return { ok: true, ext, data: fs.readFileSync(file) };
  }
  const res = await fetch(url).catch((error) => ({ ok: false, status: error.message }));
  if (!res.ok) return { ok: false, reason: `el de Firebase responde ${res.status}` };
  const type = res.headers.get('content-type') || '';
  const ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : type.includes('jpeg') || type.includes('jpg') ? 'jpg' : null;
  if (!ext) return { ok: false, reason: `el de Firebase no es PNG, JPG ni WebP (${type || 'sin tipo'})` };
  return { ok: true, ext, data: Buffer.from(await res.arrayBuffer()) };
}

(async () => {
  // La dirección no puede ser de otra tienda de esta base.
  for (const [field, value] of [['subdomain', subdomain], ['domain', domain]]) {
    if (!value) continue;
    const other = db.prepare(`SELECT id FROM stores WHERE ${field} = ? AND id <> ?`).get(value, ficha.id);
    if (other) fail(`El ${field} ${value} ya es de la tienda ${other.id} en esta base.`);
  }
  const otherForPartner = db.prepare('SELECT id FROM stores WHERE partner_id = ? AND erp_api = ? AND id <> ?').get(partnerId, erpApi, ficha.id);
  if (otherForPartner) fail(`El negocio ${partnerId} de ${erpApi} ya tiene la tienda ${otherForPartner.id} en esta base.`);

  const existing = db.prepare('SELECT id, settings FROM stores WHERE id = ?').get(ficha.id);
  console.log(
    `${DRY ? 'ENSAYO · ' : ''}Tienda ${ficha.id} «${settings.name}» → negocio ${partnerId} de ${erpApi} · ${subdomain ?? '(sin subdominio)'} / ${domain ?? '(sin dominio)'} · ${existing ? 'actualiza la fila' : 'fila nueva'}`
  );
  console.log(`  ajustes: ${Object.keys(settings).join(', ')}; íconos ${Object.keys(icons).length}, orden de ${categories.length} categorías; visitas ${views}.`);

  // Logo: va al disco del catálogo (Firebase se apaga). El de --logo manda; si no,
  // el que ya se copió antes; si no, el de la ficha.
  let logo = existing ? JSON.parse(existing.settings).logo : undefined;
  const logoFile = typeof args.logo === 'string' ? args.logo : null;
  if (logoFile || (ficha.logo && !(typeof logo === 'string' && logo.startsWith('/media/')))) {
    const image = await readLogo(logoFile, ficha.logo);
    if (!image.ok) console.log(`  aviso: sin logo propio (${image.reason}); la vitrina usa el del negocio en el ERP.`);
    else if (DRY) console.log(`  logo: se copiaría ${logoFile ?? 'el de Firebase'} al disco del catálogo.`);
    else {
      const folder = path.join(DATA_DIR, 'media', 'stores', ficha.id, 'logo');
      fs.mkdirSync(folder, { recursive: true });
      const name = `${Date.now()}-${randomUUID().slice(0, 8)}.${image.ext}`;
      fs.writeFileSync(path.join(folder, name), image.data);
      logo = `/media/stores/${ficha.id}/logo/${name}`;
      console.log(`  logo: copiado a ${logo}.`);
    }
  }
  if (logo) settings.logo = logo;
  if (firebaseImages) console.log(`  aviso: ${firebaseImages} banners siguen en Firebase; hay que volver a subirlos antes de apagarlo.`);
  if (DRY) {
    console.log('Ensayo listo: nada se escribió.');
    return;
  }

  const at = now();
  db.transaction(() => {
    if (existing) {
      db.prepare('UPDATE stores SET partner_id = ?, erp_api = ?, subdomain = ?, domain = ?, settings = ?, updated_at = ? WHERE id = ?').run(
        partnerId,
        erpApi,
        subdomain,
        domain,
        JSON.stringify(settings),
        at,
        ficha.id
      );
    } else {
      db.prepare(
        `INSERT INTO stores (id, partner_id, erp_api, subdomain, domain, status, plan, email, settings, views, whatsapp_clicks, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'active', 'starter', ?, ?, ?, ?, ?, ?)`
      ).run(ficha.id, partnerId, erpApi, subdomain, domain, String(ficha.email || '').toLowerCase(), JSON.stringify(settings), views, clicks, ficha.createdAt || at, at);
    }
    audit(ficha.id, existing ? 'store.reimported_from_firebase' : 'store.imported_from_firebase', { partnerId, erpApi, subdomain, domain, firebaseProject: migration.tienda?.proyecto });
  })();
  console.log(`Listo en ${DB_FILE}. Para deshacer: --deshacer ${ficha.id}`);
})().catch((error) => fail(error.message));
