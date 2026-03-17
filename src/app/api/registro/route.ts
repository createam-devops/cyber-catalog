import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';
import { getCentralAdminDb, getCentralAdminAuth } from '@/lib/server/central-admin';
import { sendNewTenantNotification, sendRegistrationConfirmation } from '@/lib/email';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { getTrialEndDate } from '@/lib/plans';

export const runtime = 'nodejs';

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

    const subdomain = String(businessName)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 30);

    // 1. Crear usuario en Firebase Auth PRIMERO (si falla, no creamos tenant)
    let authUser: admin.auth.UserRecord;
    try {
      authUser = await getCentralAdminAuth().createUser({
        email: String(email),
        password: String(password),
        displayName: String(businessName),
      });
    } catch (authError: any) {
      console.error('[registro] Firebase Auth error full:', JSON.stringify(authError?.errorInfo || authError, null, 2));
      console.error('[registro] code:', authError?.code, 'message:', authError?.message);
      if (authError.code === 'auth/email-already-exists') {
        return NextResponse.json({ error: 'Ya existe una cuenta con este email. Intenta iniciar sesión.' }, { status: 409 });
      }
      if (authError.code === 'auth/invalid-password') {
        return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres.' }, { status: 400 });
      }
      return NextResponse.json({ error: `Error al crear cuenta: ${authError?.code || authError?.message || 'desconocido'}`, detail: authError?.errorInfo?.message }, { status: 500 });
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
    await db.collection('users').doc(authUser.uid).set({
      uid: authUser.uid,
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

