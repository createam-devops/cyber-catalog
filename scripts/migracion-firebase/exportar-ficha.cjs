// Exporta (SOLO LECTURA) la ficha de una tienda del Firestore central y sus usuarios,
// para migrar-tienda.mjs e importar-presentacion.mjs. Usa la credencial de
// administración que ya tiene el contenedor de producción:
//
//   docker exec -i createam-platform node - <id de la tienda> < exportar-ficha.cjs > ficha.json
//
// La ficha trae el correo y el WhatsApp de la tienda y su firebaseConfig: no la
// pegues en chats ni en tickets.
const admin = require('/app/node_modules/firebase-admin');

const tenantId = process.argv[2];
if (!/^[A-Za-z0-9_-]{1,64}$/.test(tenantId || '')) {
  console.error('Uso: node - <id de la tienda> < exportar-ficha.cjs');
  process.exit(1);
}
const app = admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  }),
});
const plain = (v) =>
  v && typeof v.toDate === 'function'
    ? v.toDate().toISOString()
    : Array.isArray(v)
      ? v.map(plain)
      : v && typeof v === 'object'
        ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, plain(x)]))
        : v;

(async () => {
  const db = admin.firestore(app);
  const doc = await db.collection('tenants').doc(tenantId).get();
  if (!doc.exists) throw new Error(`No existe la tienda ${tenantId}`);
  const users = await db.collection('users').where('tenantId', '==', tenantId).get();
  process.stdout.write(
    JSON.stringify(
      {
        id: doc.id,
        ...plain(doc.data()),
        _users: users.docs.map((u) => ({ uid: u.id, role: u.data().role, email: u.data().email, displayName: u.data().displayName || null })),
      },
      null,
      2
    )
  );
  process.exit(0);
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
