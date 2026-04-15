import { User, AuthSession } from "../models/User.model";
import { Security } from "../utils/Security";

/**
 * Servicio encargado de la gestión de identidad y persistencia de sesión en NovaBeat.
 */
export class AuthService {
    private readonly STORAGE_KEY = "novabeat_session";
    private readonly DB_KEY = "novabeat_users_db";

    constructor() {}

    /**
     * Registra un nuevo usuario en el sistema.
     */
    public register(fullName: string, email: string, password: string): boolean {
        if (!Security.isValidEmail(email) || !Security.isSecurePassword(password)) {
            return false;
        }

        const users = this.getStoredUsers();
        if (users.find(u => u.email === email)) return false;

        const newUser: User = {
            id: crypto.randomUUID(),
            fullName,
            email,
            passwordHash: Security.hashPassword(password),
            createdAt: Date.now(),
            preferences: {
                theme: 'light',
                lastVolume: 0.5,
                autoPlay: false
            }
        };

        users.push(newUser);
        localStorage.setItem(this.DB_KEY, JSON.stringify(users));
        return this.login(email, password);
    }

    /**
     * Autentica al usuario y crea una sesión persistente.
     */
    public login(email: string, password: string): boolean {
        const users = this.getStoredUsers();
        const hashedPassword = Security.hashPassword(password);
        
        const user = users.find(u => u.email === email && u.passwordHash === hashedPassword);

        if (user) {
            const session: AuthSession = {
                token: Security.generateToken(),
                user: {
                    id: user.id,
                    fullName: user.fullName,
                    email: user.email,
                    createdAt: user.createdAt,
                    preferences: user.preferences
                }
            };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));
            return true;
        }
        return false;
    }

    /**
     * Retorna la sesión actual si existe.
     */
    public getCurrentSession(): AuthSession | null {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : null;
    }

    /**
     * Finaliza la sesión actual.
     */
    public logout(): void {
        localStorage.removeItem(this.STORAGE_KEY);
    }

    private getStoredUsers(): User[] {
        const data = localStorage.getItem(this.DB_KEY);
        return data ? JSON.parse(data) : [];
    }
}