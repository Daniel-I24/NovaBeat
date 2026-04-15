import { PlaybackQueue } from "../assets/core/PlaybackQueue";
import { Track } from "../models/Track.model";

/**
 * Gestiona la carga de archivos de audio locales desde el PC del usuario.
 * Crea URLs de objeto temporal (blob) para reproducción inmediata sin servidor.
 */
export class UploadUI {
    private readonly queue: PlaybackQueue<Track>;
    private readonly onTracksAdded: () => void;

    constructor(queue: PlaybackQueue<Track>, onTracksAdded: () => void) {
        this.queue = queue;
        this.onTracksAdded = onTracksAdded;
        this.setupUploadButton();
    }

    private setupUploadButton(): void {
        const btn = document.getElementById("upload-btn");
        const input = document.getElementById("file-input") as HTMLInputElement | null;

        btn?.addEventListener("click", () => input?.click());

        input?.addEventListener("change", () => {
            const files = input.files;
            if (!files || files.length === 0) return;
            this.processFiles(Array.from(files));
            input.value = ""; // Permite volver a subir el mismo archivo
        });

        // Drag & drop sobre toda la pantalla del reproductor
        const playerScreen = document.getElementById("player-screen");
        playerScreen?.addEventListener("dragover", (e) => {
            e.preventDefault();
            playerScreen.classList.add("drag-over");
        });

        playerScreen?.addEventListener("dragleave", () => {
            playerScreen.classList.remove("drag-over");
        });

        playerScreen?.addEventListener("drop", (e: DragEvent) => {
            e.preventDefault();
            playerScreen.classList.remove("drag-over");
            const files = Array.from(e.dataTransfer?.files ?? []).filter(
                (f) => f.type.startsWith("audio/")
            );
            if (files.length > 0) this.processFiles(files);
        });
    }

    /**
     * Convierte archivos de audio en Track objects usando blob URLs.
     * Lee los metadatos del nombre del archivo como fallback.
     */
    private processFiles(files: File[]): void {
        files.forEach((file) => {
            if (!file.type.startsWith("audio/")) return;

            const blobUrl = URL.createObjectURL(file);
            const { title, artist } = this.parseFileName(file.name);

            const track: Track = {
                id: crypto.randomUUID(),
                title,
                artist,
                album: "Biblioteca local",
                duration: 0, // Se actualiza cuando el audio carga
                genre: "Local",
                coverUrl: "https://placehold.co/200x200/1a1a2e/7c6ff7?text=♪",
                audioUrl: blobUrl,
            };

            this.queue.addToEnd(track);
        });

        this.onTracksAdded();
    }

    /**
     * Intenta extraer título y artista del nombre del archivo.
     * Soporta el formato "Artista - Título.mp3".
     */
    private parseFileName(fileName: string): { title: string; artist: string } {
        const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
        const parts = nameWithoutExt.split(" - ");

        if (parts.length >= 2) {
            return { artist: parts[0].trim(), title: parts[1].trim() };
        }

        return { title: nameWithoutExt, artist: "Artista desconocido" };
    }
}
