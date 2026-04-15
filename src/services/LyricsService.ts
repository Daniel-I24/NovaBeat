/** Una línea de letra con su timestamp en segundos */
export interface LyricLine {
    time: number;   // segundos
    text: string;
}

/** Resultado de búsqueda de letras */
export interface LyricsResult {
    lines: LyricLine[];
    synced: boolean; // true si tiene timestamps
}

/**
 * Servicio de letras usando lrclib.net (primario) y lyrics.ovh (fallback).
 * Prioriza letras sincronizadas (LRC) para resaltado en tiempo real.
 */
export class LyricsService {

    public async getLyrics(artist: string, title: string): Promise<LyricsResult | null> {
        const a = this.clean(artist);
        const t = this.clean(title);
        return await this.fromLrclib(a, t) ?? await this.fromLyricsOvh(a, t);
    }

    // ─── Proveedores ─────────────────────────────────────────────────────────

    private async fromLrclib(artist: string, title: string): Promise<LyricsResult | null> {
        try {
            const params = new URLSearchParams({ artist_name: artist, track_name: title });
            const res = await fetch(`https://lrclib.net/api/search?${params}`, {
                headers: { "Lrclib-Client": "NovaBeat/1.0" },
            });
            if (!res.ok) return null;

            const results = await res.json() as Array<{
                plainLyrics?: string;
                syncedLyrics?: string;
            }>;
            if (!results.length) return null;

            const best = results[0];

            // Preferir letras sincronizadas
            if (best.syncedLyrics) {
                const lines = this.parseLRC(best.syncedLyrics);
                if (lines.length) return { lines, synced: true };
            }

            if (best.plainLyrics) {
                return { lines: this.parsePlain(best.plainLyrics), synced: false };
            }
            return null;
        } catch { return null; }
    }

    private async fromLyricsOvh(artist: string, title: string): Promise<LyricsResult | null> {
        try {
            const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
            const res = await fetch(url);
            if (!res.ok) return null;
            const data = await res.json() as { lyrics?: string };
            if (!data.lyrics) return null;
            return { lines: this.parsePlain(data.lyrics), synced: false };
        } catch { return null; }
    }

    // ─── Parsers ─────────────────────────────────────────────────────────────

    /** Parsea formato LRC: [mm:ss.xx] texto */
    private parseLRC(raw: string): LyricLine[] {
        const lines: LyricLine[] = [];
        for (const line of raw.split("\n")) {
            const match = line.match(/^\[(\d{2}):(\d{2})[.:](\d{2,3})\](.*)/);
            if (!match) continue;
            const time = parseInt(match[1]) * 60 + parseInt(match[2]) + parseInt(match[3]) / 1000;
            const text = match[4].trim();
            if (text) lines.push({ time, text });
        }
        return lines;
    }

    /** Convierte texto plano en líneas sin timestamp */
    private parsePlain(raw: string): LyricLine[] {
        return raw.split("\n")
            .map((l) => l.trim())
            .filter(Boolean)
            .map((text) => ({ time: 0, text }));
    }

    // ─── Limpieza ─────────────────────────────────────────────────────────────

    private clean(text: string): string {
        return text
            .replace(/\(.*?\)|\[.*?\]/g, "")
            .replace(/feat\.?.*/i, "")
            .replace(/ft\.?.*/i, "")
            .replace(/ - .*/g, "")
            .replace(/[|/\\]/g, "")
            .trim();
    }
}
