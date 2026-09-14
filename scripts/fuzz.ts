/**
 * The fuzzer, first pass (spec 12.0).
 *
 * It answers the only question a level has to answer before it ships: is there
 * a stroke inside the ink budget that solves it, and is there more than one
 * family of them. It searches a parametric family of strokes rather than random
 * scribbles, because random polylines solve nothing and tell you nothing.
 *
 *   npm run fuzz
 */
import { LEVEL } from '../src/game/level';
import { simulate } from '../src/game/sim';
import { STROKE } from '../src/game/config';
import { measureInk, validate, type Point } from '../src/game/stroke';

/** Resample a two-point spine the way the client's recorder would (spec 4.2). */
function resample(spine: readonly Point[]): Point[] {
  const out: Point[] = [{ x: Math.round(spine[0]!.x), y: Math.round(spine[0]!.y) }];
  for (let i = 1; i < spine.length; i++) {
    let cursor = out[out.length - 1]!;
    const target = spine[i]!;
    let remaining = Math.hypot(target.x - cursor.x, target.y - cursor.y);
    while (remaining >= STROKE.sampleDistance && out.length < STROKE.maxPoints) {
      const t = STROKE.sampleDistance / remaining;
      const next = {
        x: Math.round(cursor.x + (target.x - cursor.x) * t),
        y: Math.round(cursor.y + (target.y - cursor.y) * t),
      };
      out.push(next);
      cursor = next;
      remaining = Math.hypot(target.x - cursor.x, target.y - cursor.y);
    }
  }
  return out;
}

const GRID = 40;
const xs = [20, 60, 100, 140, 180, 220, 260, 300, 340, 380];
const ys = [120, 180, 240, 300, 360, 420, 480, 540, 600];

let tried = 0;
let rejected = 0;
const solutions: { ink: number; steps: number; spine: Point[] }[] = [];

for (const ax of xs) {
  for (const ay of ys) {
    for (const bx of xs) {
      for (const by of ys) {
        if (ax === bx && ay === by) continue;
        const spine = [
          { x: ax, y: ay },
          { x: bx, y: by },
        ];
        const stroke = resample(spine);
        tried++;
        if (validate(stroke, LEVEL.inkBudget)) {
          rejected++;
          continue;
        }
        const result = simulate(LEVEL, stroke);
        if (result.solved) solutions.push({ ink: result.ink, steps: result.steps, spine });
      }
    }
  }
}

solutions.sort((a, b) => a.ink - b.ink);
const label = (s: { spine: Point[] }) =>
  s.spine.map((p) => `${p.x},${p.y}`).join(' -> ');

console.log(`level      ${LEVEL.id}  (ink budget ${LEVEL.inkBudget}, grid step ${GRID})`);
console.log(`candidates ${tried}, rejected by validation ${rejected}`);
console.log(`solutions  ${solutions.length}`);
if (solutions.length > 0) {
  console.log('\ncheapest strokes by ink:');
  for (const s of solutions.slice(0, 8)) {
    console.log(`  ink ${(s.ink / 10).toFixed(1).padStart(6)}  steps ${String(s.steps).padStart(3)}  ${label(s)}`);
  }
  const fastest = [...solutions].sort((a, b) => a.steps - b.steps)[0]!;
  console.log(`\nfastest: steps ${fastest.steps}, ink ${(fastest.ink / 10).toFixed(1)}  ${label(fastest)}`);
}

// A level with no solution, or exactly one, does not ship (spec 12.1).
process.exitCode = solutions.length >= 2 ? 0 : 1;
void measureInk;
