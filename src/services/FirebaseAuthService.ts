import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged,
    updateProfile,
    User as FirebaseUser,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../config/firebase.config";
import { AuthSession, UserProfile, UserPreferences } from "../models/User.model";

/** Nombre del evento global que indica cambio en el estado de autenticación */
export const AUTH_STATE_CHANGED_EVENT = "auth-state-changed";
export const AUTH_SUCCESS_EVENT = "auth-success";
export const AUTH_LOGOUT_EVENT = "auth-logout";

const DEFAULT_PREFERENCES: UserPreferences = {
    theme: "midnight-dark",
    lastVolume: 0.7,
    autoPlay: false,
};

const ERROR_MESSAGES: Record<string, string> = {
    "auth/email-already-in-use": "Este correo ya está registrado.",
    "auth/invalid-email": "El formato del correo no es válido.",
    "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
    "auth/user-not-found": "No existe una cuenta con este correo.",
    "auth/wrong-password": "Contraseña incorrecta.",
    "auth/invalid-credential": "Credenciales incorrectas. Verifica tu correo y contraseña.",
    "auth/popup-closed-by-user": "Inicio de sesión cancelado.",
    "auth/network-request-failed": "Error de red. Verifica tu conexión.",
};

/**
 * Servicio de autenticación respaldado por Firebase Auth y Firestore.
 * Gestiona registro, login con email/contraseña y login con Google.
 */
export class FirebaseAuthService {
    private readonly googleProvider: GoogleAuthProvider;
    private currentSession: AuthSession | null = null;

    constructor() {
        this.googleProvider = new GoogleAuthProvider();
        this.googleProvider.setCustomParameters({ prompt: "select_account" });
        this.listenToAuthState();
    }

    // ─── Autenticación ────────────────────────────────────────────────────────

    /**
     * Registra un nuevo usuario con email y contraseña.
     * Crea su perfil en Firestore automáticamente.
     */
    public async registerWithEmail(
        fullName: string,
        email: string,
        password: string
    ): Promise<void> {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(credential.user, { displayName: fullName });
        await this.createUserProfile(credential.user, fullName, "email");
    }

    /**
     * Inicia sesión con email y contraseña.
     */
    public async loginWithEmail(email: string, password: string): Promise<void> {
        await signInWithEmailAndPassword(auth, email, password);
    }

    /**
     * Inicia sesión con Google mediante popup.
     * Si el usuario es nuevo, crea su perfil en Firestore.
     */
    public async loginWithGoogle(): Promise<void> {
        const result = await signInWithPopup(auth, this.googleProvider);
        const isNewUser = result.user.metadata.creationTime === result.user.metadata.lastSignInTime;
        if (isNewUser) {
            await this.createUserProfile(
                result.user,
                result.user.displayName ?? "Usuario",
                "google"
            );
        }
    }

    /**
     * Cierra la sesión actual.
     */
    public async logout(): Promise<void> {
        await signOut(auth);
    }

    // ─── Estado de sesión ─────────────────────────────────────────────────────

    public getCurrentSession(): AuthSession | null {
        return this.currentSession;
    }

    public isAuthenticated(): boolean {
        return this.currentSession !== null;
    }

    /**
     * Traduce los códigos de error de Firebase a mensajes legibles.
     */
    public getErrorMessage(code: string): string {
        return ERROR_MESSAGES[code] ?? "Ocurrió un error inesperado. Intenta de nuevo.";
    }

    // ─── Firestore ────────────────────────────────────────────────────────────

    /**
     * Crea el documento del usuario en Firestore si no existe.
     */
    private async createUserProfile(
        user: FirebaseUser,
        fullName: string,
        provider: "email" | "google"
    ): Promise<void> {
        const ref = doc(db, "users", user.uid);
        const existing = await getDoc(ref);
        if (existing.exists()) return;

        const profile = {
            fullName,
            email: user.email ?? "",
            photoURL: user.photoURL,
            provider,
            createdAt: serverTimestamp(),
            preferences: { ...DEFAULT_PREFERENCES },
        };

        await setDoc(ref, profile);
    }

    /**
     * Obtiene las preferencias del usuario desde Firestore.
     */
    public async getUserPreferences(): Promise<UserPreferences> {
        if (!this.currentSession) return { ...DEFAULT_PREFERENCES };
        const ref = doc(db, "users", this.currentSession.uid);
        const snap = await getDoc(ref);
        if (!snap.exists()) return { ...DEFAULT_PREFERENCES };
        const data = snap.data() as UserProfile;
        return data.preferences ?? { ...DEFAULT_PREFERENCES };
    }

    /**
     * Actualiza las preferencias del usuario en Firestore.
     */
    public async savePreferences(prefs: Partial<UserPreferences>): Promise<void> {
        if (!this.currentSession) return;
        const ref = doc(db, "users", this.currentSession.uid);
        await setDoc(ref, { preferences: prefs }, { merge: true });
    }

    // ─── Listener de estado ───────────────────────────────────────────────────

    /**
     * Escucha cambios en el estado de autenticación de Firebase.
     * Dispara eventos globales para que la UI reaccione.
     */
    private listenToAuthState(): void {
        let initialized = false;

        onAuthStateChanged(auth, (user) => {
            if (user) {
                this.currentSession = {
                    uid: user.uid,
                    fullName: user.displayName ?? "Usuario",
                    email: user.email ?? "",
                    photoURL: user.photoURL,
                    provider: user.providerData[0]?.providerId === "google.com" ? "google" : "email",
                };
                window.dispatchEvent(new CustomEvent(AUTH_SUCCESS_EVENT));
            } else {
                this.currentSession = null;
                // Solo disparar logout si ya estaba inicializado (no al cargar la página)
                if (initialized) {
                    window.dispatchEvent(new CustomEvent(AUTH_LOGOUT_EVENT));
                }
            }
            initialized = true;
        });
    }
}
