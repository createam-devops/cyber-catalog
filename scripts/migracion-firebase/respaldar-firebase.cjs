// Respaldo completo (SOLO LECTURA) de un proyecto de Firebase antes de apagarlo
// (C-7): todas las colecciones de Firestore con sus subcolecciones y todos los
// archivos de Storage. No escribe ni borra nada en Firebase.
//
// Proyecto central (cyber-catalog), con la credencial del contenedor:
//   docker exec -i createam-platform node - /tmp/respaldo < respaldar-firebase.cjs
//
// Otro proyecto (p. ej. createam-5a670 de Bella Sorpresa), con su llave:
//   RESPALDO_LLAVE=ruta/serviceAccountKey.json node respaldar-firebase.cjs <carpeta>
//
// Deja en <carpeta>: firestore.json, storage.json (lista) y storage/ (archivos).
// Tiene datos personales (correos, teléfonos): no lo pegues en chats ni tickets.
const fs = require('fs');
const path = require('path');

let admin;
try {
  admin = require('/app/node_modules/firebase-admin');
} catch {
  admin = require('firebase-admin');
}

const out = process.argv[2];
if (!out) {
  console.error('Uso: node respaldar-firebase.cjs <carpeta de salida>');
  process.exit(1);
}

const keyFile = process.env.RESPALDO_LLAVE;
const key = keyFile
  ? JSON.parse(fs.readFileSync(keyFile, 'utf8'))
  : {
      project_id: process.env.FIREBASE_ADMIN_PROJECT_ID,
      client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      private_key: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    };
const projectId = key.project_id;
const bucketNames = [
  process.env.RESPALDO_BUCKET,
  !keyFile && process.env.NEXT_PUBLIC_CENTRAL_FIREBASE_STORAGE_BUCKET,
  `${projectId}.firebasestorage.app`,
  `${projectId}.appspot.com`,
].filter(Boolean);

const app = admin.initializeApp({
  credential: admin.credential.cert({ projectId, clientEmail: key.client_email, privateKey: key.private_key }),
});

// Tipos de Firestore a JSON sin perder qué eran.
function plain(value) {
  if (value === null || value === undefined) return value ?? null;
  if (typeof value.toDate === 'function' && typeof value.seconds === 'number') return { _timestamp: value.toDate().toISOString() };
  if (value instanceof admin.firestore.GeoPoint) return { _geopoint: [value.latitude, value.longitude] };
  if (value instanceof admin.firestore.DocumentReference) return { _ref: value.path };
  if (Buffer.isBuffer(value) || value instanceof Uint8Array) return { _bytes: Buffer.from(value).toString('base64') };
  if (Array.isArray(value)) return value.map(plain);
  if (typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, plain(v)]));
  return value;
}

let documents = 0;
async function exportCollection(ref) {
  const snapshot = await ref.get();
  const docs = [];
  for (const doc of snapshot.docs) {
    documents++;
    const subcollections = {};
    for (const sub of await doc.ref.listCollections()) subcollections[sub.id] = await exportCollection(sub);
    docs.push({ id: doc.id, data: plain(doc.data()), ...(Object.keys(subcollections).length ? { subcollections } : {}) });
  }
  return docs;
}

(async () => {
  fs.mkdirSync(path.join(out, 'storage'), { recursive: true });
  const db = admin.firestore(app);
  const collections = {};
  for (const ref of await db.listCollections()) collections[ref.id] = await exportCollection(ref);
  fs.writeFileSync(path.join(out, 'firestore.json'), JSON.stringify({ project: projectId, exportedAt: new Date().toISOString(), collections }, null, 1));
  const counts = Object.entries(collections).map(([name, docs]) => `${name}: ${docs.length}`);
  console.log(`Firestore de ${projectId}: ${documents} documentos (${counts.join(', ') || 'sin colecciones'}).`);

  // Se prueba listando archivos (la cuenta puede leer archivos sin permiso para ver el bucket).
  let bucket = null;
  let files = [];
  const tried = [];
  for (const name of [...new Set(bucketNames)]) {
    const candidate = admin.storage(app).bucket(name);
    try {
      [files] = await candidate.getFiles();
      bucket = candidate;
      break;
    } catch (error) {
      tried.push(`${name}: ${error.code ?? ''} ${String(error.message).slice(0, 80)}`);
    }
  }
  if (!bucket) {
    console.log(`Storage: no pude leer ningún bucket.\n  ${tried.join('\n  ')}`);
    return;
  }
  const list = [];
  let bytes = 0;
  for (const file of files) {
    if (file.name.endsWith('/')) continue;
    const target = path.join(out, 'storage', ...file.name.split('/'));
    fs.mkdirSync(path.dirname(target), { recursive: true });
    await file.download({ destination: target });
    const size = Number(file.metadata.size) || 0;
    bytes += size;
    list.push({ name: file.name, size, contentType: file.metadata.contentType, updated: file.metadata.updated });
  }
  fs.writeFileSync(path.join(out, 'storage.json'), JSON.stringify({ bucket: bucket.name, files: list }, null, 1));
  console.log(`Storage ${bucket.name}: ${list.length} archivos (${(bytes / 1048576).toFixed(1)} MB).`);
})().catch((error) => {
  console.error('El respaldo falló:', error.message);
  process.exit(1);
});
