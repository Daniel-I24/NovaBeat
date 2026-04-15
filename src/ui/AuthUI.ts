import { AuthService } from "../services/AuthService";

/** Nombre del evento global que indica autenticación exitosa */
const AUTH_SUCCESS_EVENT = "auth-success";

/** Mensajes de error centralizados */
const ERROR_MESSAGES = {
    LOGIN_FAILED: "Credenciales incorrectas o usuario no encontrado.",
    REGISTER_FAILED: "Registro fallido. El correo ya existe o la contraseña es débil (mínimo 8 caracteres con letras y números).",
    CONTAINER_NOT_FOUND: "NovaBeat Error: Contenedor de autenticación no encontrado en el DOM.",
} as const;

/**
 * Gestiona la interfaz de usuario para la autenticación en NovaBeat.
 * Renderiza dinámicamente los formularios de Login y Registro.
 */
export class AuthUI {
    private readonly authService: AuthService;
    private readonly container: HTMLElement;

    constructor(authService: AuthService) {
        this.authService = authService;

        const target = document.getElementById("auth-form-container");
        if (!target) throw new Error(ERROR_MESSAGES.CONTAINER_NOT_FOUND);
        this.container = target;

        this.renderLogin();
    }

    /** Renderiza el formulario de inicio de sesión. */
    public renderLogin(): void {
        this.container.innerHTML = `
            <div class="auth-form fade-in">
                <input type="email" id="login-email" placeholder="Email" class="soft-input" spellcheck="false" autocomplete="email">
                <input type="password" id="login-pass" placeholder="Password" class="soft-input" autocomplete="current-password">
                <button id="btn-login" class="soft-button">Login</button>
                <p class="toggle-text">¿No tienes cuenta? <span id="go-to-register" style="cursor:pointer;text-decoration:underline;">Regístrate</span></p>
                <p id="auth-error" class="auth-error" style="color:red;font-size:0.85rem;min-height:1.2em;"></p>
            </div>
        `;
        this.attachLoginEvents();
    }

    /** Renderiza el formulario de registro. */
    public renderRegister(): void {
        this.container.innerHTML = `
            <div class="auth-form fade-in">
                <input type="text" id="reg-name" placeholder="Full Name" class="soft-input" spellcheck="false" autocomplete="name">
                <input type="email" id="reg-email" placeholder="Email Address" class="soft-input" spellcheck="false" autocomplete="email">
                <input type="password" id="reg-pass" placeholder="Password (8+ chars, letters & numbers)" class="soft-input" autocomplete="new-password">
                <button id="btn-register" class="soft-button">Create Account</button>
                <p class="toggle-text">¿Ya tienes cuenta? <span id="go-to-login" style="cursor:pointer;text-decoration:underline;">Inicia sesión</span></p>
                <p id="auth-error" class="auth-error" style="color:red;font-size:0.85rem;min-height:1.2em;"></p>
            </div>
        `;
        this.attachRegisterEvents();
    }

    // ─── Eventos ─────────────────────────────────────────────────────────────

    private attachLoginEvents(): void {
        document.getElementById("btn-login")?.addEventListener("click", () => {
            const email = this.getInputValue("login-email");
            const pass = this.getInputValue("login-pass");

            if (this.authService.login(email, pass)) {
                this.notifySuccess();
            } else {
                this.showError(ERROR_MESSAGES.LOGIN_FAILED);
            }
        });

        document.getElementById("go-to-register")?.addEventListener("click", () => {
            this.renderRegister();
        });
    }

    private attachRegisterEvents(): void {
        document.getElementById("btn-register")?.addEventListener("click", () => {
            const name = this.getInputValue("reg-name");
            const email = this.getInputValue("reg-email");
            const pass = this.getInputValue("reg-pass");

            if (this.authService.register(name, email, pass)) {
                this.notifySuccess();
            } else {
                this.showError(ERROR_MESSAGES.REGISTER_FAILED);
            }
        });

        document.getElementById("go-to-login")?.addEventListener("click", () => {
            this.renderLogin();
        });
    }

    // ─── Helpers privados ────────────────────────────────────────────────────

    /** Obtiene el valor de un input del DOM de forma segura. */
    private getInputValue(id: string): string {
        return (document.getElementById(id) as HTMLInputElement)?.value?.trim() ?? "";
    }

    /** Muestra un mensaje de error inline sin bloquear la UI con alert(). */
    private showError(message: string): void {
        const errorEl = document.getElementById("auth-error");
        if (errorEl) errorEl.textContent = message;
    }

    /** Dispara el evento global que indica que la autenticación fue exitosa. */
    private notifySuccess(): void {
        window.dispatchEvent(new CustomEvent(AUTH_SUCCESS_EVENT));
    }
}
