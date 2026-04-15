/**
 * Define la estructura de una canción dentro de NovaBeat.
 * Se utilizan tipos estrictos para garantizar la integridad de los datos.
 */
export interface Track {
    id: string;          // UUID único para cada canción
    title: string;       // Nombre de la pista
    artist: string;      // Artista o banda
    album: string;       // Álbum al que pertenece
    duration: number;    // Duración total en segundos
    coverUrl: string;    // Ruta a la imagen de la carátula (para el Soft Minimalist design)
    audioUrl: string;    // Ruta al archivo de audio (.mp3, .wav)
    genre: string;       // Género musical para posibles filtros
}

/**
 * Representa el estado actual de la reproducción.
 */
export interface PlaybackState {
    isPlaying: boolean;
    currentTime: number;
    volume: number;
    isMuted: boolean;
}