// Tipos para el sistema multi-tenant
import type { PlanId, BillingCycle } from './plans';

export type TenantStatus = 'pending' | 'active' | 'trial' | 'suspended' | 'rejected';

export interface TenantConfig {
  id: string;
  name: string;
  email: string;
  domain?: string; // Dominio personalizado (ej: bellasorpresa.pe)
  subdomain?: string; // Subdominio (ej: tienda1)
  status: TenantStatus;
  
  // Branding
  logo?: string;
  primaryColor?: string; // Color principal en formato hex (ej: #E11D48)
  colors?: {
    primary: string;
    secondary: string;
    accent?: string;
  };
  
  // Hero carousel slides
  heroSlides?: Array<{
    id: string;
    image: string;
    title: string;
    subtitle: string;
    buttonText: string;
    order?: number;
  }>;
  
  // Configuración Firebase del tenant
  firebaseConfig: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  
  // Contacto
  whatsapp?: string;
  
  // Redes sociales
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
  };
  
  // SEO
  seoTitle?: string;
  seoDescription?: string;

  // Plan y suscripción
  plan?: PlanId;
  billingCycle?: BillingCycle;
  trialEndsAt?: Date | string;
  subscriptionId?: string;  // ID de suscripción en MercadoPago
  subscriptionStatus?: 'authorized' | 'paused' | 'cancelled' | null;

  // Analytics (solo plan Pro)
  analyticsViews?: number;
  analyticsWhatsapp?: number;
  analyticsUpdatedAt?: Date | string;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  approvedAt?: Date;
  approvedBy?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  imageUrls?: string[];
  featured?: boolean;
  stock?: number | null;  // null = sin control de stock
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  label: string;
  value: string;
  icon?: string;
  order?: number;
  createdAt?: Date;
}

export interface TenantRegistration {
  name: string;
  email: string;
  businessName: string;
  phone: string;
  wantsDomain: boolean;
  customDomain?: string;
}

export interface TenantAuditActor {
  uid: string | null;
  email: string | null;
  role?: string | null;
}

export interface TenantAuditLog {
  id: string;
  tenantId: string | null;
  action: string | null;
  resource: string | null;
  resourceId: string | null;
  actor: TenantAuditActor;
  metadata?: Record<string, unknown>;
  createdAt: string | null;
}
