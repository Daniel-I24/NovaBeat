import { PlaybackQueue } from "../assets/core/PlaybackQueue";
import { Track } from "../models/Track.model";

/**
 * Gestiona la carga de archivos de audio locales.
 * Usa blob URLs para reproducción inmediata sin servidor.
 */
export class UploadUI {
    private readonly queue: PlaybackQueue<Track>;
    private readonly onTracksAdded: () => void;

    constructor(queue: PlaybackQueue<Track>, onTracksAdded: () => void) {
        this.queue = queue;
        this.onTracksAdded = onTracksAdded;
        this.setup();
    }

    private setup(): void {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "audio/*";
        input.multiple = true;
        input.style.display = "none";
        document.body.appendChild(input);

        // Reemplazar el input del HTML con uno creado programáticamente
        // para evitar el doble disparo del evento change en algunos navegadores
        const htmlInput = document.getElementById("file-input");
        htmlInput?.replaceWith(input);
        input.id = "file-input";

        document.getElementById("upload-btn")?.addEventListener("click", () => input.click());

        input.addEventListener("change", (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (!files?.length) return;
            this.processFiles(Array.from(files));
            // Resetear usando un nuevo input para garantizar que change se dispare siempre
            input.value = "";
        });

        // Drag & drop
        const screen = document.getElementById("player-screen");
        screen?.addEventListener("dragover", (e) => { e.preventDefault(); screen.classList.add("drag-over"); });
        screen?.addEventListener("dragleave", () => screen.classList.remove("drag-over"));
        screen?.addEventListener("drop", (e: DragEvent) => {
            e.preventDefault();
            screen.classList.remove("drag-over");
            const files = Array.from(e.dataTransfer?.files ?? []).filter((f) => f.type.startsWith("audio/"));
            if (files.length) this.processFiles(files);
        });
    }

    private processFiles(files: File[]): void {
        let added = 0;
        for (const file of files) {
            if (!file.type.startsWith("audio/")) continue;
            const { title, artist } = this.parseName(file.name);
            // ID basado en nombre+tamaño para que sea estable entre sesiones
            const stableId = `local_${file.name}_${file.size}`.replace(/\s+/g, "_");
            this.queue.addToEnd({
                id: stableId,
                title,
                artist,
                album: "Biblioteca local",
                duration: 0,
                genre: "Local",
                coverUrl: "https://placehold.co/200x200/1a1a2e/7c6ff7?text=♪",
                audioUrl: URL.createObjectURL(file),
            });
            added++;
        }
        if (added > 0) this.onTracksAdded();
    }

    private parseName(fileName: string): { title: string; artist: string } {
        const name  = fileName.replace(/\.[^/.]+$/, "");
        const parts = name.split(" - ");
        return parts.length >= 2
            ? { artist: parts[0].trim(), title: parts[1].trim() }
            : { title: name, artist: "Artista desconocido" };
    }
}
