import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getCentralAdminDb } from '@/lib/server/central-admin';
import { sendNewTenantNotification, sendRegistrationConfirmation } from '@/lib/email';
import { checkRateLimit } from '@/lib/server/rate-limit';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(request, 'registro', 5, 60 * 60 * 1000); // 5 por hora por IP
  if (rateLimit.limited) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Intenta más tarde.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } }
    );
  }

  try {
    const body = await request.json();
    const { businessName, email, phone, wantsDomain, customDomain } = body;

    if (!businessName || !email || !phone) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    // Validación básica de email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }

    const db = getCentralAdminDb();

    // Verificar si ya existe un tenant con ese email
    const existing = await db.collection('tenants').where('email', '==', email).limit(1).get();
    if (!existing.empty) {
      return NextResponse.json({ error: 'Ya existe una solicitud con este email' }, { status: 409 });
    }

    // Generar subdomain base desde el nombre del negocio
    const subdomain = businessName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 30);

    const tenantData = {
      businessName,
      name: businessName,
      email,
      phone,
      subdomain,
      domain: wantsDomain && customDomain ? customDomain : null,
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection('tenants').add(tenantData);

    // Enviar emails en paralelo (sin bloquear la respuesta si fallan)
    Promise.all([
      sendNewTenantNotification({ businessName, email, phone, domain: tenantData.domain || undefined, subdomain }),
      sendRegistrationConfirmation({ businessName, email }),
    ]).catch((err) => console.error('[registro] Error enviando emails:', err));

    return NextResponse.json({ ok: true, tenantId: docRef.id });
  } catch (error) {
    console.error('[registro] Error:', error);
    return NextResponse.json({ error: 'Error al procesar solicitud' }, { status: 500 });
  }
}
