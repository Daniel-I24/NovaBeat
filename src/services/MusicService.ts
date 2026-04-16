import { Track } from "../models/Track.model";

const ITUNES_BASE = "https://itunes.apple.com";

/** Artistas populares para el trending por defecto */
const TRENDING_ARTISTS = [
    "Bad Bunny", "Taylor Swift", "Drake", "The Weeknd", "Feid",
    "Karol G", "Peso Pluma", "SZA", "Morgan Wallen", "Olivia Rodrigo",
];

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
 * Gratuita, sin API key, CORS abierto, millones de canciones actuales.
 * Los previews son de 30 segundos.
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
        return this.fetchTracks(`${ITUNES_BASE}/search?${params}`);
    }

    /** Obtiene canciones populares por género. */
    public async getByGenre(genre: string, limit = 20): Promise<Track[]> {
        const params = new URLSearchParams({
            term: genre,
            media: "music",
            entity: "song",
            limit: String(limit),
        });
        return this.fetchTracks(`${ITUNES_BASE}/search?${params}`);
    }

    /**
     * Obtiene canciones en tendencia buscando artistas populares actuales.
     * Mezcla resultados de varios artistas para dar variedad.
     */
    public async getTrending(limit = 20): Promise<Track[]> {
        // Elegir 3 artistas aleatorios para variedad
        const shuffled = [...TRENDING_ARTISTS].sort(() => Math.random() - 0.5).slice(0, 3);
        const perArtist = Math.ceil(limit / shuffled.length);

        const results = await Promise.allSettled(
            shuffled.map((artist) => this.search(artist, perArtist))
        );

        const tracks: Track[] = [];
        for (const r of results) {
            if (r.status === "fulfilled") tracks.push(...r.value);
        }

        // Mezclar y limitar
        return tracks.sort(() => Math.random() - 0.5).slice(0, limit);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private async fetchTracks(url: string): Promise<Track[]> {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`iTunes API error: ${res.status}`);
        const data: ItunesResponse = await res.json();
        return data.results
            .filter((r) => r.previewUrl)
            .map((r) => this.mapToTrack(r));
    }

    private mapToTrack(raw: ItunesTrack): Track {
        return {
            id:       `itunes_${raw.trackId}`,
            title:    raw.trackName,
            artist:   raw.artistName,
            album:    raw.collectionName || "Single",
            duration: Math.floor((raw.trackTimeMillis || 30000) / 1000),
            genre:    raw.primaryGenreName || "Various",
            coverUrl: raw.artworkUrl100.replace("100x100bb", "300x300bb"),
            audioUrl: raw.previewUrl,
        };
    }
}
