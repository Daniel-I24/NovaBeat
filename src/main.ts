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

/**
 * Clase Maestra NovaBeatApp.
 * Coordina la inicialización de servicios, seguridad y renderizado.
 */
class NovaBeatApp {
    private themeService: ThemeService;
    private authService: AuthService;
    private playbackQueue: PlaybackQueue<Track>;
    private audioService: AudioService;
    
    private authUI: AuthUI;
    private playerUI!: PlayerUI; // Se inicializa tras el login
    private visualizer: Visualizer | null = null;
    private queueUI: QueueUI | null = null;

    constructor() {
        // 1. Inicialización de Capas de Lógica y Estética
        this.themeService = new ThemeService();
        this.authService = new AuthService();
        this.playbackQueue = new PlaybackQueue<Track>();
        this.audioService = new AudioService(this.playbackQueue);

        // 2. Carga Inicial de la Estructura de Datos
        this.loadInitialData();

        // 3. Inicialización de la Interfaz de Autenticación
        this.authUI = new AuthUI(this.authService, this.themeService);

        // 4. Verificación de Seguridad para el flujo de entrada
        this.checkSession();
        this.handleGlobalEvents();
    }

    /**
     * Llena la lista doblemente enlazada con los datos de prueba.
     */
    private loadInitialData(): void {
        INITIAL_TRACKS.forEach((track: Track) => {
            this.playbackQueue.addToEnd(track);
        });
        console.log(`NovaBeat: ${this.playbackQueue.getQueueSize()} pistas cargadas.`);
    }

    /**
     * Valida si el usuario puede entrar directamente al reproductor.
     */
    private checkSession(): void {
        if (this.authService.getCurrentSession()) {
            this.startAppExperience();
        }
    }

    /**
     * Activa todos los sistemas visuales y de audio de NovaBeat.
     * Se llama después de un Login exitoso o si ya había una sesión.
     */
    public startAppExperience(): void {
        // Transición visual de pantallas
        document.getElementById('auth-screen')?.classList.add('hidden');
        document.getElementById('player-screen')?.classList.remove('hidden');

        // Inicializar Controladores de UI
        this.playerUI = new PlayerUI(this.audioService, this.playbackQueue);
        this.queueUI = new QueueUI(this.playbackQueue);

        // Inicializar Visualizador de Ondas
        const canvas = document.getElementById('visualizer-canvas') as HTMLCanvasElement;
        if (canvas) {
            this.visualizer = new Visualizer(canvas, this.audioService);
            this.visualizer.start();
        }

        // Renderizado inicial de la cola
        this.playerUI.renderQueue();
    }

    /**
     * Maneja eventos globales que no pertenecen a un componente específico.
     */
    private handleGlobalEvents(): void {
        document.getElementById('logout-btn')?.addEventListener('click', () => {
            this.authService.logout();
            window.location.reload();
        });

        // Evento personalizado para detectar login exitoso desde AuthUI
        window.addEventListener('auth-success', () => {
            this.startAppExperience();
        });
    }
}

// Inicialización segura al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
    (window as any).NovaBeat = new NovaBeatApp();
});