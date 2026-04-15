/**
 * Definición de un tema visual de NovaBeat.
 */
export interface Theme {
    id: string;
    name: string;
    font: string;
    vars: Record<string, string>;
}

/** Catálogo de temas disponibles */
export const THEMES: Theme[] = [
    {
        id: "midnight-dark",
        name: "🌙 Midnight Dark",
        font: "'Inter', sans-serif",
        vars: {
            "--bg-main": "#0d0d1a",
            "--bg-secondary": "#13132b",
            "--accent": "#7c6ff7",
            "--accent-soft": "rgba(124, 111, 247, 0.15)",
            "--glass": "rgba(255, 255, 255, 0.05)",
            "--glass-border": "rgba(255, 255, 255, 0.1)",
            "--text-primary": "#e8e8ff",
            "--text-secondary": "#8888aa",
            "--shadow-main": "0 20px 60px rgba(0, 0, 0, 0.5)",
            "--shadow-inner": "inset 0 1px 0 rgba(255,255,255,0.05)",
            "--scrollbar-thumb": "rgba(124, 111, 247, 0.4)",
        },
    },
    {
        id: "neon-synthwave",
        name: "⚡ Neon Synthwave",
        font: "'Rajdhani', sans-serif",
        vars: {
            "--bg-main": "#0a0015",
            "--bg-secondary": "#110022",
            "--accent": "#ff2d78",
            "--accent-soft": "rgba(255, 45, 120, 0.15)",
            "--glass": "rgba(255, 45, 120, 0.05)",
            "--glass-border": "rgba(0, 255, 255, 0.2)",
            "--text-primary": "#ffffff",
            "--text-secondary": "#cc88ff",
            "--shadow-main": "0 0 40px rgba(255, 45, 120, 0.3)",
            "--shadow-inner": "inset 0 1px 0 rgba(0,255,255,0.1)",
            "--scrollbar-thumb": "rgba(255, 45, 120, 0.5)",
        },
    },
    {
        id: "soft-minimalist",
        name: "☁️ Soft Minimalist",
        font: "'Poppins', sans-serif",
        vars: {
            "--bg-main": "#f0f3f7",
            "--bg-secondary": "#e8ecf2",
            "--accent": "#6c5ce7",
            "--accent-soft": "rgba(108, 92, 231, 0.1)",
            "--glass": "rgba(255, 255, 255, 0.6)",
            "--glass-border": "rgba(255, 255, 255, 0.4)",
            "--text-primary": "#2d3436",
            "--text-secondary": "#636e72",
            "--shadow-main": "0 15px 35px rgba(0, 0, 0, 0.08)",
            "--shadow-inner": "inset 5px 5px 10px rgba(0,0,0,0.02)",
            "--scrollbar-thumb": "rgba(108, 92, 231, 0.3)",
        },
    },
    {
        id: "forest-calm",
        name: "🌿 Forest Calm",
        font: "'Nunito', sans-serif",
        vars: {
            "--bg-main": "#0f1f14",
            "--bg-secondary": "#162a1c",
            "--accent": "#4ade80",
            "--accent-soft": "rgba(74, 222, 128, 0.12)",
            "--glass": "rgba(74, 222, 128, 0.05)",
            "--glass-border": "rgba(74, 222, 128, 0.15)",
            "--text-primary": "#e2f5e8",
            "--text-secondary": "#7aad8a",
            "--shadow-main": "0 20px 50px rgba(0, 0, 0, 0.4)",
            "--shadow-inner": "inset 0 1px 0 rgba(74,222,128,0.08)",
            "--scrollbar-thumb": "rgba(74, 222, 128, 0.35)",
        },
    },
    {
        id: "sunset-warm",
        name: "🌅 Sunset Warm",
        font: "'Lato', sans-serif",
        vars: {
            "--bg-main": "#1a0a00",
            "--bg-secondary": "#2a1200",
            "--accent": "#ff7043",
            "--accent-soft": "rgba(255, 112, 67, 0.15)",
            "--glass": "rgba(255, 112, 67, 0.06)",
            "--glass-border": "rgba(255, 180, 100, 0.2)",
            "--text-primary": "#fff3e0",
            "--text-secondary": "#ffab76",
            "--shadow-main": "0 20px 50px rgba(255, 80, 0, 0.2)",
            "--shadow-inner": "inset 0 1px 0 rgba(255,180,100,0.1)",
            "--scrollbar-thumb": "rgba(255, 112, 67, 0.4)",
        },
    },
    {
        id: "ocean-deep",
        name: "🌊 Ocean Deep",
        font: "'Quicksand', sans-serif",
        vars: {
            "--bg-main": "#020c18",
            "--bg-secondary": "#041525",
            "--accent": "#00b4d8",
            "--accent-soft": "rgba(0, 180, 216, 0.12)",
            "--glass": "rgba(0, 180, 216, 0.05)",
            "--glass-border": "rgba(0, 180, 216, 0.15)",
            "--text-primary": "#caf0f8",
            "--text-secondary": "#5aafcc",
            "--shadow-main": "0 20px 60px rgba(0, 0, 0, 0.6)",
            "--shadow-inner": "inset 0 1px 0 rgba(0,180,216,0.08)",
            "--scrollbar-thumb": "rgba(0, 180, 216, 0.35)",
        },
    },
];

