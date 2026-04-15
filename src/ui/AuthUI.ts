import { AuthService } from "../services/AuthService";
import { ThemeService } from "../services/ThemeService";

/**
 * Gestiona la interfaz de usuario para la autenticación en NovaBeat.
 * Crea dinámicamente los formularios siguiendo el estilo Soft Minimalist.
 */
export class AuthUI {
    private authService: AuthService;
    private themeService: ThemeService;
    private container: HTMLElement;

    constructor(authService: AuthService, themeService: ThemeService) {
        this.authService = authService;
        this.themeService = themeService;
        
        const target = document.getElementById('auth-form-container');
        if (!target) {
            throw new Error("NovaBeat Error: Contenedor de autenticación no encontrado.");
        }
        this.container = target;
        
        // Iniciamos mostrando el login por defecto
        this.renderLogin();
    }

    /**
     * Renderiza el formulario de inicio de sesión.
     */
    public renderLogin(): void {
        this.container.innerHTML = `
            <div class="auth-form fade-in">
                <input type="email" id="login-email" placeholder="Email" class="soft-input" spellcheck="false">
                <input type="password" id="login-pass" placeholder="Password" class="soft-input">
                <button id="btn-login" class="soft-button">Login</button>
                <p class="toggle-text">¿No tienes cuenta? <span id="go-to-register">Regístrate</span></p>
            </div>
        `;
        this.attachLoginEvents();
    }

    /**
     * Renderiza el formulario de registro.
     */
    public renderRegister(): void {
        this.container.innerHTML = `
            <div class="auth-form fade-in">
                <input type="text" id="reg-name" placeholder="Full Name" class="soft-input" spellcheck="false">
                <input type="email" id="reg-email" placeholder="Email Address" class="soft-input" spellcheck="false">
                <input type="password" id="reg-pass" placeholder="Secure Password (8+ chars)" class="soft-input">
                <button id="btn-register" class="soft-button">Create Account</button>
                <p class="toggle-text">¿Ya tienes cuenta? <span id="go-to-login">Inicia sesión</span></p>
            </div>
        `;
        this.attachRegisterEvents();
    }

    /**
     * Gestiona los eventos del formulario de Login.
     */
    private attachLoginEvents(): void {
        const loginBtn = document.getElementById('btn-login');
        const toggleLink = document.getElementById('go-to-register');

        loginBtn?.addEventListener('click', () => {
            const email = (document.getElementById('login-email') as HTMLInputElement).value;
            const pass = (document.getElementById('login-pass') as HTMLInputElement).value;
            
            if (this.authService.login(email, pass)) {
                this.notifySuccess();
            } else {
                this.showError("Credenciales incorrectas o usuario no encontrado.");
            }
        });

        toggleLink?.addEventListener('click', () => this.renderRegister());
    }

    /**
     * Gestiona los eventos del formulario de Registro.
     */
    private attachRegisterEvents(): void {
        const regBtn = document.getElementById('btn-register');
        const toggleLink = document.getElementById('go-to-login');

        regBtn?.addEventListener('click', () => {
            const name = (document.getElementById('reg-name') as HTMLInputElement).value;
            const email = (document.getElementById('reg-email') as HTMLInputElement).value;
            const pass = (document.getElementById('reg-pass') as HTMLInputElement).value;

            // La validación se delega al AuthService que ya creamos
            if (this.authService.register(name, email, pass)) {
                this.notifySuccess();
            } else {
                this.showError("Registro fallido. El correo ya existe o la contraseña es débil.");
            }
        });

        toggleLink?.addEventListener('click', () => this.renderLogin());
    }

    /**
     * Centraliza el manejo de errores visuales.
     */
    private showError(message: string): void {
        // Podrías mejorar esto inyectando un div de error en el DOM
        alert(message); 
    }

    /**
     * Oculta la pantalla de auth y dispara el evento global para iniciar la app.
     */
    private notifySuccess(): void {
        // Ocultamos la pantalla de autenticación
        document.getElementById('auth-screen')?.classList.add('hidden');
        
        // Notificamos al main.ts que todo está listo para activar el reproductor
        window.dispatchEvent(new CustomEvent('auth-success'));
        
        console.log("NovaBeat: Autenticación exitosa. Iniciando entorno musical...");
    }
}