import { PlaybackQueue } from "./assets/core/PlaybackQueue";
import { Track } from "./models/Track.model";
import { AuthService } from "./services/AuthService";
import { AudioService } from "./services/AudioService";
import { ThemeService } from "./services/ThemeService";
import { AuthUI } from "./ui/AuthUI";
import { PlayerUI } from "./ui/PlayerUI";
import { Visualizer } from "./ui/Visualizer";
import { QueueUI } from "./ui/QueueUI";
import { INITIAL_TRACKS } from "./utils/MockData";

/** Nombre del evento global que dispara AuthUI al autenticarse correctamente */
const AUTH_SUCCESS_EVENT = "auth-success";

/**
 * Clase principal de NovaBeat.
 * Orquesta la inicialización de servicios y la transición entre pantallas.
 */
class NovaBeatApp {
    private readonly themeService: ThemeService;
    private readonly authService: AuthService;
    private readonly playbackQueue: PlaybackQueue<Track>;
    private readonly audioService: AudioService;
    private readonly authUI: AuthUI;

    private playerUI: PlayerUI | null = null;
    private visualizer: Visualizer | null = null;
    private queueUI: QueueUI | null = null;

    constructor() {
        this.themeService = new ThemeService();
        this.authService = new AuthService();
        this.playbackQueue = new PlaybackQueue<Track>();
        this.audioService = new AudioService(this.playbackQueue);

        this.loadInitialData();

        // AuthUI ya no necesita ThemeService — los estilos los gestiona ThemeService directamente
        this.authUI = new AuthUI(this.authService);

        this.checkSession();
        this.handleGlobalEvents();
    }

    /** Llena la cola con los datos de prueba al arrancar. */
    private loadInitialData(): void {
        INITIAL_TRACKS.forEach((track: Track) => {
            this.playbackQueue.addToEnd(track);
        });
    }

    /** Si ya existe una sesión activa, salta directamente al reproductor. */
    private checkSession(): void {
        if (this.authService.getCurrentSession()) {
            this.startAppExperience();
        }
    }

    /**
     * Activa todos los sistemas visuales y de audio.
     * Se llama tras un login exitoso o si ya había sesión persistida.
     */
    public startAppExperience(): void {
        document.getElementById("auth-screen")?.classList.add("hidden");
        document.getElementById("player-screen")?.classList.remove("hidden");

        this.playerUI = new PlayerUI(this.audioService, this.playbackQueue);

        // QueueUI recibe un callback para refrescar PlayerUI tras cada reordenamiento
        this.queueUI = new QueueUI(this.playbackQueue, () => {
            this.playerUI?.renderQueue();
        });

        const canvas = document.getElementById("visualizer-canvas") as HTMLCanvasElement | null;
        if (canvas) {
            this.visualizer = new Visualizer(canvas, this.audioService);
            this.visualizer.start();
        }
    }

    /** Registra los eventos globales de la aplicación. */
    private handleGlobalEvents(): void {
        document.getElementById("logout-btn")?.addEventListener("click", () => {
            this.authService.logout();
            this.visualizer?.stop();
            window.location.reload();
        });

        window.addEventListener(AUTH_SUCCESS_EVENT, () => {
            this.startAppExperience();
        });
    }
}

// Arranque seguro al cargar el DOM
document.addEventListener("DOMContentLoaded", () => {
    new NovaBeatApp();
});
