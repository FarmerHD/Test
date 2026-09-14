import Matter from 'matter-js';
import { PHYSICS, SIM_VERSION } from './config';
import type { Level, Rect } from './level';
import type { Point } from './stroke';
import { measureInk } from './stroke';

export interface AttemptResult {
  solved: boolean;
  /** Tenths of a logical unit. */
  ink: number;
  steps: number;
  /** Ball centre every second step, whole logical units (spec 4.1). */
  trajectory: Point[];
  simVersion: string;
}

/**
 * Stage 0, window 1 only: this runs in the browser. From window 2 onwards it
 * moves into an Edge Function, this file is deleted, and the client keeps
 * nothing but the renderer that animates the returned trajectory (spec 4.1).
 *
 * It is written as a pure function of (level, stroke) precisely so the move is
 * a transport change and not a rewrite.
 */
export function simulate(level: Level, stroke: readonly Point[]): AttemptResult {
  const engine = Matter.Engine.create({ gravity: { x: 0, y: PHYSICS.gravity, scale: 0.001 } });

  const ball = Matter.Bodies.circle(level.ballStart.x, level.ballStart.y, PHYSICS.ball.radius, {
    density: PHYSICS.ball.density,
    restitution: PHYSICS.ball.restitution,
    friction: PHYSICS.ball.friction,
    label: 'ball',
  });

  const goal = Matter.Bodies.rectangle(level.goal.x, level.goal.y, level.goal.w, level.goal.h, {
    isStatic: true,
    isSensor: true,
    label: 'goal',
  });

  const bodies: Matter.Body[] = [ball, goal, ...level.obstacles.map(toStatic), ...strokeBodies(stroke)];
  Matter.Composite.add(engine.world, bodies);

  let solved = false;
  Matter.Events.on(engine, 'collisionStart', (event) => {
    for (const pair of event.pairs) {
      const labels = [pair.bodyA.label, pair.bodyB.label];
      if (labels.includes('ball') && labels.includes('goal')) solved = true;
    }
  });

  const trajectory: Point[] = [];
  let steps = 0;
  for (; steps < PHYSICS.maxSteps; steps++) {
    Matter.Engine.update(engine, PHYSICS.stepMs);
    if (steps % 2 === 0) {
      trajectory.push({ x: Math.round(ball.position.x), y: Math.round(ball.position.y) });
    }
    if (solved) {
      steps++;
      break;
    }
  }
  trajectory.push({ x: Math.round(ball.position.x), y: Math.round(ball.position.y) });

  Matter.Events.off(engine, 'collisionStart');
  Matter.Engine.clear(engine);

  return { solved, ink: measureInk(stroke), steps, trajectory, simVersion: SIM_VERSION };
}

function toStatic(rect: Rect): Matter.Body {
  return Matter.Bodies.rectangle(rect.x, rect.y, rect.w, rect.h, {
    isStatic: true,
    angle: rect.angle ?? 0,
    friction: PHYSICS.stroke.friction,
    label: 'obstacle',
  });
}

/** The stroke is a chain of static rectangles, one per segment (spec 4.1). */
function strokeBodies(stroke: readonly Point[]): Matter.Body[] {
  const out: Matter.Body[] = [];
  for (let i = 1; i < stroke.length; i++) {
    const a = stroke[i - 1]!;
    const b = stroke[i]!;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    if (len === 0) continue;
    out.push(
      Matter.Bodies.rectangle(
        (a.x + b.x) / 2,
        (a.y + b.y) / 2,
        len + PHYSICS.stroke.width,
        PHYSICS.stroke.width,
        {
          isStatic: true,
          angle: Math.atan2(dy, dx),
          restitution: PHYSICS.stroke.restitution,
          friction: PHYSICS.stroke.friction,
          label: 'stroke',
        },
      ),
    );
  }
  return out;
}
