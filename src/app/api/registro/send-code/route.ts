import { NextRequest, NextResponse } from 'next/server';
import { getCentralAdminDb } from '@/lib/server/central-admin';
import { sendVerificationCode } from '@/lib/email';
import { checkRateLimit } from '@/lib/server/rate-limit';
import * as admin from 'firebase-admin';

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
