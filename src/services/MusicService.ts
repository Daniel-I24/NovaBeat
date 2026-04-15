import { Track } from "../models/Track.model";

const ITUNES_BASE = "https://itunes.apple.com";

/** Respuesta cruda de la iTunes Search API */
interface ItunesTrack {
    trackId: number;
    trackName: string;
    artistName: string;
    collectionName: string;
    trackTimeMillis: number;
    artworkUrl100: string;
    previewUrl: string;
    primaryGenreName: string;
}

interface ItunesResponse {
    resultCount: number;
    results: ItunesTrack[];
}

/**
 * Servicio de música usando la iTunes Search API de Apple.
 * Gratuita, sin API key, CORS abierto, catálogo de millones de canciones actuales.
 * Los previews son de 30 segundos — suficiente para descubrir música.
 */
export class MusicService {

    /** Busca canciones por texto (título, artista, álbum). */
    public async search(query: string, limit = 20): Promise<Track[]> {
        const params = new URLSearchParams({
            term: query,
            media: "music",
            entity: "song",
            limit: String(limit),
        });
        return this.fetch(`${ITUNES_BASE}/search?${params}`);
    }

    /** Obtiene canciones populares por género. */
    public async getByGenre(genre: string, limit = 20): Promise<Track[]> {
        const params = new URLSearchParams({
            term: genre,
            media: "music",
            entity: "song",
            limit: String(limit),
            attribute: "genreTerm",
        });
        return this.fetch(`${ITUNES_BASE}/search?${params}`);
    }

    /**
     * Obtiene canciones en tendencia usando el RSS de iTunes Top Songs.
     * Devuelve las 25 canciones más populares globalmente.
     */
    public async getTrending(limit = 20): Promise<Track[]> {
        const url = `${ITUNES_BASE}/rss/topsongs/limit=${Math.min(limit, 25)}/json`;
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`iTunes RSS error: ${res.status}`);
            const data = await res.json() as {
                feed: { entry: Array<{
                    "im:name": { label: string };
                    "im:artist": { label: string };
                    "im:collection"?: { "im:name": { label: string } };
                    "im:duration"?: { label: string };
                    "im:image": Array<{ label: string }>;
                    id: { label: string };
                    "im:contentType"?: { attributes?: { term?: string } };
                }> }
            };

            // El RSS no incluye previewUrl — hacemos una búsqueda por cada canción
            // Solo tomamos los primeros 10 para no saturar la API
            const entries = data.feed.entry.slice(0, Math.min(limit, 10));
            const tracks = await Promise.all(
                entries.map(async (e) => {
                    const name   = e["im:name"].label;
                    const artist = e["im:artist"].label;
                    const results = await this.search(`${artist} ${name}`, 1);
                    return results[0] ?? null;
                })
            );
            return tracks.filter((t): t is Track => t !== null);
        } catch {
            // Fallback: buscar "top hits" si el RSS falla
            return this.search("top hits 2024", limit);
        }
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private async fetch(url: string): Promise<Track[]> {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`iTunes API error: ${res.status}`);
        const data: ItunesResponse = await res.json();
        return data.results
            .filter((r) => r.previewUrl) // solo canciones con preview disponible
            .map(this.mapToTrack);
    }

    private mapToTrack(raw: ItunesTrack): Track {
        return {
            id:        `itunes_${raw.trackId}`,
            title:     raw.trackName,
            artist:    raw.artistName,
            album:     raw.collectionName || "Single",
            duration:  Math.floor((raw.trackTimeMillis || 30000) / 1000),
            genre:     raw.primaryGenreName || "Various",
            coverUrl:  raw.artworkUrl100.replace("100x100", "300x300"),
            audioUrl:  raw.previewUrl,
        };
    }
}
