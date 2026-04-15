/**
 * Servicio maestro de estética para NovaBeat.
 * Centraliza todo el diseño mediante CSS-in-TS, permitiendo un proyecto sin archivos .css.
 */
export class ThemeService {
    private styleElement: HTMLStyleElement;

    constructor() {
        this.styleElement = document.createElement('style');
        this.styleElement.id = 'novabeat-theme-engine';
        document.head.appendChild(this.styleElement);
        this.applyNovaBeatStyles();
    }

    /**
     * Inyecta la hoja de estilos completa en el DOM.
     * Incluye configuraciones para Soft Minimalist, Glassmorphism y animaciones.
     */
    private applyNovaBeatStyles(): void {
        this.styleElement.innerHTML = `
            :root {
                --bg-main: #f0f3f7;
                --accent: #6c5ce7;
                --accent-soft: rgba(108, 92, 231, 0.1);
                --glass: rgba(255, 255, 255, 0.6);
                --glass-border: rgba(255, 255, 255, 0.3);
                --text-dark: #2d3436;
                --text-light: #636e72;
                --shadow-main: 0 15px 35px rgba(0, 0, 0, 0.05);
                --shadow-inner: inset 5px 5px 10px rgba(0,0,0,0.02);
            }

            /* Reset y Base */
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                font-family: 'Poppins', sans-serif;
                -webkit-font-smoothing: antialiased;
            }

            body {
                background: var(--bg-main);
                height: 100vh;
                display: flex;
                justify-content: center;
                align-items: center;
                overflow: hidden;
                color: var(--text-dark);
            }

            /* Contenedores Glassmorphism */
            .glass-panel {
                background: var(--glass);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                border: 1px solid var(--glass-border);
                border-radius: 32px;
                box-shadow: var(--shadow-main);
            }

            /* Pantalla de Autenticación */
            .auth-form {
                display: flex;
                flex-direction: column;
                gap: 18px;
                padding: 10px;
            }

            .soft-input {
                background: rgba(255, 255, 255, 0.7);
                border: 1px solid transparent;
                padding: 16px;
                border-radius: 16px;
                outline: none;
                transition: all 0.3s ease;
                font-size: 0.95rem;
                box-shadow: var(--shadow-inner);
            }

            .soft-input:focus {
                border-color: var(--accent);
                background: white;
                box-shadow: 0 5px 15px var(--accent-soft);
            }

            .soft-button {
                background: var(--accent);
                color: white;
                border: none;
                padding: 16px;
                border-radius: 16px;
                font-weight: 600;
                font-size: 1rem;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                box-shadow: 0 8px 20px var(--accent-soft);
            }

            .soft-button:hover {
                transform: translateY(-3px);
                box-shadow: 0 12px 25px var(--accent-soft);
                filter: brightness(1.1);
            }

            /* Layout del Reproductor */
            .main-content {
                display: grid;
                grid-template-columns: 1fr 380px;
                gap: 30px;
                width: 90vw;
                max-width: 1200px;
                height: 85vh;
            }

            /* Controles de Reproducción */
            .controls {
                display: flex;
                align-items: center;
                gap: 25px;
                margin-top: 20px;
            }

            .control-btn {
                background: white;
                border: none;
                width: 55px;
                height: 55px;
                border-radius: 50%;
                display: flex;
                justify-content: center;
                align-items: center;
                font-size: 1.4rem;
                cursor: pointer;
                transition: 0.3s;
                box-shadow: 5px 5px 15px rgba(0,0,0,0.05);
            }

            .control-btn:hover {
                transform: scale(1.1);
                color: var(--accent);
            }

            .control-btn.play {
                width: 75px;
                height: 75px;
                background: var(--accent);
                color: white;
                font-size: 2rem;
            }

            /* Lista de Cola (Queue) */
            .queue-section {
                padding: 25px;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }

            #playback-queue-list {
                list-style: none;
                overflow-y: auto;
                margin-top: 20px;
                padding-right: 5px;
            }

            .queue-item {
                padding: 15px;
                margin-bottom: 12px;
                display: flex;
                align-items: center;
                cursor: pointer;
                transition: 0.2s;
                border: 1px solid transparent;
            }

            .queue-item:hover {
                background: white;
                border-color: var(--accent-soft);
                transform: translateX(5px);
            }

            /* Barra de Progreso Custom */
            input[type="range"] {
                -webkit-appearance: none;
                width: 100%;
                height: 6px;
                background: #e0e0e0;
                border-radius: 5px;
                outline: none;
            }

            input[type="range"]::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 18px;
                height: 18px;
                background: var(--accent);
                border-radius: 50%;
                cursor: pointer;
                transition: 0.2s;
            }

            /* Utilidades */
            .hidden { display: none !important; }
            .fade-in { animation: fadeIn 0.6s ease-out; }

            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }

            /* Scrollbar minimalista */
            #playback-queue-list::-webkit-scrollbar { width: 5px; }
            #playback-queue-list::-webkit-scrollbar-track { background: transparent; }
            #playback-queue-list::-webkit-scrollbar-thumb { 
                background: var(--accent-soft); 
                border-radius: 10px; 
            }
        `;
    }

    /**
     * Permite actualizar el color de acento según la carátula de la canción.
     */
    public setDynamicAccent(hexColor: string): void {
        document.documentElement.style.setProperty('--accent', hexColor);
        document.documentElement.style.setProperty('--accent-soft', hexColor + '22'); // 22 es opacidad en hex
    }
}