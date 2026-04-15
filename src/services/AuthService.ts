import { User, AuthSession } from "../models/User.model";
import { Security } from "../utils/Security";

/** Claves de almacenamiento centralizadas para evitar strings dispersos */
const STORAGE_KEYS = {
    SESSION: "novabeat_session",
    USERS_DB: "novabeat_users_db",
} as const;

/** Preferencias por defecto para nuevos usuarios */
const DEFAULT_PREFERENCES: User["preferences"] = {
    theme: "light",
    lastVolume: 0.5,
    autoPlay: false,
};

/**
 * Servicio encargado de la gestión de identidad y persistencia de sesión.
 * Abstrae el acceso a localStorage para centralizar la lógica de almacenamiento.
 */
export class AuthService {
    /**
     * Registra un nuevo usuario en el sistema.
     * Retorna false si el email ya existe o los datos no son válidos.
     */
    public register(fullName: string, email: string, password: string): boolean {
        if (!Security.isValidEmail(email) || !Security.isSecurePassword(password)) {
            return false;
        }

        const users = this.getStoredUsers();
        const emailAlreadyExists = users.some((u) => u.email === email);
        if (emailAlreadyExists) return false;

        const newUser: User = {
            id: crypto.randomUUID(),
            fullName,
            email,
            passwordHash: Security.hashPassword(password),
            createdAt: Date.now(),
            preferences: { ...DEFAULT_PREFERENCES },
        };

        this.saveUsers([...users, newUser]);
        return this.login(email, password);
    }

    /**
     * Autentica al usuario y persiste la sesión en localStorage.
     * Retorna true si las credenciales son correctas.
     */
    public login(email: string, password: string): boolean {
        const users = this.getStoredUsers();
        const hashedPassword = Security.hashPassword(password);
        const user = users.find(
            (u) => u.email === email && u.passwordHash === hashedPassword
        );

        if (!user) return false;

        const session: AuthSession = {
            token: Security.generateToken(),
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                createdAt: user.createdAt,
                preferences: user.preferences,
            },
        };

        this.saveSession(session);
        return true;
    }

    /** Retorna la sesión activa o null si no existe. */
    public getCurrentSession(): AuthSession | null {
        const data = localStorage.getItem(STORAGE_KEYS.SESSION);
        return data ? (JSON.parse(data) as AuthSession) : null;
    }

    /** Elimina la sesión activa del almacenamiento. */
    public logout(): void {
        localStorage.removeItem(STORAGE_KEYS.SESSION);
    }

    // ─── Métodos privados de acceso al almacenamiento ───────────────────────

    private getStoredUsers(): User[] {
        const data = localStorage.getItem(STORAGE_KEYS.USERS_DB);
        return data ? (JSON.parse(data) as User[]) : [];
    }

    private saveUsers(users: User[]): void {
        localStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(users));
    }

    private saveSession(session: AuthSession): void {
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
    }
}
