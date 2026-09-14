import { FIELD, PHYSICS } from './config';
import type { Level, Rect } from './level';
import type { Point } from './stroke';

type Palette = Record<'paper' | 'grid' | 'graphite' | 'ball' | 'goal' | 'ink', string>;

export class FieldRenderer {
  private readonly ctx: CanvasRenderingContext2D;
  private scale = 1;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly level: Level,
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2d context unavailable');
    this.ctx = ctx;
  }

  /** Fit the 400x711 logical field into the element box at device resolution. */
  resize(): void {
    const box = this.canvas.parentElement!.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    this.scale = Math.min(box.width / FIELD.width, box.height / FIELD.height);
    this.canvas.style.width = `${FIELD.width * this.scale}px`;
    this.canvas.style.height = `${FIELD.height * this.scale}px`;
    this.canvas.width = Math.round(FIELD.width * this.scale * dpr);
    this.canvas.height = Math.round(FIELD.height * this.scale * dpr);
    this.ctx.setTransform(this.scale * dpr, 0, 0, this.scale * dpr, 0, 0);
  }

  /** Element coordinates to logical field units. */
  toField(clientX: number, clientY: number): Point {
    const box = this.canvas.getBoundingClientRect();
    return { x: (clientX - box.left) / this.scale, y: (clientY - box.top) / this.scale };
  }

  draw(stroke: readonly Point[], tail: Point | null, ball: Point | null, trace: Point[] | null): void {
    const c = this.palette();
    const ctx = this.ctx;
    ctx.clearRect(0, 0, FIELD.width, FIELD.height);

    ctx.fillStyle = c.paper;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    this.grid(c);

    ctx.fillStyle = c.goal;
    this.rect(this.level.goal);
    ctx.fillStyle = c.graphite;
    for (const o of this.level.obstacles) this.rect(o);

    if (trace && trace.length > 1) {
      ctx.strokeStyle = c.ball;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      this.polyline(trace);
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }

    if (stroke.length > 0) {
      ctx.strokeStyle = c.ink;
      ctx.lineWidth = PHYSICS.stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      this.polyline(tail ? [...stroke, tail] : stroke);
    }

    const at = ball ?? this.level.ballStart;
    ctx.fillStyle = c.ball;
    ctx.beginPath();
    ctx.arc(at.x, at.y, PHYSICS.ball.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  private polyline(points: readonly Point[]): void {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(points[0]!.x, points[0]!.y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i]!.x, points[i]!.y);
    ctx.stroke();
  }

  private rect(r: Rect): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(r.x, r.y);
    ctx.rotate(r.angle ?? 0);
    ctx.fillRect(-r.w / 2, -r.h / 2, r.w, r.h);
    ctx.restore();
  }

  private grid(c: Palette): void {
    const ctx = this.ctx;
    ctx.strokeStyle = c.grid;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let x = 20; x < FIELD.width; x += 20) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, FIELD.height);
    }
    for (let y = 20; y < FIELD.height; y += 20) {
      ctx.moveTo(0, y);
      ctx.lineTo(FIELD.width, y);
    }
    ctx.stroke();
  }

  private palette(): Palette {
    const s = getComputedStyle(document.documentElement);
    const read = (name: string) => s.getPropertyValue(`--${name}`).trim();
    return {
      paper: read('paper'),
      grid: read('grid'),
      graphite: read('graphite'),
      ball: read('ball'),
      goal: read('goal'),
      ink: read('ink'),
    };
  }
}
