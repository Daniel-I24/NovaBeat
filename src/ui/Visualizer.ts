import { AudioService } from "../services/AudioService";

interface Bubble {
    x: number; y: number;
    vx: number; vy: number;
    size: number;
    alpha: number;
    hueOffset: number;
    life: number;      // 0–1, controla el ciclo de vida
    maxLife: number;
}

/**
 * Visualizador NovaBeat — fidget spinner con burbujas que gotean.
 *
 * Forma: 3 lóbulos elípticos simétricos que rotan (spinner real).
 * Burbujas: salen de todo el contorno del spinner, no solo de los lóbulos.
 * Ritmo: velocidad de rotación, tamaño y cantidad de burbujas se sincronizan
 * con las frecuencias de audio en tiempo real.
 */
export class Visualizer {
    private readonly canvas: HTMLCanvasElement;
    private readonly ctx: CanvasRenderingContext2D;
    private readonly audioService: AudioService;
    private animationId = 0;
    private rotation = 0;
    private bubbles: Bubble[] = [];
    private frameCount = 0;

    constructor(canvas: HTMLCanvasElement, audioService: AudioService) {
        this.canvas = canvas;
        this.audioService = audioService;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("NovaBeat: Canvas 2D no disponible.");
        this.ctx = ctx;
        this.resize();
        window.addEventListener("resize", () => this.resize());
    }

    public start(): void {
        let analyzer: AnalyserNode;
        try { analyzer = this.audioService.getAnalyzer(); } catch { return; }
        analyzer.fftSize = 256;
        const data = new Uint8Array(analyzer.frequencyBinCount);
        const draw = (): void => {
            this.animationId = requestAnimationFrame(draw);
            analyzer.getByteFrequencyData(data);
            this.draw(data);
        };
        draw();
    }

    public stop(): void { cancelAnimationFrame(this.animationId); }

    // ─── Dibujo principal ─────────────────────────────────────────────────────

