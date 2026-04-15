import { LyricsService, LyricsResult, LyricLine } from "../services/LyricsService";
import { Track } from "../models/Track.model";
import { AudioService } from "../services/AudioService";

/**
 * Panel de letras con resaltado sincronizado en tiempo real.
 * Cuando las letras tienen timestamps LRC, resalta la línea activa
 * y hace scroll automático conforme avanza la canción.
 */
export class LyricsUI {
    private readonly lyricsService: LyricsService;
    private readonly audioService: AudioService;
    private readonly panel: HTMLElement;
    private readonly content: HTMLElement;

    private currentTrackId: string | null = null;
    private syncedLines: LyricLine[] = [];
    private syncInterval: ReturnType<typeof setInterval> | null = null;
    private isOpen = false;

    constructor(lyricsService: LyricsService, audioService: AudioService) {
        this.lyricsService = lyricsService;
        this.audioService = audioService;
        this.panel   = this.req("lyrics-panel");
        this.content = this.req("lyrics-content");
        this.setupEvents();
    }

    /** Carga letras para la pista dada. Siempre recarga al cambiar canción. */
    public async loadLyrics(track: Track): Promise<void> {
        if (this.currentTrackId === track.id) return;
        this.currentTrackId = track.id;
        this.stopSync();
        this.showLoading(track.title, track.artist);

        const result = await this.lyricsService.getLyrics(track.artist, track.title);

        if (!result) { this.showNotFound(track.title, track.artist); return; }

        this.renderLyrics(track.title, track.artist, result);

        if (result.synced) this.startSync(result.lines);
    }

    public open(): void  { this.isOpen = true;  this.panel.classList.add("open"); }
    public close(): void { this.isOpen = false; this.panel.classList.remove("open"); }
    public toggle(): void { this.isOpen ? this.close() : this.open(); }

    /** Limpia recursos al cerrar sesión. */
    public destroy(): void {
        this.stopSync();
        this.close();
        this.currentTrackId = null;
    }

    // ─── Sincronización ───────────────────────────────────────────────────────

    private startSync(lines: LyricLine[]): void {
        this.syncedLines = lines;
        this.syncInterval = setInterval(() => this.highlightCurrent(), 250);
    }

    private stopSync(): void {
        if (this.syncInterval) { clearInterval(this.syncInterval); this.syncInterval = null; }
        this.syncedLines = [];
    }

    private highlightCurrent(): void {
        const t = this.audioService.getState().currentTime;
        let activeIdx = -1;

        for (let i = 0; i < this.syncedLines.length; i++) {
            if (this.syncedLines[i].time <= t) activeIdx = i;
            else break;
        }

        const rows = this.content.querySelectorAll<HTMLElement>(".lyric-line");
        rows.forEach((row, i) => {
            const isActive = i === activeIdx;
            row.classList.toggle("lyric-active", isActive);
            row.classList.toggle("lyric-past", i < activeIdx);
            if (isActive) row.scrollIntoView({ behavior: "smooth", block: "center" });
        });
    }

    // ─── Renderizado ─────────────────────────────────────────────────────────

    private renderLyrics(title: string, artist: string, result: LyricsResult): void {
        const lines = result.lines
            .map((l, i) => `<p class="lyric-line" data-idx="${i}">${l.text}</p>`)
            .join("");

        this.content.innerHTML = `
            <div class="lyrics-header">
                <p class="lyrics-title">${title}</p>
                <p class="lyrics-artist">${artist}</p>
                ${result.synced ? '<span class="lyrics-badge">🎵 Sincronizada</span>' : ""}
            </div>
            <div class="lyrics-body">${lines}</div>
            <p class="lyrics-credit">Letras por <a href="https://lrclib.net" target="_blank" rel="noopener noreferrer">lrclib.net</a></p>`;
    }

    private showLoading(title: string, artist: string): void {
        this.content.innerHTML = `
            <div class="lyrics-header">
                <p class="lyrics-title">${title}</p>
                <p class="lyrics-artist">${artist}</p>
            </div>
            <div class="lyrics-loading"><div class="spinner"></div><p>Buscando letra...</p></div>`;
    }

    private showNotFound(title: string, artist: string): void {
        this.content.innerHTML = `
            <div class="lyrics-header">
                <p class="lyrics-title">${title}</p>
                <p class="lyrics-artist">${artist}</p>
            </div>
            <div class="lyrics-empty">
                <p>🎵</p>
                <p>No se encontró la letra.</p>
                <p class="lyrics-hint">Disponible principalmente para canciones en inglés y español.</p>
            </div>`;
    }

    // ─── Eventos ─────────────────────────────────────────────────────────────

    private setupEvents(): void {
        document.getElementById("lyrics-close-btn")?.addEventListener("click", () => this.close());
        document.getElementById("lyrics-overlay")?.addEventListener("click", () => this.close());
    }

    private req(id: string): HTMLElement {
        const el = document.getElementById(id);
        if (!el) throw new Error(`NovaBeat: #${id} no encontrado.`);
        return el;
    }
}
