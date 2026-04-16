import { PlaybackQueue } from "./assets/core/PlaybackQueue";
import { Track } from "./models/Track.model";
import { FirebaseAuthService, AUTH_SUCCESS_EVENT, AUTH_LOGOUT_EVENT } from "./services/FirebaseAuthService";
import { AudioService } from "./services/AudioService";
import { ThemeService } from "./services/ThemeService";
import { MusicService } from "./services/MusicService";
import { LyricsService } from "./services/LyricsService";
import { AuthUI } from "./ui/AuthUI";
import { PlayerUI } from "./ui/PlayerUI";
import { Visualizer } from "./ui/Visualizer";
import { QueueUI } from "./ui/QueueUI";
import { UploadUI } from "./ui/UploadUI";
import { SearchUI } from "./ui/SearchUI";
import { LyricsUI } from "./ui/LyricsUI";

/**
 * Orquestador principal de NovaBeat.
 * Cada sesión de usuario tiene su propia cola de reproducción.
 */
class NovaBeatApp {
    // Servicios de larga vida (no dependen del usuario)
    private readonly themeService  = new ThemeService();
    private readonly authService   = new FirebaseAuthService();
    private readonly musicService  = new MusicService();
    private readonly lyricsService = new LyricsService();
    private readonly authUI        = new AuthUI(this.authService);

    // Estado de sesión activa
    private queue         = new PlaybackQueue<Track>();
    private audioService  = new AudioService(this.queue);
    private playerUI:   PlayerUI   | null = null;
    private visualizer: Visualizer | null = null;
    private appStarted = false;

    constructor() { this.handleGlobalEvents(); }

    public startAppExperience(): void {
        if (this.appStarted) return;
        this.appStarted = true;

        document.getElementById("auth-screen")?.classList.add("hidden");
        const screen = document.getElementById("player-screen");
        screen?.classList.remove("hidden");
        screen?.classList.add("fade-in");

        const canvas = document.getElementById("visualizer-canvas") as HTMLCanvasElement | null;
        if (canvas) this.visualizer = new Visualizer(canvas, this.audioService);

        const lyricsUI = new LyricsUI(this.lyricsService, this.audioService);

        this.playerUI = new PlayerUI(
            this.audioService, this.queue, this.themeService, this.visualizer, lyricsUI
        );

        new QueueUI(this.queue, () => this.playerUI?.renderQueue());
        new UploadUI(this.queue, () => {
            this.playerUI?.renderQueue();
            // Guardar historial cada vez que se agrega una canción
            void this.authService.saveTrackHistory(this.queue.toArray());
        });
        new SearchUI(this.musicService, this.queue, this.audioService, () => {
            this.playerUI?.renderQueue();
            void this.authService.saveTrackHistory(this.queue.toArray());
        });

        const session = this.authService.getCurrentSession();
        if (session) this.playerUI.setUserInfo(session);

        // Cargar tema guardado del usuario
        this.authService.getUserPreferences().then((p) => this.themeService.applyTheme(p.theme));

        // Cargar historial del usuario. Si está vacío, cargar trending de iTunes
        this.authService.getTrackHistory().then((saved) => {
            if (saved.length > 0) {
                // Deduplicar por ID antes de agregar a la cola
                const seen = new Set<string>();
                saved.forEach((t) => {
                    if (!seen.has(t.id)) {
                        seen.add(t.id);
                        this.queue.addToEnd(t);
                    }
                });
                this.playerUI?.renderQueue();
            } else {
                this.musicService.getTrending(10).then((tracks) => {
                    tracks.forEach((t) => this.queue.addToEnd(t));
                    this.playerUI?.renderQueue();
                }).catch(() => { /* cola vacía */ });
            }
        });
    }

    private resetApp(): void {
        this.appStarted = false;

        // Detener audio, cerrar panel de letras y limpiar estado
        this.audioService.stop();
        this.visualizer?.stop();
        this.visualizer = null;
        this.playerUI = null;

        // Cerrar panel de letras si está abierto
        document.getElementById("lyrics-panel")?.classList.remove("open");
        document.getElementById("lyrics-overlay")?.classList.add("hidden");

        // Resetear tema al default al cerrar sesión
        this.themeService.applyTheme("midnight-dark");

        // Nueva cola y audioService aislados para la próxima sesión
        this.queue = new PlaybackQueue<Track>();
        this.audioService = new AudioService(this.queue);

        document.getElementById("player-screen")?.classList.add("hidden");
        document.getElementById("auth-screen")?.classList.remove("hidden");
        this.authUI.renderLogin();
    }

    private handleGlobalEvents(): void {
        window.addEventListener(AUTH_SUCCESS_EVENT, () => this.startAppExperience());
        window.addEventListener(AUTH_LOGOUT_EVENT,  () => this.resetApp());

        document.addEventListener("click", (e) => {
            if ((e.target as HTMLElement).id !== "logout-btn") return;
            void (async () => {
                const s = this.authService.getCurrentSession();
                if (s) {
                    // Guardar preferencias e historial antes de cerrar sesión
                    await Promise.all([
                        this.authService.savePreferences({
                            theme: this.themeService.getCurrentTheme().id,
                            lastVolume: this.audioService.getState().volume,
                        }),
                        this.authService.saveTrackHistory(this.queue.toArray()),
                    ]);
                }
                await this.authService.logout();
            })();
        });
    }
}

document.addEventListener("DOMContentLoaded", () => { new NovaBeatApp(); });
