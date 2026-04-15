import { AudioService } from "../services/AudioService";
import { PlaybackQueue } from "../assets/core/PlaybackQueue";
import { Track } from "../models/Track.model";
import { ThemeService } from "../services/ThemeService";
import { AuthSession } from "../models/User.model";
import { Visualizer } from "./Visualizer";

/**
 * Controlador principal de la interfaz del reproductor NovaBeat.
 */
export class PlayerUI {
    private readonly audioService: AudioService;
    private readonly queue: PlaybackQueue<Track>;
    private readonly themeService: ThemeService;
    private readonly visualizer: Visualizer | null;

    private readonly playBtn: HTMLButtonElement;
    private readonly progressBar: HTMLInputElement;
    private readonly volumeBar: HTMLInputElement;
    private readonly trackTitle: HTMLElement;
    private readonly trackArtist: HTMLElement;
    private readonly trackCover: HTMLImageElement;
    private readonly queueList: HTMLElement;
    private readonly currentTimeEl: HTMLElement;
    private readonly totalDurationEl: HTMLElement;

    constructor(audioService: AudioService, queue: PlaybackQueue<Track>, themeService: ThemeService, visualizer: Visualizer | null = null) {
        this.audioService = audioService;
        this.queue = queue;
        this.themeService = themeService;
        this.visualizer = visualizer;

        this.playBtn          = this.requireElement<HTMLButtonElement>("play-pause-btn");
        this.progressBar      = this.requireElement<HTMLInputElement>("progress-bar");
        this.volumeBar        = this.requireElement<HTMLInputElement>("volume-bar");
        this.trackTitle       = this.requireElement<HTMLElement>("current-title");
        this.trackArtist      = this.requireElement<HTMLElement>("current-artist");
        this.trackCover       = this.requireElement<HTMLImageElement>("current-cover");
        this.queueList        = this.requireElement<HTMLElement>("playback-queue-list");
        this.currentTimeEl    = this.requireElement<HTMLElement>("current-time");
        this.totalDurationEl  = this.requireElement<HTMLElement>("total-duration");

        this.initializeEvents();
        this.startUIUpdater();
        this.renderQueue();
        this.setupThemePicker();
    }

    /** Actualiza el saludo del header con los datos del usuario. */
    public setUserInfo(session: AuthSession): void {
        const greetingEl = document.getElementById("user-greeting");
        const avatarEl = document.getElementById("user-avatar") as HTMLImageElement | null;

        if (greetingEl) greetingEl.textContent = `Hola, ${session.fullName.split(" ")[0]}`;
        if (avatarEl && session.photoURL) {
            avatarEl.src = session.photoURL;
            avatarEl.style.display = "block";
        }
    }

    // ─── Eventos ─────────────────────────────────────────────────────────────

    private initializeEvents(): void {
        let visualizerStarted = false;

        this.playBtn.addEventListener("click", () => {
            // Iniciar el visualizador en el primer clic (requiere interacción del usuario)
            if (!visualizerStarted) {
                this.visualizer?.start();
                visualizerStarted = true;
            }
            void this.audioService.togglePlay().then(() => this.updatePlayButtonIcon());
        });

        document.getElementById("next-btn")?.addEventListener("click", () => {
            this.audioService.playNext();
            this.updateTrackInfo();
        });

        document.getElementById("prev-btn")?.addEventListener("click", () => {
            this.audioService.playPrevious();
            this.updateTrackInfo();
        });

        this.volumeBar.addEventListener("input", () => {
            this.audioService.setVolume(parseFloat(this.volumeBar.value));
        });

        this.progressBar.addEventListener("input", () => {
            // TODO: implementar seek cuando AudioService exponga seekTo()
        });
    }

    private setupThemePicker(): void {
        document.querySelectorAll(".theme-dot").forEach((dot) => {
            dot.addEventListener("click", () => {
                const themeId = (dot as HTMLElement).dataset.theme;
                if (!themeId) return;
                this.themeService.applyTheme(themeId);
                document.querySelectorAll(".theme-dot").forEach((d) => d.classList.remove("active"));
                dot.classList.add("active");
            });
        });

        // Marcar el tema activo al iniciar
        const current = this.themeService.getCurrentTheme();
        document.querySelector(`.theme-dot[data-theme="${current.id}"]`)?.classList.add("active");
    }

    // ─── Actualización de la UI ───────────────────────────────────────────────

    public updateTrackInfo(): void {
        const node = this.audioService.getCurrentTrackNode();
        if (!node) return;

        const { title, artist, coverUrl, duration } = node.trackData;
        this.trackTitle.textContent = title;
        this.trackArtist.textContent = artist;
        this.trackCover.src = coverUrl;
        this.trackCover.alt = `${title} — ${artist}`;
        this.progressBar.max = duration.toString();
        this.totalDurationEl.textContent = this.formatTime(duration);

        this.renderQueue();
    }

    private updatePlayButtonIcon(): void {
        this.playBtn.textContent = this.audioService.getState().isPlaying ? "⏸" : "▶";
    }

    private startUIUpdater(): void {
        setInterval(() => {
            const state = this.audioService.getState();
            if (state.isPlaying) {
                this.progressBar.value = state.currentTime.toString();
                this.currentTimeEl.textContent = this.formatTime(state.currentTime);
            }
        }, AudioService.UI_UPDATE_INTERVAL);
    }

    public renderQueue(): void {
        this.queueList.innerHTML = "";
        const currentNode = this.audioService.getCurrentTrackNode();
        let node = this.queue.getFirstTrack();
        let index = 0;

        while (node) {
            const isActive = node === currentNode;
            const li = this.createQueueItem(node.trackData, index, isActive);
            const target = node;

            li.addEventListener("click", () => {
                void this.audioService.playTrack(target).then(() => {
                    this.updateTrackInfo();
                    this.updatePlayButtonIcon();
                });
            });

            this.queueList.appendChild(li);
            node = node.nextTrack;
            index++;
        }

        // Actualizar contador
        const countEl = document.getElementById("queue-count");
        if (countEl) countEl.textContent = `${this.queue.getQueueSize()} canciones`;
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private createQueueItem(track: Track, index: number, isActive: boolean): HTMLLIElement {
        const li = document.createElement("li");
        li.className = `queue-item${isActive ? " active" : ""}`;
        li.draggable = true;
        li.innerHTML = `
            <span class="queue-index">${isActive ? "▶" : index + 1}</span>
            <div class="queue-item-info">
                <p class="queue-item-title">${track.title}</p>
                <p class="queue-item-artist">${track.artist}</p>
            </div>
        `;
        return li;
    }

    private formatTime(seconds: number): string {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    }

    private requireElement<T extends HTMLElement>(id: string): T {
        const el = document.getElementById(id) as T | null;
        if (!el) throw new Error(`NovaBeat: Elemento #${id} no encontrado en el DOM.`);
        return el;
    }
}
