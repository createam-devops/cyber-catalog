import { getCentralAdminDb } from './central-admin';
import { getPlan, isTrialExpired } from '@/lib/plans';
import type { PlanId } from '@/lib/plans';

export interface TenantPlanInfo {
  plan: PlanId;
  status: string;
  trialEndsAt?: Date | null;
  isActive: boolean; // trial vigente o suscripción activa
}

export async function getTenantPlanInfo(tenantId: string): Promise<TenantPlanInfo> {
  const doc = await getCentralAdminDb().collection('tenants').doc(tenantId).get();
  const data = doc.data() ?? {};

  const plan = (data.plan as PlanId) ?? 'starter';
  const status = (data.status as string) ?? 'pending';
  const trialEndsAt = data.trialEndsAt?.toDate?.() ?? null;

  const isActive =
    status === 'active' ||
    (status === 'trial' && !isTrialExpired(trialEndsAt));

  return { plan, status, trialEndsAt, isActive };
}

export async function checkProductLimit(tenantId: string, currentCount: number): Promise<{ allowed: boolean; limit: number | null }> {
  const { plan, isActive } = await getTenantPlanInfo(tenantId);
  if (!isActive) return { allowed: false, limit: 0 };

  const planDef = getPlan(plan);
  const limit = planDef.limits.products;

  if (limit === null) return { allowed: true, limit: null };
  return { allowed: currentCount < limit, limit };
}

export async function checkCategoryLimit(tenantId: string, currentCount: number): Promise<{ allowed: boolean; limit: number | null }> {
  const { plan, isActive } = await getTenantPlanInfo(tenantId);
  if (!isActive) return { allowed: false, limit: 0 };

  const planDef = getPlan(plan);
  const limit = planDef.limits.categories;

  if (limit === null) return { allowed: true, limit: null };
  return { allowed: currentCount < limit, limit };
}
