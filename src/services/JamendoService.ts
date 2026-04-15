import { Track } from "../models/Track.model";

const JAMENDO_CLIENT_ID = "24a03c48";
const JAMENDO_BASE_URL = "https://api.jamendo.com/v3.0";

/** Respuesta cruda de la API de Jamendo para una pista */
interface JamendoTrack {
    id: string;
    name: string;
    artist_name: string;
    album_name: string;
    duration: number;
    image: string;
    audio: string;
    genre?: string;
}

interface JamendoResponse {
    results: JamendoTrack[];
    headers: { results_count: number };
}

/**
 * Servicio de integración con la API pública de Jamendo.
 * Permite buscar y cargar canciones con licencia Creative Commons.
 */
export class JamendoService {
    private readonly clientId = JAMENDO_CLIENT_ID;
    private readonly baseUrl = JAMENDO_BASE_URL;

    /**
     * Busca canciones por término de búsqueda.
     * @param query Texto a buscar (título, artista, álbum)
     * @param limit Número máximo de resultados (default 20)
     */
    public async search(query: string, limit = 20): Promise<Track[]> {
        const url = this.buildUrl("/tracks", {
            search: query,
            limit: limit.toString(),
            include: "musicinfo",
            audioformat: "mp32",
            order: "popularity_total",
        });

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Jamendo API error: ${response.status}`);
        }

        const data: JamendoResponse = await response.json();
        return data.results.map(this.mapToTrack);
    }

    /**
     * Obtiene canciones populares por género.
     * @param genre Género musical (electronic, rock, pop, jazz, classical, etc.)
     * @param limit Número máximo de resultados
     */
    public async getByGenre(genre: string, limit = 20): Promise<Track[]> {
        const url = this.buildUrl("/tracks", {
            tags: genre,
            limit: limit.toString(),
            audioformat: "mp32",
            order: "popularity_total",
            include: "musicinfo",
        });

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Jamendo API error: ${response.status}`);
        }

        const data: JamendoResponse = await response.json();
        return data.results.map(this.mapToTrack);
    }

    /**
     * Obtiene las canciones más populares del momento.
     */
    public async getTrending(limit = 20): Promise<Track[]> {
        const url = this.buildUrl("/tracks", {
            limit: limit.toString(),
            audioformat: "mp32",
            order: "popularity_week",
            include: "musicinfo",
        });

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Jamendo API error: ${response.status}`);
        }

        const data: JamendoResponse = await response.json();
        return data.results.map(this.mapToTrack);
    }

    // ─── Helpers privados ────────────────────────────────────────────────────

    private buildUrl(endpoint: string, params: Record<string, string>): string {
        const query = new URLSearchParams({
            client_id: this.clientId,
            format: "json",
            ...params,
        });
        return `${this.baseUrl}${endpoint}?${query.toString()}`;
    }

    private mapToTrack(raw: JamendoTrack): Track {
        return {
            id: `jamendo_${raw.id}`,
            title: raw.name,
            artist: raw.artist_name,
            album: raw.album_name || "Single",
            duration: raw.duration,
            genre: raw.genre ?? "Various",
            coverUrl: raw.image || "https://placehold.co/200x200/0d0d1a/7c6ff7?text=♪",
            // audiodownload es la URL directa de descarga/stream con CORS abierto
            audioUrl: `https://mp3d.jamendo.com/?trackid=${raw.id}&format=mp32`,
        };
    }
}
