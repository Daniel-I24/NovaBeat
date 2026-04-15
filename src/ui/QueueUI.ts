import { PlaybackQueue } from "../assets/core/PlaybackQueue";
import { Track } from "../models/Track.model";

/**
 * Maneja la interacción avanzada de la lista de cola, incluyendo el reordenamiento.
 */
export class QueueUI {
    private queue: PlaybackQueue<Track>;
    private listElement: HTMLElement;
    private draggedItemIndex: number | null = null;

    constructor(queue: PlaybackQueue<Track>) {
        this.queue = queue;
        this.listElement = document.getElementById('playback-queue-list')!;
        this.setupDragAndDrop();
    }

    /**
     * Configura los listeners nativos para el arrastre de elementos.
     */
    private setupDragAndDrop(): void {
        this.listElement.addEventListener('dragstart', (e: any) => {
            this.draggedItemIndex = Array.from(this.listElement.children).indexOf(e.target);
            e.target.style.opacity = '0.5';
        });

        this.listElement.addEventListener('dragend', (e: any) => {
            e.target.style.opacity = '1';
        });

        this.listElement.addEventListener('dragover', (e: DragEvent) => {
            e.preventDefault(); // Permite soltar
        });

        this.listElement.addEventListener('drop', (e: any) => {
            e.preventDefault();
            const targetIndex = Array.from(this.listElement.children).indexOf(e.target.closest('li'));
            
            if (this.draggedItemIndex !== null && targetIndex !== -1) {
                this.reorderQueue(this.draggedItemIndex, targetIndex);
            }
        });
    }

    /**
     * Reorganiza la lógica de la lista doblemente enlazada tras el arrastre.
     */
    private reorderQueue(oldIndex: number, newIndex: number): void {
        const nodeToMove = this.queue.getTrackNodeByIndex(oldIndex);
        if (!nodeToMove) return;

        const trackData = nodeToMove.trackData;
        
        // Eliminamos de la posición vieja y agregamos en la nueva
        this.queue.removeTrack(nodeToMove);
        this.queue.insertAtPosition(newIndex, trackData);

        console.log(`NovaBeat: Track moved from ${oldIndex} to ${newIndex}`);
        // Aquí llamaríamos a PlayerUI.renderQueue() para refrescar la vista
    }
}