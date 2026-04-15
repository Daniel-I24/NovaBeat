/**
 * Preferencias de usuario persistidas en Firestore.
 */
export interface UserPreferences {
    theme: string;
    lastVolume: number;
    autoPlay: boolean;
}

/**
 * Perfil de usuario almacenado en Firestore (colección "users").
 * No contiene passwordHash — Firebase Auth gestiona las credenciales.
 */
export interface UserProfile {
    uid: string;
    fullName: string;
    email: string;
    photoURL: string | null;
    provider: "email" | "google";
    createdAt: number;
    preferences: UserPreferences;
}

/**
 * Sesión activa del usuario en memoria (no persiste en localStorage).
 * Firebase Auth maneja la persistencia de sesión internamente.
 */
export interface AuthSession {
    uid: string;
    fullName: string;
    email: string;
    photoURL: string | null;
    provider: "email" | "google";
}
