/**
 * Clase que representa un eslabón individual en la cola de reproducción.
 * Almacena la información de la canción y las referencias a las canciones adyacentes.
 */
export class TrackNode<T> {
    public trackData: T;
    public nextTrack: TrackNode<T> | null;
    public previousTrack: TrackNode<T> | null;

    /**
     * @param trackData El objeto con la información de la canción (Título, Artista, etc).
     */
    constructor(trackData: T) {
        this.trackData = trackData;
        this.nextTrack = null;
        this.previousTrack = null;
    }

    /**
     * Desvincula el nodo de la lista para prevenir fugas de memoria.
     */
    public unlink(): void {
        this.nextTrack = null;
        this.previousTrack = null;
    }
}