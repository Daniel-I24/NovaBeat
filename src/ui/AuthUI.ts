import { FirebaseAuthService, AUTH_SUCCESS_EVENT } from "../services/FirebaseAuthService";

const ERROR_MESSAGES = {
    EMPTY_FIELDS: "Por favor completa todos los campos.",
    CONTAINER_NOT_FOUND: "NovaBeat: Contenedor de autenticación no encontrado.",
} as const;

/**
 * Interfaz de autenticación de NovaBeat.
 * Gestiona los formularios de Login, Registro y Login con Google.
 */
export class AuthUI {
    private readonly authService: FirebaseAuthService;
    private readonly container: HTMLElement;

    constructor(authService: FirebaseAuthService) {
        this.authService = authService;
        const target = document.getElementById("auth-form-container");
        if (!target) throw new Error(ERROR_MESSAGES.CONTAINER_NOT_FOUND);
        this.container = target;
        this.renderLogin();
    }

    // ─── Renderizado ──────────────────────────────────────────────────────────

    public renderLogin(): void {
        this.container.innerHTML = `
            <div class="auth-form fade-in">
                <button class="google-button" id="btn-google">
                    <svg width="18" height="18" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    </svg>
                    Continuar con Google
                </button>

                <div class="auth-divider">o</div>

                <input type="email" id="login-email" placeholder="Correo electrónico" class="soft-input" autocomplete="email">
                <input type="password" id="login-pass" placeholder="Contraseña" class="soft-input" autocomplete="current-password">
                <button class="soft-button" id="btn-login">Iniciar sesión</button>

                <p id="auth-error" class="auth-error"></p>

                <p class="auth-toggle">
                    ¿No tienes cuenta? <span id="go-to-register">Regístrate gratis</span>
                </p>
            </div>
        `;
        this.attachLoginEvents();
    }

    public renderRegister(): void {
        this.container.innerHTML = `
            <div class="auth-form fade-in">
                <button class="google-button" id="btn-google">
                    <svg width="18" height="18" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    </svg>
                    Registrarse con Google
                </button>

                <div class="auth-divider">o</div>

                <input type="text" id="reg-name" placeholder="Nombre completo" class="soft-input" autocomplete="name">
                <input type="email" id="reg-email" placeholder="Correo electrónico" class="soft-input" autocomplete="email">
                <input type="password" id="reg-pass" placeholder="Contraseña (mín. 6 caracteres)" class="soft-input" autocomplete="new-password">
                <button class="soft-button" id="btn-register">Crear cuenta</button>

                <p id="auth-error" class="auth-error"></p>

                <p class="auth-toggle">
                    ¿Ya tienes cuenta? <span id="go-to-login">Inicia sesión</span>
                </p>
            </div>
        `;
        this.attachRegisterEvents();
    }

    // ─── Eventos ──────────────────────────────────────────────────────────────

    private attachLoginEvents(): void {
        document.getElementById("btn-google")?.addEventListener("click", () => {
            this.handleAsync(() => this.authService.loginWithGoogle());
        });

        document.getElementById("btn-login")?.addEventListener("click", () => {
            const email = this.getValue("login-email");
            const pass = this.getValue("login-pass");
            if (!email || !pass) return this.showError(ERROR_MESSAGES.EMPTY_FIELDS);
            this.handleAsync(() => this.authService.loginWithEmail(email, pass));
        });

        document.getElementById("go-to-register")?.addEventListener("click", () => {
            this.renderRegister();
        });
    }

    private attachRegisterEvents(): void {
        document.getElementById("btn-google")?.addEventListener("click", () => {
            this.handleAsync(() => this.authService.loginWithGoogle());
        });

        document.getElementById("btn-register")?.addEventListener("click", () => {
            const name = this.getValue("reg-name");
            const email = this.getValue("reg-email");
            const pass = this.getValue("reg-pass");
            if (!name || !email || !pass) return this.showError(ERROR_MESSAGES.EMPTY_FIELDS);
            this.handleAsync(() => this.authService.registerWithEmail(name, email, pass));
        });

        document.getElementById("go-to-login")?.addEventListener("click", () => {
            this.renderLogin();
        });
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private async handleAsync(action: () => Promise<void>): Promise<void> {
        this.clearError();
        try {
            await action();
            // onAuthStateChanged en FirebaseAuthService dispara AUTH_SUCCESS_EVENT
        } catch (err: unknown) {
            const code = (err as { code?: string }).code ?? "";
            this.showError(this.authService.getErrorMessage(code));
        }
    }

    private getValue(id: string): string {
        return (document.getElementById(id) as HTMLInputElement)?.value?.trim() ?? "";
    }

    private showError(message: string): void {
        const el = document.getElementById("auth-error");
        if (el) el.textContent = message;
    }

    private clearError(): void {
        const el = document.getElementById("auth-error");
        if (el) el.textContent = "";
    }
}
