import { NextRequest, NextResponse } from 'next/server';
import { getCentralAdminDb } from '@/lib/server/central-admin';
import { sendVerificationCode } from '@/lib/email';
import { checkRateLimit } from '@/lib/server/rate-limit';
import * as admin from 'firebase-admin';
import { randomInt } from 'node:crypto';
import { ERP_PASSWORD_RULE, erpPasswordOk, erpSignupPlanCode } from '@/lib/server/erp/signup';
import { saveSignupCode } from '@/lib/server/store-db';
import { normalizeWhatsapp } from '@/lib/storefront/public-store';

export const runtime = 'nodejs';

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  // 3 intentos por hora por IP para evitar flood de emails
  const rateLimit = checkRateLimit(request, 'registro-send-code', 3, 60 * 60 * 1000);
  if (rateLimit.limited) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Espera un momento antes de volver a intentarlo.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  // Registro con alta en el ERP (ERP_SIGNUP_PLAN_CODE): sin Firebase.
  if (erpSignupPlanCode()) return sendErpSignupCode(body);

  const { businessName, email, phone, password } = body;

  if (!businessName || !email || !phone || !password) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
  }

  if (String(password).length < 6) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
  }

  const db = getCentralAdminDb();

  // Verificar si ya existe un tenant activo con ese email
  const existing = await db.collection('tenants').where('email', '==', email).limit(1).get();
  if (!existing.empty) {
    return NextResponse.json({ error: 'Ya existe una cuenta con este email' }, { status: 409 });
  }

  const code = generateCode();

  // Guardar registro pendiente — NO guardar password en Firestore
  const { password: _omit, ...safeBody } = body as Record<string, unknown>;
  await db.collection('pendingRegistrations').doc(String(email)).set({
    ...safeBody,
    code,
    attempts: 0,
    expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 15 * 60 * 1000)),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Enviar código por email
  await sendVerificationCode({
    businessName: String(businessName),
    email: String(email),
    code,
  });

  return NextResponse.json({ ok: true });
}

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

/**
 * Paso 1 del registro con alta en el ERP: revisa los datos con las reglas del
 * ERP (así el dueño no se entera al final) y manda el código al correo. La
 * solicitud se guarda en la base propia, sin la contraseña.
 */
async function sendErpSignupCode(body: Record<string, unknown>) {
  const businessName = text(body.businessName);
  const ownerName = text(body.ownerName);
  const email = text(body.email).toLowerCase();
  const password = typeof body.password === 'string' ? body.password : '';
  if (!businessName || !ownerName || !email || !text(body.phone) || !password) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
  }
  if (!erpPasswordOk(password)) {
    return NextResponse.json({ error: ERP_PASSWORD_RULE }, { status: 400 });
  }
  const whatsapp = normalizeWhatsapp(text(body.phone));
  if (!whatsapp) {
    return NextResponse.json({ error: 'El WhatsApp no es válido. Escribe tu celular de 9 dígitos.' }, { status: 400 });
  }

  const code = String(randomInt(100000, 1000000));
  saveSignupCode(email, code, { businessName, ownerName, phone: `+${whatsapp}` });
  try {
    await sendVerificationCode({ businessName, email, code });
  } catch (error) {
    console.error('[registro/send-code] No se pudo enviar el código:', error);
    return NextResponse.json({ error: 'No pudimos enviarte el código. Revisa tu correo e inténtalo de nuevo.' }, { status: 503 });
  }
  return NextResponse.json({ ok: true });
}
