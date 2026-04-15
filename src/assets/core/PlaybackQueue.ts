import { TrackNode } from "./TrackNode";

/**
 * Motor de gestión de la cola de reproducción basado en una lista doblemente enlazada.
 * Encargado de la lógica de navegación y organización de NovaBeat.
 */
export class PlaybackQueue<T> {
    private firstTrack: TrackNode<T> | null = null;
    private lastTrack: TrackNode<T> | null = null;
    private totalTracks: number = 0;

    constructor() {}

    /**
     * Añade una canción al final de la cola (por defecto).
     */
    public addToEnd(track: T): void {
        const newNode = new TrackNode(track);
        if (!this.firstTrack) {
            this.firstTrack = newNode;
            this.lastTrack = newNode;
        } else {
            newNode.previousTrack = this.lastTrack;
            if (this.lastTrack) this.lastTrack.nextTrack = newNode;
            this.lastTrack = newNode;
        }
        this.totalTracks++;
    }

    /**
     * Añade una canción para que sea la próxima en sonar (al inicio).
     */
    public addToStart(track: T): void {
        const newNode = new TrackNode(track);
        if (!this.firstTrack) {
            this.firstTrack = newNode;
            this.lastTrack = newNode;
        } else {
            newNode.nextTrack = this.firstTrack;
            this.firstTrack.previousTrack = newNode;
            this.firstTrack = newNode;
        }
        this.totalTracks++;
    }

    /**
     * Inserta una canción en una posición específica de la cola.
     */
    public insertAtPosition(index: number, track: T): boolean {
        if (index < 0 || index > this.totalTracks) return false;

        if (index === 0) {
            this.addToStart(track);
            return true;
        }
        if (index === this.totalTracks) {
            this.addToEnd(track);
            return true;
        }

        const newNode = new TrackNode(track);
        const targetNode = this.getTrackNodeByIndex(index);
        
        if (targetNode) {
            newNode.nextTrack = targetNode;
            newNode.previousTrack = targetNode.previousTrack;
            if (targetNode.previousTrack) {
                targetNode.previousTrack.nextTrack = newNode;
            }
            targetNode.previousTrack = newNode;
            this.totalTracks++;
            return true;
        }
        return false;
    }

    /**
     * Elimina una canción específica de la cola de reproducción.
     */
    public removeTrack(node: TrackNode<T>): void {
        if (node === this.firstTrack) this.firstTrack = node.nextTrack;
        if (node === this.lastTrack) this.lastTrack = node.previousTrack;

        if (node.previousTrack) node.previousTrack.nextTrack = node.nextTrack;
        if (node.nextTrack) node.nextTrack.previousTrack = node.previousTrack;

        node.unlink();
        this.totalTracks--;
    }

    /**
     * Busca un nodo por su índice para operaciones de gestión.
     */
    public getTrackNodeByIndex(index: number): TrackNode<T> | null {
        if (index < 0 || index >= this.totalTracks) return null;
        
        let current = this.firstTrack;
        for (let i = 0; i < index; i++) {
            current = current?.nextTrack || null;
        }
        return current;
    }

    public getQueueSize(): number {
        return this.totalTracks;
    }

    public getFirstTrack(): TrackNode<T> | null {
        return this.firstTrack;
    }
}