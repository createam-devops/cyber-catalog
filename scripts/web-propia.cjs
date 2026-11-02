// Marca una tienda que tiene una web propia hecha a medida (p. ej.
// bellasorpresa.pe, que se publica aparte y lee /api/storefront/catalog).
// El editor de CyberPOS le muestra el aviso de «diseño personalizado» y
// bloquea lo que esa web no usa: logo, colores, letras, textos, beneficios,
// preguntas frecuentes, dirección y SEO. Banners, WhatsApp, redes y aviso de
// oferta siguen editables, porque su web los muestra.
//
// Se corre dentro del contenedor, que tiene la base (DATA_DIR/catalog.db):
//
//   docker exec -i createam-platform node - bellasorpresa.pe https://bellasorpresa.pe < scripts/web-propia.cjs
//   docker exec -i createam-platform node - bellasorpresa.pe --quitar < scripts/web-propia.cjs
//
// Sin URL, solo dice cómo está la tienda.

const path = require('node:path');
const Database = require('better-sqlite3');

const [domain, target] = process.argv.slice(2);
if (!domain) {
  console.error('Uso: node - <dominio de la tienda> [<url de su web> | --quitar] < scripts/web-propia.cjs');
  process.exit(1);
}
if (target && target !== '--quitar' && !/^https:\/\/[a-z0-9.-]+\/?$/i.test(target)) {
  console.error('La URL de la web va completa y con https, por ejemplo https://bellasorpresa.pe');
  process.exit(1);
}

const dir = path.resolve(process.env.DATA_DIR?.trim() || path.join(process.cwd(), 'data'));
const db = new Database(path.join(dir, 'catalog.db'), { fileMustExist: true });
const row = db.prepare('SELECT id, settings FROM stores WHERE domain = ?').get(domain.toLowerCase());
if (!row) {
  console.error(`No hay una tienda con el dominio ${domain}.`);
  process.exit(1);
}

const settings = JSON.parse(row.settings);
if (target) {
  if (target === '--quitar') delete settings.customSite;
  else settings.customSite = { url: target.replace(/\/+$/, '') };
  db.prepare('UPDATE stores SET settings = ?, updated_at = ? WHERE id = ?').run(JSON.stringify(settings), new Date().toISOString(), row.id);
}
console.log(
  settings.customSite
    ? `La tienda ${row.id} (${domain}) tiene web propia: ${settings.customSite.url}`
    : `La tienda ${row.id} (${domain}) usa la plantilla de la plataforma.`
);
