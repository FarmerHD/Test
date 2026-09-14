import { FIELD } from './config';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Radians, rotated about the centre. */
  angle?: number;
}

export interface Level {
  id: string;
  /** Display number only. The day boundary lives on the server (spec 4.4). */
  number: number;
  ballStart: { x: number; y: number };
  goal: Rect;
  obstacles: Rect[];
  /** Total stroke length in logical units. The real puzzle constraint (spec 4.2). */
  inkBudget: number;
}

/**
 * Stage 0, window 1: one hardcoded level. Deliberately throwaway - levels are
 * built against the fuzzer from window 8 onwards (spec 12.0).
 *
 * The ball drops left of centre, a ledge kicks it right, and the goal sits in a
 * pocket behind a lip so the ball cannot roll in without being lifted over it.
 */
export const LEVEL: Level = {
  id: 'stage0-001',
  number: 1,
  ballStart: { x: 72, y: 90 },
  goal: { x: 330, y: 604, w: 56, h: 56 },
  obstacles: [
    // Field frame.
    { x: FIELD.width / 2, y: -10, w: FIELD.width + 40, h: 20 },
    { x: -10, y: FIELD.height / 2, w: 20, h: FIELD.height + 40 },
    { x: FIELD.width + 10, y: FIELD.height / 2, w: 20, h: FIELD.height + 40 },
    { x: FIELD.width / 2, y: FIELD.height + 10, w: FIELD.width + 40, h: 20 },
    // A ledge that catches the drop and throws the ball right.
    { x: 96, y: 250, w: 150, h: 10, angle: 0.22 },
    // A pillar the stroke has to clear or route around.
    { x: 232, y: 400, w: 12, h: 190 },
    // The floor of the goal pocket, and the lip in front of it.
    { x: 330, y: 648, w: 140, h: 12 },
    { x: 268, y: 622, w: 12, h: 64 },
  ],
  /**
   * Set from the fuzzer, not from a hand solve (rule 12.1.2). The fuzzer's
   * cheapest single-segment solve costs 30 units; human-plausible ramps land
   * at 124-134, which is 78-84 % of this budget.
   */
  inkBudget: 160,
};
