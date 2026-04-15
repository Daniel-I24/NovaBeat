import { Track } from "../models/Track.model";

/** Ruta base de los recursos estáticos servidos por Vite desde /public */
const ASSETS_BASE_URL = "/assets";

/**
 * Construye la ruta a un recurso de audio o portada de forma centralizada.
 * Cambiar ASSETS_BASE_URL es suficiente para apuntar a otro servidor o CDN.
 */
function getResourcePath(type: "audio" | "cover", fileName: string): string {
    return `${ASSETS_BASE_URL}/${type}/${fileName}`;
}

export const INITIAL_TRACKS: Track[] = [
    {
        id: crypto.randomUUID(),
        title: "Starlight Drift",
        artist: "Nova Echo",
        album: "Digital Horizons",
        duration: 215,
        coverUrl: getResourcePath("cover", "starlight-drift.jpg"),
        audioUrl: getResourcePath("audio", "starlight-drift.mp3"),
        genre: "Synthwave",
    },
    {
        id: crypto.randomUUID(),
        title: "Midnight City",
        artist: "Neon Dreams",
        album: "After Hours",
        duration: 180,
        coverUrl: getResourcePath("cover", "midnight-city.jpg"),
        audioUrl: getResourcePath("audio", "midnight-city.mp3"),
        genre: "Electronic",
    },
];
