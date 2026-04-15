import { JamendoService } from "../services/JamendoService";
import { PlaybackQueue } from "../assets/core/PlaybackQueue";
import { AudioService } from "../services/AudioService";
import { Track } from "../models/Track.model";

/** Tiempo de espera en ms antes de lanzar la búsqueda (debounce) */
const SEARCH_DEBOUNCE_MS = 500;

/**
 * Interfaz de búsqueda de canciones usando la API de Jamendo.
 * Incluye búsqueda por texto, filtro por género y canciones trending.
 */
export class SearchUI {
    private readonly jamendo: JamendoService;
    private readonly queue: PlaybackQueue<Track>;
    private readonly audioService: AudioService;
    private readonly onQueueUpdate: () => void;

    private debounceTimer: ReturnType<typeof setTimeout> | null = null;
    private isOpen = false;

    constructor(
        jamendo: JamendoService,
        queue: PlaybackQueue<Track>,
        audioService: AudioService,
        onQueueUpdate: () => void
    ) {
        this.jamendo = jamendo;
        this.queue = queue;
        this.audioService = audioService;
        this.onQueueUpdate = onQueueUpdate;

        this.setupSearchPanel();
        this.loadTrending();
    }

    // ─── Setup ───────────────────────────────────────────────────────────────

    private setupSearchPanel(): void {
        // Toggle del panel
        document.getElementById("search-btn")?.addEventListener("click", () => {
            this.togglePanel();
        });

        // Cerrar al hacer clic fuera
        document.getElementById("search-overlay")?.addEventListener("click", () => {
            this.closePanel();
        });

        // Input con debounce
        const input = document.getElementById("search-input") as HTMLInputElement | null;
        input?.addEventListener("input", () => {
            const query = input.value.trim();
            if (this.debounceTimer) clearTimeout(this.debounceTimer);

            if (query.length < 2) {
                if (query.length === 0) this.loadTrending();
                return;
            }

            this.debounceTimer = setTimeout(() => {
                this.performSearch(query);
            }, SEARCH_DEBOUNCE_MS);
        });

        // Filtros de género
        document.querySelectorAll(".genre-chip").forEach((chip) => {
            chip.addEventListener("click", () => {
                const genre = (chip as HTMLElement).dataset.genre ?? "";
                document.querySelectorAll(".genre-chip").forEach((c) => c.classList.remove("active"));
                chip.classList.add("active");
                this.searchByGenre(genre);
            });
        });
    }

    // ─── Acciones ────────────────────────────────────────────────────────────

    private async loadTrending(): Promise<void> {
        this.showLoading("Canciones populares esta semana...");
        try {
            const tracks = await this.jamendo.getTrending(16);
            this.renderResults(tracks, "🔥 Trending");
        } catch {
            this.showError("No se pudo cargar el catálogo. Verifica tu conexión.");
        }
    }

    private async performSearch(query: string): Promise<void> {
        this.showLoading(`Buscando "${query}"...`);
        try {
            const tracks = await this.jamendo.search(query, 20);
            if (tracks.length === 0) {
                this.showEmpty(`No se encontraron resultados para "${query}"`);
            } else {
                this.renderResults(tracks, `Resultados para "${query}"`);
            }
        } catch {
            this.showError("Error al buscar. Intenta de nuevo.");
        }
    }

    private async searchByGenre(genre: string): Promise<void> {
        this.showLoading(`Cargando ${genre}...`);
        try {
            const tracks = await this.jamendo.getByGenre(genre, 20);
            this.renderResults(tracks, `🎵 ${genre}`);
        } catch {
            this.showError("Error al cargar el género.");
        }
    }

    // ─── Renderizado ─────────────────────────────────────────────────────────

    private renderResults(tracks: Track[], title: string): void {
        const container = document.getElementById("search-results");
        const titleEl = document.getElementById("search-results-title");
        if (!container) return;

        if (titleEl) titleEl.textContent = title;

        container.innerHTML = tracks.map((track) => `
            <div class="search-result-item" data-id="${track.id}">
                <img class="result-cover" src="${track.coverUrl}" alt="${track.title}" loading="lazy"
                     onerror="this.src='https://placehold.co/48x48/0d0d1a/7c6ff7?text=♪'">
                <div class="result-info">
                    <p class="result-title">${track.title}</p>
                    <p class="result-artist">${track.artist} · ${track.album}</p>
                </div>
                <div class="result-actions">
                    <button class="result-btn play-now" data-id="${track.id}" title="Reproducir ahora">▶</button>
                    <button class="result-btn add-queue" data-id="${track.id}" title="Agregar a la cola">＋</button>
                </div>
            </div>
        `).join("");

        // Guardar tracks en memoria para acceder por ID
        this.cacheResults(tracks);

        // Eventos de los botones
        container.querySelectorAll(".play-now").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                const id = (btn as HTMLElement).dataset.id ?? "";
                this.playNow(id);
            });
        });

        container.querySelectorAll(".add-queue").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                const id = (btn as HTMLElement).dataset.id ?? "";
                this.addToQueue(id);
                btn.textContent = "✓";
                (btn as HTMLButtonElement).disabled = true;
            });
        });
    }

    private showLoading(message: string): void {
        const container = document.getElementById("search-results");
        if (container) {
            container.innerHTML = `<div class="search-loading"><div class="spinner"></div><p>${message}</p></div>`;
        }
    }

    private showError(message: string): void {
        const container = document.getElementById("search-results");
        if (container) {
            container.innerHTML = `<div class="search-empty">⚠️ ${message}</div>`;
        }
    }

    private showEmpty(message: string): void {
        const container = document.getElementById("search-results");
        if (container) {
            container.innerHTML = `<div class="search-empty">🔍 ${message}</div>`;
        }
    }

    // ─── Acciones de cola ────────────────────────────────────────────────────

    private playNow(trackId: string): void {
        const track = this.resultCache.get(trackId);
        if (!track) return;

        this.queue.addToEnd(track);
        this.onQueueUpdate();

        const lastNode = this.queue.getTrackNodeByIndex(this.queue.getQueueSize() - 1);
        if (lastNode) {
            void this.audioService.playTrack(lastNode);
        }
    }

    private addToQueue(trackId: string): void {
        const track = this.resultCache.get(trackId);
        if (!track) return;
        this.queue.addToEnd(track);
        this.onQueueUpdate();
    }

    // ─── Panel toggle ────────────────────────────────────────────────────────

    public togglePanel(): void {
        this.isOpen ? this.closePanel() : this.openPanel();
    }

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

    // ─── Cache ───────────────────────────────────────────────────────────────

    private readonly resultCache = new Map<string, Track>();

    private cacheResults(tracks: Track[]): void {
        tracks.forEach((t) => this.resultCache.set(t.id, t));
    }
}
