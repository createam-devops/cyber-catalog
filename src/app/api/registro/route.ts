import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';
import { getCentralAdminDb } from '@/lib/server/central-admin';
import { AuthService, AuthServiceException } from '@/lib/server/auth-service';
import { sendNewTenantNotification, sendRegistrationConfirmation } from '@/lib/email';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { getTrialEndDate } from '@/lib/plans';

export const runtime = 'nodejs';

// Subdominios de createam.cloud que ya usan otros servicios: una tienda con
// alguno de estos nombres nunca recibiría visitas.
const RESERVED_SUBDOMAINS = new Set([
  'www', 'api', 'app', 'app-dev', 'auth', 'admin', 'mail', 'cdn', 'static', 'dev', 'beta',
  'createam', 'cyberpos', 'cyberposapp', 'onturn', 'tenant-admin', 'registro', 'login', 'tienda',
]);

/**
 * Subdominio para una tienda nueva a partir de su nombre: sin tildes
 * ("Café Aroma" → "cafe-aroma"), sin chocar con otra tienda ni con un
 * subdominio reservado. Si ya existe, agrega -2, -3…
 */
async function uniqueSubdomain(db: FirebaseFirestore.Firestore, businessName: string): Promise<string> {
  const base =
    businessName
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 30)
      .replace(/-+$/, '') || 'tienda';

  for (let i = 1; i <= 20; i++) {
    const candidate = i === 1 ? base : `${base.slice(0, 26).replace(/-+$/, '')}-${i}`;
    if (RESERVED_SUBDOMAINS.has(candidate)) continue;
    const taken = await db.collection('tenants').where('subdomain', '==', candidate).limit(1).get();
    if (taken.empty) return candidate;
  }
  return `${base.slice(0, 20).replace(/-+$/, '')}-${Date.now().toString(36)}`;
}

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(request, 'registro-verify', 10, 60 * 60 * 1000);
  if (rateLimit.limited) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Intenta más tarde.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } }
    );
  }

  try {
    const body = await request.json();
    const { email, code, password } = body;

    if (!email || !code || !password) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    if (String(password).length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
    }

    const db = getCentralAdminDb();

    // Leer registro pendiente
    const pendingDoc = await db.collection('pendingRegistrations').doc(String(email)).get();
    if (!pendingDoc.exists) {
      return NextResponse.json({ error: 'Código no encontrado o expirado. Solicita uno nuevo.' }, { status: 400 });
    }

    const pending = pendingDoc.data()!;

    // Verificar expiración
    if (pending.expiresAt.toDate() < new Date()) {
      await db.collection('pendingRegistrations').doc(String(email)).delete();
      return NextResponse.json({ error: 'El código expiró. Solicita uno nuevo.' }, { status: 400 });
    }

    // Verificar intentos (max 5)
    if ((pending.attempts ?? 0) >= 5) {
      return NextResponse.json({ error: 'Demasiados intentos fallidos. Solicita un nuevo código.' }, { status: 400 });
    }

    // Verificar código
    if (pending.code !== String(code).trim()) {
      await db.collection('pendingRegistrations').doc(String(email)).update({
        attempts: admin.firestore.FieldValue.increment(1),
      });
      const remaining = 5 - ((pending.attempts ?? 0) + 1);
      return NextResponse.json({ error: `Código incorrecto. ${remaining} intentos restantes.` }, { status: 400 });
    }

    // Código correcto — verificar duplicado (race condition)
    const existing = await db.collection('tenants').where('email', '==', email).limit(1).get();
    if (!existing.empty) {
      await db.collection('pendingRegistrations').doc(String(email)).delete();
      return NextResponse.json({ error: 'Ya existe una cuenta con este email' }, { status: 409 });
    }

    const { businessName, phone, wantsDomain, customDomain } = pending;

    const subdomain = await uniqueSubdomain(db, String(businessName));

    // 1. Crear usuario en el proveedor de autenticación
    let uid: string;
    try {
      const authUser = await AuthService.createUser(String(email), String(password));
      uid = authUser.uid;
    } catch (e) {
      if (e instanceof AuthServiceException) {
        if (e.code === 'EMAIL_EXISTS') {
          return NextResponse.json({ error: 'Ya existe una cuenta con este email. Intenta iniciar sesión.' }, { status: 409 });
        }
        if (e.code === 'WEAK_PASSWORD') {
          return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres.' }, { status: 400 });
        }
      }
      console.error('[registro] AuthService.createUser error:', e);
      return NextResponse.json({ error: 'Error al crear cuenta.' }, { status: 500 });
    }

    const tenantData = {
      businessName,
      name: businessName,
      email,
      phone,
      subdomain,
      domain: wantsDomain && customDomain ? customDomain : null,
      status: 'trial',
      plan: 'starter',
      billingCycle: 'monthly',
      trialEndsAt: getTrialEndDate(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    // 2. Crear tenant en Firestore
    const docRef = await db.collection('tenants').add(tenantData);

    // 3. Crear documento en users (vincula auth UID con tenant)
    await db.collection('users').doc(uid).set({
      uid,
      email: String(email),
      tenantId: docRef.id,
      role: 'owner',
      displayName: String(businessName),
      createdAt: FieldValue.serverTimestamp(),
    });

    // Eliminar registro pendiente
    await db.collection('pendingRegistrations').doc(String(email)).delete();

    // Enviar emails en paralelo (no bloquean la respuesta)
    Promise.all([
      sendNewTenantNotification({ businessName: String(businessName), email: String(email), phone: String(phone), domain: tenantData.domain || undefined, subdomain }),
      sendRegistrationConfirmation({ businessName: String(businessName), email: String(email) }),
    ]).catch((err) => console.error('[registro] Error enviando emails:', err));

    return NextResponse.json({ ok: true, tenantId: docRef.id });
  } catch (error) {
    console.error('[registro] Error:', error);
    return NextResponse.json({ error: 'Error al procesar solicitud' }, { status: 500 });
  }
}

