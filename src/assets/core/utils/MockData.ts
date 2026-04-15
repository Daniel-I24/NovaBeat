import { Track } from "../models/Track.model";

/**
 * Helper para construir rutas de recursos de forma dinámica.
 * Esto evita tener URLs quemadas en toda la aplicación.
 */
const getResourcePath = (type: 'audio' | 'cover', fileName: string): string => {
    const BASE_URL = "/assets"; // Puedes cambiar esto a una URL de servidor o S3
    return `${BASE_URL}/${type}/${fileName}`;
};

export const INITIAL_TRACKS: Track[] = [
    {
        id: crypto.randomUUID(),
        title: "Starlight Drift",
        artist: "Nova Echo",
        album: "Digital Horizons",
        duration: 215,
        coverUrl: getResourcePath('cover', 'starlight-drift.jpg'),
        audioUrl: getResourcePath('audio', 'starlight-drift.mp3'),
        genre: "Synthwave"
    },
    {
        id: crypto.randomUUID(),
        title: "Midnight City",
        artist: "Neon Dreams",
        album: "After Hours",
        duration: 180,
        coverUrl: getResourcePath('cover', 'midnight-city.jpg'),
        audioUrl: getResourcePath('audio', 'midnight-city.mp3'),
        genre: "Electronic"
    }
];