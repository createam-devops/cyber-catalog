import { FieldValue } from 'firebase-admin/firestore';
import { getCentralAdminDb } from '@/lib/server/central-admin';
import { isLocalStore, logLocalAudit } from '@/lib/server/store-db';

interface TenantAuditActor {
  uid: string;
  email: string;
  role?: string;
}

interface TenantAuditEvent {
  tenantId: string;
  action: string;
  resource: string;
  resourceId?: string;
  actor: TenantAuditActor;
  metadata?: Record<string, unknown>;
}

function toSerializableMetadata(metadata: Record<string, unknown> | undefined) {
  if (!metadata) {
    return {};
  }

  try {
    return JSON.parse(JSON.stringify(metadata));
  } catch {
    return {
      serializationError: true,
    };
  }
}

export async function logTenantAdminEvent(event: TenantAuditEvent): Promise<void> {
  try {
    // Las tiendas del ERP guardan su historial en la base propia.
    if (isLocalStore(event.tenantId)) {
      logLocalAudit({
        storeId: event.tenantId,
        action: event.action,
        actor: { uid: event.actor.uid, email: event.actor.email, role: event.actor.role || null },
        metadata: { resource: event.resource, resourceId: event.resourceId || null, ...toSerializableMetadata(event.metadata) },
      });
      return;
    }
    await getCentralAdminDb().collection('tenantAdminAuditLogs').add({
      tenantId: event.tenantId,
      action: event.action,
      resource: event.resource,
      resourceId: event.resourceId || null,
      actor: {
        uid: event.actor.uid,
        email: event.actor.email,
        role: event.actor.role || null,
      },
      metadata: toSerializableMetadata(event.metadata),
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    // Audit must not break admin actions.
    console.error('[tenant-audit] Failed to persist audit event:', error);
  }
}
