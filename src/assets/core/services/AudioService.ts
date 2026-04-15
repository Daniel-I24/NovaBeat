import { PlaybackQueue } from "../PlayBackQueue";
import { TrackNode } from "../TrackNode";
import { Track, PlaybackState } from "../models/Track.model";

/**
 * Servicio maestro de audio para NovaBeat.
 * Gestiona la reproducción, estados y navegación de la cola.
 */
export class AudioService {
    private audioContext: AudioContext;
    private audioElement: HTMLAudioElement;
    private trackSource: MediaElementAudioSourceNode;
    private analyzer: AnalyserNode;
    
    private queue: PlaybackQueue<Track>;
    private currentTrackNode: TrackNode<Track> | null = null;
    
    private state: PlaybackState = {
        isPlaying: false,
        currentTime: 0,
        volume: 0.5,
        isMuted: false
    };

    constructor(queue: PlaybackQueue<Track>) {
        this.queue = queue;
        this.audioElement = new Audio();
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Conexión para el visualizador de ondas
        this.trackSource = this.audioContext.createMediaElementSource(this.audioElement);
        this.analyzer = this.audioContext.createAnalyser();
        this.trackSource.connect(this.analyzer);
        this.analyzer.connect(this.audioContext.destination);

        this.setupAudioListeners();
    }

    /**
     * Configura los escuchadores de eventos nativos del elemento de audio.
     */
    private setupAudioListeners(): void {
        this.audioElement.onended = () => this.playNext();
        this.audioElement.ontimeupdate = () => {
            this.state.currentTime = this.audioElement.currentTime;
        };
    }

    /**
     * Carga y reproduce una canción específica de la cola.
     */
    public playTrack(node: TrackNode<Track>): void {
        this.currentTrackNode = node;
        this.audioElement.src = node.trackData.audioUrl;
        this.audioElement.play();
        this.state.isPlaying = true;
        
        // Resume el contexto de audio si estaba suspendido (política de navegadores)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    /**
     * Alterna entre reproducción y pausa.
     */
    public togglePlay(): void {
        if (this.state.isPlaying) {
            this.audioElement.pause();
        } else {
            this.audioElement.play();
        }
        this.state.isPlaying = !this.state.isPlaying;
    }

    /**
     * Salta a la siguiente canción usando la lógica de la lista doble.
     */
    public playNext(): void {
        if (this.currentTrackNode?.nextTrack) {
            this.playTrack(this.currentTrackNode.nextTrack);
        }
    }

    /**
     * Regresa a la canción anterior.
     */
    public playPrevious(): void {
        if (this.currentTrackNode?.previousTrack) {
            this.playTrack(this.currentTrackNode.previousTrack);
        }
    }

    /**
     * Ajusta el volumen con un rango de 0 a 1.
     */
    public setVolume(value: number): void {
        const volume = Math.max(0, Math.min(1, value));
        this.audioElement.volume = volume;
        this.state.volume = volume;
    }

    /**
     * Retorna el analizador para que el componente Visualizer pueda obtener los datos.
     */
    public getAnalyzer(): AnalyserNode {
        return this.analyzer;
    }

    public getState(): PlaybackState {
        return { ...this.state };
    }
}