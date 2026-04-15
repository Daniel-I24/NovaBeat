/**
 * Estructura de usuario para el sistema de autenticación de NovaBeat.
 */
export interface User {
    id: string;
    fullName: string;
    email: string;
    passwordHash: string; // Almacenado de forma segura, nunca en texto plano
    profilePicture?: string;
    preferences: UserPreferences;
    createdAt: number;    // Timestamp de registro
}

/**
 * Preferencias de usuario para persistir el estilo Soft Minimalist y la configuración.
 */
export interface UserPreferences {
    theme: 'light' | 'dark';
    lastVolume: number;
    autoPlay: boolean;
}

/**
 * Objeto que se guarda en la sesión activa del navegador.
 */
export interface AuthSession {
    token: string;
    user: Omit<User, 'passwordHash'>; // Excluimos el hash por seguridad en el frontend
}