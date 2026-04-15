/**
 * Representa una pista de audio en el catálogo de NovaBeat.
 */
export interface Track {
    id: string;
    title: string;
    artist: string;
    album: string;
    duration: number;   // en segundos
    coverUrl: string;
    audioUrl: string;
    genre: string;
}

/**
 * Estado interno del motor de reproducción.
 */
export interface PlaybackState {
    isPlaying: boolean;
    currentTime: number;
    volume: number;
    isMuted: boolean;
}
