import { Track } from "../models/Track.model";

/**
 * Catálogo inicial con canciones reales de Jamendo (Creative Commons).
 * Estas pistas tienen URLs de audio directas y funcionan sin archivos locales.
 *
 * Para agregar tus propias canciones:
 *   - Usa el botón "＋ Agregar música" para subir archivos desde tu PC
 *   - Usa "🔍 Buscar música" para buscar en el catálogo de Jamendo
 */
export const INITIAL_TRACKS: Track[] = [
    {
        id: "jamendo_1890762",
        title: "Acoustic Breeze",
        artist: "Benjamin Tissot",
        album: "Bensound",
        duration: 208,
        genre: "Acoustic",
        coverUrl: "https://placehold.co/200x200/0d0d1a/7c6ff7?text=♪",
        audioUrl: "https://www.bensound.com/bensound-music/bensound-acousticbreeze.mp3",
    },
    {
        id: "jamendo_1890763",
        title: "Creative Minds",
        artist: "Benjamin Tissot",
        album: "Bensound",
        duration: 120,
        genre: "Electronic",
        coverUrl: "https://placehold.co/200x200/0a0015/ff2d78?text=♪",
        audioUrl: "https://www.bensound.com/bensound-music/bensound-creativeminds.mp3",
    },
    {
        id: "jamendo_1890764",
        title: "Ukulele",
        artist: "Benjamin Tissot",
        album: "Bensound",
        duration: 162,
        genre: "Folk",
        coverUrl: "https://placehold.co/200x200/0f1f14/4ade80?text=♪",
        audioUrl: "https://www.bensound.com/bensound-music/bensound-ukulele.mp3",
    },
    {
        id: "jamendo_1890765",
        title: "Sunny",
        artist: "Benjamin Tissot",
        album: "Bensound",
        duration: 131,
        genre: "Pop",
        coverUrl: "https://placehold.co/200x200/1a0a00/ff7043?text=♪",
        audioUrl: "https://www.bensound.com/bensound-music/bensound-sunny.mp3",
    },
];