/**
 * Servicio de temas visuales de NovaBeat.
 * Aplica variables CSS y fuentes dinámicamente según el tema seleccionado.
 */
export class ThemeService {
    private readonly styleElement: HTMLStyleElement;
    private readonly fontLink: HTMLLinkElement;
    private currentTheme: Theme;

    constructor() {
        this.styleElement = document.createElement("style");
        this.styleElement.id = "novabeat-theme-engine";
        document.head.appendChild(this.styleElement);

        this.fontLink = document.createElement("link");
        this.fontLink.rel = "stylesheet";
        document.head.appendChild(this.fontLink);

        this.currentTheme = THEMES[0]; // Midnight Dark por defecto
        this.applyBaseStyles();
        this.applyTheme(this.currentTheme.id);
    }

    /** Aplica un tema por su ID. */
    public applyTheme(themeId: string): void {
        const theme = THEMES.find((t) => t.id === themeId) ?? THEMES[0];
        this.currentTheme = theme;

        const root = document.documentElement;
        Object.entries(theme.vars).forEach(([key, value]) => {
            root.style.setProperty(key, value);
        });

        // Fuente dinámica según el tema
        root.style.setProperty("--font-main", theme.font);
        this.loadFont(theme.font);
    }

    public getCurrentTheme(): Theme {
        return this.currentTheme;
    }

    public getThemes(): Theme[] {
        return THEMES;
    }