    private draw(data: Uint8Array): void {
        const { width: W, height: H } = this.canvas;
        const cx = W / 2, cy = H / 2;
        const coverR = Math.min(W, H) * 0.33;

        this.ctx.clearRect(0, 0, W, H);
        this.frameCount++;

        const hue   = this.hexToHue(this.cssVar("--accent") || "#7c6ff7");
        const avg   = this.avg(data) / 255;
        const bass  = this.avg(data.slice(0, 8)) / 255;
        const mid   = this.avg(data.slice(8, 32)) / 255;
        const treble = this.avg(data.slice(32, 64)) / 255;

        // Rotación: base lenta + aceleración proporcional al bass
        this.rotation += 0.005 + bass * 0.07;

        // ── Halo de brillo exterior ───────────────────────────────────────────
        const glowR = coverR * (1.6 + avg * 0.6);
        const glow = this.ctx.createRadialGradient(cx, cy, coverR * 0.85, cx, cy, glowR);
        glow.addColorStop(0,   `hsla(${hue}, 80%, 65%, ${0.08 + bass * 0.18})`);
        glow.addColorStop(0.5, `hsla(${(hue + 40) % 360}, 70%, 55%, ${0.04 + mid * 0.06})`);
        glow.addColorStop(1,   "transparent");
        this.ctx.fillStyle = glow;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
        this.ctx.fill();

        // ── Spinner: 3 lóbulos elípticos ──────────────────────────────────────
        const LOBES   = 3;
        const lobeDist = coverR * (0.60 + mid * 0.08);
        const lobeA    = coverR * (0.50 + bass * 0.12);  // eje largo (radial)
        const lobeB    = coverR * (0.36 + avg * 0.06);   // eje ancho (tangencial)

        // Guardar puntos del contorno del spinner para emitir burbujas desde ahí
        const spinnerContour: Array<{ x: number; y: number; angle: number }> = [];

        for (let i = 0; i < LOBES; i++) {
            const lobeAngle = this.rotation + (i * Math.PI * 2) / LOBES;
            const lx = cx + Math.cos(lobeAngle) * lobeDist;
            const ly = cy + Math.sin(lobeAngle) * lobeDist;

            // Gradiente del lóbulo — más brillante con el bass
            const grad = this.ctx.createRadialGradient(
                lx - Math.cos(lobeAngle) * lobeA * 0.25,
                ly - Math.sin(lobeAngle) * lobeA * 0.25,
                0, lx, ly, lobeA
            );
            grad.addColorStop(0,   `hsla(${(hue + i * 25) % 360}, 85%, 78%, ${0.5 + bass * 0.35})`);
            grad.addColorStop(0.55,`hsla(${hue}, 78%, 62%, ${0.38 + avg * 0.2})`);
            grad.addColorStop(1,   `hsla(${hue}, 68%, 48%, ${0.12 + avg * 0.08})`);

            this.ctx.save();
            this.ctx.translate(lx, ly);
            this.ctx.rotate(lobeAngle);
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, lobeA, lobeB, 0, 0, Math.PI * 2);
            this.ctx.fillStyle = grad;
            this.ctx.shadowColor = `hsla(${hue}, 80%, 65%, 0.75)`;
            this.ctx.shadowBlur  = 8 + bass * 20;
            this.ctx.fill();
            this.ctx.strokeStyle = `hsla(${(hue + 40) % 360}, 90%, 82%, ${0.35 + bass * 0.45})`;
            this.ctx.lineWidth = 0.8 + bass * 2;
            this.ctx.stroke();
            this.ctx.restore();

            // Recopilar puntos del contorno del lóbulo (en coordenadas globales)
            const CONTOUR_POINTS = 16;
            for (let p = 0; p < CONTOUR_POINTS; p++) {
                const t = (p / CONTOUR_POINTS) * Math.PI * 2;
                // Punto en la elipse local, rotado al ángulo del lóbulo
                const ex = Math.cos(t) * lobeA;
                const ey = Math.sin(t) * lobeB;
                const gx = lx + Math.cos(lobeAngle) * ex - Math.sin(lobeAngle) * ey;
                const gy = ly + Math.sin(lobeAngle) * ex + Math.cos(lobeAngle) * ey;
                // Ángulo de salida: desde el centro del canvas hacia afuera
                const outAngle = Math.atan2(gy - cy, gx - cx);
                spinnerContour.push({ x: gx, y: gy, angle: outAngle });
            }
        }

