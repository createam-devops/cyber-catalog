import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { centralApp, centralDb } from './firebase';

export const auth = getAuth(centralApp);

export interface UserData {
  uid: string;
  email: string;
  tenantId: string;
  role: 'admin' | 'owner';
  displayName?: string;
  /** Con qué entró: su cuenta del catálogo (Firebase) o su usuario de CyberPOS. */
  provider?: 'firebase' | 'erp';
}

/** Usuario que entró con CyberPOS (sesión en cookie del servidor), o null. */
export const getErpSessionUser = async (): Promise<UserData | null> => {
  try {
    const res = await fetch('/api/auth/erp/session', { credentials: 'include', cache: 'no-store' });
    if (!res.ok) return null;
    const data = (await res.json()) as { user?: UserData | null };
    return data.user ?? null;
  } catch {
    return null;
  }
};

export const loginWithEmail = async (email: string, password: string): Promise<UserData> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Obtener datos adicionales del usuario desde Firestore
    const userDoc = await getDoc(doc(centralDb, 'users', user.uid));
    
    if (!userDoc.exists()) {
      throw new Error('Usuario no encontrado en la base de datos');
    }
    
    const userData = userDoc.data() as UserData;
    
    if (!userData.tenantId) {
      throw new Error('Usuario no está asociado a ningún tenant');
    }
    
    return {
      uid: user.uid,
      email: user.email || email,
      tenantId: userData.tenantId,
      role: userData.role || 'admin',
      displayName: userData.displayName || user.displayName || undefined,
    };
  } catch (error: any) {
    console.error('Error en login:', error);
    throw new Error(error.message || 'Error al iniciar sesión');
  }
};

export const logout = async () => {
  try {
    await Promise.all([
      fetch('/api/auth/session', { method: 'DELETE', credentials: 'include' }),
      fetch('/api/auth/erp/session', { method: 'DELETE', credentials: 'include' }),
    ]);

    await signOut(auth);
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    throw error;
  }
};

export const getCurrentUser = async (user: User): Promise<UserData | null> => {
  try {
    const userDoc = await getDoc(doc(centralDb, 'users', user.uid));
    
    if (!userDoc.exists()) {
      return null;
    }
    
    const userData = userDoc.data() as UserData;
    
    return {
      uid: user.uid,
      email: user.email || userData.email,
      tenantId: userData.tenantId,
      role: userData.role || 'admin',
      displayName: userData.displayName || user.displayName || undefined,
    };
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    return null;
  }
};

export const onAuthChange = (callback: (user: UserData | null) => void) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userData = await getCurrentUser(user);
      callback(userData);
    } else {
      callback(null);
    }
  });
};
