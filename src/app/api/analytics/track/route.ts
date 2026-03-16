import { NextRequest, NextResponse } from 'next/server';
import { getCentralAdminDb } from '@/lib/server/central-admin';
import { checkRateLimit } from '@/lib/server/rate-limit';
import * as admin from 'firebase-admin';

const VALID_EVENTS = ['view', 'whatsapp_click'] as const;
type AnalyticsEvent = typeof VALID_EVENTS[number];

export async function POST(request: NextRequest) {
  // Rate limit: 30 per minute per IP to prevent count inflation
  const rateLimit = checkRateLimit(request, 'analytics-track', 30, 60_000);
  if (rateLimit.limited) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  let body: { tenantId?: unknown; event?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { tenantId, event } = body;

  if (typeof tenantId !== 'string' || !tenantId.trim()) {
    return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
  }

  if (!VALID_EVENTS.includes(event as AnalyticsEvent)) {
    return NextResponse.json({ error: 'Invalid event' }, { status: 400 });
  }

  const field = (event as AnalyticsEvent) === 'view' ? 'analyticsViews' : 'analyticsWhatsapp';

  try {
    await getCentralAdminDb()
      .collection('tenants')
      .doc(tenantId.trim())
      .update({
        [field]: admin.firestore.FieldValue.increment(1),
        analyticsUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    // If Firestore update fails (e.g. doc doesn't exist), don't error the client
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[analytics/track] Error:', msg);
    return NextResponse.json({ error: 'Failed to track' }, { status: 500 });
  }
}
