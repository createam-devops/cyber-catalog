import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  where,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { centralDb } from './firebase';
import { TenantConfig, TenantStatus, TenantRegistration } from './types';

/**
 * Obtiene un tenant por dominio o subdominio
 */
export async function getTenantByDomain(domain: string): Promise<TenantConfig | null> {
  try {
    // Extraer el subdominio si es un subdominio de la plataforma
    const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'createam.cloud';
    const isSubdomain = domain.endsWith(`.${platformDomain}`);
    const subdomainPart = isSubdomain ? domain.split('.')[0] : null;
    
    // Primero intentar buscar por dominio personalizado exacto
    const domainQuery = query(
      collection(centralDb, 'tenants'),
      where('domain', '==', domain),
      where('status', '==', 'active')
    );
    
    let snapshot = await getDocs(domainQuery);
    
    // Si no se encuentra y es un subdominio, buscar por subdominio
    if (snapshot.empty && subdomainPart) {
      const subdomainQuery = query(
        collection(centralDb, 'tenants'),
        where('subdomain', '==', subdomainPart),
        where('status', '==', 'active')
      );
      snapshot = await getDocs(subdomainQuery);
    }
    
    // Si aún no se encuentra y es un subdominio, buscar por nombre del tenant
    // (para casos donde el subdomain no está configurado pero el nombre coincide)
    if (snapshot.empty && subdomainPart) {
      // Obtener todos los tenants activos y buscar por nombre similar
      const allTenantsQuery = query(
        collection(centralDb, 'tenants'),
        where('status', '==', 'active')
      );
      const allSnapshot = await getDocs(allTenantsQuery);
      
      // Buscar tenant cuyo nombre normalizado coincida con el subdominio
      const normalizedSubdomain = subdomainPart.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      for (const doc of allSnapshot.docs) {
        const data = doc.data();
        const normalizedName = (data.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        
        // Si el nombre normalizado contiene el subdominio o viceversa
        if (normalizedName.includes(normalizedSubdomain) || normalizedSubdomain.includes(normalizedName)) {
          snapshot = { docs: [doc], empty: false } as typeof snapshot;
          break;
        }
      }
    }
    
    if (snapshot.empty) {
      console.log(`[getTenantByDomain] No se encontró tenant para dominio: ${domain}`);
      return null;
    }
    
    const data = snapshot.docs[0].data();
    console.log(`[getTenantByDomain] Tenant encontrado: ${data.name} (${snapshot.docs[0].id}) para dominio: ${domain}`);
    
    return {
      id: snapshot.docs[0].id,
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
      approvedAt: data.approvedAt?.toDate(),
    } as TenantConfig;
  } catch (error) {
    console.error('Error fetching tenant:', error);
    return null;
  }
}

/**
 * Obtiene un tenant por ID
 */
export async function getTenantById(tenantId: string): Promise<TenantConfig | null> {
  try {
    const docRef = doc(centralDb, 'tenants', tenantId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
      approvedAt: data.approvedAt?.toDate(),
    } as TenantConfig;
  } catch (error) {
    console.error('Error fetching tenant by ID:', error);
    return null;
  }
}

/**
 * Obtiene todos los tenants
 */
export async function getAllTenants(statusFilter?: TenantStatus): Promise<TenantConfig[]> {
  try {
    let q = query(collection(centralDb, 'tenants'), orderBy('createdAt', 'desc'));
    
    if (statusFilter) {
      q = query(
        collection(centralDb, 'tenants'),
        where('status', '==', statusFilter),
        orderBy('createdAt', 'desc')
      );
    }
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
      approvedAt: doc.data().approvedAt?.toDate(),
    })) as TenantConfig[];
  } catch (error) {
    console.error('Error fetching tenants:', error);
    return [];
  }
}

/**
 * Crea un nuevo registro de tenant (pendiente de aprobación)
 */
export async function registerTenant(registration: TenantRegistration): Promise<string> {
  try {
    const now = Timestamp.now();
    
    const tenantData = {
      name: registration.businessName,
      email: registration.email,
      status: 'pending' as TenantStatus,
      subdomain: registration.wantsDomain ? undefined : generateSubdomain(registration.businessName),
      domain: registration.customDomain,
      whatsapp: registration.phone,
      createdAt: now,
      updatedAt: now,
      // Firebase config vacío - se configurará después de la aprobación
      firebaseConfig: {
        apiKey: '',
        authDomain: '',
        projectId: '',
        storageBucket: '',
        messagingSenderId: '',
        appId: '',
      }
    };
    
    const docRef = await addDoc(collection(centralDb, 'tenants'), tenantData);
    return docRef.id;
  } catch (error) {
    console.error('Error registering tenant:', error);
    throw error;
  }
}

/**
 * Actualiza el estado de un tenant
 */
export async function updateTenantStatus(
  tenantId: string, 
  status: TenantStatus, 
  approvedBy?: string
): Promise<void> {
  try {
    const docRef = doc(centralDb, 'tenants', tenantId);
    const updateData: Record<string, unknown> = {
      status,
      updatedAt: Timestamp.now(),
    };
    
    if (status === 'active' && approvedBy) {
      updateData.approvedAt = Timestamp.now();
      updateData.approvedBy = approvedBy;
    }
    
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating tenant status:', error);
    throw error;
  }
}

/**
 * Actualiza la configuración de un tenant
 */
export async function updateTenantConfig(
  tenantId: string, 
  config: Partial<TenantConfig>
): Promise<void> {
  try {
    const docRef = doc(centralDb, 'tenants', tenantId);
    await updateDoc(docRef, {
      ...config,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating tenant config:', error);
    throw error;
  }
}

/**
 * Genera un subdominio único basado en el nombre del negocio
 */
function generateSubdomain(businessName: string): string {
  // Convertir a slug
  const slug = businessName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  // Agregar timestamp para unicidad
  return `${slug}-${Date.now().toString(36)}`;
}
