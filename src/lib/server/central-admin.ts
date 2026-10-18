import * as admin from 'firebase-admin';

const CENTRAL_ADMIN_APP_NAME = 'central-admin';

function getCentralServiceAccount() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKeyRaw) {
    throw new Error(
      'Missing Firebase Admin env vars: FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY.'
    );
  }

  return {
    projectId,
    clientEmail,
    privateKey: privateKeyRaw.replace(/\\n/g, '\n'),
  };
}

/**
 * Si hay credenciales del proyecto central. En local suele no haberlas: ahí
 * solo cuentan las tiendas de la base propia (store-db) y las de prueba.
 */
export function centralAdminConfigured(): boolean {
  return Boolean(process.env.FIREBASE_ADMIN_PROJECT_ID && process.env.FIREBASE_ADMIN_CLIENT_EMAIL && process.env.FIREBASE_ADMIN_PRIVATE_KEY);
}

function getCentralAdminApp() {
  const existing = admin.apps.find((app) => app?.name === CENTRAL_ADMIN_APP_NAME);
  if (existing) {
    return existing;
  }

  const serviceAccount = getCentralServiceAccount();

  return admin.initializeApp(
    {
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.projectId,
    },
    CENTRAL_ADMIN_APP_NAME
  );
}

export function getCentralAdminAuth() {
  return admin.auth(getCentralAdminApp());
}

export function getCentralAdminDb() {
  return admin.firestore(getCentralAdminApp());
}
