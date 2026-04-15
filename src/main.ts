import { PlaybackQueue } from "./assets/core/PlaybackQueue";
import { Track } from "./models/Track.model";
import { FirebaseAuthService, AUTH_SUCCESS_EVENT, AUTH_LOGOUT_EVENT } from "./services/FirebaseAuthService";
import { AudioService } from "./services/AudioService";
import { ThemeService } from "./services/ThemeService";
import { JamendoService } from "./services/JamendoService";
import { AuthUI } from "./ui/AuthUI";
import { PlayerUI } from "./ui/PlayerUI";
import { Visualizer } from "./ui/Visualizer";
import { QueueUI } from "./ui/QueueUI";
import { UploadUI } from "./ui/UploadUI";
import { SearchUI } from "./ui/SearchUI";
import { INITIAL_TRACKS } from "./utils/MockData";

/**
 * Clase principal de NovaBeat.
 * Orquesta servicios, autenticación y transición entre pantallas.
 */
class NovaBeatApp {
    private readonly themeService: ThemeService;
    private readonly authService: FirebaseAuthService;
    private readonly playbackQueue: PlaybackQueue<Track>;
    private readonly audioService: AudioService;
    private readonly jamendoService: JamendoService;
    private readonly authUI: AuthUI;

    private playerUI: PlayerUI | null = null;
    private visualizer: Visualizer | null = null;
    private queueUI: QueueUI | null = null;
    private uploadUI: UploadUI | null = null;
    private searchUI: SearchUI | null = null;
    private appStarted = false;

    constructor() {
        this.themeService = new ThemeService();
        this.authService = new FirebaseAuthService();
        this.playbackQueue = new PlaybackQueue<Track>();
        this.audioService = new AudioService(this.playbackQueue);
        this.jamendoService = new JamendoService();

        this.loadInitialData();
        this.authUI = new AuthUI(this.authService);
        this.handleGlobalEvents();
    }

    /** Carga el catálogo inicial en la lista doblemente enlazada. */
    private loadInitialData(): void {
        INITIAL_TRACKS.forEach((track: Track) => {
            this.playbackQueue.addToEnd(track);
        });
    }

    /**
     * Activa el reproductor tras autenticación exitosa.
     * El flag appStarted evita inicializar dos veces si Firebase
     * dispara onAuthStateChanged al recargar con sesión activa.
     */
    public startAppExperience(): void {
        if (this.appStarted) return;
        this.appStarted = true;

        document.getElementById("auth-screen")?.classList.add("hidden");
        const playerScreen = document.getElementById("player-screen");
        if (playerScreen) {
            playerScreen.classList.remove("hidden");
            playerScreen.classList.add("fade-in");
        }

        const canvas = document.getElementById("visualizer-canvas") as HTMLCanvasElement | null;
        if (canvas) {
            this.visualizer = new Visualizer(canvas, this.audioService);
            // No llamamos start() aquí — se inicia en el primer clic de play
        }

        this.playerUI = new PlayerUI(this.audioService, this.playbackQueue, this.themeService, this.visualizer);

        this.queueUI = new QueueUI(this.playbackQueue, () => {
            this.playerUI?.renderQueue();
        });

        this.uploadUI = new UploadUI(this.playbackQueue, () => {
            this.playerUI?.renderQueue();
        });

        this.searchUI = new SearchUI(
            this.jamendoService,
            this.playbackQueue,
            this.audioService,
            () => this.playerUI?.renderQueue()
        );

        // Mostrar info del usuario en el header
        const session = this.authService.getCurrentSession();
        if (session) {
            this.playerUI.setUserInfo(session);
        }

        // Cargar preferencias de tema del usuario
        this.authService.getUserPreferences().then((prefs) => {
            this.themeService.applyTheme(prefs.theme);
        });
    }

    /** Resetea el estado de la app al hacer logout. */
    private resetApp(): void {
        this.appStarted = false;
        this.playerUI = null;
        this.visualizer?.stop();
        this.visualizer = null;
        this.queueUI = null;
        this.uploadUI = null;
        this.searchUI = null;

        const playerScreen = document.getElementById("player-screen");
        const authScreen = document.getElementById("auth-screen");

        if (playerScreen) playerScreen.classList.add("hidden");
        if (authScreen) authScreen.classList.remove("hidden");

        this.authUI.renderLogin();
    }

    private handleGlobalEvents(): void {
        window.addEventListener(AUTH_SUCCESS_EVENT, () => {
            this.startAppExperience();
        });

        window.addEventListener(AUTH_LOGOUT_EVENT, () => {
            this.resetApp();
        });

        // Delegación de eventos sobre document para capturar el botón
        // aunque esté dentro de un elemento oculto al momento de registrar
        document.addEventListener("click", (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.id !== "logout-btn") return;

            // Guardamos preferencias y hacemos logout de forma asíncrona
            void (async () => {
                const session = this.authService.getCurrentSession();
                if (session) {
                    await this.authService.savePreferences({
                        theme: this.themeService.getCurrentTheme().id,
                        lastVolume: this.audioService.getState().volume,
                    });
                }
                await this.authService.logout();
                // resetApp() se dispara automáticamente via AUTH_LOGOUT_EVENT
            })();
        });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    new NovaBeatApp();
});
