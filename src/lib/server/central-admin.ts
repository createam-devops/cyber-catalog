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

/**
 * Bucket de Storage del proyecto central. Ahí van las imágenes de las tiendas
 * que no tienen Firebase propio (las del ERP): portada y logo.
 */
export function getCentralAdminBucket() {
  const bucket = process.env.FIREBASE_ADMIN_STORAGE_BUCKET || process.env.NEXT_PUBLIC_CENTRAL_FIREBASE_STORAGE_BUCKET;
  if (!bucket) {
    throw new Error('Missing storage bucket: FIREBASE_ADMIN_STORAGE_BUCKET or NEXT_PUBLIC_CENTRAL_FIREBASE_STORAGE_BUCKET.');
  }
  return admin.storage(getCentralAdminApp()).bucket(bucket);
}