        // ── Centro del spinner ────────────────────────────────────────────────
        this.ctx.save();
        const centerR = coverR * (0.12 + bass * 0.04);
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, centerR, 0, Math.PI * 2);
        const cg = this.ctx.createRadialGradient(cx - centerR * 0.3, cy - centerR * 0.3, 0, cx, cy, centerR);
        cg.addColorStop(0, `hsla(${(hue + 60) % 360}, 95%, 92%, 0.95)`);
        cg.addColorStop(1, `hsla(${hue}, 80%, 60%, 0.55)`);
        this.ctx.fillStyle = cg;
        this.ctx.shadowColor = `hsla(${hue}, 80%, 65%, 0.9)`;
        this.ctx.shadowBlur  = 10 + bass * 14;
        this.ctx.fill();
        this.ctx.restore();

        // ── Emisión de burbujas desde todo el contorno ────────────────────────
        // Frecuencia de emisión sincronizada con el audio:
        // - bass controla la cantidad y velocidad
        // - treble controla el tamaño
        // - Emisión continua (no termina) con tasa base + modulación
        const emitRate = 0.12 + bass * 0.5 + mid * 0.2; // burbujas por punto por frame
        for (const pt of spinnerContour) {
            if (Math.random() < emitRate / spinnerContour.length) {
                const speed = 0.6 + bass * 4.5 + Math.random() * 1.2;
                const spread = 0.4 + mid * 0.3; // dispersión angular
                const emitAngle = pt.angle + (Math.random() - 0.5) * spread;
                this.bubbles.push({
                    x: pt.x + (Math.random() - 0.5) * 4,
                    y: pt.y + (Math.random() - 0.5) * 4,
                    vx: Math.cos(emitAngle) * speed,
                    vy: Math.sin(emitAngle) * speed,
                    size:      1.5 + Math.random() * 4 + treble * 5 + bass * 4,
                    alpha:     0.55 + Math.random() * 0.35,
                    hueOffset: Math.random() * 80 - 40,
                    life:      0,
                    maxLife:   60 + Math.random() * 60 + bass * 40, // frames de vida
                });
            }
        }

        // ── Actualizar y dibujar burbujas ─────────────────────────────────────
        // Las burbujas no desaparecen abruptamente — tienen un ciclo de vida
        // con fade-in, expansión y fade-out suave
        this.bubbles = this.bubbles.filter((b) => b.life < b.maxLife);

        for (const b of this.bubbles) {
            b.life++;
            const t = b.life / b.maxLife; // 0→1 ciclo de vida

            // Fade-in rápido, fade-out suave
            const fadeAlpha = t < 0.15
                ? t / 0.15                          // fade-in
                : 1 - Math.pow((t - 0.15) / 0.85, 1.5); // fade-out

            b.x  += b.vx;
            b.y  += b.vy;
            b.vx *= 0.97;
            b.vy *= 0.97;

            // Expansión sincronizada: la burbuja crece con el bass en tiempo real
            const currentSize = b.size * (0.6 + t * 0.4 + bass * 0.3);
            const currentAlpha = b.alpha * fadeAlpha;

            if (currentAlpha < 0.02) continue;

            const bHue = (hue + b.hueOffset + 360) % 360;
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(b.x, b.y, currentSize, 0, Math.PI * 2);

            // Gradiente interior de burbuja (efecto de gota de agua con reflejo)
            const bg = this.ctx.createRadialGradient(
                b.x - currentSize * 0.35, b.y - currentSize * 0.35, 0,
                b.x, b.y, currentSize
            );
            bg.addColorStop(0,   `hsla(${bHue}, 90%, 94%, ${currentAlpha})`);
            bg.addColorStop(0.35,`hsla(${bHue}, 85%, 75%, ${currentAlpha * 0.75})`);
            bg.addColorStop(0.75,`hsla(${bHue}, 75%, 58%, ${currentAlpha * 0.4})`);
            bg.addColorStop(1,   `hsla(${bHue}, 65%, 45%, 0)`);
            this.ctx.fillStyle = bg;
            this.ctx.shadowColor = `hsla(${bHue}, 80%, 65%, ${currentAlpha * 0.45})`;
            this.ctx.shadowBlur  = currentSize * 2;
            this.ctx.fill();

            // Borde translúcido (efecto burbuja de jabón)
            this.ctx.strokeStyle = `hsla(${bHue}, 80%, 90%, ${currentAlpha * 0.3})`;
            this.ctx.lineWidth = 0.5;
            this.ctx.stroke();
            this.ctx.restore();
        }
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private avg(d: Uint8Array): number {
        return d.length ? d.reduce((s, v) => s + v, 0) / d.length : 0;
    }

    private cssVar(n: string): string {
        return getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    }

    private hexToHue(hex: string): number {
        const c = hex.replace("#", "");
        if (c.length < 6) return 260;
        const r = parseInt(c.slice(0, 2), 16) / 255;
        const g = parseInt(c.slice(2, 4), 16) / 255;
        const b = parseInt(c.slice(4, 6), 16) / 255;
        const max = Math.max(r, g, b), d = max - Math.min(r, g, b);
        if (!d) return 0;
        const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
        return Math.round(h * 60 + (h < 0 ? 360 : 0));
    }

    private resize(): void {
        this.canvas.width  = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
    }
}
