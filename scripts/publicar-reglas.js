#!/usr/bin/env node
/**
 * Publica las reglas de Firestore del proyecto central desde `firestore.rules`.
 *
 *   node scripts/publicar-reglas.js            # valida y publica
 *   node scripts/publicar-reglas.js --validar  # solo comprueba que compilan
 *   node scripts/publicar-reglas.js --ver      # imprime las que están publicadas
 *   node scripts/publicar-reglas.js --volver <nombre-del-ruleset>   # vuelve a uno anterior
 *
 * Necesita las mismas variables que el servidor: FIREBASE_ADMIN_PROJECT_ID,
 * FIREBASE_ADMIN_CLIENT_EMAIL y FIREBASE_ADMIN_PRIVATE_KEY. La ruta del archivo
 * se puede cambiar con REGLAS=/ruta/firestore.rules.
 *
 * Firebase guarda cada conjunto publicado: el nombre que imprime este script
 * antes de publicar es el que hay que pasar a --volver para deshacer.
 */
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const faltan = ['FIREBASE_ADMIN_PROJECT_ID', 'FIREBASE_ADMIN_CLIENT_EMAIL', 'FIREBASE_ADMIN_PRIVATE_KEY']
  .filter((nombre) => !process.env[nombre]);
if (faltan.length) {
  console.error('Faltan variables de entorno: ' + faltan.join(', '));
  process.exit(1);
}

const app = admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
}, 'publicar-reglas');
const reglas = admin.securityRules(app);

async function main() {
  const [modo, argumento] = process.argv.slice(2);

  const actual = await reglas.getFirestoreRuleset();
  console.log(`Publicadas ahora: ${actual.name} (${actual.createTime})`);

  if (modo === '--ver') {
    console.log(actual.source.map((f) => f.content).join('\n'));
    return;
  }
  if (modo === '--volver') {
    if (!argumento) throw new Error('Indica el nombre del ruleset al que volver.');
    await reglas.releaseFirestoreRuleset(argumento);
    console.log(`Hecho: vuelven a regir las reglas ${argumento}.`);
    return;
  }

  const archivo = process.env.REGLAS || path.join(__dirname, '..', 'firestore.rules');
  const contenido = fs.readFileSync(archivo, 'utf8');
  // Crear el conjunto ya lo compila: si las reglas tienen un error, falla aquí
  // y lo publicado no se toca.
  const nuevo = await reglas.createRuleset(reglas.createRulesFileFromSource('firestore.rules', contenido));
  console.log(`Compilan. Conjunto nuevo: ${nuevo.name}`);

  if (modo === '--validar') {
    await reglas.deleteRuleset(nuevo.name);
    console.log('Solo validación: no se publicó nada.');
    return;
  }
  await reglas.releaseFirestoreRuleset(nuevo.name);
  console.log(`Publicadas. Para deshacer: node scripts/publicar-reglas.js --volver ${actual.name}`);
}

main().then(() => process.exit(0)).catch((error) => {
  console.error('No se pudo: ' + (error.message || error));
  process.exit(1);
});
