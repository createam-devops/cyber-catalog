#!/usr/bin/env node
/*
 * Migra una tienda de Firebase al ERP (C-3 de cyberERP/PETICION_ERP_AL_CATALOGO_MIGRACION.md).
 *
 * Solo lee Firebase (por su API pública, como la vitrina) y solo escribe por la
 * API del ERP: alta del negocio (A.1) y categorías, productos y fotos (A.5).
 * Se puede repetir sin duplicar: todo va con `external_ref`, y una foto repetida
 * no se duplica (el ERP compara su huella).
 *
 *   node scripts/migracion-firebase/migrar-tienda.mjs --ficha ficha.json --plan catalogo_digital \
 *     [--presentacion tienda.json] [--env .env.local] [--token app|dueno] [--correo-dueno x@y] \
 *     [--nombre-dueno "…"] [--nombre "…"] [--telefono +51…] [--clave-archivo f] [--prefijo fb] \
 *     [--dry-run] [--salida reporte.json]
 *
 * - ficha.json: la tienda exportada del Firestore central (exportar-ficha.cjs): de ahí salen su
 *   Firebase (firebaseConfig) y su id, que va en las external_ref.
 * - --presentacion: los datos de la tienda real (p. ej. bellasorpresa-pe.json). Si está, el nombre
 *   y el WhatsApp del negocio salen de ahí y no de la ficha.
 * - --token app: la credencial de la app (necesita catalog.products.manage y catalog.categories.manage).
 *   --token dueno: entra como el dueño recién creado (sirve para ensayar mientras la app no tiene esos permisos).
 * - La clave del dueño: la de --clave-archivo o una al azar. Va en el reporte (archivo local, no se imprime):
 *   el dueño la cambia con «¿Olvidaste tu contraseña?».
 * - El reporte trae, por tienda, qué se subió, qué falló y por qué, los choques con el plan y la tabla
 *   de ids de Firebase → ERP (Bella Sorpresa la usa para sus redirecciones).
 */
import fs from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';

// ---------- argumentos y configuración ----------
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
if (!args.ficha) fail('Falta --ficha (la tienda exportada del Firestore central).');
if (!args.plan) fail('Falta --plan (el plan_code del ERP: en dev catalogo_digital).');

const DRY = Boolean(args['dry-run']);
const TOKEN_MODE = args.token === 'dueno' ? 'dueno' : 'app';
const PREFIX = typeof args.prefijo === 'string' ? args.prefijo : 'fb';
const ficha = JSON.parse(fs.readFileSync(args.ficha, 'utf8'));
const envFile = typeof args.env === 'string' ? args.env : '.env.local';
const env = fs.existsSync(envFile)
  ? Object.fromEntries(
      fs
        .readFileSync(envFile, 'utf8')
        .split(/\r?\n/)
        .filter((l) => /^[A-Z_]+=/.test(l))
        .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()])
    )
  : {};
const cfg = (k) => process.env[k] || env[k];
const ERP = (cfg('ERP_API_BASE_URL') || '').replace(/\/+$/, '');
const CLIENT_ID = cfg('ERP_APP_CLIENT_ID') || 'catalog';
const CLIENT_SECRET = cfg('ERP_APP_CLIENT_SECRET');
if (!DRY && (!ERP || !CLIENT_SECRET)) fail(`Faltan ERP_API_BASE_URL o ERP_APP_CLIENT_SECRET (en ${envFile} o en el entorno).`);

