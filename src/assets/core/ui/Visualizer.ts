import { AudioService } from "../services/AudioService";

/**
 * Clase encargada de renderizar el visualizador de ondas en tiempo real.
 * Utiliza el AnalyserNode del AudioService para obtener frecuencias.
 */
export class Visualizer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private audioService: AudioService;
    private animationId: number = 0;

    /**
     * @param canvasElement El elemento <canvas> donde se dibujarán las ondas.
     * @param audioService Instancia del servicio de audio para obtener el analizador.
     */
    constructor(canvasElement: HTMLCanvasElement, audioService: AudioService) {
        this.canvas = canvasElement;
        this.audioService = audioService;
        
        const context = this.canvas.getContext('2d');
        if (!context) throw new Error("No se pudo obtener el contexto del Canvas.");
        this.ctx = context;

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    /**
     * Ajusta el tamaño del canvas al contenedor manteniendo la resolución.
     */
    private resize(): void {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
    }

    /**
     * Inicia el ciclo de dibujo de la onda.
     */
    public start(): void {
        const analyzer = this.audioService.getAnalyzer();
        const bufferLength = analyzer.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            this.animationId = requestAnimationFrame(draw);
            analyzer.getByteTimeDomainData(dataArray);

            // Estética Soft Minimalist: Fondo translúcido para efecto rastro
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.lineWidth = 3;
            this.ctx.strokeStyle = 'rgba(100, 100, 255, 0.5)'; // Color base suave
            this.ctx.beginPath();

            const sliceWidth = (this.canvas.width * 1.0) / bufferLength;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const y = (v * this.canvas.height) / 2;

                if (i === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }

                x += sliceWidth;
            }

            this.ctx.lineTo(this.canvas.width, this.canvas.height / 2);
            this.ctx.stroke();
        };

        draw();
    }

    /**
     * Detiene la animación para ahorrar recursos cuando no hay música.
     */
    public stop(): void {
        cancelAnimationFrame(this.animationId);
    }
}