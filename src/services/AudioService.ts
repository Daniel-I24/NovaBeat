import { PlaybackQueue } from "../assets/core/PlaybackQueue";
import { TrackNode } from "../assets/core/TrackNode";
import { Track, PlaybackState } from "../models/Track.model";

/** Modos de reproducción */
export type PlayMode = "normal" | "repeat-one" | "shuffle";

const UI_UPDATE_INTERVAL_MS = 250;
const DEFAULT_VOLUME = 0.7;

/**
 * Servicio de audio de NovaBeat.
 * Soporta modos: normal, repetir canción y aleatorio.
 */
export class AudioService {
    private readonly audioElement: HTMLAudioElement;
    private readonly queue: PlaybackQueue<Track>;
    private audioContext: AudioContext | null = null;
    private analyzer: AnalyserNode | null = null;
    private sourceConnected = false;
    private currentTrackNode: TrackNode<Track> | null = null;
    private playMode: PlayMode = "normal";

    private state: PlaybackState = {
        isPlaying: false,
        currentTime: 0,
        volume: DEFAULT_VOLUME,
        isMuted: false,
    };

    constructor(queue: PlaybackQueue<Track>) {
        this.queue = queue;
        this.audioElement = new Audio();
        this.audioElement.volume = DEFAULT_VOLUME;
        this.audioElement.preload = "metadata";
        // crossOrigin debe estar antes de cualquier src para que Web Audio API funcione
        // sin bloquear la reproducción normal
        this.audioElement.crossOrigin = "anonymous";
        this.setupListeners();
    }

    // ─── Reproducción ─────────────────────────────────────────────────────────

    public async playTrack(node: TrackNode<Track>): Promise<void> {
        this.currentTrackNode = node;
        this.audioElement.src = node.trackData.audioUrl;
        await this.resumeContext();
        try {
            await this.audioElement.play();
            this.state.isPlaying = true;
        } catch (err) {
            console.error("NovaBeat: Error al reproducir:", err);
            this.state.isPlaying = false;
        }
    }

    public async togglePlay(): Promise<void> {
        if (this.audioElement.paused) {
            await this.resumeContext();
            try {
                await this.audioElement.play();
                this.state.isPlaying = true;
            } catch { /* silencioso */ }
        } else {
            this.audioElement.pause();
            this.state.isPlaying = false;
        }
    }

    /** Salta a un tiempo específico en segundos. */
    public seekTo(seconds: number): void {
        if (!isFinite(seconds)) return;
        this.audioElement.currentTime = Math.max(0, Math.min(seconds, this.audioElement.duration || 0));
    }

    public async playNext(): Promise<void> {
        if (this.playMode === "repeat-one" && this.currentTrackNode) {
            // Repetir la misma canción desde el inicio
            this.audioElement.currentTime = 0;
            await this.audioElement.play();
            return;
        }
        if (this.playMode === "shuffle") {
            await this.playRandom();
            return;
        }
        if (this.currentTrackNode?.nextTrack) await this.playTrack(this.currentTrackNode.nextTrack);
    }

    public async playPrevious(): Promise<void> {
        // Si llevamos más de 3 segundos, reiniciar la canción actual
        if (this.audioElement.currentTime > 3) {
            this.audioElement.currentTime = 0;
            return;
        }
        if (this.playMode === "shuffle") {
            await this.playRandom();
            return;
        }
        if (this.currentTrackNode?.previousTrack) await this.playTrack(this.currentTrackNode.previousTrack);
    }

    /** Cicla entre los modos: normal → repeat-one → shuffle → normal */
    public cyclePlayMode(): PlayMode {
        const modes: PlayMode[] = ["normal", "repeat-one", "shuffle"];
        const next = modes[(modes.indexOf(this.playMode) + 1) % modes.length];
        this.playMode = next;
        return next;
    }

    public getPlayMode(): PlayMode { return this.playMode; }

    private async playRandom(): Promise<void> {
        const size = this.queue.getQueueSize();
        if (size === 0) return;
        const randomIndex = Math.floor(Math.random() * size);
        const node = this.queue.getTrackNodeByIndex(randomIndex);
        if (node) await this.playTrack(node);
    }

    public stop(): void {
        this.audioElement.pause();
        this.audioElement.src = "";
        this.state = { isPlaying: false, currentTime: 0, volume: this.state.volume, isMuted: false };
        this.currentTrackNode = null;
    }

    public setVolume(value: number): void {
        const v = Math.max(0, Math.min(1, value));
        this.audioElement.volume = v;
        this.state.volume = v;
    }

    // ─── Web Audio API (lazy) ─────────────────────────────────────────────────

    public getAnalyzer(): AnalyserNode {
        if (this.analyzer) return this.analyzer;

        const Ctx = window.AudioContext ??
            (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctx) throw new Error("Web Audio API no soportada.");

        this.audioContext = new Ctx();
        this.analyzer = this.audioContext.createAnalyser();
        this.analyzer.fftSize = 128;

        if (!this.sourceConnected) {
            const src = this.audioContext.createMediaElementSource(this.audioElement);
            src.connect(this.analyzer);
            this.analyzer.connect(this.audioContext.destination);
            this.sourceConnected = true;
        }
        return this.analyzer;
    }

    // ─── Estado ───────────────────────────────────────────────────────────────

    public getState(): PlaybackState {
        // Leer directamente del elemento para máxima precisión
        return {
            isPlaying: !this.audioElement.paused && !this.audioElement.ended,
            currentTime: this.audioElement.currentTime,
            volume: this.audioElement.volume,
            isMuted: this.audioElement.muted,
        };
    }

    public getDuration(): number { return this.audioElement.duration || 0; }

    public getCurrentTrackNode(): TrackNode<Track> | null { return this.currentTrackNode; }

    public static get UI_UPDATE_INTERVAL(): number { return UI_UPDATE_INTERVAL_MS; }

    // ─── Privados ─────────────────────────────────────────────────────────────

    private async resumeContext(): Promise<void> {
        if (this.audioContext?.state === "suspended") await this.audioContext.resume();
    }

    private setupListeners(): void {
        this.audioElement.onended = () => void this.playNext();
        this.audioElement.ontimeupdate = () => { this.state.currentTime = this.audioElement.currentTime; };
    }
}