const fb = ficha.firebaseConfig || {};
if (!fb.projectId || !fb.apiKey) fail('La ficha no trae firebaseConfig.projectId y apiKey: esta tienda no tiene Firebase propio.');
const store = args.presentacion ? JSON.parse(fs.readFileSync(args.presentacion, 'utf8')) : ficha;
const owner = (ficha._users || []).find((u) => u.role === 'owner') || {};
const ownerEmail = String(args['correo-dueno'] || owner.email || ficha.email || '').trim().toLowerCase();
if (!ownerEmail) fail('No hay correo del dueño (ni en la ficha ni en --correo-dueno).');
const businessName = String(args.nombre || store.name || store.businessName || '').trim();
// Con otro correo, el nombre del dueño de la ficha ya no es el suyo.
const ownerName = String(args['nombre-dueno'] || (args['correo-dueno'] ? '' : owner.displayName) || businessName).trim();
const ownerPassword = args['clave-archivo']
  ? fs.readFileSync(args['clave-archivo'], 'utf8').trim()
  : `Bs-${randomBytes(9).toString('base64url')}7a`;
// 51999999999 y parecidos son el marcador del alta vieja, no un número real.
const phoneDigits = String(args.telefono || store.whatsapp || store.phone || '').replace(/\D/g, '');
const phone = phoneDigits && !/^(51)?9{9}$/.test(phoneDigits) ? `+${phoneDigits.length === 9 ? `51${phoneDigits}` : phoneDigits}` : undefined;

const report = {
  tienda: { firebaseId: ficha.id, nombre: businessName, proyecto: fb.projectId },
  erp: ERP || null,
  plan: args.plan,
  modoToken: TOKEN_MODE,
  ensayo: DRY,
  dueno: { correo: ownerEmail, clave: null },
  negocio: null,
  categorias: [],
  productos: [],
  limitesDelPlan: [],
  verificacion: null,
  empezo: new Date().toISOString(),
};
const outFile = typeof args.salida === 'string' ? args.salida : `migracion-${ficha.id}.json`;
const save = () => fs.writeFileSync(outFile, JSON.stringify(report, null, 2));