    /** Actualiza el color de acento dinámicamente (p.ej. según portada del álbum). */
    public setDynamicAccent(hexColor: string): void {
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);
        document.documentElement.style.setProperty("--accent", hexColor);
        document.documentElement.style.setProperty("--accent-soft", `rgba(${r}, ${g}, ${b}, 0.15)`);
    }

    // ─── Privados ─────────────────────────────────────────────────────────────

    private loadFont(fontFamily: string): void {
        const name = fontFamily.replace(/'/g, "").split(",")[0].trim().replace(/ /g, "+");
        this.fontLink.href = `https://fonts.googleapis.com/css2?family=${name}:wght@300;400;600;700&display=swap`;
    }

    private applyBaseStyles(): void {
        this.styleElement.innerHTML = `
            /* ── Transición suave al cambiar de tema ── */
            *, *::before, *::after {
                transition: background-color 0.4s ease, color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
                box-sizing: border-box;
                margin: 0; padding: 0;
            }

            :root { --font-main: 'Inter', sans-serif; }

            body {
                background: var(--bg-main);
                color: var(--text-primary);
                font-family: var(--font-main);
                height: 100vh;
                display: flex;
                justify-content: center;
                align-items: center;
                overflow: hidden;
                -webkit-font-smoothing: antialiased;
            }

            /* ── Glassmorphism ── */
            .glass-panel {
                background: var(--glass);
                backdrop-filter: blur(24px);
                -webkit-backdrop-filter: blur(24px);
                border: 1px solid var(--glass-border);
                border-radius: 24px;
                box-shadow: var(--shadow-main);
            }

            /* ── Layout principal ── */
            #app-container {
                width: 100vw;
                height: 100vh;
                display: flex;
                justify-content: center;
                align-items: center;
                position: relative;
                overflow: hidden;
            }

            /* ── Fondo animado ── */
            #app-container::before {
                content: '';
                position: absolute;
                width: 600px; height: 600px;
                background: radial-gradient(circle, var(--accent-soft) 0%, transparent 70%);
                top: -200px; right: -200px;
                border-radius: 50%;
                pointer-events: none;
                animation: pulse 8s ease-in-out infinite;
            }
            #app-container::after {
                content: '';
                position: absolute;
                width: 400px; height: 400px;
                background: radial-gradient(circle, var(--accent-soft) 0%, transparent 70%);
                bottom: -150px; left: -150px;
                border-radius: 50%;
                pointer-events: none;
                animation: pulse 8s ease-in-out infinite reverse;
            }

            @keyframes pulse {
                0%, 100% { transform: scale(1); opacity: 0.6; }
                50% { transform: scale(1.2); opacity: 1; }
            }

            /* ── Pantalla de Auth ── */
            #auth-screen {
                display: flex;
                justify-content: center;
                align-items: center;
                width: 100%;
                height: 100%;
                z-index: 10;
                position: relative;
            }

            .auth-card {
                width: 420px;
                padding: 48px 40px;
                display: flex;
                flex-direction: column;
                gap: 0;
            }

            .auth-logo {
                font-size: 2.2rem;
                font-weight: 700;
                color: var(--accent);
                letter-spacing: -1px;
                margin-bottom: 6px;
            }

            .auth-subtitle {
                color: var(--text-secondary);
                font-size: 0.9rem;
                margin-bottom: 36px;
            }

            .auth-form {
                display: flex;
                flex-direction: column;
                gap: 14px;
            }

            .soft-input {
                background: var(--glass);
                border: 1px solid var(--glass-border);
                color: var(--text-primary);
                padding: 14px 18px;
                border-radius: 14px;
                outline: none;
                font-size: 0.95rem;
                font-family: var(--font-main);
                transition: border-color 0.2s, box-shadow 0.2s;
            }

            .soft-input::placeholder { color: var(--text-secondary); }

            .soft-input:focus {
                border-color: var(--accent);
                box-shadow: 0 0 0 3px var(--accent-soft);
            }

            .soft-button {
                background: var(--accent);
                color: #fff;
                border: none;
                padding: 15px;
                border-radius: 14px;
                font-weight: 600;
                font-size: 0.95rem;
                font-family: var(--font-main);
                cursor: pointer;
                transition: transform 0.2s, box-shadow 0.2s, filter 0.2s;
                box-shadow: 0 8px 24px var(--accent-soft);
                margin-top: 4px;
            }

            .soft-button:hover {
                transform: translateY(-2px);
                filter: brightness(1.1);
                box-shadow: 0 12px 28px var(--accent-soft);
            }

            .soft-button:active { transform: translateY(0); }

            .google-button {
                background: var(--glass);
                color: var(--text-primary);
                border: 1px solid var(--glass-border);
                padding: 14px;
                border-radius: 14px;
                font-weight: 500;
                font-size: 0.95rem;
                font-family: var(--font-main);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                transition: background 0.2s, border-color 0.2s;
            }

            .google-button:hover {
                background: var(--accent-soft);
                border-color: var(--accent);
            }

            .auth-divider {
                display: flex;
                align-items: center;
                gap: 12px;
                color: var(--text-secondary);
                font-size: 0.8rem;
                margin: 4px 0;
            }

            .auth-divider::before, .auth-divider::after {
                content: '';
                flex: 1;
                height: 1px;
                background: var(--glass-border);
            }

            .auth-toggle {
                text-align: center;
                color: var(--text-secondary);
                font-size: 0.85rem;
                margin-top: 8px;
            }

            .auth-toggle span {
                color: var(--accent);
                cursor: pointer;
                font-weight: 600;
            }

            .auth-toggle span:hover { text-decoration: underline; }

            .auth-error {
                color: #ff6b6b;
                font-size: 0.82rem;
                min-height: 1.1em;
                text-align: center;
            }

            /* ── Pantalla del Reproductor ── */
            #player-screen {
                width: 95vw;
                max-width: 1300px;
                height: 90vh;
                display: flex;
                flex-direction: column;
                gap: 16px;
                z-index: 10;
                position: relative;
            }

            /* ── Header ── */
            .player-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 24px;
            }

            .header-left {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .app-logo {
                font-size: 1.4rem;
                font-weight: 700;
                color: var(--accent);
                letter-spacing: -0.5px;
            }

            .user-greeting {
                color: var(--text-secondary);
                font-size: 0.88rem;
            }

            .user-avatar {
                width: 34px; height: 34px;
                border-radius: 50%;
                object-fit: cover;
                border: 2px solid var(--accent);
            }

            .header-right {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            /* ── Theme Picker ── */
            .theme-picker {
                display: flex;
                gap: 6px;
                align-items: center;
            }

            .theme-dot {
                width: 22px; height: 22px;
                border-radius: 50%;
                cursor: pointer;
                border: 2px solid transparent;
                transition: transform 0.2s, border-color 0.2s;
                position: relative;
            }

            .theme-dot:hover { transform: scale(1.2); }
            .theme-dot.active { border-color: var(--text-primary); transform: scale(1.15); }

            .theme-dot[data-theme="midnight-dark"] { background: linear-gradient(135deg, #0d0d1a, #7c6ff7); }
            .theme-dot[data-theme="neon-synthwave"] { background: linear-gradient(135deg, #0a0015, #ff2d78); }
            .theme-dot[data-theme="soft-minimalist"] { background: linear-gradient(135deg, #f0f3f7, #6c5ce7); }
            .theme-dot[data-theme="forest-calm"]     { background: linear-gradient(135deg, #0f1f14, #4ade80); }
            .theme-dot[data-theme="sunset-warm"]     { background: linear-gradient(135deg, #1a0a00, #ff7043); }
            .theme-dot[data-theme="ocean-deep"]      { background: linear-gradient(135deg, #020c18, #00b4d8); }

            .icon-btn {
                background: var(--glass);
                border: 1px solid var(--glass-border);
                color: var(--text-secondary);
                padding: 8px 16px;
                border-radius: 10px;
                cursor: pointer;
                font-size: 0.82rem;
                font-family: var(--font-main);
                transition: color 0.2s, border-color 0.2s;
            }

            .icon-btn:hover { color: var(--text-primary); border-color: var(--accent); }

            /* ── Contenido principal ── */
            .player-body {
                display: grid;
                grid-template-columns: 1fr 360px;
                gap: 16px;
                flex: 1;
                overflow: hidden;
            }

            /* ── Now Playing ── */
            .now-playing {
                padding: 32px;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
            }

            .album-art-wrapper {
                display: flex;
                justify-content: center;
                margin-bottom: 24px;
            }

            #current-cover {
                width: 200px; height: 200px;
                border-radius: 20px;
                object-fit: cover;
                box-shadow: 0 20px 60px var(--accent-soft);
                transition: transform 0.3s ease;
            }

            #current-cover:hover { transform: scale(1.03); }

            .track-info {
                text-align: center;
                margin-bottom: 20px;
            }

            #current-title {
                font-size: 1.4rem;
                font-weight: 700;
                color: var(--text-primary);
                margin-bottom: 4px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            #current-artist {
                color: var(--text-secondary);
                font-size: 0.95rem;
            }

            /* ── Progress ── */
            .progress-area { margin-bottom: 16px; }

            .time-info {
                display: flex;
                justify-content: space-between;
                color: var(--text-secondary);
                font-size: 0.78rem;
                margin-top: 6px;
            }

            input[type="range"] {
                -webkit-appearance: none;
                width: 100%;
                height: 4px;
                background: var(--glass-border);
                border-radius: 4px;
                outline: none;
                cursor: pointer;
            }

            input[type="range"]::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 14px; height: 14px;
                background: var(--accent);
                border-radius: 50%;
                cursor: pointer;
                transition: transform 0.15s;
            }

            input[type="range"]::-webkit-slider-thumb:hover { transform: scale(1.3); }

            /* ── Controles ── */
            .controls {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 20px;
            }

            .control-btn {
                background: var(--glass);
                border: 1px solid var(--glass-border);
                color: var(--text-primary);
                width: 48px; height: 48px;
                border-radius: 50%;
                display: flex;
                justify-content: center;
                align-items: center;
                font-size: 1.1rem;
                cursor: pointer;
                transition: transform 0.2s, background 0.2s;
            }

            .control-btn:hover { background: var(--accent-soft); transform: scale(1.08); }

            .control-btn.play {
                width: 64px; height: 64px;
                background: var(--accent);
                border-color: transparent;
                font-size: 1.5rem;
                box-shadow: 0 8px 24px var(--accent-soft);
            }

            .control-btn.play:hover { filter: brightness(1.1); transform: scale(1.05); }

            /* ── Volume ── */
            .volume-area {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-top: 12px;
            }

            .volume-icon { color: var(--text-secondary); font-size: 1rem; }

            /* ── Queue ── */
            .queue-section {
                padding: 24px;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }

            .queue-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 16px;
            }

            .queue-title {
                font-size: 1rem;
                font-weight: 600;
                color: var(--text-primary);
            }

            .queue-count {
                color: var(--text-secondary);
                font-size: 0.8rem;
            }

            #playback-queue-list {
                list-style: none;
                overflow-y: auto;
                flex: 1;
                padding-right: 4px;
            }

            .queue-item {
                padding: 12px 14px;
                margin-bottom: 8px;
                display: flex;
                align-items: center;
                gap: 12px;
                cursor: pointer;
                border-radius: 14px;
                border: 1px solid transparent;
                transition: background 0.2s, border-color 0.2s, transform 0.15s;
            }

            .queue-item:hover {
                background: var(--accent-soft);
                border-color: var(--glass-border);
                transform: translateX(4px);
            }

            .queue-item.active {
                background: var(--accent-soft);
                border-color: var(--accent);
            }

            .queue-index {
                color: var(--text-secondary);
                font-size: 0.78rem;
                width: 18px;
                text-align: center;
                flex-shrink: 0;
            }

            .queue-item-info { flex: 1; overflow: hidden; }

            .queue-item-title {
                font-size: 0.88rem;
                font-weight: 500;
                color: var(--text-primary);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .queue-item-artist {
                font-size: 0.78rem;
                color: var(--text-secondary);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            /* ── Canvas Visualizer ── */
            #visualizer-canvas {
                position: absolute;
                bottom: 0; left: 0;
                width: 100%; height: 120px;
                opacity: 0.4;
                pointer-events: none;
                z-index: 1;
            }

            /* ── Scrollbar ── */
            #playback-queue-list::-webkit-scrollbar { width: 4px; }
            #playback-queue-list::-webkit-scrollbar-track { background: transparent; }
            #playback-queue-list::-webkit-scrollbar-thumb {
                background: var(--scrollbar-thumb);
                border-radius: 4px;
            }

            /* ── Search Panel ── */
            #search-overlay {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.4);
                backdrop-filter: blur(4px);
                z-index: 50;
            }

            #search-panel {
                position: fixed;
                top: 0; right: 0;
                width: 420px;
                height: 100vh;
                z-index: 100;
                display: flex;
                flex-direction: column;
                gap: 14px;
                padding: 24px;
                border-radius: 24px 0 0 24px;
                transform: translateX(100%);
                transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
                overflow: hidden;
            }

            #search-panel.open { transform: translateX(0); }

            .search-panel-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .search-panel-title {
                font-size: 1rem;
                font-weight: 600;
                color: var(--text-primary);
            }

            .search-input-field { margin: 0; }

            /* ── Genre chips ── */
            .genre-chips {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }

            .genre-chip {
                background: var(--glass);
                border: 1px solid var(--glass-border);
                color: var(--text-secondary);
                padding: 6px 14px;
                border-radius: 20px;
                font-size: 0.78rem;
                font-family: var(--font-main);
                cursor: pointer;
                transition: background 0.2s, color 0.2s, border-color 0.2s;
            }

            .genre-chip:hover, .genre-chip.active {
                background: var(--accent-soft);
                border-color: var(--accent);
                color: var(--accent);
            }

            /* ── Results ── */
            .search-results-title {
                font-size: 0.82rem;
                font-weight: 600;
                color: var(--text-secondary);
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }

            .search-results-list {
                flex: 1;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 6px;
                padding-right: 4px;
            }

            .search-result-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 10px 12px;
                border-radius: 14px;
                border: 1px solid transparent;
                transition: background 0.15s, border-color 0.15s;
                cursor: default;
            }

            .search-result-item:hover {
                background: var(--accent-soft);
                border-color: var(--glass-border);
            }

            .result-cover {
                width: 44px; height: 44px;
                border-radius: 10px;
                object-fit: cover;
                flex-shrink: 0;
            }

            .result-info { flex: 1; overflow: hidden; }

            .result-title {
                font-size: 0.88rem;
                font-weight: 500;
                color: var(--text-primary);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .result-artist {
                font-size: 0.76rem;
                color: var(--text-secondary);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .result-actions {
                display: flex;
                gap: 6px;
                flex-shrink: 0;
            }

            .result-btn {
                background: var(--glass);
                border: 1px solid var(--glass-border);
                color: var(--text-primary);
                width: 32px; height: 32px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 0.8rem;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.15s, color 0.15s;
            }

            .result-btn:hover { background: var(--accent); border-color: var(--accent); color: white; }
            .result-btn:disabled { opacity: 0.5; cursor: default; }

            /* ── Loading spinner ── */
            .search-loading {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 12px;
                padding: 40px 0;
                color: var(--text-secondary);
                font-size: 0.85rem;
            }

            .spinner {
                width: 28px; height: 28px;
                border: 3px solid var(--glass-border);
                border-top-color: var(--accent);
                border-radius: 50%;
                animation: spin 0.8s linear infinite;
            }

            @keyframes spin { to { transform: rotate(360deg); } }

            .search-empty {
                text-align: center;
                padding: 40px 0;
                color: var(--text-secondary);
                font-size: 0.88rem;
            }

            .jamendo-credit {
                font-size: 0.75rem;
                color: var(--text-secondary);
                text-align: center;
                flex-shrink: 0;
            }

            .jamendo-credit a { color: var(--accent); text-decoration: none; }
            .jamendo-credit a:hover { text-decoration: underline; }

            .search-results-list::-webkit-scrollbar { width: 4px; }
            .search-results-list::-webkit-scrollbar-track { background: transparent; }
            .search-results-list::-webkit-scrollbar-thumb {
                background: var(--scrollbar-thumb);
                border-radius: 4px;
            }

            /* ── Drag over highlight ── */
            #player-screen.drag-over::before {
                content: '🎵 Suelta aquí tus canciones';
                position: absolute;
                inset: 0;
                background: var(--accent-soft);
                border: 2px dashed var(--accent);
                border-radius: 24px;
                display: flex;
                justify-content: center;
                align-items: center;
                font-size: 1.4rem;
                color: var(--accent);
                z-index: 100;
                pointer-events: none;
            }

            /* ── Utilidades ── */
            .hidden { display: none !important; }

            .fade-in {
                animation: fadeIn 0.5s ease-out forwards;
            }

            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(16px); }
                to   { opacity: 1; transform: translateY(0); }
            }

            /* ── Toast notifications ── */
            .toast-container {
                position: fixed;
                bottom: 24px;
                right: 24px;
                display: flex;
                flex-direction: column;
                gap: 10px;
                z-index: 9999;
            }

            .toast {
                background: var(--glass);
                backdrop-filter: blur(20px);
                border: 1px solid var(--glass-border);
                color: var(--text-primary);
                padding: 14px 20px;
                border-radius: 14px;
                font-size: 0.88rem;
                box-shadow: var(--shadow-main);
                animation: slideIn 0.3s ease-out;
                max-width: 300px;
            }

            .toast.error { border-color: #ff6b6b; color: #ff6b6b; }
            .toast.success { border-color: var(--accent); }

            @keyframes slideIn {
                from { opacity: 0; transform: translateX(20px); }
                to   { opacity: 1; transform: translateX(0); }
            }
        `;
    }
}
