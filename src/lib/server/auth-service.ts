/**
 * AuthService — abstracción de autenticación de usuarios.
 *
 * El resto del código solo usa esta interfaz.
 * Para migrar a otro proveedor (Supabase, propio microservicio, etc.)
 * solo se cambia la implementación en este archivo.
 */

export interface AuthUser {
  uid: string;
  email: string;
}

export interface AuthServiceError {
  code: 'EMAIL_EXISTS' | 'WEAK_PASSWORD' | 'UNKNOWN';
  message: string;
}

export class AuthServiceException extends Error {
  code: AuthServiceError['code'];
  constructor(error: AuthServiceError) {
    super(error.message);
    this.code = error.code;
  }
}

// ─── Implementación activa: Firebase Auth REST API ───────────────────────────
// No usa el Admin SDK para evitar problemas de IAM en Google Cloud.
// Para cambiar de proveedor: reemplaza esta función manteniendo la misma firma.

async function firebaseCreateUser(email: string, password: string): Promise<AuthUser> {
  const apiKey = process.env.CENTRAL_FIREBASE_API_KEY;
  if (!apiKey) {
    throw new AuthServiceException({ code: 'UNKNOWN', message: 'CENTRAL_FIREBASE_API_KEY no configurado en el servidor' });
  }

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: false }),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    const msg: string = data?.error?.message || 'UNKNOWN';
    if (msg === 'EMAIL_EXISTS') {
      throw new AuthServiceException({ code: 'EMAIL_EXISTS', message: 'Ya existe una cuenta con este email.' });
    }
    if (msg.includes('WEAK_PASSWORD')) {
      throw new AuthServiceException({ code: 'WEAK_PASSWORD', message: 'La contraseña debe tener al menos 6 caracteres.' });
    }
    throw new AuthServiceException({ code: 'UNKNOWN', message: msg });
  }

  return { uid: data.localId, email };
}

// ─── API pública ─────────────────────────────────────────────────────────────

export const AuthService = {
  /**
   * Crea un nuevo usuario con email y contraseña.
   * Lanza AuthServiceException en caso de error.
   */
  createUser: (email: string, password: string): Promise<AuthUser> =>
    firebaseCreateUser(email, password),
};