// ---------- Firebase (lectura pública, como la vitrina) ----------
async function readCollection(name) {
  const docs = [];
  let token = '';
  for (let page = 0; page < 50; page++) {
    const url = `https://firestore.googleapis.com/v1/projects/${fb.projectId}/databases/(default)/documents/${name}?pageSize=300&key=${fb.apiKey}${token ? `&pageToken=${encodeURIComponent(token)}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Firebase ${name}: HTTP ${res.status}`);
    const body = await res.json();
    docs.push(...(body.documents || []));
    if (!body.nextPageToken) break;
    token = body.nextPageToken;
  }
  return docs.map((doc) => ({ id: doc.name.split('/').pop(), ...fromFirestore(doc.fields || {}) }));
}
function fromFirestore(fields) {
  const value = (v) =>
    'stringValue' in v ? v.stringValue
    : 'integerValue' in v ? Number(v.integerValue)
    : 'doubleValue' in v ? v.doubleValue
    : 'booleanValue' in v ? v.booleanValue
    : 'timestampValue' in v ? v.timestampValue
    : 'nullValue' in v ? null
    : 'arrayValue' in v ? (v.arrayValue.values || []).map(value)
    : 'mapValue' in v ? fromFirestore(v.mapValue.fields || {})
    : undefined;
  return Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, value(v)]));
}

// ---------- ERP ----------
let bearer = null;
async function erp(method, pathname, { body, form, auth = 'bearer', okStatuses = [] } = {}) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const headers = { Accept: 'application/json' };
    if (auth === 'basic') headers.Authorization = `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`;
    if (auth === 'bearer') headers.Authorization = `Bearer ${bearer}`;
    if (body) headers['Content-Type'] = 'application/json';
    const res = await fetch(`${ERP}${pathname}`, { method, headers, body: form ?? (body ? JSON.stringify(body) : undefined) });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && auth === 'bearer' && attempt === 0) {
      await refreshToken();
      continue;
    }
    if ((res.status === 429 || res.status >= 500) && attempt < 3) {
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
      continue;
    }
    return { status: res.status, data, ok: res.ok || okStatuses.includes(res.status) };
  }
  throw new Error(`${method} ${pathname}: sin respuesta tras varios intentos`);
}
async function refreshToken() {
  if (TOKEN_MODE === 'app') {
    const r = await erp('POST', '/integrations/app-token', { auth: 'basic', body: { partner_id: report.negocio.partnerId } });
    if (!r.ok) throw new Error(`app-token: HTTP ${r.status} ${r.data.code ?? ''} ${r.data.error ?? ''}`);
    bearer = r.data.access_token;
  } else {
    const r = await erp('POST', '/auth/login', { auth: 'none', body: { email: ownerEmail, password: ownerPassword, app: 'catalog' } });
    if (!r.ok) throw new Error(`login del dueño: HTTP ${r.status} ${r.data.code ?? ''} ${r.data.error ?? ''}`);
    bearer = r.data.tokens.access_token;
  }
}
const planLimit = (r, what) => {
  if (r.status === 403 && r.data.error === 'plan_limit_reached') {
    report.limitesDelPlan.push({ en: what, recurso: r.data.resource, limite: r.data.limit, usado: r.data.used });
    return true;
  }
  return false;
};

// ---------- migración ----------
(async () => {
  console.log(`Tienda «${businessName}» (${ficha.id}), Firebase ${fb.projectId} → ${DRY ? 'ENSAYO, sin escribir' : ERP}`);
  const categories = (await readCollection('categories')).sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
  // Lo más nuevo primero, como hoy en la tienda: sort_order = posición en la lista.
  const products = (await readCollection('products')).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  const photos = products.reduce((n, p) => n + (p.imageUrls || []).length, 0);
  console.log(`Firebase: ${categories.length} categorías, ${products.length} productos, ${photos} fotos.`);

  if (DRY) {
    report.categorias = categories.map((c) => ({ firebaseId: c.id, value: c.value, nombre: c.label, icono: c.icon ?? null }));
    report.productos = products.map((p, i) => ({ firebaseId: p.id, nombre: p.name, precio: p.price, categoria: p.category, slug: p.slug ?? null, orden: i, fotos: (p.imageUrls || []).length }));
    save();
    console.log(`Ensayo listo: nada se escribió. Detalle en ${outFile}.`);
    return;
  }

  // 1) Alta del negocio (A.1). Repetirla con la misma external_ref devuelve el mismo negocio.
  const alta = await erp('POST', '/integrations/partners', {
    auth: 'basic',
    body: {
      plan_code: args.plan,
      business_name: businessName,
      owner: { name: ownerName, email: ownerEmail, password: ownerPassword, ...(phone ? { phone } : {}) },
      email_verified: true,
      external_ref: `${PREFIX}:tenant:${ficha.id}`,
    },
  });
  if (alta.status === 409 && alta.data.code === 'EMAIL_ALREADY_REGISTERED') {
    report.negocio = { error: 'EMAIL_ALREADY_REGISTERED' };
    save();
    fail(`El correo del dueño ya está en el ERP: lo resuelve el equipo del ERP a mano. Reporte en ${outFile}.`);
  }
  if (!alta.ok) fail(`Alta del negocio: HTTP ${alta.status} ${alta.data.code ?? ''} ${alta.data.error ?? ''}`);
  report.negocio = { partnerId: alta.data.partner_id, creado: alta.status === 201, suscripcion: alta.data.subscription ?? null };
  // La clave solo sirve si el dueño se creó ahora; en un alta repetida queda la de antes.
  report.dueno.clave = alta.status === 201 ? ownerPassword : '(la del alta anterior)';
  save();
  console.log(`Negocio ${report.negocio.partnerId} (${report.negocio.creado ? 'creado' : 'ya existía'}).`);

  // 2) Token: el de la app, o el del dueño para ensayar.
  await refreshToken();

  // 3) Categorías, en su orden. La tabla value → id une cada producto con su categoría.
  const categoryIdByValue = {};
  for (const c of categories) {
    const r = await erp('POST', '/integrations/catalog/categories', { body: { name: c.label, external_ref: `${PREFIX}:${fb.projectId}:cat:${c.id}`.slice(0, 100) } });
    const entry = { firebaseId: c.id, value: c.value, nombre: c.label, icono: c.icon ?? null, creadaEn: c.createdAt ?? null };
    if (r.ok) {
      entry.erpId = r.data.category?.id;
      entry.creada = r.status === 201;
      categoryIdByValue[c.value] = entry.erpId;
    } else {
      entry.error = planLimit(r, `categoría ${c.label}`) ? 'plan_limit_reached' : `HTTP ${r.status} ${r.data.code ?? ''} ${r.data.error ?? ''}`.trim();
    }
    report.categorias.push(entry);
  }
  save();
  console.log(`Categorías: ${report.categorias.filter((c) => c.erpId).length}/${categories.length}.`);

  // 4) Productos, uno por uno, con sus fotos en orden (la primera queda como principal).
  for (const [index, p] of products.entries()) {
    const entry = { firebaseId: p.id, nombre: p.name, slug: p.slug ?? null, precio: p.price, fotos: { total: (p.imageUrls || []).length, subidas: 0, fallidas: [] } };
    const body = {
      name: p.name,
      description: p.description ?? '',
      sale_price: Number(p.price),
      published: true,
      sort_order: index,
      external_ref: `${PREFIX}:${fb.projectId}:prod:${p.id}`.slice(0, 100),
      ...(categoryIdByValue[p.category] ? { category_id: categoryIdByValue[p.category] } : {}),
      ...(p.featured ? { featured: true } : {}),
      ...(typeof p.stock === 'number' ? { stock: p.stock } : {}),
      ...(p.slug ? { slug: p.slug } : {}),
    };
    if (p.category && !categoryIdByValue[p.category]) entry.aviso = `categoría «${p.category}» sin equivalente en el ERP: queda sin categoría`;
    let r = await erp('POST', '/integrations/catalog/products', { body });
    // Slug ocupado: el ERP deja el producto creado sin publicar; repetir el alta
    // con la misma external_ref y otra dirección lo completa y lo publica.
    for (let n = 2; r.status === 409 && r.data.code === 'SLUG_TAKEN' && n <= 4; n++) {
      body.slug = `${p.slug}-${n}`;
      entry.aviso = `slug «${p.slug}» ocupado en el ERP: queda «${body.slug}» (redirigir la URL vieja)`;
      r = await erp('POST', '/integrations/catalog/products', { body });
    }
    if (!r.ok) {
      entry.error = planLimit(r, `producto ${p.name}`) ? 'plan_limit_reached' : `HTTP ${r.status} ${r.data.code ?? ''} ${r.data.error ?? ''}`.trim();
      report.productos.push(entry);
      continue;
    }
    entry.erpId = r.data.product?.id;
    entry.creado = r.status === 201;
    entry.slugErp = r.data.product?.slug ?? null;
    entry.precioErp = r.data.product?.sale_price ?? null;
    const imageIds = [];

    for (const [i, url] of (p.imageUrls || []).entries()) {
      try {
        const img = await fetch(url);
        if (!img.ok) throw new Error(`descarga HTTP ${img.status}`);
        const type = img.headers.get('content-type') || 'image/webp';
        const ext = type.includes('png') ? 'png' : type.includes('jpeg') || type.includes('jpg') ? 'jpg' : 'webp';
        const form = new FormData();
        form.append('file', new Blob([await img.arrayBuffer()], { type }), `${p.id}-${i + 1}.${ext}`);
        form.append('alt', p.name);
        const up = await erp('POST', `/integrations/catalog/products/${entry.erpId}/images`, { form });
        if (up.ok) {
          entry.fotos.subidas++;
          if (up.data.image?.id) imageIds.push(up.data.image.id);
        }
        else entry.fotos.fallidas.push({ url, motivo: planLimit(up, `fotos de ${p.name}`) ? 'plan_limit_reached' : `HTTP ${up.status} ${up.data.code ?? ''} ${up.data.error ?? ''}`.trim() });
      } catch (error) {
        entry.fotos.fallidas.push({ url, motivo: error.message });
      }
    }
    // Mismo orden que en Firebase (una foto repetida no se duplica, así que al repetir también vale).
    entry.fotoPrincipal = imageIds[0] ?? null;
    if (imageIds.length > 1) {
      const order = await erp('PATCH', `/integrations/catalog/products/${entry.erpId}/images/order`, { body: { image_ids: imageIds } });
      if (!order.ok) entry.fotos.orden = `HTTP ${order.status} ${order.data.code ?? ''}`.trim();
    }
    report.productos.push(entry);
    save();
    console.log(`  ${index + 1}/${products.length} ${p.name}: ${entry.creado ? 'creado' : 'ya existía'} · fotos ${entry.fotos.subidas}/${entry.fotos.total}${entry.aviso ? ` · ${entry.aviso}` : ''}`);
  }

  // 5) Comprobación: lo que lee el ERP debe coincidir con Firebase.
  const erpProducts = [];
  let cursor;
  for (let page = 0; page < 50; page++) {
    const r = await erp('GET', `/integrations/catalog/products?page_size=100${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`);
    if (!r.ok) break;
    erpProducts.push(...(r.data.items || []));
    if (!r.data.next_cursor) break;
    cursor = r.data.next_cursor;
  }
  const byId = new Map(erpProducts.map((x) => [x.id, x]));
  const differences = [];
  for (const entry of report.productos) {
    const got = entry.erpId && byId.get(entry.erpId);
    if (!got) {
      differences.push({ producto: entry.nombre, problema: 'no aparece en la lectura del ERP' });
      continue;
    }
    if (got.name !== entry.nombre) differences.push({ producto: entry.nombre, problema: `nombre en el ERP: «${got.name}»` });
    if (Math.abs(Number(got.sale_price) - Number(entry.precio)) > 0.011) differences.push({ producto: entry.nombre, problema: `precio en el ERP: ${got.sale_price}, en Firebase: ${entry.precio}` });
    if ((got.images || []).length !== entry.fotos.total) differences.push({ producto: entry.nombre, problema: `fotos en el ERP: ${(got.images || []).length}, en Firebase: ${entry.fotos.total}` });
    if (entry.slug && got.slug !== entry.slug) differences.push({ producto: entry.nombre, problema: `slug en el ERP: ${got.slug ?? '(ninguno)'}, en Firebase: ${entry.slug}` });
    const firstPhoto = [...(got.images || [])].sort((a, b) => Number(b.is_primary ?? false) - Number(a.is_primary ?? false) || (a.sort_order ?? 0) - (b.sort_order ?? 0))[0];
    if (entry.fotos.total > 1 && firstPhoto && entry.fotoPrincipal && firstPhoto.id !== entry.fotoPrincipal) differences.push({ producto: entry.nombre, problema: 'la foto principal no es la primera de Firebase' });
  }
  report.verificacion = {
    productosEnFirebase: products.length,
    productosEnElErp: report.productos.filter((p) => p.erpId).length,
    fotosEnFirebase: photos,
    fotosSubidas: report.productos.reduce((n, p) => n + p.fotos.subidas, 0),
    diferencias: differences,
  };
  report.termino = new Date().toISOString();
  save();
  console.log(`Comprobación: ${report.verificacion.productosEnElErp}/${products.length} productos, ${report.verificacion.fotosSubidas}/${photos} fotos, ${differences.length} diferencias.`);
  if (report.limitesDelPlan.length) console.log(`Choques con el plan: ${report.limitesDelPlan.length} (ver el reporte).`);
  console.log(`Reporte: ${path.resolve(outFile)}`);
})().catch((error) => {
  report.error = error.message;
  save();
  fail(`${error.message}. Reporte parcial en ${outFile}.`);
});
