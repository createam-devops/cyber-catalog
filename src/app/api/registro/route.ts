import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';
import { getCentralAdminDb } from '@/lib/server/central-admin';
import { AuthService, AuthServiceException } from '@/lib/server/auth-service';
import { sendNewTenantNotification, sendRegistrationConfirmation } from '@/lib/email';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { getTrialEndDate } from '@/lib/plans';
import { uniqueSubdomain } from '@/lib/server/subdomain';
import { createErpPartner, ERP_PASSWORD_RULE, erpLoginUrl, erpPasswordOk, erpSignupPlanCode } from '@/lib/server/erp/signup';
import { checkSignupCode, deleteSignupCode } from '@/lib/server/store-db';

export const runtime = 'nodejs';

/** Cómo es el registro: con alta en el ERP (y su regla de contraseña) o el de siempre. */
export async function GET() {
  const erp = Boolean(erpSignupPlanCode());
  return NextResponse.json({ erp, passwordRule: erp ? ERP_PASSWORD_RULE : null });
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
    // Registro con alta en el ERP (ERP_SIGNUP_PLAN_CODE): sin Firebase.
    if (erpSignupPlanCode()) return await verifyErpSignup(body);
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

    const subdomain = await uniqueSubdomain(String(businessName));

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


/**
 * Paso 2 del registro con alta en el ERP: con el código correcto, el negocio y
 * su dueño nacen en el ERP con el plan del catálogo. El dueño entra después a
 * CyberPOS (loginUrl) y crea su tienda desde «Crea tu tienda online».
 */
async function verifyErpSignup(body: Record<string, unknown>) {
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const code = typeof body.code === 'string' ? body.code.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!email || !code || !password) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
  }

  const check = checkSignupCode(email, code);
  if (!check.ok) {
    const error =
      check.reason === 'wrong'
        ? `Código incorrecto. ${check.remaining} intentos restantes.`
        : check.reason === 'attempts'
          ? 'Demasiados intentos fallidos. Solicita un nuevo código.'
          : check.reason === 'expired'
            ? 'El código expiró. Solicita uno nuevo.'
            : 'Código no encontrado o expirado. Solicita uno nuevo.';
    return NextResponse.json({ error }, { status: 400 });
  }
  if (!erpPasswordOk(password)) {
    return NextResponse.json({ error: ERP_PASSWORD_RULE }, { status: 400 });
  }

  const data = check.data as { businessName?: string; ownerName?: string; phone?: string };
  const result = await createErpPartner({
    businessName: data.businessName ?? '',
    ownerName: data.ownerName ?? data.businessName ?? '',
    email,
    password,
    phone: data.phone,
  });
  const loginUrl = erpLoginUrl(email);

  if (!result.ok) {
    // Ya tiene cuenta: que entre con ella. El código ya no sirve para otra cosa.
    if (result.code === 'EMAIL_ALREADY_REGISTERED') deleteSignupCode(email);
    return NextResponse.json({ error: result.error, code: result.code, loginUrl: result.code === 'EMAIL_ALREADY_REGISTERED' ? loginUrl : null }, { status: result.status });
  }

  deleteSignupCode(email);
  return NextResponse.json({ ok: true, provider: 'erp', partnerId: result.partnerId, loginUrl });
}
