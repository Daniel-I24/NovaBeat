/** Definición de un tema visual */
export interface Theme {
    id: string;
    name: string;
    font: string;
    vars: Record<string, string>;
}

export const THEMES: Theme[] = [
    { id: "midnight-dark",   name: "🌙 Midnight Dark",   font: "'Inter', sans-serif",     vars: { "--bg-main": "#0d0d1a", "--accent": "#7c6ff7", "--accent-soft": "rgba(124,111,247,0.15)", "--glass": "rgba(255,255,255,0.05)", "--glass-border": "rgba(255,255,255,0.1)", "--text-primary": "#e8e8ff", "--text-secondary": "#8888aa", "--shadow-main": "0 20px 60px rgba(0,0,0,0.5)", "--scrollbar-thumb": "rgba(124,111,247,0.4)" } },
    { id: "neon-synthwave",  name: "⚡ Neon Synthwave",  font: "'Rajdhani', sans-serif",   vars: { "--bg-main": "#0a0015", "--accent": "#ff2d78", "--accent-soft": "rgba(255,45,120,0.15)",  "--glass": "rgba(255,45,120,0.05)",  "--glass-border": "rgba(0,255,255,0.2)",   "--text-primary": "#ffffff",  "--text-secondary": "#cc88ff", "--shadow-main": "0 0 40px rgba(255,45,120,0.3)",  "--scrollbar-thumb": "rgba(255,45,120,0.5)"  } },
    { id: "soft-minimalist", name: "☁️ Soft Minimalist", font: "'Poppins', sans-serif",    vars: { "--bg-main": "#f0f3f7", "--accent": "#6c5ce7", "--accent-soft": "rgba(108,92,231,0.1)",   "--glass": "rgba(255,255,255,0.6)", "--glass-border": "rgba(255,255,255,0.4)", "--text-primary": "#2d3436",  "--text-secondary": "#636e72", "--shadow-main": "0 15px 35px rgba(0,0,0,0.08)", "--scrollbar-thumb": "rgba(108,92,231,0.3)"  } },
    { id: "forest-calm",     name: "🌿 Forest Calm",     font: "'Nunito', sans-serif",     vars: { "--bg-main": "#0f1f14", "--accent": "#4ade80", "--accent-soft": "rgba(74,222,128,0.12)",  "--glass": "rgba(74,222,128,0.05)", "--glass-border": "rgba(74,222,128,0.15)", "--text-primary": "#e2f5e8",  "--text-secondary": "#7aad8a", "--shadow-main": "0 20px 50px rgba(0,0,0,0.4)",   "--scrollbar-thumb": "rgba(74,222,128,0.35)" } },
    { id: "sunset-warm",     name: "🌅 Sunset Warm",     font: "'Lato', sans-serif",       vars: { "--bg-main": "#1a0a00", "--accent": "#ff7043", "--accent-soft": "rgba(255,112,67,0.15)",  "--glass": "rgba(255,112,67,0.06)", "--glass-border": "rgba(255,180,100,0.2)", "--text-primary": "#fff3e0",  "--text-secondary": "#ffab76", "--shadow-main": "0 20px 50px rgba(255,80,0,0.2)",  "--scrollbar-thumb": "rgba(255,112,67,0.4)"  } },
    { id: "ocean-deep",      name: "🌊 Ocean Deep",      font: "'Quicksand', sans-serif",  vars: { "--bg-main": "#020c18", "--accent": "#00b4d8", "--accent-soft": "rgba(0,180,216,0.12)",   "--glass": "rgba(0,180,216,0.05)",  "--glass-border": "rgba(0,180,216,0.15)",  "--text-primary": "#caf0f8",  "--text-secondary": "#5aafcc", "--shadow-main": "0 20px 60px rgba(0,0,0,0.6)",   "--scrollbar-thumb": "rgba(0,180,216,0.35)"  } },
];

/**
 * Aplica variables CSS y fuentes dinámicamente según el tema seleccionado.
 * Los estilos base viven en public/styles/main.css.
 */
export class ThemeService {
    private readonly fontLink: HTMLLinkElement;
    private currentTheme: Theme = THEMES[0];

    constructor() {
        this.fontLink = document.createElement("link");
        this.fontLink.rel = "stylesheet";
        document.head.appendChild(this.fontLink);
        this.applyTheme(this.currentTheme.id);
    }

    public applyTheme(themeId: string): void {
        this.currentTheme = THEMES.find((t) => t.id === themeId) ?? THEMES[0];
        const root = document.documentElement;
        Object.entries(this.currentTheme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
        root.style.setProperty("--font-main", this.currentTheme.font);
        this.loadFont(this.currentTheme.font);
    }

    public getCurrentTheme(): Theme { return this.currentTheme; }
    public getThemes(): Theme[] { return THEMES; }

    public setDynamicAccent(hex: string): void {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        document.documentElement.style.setProperty("--accent", hex);
        document.documentElement.style.setProperty("--accent-soft", `rgba(${r},${g},${b},0.15)`);
    }

    private loadFont(font: string): void {
        const name = font.replace(/'/g, "").split(",")[0].trim().replace(/ /g, "+");
        this.fontLink.href = `https://fonts.googleapis.com/css2?family=${name}:wght@300;400;600;700&display=swap`;
    }
}
