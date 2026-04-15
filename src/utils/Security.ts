/**
 * Utilidad para manejar validaciones y seguridad de datos sensibles.
 */
export class Security {
    /**
     * Valida si un correo electrónico sigue un formato profesional.
     */
    public static isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Valida que la contraseña sea segura (mínimo 8 caracteres, letras y números).
     */
    public static isSecurePassword(password: string): boolean {
        return password.length >= 8 && /\d/.test(password) && /[a-zA-Z]/.test(password);
    }

    /**
     * Crea un hash simple para no guardar contraseñas en texto plano.
     * En un entorno real, esto se enviaría a un servidor para hashing con bcrypt.
     */
    public static hashPassword(password: string): string {
        return btoa(`novabeat_salt_${password}`);
    }

    /**
     * Genera un token único para la sesión.
     */
    public static generateToken(): string {
        return crypto.randomUUID();
    }
}