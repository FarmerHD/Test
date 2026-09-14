import './style.css';
import { LEVEL } from './game/level';
import { FieldRenderer } from './game/render';
import { StrokeRecorder, validate, type Point } from './game/stroke';
import { simulate, type AttemptResult } from './game/sim';

type Phase = 'idle' | 'drawing' | 'animating' | 'result';

const el = <T extends HTMLElement>(id: string): T => {
  const node = document.getElementById(id);
  if (!node) throw new Error(`missing #${id}`);
  return node as T;
};

const canvas = el<HTMLCanvasElement>('field');
const inkFill = el<HTMLElement>('ink-fill');
const inkBar = inkFill.parentElement!;
const inkValue = el('ink-value');
const sheet = el('sheet');
const verdict = el('sheet-verdict');
const retry = el<HTMLButtonElement>('retry');

const renderer = new FieldRenderer(canvas, LEVEL);
const recorder = new StrokeRecorder();

let phase: Phase = 'idle';
let pointerId: number | null = null;
let attemptNo = 0;
let ballAt: Point | null = null;
let trace: Point[] | null = null;

el('hud-level').textContent = `Level ${LEVEL.number}`;
el('ink-budget').textContent = String(LEVEL.inkBudget);

function paint(): void {
  renderer.draw(recorder.list(), recorder.tail(), ballAt, trace);
  const ink = recorder.ink;
  inkValue.textContent = String(Math.round(ink));
  inkFill.style.width = `${Math.min(100, (ink / LEVEL.inkBudget) * 100)}%`;
  inkBar.classList.toggle('over', ink > LEVEL.inkBudget);
}

function resize(): void {
  renderer.resize();
  paint();
}

// --- drawing -----------------------------------------------------------

canvas.addEventListener('pointerdown', (event) => {
  if (phase !== 'idle') return;
  event.preventDefault();
  pointerId = event.pointerId;
  canvas.setPointerCapture(event.pointerId);
  phase = 'drawing';
  recorder.reset();
  const p = renderer.toField(event.clientX, event.clientY);
  recorder.push(p);
  paint();
});

canvas.addEventListener('pointermove', (event) => {
  if (phase !== 'drawing' || event.pointerId !== pointerId) return;
  event.preventDefault();
  // Coalesced events keep the sampler fed on high-rate touch digitisers.
  const moves = event.getCoalescedEvents?.() ?? [event];
  for (const m of moves) recorder.push(renderer.toField(m.clientX, m.clientY));
  if (recorder.ink >= LEVEL.inkBudget || recorder.full) {
    finish();
    return;
  }
  paint();
});

for (const type of ['pointerup', 'pointercancel'] as const) {
  canvas.addEventListener(type, (event) => {
    if (phase !== 'drawing' || event.pointerId !== pointerId) return;
    event.preventDefault();
    finish();
  });
}

function finish(): void {
  if (pointerId !== null && canvas.hasPointerCapture(pointerId)) {
    canvas.releasePointerCapture(pointerId);
  }
  pointerId = null;

  const points = recorder.list();
  const reason = validate(points, LEVEL.inkBudget);
  if (reason) {
    phase = 'idle';
    recorder.reset();
    show(reason, false);
    paint();
    return;
  }

  attemptNo++;
  // Stage 0 runs this locally. From window 2 this is a POST /attempt and the
  // result arrives from the server (spec 4.1).
  animate(simulate(LEVEL, points));
}

// --- animation ---------------------------------------------------------

function animate(result: AttemptResult): void {
  phase = 'animating';
  sheet.hidden = true;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) {
    // Reduced motion draws the trajectory as a static traced path and states
    // the outcome in text, rather than dropping the simulation (spec 1.4).
    trace = result.trajectory;
    ballAt = result.trajectory[result.trajectory.length - 1] ?? null;
    paint();
    settle(result);
    return;
  }

  trace = null;
  let index = 0;
  const start = performance.now();
  // The trajectory carries every second step of a 1/120 s simulation.
  const msPerPoint = (1000 / 120) * 2;

  const frame = (now: number): void => {
    index = Math.floor((now - start) / msPerPoint);
    if (index >= result.trajectory.length) {
      ballAt = result.trajectory[result.trajectory.length - 1] ?? null;
      paint();
      settle(result);
      return;
    }
    ballAt = result.trajectory[index]!;
    paint();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

function settle(result: AttemptResult): void {
  phase = 'result';
  el('stat-ink').textContent = (result.ink / 10).toFixed(1);
  el('stat-steps').textContent = String(result.steps);
  el('stat-attempt').textContent = String(attemptNo);
  show(result.solved ? 'Solved' : 'Not solved', result.solved);
}

function show(text: string, solved: boolean): void {
  verdict.textContent = text;
  verdict.classList.toggle('solved', solved);
  sheet.hidden = false;
}

retry.addEventListener('click', () => {
  phase = 'idle';
  recorder.reset();
  ballAt = null;
  trace = null;
  sheet.hidden = true;
  paint();
});

window.addEventListener('resize', resize);
window.addEventListener('orientationchange', resize);
resize();
