export type PlanId = 'starter' | 'pro';
export type BillingCycle = 'monthly' | 'yearly';

export interface Plan {
  id: PlanId;
  name: string;
  monthlyPrice: number; // en soles
  yearlyPrice: number;  // en soles (con 5% descuento)
  currency: 'PEN';
  limits: {
    products: number | null;    // null = ilimitado
    categories: number | null;
    heroSlides: number;
    imagesPerProduct: number;
  };
  features: {
    customDomain: boolean;
    socialMedia: boolean;
    stock: boolean;
    seo: boolean;
    analytics: boolean;
  };
}

export const PLANS: Record<PlanId, Plan> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 9.90,
    yearlyPrice: +(9.90 * 12 * 0.95).toFixed(2), // 112.86
    currency: 'PEN',
    limits: {
      products: 30,
      categories: 5,
      heroSlides: 1,
      imagesPerProduct: 5,
    },
    features: {
      customDomain: false,
      socialMedia: false,
      stock: false,
      seo: false,
      analytics: false,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 19.90,
    yearlyPrice: +(19.90 * 12 * 0.95).toFixed(2), // 226.86
    currency: 'PEN',
    limits: {
      products: null,
      categories: null,
      heroSlides: 10,
      imagesPerProduct: 20,
    },
    features: {
      customDomain: true,
      socialMedia: true,
      stock: true,
      seo: true,
      analytics: true,
    },
  },
};

export const TRIAL_DAYS = 30;

export function getPlan(planId: PlanId | string | undefined): Plan {
  return PLANS[(planId as PlanId) ?? 'starter'] ?? PLANS.starter;
}

export function getTrialEndDate(): Date {
  const date = new Date();
  date.setDate(date.getDate() + TRIAL_DAYS);
  return date;
}

export function isTrialExpired(trialEndsAt: Date | string | null | undefined): boolean {
  if (!trialEndsAt) return false;
  return new Date(trialEndsAt) < new Date();
}

export function getPlanPrice(planId: PlanId, cycle: BillingCycle): number {
  const plan = getPlan(planId);
  return cycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
}

export function getYearlyDiscount(): number {
  return 5; // 5%
}
