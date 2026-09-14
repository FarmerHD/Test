# ONELINE

One stroke. Physics. One puzzle a day. Scored by rarity.

Draw a single line. The ball drops. Either it reaches the goal or it does not.
Everyone plays the same puzzle on the same day, and the next morning you find
out how many other people took the route you took.

The full product specification lives in [`docs/SPEC.md`](docs/SPEC.md). It is the
source of truth for every decision in this repository; this README only says
what is actually built so far.

## Status: stage 0, window 1

Per the build order in spec section 16, stage 0 exists to answer one question —
does somebody who solved today's puzzle come back tomorrow — and nothing else.

What is in this repository:

- Canvas playfield, 400 × 711 logical units, fitted to the device
- Pointer drawing with `touch-action: none`, arc-length sampled every 3 units,
  capped at 220 points (spec 4.2)
- Ink budget as the binding constraint, measured from the stored polyline
- Matter.js simulation at a fixed 1/120 s timestep, 600 steps maximum
- Trajectory playback, and a static traced path under `prefers-reduced-motion`
- One hardcoded level, its ink budget set from the fuzzer
- A first pass of the fuzzer (spec 12.0)

What is deliberately absent, because stage 0 does not have it: XP, levels,
streaks, shields, cosmetics, friends, the country board, the desktop layout,
account linking, share video, the solutions gallery, and the automated render.

### The one thing that is temporary by design

**The physics currently runs in the browser.** Spec section 4.1 is explicit that
the server is the only simulation authority and that the client runs no physics
at all. `src/game/sim.ts` is the throwaway from window 1. It is written as a pure
function of `(level, stroke)` so that moving it into an Edge Function in window 2
is a transport change rather than a rewrite — at which point this file is deleted
and the client keeps nothing but `render.ts`.

Nothing here is a scored quantity the client chooses. Ink is already derived from
the stored geometry, never sent as a number, which is the rule that survives the
move to the server.

## Running it

```bash
npm install
npm run dev        # vite dev server
npm run build      # typecheck + production build
npm run fuzz       # search the level for solutions, report ink and steps
```

Test on a real phone before anything else. A freehand drawing game that feels
wrong under a thumb is not fixable later.

## Layout

```
src/game/config.ts   physics constants, pinned together as sim_version
src/game/level.ts    Level type and the one hardcoded level
src/game/stroke.ts   arc-length sampler, ink measurement, server-side validation
src/game/sim.ts      Matter.js run  ← deleted in window 2, moves to the server
src/game/render.ts   canvas renderer, trajectory playback
src/main.ts          input, phases, result sheet
scripts/fuzz.ts      headless solution search (spec 12.0, first pass)
docs/SPEC.md         the specification
```

## Open items before the build goes further

Spec section 17 lists them. The two that block the name appearing anywhere
public: domain availability and trademark clearance (several mobile puzzle games
already ship as "1LINE" and "One Line").
