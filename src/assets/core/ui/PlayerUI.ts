import { AudioService } from "../services/AudioService";
import { PlaybackQueue } from "../PlayBackQueue";
import { Track } from "../models/Track.model";
import { TrackNode } from "../TrackNode";

/**
 * Controlador de la interfaz del reproductor NovaBeat.
 * Gestiona eventos de botones, barra de progreso y renderizado de la cola.
 */
export class PlayerUI {
    private audioService: AudioService;
    private queue: PlaybackQueue<Track>;
    
    // Elementos del DOM
    private playBtn = document.getElementById('play-pause-btn') as HTMLButtonElement;
    private progressBar = document.getElementById('progress-bar') as HTMLInputElement;
    private trackTitle = document.getElementById('current-title') as HTMLElement;
    private trackArtist = document.getElementById('current-artist') as HTMLElement;
    private trackCover = document.getElementById('current-cover') as HTMLImageElement;
    private queueList = document.getElementById('playback-queue-list') as HTMLElement;

    constructor(audioService: AudioService, queue: PlaybackQueue<Track>) {
        this.audioService = audioService;
        this.queue = queue;
        
        this.initializeEvents();
        this.startUIUpdater();
        this.renderQueue();
    }

    /**
     * Vincula los eventos de los controles de NovaBeat.
     */
    private initializeEvents(): void {
        this.playBtn.addEventListener('click', () => {
            this.audioService.togglePlay();
            this.updatePlayButtonIcon();
        });

        document.getElementById('next-btn')?.addEventListener('click', () => {
            this.audioService.playNext();
            this.updateTrackInfo();
        });

        document.getElementById('prev-btn')?.addEventListener('click', () => {
            this.audioService.playPrevious();
            this.updateTrackInfo();
        });

        // Barra de progreso interactiva
        this.progressBar.addEventListener('input', () => {
            // Lógica para saltar a un tiempo específico de la canción
            console.log("NovaBeat: Seeking to...", this.progressBar.value);
        });
    }

    /**
     * Actualiza la información visual (título, artista, carátula).
     */
    public updateTrackInfo(): void {
        const state = this.audioService.getState();
        // Aquí obtendríamos la data del nodo actual desde el AudioService
        // Por ahora simulamos la actualización
        this.renderQueue(); // Re-renderizamos para marcar la activa
    }

    private updatePlayButtonIcon(): void {
        const isPlaying = this.audioService.getState().isPlaying;
        this.playBtn.innerHTML = isPlaying ? '⏸' : '▶';
    }

    /**
     * Ciclo de actualización para la barra de progreso y tiempos.
     */
    private startUIUpdater(): void {
        setInterval(() => {
            const state = this.audioService.getState();
            if (state.isPlaying) {
                this.progressBar.value = state.currentTime.toString();
                // Actualizar textos de tiempo (0:00)
            }
        }, 500);
    }

    /**
     * Renderiza la cola de reproducción usando la lista doblemente enlazada.
     */
    public renderQueue(): void {
        this.queueList.innerHTML = '';
        let current = this.queue.getFirstTrack();
        let index = 0;

        while (current) {
            const li = document.createElement('li');
            li.className = 'queue-item glass-panel';
            li.draggable = true; // Para la función de Drag & Drop
            li.innerHTML = `
                <div class="track-mini-info">
                    <span class="index">${index + 1}</span>
                    <div>
                        <p class="title">${current.trackData.title}</p>
                        <p class="artist">${current.trackData.artist}</p>
                    </div>
                </div>
            `;
            
            // Evento para reproducir al hacer clic en la lista
            const targetNode = current;
            li.onclick = () => {
                this.audioService.playTrack(targetNode);
                this.updateTrackInfo();
                this.updatePlayButtonIcon();
            };

            this.queueList.appendChild(li);
            current = current.nextTrack;
            index++;
        }
    }
}