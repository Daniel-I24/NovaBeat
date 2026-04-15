import { PlaybackQueue } from "../assets/core/PlaybackQueue";
import { TrackNode } from "../assets/core/TrackNode";
import { Track, PlaybackState } from "../models/Track.model";

/** Tiempo en ms entre cada actualización del estado de la UI */
const UI_UPDATE_INTERVAL_MS = 500;

/** Volumen inicial al arrancar la aplicación (0–1) */
const DEFAULT_VOLUME = 0.5;

/**
 * Servicio maestro de audio para NovaBeat.
 * Gestiona la reproducción, estados y navegación de la cola.
 */
export class AudioService {
    private readonly audioContext: AudioContext;
    private readonly audioElement: HTMLAudioElement;
    private readonly trackSource: MediaElementAudioSourceNode;
    private readonly analyzer: AnalyserNode;

    private currentTrackNode: TrackNode<Track> | null = null;

    private state: PlaybackState = {
        isPlaying: false,
        currentTime: 0,
        volume: DEFAULT_VOLUME,
        isMuted: false,
    };

    constructor(_queue: PlaybackQueue<Track>) {
        this.audioElement = new Audio();

        // Compatibilidad con navegadores que aún usan el prefijo webkit
        const AudioContextClass =
            window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

        if (!AudioContextClass) {
            throw new Error("NovaBeat: Web Audio API no está soportada en este navegador.");
        }

        this.audioContext = new AudioContextClass();
        this.trackSource = this.audioContext.createMediaElementSource(this.audioElement);
        this.analyzer = this.audioContext.createAnalyser();

        // Cadena de audio: fuente → analizador → salida
        this.trackSource.connect(this.analyzer);
        this.analyzer.connect(this.audioContext.destination);

        this.setupAudioListeners();
    }

    /** Configura los escuchadores de eventos nativos del elemento de audio. */
    private setupAudioListeners(): void {
        this.audioElement.onended = () => this.playNext();
        this.audioElement.ontimeupdate = () => {
            this.state.currentTime = this.audioElement.currentTime;
        };
    }

    /** Carga y reproduce una canción específica de la cola. */
    public playTrack(node: TrackNode<Track>): void {
        this.currentTrackNode = node;
        this.audioElement.src = node.trackData.audioUrl;
        this.audioElement.play();
        this.state.isPlaying = true;

        // Los navegadores suspenden el contexto hasta una interacción del usuario
        if (this.audioContext.state === "suspended") {
            this.audioContext.resume();
        }
    }

    /** Alterna entre reproducción y pausa. */
    public togglePlay(): void {
        if (this.state.isPlaying) {
            this.audioElement.pause();
        } else {
            this.audioElement.play();
        }
        this.state.isPlaying = !this.state.isPlaying;
    }

    /** Salta a la siguiente canción en la lista doblemente enlazada. */
    public playNext(): void {
        if (this.currentTrackNode?.nextTrack) {
            this.playTrack(this.currentTrackNode.nextTrack);
        }
    }

    /** Regresa a la canción anterior en la lista doblemente enlazada. */
    public playPrevious(): void {
        if (this.currentTrackNode?.previousTrack) {
            this.playTrack(this.currentTrackNode.previousTrack);
        }
    }

    /** Ajusta el volumen. El valor se normaliza al rango [0, 1]. */
    public setVolume(value: number): void {
        const volume = Math.max(0, Math.min(1, value));
        this.audioElement.volume = volume;
        this.state.volume = volume;
    }

    /** Retorna el AnalyserNode para que Visualizer pueda leer las frecuencias. */
    public getAnalyzer(): AnalyserNode {
        return this.analyzer;
    }

    /** Retorna una copia inmutable del estado actual de reproducción. */
    public getState(): PlaybackState {
        return { ...this.state };
    }

    /** Retorna el nodo de la pista que se está reproduciendo actualmente. */
    public getCurrentTrackNode(): TrackNode<Track> | null {
        return this.currentTrackNode;
    }

    /** Intervalo de actualización de UI recomendado en ms. */
    public static get UI_UPDATE_INTERVAL(): number {
        return UI_UPDATE_INTERVAL_MS;
    }
}
