import { PlaybackQueue } from "../assets/core/PlaybackQueue";
import { Track } from "../models/Track.model";

/**
 * Gestiona la interacción de arrastrar y soltar en la lista de reproducción.
 * Se comunica con PlayerUI a través de un callback para refrescar la vista.
 */
export class QueueUI {
    private readonly queue: PlaybackQueue<Track>;
    private readonly listElement: HTMLElement;
    private readonly onReorder: () => void;
    private draggedItemIndex: number | null = null;

    /**
     * @param queue Cola de reproducción a manipular.
     * @param onReorder Callback que se ejecuta tras cada reordenamiento para refrescar la UI.
     */
    constructor(queue: PlaybackQueue<Track>, onReorder: () => void) {
        this.queue = queue;
        this.onReorder = onReorder;

        const listEl = document.getElementById("playback-queue-list");
        if (!listEl) throw new Error("NovaBeat: Elemento #playback-queue-list no encontrado.");
        this.listElement = listEl;

        this.setupDragAndDrop();
    }

    // ─── Drag & Drop ─────────────────────────────────────────────────────────

    private setupDragAndDrop(): void {
        this.listElement.addEventListener("dragstart", (e: DragEvent) => {
            const target = e.target as HTMLElement;
            this.draggedItemIndex = Array.from(this.listElement.children).indexOf(target);
            target.style.opacity = "0.5";
        });

        this.listElement.addEventListener("dragend", (e: DragEvent) => {
            (e.target as HTMLElement).style.opacity = "1";
        });

        this.listElement.addEventListener("dragover", (e: DragEvent) => {
            e.preventDefault();
        });

        this.listElement.addEventListener("drop", (e: DragEvent) => {
            e.preventDefault();
            const dropTarget = (e.target as HTMLElement).closest("li");
            if (!dropTarget) return;

            const targetIndex = Array.from(this.listElement.children).indexOf(dropTarget);

            if (this.draggedItemIndex !== null && targetIndex !== -1) {
                this.reorderQueue(this.draggedItemIndex, targetIndex);
            }
        });
    }

    /** Mueve un nodo de oldIndex a newIndex en la lista doblemente enlazada. */
    private reorderQueue(oldIndex: number, newIndex: number): void {
        const nodeToMove = this.queue.getTrackNodeByIndex(oldIndex);
        if (!nodeToMove) return;

        const trackData = nodeToMove.trackData;
        this.queue.removeTrack(nodeToMove);
        this.queue.insertAtPosition(newIndex, trackData);

        // Notificamos a PlayerUI para que re-renderice la lista
        this.onReorder();
    }
}
