import { MusicService } from "../services/MusicService";
import { PlaybackQueue } from "../assets/core/PlaybackQueue";
import { AudioService } from "../services/AudioService";
import { Track } from "../models/Track.model";

const SEARCH_DEBOUNCE_MS = 500;

/**
 * Interfaz de búsqueda de canciones usando la iTunes Search API.
 * Catálogo de millones de canciones actuales con previews de 30 segundos.
 */
export class SearchUI {
    private readonly musicService: MusicService;
    private readonly queue: PlaybackQueue<Track>;
    private readonly audioService: AudioService;
    private readonly onQueueUpdate: () => void;
    private readonly resultCache = new Map<string, Track>();

    private debounceTimer: ReturnType<typeof setTimeout> | null = null;
    private isOpen = false;

    constructor(
        musicService: MusicService,
        queue: PlaybackQueue<Track>,
        audioService: AudioService,
        onQueueUpdate: () => void
    ) {
        this.musicService = musicService;
        this.queue = queue;
        this.audioService = audioService;
        this.onQueueUpdate = onQueueUpdate;
        this.setup();
        this.loadTrending();
    }

    // ─── Setup ───────────────────────────────────────────────────────────────

    private setup(): void {
        document.getElementById("search-btn")?.addEventListener("click", () => this.togglePanel());
        document.getElementById("search-overlay")?.addEventListener("click", () => this.closePanel());
        document.getElementById("search-close-btn")?.addEventListener("click", () => this.closePanel());

        const input = document.getElementById("search-input") as HTMLInputElement | null;
        input?.addEventListener("input", () => {
            const q = input.value.trim();
            if (this.debounceTimer) clearTimeout(this.debounceTimer);
            if (!q) { this.loadTrending(); return; }
            if (q.length < 2) return;
            this.debounceTimer = setTimeout(() => this.performSearch(q), SEARCH_DEBOUNCE_MS);
        });

        document.querySelectorAll<HTMLElement>(".genre-chip").forEach((chip) => {
            chip.addEventListener("click", () => {
                document.querySelectorAll(".genre-chip").forEach((c) => c.classList.remove("active"));
                chip.classList.add("active");
                void this.searchByGenre(chip.dataset.genre ?? "");
            });
        });
    }

    // ─── Acciones ────────────────────────────────────────────────────────────

    private async loadTrending(): Promise<void> {
        this.showLoading("Cargando canciones en tendencia...");
        try {
            const tracks = await this.musicService.getTrending(10);
            this.renderResults(tracks, "🔥 Trending");
        } catch {
            this.showError("No se pudo cargar el catálogo. Verifica tu conexión.");
        }
    }

    private async performSearch(query: string): Promise<void> {
        this.showLoading(`Buscando "${query}"...`);
        try {
            const tracks = await this.musicService.search(query, 20);
            tracks.length === 0
                ? this.showEmpty(`Sin resultados para "${query}"`)
                : this.renderResults(tracks, `Resultados para "${query}"`);
        } catch {
            this.showError("Error al buscar. Intenta de nuevo.");
        }
    }

    private async searchByGenre(genre: string): Promise<void> {
        this.showLoading(`Cargando ${genre}...`);
        try {
            const tracks = await this.musicService.getByGenre(genre, 20);
            this.renderResults(tracks, `🎵 ${genre}`);
        } catch {
            this.showError("Error al cargar el género.");
        }
    }

    // ─── Renderizado ─────────────────────────────────────────────────────────

    private renderResults(tracks: Track[], title: string): void {
        const container = document.getElementById("search-results");
        const titleEl   = document.getElementById("search-results-title");
        if (!container) return;
        if (titleEl) titleEl.textContent = title;

        this.cacheResults(tracks);

        container.innerHTML = tracks.map((t) => `
            <div class="search-result-item">
                <img class="result-cover" src="${t.coverUrl}" alt="${t.title}" loading="lazy"
                     onerror="this.src='https://placehold.co/48x48/0d0d1a/7c6ff7?text=♪'">
                <div class="result-info">
                    <p class="result-title">${t.title}</p>
                    <p class="result-artist">${t.artist} · ${t.album}</p>
                </div>
                <div class="result-actions">
                    <button class="result-btn play-now" data-id="${t.id}" title="Reproducir ahora">▶</button>
                    <button class="result-btn add-queue" data-id="${t.id}" title="Agregar a la cola">＋</button>
                </div>
            </div>`).join("");

        container.querySelectorAll<HTMLElement>(".play-now").forEach((btn) => {
            btn.addEventListener("click", (e) => { e.stopPropagation(); this.playNow(btn.dataset.id ?? ""); });
        });
        container.querySelectorAll<HTMLElement>(".add-queue").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                this.addToQueue(btn.dataset.id ?? "");
                btn.textContent = "✓";
                (btn as HTMLButtonElement).disabled = true;
            });
        });
    }

    private showLoading(msg: string): void {
        const c = document.getElementById("search-results");
        if (c) c.innerHTML = `<div class="search-loading"><div class="spinner"></div><p>${msg}</p></div>`;
    }
    private showError(msg: string): void {
        const c = document.getElementById("search-results");
        if (c) c.innerHTML = `<div class="search-empty">⚠️ ${msg}</div>`;
    }
    private showEmpty(msg: string): void {
        const c = document.getElementById("search-results");
        if (c) c.innerHTML = `<div class="search-empty">🔍 ${msg}</div>`;
    }

    // ─── Cola ─────────────────────────────────────────────────────────────────

    private playNow(id: string): void {
        const track = this.resultCache.get(id);
        if (!track) return;
        this.queue.addToEnd(track);
        this.onQueueUpdate();
        const node = this.queue.getTrackNodeByIndex(this.queue.getQueueSize() - 1);
        if (node) void this.audioService.playTrack(node);
    }

    private addToQueue(id: string): void {
        const track = this.resultCache.get(id);
        if (!track) return;
        this.queue.addToEnd(track);
        this.onQueueUpdate();
    }

    // ─── Panel ────────────────────────────────────────────────────────────────

    private togglePanel(): void { this.isOpen ? this.closePanel() : this.openPanel(); }

    private openPanel(): void {
        this.isOpen = true;
        document.getElementById("search-panel")?.classList.add("open");
        document.getElementById("search-overlay")?.classList.remove("hidden");
        (document.getElementById("search-input") as HTMLInputElement)?.focus();
    }

    private closePanel(): void {
        this.isOpen = false;
        document.getElementById("search-panel")?.classList.remove("open");
        document.getElementById("search-overlay")?.classList.add("hidden");
    }

    // ─── Cache ────────────────────────────────────────────────────────────────

    private cacheResults(tracks: Track[]): void {
        tracks.forEach((t) => this.resultCache.set(t.id, t));
    }
}
