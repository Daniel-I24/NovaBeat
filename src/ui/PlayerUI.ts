import { AudioService } from "../services/AudioService";
import { PlaybackQueue } from "../assets/core/PlaybackQueue";
import { Track } from "../models/Track.model";

/**
 * Controlador de la interfaz del reproductor NovaBeat.
 * Gestiona eventos de botones, barra de progreso y renderizado de la cola.
 */
export class PlayerUI {
    private readonly audioService: AudioService;
    private readonly queue: PlaybackQueue<Track>;

    // Elementos del DOM — se resuelven una sola vez en el constructor
    private readonly playBtn: HTMLButtonElement;
    private readonly progressBar: HTMLInputElement;
    private readonly trackTitle: HTMLElement;
    private readonly trackArtist: HTMLElement;
    private readonly trackCover: HTMLImageElement;
    private readonly queueList: HTMLElement;

    constructor(audioService: AudioService, queue: PlaybackQueue<Track>) {
        this.audioService = audioService;
        this.queue = queue;

        this.playBtn = this.requireElement<HTMLButtonElement>("play-pause-btn");
        this.progressBar = this.requireElement<HTMLInputElement>("progress-bar");
        this.trackTitle = this.requireElement<HTMLElement>("current-title");
        this.trackArtist = this.requireElement<HTMLElement>("current-artist");
        this.trackCover = this.requireElement<HTMLImageElement>("current-cover");
        this.queueList = this.requireElement<HTMLElement>("playback-queue-list");

        this.initializeEvents();
        this.startUIUpdater();
        this.renderQueue();
    }

    // ─── Eventos ─────────────────────────────────────────────────────────────

    private initializeEvents(): void {
        this.playBtn.addEventListener("click", () => {
            this.audioService.togglePlay();
            this.updatePlayButtonIcon();
        });

        document.getElementById("next-btn")?.addEventListener("click", () => {
            this.audioService.playNext();
            this.updateTrackInfo();
        });

        document.getElementById("prev-btn")?.addEventListener("click", () => {
            this.audioService.playPrevious();
            this.updateTrackInfo();
        });

        this.progressBar.addEventListener("input", () => {
            // TODO: implementar seek cuando AudioService exponga el método seekTo()
        });
    }

    // ─── Actualización de la UI ───────────────────────────────────────────────

    /** Actualiza título, artista y portada con la pista actualmente en reproducción. */
    public updateTrackInfo(): void {
        const currentNode = this.audioService.getCurrentTrackNode();
        if (!currentNode) return;

        const { title, artist, coverUrl } = currentNode.trackData;
        this.trackTitle.textContent = title;
        this.trackArtist.textContent = artist;
        this.trackCover.src = coverUrl;
        this.trackCover.alt = `${title} — ${artist}`;

        this.renderQueue();
    }

    private updatePlayButtonIcon(): void {
        this.playBtn.textContent = this.audioService.getState().isPlaying ? "⏸" : "▶";
    }

    /** Ciclo de actualización para la barra de progreso. */
    private startUIUpdater(): void {
        setInterval(() => {
            const state = this.audioService.getState();
            if (state.isPlaying) {
                this.progressBar.value = state.currentTime.toString();
            }
        }, AudioService.UI_UPDATE_INTERVAL);
    }

    /** Renderiza la cola de reproducción usando la lista doblemente enlazada. */
    public renderQueue(): void {
        this.queueList.innerHTML = "";
        let current = this.queue.getFirstTrack();
        let index = 0;

        while (current) {
            const li = this.createQueueItem(current.trackData, index);
            const targetNode = current;

            li.addEventListener("click", () => {
                this.audioService.playTrack(targetNode);
                this.updateTrackInfo();
                this.updatePlayButtonIcon();
            });

            this.queueList.appendChild(li);
            current = current.nextTrack;
            index++;
        }
    }

    // ─── Helpers privados ────────────────────────────────────────────────────

    /** Crea un elemento <li> para un ítem de la cola. */
    private createQueueItem(track: Track, index: number): HTMLLIElement {
        const li = document.createElement("li");
        li.className = "queue-item glass-panel";
        li.draggable = true;
        li.innerHTML = `
            <div class="track-mini-info">
                <span class="index">${index + 1}</span>
                <div>
                    <p class="title">${track.title}</p>
                    <p class="artist">${track.artist}</p>
                </div>
            </div>
        `;
        return li;
    }

    /**
     * Obtiene un elemento del DOM por ID y lanza un error descriptivo si no existe.
     * Evita el uso de non-null assertions (!) dispersos por el código.
     */
    private requireElement<T extends HTMLElement>(id: string): T {
        const el = document.getElementById(id) as T | null;
        if (!el) throw new Error(`NovaBeat: Elemento del DOM no encontrado: #${id}`);
        return el;
    }
}
