import { PlaybackQueue } from "../assets/core/PlaybackQueue";
import { TrackNode } from "../assets/core/TrackNode";
import { Track, PlaybackState } from "../models/Track.model";

const UI_UPDATE_INTERVAL_MS = 500;
const DEFAULT_VOLUME = 0.7;

/**
 * Servicio de audio de NovaBeat.
 *
 * Arquitectura de audio:
 *   HTMLAudioElement  →  reproduce el audio (siempre conectado al destino del navegador)
 *   AudioContext      →  se crea SOLO cuando el visualizador lo solicita, en ese momento
 *                        se inserta en la cadena: AudioElement → Analyser → Destination
 *
 * Separar la creación del AudioContext del constructor evita el problema donde
 * createMediaElementSource() desconecta el audio del destino por defecto antes
 * de que el contexto esté listo, resultando en audio silencioso.
 */
export class AudioService {
    private readonly audioElement: HTMLAudioElement;

    // AudioContext y nodos — se inicializan lazy cuando el visualizador los pide
    private audioContext: AudioContext | null = null;
    private analyzer: AnalyserNode | null = null;
    private sourceConnected = false;

    private currentTrackNode: TrackNode<Track> | null = null;

    private state: PlaybackState = {
        isPlaying: false,
        currentTime: 0,
        volume: DEFAULT_VOLUME,
        isMuted: false,
    };

    constructor(_queue: PlaybackQueue<Track>) {
        this.audioElement = new Audio();
        this.audioElement.volume = DEFAULT_VOLUME;
        this.audioElement.crossOrigin = "anonymous"; // Necesario para Web Audio API con URLs externas
        this.setupListeners();
    }

    // ─── Reproducción ─────────────────────────────────────────────────────────

    /** Carga y reproduce una pista. Reanuda el AudioContext si existe. */
    public async playTrack(node: TrackNode<Track>): Promise<void> {
        this.currentTrackNode = node;
        this.audioElement.src = node.trackData.audioUrl;

        if (this.audioContext?.state === "suspended") {
            await this.audioContext.resume();
        }

        try {
            await this.audioElement.play();
            this.state.isPlaying = true;
        } catch (err) {
            console.error("NovaBeat: Error al reproducir:", err);
            this.state.isPlaying = false;
        }
    }

    /** Alterna entre play y pause. */
    public async togglePlay(): Promise<void> {
        if (this.state.isPlaying) {
            this.audioElement.pause();
            this.state.isPlaying = false;
        } else {
            if (this.audioContext?.state === "suspended") {
                await this.audioContext.resume();
            }
            try {
                await this.audioElement.play();
                this.state.isPlaying = true;
            } catch (err) {
                console.error("NovaBeat: Error al reanudar:", err);
            }
        }
    }

    public async playNext(): Promise<void> {
        if (this.currentTrackNode?.nextTrack) {
            await this.playTrack(this.currentTrackNode.nextTrack);
        }
    }

    public async playPrevious(): Promise<void> {
        if (this.currentTrackNode?.previousTrack) {
            await this.playTrack(this.currentTrackNode.previousTrack);
        }
    }

    public setVolume(value: number): void {
        const volume = Math.max(0, Math.min(1, value));
        this.audioElement.volume = volume;
        this.state.volume = volume;
    }

    // ─── Web Audio API (lazy) ─────────────────────────────────────────────────

    /**
     * Inicializa el AudioContext y conecta el AnalyserNode.
     * Se llama SOLO desde Visualizer, después de una interacción del usuario.
     * Retorna el AnalyserNode para que Visualizer lea las frecuencias.
     */
    public getAnalyzer(): AnalyserNode {
        if (this.analyzer) return this.analyzer;

        const AudioContextClass =
            window.AudioContext ??
            (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

        if (!AudioContextClass) {
            throw new Error("NovaBeat: Web Audio API no soportada en este navegador.");
        }

        this.audioContext = new AudioContextClass();
        this.analyzer = this.audioContext.createAnalyser();
        this.analyzer.fftSize = 512; // Más eficiente que el default 2048

        // Conectar solo una vez
        if (!this.sourceConnected) {
            const source = this.audioContext.createMediaElementSource(this.audioElement);
            source.connect(this.analyzer);
            this.analyzer.connect(this.audioContext.destination);
            this.sourceConnected = true;
        }

        return this.analyzer;
    }

    // ─── Estado ───────────────────────────────────────────────────────────────

    public getState(): PlaybackState {
        return { ...this.state };
    }

    public getCurrentTrackNode(): TrackNode<Track> | null {
        return this.currentTrackNode;
    }

    public static get UI_UPDATE_INTERVAL(): number {
        return UI_UPDATE_INTERVAL_MS;
    }

    // ─── Privados ─────────────────────────────────────────────────────────────

    private setupListeners(): void {
        this.audioElement.onended = () => {
            void this.playNext();
        };
        this.audioElement.ontimeupdate = () => {
            this.state.currentTime = this.audioElement.currentTime;
        };
    }
}
