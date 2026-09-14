/**
 * Physics constants, spec section 4.1. These are pinned and versioned together
 * with the Matter.js version as `sim_version`. Changing any value here is a new
 * sim_version and invalidates the regression corpus.
 */
export const SIM_VERSION = 'stage0-matter0.20-r1';

export const FIELD = { width: 400, height: 711 } as const;

export const PHYSICS = {
  /** Fixed timestep, never tied to requestAnimationFrame. */
  stepMs: 1000 / 120,
  maxSteps: 600,
  gravity: 1.0,
  ball: { radius: 8, density: 0.001, restitution: 0.25, friction: 0.2 },
  stroke: { width: 4, restitution: 0.1, friction: 0.4 },
} as const;

export const STROKE = {
  /** Arc-length sampling distance in logical units. */
  sampleDistance: 3,
  maxPoints: 220,
  /** Server-side validation window for consecutive point distances. */
  minSegment: 1.5,
  maxSegment: 6.0,
} as const;
