import { AudioService } from "../services/AudioService";
import { PlaybackQueue } from "../assets/core/PlaybackQueue";
import { Track } from "../models/Track.model";
import { ThemeService } from "../services/ThemeService";
import { AuthSession } from "../models/User.model";
import { Visualizer } from "./Visualizer";
import { LyricsUI } from "./LyricsUI";

/**
 * Controlador principal de la interfaz del reproductor NovaBeat.
 */
export class PlayerUI {
    private readonly audioService: AudioService;
    private readonly queue: PlaybackQueue<Track>;
    private readonly themeService: ThemeService;
    private readonly visualizer: Visualizer | null;
    private readonly lyricsUI: LyricsUI | null;

    private readonly playBtn: HTMLButtonElement;
    private readonly progressBar: HTMLInputElement;
    private readonly volumeArea: HTMLElement;
    private readonly volumeBar: HTMLInputElement;
    private readonly trackTitle: HTMLElement;
    private readonly trackArtist: HTMLElement;
    private readonly trackCover: HTMLImageElement;
    private readonly queueList: HTMLElement;
    private readonly currentTimeEl: HTMLElement;
    private readonly totalDurationEl: HTMLElement;

    private visualizerStarted = false;
    private queueVisible = true;
    private isSeeking = false;

    constructor(
        audioService: AudioService,
        queue: PlaybackQueue<Track>,
        themeService: ThemeService,
        visualizer: Visualizer | null = null,
        lyricsUI: LyricsUI | null = null
    ) {
        this.audioService = audioService;
        this.queue = queue;
        this.themeService = themeService;
        this.visualizer = visualizer;
        this.lyricsUI = lyricsUI;

        this.playBtn        = this.el<HTMLButtonElement>("play-pause-btn");
        this.progressBar    = this.el<HTMLInputElement>("progress-bar");
        this.volumeArea     = this.el<HTMLElement>("volume-area");
        this.volumeBar      = this.el<HTMLInputElement>("volume-bar");
        this.trackTitle     = this.el<HTMLElement>("current-title");
        this.trackArtist    = this.el<HTMLElement>("current-artist");
        this.trackCover     = this.el<HTMLImageElement>("current-cover");
        this.queueList      = this.el<HTMLElement>("playback-queue-list");
        this.currentTimeEl  = this.el<HTMLElement>("current-time");
        this.totalDurationEl = this.el<HTMLElement>("total-duration");

        this.bindEvents();
        this.startUIUpdater();
        this.setupThemePicker();
        this.renderQueue();
    }

    public setUserInfo(session: AuthSession): void {
        const greeting = document.getElementById("user-greeting");
        const avatar = document.getElementById("user-avatar") as HTMLImageElement | null;
        if (greeting) greeting.textContent = `Hola, ${session.fullName.split(" ")[0]}`;
        if (avatar && session.photoURL) { avatar.src = session.photoURL; avatar.classList.remove("hidden"); }
    }

    // ─── Eventos ─────────────────────────────────────────────────────────────

    private bindEvents(): void {
        // Play / Pause — leer estado real del elemento de audio
        this.playBtn.addEventListener("click", () => {
            if (!this.visualizerStarted) { this.visualizer?.start(); this.visualizerStarted = true; }
            void this.audioService.togglePlay().then(() => this.syncPlayButton());
        });

        // Siguiente / Anterior
        document.getElementById("next-btn")?.addEventListener("click", () => {
            void this.audioService.playNext().then(() => this.onTrackChange());
        });
        document.getElementById("prev-btn")?.addEventListener("click", () => {
            void this.audioService.playPrevious().then(() => this.onTrackChange());
        });

        // Seek — el usuario arrastra la barra de progreso
        this.progressBar.addEventListener("mousedown", () => { this.isSeeking = true; });
        this.progressBar.addEventListener("touchstart", () => { this.isSeeking = true; }, { passive: true });
        this.progressBar.addEventListener("input", () => {
            this.currentTimeEl.textContent = this.fmt(parseFloat(this.progressBar.value));
        });
        this.progressBar.addEventListener("change", () => {
            this.audioService.seekTo(parseFloat(this.progressBar.value));
            this.isSeeking = false;
        });

        // Volumen — mostrar/ocultar al hacer clic en el ícono
        document.getElementById("volume-icon-btn")?.addEventListener("click", () => {
            this.volumeArea.classList.toggle("volume-expanded");
        });
        this.volumeBar.addEventListener("input", () => {
            this.audioService.setVolume(parseFloat(this.volumeBar.value));
        });

        // Letras
        document.getElementById("lyrics-btn")?.addEventListener("click", () => {
            this.lyricsUI?.toggle();
            const node = this.audioService.getCurrentTrackNode();
            if (node) void this.lyricsUI?.loadLyrics(node.trackData);
        });

        // Toggle cola — panel slide
        document.getElementById("queue-toggle-btn")?.addEventListener("click", () => {
            this.queueVisible = !this.queueVisible;
            document.getElementById("queue-section")?.classList.toggle("queue-collapsed", !this.queueVisible);
            const btn = document.getElementById("queue-toggle-btn");
            if (btn) btn.textContent = this.queueVisible ? "◀" : "▶";
        });
    }

