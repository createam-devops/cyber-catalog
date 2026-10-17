"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { UserData, getErpSessionUser, onAuthChange } from '@/lib/auth';

interface AuthContextType {
  user: UserData | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthChange(async (userData) => {
      // Sin sesión de Firebase, el dueño pudo haber entrado con CyberPOS.
      const current = userData ? { ...userData, provider: 'firebase' as const } : await getErpSessionUser();
      if (!active) return;
      setUser(current);
      setLoading(false);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
