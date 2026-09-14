import { FIELD, STROKE } from './config';

export type Point = { x: number; y: number };

/**
 * Arc-length sampler, spec 4.2. Points are emitted every `sampleDistance`
 * units of travel, not per frame, so the stored polyline is device- and
 * framerate-independent.
 */
export class StrokeRecorder {
  private readonly points: Point[] = [];
  private pending: Point | null = null;

  get length(): number {
    return this.points.length;
  }

  get full(): boolean {
    return this.points.length >= STROKE.maxPoints;
  }

  /** Live polyline length in logical units. */
  get ink(): number {
    let total = 0;
    for (let i = 1; i < this.points.length; i++) {
      total += distance(this.points[i - 1]!, this.points[i]!);
    }
    return total;
  }

  list(): readonly Point[] {
    return this.points;
  }

  /** Returns true when the raw position produced a new stored sample. */
  push(raw: Point): boolean {
    const p = clampToField(raw);
    if (this.points.length === 0) {
      this.points.push(quantise(p));
      this.pending = null;
      return true;
    }
    if (this.full) return false;

    const last = this.points[this.points.length - 1]!;
    const travelled = distance(last, p);
    if (travelled < STROKE.sampleDistance) {
      this.pending = p;
      return false;
    }

    // Walk along the segment so a fast flick still emits evenly spaced points
    // instead of one long jump the server would reject.
    let cursor = last;
    let remaining = travelled;
    while (remaining >= STROKE.sampleDistance && !this.full) {
      const t = STROKE.sampleDistance / remaining;
      const next = quantise({
        x: cursor.x + (p.x - cursor.x) * t,
        y: cursor.y + (p.y - cursor.y) * t,
      });
      this.points.push(next);
      cursor = next;
      remaining = distance(cursor, p);
    }
    this.pending = remaining > 0 ? p : null;
    return true;
  }

  /** The un-sampled tail, for drawing only. Never scored. */
  tail(): Point | null {
    return this.pending;
  }

  reset(): void {
    this.points.length = 0;
    this.pending = null;
  }

  /** Int16 x,y pairs - the wire format, 2 bytes per coordinate (spec 4.2). */
  serialise(): Int16Array {
    const out = new Int16Array(this.points.length * 2);
    this.points.forEach((p, i) => {
      out[i * 2] = p.x;
      out[i * 2 + 1] = p.y;
    });
    return out;
  }
}

/**
 * The validation the server performs before it simulates anything (spec 4.1).
 * It runs client-side too, but only to show the player a reason - the server
 * result is the one that counts.
 */
export function validate(points: readonly Point[], inkBudget: number): string | null {
  if (points.length < 2) return 'Stroke too short';
  if (points.length > STROKE.maxPoints) return 'Too many points';

  let ink = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!;
    const b = points[i]!;
    const d = distance(a, b);
    if (d < STROKE.minSegment || d > STROKE.maxSegment) return 'Bad sampling';
    ink += d;
  }
  for (const p of points) {
    if (p.x < 0 || p.x > FIELD.width || p.y < 0 || p.y > FIELD.height) {
      return 'Stroke leaves the field';
    }
  }
  if (ink > inkBudget) return 'Over the ink budget';
  return null;
}

/** Ink in tenths of a logical unit, the stored unit (spec 4.2). */
export function measureInk(points: readonly Point[]): number {
  let ink = 0;
  for (let i = 1; i < points.length; i++) ink += distance(points[i - 1]!, points[i]!);
  return Math.round(ink * 10);
}

function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function quantise(p: Point): Point {
  return { x: Math.round(p.x), y: Math.round(p.y) };
}

function clampToField(p: Point): Point {
  return {
    x: Math.min(FIELD.width, Math.max(0, p.x)),
    y: Math.min(FIELD.height, Math.max(0, p.y)),
  };
}