    private setupThemePicker(): void {
        document.querySelectorAll<HTMLElement>(".theme-dot").forEach((dot) => {
            dot.addEventListener("click", () => {
                const id = dot.dataset.theme;
                if (!id) return;
                this.themeService.applyTheme(id);
                document.querySelectorAll(".theme-dot").forEach((d) => d.classList.remove("active"));
                dot.classList.add("active");
            });
        });
        document.querySelector(`.theme-dot[data-theme="${this.themeService.getCurrentTheme().id}"]`)
            ?.classList.add("active");
    }

    // ─── Actualización de UI ─────────────────────────────────────────────────

    private onTrackChange(): void {
        this.updateTrackInfo();
        this.syncPlayButton();
    }

    public updateTrackInfo(): void {
        const node = this.audioService.getCurrentTrackNode();
        if (!node) return;

        const { title, artist, coverUrl, duration } = node.trackData;

        // Fade en portada
        this.trackCover.style.opacity = "0";
        setTimeout(() => {
            this.trackCover.src = coverUrl || "https://placehold.co/200x200/0d0d1a/7c6ff7?text=♪";
            this.trackCover.alt = `${title} — ${artist}`;
            this.trackCover.style.opacity = "1";
        }, 150);

        this.trackTitle.textContent = title;
        this.trackArtist.textContent = artist;
        this.progressBar.max = String(duration || 0);
        this.totalDurationEl.textContent = this.fmt(duration);

        if (this.lyricsUI) void this.lyricsUI.loadLyrics(node.trackData);
        this.renderQueue();
    }

    private syncPlayButton(): void {
        const playing = this.audioService.getState().isPlaying;
        this.playBtn.textContent = playing ? "⏸" : "▶";
        this.playBtn.setAttribute("aria-label", playing ? "Pausar" : "Reproducir");
    }

    private startUIUpdater(): void {
        setInterval(() => {
            if (this.isSeeking) return;
            const { isPlaying, currentTime } = this.audioService.getState();
            this.progressBar.value = String(currentTime);
            this.currentTimeEl.textContent = this.fmt(currentTime);
            this.syncPlayButton();

            // Actualizar duración si el audio la cargó después (archivos locales)
            const dur = this.audioService.getDuration();
            if (dur > 0 && this.progressBar.max !== String(dur)) {
                this.progressBar.max = String(dur);
                this.totalDurationEl.textContent = this.fmt(dur);
            }

            // Actualizar portada si la pista activa cambió (ej: autoplay)
            const node = this.audioService.getCurrentTrackNode();
            if (node && isPlaying && this.trackTitle.textContent !== node.trackData.title) {
                this.onTrackChange();
            }
        }, AudioService.UI_UPDATE_INTERVAL);
    }

    public renderQueue(): void {
        this.queueList.innerHTML = "";
        const active = this.audioService.getCurrentTrackNode();
        let node = this.queue.getFirstTrack();
        let i = 0;

        while (node) {
            const isActive = node === active;
            const li = document.createElement("li");
            li.className = `queue-item${isActive ? " active" : ""}`;
            li.draggable = true;
            li.innerHTML = `
                <span class="queue-index">${isActive ? "▶" : i + 1}</span>
                <div class="queue-item-info">
                    <p class="queue-item-title">${node.trackData.title}</p>
                    <p class="queue-item-artist">${node.trackData.artist}</p>
                </div>
                <button class="queue-remove-btn" title="Eliminar">✕</button>`;

            const target = node;
            li.addEventListener("click", (e) => {
                if ((e.target as HTMLElement).classList.contains("queue-remove-btn")) return;
                void this.audioService.playTrack(target).then(() => this.onTrackChange());
            });
            li.querySelector(".queue-remove-btn")?.addEventListener("click", (e) => {
                e.stopPropagation();
                this.queue.removeTrack(target);
                this.renderQueue();
            });

            this.queueList.appendChild(li);
            node = node.nextTrack;
            i++;
        }

        const countEl = document.getElementById("queue-count");
        if (countEl) countEl.textContent = `${this.queue.getQueueSize()} canciones`;
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private fmt(s: number): string {
        if (!isFinite(s) || s < 0) return "0:00";
        return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
    }

    private el<T extends HTMLElement>(id: string): T {
        const el = document.getElementById(id) as T | null;
        if (!el) throw new Error(`NovaBeat: #${id} no encontrado.`);
        return el;
    }
}
