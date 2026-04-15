import { AudioService } from "../services/AudioService";

/** Configuración visual del visualizador */
const VISUALIZER_CONFIG = {
    LINE_WIDTH: 3,
    STROKE_COLOR: "rgba(108, 92, 231, 0.6)", // Usa el mismo acento que --accent del tema
    WAVEFORM_MIDPOINT: 128.0,
} as const;

/**
 * Renderiza el visualizador de ondas en tiempo real sobre un elemento <canvas>.
 * Lee los datos de frecuencia del AnalyserNode expuesto por AudioService.
 */
export class Visualizer {
    private readonly canvas: HTMLCanvasElement;
    private readonly ctx: CanvasRenderingContext2D;
    private readonly audioService: AudioService;
    private animationId: number = 0;

    constructor(canvasElement: HTMLCanvasElement, audioService: AudioService) {
        this.canvas = canvasElement;
        this.audioService = audioService;

        const context = this.canvas.getContext("2d");
        if (!context) throw new Error("NovaBeat: No se pudo obtener el contexto 2D del canvas.");
        this.ctx = context;

        this.resize();
        window.addEventListener("resize", () => this.resize());
    }

    /** Inicia el ciclo de animación de la onda. */
    public start(): void {
        const analyzer = this.audioService.getAnalyzer();
        const dataArray = new Uint8Array(analyzer.frequencyBinCount);

        const draw = (): void => {
            this.animationId = requestAnimationFrame(draw);
            analyzer.getByteTimeDomainData(dataArray);
            this.drawWaveform(dataArray);
        };

        draw();
    }

    /** Detiene la animación para liberar recursos cuando no hay reproducción. */
    public stop(): void {
        cancelAnimationFrame(this.animationId);
    }

    // ─── Helpers privados ────────────────────────────────────────────────────

    /** Dibuja la forma de onda sobre el canvas. */
    private drawWaveform(dataArray: Uint8Array): void {
        const { width, height } = this.canvas;
        const bufferLength = dataArray.length;

        this.ctx.clearRect(0, 0, width, height);
        this.ctx.lineWidth = VISUALIZER_CONFIG.LINE_WIDTH;
        this.ctx.strokeStyle = VISUALIZER_CONFIG.STROKE_COLOR;
        this.ctx.beginPath();

        const sliceWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            const normalizedValue = dataArray[i] / VISUALIZER_CONFIG.WAVEFORM_MIDPOINT;
            const y = (normalizedValue * height) / 2;

            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        this.ctx.lineTo(width, height / 2);
        this.ctx.stroke();
    }

    /** Ajusta las dimensiones del canvas al tamaño real del contenedor. */
    private resize(): void {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
    }
}
