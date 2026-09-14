# ONELINE — Product Specification

One stroke. Physics. One puzzle a day. Scored by rarity.

*Revision 3. Quota-based rarity, split economies, no client simulation, server-derived ink, staged build with a validation gate that can actually be read.*

---

## Revision notes

What changed against revision 2, and why. Read this first if you know the old document.

| Area | Change | Reason |
|---|---|---|
| Rarity tiers | Absolute share thresholds and solver floors replaced by **quotas over the day's sorted cluster list** | Cluster sizes are power-law distributed. Under R2, Common and Uncommon absorbed 85–95 % of solvers and the rest jumped straight into the tail. Rare and Epic were structurally almost empty, and the floors delayed one-of-one inflation instead of fixing it |
| One of one | Removed from the tier ladder. Now an orthogonal **Solo route** badge | At 600 solvers a level still produces 20–50 singletons. That is 3–8 % of solvers holding the supposedly rarest object. As a badge at that frequency it is a nice find; as the top of a ladder it was a lie |
| Rarity XP | Removed. Rarity pays **rarity points**, not XP | Rarity paid up to 1000 XP, efficiency at most 200, and the two reward opposite behaviour. Optimising for efficiency converges on the minimal stroke, which is the dominant cluster, which is Common. Rational players ignored efficiency entirely |
| Close job | No longer touches `players.xp` | Direct consequence of the line above. XP is now fully settled the moment the player drops |
| Client simulation | **Deleted.** The server returns the ball trajectory, the client animates it | The preview existed to save 150–300 ms once per day. It cost Matter.js in the bundle, a whole divergence bug class, and it diverges hardest exactly where players play, near the ink budget edge |
| Replay data | Specified. Trajectory is returned by the API and re-derived on demand for the gallery | R2 said replays are "reconstructed from the stored stroke by re-running the server simulation output" and never said where that output lives or what shape it has |
| Ink | Computed **only** by the server from the stored stroke. No client-supplied value | R2 took `max(client_value, server_value)`. A cheater wants ink *low*, so the max rule caught nothing. The whole server-authority decision had one hole in it and this was it |
| Resampling | 6 units → 3 units, point cap unchanged at 220 | Halves the granularity of the ink measure at the same 880-byte storage cost |
| Retries and rarity | A retry never enters the rarity system. Rarity belongs to a player's **first solved attempt** | R2 let every solved attempt increment `daily_stats.solvers`, so one human with a retry token counted as two solvers and shifted the denominator everyone else is measured against |
| Retry allowance | `attempt_no` is derived server-side and `retry_tokens` is decremented in the same transaction | R2 accepted `attempt_no` from the client and never decremented the token. Sending `attempt_no = 3` bought a free extra attempt |
| Daily bonus | Tied to `last_solved_on`, not `last_played_on` | R2 set `last_played_on` on unsolved attempts too, so a failed morning attempt silently ate the 50 XP daily bonus from the evening's successful retry |
| Streak multiplier | Actually applied | R2 specified it in section 6 and never multiplied by it in `record_attempt` |
| Date handling | `levels.play_date` replaces `current_date` everywhere | `current_date` follows the session timezone and has nothing to do with the locked 00:00 UTC boundary |
| `players` row creation | Trigger on `auth.users` specified, with handle collision retry | Nothing in R2 created the row. The first `record_attempt` would have failed on a foreign key |
| Percentiles on the result sheet | Replaced by live counts. Percentiles appear on the reveal screen only | R2 removed the provisional *tier* for being a promise that midnight breaks, then left provisional *percentiles* in place. "Top 4 %" at 08:00 becomes "Top 22 %" by close. Same flaw, different number |
| Solutions gallery | Gated. Yesterday by default, today only after your own Drop | The R2 desktop layout put live solutions of today's puzzle next to the Drop button, which is the exact spoiler that section 11.2 calls referral-killing |
| First session | New section 2.6. Two archived easy levels before today's puzzle | A visitor arriving from a Saturday video at a 55 % solve rate got one failure and a 24-hour wait as their entire experience of the product |
| Content engine | The daily Format A video is **rendered server-side automatically** | R2 named the content cadence as the fatal risk and mitigated it with willpower. Both clips in Format A already exist as data after the close. Rendering them turns the risk from "produce four videos a week forever" into "upload a finished file" |
| Cloudflare | In front from day one, not from 5,000 users | It is free, it takes an hour, and `players.country` has no other source. R2 used `CF-IPCountry` in stage 1 and introduced Cloudflare in stage 2 |
| Runtime | Pinned, with `sim_version` on every attempt | One runtime makes the simulation deterministic only within one deployment. A Deno or V8 upgrade mid-season can split every cluster |
| Cost | New section 14 | R2 had a cost table and no statement about who pays it or what the project is for |
| Legal | TTDSG is TDDDG since May 2024. Minors addressed | Small corrections, cheap now |
| Gate | Rewritten as a qualitative signal plus a cold cohort | D1 of 40 % versus 30 % across 30–100 friendly testers is roughly ±14 points of confidence interval. The number could not carry the decision it was assigned, and the sample was friendly, and stage 0 has no streak to retain anybody with |
| Timeline | Stage 0 is 8–12 weekends | Four weekends for a fuzzer, an authoritative simulation, topology hashing with two calibrated thresholds, sharded counters, a close job, a reveal screen, seven fuzzed levels and a deploy is the same optimism R2 criticised in R1, at a smaller scale |

---

## 0. Locked decisions

| Question | Decision | Reason |
|---|---|---|
| Product language | English only | A German-only product caps hard well below the target audience, and the interface carries so little text that English is not a barrier for non-native players. Keep strings in one file so translation stays possible later, but ship nothing but English |
| Name | `ONELINE`, pending the check in section 17 | States the rule, works in every language, short domain. Trademark clearance is not yet done |
| Domain | Own short domain, not a subdomain | A viral game gets typed, screenshotted and shown on screen. `oneline.app` is typeable, `game.dominikbarth.com` is not |
| Platform | Web only, no app store | Zero install friction is the entire competitive advantage. A PWA manifest covers home-screen installs |
| Accounts | Anonymous by default, optional linking | See section 8. Nobody is ever asked to sign up before they have something worth keeping |
| Simulation authority | **Server, and only the server** | The client draws and animates a trajectory it is handed. It runs no physics. See section 4.1 |
| Day boundary | **00:00 UTC** | One boundary for puzzle publishing, cluster close and streak evaluation. Displayed to the player in their local time, never as "UTC". See section 4.4 |
| **Two economies** | **XP and rarity points are separate currencies and never convert** | XP rewards solving well. Rarity rewards solving differently. These are opposite behaviours and a single currency forces the player to pick one and ignore the other. See sections 5.3 and 6 |
| **Edge** | **Cloudflare in front from day one** | Free tier, one hour of work, and it is the only source for `CF-IPCountry`. It also removes the 00:00 UTC thundering herd on the new level JSON |
| **What this is** | **A project that must not cost more than a hobby** | There is no revenue model and none is planned. See section 14. That is a decision, not an omission, and it constrains the scaling plan |

---

## 1. Visual system

### 1.1 Direction

**Concept: lab report, not sketchbook.**

The core of the game is a hand-drawn line obeying physics. The visual language is a technical test record: graph paper, graphite, one precisely marked test body. Your stroke is the only handwritten mark in an otherwise measured space. That contrast carries the whole interface.

Rarity tiers deliberately break the restraint. They are the only saturated colour in the product, which is why they read as a find in the record rather than decoration.

**Deliberately avoided**, because it reads as templated:
- Warm cream background with a serif display face and a terracotta accent
- Near-black background with a single acid accent
- A card kit where everything shares one radius and one grey shadow
- Tracked-out all-caps eyebrow labels above every heading

### 1.2 Colour

```
--paper        #E4E7DE   graph paper, cool pale green. NOT cream
--paper-deep   #D6DACF   recessed panels
--grid         #C8CEBF   grid rules, 0.5px
--graphite     #22241F   primary text, frames, obstacles
--graphite-mid #5A5D54   secondary text
--graphite-low #8C9084   hints, disabled
--ball         #E8541E   the ball. Only saturated fill on the playfield
--goal         #1B6B4A   the goal
--ink          #1A3A6B   your drawn stroke
```

Dark mode inverts paper and graphite. Ball and goal keep identical values. The playfield must read identically in both modes, otherwise it is not a fair leaderboard.

**Rarity scale.** Five tiers, deliberately borrowed from loot rarity, because players decode it without explanation:

```
Common     #8C9084   grey      circle
Uncommon   #3E8E4E   green     diamond
Rare       #2C6FC4   blue      hexagon
Epic       #7B3FC4   violet    star
Legendary  #C9901A   gold      crown
```

**Solo route** is not a tier. It is a separate mark, a thin gold ring, that can sit on any tier badge and means literally *nobody else took this route today*. See section 5.4.

Every tier carries its own shape badge as well as its colour. Colour alone is unreadable for colour-blind players, and the tier is the single most important piece of information in the interface.

**Rarity colour is never used before the tier is final.** The result screen on the day of play shows the route counter in `--graphite`, not in a tier colour. The saturated palette appears exactly once per solve, on the next-morning reveal. That restraint is what makes the reveal land.

### 1.3 Typography

**One family: Archivo Variable.** Two axes, width and weight, a single self-hosted `.woff2`. That satisfies the GDPR constraint without compromise and still gives display and body from one source.

| Role | Setting | Used for |
|---|---|---|
| Figure display | Archivo Expanded 700, 48–72px, `font-variant-numeric: tabular-nums` | Route counter, percentage, level |
| Heading | Archivo 600, 22px | Panel titles |
| Body | Archivo 400, 16px, line-height 1.6 | Everything else |
| Data | Archivo 500, 13px, tabular-nums | Leaderboard rows, stats |

Tabular figures are not optional here. The whole interface is a numeric readout, and jittering digit widths in a live leaderboard look broken.

Sentence case throughout. No all-caps labels, no single highlighted word inside a heading.

### 1.4 Motion

One orchestrated moment: **the simulation**. Ball drops, line holds or fails, camera stays fixed. That moment is the game and gets no competition.

- No entrance animations on sections
- No hover transitions on cards
- The rarity badge gets **one** reveal animation, 400 ms, on the next-morning screen only
- `prefers-reduced-motion` disables the reveal, never the simulation itself. With reduced motion the trajectory is drawn as a static traced path with the outcome stated in text

### 1.5 Accessibility, stated honestly

A freehand drawing game has no meaningful keyboard or screen-reader path, and pretending otherwise produces a worse product than admitting it. What is in scope:

- Colour is never the only carrier of information (shape badges, section 1.2)
- All text meets 4.5:1 against its background in both modes
- Touch targets at 56px on the play screen, 44px elsewhere
- `prefers-reduced-motion` respected for every animation including the simulation, which degrades to a traced path rather than disappearing
- The solutions gallery and the profile are fully navigable and readable without drawing

Out of scope and documented as such: playing the game without a pointing device.

---

## 2. Mobile screens

Portrait, 100dvh, no scrolling on the play screen. Over 90 % of the audience arrives on a phone.

### 2.1 Play

```
┌─────────────────────────┐
│ #482     Ink 84/100  ⚙  │  44px header
├─────────────────────────┤
│                         │
│      ●  ← ball          │
│                         │
│   ▬▬▬▬      ▬▬▬         │  playfield
│                         │  full width
│         ▬▬▬▬▬           │  9:16
│                         │
│              ▓ ← goal   │
│                         │
├─────────────────────────┤
│     Draw one line       │  hint, clears after
│                         │  first stroke
│    [ Clear ] [ Drop ]   │  56px, thumb reach
└─────────────────────────┘
```

**Rules:**
- The playfield is always 400 × 711 logical units regardless of device. Only the rendering scales. Without this the leaderboard is meaningless
- The ink meter counts down live while drawing and turns red below 15 %. The number it shows is the client's running estimate; the number that is scored comes back from the server and may differ by a unit or two. Both are displayed to whole units, so the difference is almost never visible
- One continuous stroke. Lifting the finger ends it
- Clear is unlimited. Nothing is submitted until Drop
- After Drop the day is over, unless the player holds a retry token (section 2.1.1)

**What happens on Drop:**

```
Drop pressed
  → button becomes "Dropping…", playfield freezes, stroke stays visible
  → POST /attempt                          typically 150–300 ms
  → response carries verdict + trajectory
  → ball animates along the returned trajectory   2–5 s
  → result sheet slides up
```

There is no local physics. The client never guesses an outcome it might have to retract. The 150–300 ms wait replaced an entire class of bug and about 25 KB of gzipped bundle, and at that length it reads as the button responding rather than as latency.

If the round trip exceeds 800 ms the button state gains a quiet indeterminate bar. If it fails entirely, section 4.1 covers the queue.

**The critical implementation detail: `touch-action: none` on the canvas.** Without it iOS Safari scrolls the page while the user draws. This is the single most common killer bug in mobile web drawing games. Use Pointer Events, not Touch Events, and capture the pointer on `pointerdown`.

### 2.1.1 Retry state

Section 7 grants retry tokens at streak days 7, 14 and 30. The play screen must show that state, otherwise Drop reads as irreversible when it is not, and the player will not use the token.

```
┌─────────────────────────┐
│ #482   Ink 84/100  ⚙    │
│ ◇ 1 retry available     │  only when retry_tokens > 0
```

After a Drop, if the player holds a token, the result sheet carries a third button, `Try again (1 left)`. Using it consumes the token and creates a new attempt. Rules, in full:

- A retry counts for **solving the puzzle, XP and the streak**
- A retry does **not** count for efficiency, speed, or rarity
- Rarity belongs to a player's **first solved attempt**, whichever attempt number that is. One player is one entry in one cluster, ever
- Only `attempt_no = 1` is eligible for the daily boards

The reasoning for the rarity rule: a player who could re-roll their topology would be doing exactly the thing section 8.6 describes as abuse, only with the game handing them the tool. Tying rarity to the first solve keeps one human as one solver in the denominator and removes the question of which of two clusters a player belongs to.

`attempt_no` is assigned by the server, never sent by the client, and the token is decremented in the same transaction as the insert. See section 10.3.

### 2.2 Result, on the day of play

Opens as a bottom sheet over the frozen playfield. The playfield stays visible because the player wants to look at their own line.

**There is no tier on this screen, and no percentile either.** Clusters only grow over the day and the ink distribution only fills in over the day, so every ratio named at 08:00 is a promise midnight will break. What is shown instead is the set of facts that are true at the moment of reading and stay true: counts.

```
┌─────────────────────────┐
│      (playfield)        │
│   your line and the     │
│   ball's traced path    │
├─────────────────────────┤
│ Solved                  │
│                         │
│     3 of 412            │  Expanded 72px
│ took this route today   │
│                         │
│ Ink   62   · 29 below   │
│ Time  2.4s · 17 below   │
│                         │
│ +456 XP                 │
│ Rarity settles at 00:00 │
│                         │
│ 9 day streak    ×1.9    │
│                         │
│ [ Share ] [ Solutions ] │
└─────────────────────────┘
```

`3 of 412` is a better headline than any tier name would be. It is live, it is verifiable, it rises when the player refreshes, and it makes the midnight close feel like a settlement rather than a correction. `29 below` means twenty-nine people have used less ink so far today. It goes up as the day fills, which is honest, where a percentile going down looks like a downgrade.

**Percentiles exist, but only where they are final.** They appear on the reveal screen (2.3), on the profile, and on closed-day board views. Never on a live day.

**Percentile before absolute rank, everywhere a percentile appears.** Rank 1,204 of 80,000 is demoralising; "Top 4 %" is shareable.

### 2.3 The reveal, next morning

The first thing the player sees on their next visit after a solved day. This is where the saturated palette and the one reveal animation are spent.

```
┌─────────────────────────┐
│ Yesterday, #482         │
│                         │
│ ★ EPIC  ◯ solo route    │  badge, 400 ms reveal
│                         │
│ 1 of 4,182 found it     │
│ Rarest 1.2 % of routes  │
│                         │
│ Ink  top 7 %            │
│ Time top 4 %            │
│                         │
│ +65 rarity points       │
│                         │
│ [ Replay ] [ Share ]    │
│ [ Today's puzzle ]      │
└─────────────────────────┘
```

This produces the same second visit per day that a provisional tier was meant to produce, without ever making a claim that gets walked back. It is also where every final percentile lands at once, which gives the screen more to reveal than a badge alone.

Share is unlocked in full Solution mode here, because the puzzle is closed (section 11.2).

Dismissible, shown once, never nagging. If the player skipped a day, this screen is skipped too.

### 2.4 Solutions gallery

Three tabs, each showing replayable solves:

| Tab | Content |
|---|---|
| Common | The three largest solution clusters with their share |
| Best | The three most efficient solves of the day |
| Strange | Three randomly drawn solo routes |

**The gallery is spoiler-gated, and this is not optional.**

| Day | Visible when |
|---|---|
| Yesterday and earlier | Always. This is the default tab on open |
| Today | Only after you have dropped. Before that, today's tab shows the puzzle number and `Solutions unlock after your drop` |

A player who can watch the 61 % route before drawing is not playing the game, and section 11.2 spends a whole table on why a spoiler kills the referral. Shipping the spoiler in our own interface while gating it in the share artifact would be absurd.

Strange is the most important tab. It is the reward for coming back and simultaneously the content supply for section 11.3.

Replays are driven by a trajectory, not by video. The stored stroke is 880 bytes; the trajectory is re-derived on demand by the simulation endpoint and cached at the edge, because a closed day is immutable. See section 4.1.

### 2.5 Profile

Level and XP bar, streak, a rarity cabinet showing collected tiers and solo routes, unlocked ink colours, country rank, friend code, and the account state row described in section 8.

The rarity cabinet is the long-term motivator. It is the only thing that grows across months and never resets. It is also the entire payoff of the rarity system now that rarity pays no XP, so it gets real space on the screen rather than a row.

```
Cabinet
  ♛  Legendary      2
  ★  Epic          11
  ⬢  Rare          34
  ◆  Uncommon      96
  ◯  Solo routes    7        ← can overlap with any tier above
```

### 2.6 The first session

A visitor arriving from a video lands on whatever puzzle is live. On a Saturday that is a 55 % solve rate, and a failure with a 24-hour cooldown is the entire product for that person. D1 dies there, not in the XP curve.

**A first-time visitor plays two archived easy levels before today's puzzle.**

```
first visit
  → archived level A   easy, ~92 % solve rate, unranked
  → archived level B   easy, introduces one obstacle interaction, unranked
  → today's puzzle     ranked, the real thing
```

Rules:
- Archived levels are unranked. No XP, no clusters, no boards, no counters touched
- They are skippable with one tap, labelled `Skip to today`
- They are also permanently available from the menu as practice, for the same reason: a player who wants to feel the physics again should not have to spend their one daily shot on it
- A direct puzzle link (`/d/482`) skips the onboarding, because the sender's intent is that specific puzzle. The onboarding is offered afterwards instead

Archived practice runs through the same server simulation as everything else. It is two extra Edge Function invocations per new visitor and it is the cheapest retention work in the document.

---

## 3. Desktop screens

**Rule: the playfield stays exactly the same size and proportion.** Maximum 440px wide, centred. No upscaling, no widescreen variant. The moment desktop players can see more or draw more precisely, every leaderboard is void.

Desktop gets no larger play area, it gets **more context around it** — and that context obeys the same spoiler gate as section 2.4.

Before your drop:

```
┌──────────────────────────────────────────────────────┐
│  ONELINE          #482          Level 12   9 days    │
├──────────────┬─────────────────┬─────────────────────┤
│              │                 │                     │
│ YESTERDAY    │    ●            │  YESTERDAY #481     │
│ ★ Epic       │                 │                     │
│ ink top 7 %  │  ▬▬▬     ▬▬▬    │  [replay] 58 %      │
│              │                 │  [replay] 21 %      │
│ STREAK       │      ▬▬▬▬▬      │  [replay]  3 %      │
│ 9 days ×1.9  │                 │                     │
│              │           ▓     │  SOLO ROUTES        │
│ GERMANY      │                 │  [replay] anna_k    │
│ Rank 4       │   Ink 84/100    │  [replay] ryo       │
│              │ [Clear] [Drop]  │                     │
└──────────────┴─────────────────┴─────────────────────┘
```

After your drop, both columns switch to today: live route counter, live ink and time positions, today's clusters.

Mobile is the quick hit, desktop is the display case. Desktop users stay longer, so give them more to look at, not more to do.

Mouse drawing: pointerdown, move, pointerup. Identical sampling to touch.

Desktop is stage 1, not stage 0. Over 90 % of the audience is on a phone and the desktop layout answers no open question.

---

## 4. Game mechanics

### 4.1 Physics and where it runs

```
Engine           Matter.js
Timestep         fixed 1/120 s, NEVER tied to requestAnimationFrame
Sim length       max 600 steps (5 s), then abort = unsolved
Gravity          1.0 down
Ball             radius 8, density 0.001, restitution 0.25, friction 0.2
Stroke           chain of static rectangles, width 4, restitution 0.1, friction 0.4
Goal             sensor body, contact = solved
```

**The simulation runs on the server. There is no client simulation at all.**

Revision 2 already moved authority to the server and kept a client-side preview so the animation could start before the round trip finished. Revision 3 deletes the preview. The reasoning:

*What the preview bought.* 150 to 300 milliseconds, once per day, on the one action the player takes all day.

*What the preview cost.* Matter.js in the client bundle, roughly 25 KB gzipped, against a 1.5 second time-to-playable budget. A whole class of divergence bug. And the divergence is not uniformly distributed: good solutions sit at 70 to 85 % of the ink budget by design (rule 12.1.2), which is exactly the regime where a float difference of 1e-15 flips a marginal collision and therefore the outcome. The preview is least trustworthy precisely where it is most watched. A player who sees the ball enter the goal and then reads *not solved* has had the worst possible experience the product can produce, and R2's answer was "the server wins silently", which is not an answer.

*What replaces it.* The response carries the trajectory. The client animates a path it was handed.

```
POST /attempt  { level_id, stroke }                        ~880 bytes
  │
  ├─ auth       session from the Supabase JWT
  ├─ validate   point count ≤ 220, all points inside 400×711,
  │             segment lengths within the sampling tolerance,
  │             polyline length ≤ ink_budget
  ├─ allowance  server derives attempt_no; > 1 requires a retry token
  ├─ simulate   authoritative Matter.js run, max 600 steps
  ├─ derive     solved, ink_used, sim_steps, solution_hash, trajectory
  ├─ record_attempt(...)  as service role
  └─ return     { solved, ink, steps, trajectory,
                  route_count, solvers, ink_below, steps_below,
                  xp_awarded, attempt_no, retries_left }
```

*Trajectory format.* The ball's centre, every second step, quantised to whole logical units, delta-encoded as signed bytes with a two-byte escape. A 300-step solve is roughly 150 points and lands under 400 bytes before compression. It is not stored. It is a derived value with a pure function behind it.

*Replays.* `GET /replay/{attempt_id}` re-runs the simulation from the stored stroke and returns the same structure. A closed day is immutable, so the response is cached at the edge for a year. Storage stays 880 bytes per solve and the gallery costs nothing to serve twice.

**Determinism is a property of one pinned build, not of "the server".**

One runtime removes cross-device divergence. It does not remove cross-*version* divergence. V8 ships its own implementations of `Math.sin`, `Math.cos` and `Math.atan2`, and a Deno or V8 upgrade can change a low bit. If that happens mid-day, morning solves and afternoon solves of the same route land in different clusters and the day's rarity is nonsense.

Therefore:

- The simulation runtime, the Matter.js version and the physics constants are pinned and versioned together as `sim_version`
- `sim_version` is written on every attempt
- The simulation is never redeployed during a live day. Deploys happen inside the first hour after the close, and the fuzzer's regression corpus (section 12.0) runs against the new build first, comparing hashes on ten thousand known strokes
- If a build changes any hash in the corpus, it does not ship until the change is understood

*Failure handling.* If the POST fails, the attempt is queued in IndexedDB and the sheet shows `Not submitted yet — retrying`. Nothing is scored, nothing is lost, and nothing is animated, because there is no trajectory to animate. A queued attempt is replayed on the next app open and rejected by the server if the day has closed.

*Cost.* 600 steps with roughly ten bodies is 2–5 ms in a Deno or Workers runtime. At 100,000 solves a day that is under ten minutes of CPU per day. This is not a scaling concern at any realistic size.

### 4.2 The stroke and how ink is measured

- Sampled every **3 logical units** of travel, not per frame
- Maximum 220 points, stroke terminates beyond that
- Stored as an `Int16Array` of x,y pairs quantised to whole units. 220 points = 880 bytes, enforced by a check constraint
- **Ink budget** is total stroke length in units, set per level. This is the real puzzle constraint. Without a budget every level is solvable by scribbling a large blob
- One stroke per attempt, no lifting

**Ink is computed by the server, from the stored stroke, and by nobody else.**

Revision 2 had the client send its measured raw-path length and took `max(client, server)` on the grounds that the client could then never under-report. That rule is backwards. A cheater wants ink *low*. Under R2 the floor a cheater could reach was exactly the server's own polyline measurement, so cheating was both possible and rewarded, and the resulting values sat at the very top of the efficiency board.

The rule now: `ink_used = sum of the stored polyline's segment lengths`, in **tenths of a logical unit**, computed server-side. The client sends geometry and nothing else. There is no scored quantity in this product that the client contributes a number to.

*The consequence, stated openly.* Arc-length resampling means the polyline length is close to `3 × (points − 1)`, so ink is coarsely granular. Halving the sampling distance from 6 units to 3 halves that granularity at identical storage cost, which is why the number changed, but it does not eliminate it. At a 200-unit budget there are roughly 65 reachable ink values and at 100,000 solvers thousands of players share each one.

That is survivable because the efficiency board was never going to be a ranked list of individuals (section 4.3). It is presented as a percentile and a value neighbourhood, and both of those are *more* readable with coarse buckets, not less. What is not survivable is a scored number the client can choose, which is what R2 shipped.

The 220-point cap at 3 units allows a stroke up to ~660 units, comfortably above any sane ink budget on a 400-unit-wide field. The ink budget stays the binding constraint; the point cap is only a storage guard.

*Validation.* The server rejects a stroke whose consecutive-point distances fall outside [1.5, 6.0] units. A client that under-samples to fake a shorter polyline fails that check, and a client that over-samples gains nothing because the measured length only rises.

### 4.3 Scoring axes

| Axis | Measure | Presented as |
|---|---|---|
| Solved | Ball contacts goal within 600 steps | Yes/no |
| Efficiency | Ink consumed, lower is better | Live: count below you. Final: percentile |
| Speed | Simulation steps to goal, lower is better | Live: count below you. Final: percentile |
| Rarity | Cluster position at day close, see section 5 | Tier, next morning |

Efficiency and speed are separate measures because they reward opposing philosophies. The most economical stroke is rarely the fastest.

**Neither is published as a ranked list of individuals.** Once somebody finds the minimal stroke, thousands of players sit on the same ink value and the ordering is decided by arrival time, which is a lottery presented as a leaderboard. What is shown instead:

- Live, during the day: `29 players have used less ink so far`
- Final, after the close: the player's own percentile as the headline
- The three best values of the day with handles, as a target to beat
- A neighbourhood window by value, not by rank: `4 players used 61, you used 62, 812 used 63`

### 4.4 The day boundary

One boundary, `00:00 UTC`, governing all three of:

- Which puzzle is live
- When clusters close and tiers are assigned
- Whether a streak day counts

The player never sees the letters UTC. The interface shows the local equivalent: `New puzzle in 4 h 12 min`, and on the profile, `Your day ends at 02:00`.

The consequence is stated openly rather than discovered later: in Central Europe the day rolls over at 01:00 or 02:00 local, and in the US it rolls over in the afternoon. This is a known property of every daily puzzle with a single global board, and the alternative, per-timezone days, makes a shared daily leaderboard impossible.

**Nothing in the codebase uses `current_date`.** Every date decision is taken against `levels.play_date` of the level being played, which is a stored fact and not a function of the database session's timezone. The daily bonus, the streak evaluation and the close job all read the same column.

**The systematic side effect to watch:** the first solvers of a puzzle are always the same timezone band. They see the smallest route counters and the thinnest ink distributions. Because both the tier and every percentile are now assigned at the close (sections 2.2 and 5.5), this is a display artefact only, not a scoring one.

---

## 5. Rarity

This is what makes the game scale, and it is the part that is easy to build wrong. Revision 1 got the definition of "same solution" wrong. Revision 2 fixed that and got the *distribution* wrong. This section is mostly about the second problem.

### 5.1 What is not clustered

Not the stroke shape. Two players can draw visually near-identical lines that behave completely differently, and the reverse. Comparing point coordinates is meaningless.

### 5.2 What is clustered: solution topology

During the authoritative simulation, record:

1. **Collision sequence.** The ordered list of the ball's first contacts: `stroke, wall_left, stroke, obstacle_2, goal`. Repeated contacts with the same body collapse into one entry.
2. **Path grid.** The playfield is divided into 6 × 10 cells. The sequence of cells the ball's centre passes through, run-length encoded.

Both are concatenated into a string and stored as a 64-bit hash.

```
"S,WL,S,O2,G|03,13,14,24,34,35,45,55,56"  →  hash
```

The result is the correct definition of "same solution": two players who route the ball along the same path with the same bounces share a hash regardless of how their strokes look. Anyone who finds a genuinely different route gets their own hash.

**Two noise filters are mandatory.**

*Contact threshold.* A collision only enters the sequence if its normal impulse exceeds `0.15`. Without this, a graze that changes the ball's velocity by a thousandth of a unit produces a different sequence and therefore a phantom topology. Rarity built on unfiltered contacts rewards floating-point noise, and the players who benefit are the ones who happened to skim a wall.

*Cell hysteresis.* A cell entry is only recorded once the ball's centre has crossed **past the midline** of the new cell, not on first touching its boundary. Without this, a ball travelling along a cell boundary chatters between two cells and the run-length encoding records that chatter as structure.

Both thresholds are tuned once during the soft launch with the fuzzer (section 12.0) by checking that visually identical solves collapse to one hash. Both are part of `sim_version` and changing either is a breaking change that may not ship mid-day.

**Why this scales without limit:** the space of possible topologies grows combinatorially with obstacle count. At a million players a genuinely novel topology is still reachable and still rare. The exact inverse of a fixed slot pool.

### 5.3 Tiers are quotas, not thresholds

**The problem with revision 2.** R2 assigned tiers by a cluster's share of the day's solvers, with absolute solver floors underneath. That looks reasonable and produces a broken distribution, because cluster sizes in this game are power-law shaped:

```
typical day, 4,000 solvers, 130 distinct topologies

cluster 1     2,380 solvers   59 %     the intended solution
cluster 2       640 solvers   16 %     the obvious variant
cluster 3       290 solvers    7 %
cluster 4        95 solvers  2.4 %
clusters 5–18   12–60 each
clusters 19–130  1–4 each              the tail: ~110 clusters, ~190 solvers
```

Under R2's thresholds that day resolves as: clusters 1 and 2 are Common and Uncommon and absorb 75 % of solvers, cluster 3 is Uncommon, cluster 4 is Rare, a handful of mid clusters are Epic, and then roughly 110 players land on Legendary or one-of-one. **Rare and Epic are nearly empty and the top of the ladder is crowded.** The ladder has a hole in the middle, which is the opposite of what a rarity ladder is for.

The solver floors do not fix this. They gate *when* a tier becomes reachable, not *how many* people reach it. R2's own arithmetic notes 15–40 singletons at 240 solvers; at 600 solvers there are 20–50, which is still 3–8 % of everyone holding the top badge.

**The fix: sort the day's clusters by size and cut the sorted list at fixed solver quotas.**

At the close, take every cluster of the day, sort ascending by `final_count` (rarest first, ties broken by the cluster's first attempt id so the order is deterministic), and walk the list accumulating solvers. A cluster's tier is decided by where its **midpoint** falls in the cumulative solver share:

| Tier | Cumulative solver share, from the rarest end | Rarity points |
|---|---|---|
| Legendary | 0 – 0.5 % | 100 |
| Epic | 0.5 – 5 % | 40 |
| Rare | 5 – 15 % | 15 |
| Uncommon | 15 – 40 % | 5 |
| Common | 40 – 100 % | 0 |

A cluster is never split across two tiers. The midpoint rule keeps a large cluster that happens to start at 0.4 % from swallowing the Legendary band.

The same day now resolves as it should:

```
4,000 solvers

Legendary     20 players   0.5 %    the rarest handful of routes
Epic         180 players   4.5 %
Rare         400 players    10 %
Uncommon   1,000 players    25 %
Common     2,400 players    60 %
```

**Why this is the right shape:**

- The pyramid is guaranteed by construction, at every player count and on every level, regardless of whether the level produced 4 topologies or 400
- Tier value does not drift as the game grows. Legendary means "rarest half a percent of today's routes" on day 3 and on day 900
- It removes the floors, the unreachable-tier table and the special cases underneath them
- It self-scales downward: at 200 solvers, 0.5 % is one player, so exactly one Legendary is awarded, and at 40 solvers the rarest singleton's midpoint is 1.25 %, so the day's top award is Epic. The ladder unlocks with the player base without anybody writing a floor table

**One guard remains.** Below **30 solvers** the day is unranked: every solve is Common, no rarity points are awarded, and the reveal screen says so plainly. Quotas over twenty people are noise.

*What a player is told.* Not the mechanism. The reveal screen says `Rarest 0.4 % of routes` next to the badge, which is both the truth and the reason for the badge. Section 15's mitigation for "rarity not understood" is unchanged: one explanation card on the first reveal, never again.

### 5.4 Solo route is a badge, not a tier

`final_count = 1` means literally nobody else took your route that day. That is a good feeling and worth marking. It is not the rarest thing in the game, because on a level with a fat tail a hundred people can have it at once.

So it comes out of the ladder and becomes an orthogonal mark: a thin gold ring that can sit on any badge. `★ Epic ◯ solo route` is a normal and correct combination. It carries **+25 rarity points** on top of the tier's own.

The cabinet counts solo routes separately from tiers (section 2.5), which gives the collection two independent axes to grow along instead of one.

This also removes a small absurdity from R2: a cluster of one and a cluster of two, on the same day, could land three tiers apart because one crossed a hard `count = 1` test and the other did not.

### 5.5 Nothing is provisional

Revision 1 showed a provisional tier and topped up XP at midnight. Revision 2 removed that and then left provisional *percentiles* on the result sheet, which is the same mistake wearing a different number: "Top 4 %" measured against the 400 people who have played so far becomes "Top 22 %" against the 4,000 who eventually play, and the player who checks twice watches their result get worse for no reason they did anything about.

| Moment | Shown | Credited |
|---|---|---|
| On solving | `3 of 412 took this route today`, `29 below you on ink`. Live counts, no ratios | XP in full, immediately and finally |
| At 00:00 UTC | Tier and every percentile frozen from the final population | Rarity points |
| Next visit | The reveal screen, section 2.3 | Already credited |

Counts are the right thing to show on a live day for a simple reason: **counts only go up, and everybody understands that a count going up is the day filling in.** A ratio moving is indistinguishable from a downgrade.

XP is never reduced, because XP no longer depends on anything that settles at midnight (section 6). Rarity points are only ever added.

---

## 6. XP and levels

### 6.1 Two currencies that never convert

**XP rewards solving well. Rarity points reward solving differently. They are separate and neither buys the other.**

Revision 2 paid rarity in XP, up to 1000 for a one-of-one against at most 200 for perfect efficiency. That is a five-to-one incentive pointed at the opposite behaviour: a player optimising for efficiency converges on the minimal stroke, the minimal stroke is what most people find, and what most people find is the dominant cluster, which is Common and pays nothing. Under R2's numbers the rational play was to draw something deliberately strange every day and ignore the efficiency board entirely. That is not a leaderboard, it is a lottery ticket with a drawing surface.

Splitting the currencies lets both systems be honest about what they are:

| Currency | Earned by | Spent on | Settles |
|---|---|---|---|
| XP | Solving, efficiency, the daily bonus, the streak | Levels, and levels unlock cosmetics | Immediately, on Drop |
| Rarity points | Tier and solo route at the close | The cabinet and the season board | At 00:00 UTC |

A player who wants to level chases ink. A player who wants a cabinet chases strange routes. Both are playing the game as designed and neither is leaving obvious value on the table.

### 6.2 XP formula

```
Base            solved                        100
Efficiency      (1 - ink/budget) × 200        0 – 200
Daily           first solve of the day        50
──────────────────────────────────────────────────
Subtotal        × streak multiplier
```

Everything above is known the moment the server finishes the simulation. The close job does not touch `players.xp` at all, which removes the last reason for a number on screen to change overnight.

**Streak multiplier:** `1.0 + 0.1 × streak days`, capped at **2.0** from day 10. Without a cap the streak becomes the only variable that matters after three months and new players have no path.

The multiplier is read from `players.streak_current` at the moment of the solve and stored on the attempt as `streak_mult`, so the number on the result sheet is reconstructible later.

Typical mid-level day: 100 + 90 + 50 = 240, times 1.9 = **456 XP**.

### 6.3 Level curve

XP for level *n* from *n–1*: `200 + 150 × (n-1)`

| Level | XP this level | Cumulative | Days at 450 XP |
|---|---|---|---|
| 2 | 200 | 200 | 1 |
| 5 | 650 | 1,700 | 4 |
| 10 | 1,550 | 7,625 | 17 |
| 25 | 3,800 | 46,200 | 103 |
| 50 | 7,550 | 186,725 | 415 |
| 100 | 15,050 | 748,950 | 1,664 |

Level 10 in under three weeks, 25 in three and a half months, 50 in a bit over a year. Fast early feedback, long tail for committed players. The constants are deliberately round so you can retune them after four weeks of real data.

### 6.4 What levels unlock

**Cosmetics only. Never mechanical advantage.** The moment a level affects gameplay, every leaderboard is void.

| Level | Unlock |
|---|---|
| 3 | Second ink colour |
| 5 | Friend code activates |
| 8 | Chalk stroke texture |
| 12 | Bronze profile frame |
| 20 | Path trail effect in shared replays |
| 30 | Silver frame, wet-ink stroke texture |
| 50 | Gold frame, free ink colour picker |

Cosmetics are not decoration. What you unlock appears in your shared replay, and shared replays are the growth channel. Cosmetics are advertising surface, which is also why they are not for sale (section 14).

---

## 7. Streaks and daily rewards

A one-shot-per-day game has no room for daily chests or currencies. The reward is the streak itself and its protection.

| Mechanic | Rule |
|---|---|
| Streak | Increments on each **solved** daily, evaluated against the UTC day boundary. Attempted but unsolved: the streak holds at its current value and does not break. Not played at all: the streak breaks |
| Streak shield | One shield every 7 streak days, maximum 2 held. Consumed automatically on a gap, one shield per missed day |
| Retry token | Awarded at streak day 7, 14 and 30, maximum 2 held. Grants one extra attempt on the same day. See section 2.1.1 |
| Milestones | Cosmetic plus profile badge at 7, 30, 100 and 365 days |

**The streak shield is the single most effective retention mechanic available.** The main reason players abandon daily games is not boredom, it is a broken streak. A shield that applies automatically prevents exactly that cliff.

Two columns carry this and they are not the same column:

- `last_played_on` is set on **any** attempt, solved or not. It is what distinguishes "attempted and failed" from "did not show up"
- `last_solved_on` is set only on a solve. It gates the 50 XP daily bonus and it is what the streak increments from

Revision 2 used one column for both, which meant a failed morning attempt marked the day as played and silently removed the daily bonus from the evening's successful retry.

**A retry must not corrupt anything it is not meant to touch.** Every attempt carries `attempt_no`, `counts_for_boards` and `counts_rarity`:

| Flag | True when |
|---|---|
| `counts_for_boards` | `attempt_no = 1` |
| `counts_rarity` | This is the player's first **solved** attempt on this level |

`attempt_no` is `smallint` with a range check of 1 to 4, derived server-side from the existing rows, never accepted from the client, and a value above 1 requires and consumes a retry token in the same transaction.

---

## 8. Accounts

### 8.1 Principle

Nobody is asked to create an account. Ever. An account is offered as a factual answer to a problem the player already has, at the moment they have it.

The product must be completely playable, levelable and rankable without one. The account exists for exactly one purpose: **your progress currently lives on this device only.** That is a true statement, not a pitch, and it is the only argument the interface ever makes.

### 8.2 Two identity tiers

**Tier 0 — anonymous session.** Created silently via Supabase `signInAnonymously()` on the player's first **Drop**, not on page load. Creating it on page load would generate a row for every bot and every bounced visitor. The onboarding levels in section 2.6 run before any session exists, because they touch no counters.

A trigger on `auth.users` creates the matching `players` row and generates a handle (`SharpFalcon-4417`). The handle is editable through a dedicated function, never by a direct table write. The player is never asked to type anything to start playing. XP, levels, streak, rarity cabinet and all boards work fully at this tier.

**Tier 1 — linked account.** Email magic link, Google, or Apple. No passwords, ever, which also means no password reset flow to build.

The critical technical point: `supabase.auth.linkIdentity()` **upgrades the anonymous user in place and keeps the same `auth.uid()`**. There is no data migration, no row copying, no risk of losing progress at the moment of linking. Every foreign key already points at the right user.

### 8.3 When the offer appears

At most one of these, then a cooldown. Checked in order; the first that applies fires:

| Trigger | Copy |
|---|---|
| Streak reaches 3 | Your 3 day streak is saved on this device only. |
| First Epic or better | This solve is saved on this device only. |
| Reaching level 5 | Friend codes need an email so your friends can find you. |
| Opening the Friends tab | Friends need an email. Nothing else changes. |

**Hard constraints on the prompt:**

- Never before day 3 of play
- Never a full-screen interstitial, never a blocking modal
- Always a dismissible inline strip beneath the result sheet, never above it
- Never shown during a solve, before a result is revealed, or on the reveal screen
- **Maximum one prompt every 7 days, maximum 3 in the player's lifetime**
- After the third dismissal it is permanently silent. Only the settings entry remains
- Copy states a fact. No benefit lists, no "unlock", no "join thousands", no exclamation marks

The caps live in `players.prompts_shown` and `players.prompt_last_at` and are enforced server-side in the function that decides whether a prompt may fire. Enforcing them in client code makes them a convention rather than a rule.

### 8.4 Passive entry points

These are always present and never count against the prompt budget, because they are state, not solicitation:

- **Profile header** carries a small `Local only` marker with a chevron. It describes where the data lives. Tapping it opens linking
- **Settings** has one row: `Save progress — Local only` / `Save progress — name@mail.com`

That marker is the entire always-on surface. A player who never wants an account sees one small word on a screen they rarely open.

### 8.5 Sign-in on a second device

Linking is only half of it. The other half is a player who signs in on a new phone that already has anonymous progress.

**Never merge silently, never discard silently.** Show one choice:

```
Two sets of progress

This device      Level 8   · 12 day streak · 4 rare finds
name@mail.com    Level 14  · 31 day streak · 11 rare finds

[ Keep this device ]   [ Keep the account ]
```

The one with more XP is highlighted as the default. The discarded set is archived for 30 days and restorable from settings, not deleted immediately.

Merging XP would be wrong: it double-counts streaks and would let someone farm rarity across devices.

### 8.6 Anonymous abuse

With the server as the authority (section 4.1) no result can be forged, so every board is trustworthy and every player, anonymous or linked, competes on the same one. There is no verified-board construct.

What remains possible is re-rolling: clear storage, get a fresh anonymous session, play the same day again to hunt for a better topology. Mitigations, in order of value:

- One rarity entry per `auth.uid()` per level, enforced by `counts_rarity` (section 7)
- Rate-limit anonymous session creation per IP at the Cloudflare edge, and per IP per level
- A re-roll starts at level 1 with no streak, no multiplier and an empty cabinet. The thing it buys is one badge; the thing it costs is everything that accumulates. The incentive is already wrong for the cheater
- Post-launch, if it becomes visible in the data: require a linked account for a solve to enter the *top 3 of the day* only. Not a separate board, just the podium

This is a nuisance, not a threat to the mechanic, which is the difference that server authority bought.

### 8.7 Retention, GDPR and the legal minimum

- An anonymous session holds no personal data. No consent banner is required because no tracking is loaded, no third-party font is fetched and no analytics vendor exists
- Anonymous rows with 0 XP and no activity for 7 days are purged nightly
- Anonymous rows with progress are kept 12 months from last play, then purged
- Linking stores an email address. That is personal data: it needs a privacy policy entry, an export path and a working delete button in settings
- **Delete account actually deletes.** No soft flag, no 90 day limbo
- `players.country` is derived from the Cloudflare `CF-IPCountry` header, which is why Cloudflare is in front from day one (section 0). The country code is stored, **the IP address is never stored**. The derivation is still IP processing and belongs in the privacy policy

**Not optional for a site operated from Germany:**

- Impressum under § 5 DDG
- Datenschutzerklärung covering the email address, the country derivation and Supabase as processor
- An Auftragsverarbeitungsvertrag with Supabase, EU region selected
- The localStorage token used for the anonymous session is functionally necessary for a service the user explicitly requested and is therefore exempt under § 25 **TDDDG** (the TTDSG was renamed and restructured in May 2024; the section number is unchanged). That exemption holds only as long as nothing else is stored. It survives exactly one careless analytics snippet

**Minors.** A game distributed on TikTok will have players under 16. At tier 0 this is moot, because no personal data exists. At tier 1 it does not stay moot: linking collects an email address, and under Art. 8 GDPR in conjunction with § 25 BDSG the age of consent for information society services in Germany is 16. Two consequences, both cheap:

- The linking screen states that an account requires you to be 16 or older, in one line, before the provider buttons
- The handle is the only public string a player controls, and `set_handle` rejects anything that looks like an email address or a phone number

This is the legal minimum for a product of this size, not a compliance programme. "GDPR stays clean" is a true statement only with all of the above in place.

---

## 9. Leaderboards

### 9.1 Which

| Board | Window | Sort | Presentation |
|---|---|---|---|
| Daily efficiency | 24 h | Ink ascending, then steps | Live: count below you. After close: percentile, top 3, value neighbourhood |
| Daily speed | 24 h | Simulation steps ascending | Same |
| Rarity points | Season, 30 days | Sum of rarity points | Full rank, ties are rare here |
| Level | All time | Total XP | Full rank |
| Country | Season | Mean percentile of that country's players | Country table |
| Friends | Season | Rarity points | Full rank, small N |

Only attempts with `counts_for_boards = true` are eligible for the daily boards. Only attempts with `counts_rarity = true` contribute rarity points.

### 9.2 Display rule

At 100,000 players a global top 100 is invisible to 99,900 of them. Every board therefore shows three blocks:

```
Global top 3
…
Your neighbourhood: the players immediately around your value
…
Your percentile: top 4 %
Your country rank: 87 in Germany
```

The neighbourhood window matters more than the top 100. Seeing that four people saved one more unit of ink than you is motivating. A list of unreachable names is not.

**The daily boards neighbour by value, not by rank**, for the reason in section 4.2: ink is coarsely granular and thousands of players share each value, so rank positions inside a tie are arbitrary. `4 players used 61 · you used 62 · 812 used 63` is both true and useful. `You are rank 1,204` is neither.

**During the live day, boards show counts, not percentiles** (section 5.5). The percentile view appears when the day closes and is what the reveal screen displays.

**The country board is a growth mechanic, not a statistic.** National competition drives recruitment. Surface it: *"Austria is ahead of Germany this season."*

### 9.3 Friends

Every player gets a six-character code at level 5. Redeeming links both ways. Both sides receive an exclusive cosmetic available no other way.

**The empty state of the friends list is the invitation.** No separate invite screen. `Nobody here yet. Your code is K4P2ZT.` with a copy button.

---

## 10. Database

Postgres on Supabase, EU region. Cloudflare in front.

### 10.1 Schema

```sql
-- ------------------------------------------------------------
-- players
-- ------------------------------------------------------------
create table players (
  id              uuid primary key references auth.users(id) on delete cascade,
  handle          text unique not null,
  country         char(2),
  is_linked       boolean not null default false,
  xp              bigint not null default 0,
  rarity_points   bigint not null default 0,
  level           int not null default 1,
  streak_current  int not null default 0,
  streak_best     int not null default 0,
  streak_shields  int not null default 0,
  retry_tokens    int not null default 0,
  friend_code     char(6) unique,
  invited_by      uuid references players(id),
  cosmetics       jsonb not null default '[]',
  prompts_shown   int not null default 0,
  prompt_last_at  timestamptz,
  created_at      timestamptz not null default now(),
  last_played_on  date,                  -- any attempt, solved or not
  last_solved_on  date,                  -- solved attempts only
  constraint handle_len check (char_length(handle) between 3 and 24)
);

-- ------------------------------------------------------------
-- levels
-- fuzz_* columns are filled by the offline fuzzer, section 12.0,
-- and are never exposed to the client
-- ------------------------------------------------------------
create table levels (
  id              int primary key,
  play_date       date unique not null,
  world           jsonb not null,        -- obstacles, ball origin, goal
  ink_budget      int not null,          -- whole logical units
  par_ink         int not null,          -- designer reference solve
  fuzz_topologies int,                   -- distinct topologies found
  fuzz_min_ink    int,                   -- best ink the fuzzer reached
  fuzz_solve_rate numeric(4,3),          -- share of random strokes solving
  fuzz_tail_share numeric(4,3),          -- share of solves in clusters of 1–2
  published       boolean not null default false
);

-- ------------------------------------------------------------
-- attempts
-- ink_used is in TENTHS of a logical unit
-- ------------------------------------------------------------
create table attempts (
  id                bigserial primary key,
  player_id         uuid not null references players(id) on delete cascade,
  level_id          int not null references levels(id),
  attempt_no        smallint not null,
  stroke            bytea not null,
  solved            boolean not null,
  ink_used          int not null,
  sim_steps         int,
  solution_hash     bigint,
  sim_version       smallint not null,
  tier              smallint,                 -- null until the close job
  solo_route        boolean not null default false,
  rarity_points     int not null default 0,   -- credited at close
  xp_awarded        int not null default 0,   -- credited immediately, final
  streak_mult       numeric(3,2) not null default 1.0,
  counts_for_boards boolean not null default true,   -- attempt_no = 1
  counts_rarity     boolean not null default false,  -- first solved attempt
  created_at        timestamptz not null default now(),
  unique (player_id, level_id, attempt_no),
  constraint stroke_size   check (octet_length(stroke) <= 880),
  constraint attempt_range check (attempt_no between 1 and 4)
);

-- at most one rarity-bearing attempt per player per level
create unique index attempts_one_rarity
  on attempts (player_id, level_id) where counts_rarity;

-- ------------------------------------------------------------
-- sharded counters, see 10.2
-- ------------------------------------------------------------
create table solution_clusters (
  level_id      int      not null references levels(id),
  solution_hash bigint   not null,
  shard         smallint not null,
  hits          int      not null default 0,
  primary key (level_id, solution_hash, shard)
);

create table daily_stats (
  level_id  int      not null references levels(id),
  shard     smallint not null,
  attempts  int      not null default 0,
  solvers   int      not null default 0,   -- distinct players, see 10.3
  primary key (level_id, shard)
);

-- ------------------------------------------------------------
-- per-cluster metadata and the frozen result
-- ------------------------------------------------------------
create table cluster_meta (
  level_id        int    not null references levels(id),
  solution_hash   bigint not null,
  first_player_id uuid   references players(id),
  first_attempt   bigint references attempts(id),
  example_attempt bigint references attempts(id),
  final_count     int,
  final_tier      smallint,
  primary key (level_id, solution_hash)
);

create table daily_totals (
  level_id   int primary key references levels(id),
  attempts   int not null default 0,
  solvers    int not null default 0,
  best_ink   int,
  best_steps int,
  finalized  boolean not null default false
);

-- ------------------------------------------------------------
-- indexes
-- ------------------------------------------------------------
create index on attempts (level_id, ink_used)
  where solved and counts_for_boards;
create index on attempts (level_id, sim_steps)
  where solved and counts_for_boards;
create index on attempts (level_id, solution_hash)
  where counts_rarity;
create index on attempts (player_id, created_at desc);
create index on cluster_meta (level_id, final_count desc);
create index on players (xp desc);
create index on players (rarity_points desc);
create index on players (last_played_on);
```

`players.id` references `auth.users` directly. Because anonymous and linked users share one `auth.uid()`, linking flips `is_linked` to true and touches nothing else.

**The trajectory is not a column.** It is derived from `stroke` by the simulation and cached at the edge (section 4.1). Storage per solve stays 880 bytes.

### 10.2 The player row is created by a trigger

Revision 2 never said who creates the `players` row. `signInAnonymously()` inserts into `auth.users` and nothing else, so the first `record_attempt` would have failed on a foreign key.

```sql
create or replace function gen_handle()
returns text language sql volatile as $$
  select (array['Sharp','Quiet','Rapid','Bright','Steady','Loose','Hollow',
                'Crisp','Distant','Blunt'])[1 + floor(random()*10)]
      || (array['Falcon','Ember','Compass','Lantern','Harbor','Vector',
                'Pebble','Anchor','Marble','Signal'])[1 + floor(random()*10)]
      || '-' || lpad((floor(random()*10000))::text, 4, '0')
$$;

create or replace function handle_new_user()
returns trigger language plpgsql security definer
set search_path = public as $$
declare
  v_try int := 0;
begin
  loop
    begin
      insert into players (id, handle) values (new.id, gen_handle());
      exit;
    exception when unique_violation then
      v_try := v_try + 1;
      if v_try > 6 then
        insert into players (id, handle)
        values (new.id, 'Player-' || replace(new.id::text, '-', '')::text);
        exit;
      end if;
    end;
  end loop;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
```

The fallback handle is ugly on purpose. A player who somehow lands on it will rename themselves, and an ugly handle is better than a failed signup.

### 10.3 Counters are sharded, and the rows are created at publish time

Two problems in revision 1, one of them fatal on the first solve, both still worth keeping the fix for:

1. **The row never existed.** `update daily_stats ... where level_id = p_level` matched zero rows and the tier computation divided by NULL
2. **Single-row contention.** Every attempt takes a row lock on the same tuple, and the dominant cluster is worse: if 60 % of solvers share a hash, one tuple takes 60,000 increments

Both are fixed by 16 shards per counter and creation at publish. Revision 3 adds a third measure: `record_attempt` now **raises** if the shard row is missing, instead of silently updating nothing. That was exactly the failure mode revision 2 set out to eliminate and it left the silent path in place.

```sql
create or replace function publish_level(p_level int)
returns void
language plpgsql security definer
set search_path = public as $$
begin
  insert into daily_totals (level_id) values (p_level)
    on conflict do nothing;

  insert into daily_stats (level_id, shard)
    select p_level, generate_series(0, 15)
    on conflict do nothing;

  update levels set published = true where id = p_level;
end $$;
```

A player's shard is fixed for the day: `shard = hashtext(player_id::text) & 15`. Reads sum sixteen rows, which is a trivial index scan and is cached for five seconds at the edge.

**`daily_stats.solvers` counts distinct players, not solved attempts.** It is incremented only when `counts_rarity` is true, which is once per player per level. Revision 2 incremented it on every solved attempt, so one human holding a retry token counted twice in the denominator that every other player's rarity is measured against.

Sixteen shards carry roughly 100,000 attempts a day comfortably. Raising it to 64 is a one-line change and needs no migration of anything else.

### 10.4 The write path

Only the Edge Function may call this. The client has no insert or update policy on any table and no execute grant on any writing function.

```sql
create or replace function record_attempt(
  p_player      uuid,
  p_level       int,
  p_stroke      bytea,
  p_solved      boolean,
  p_ink         int,            -- tenths of a unit, derived by the server
  p_steps       int,
  p_hash        bigint,
  p_sim_version smallint,
  p_country     char(2) default null
) returns table (
  attempt_id   bigint,
  attempt_no   smallint,
  route_count  int,
  solvers      int,
  ink_below    int,
  steps_below  int,
  xp_awarded   int,
  retries_left int
)
language plpgsql security definer
set search_path = public as $$
declare
  v_shard       smallint := (hashtext(p_player::text) & 15)::smallint;
  v_budget      int;
  v_play_date   date;
  v_open        boolean;
  v_no          smallint;
  v_tokens      int;
  v_streak      int;
  v_mult        numeric(3,2);
  v_had_solve   boolean;
  v_first_today boolean;
  v_rarity      boolean;
  v_xp          int := 0;
  v_id          bigint;
  v_route       int := 0;
  v_solv        int;
  v_inkb        int := 0;
  v_stepb       int := 0;
begin
  -- 1. is this level open at all
  select l.ink_budget, l.play_date, not d.finalized
    into v_budget, v_play_date, v_open
    from levels l
    join daily_totals d on d.level_id = l.id
   where l.id = p_level and l.published;

  if not found or not v_open then
    raise exception 'level % not open', p_level;
  end if;

  -- 2. lock this player's row. Serialises only their own attempts.
  select p.retry_tokens,
         p.streak_current,
         p.last_solved_on is distinct from v_play_date
    into v_tokens, v_streak, v_first_today
    from players p
   where p.id = p_player
     for update;

  if not found then
    raise exception 'no player row for %', p_player;
  end if;

  -- 3. the server decides the attempt number, never the client
  select coalesce(max(a.attempt_no), 0) + 1
    into v_no
    from attempts a
   where a.player_id = p_player and a.level_id = p_level;

  if v_no > 4 then
    raise exception 'attempt limit reached';
  end if;

  if v_no > 1 then
    if v_tokens < 1 then
      raise exception 'no retry token';
    end if;
    v_tokens := v_tokens - 1;
  end if;

  -- 4. rarity belongs to the first solved attempt and to nothing else
  select exists (select 1 from attempts a
                  where a.player_id = p_player
                    and a.level_id  = p_level
                    and a.solved)
    into v_had_solve;

  v_rarity := p_solved and not v_had_solve;
  v_mult   := least(2.0, 1.0 + 0.1 * v_streak)::numeric(3,2);

  -- 5. XP is final here. The close job never touches it.
  if p_solved then
    v_xp := round(
              (100
               + greatest(0, round((1 - (p_ink / 10.0) / v_budget) * 200))
               + case when v_first_today then 50 else 0 end
              ) * v_mult
            )::int;
  end if;

  insert into attempts (player_id, level_id, attempt_no, stroke, solved,
                        ink_used, sim_steps, solution_hash, sim_version,
                        xp_awarded, streak_mult,
                        counts_for_boards, counts_rarity)
  values (p_player, p_level, v_no, p_stroke, p_solved,
          p_ink, p_steps, p_hash, p_sim_version,
          v_xp, v_mult,
          v_no = 1, v_rarity)
  returning id into v_id;

  -- 6. counters. solvers counts PLAYERS, not solved attempts.
  update daily_stats
     set attempts = attempts + 1,
         solvers  = solvers + case when v_rarity then 1 else 0 end
   where level_id = p_level and shard = v_shard;

  if not found then
    raise exception 'level % has no shard rows: publish_level was not run',
      p_level;
  end if;

  if v_rarity then
    insert into solution_clusters (level_id, solution_hash, shard, hits)
    values (p_level, p_hash, v_shard, 1)
    on conflict (level_id, solution_hash, shard)
      do update set hits = solution_clusters.hits + 1;

    insert into cluster_meta (level_id, solution_hash, first_player_id,
                              first_attempt, example_attempt)
    values (p_level, p_hash, p_player, v_id, v_id)
    on conflict (level_id, solution_hash) do nothing;
  end if;

  -- 7. the live numbers for the result sheet. Counts, never ratios.
  if p_solved then
    select coalesce(sum(hits), 0)::int into v_route
      from solution_clusters
     where level_id = p_level and solution_hash = p_hash;

    select count(*)::int into v_inkb
      from attempts a
     where a.level_id = p_level and a.solved and a.counts_for_boards
       and a.ink_used < p_ink;

    select count(*)::int into v_stepb
      from attempts a
     where a.level_id = p_level and a.solved and a.counts_for_boards
       and a.sim_steps < p_steps;
  end if;

  select coalesce(sum(ds.solvers), 0)::int into v_solv
    from daily_stats ds where ds.level_id = p_level;

  update players p
     set xp             = p.xp + v_xp,
         retry_tokens   = v_tokens,
         last_played_on = v_play_date,
         last_solved_on = case when p_solved
                               then v_play_date else p.last_solved_on end,
         country        = coalesce(p.country, p_country)
   where p.id = p_player;

  return query
    select v_id, v_no, v_route, v_solv, v_inkb, v_stepb, v_xp, v_tokens;
end $$;

revoke all on function record_attempt(uuid, int, bytea, boolean, int, int,
                                      bigint, smallint, char)
  from public, anon, authenticated;
```

**One known cost.** Step 7's two `count(*)` queries walk a partial index that holds one row per solver. At 100,000 solvers that is roughly 10 ms per attempt, which is acceptable at launch and wasteful at scale. From stage 2 they move to a separate endpoint cached for five seconds at the edge, and the result sheet fills them in a beat after it opens. They are deliberately inside the function for now because two round trips on the one screen that matters is the worse trade at small N.

### 10.5 Row level security

Every table is locked. Reads that need aggregation go through security-definer functions.

```sql
alter table players           enable row level security;
alter table levels            enable row level security;
alter table attempts          enable row level security;
alter table solution_clusters enable row level security;
alter table cluster_meta      enable row level security;
alter table daily_stats       enable row level security;
alter table daily_totals      enable row level security;

-- read your own player row, nothing else. No write policy exists,
-- so the client can never write to players under any circumstance.
create policy players_self on players
  for select using (id = auth.uid());

-- only published levels, and only the columns the renderer needs.
-- fuzz_* and par_ink stay server-side.
create policy levels_published on levels
  for select using (published);
revoke select on levels from anon, authenticated;
grant  select (id, play_date, world, ink_budget) on levels
  to anon, authenticated;

-- your own attempts only. The gallery is served by a function.
create policy attempts_self on attempts
  for select using (player_id = auth.uid());

-- counters and cluster metadata have no select policy at all,
-- so there is no direct access to them from any client role.
```

Handle changes, friend-code redemption and prompt bookkeeping each get their own narrow security-definer function. Nothing writes to a table from the client, ever.

```sql
create or replace function set_handle(p_handle text)
returns void language plpgsql security definer
set search_path = public as $$
begin
  if char_length(p_handle) not between 3 and 24 then
    raise exception 'invalid handle';
  end if;
  if p_handle ~ '[@]' or p_handle ~ '[0-9]{7,}' then
    raise exception 'invalid handle';   -- no emails, no phone numbers
  end if;
  update players set handle = p_handle where id = auth.uid();
end $$;
```

**The read surface**, all security-definer, all cached at the edge where the underlying day is closed:

```
get_level(play_date)          world, ink_budget, nothing else
get_result(level_id)          your own attempt plus live counts
get_board(level_id, kind)     top 3, your neighbourhood, your position
get_gallery(level_id)         gated per section 2.4
get_reveal()                  yesterday's tier, solo mark, final percentiles
get_profile()                 level, xp, streak, cabinet, country rank
redeem_code(code)             friend linking
may_prompt()                  the account prompt caps from section 8.3
```

### 10.6 The close job

A single `pg_cron` entry at `00:00 UTC` calling one function, so the order is in the codebase rather than in this document.

```sql
create or replace function finalize_level(p_level int)
returns void language plpgsql security definer
set search_path = public as $$
declare
  v_solvers  int;
  v_attempts int;
begin
  select coalesce(sum(solvers), 0)::int, coalesce(sum(attempts), 0)::int
    into v_solvers, v_attempts
    from daily_stats where level_id = p_level;

  -- 1. materialise the cluster counts from the shards
  update cluster_meta cm
     set final_count = c.n
    from (select solution_hash, sum(hits)::int as n
            from solution_clusters
           where level_id = p_level
           group by solution_hash) c
   where cm.level_id = p_level
     and cm.solution_hash = c.solution_hash;

  -- 2. tiers by quota over the sorted cluster list, section 5.3.
  --    A cluster's tier is decided by where its midpoint falls in the
  --    cumulative solver share, counted from the rarest cluster up.
  if v_solvers >= 30 then
    with walk as (
      select solution_hash,
             final_count,
             coalesce(sum(final_count) over (
               order by final_count asc, solution_hash asc
               rows between unbounded preceding and 1 preceding), 0) as before
        from cluster_meta
       where level_id = p_level and final_count is not null
    )
    update cluster_meta cm
       set final_tier = case
             when (w.before + w.final_count/2.0) / v_solvers <= 0.005 then 5
             when (w.before + w.final_count/2.0) / v_solvers <= 0.05  then 4
             when (w.before + w.final_count/2.0) / v_solvers <= 0.15  then 3
             when (w.before + w.final_count/2.0) / v_solvers <= 0.40  then 2
             else 1
           end
      from walk w
     where cm.level_id = p_level and cm.solution_hash = w.solution_hash;
  else
    update cluster_meta set final_tier = 1 where level_id = p_level;
  end if;

  -- 3. tier, solo mark and rarity points onto the rarity-bearing attempt
  update attempts a
     set tier          = cm.final_tier,
         solo_route    = (cm.final_count = 1 and v_solvers >= 30),
         rarity_points = case cm.final_tier
                           when 5 then 100
                           when 4 then 40
                           when 3 then 15
                           when 2 then 5
                           else 0
                         end
                       + case when cm.final_count = 1 and v_solvers >= 30
                              then 25 else 0 end
    from cluster_meta cm
   where a.level_id = p_level
     and a.counts_rarity
     and cm.level_id = a.level_id
     and cm.solution_hash = a.solution_hash;

  -- 4. credit rarity points. players.xp is not touched here, ever.
  update players p
     set rarity_points = p.rarity_points + s.pts
    from (select player_id, sum(rarity_points)::int as pts
            from attempts
           where level_id = p_level and counts_rarity
           group by player_id) s
   where p.id = s.player_id and s.pts > 0;

  -- 5. gallery example per cluster: the most efficient solve in it
  update cluster_meta cm
     set example_attempt = e.id
    from (select distinct on (solution_hash) solution_hash, id
            from attempts
           where level_id = p_level and counts_rarity
           order by solution_hash, ink_used asc, id asc) e
   where cm.level_id = p_level and cm.solution_hash = e.solution_hash;

  -- 6. freeze the day
  update daily_totals d
     set attempts   = v_attempts,
         solvers    = v_solvers,
         best_ink   = (select min(ink_used)  from attempts
                        where level_id = p_level
                          and solved and counts_for_boards),
         best_steps = (select min(sim_steps) from attempts
                        where level_id = p_level
                          and solved and counts_for_boards),
         finalized  = true
   where d.level_id = p_level;
end $$;
```

```sql
create or replace function evaluate_streaks(p_play_date date)
returns void language plpgsql security definer
set search_path = public as $$
begin
  -- solved: streak up, shield every 7, retry token at 7, 14 and 30
  update players p
     set streak_current = p.streak_current + 1,
         streak_best    = greatest(p.streak_best, p.streak_current + 1),
         streak_shields = least(2, p.streak_shields
                          + case when (p.streak_current + 1) % 7 = 0
                                 then 1 else 0 end),
         retry_tokens   = least(2, p.retry_tokens
                          + case when (p.streak_current + 1) in (7, 14, 30)
                                 then 1 else 0 end)
   where p.last_solved_on = p_play_date;

  -- played but did not solve: untouched, the streak holds

  -- did not show up: spend a shield, or break. One statement, because
  -- the right-hand sides all read the pre-update row.
  update players p
     set streak_shields = case when p.streak_shields > 0
                               then p.streak_shields - 1 else 0 end,
         streak_current = case when p.streak_shields > 0
                               then p.streak_current else 0 end
   where p.last_played_on is distinct from p_play_date
     and p.streak_current > 0;
end $$;

create or replace function purge_anonymous()
returns void language plpgsql security definer
set search_path = public as $$
declare
  v_today date := (now() at time zone 'utc')::date;
begin
  delete from auth.users u using players p
   where p.id = u.id and not p.is_linked
     and p.xp = 0 and p.created_at < now() - interval '7 days';

  delete from auth.users u using players p
   where p.id = u.id and not p.is_linked
     and p.last_played_on < v_today - 365;
end $$;

create or replace function close_day()
returns void language plpgsql security definer
set search_path = public as $$
declare
  v_closing date := (now() at time zone 'utc')::date - 1;
  v_next    date := (now() at time zone 'utc')::date;
  v_level   int;
  v_nextid  int;
begin
  select id into v_level from levels where play_date = v_closing;
  if found then
    perform finalize_level(v_level);
    perform evaluate_streaks(v_closing);
  end if;

  perform purge_anonymous();

  select id into v_nextid from levels where play_date = v_next;
  if found then
    perform publish_level(v_nextid);
  else
    raise warning 'NO LEVEL FOR % — the content buffer has run out', v_next;
  end if;
end $$;

select cron.schedule('oneline-close', '0 0 * * *', $$ select close_day() $$);
```

That last `raise warning` is deliberate. Running out of levels is the operational face of the fatal risk in section 15, and it should page you rather than show players an empty screen.

Deletion cascades correctly: `auth.users` → `players` → `attempts`. Cluster counters keep the departed player's contribution, which is correct, because the rarity of *other* players' routes was genuinely measured against a day that included them.

### 10.7 Scaling stages

| Daily users | Setup | Rough cost |
|---|---|---|
| up to 5,000 | Supabase Pro, Edge Function for the sim, Cloudflare free tier in front | €25/month |
| 5,000 – 50,000 | Cloudflare caching level JSON, replays and board reads. Sim moves to Workers. Counters still sharded Postgres | €60 – 150/month |
| over 50,000 | Write path entirely on Workers. Strokes to R2, counters in Durable Objects, Postgres for analytics only | €200 – 400/month at 100k |

**What that requires today:** wrap the entire data layer behind one module with nine functions (`submitAttempt`, `getLevel`, `getReplay`, `getBoard`, `getGallery`, `getProfile`, `getReveal`, `redeemCode`, `linkAccount`). Swapping the backing store later becomes a one-day job instead of a rewrite.

Because the simulation already lives server-side behind an HTTP boundary, moving it from a Supabase Edge Function to a Cloudflare Worker is a deployment change, not a code change — as long as `sim_version` pins the physics and the fuzzer's corpus is run against the new runtime first (section 4.1). Moving the simulation to a different engine is not a deployment change. It is a new `sim_version` and it happens between days.

Section 14 bounds all of the above: if the middle row is reached, that is the point at which the project needs a decision, not a bigger plan.

---

## 11. Growth plan

### 11.1 The honest baseline

A game like this reaches a k-factor of roughly 0.2 to 0.4 without paid acquisition. That means **it does not grow on its own.** Every cohort decays without external supply.

This is not a flaw in the concept, it is the norm. Wordle had the same arithmetic and still got big, because the emoji grid was free distribution surface on Twitter. Your distribution surface is TikTok, and you already own it.

The plan therefore has two halves that feed each other: a share mechanic inside the product, and a content engine outside it.

**The consequence that has to be drawn from this:** if the content engine is the distribution, then the most important property of the game is not depth, it is **filmability**. Format A in section 11.3 is the actual product; the game is the raw material supplier. Every feature decision gets tested against "does this make a better fifteen-second video" before it gets tested against retention.

And the second consequence, which revision 2 stated as a risk and then mitigated with willpower: **if the content engine is the distribution, the content engine has to survive a bad week.** Section 11.4 is how.

### 11.2 The share artifact

Not text. **A 3 second video of your solve.**

```
primary    canvas frames → WebCodecs VideoEncoder → mp4
           Safari 16.4+, Chrome 94+, covers the great majority
fallback   4 frame filmstrip PNG, drawn on an offscreen canvas
```

There is no native animated-WebP encoder in the browser; that path needs libwebp as WASM, 200 to 400 KB, which directly contradicts the 1.5 second time-to-playable target in section 13. WebCodecs is the current answer and covers iOS from Safari 16.4.

**The encoder is lazy-loaded on the first Share tap**, never in the initial bundle. The share path is used by well under half of solvers; it has no business in the critical rendering path.

The frames are drawn from the stored trajectory (section 4.1), which is the same data the replay uses. There is no second rendering path.

**Delivery is `navigator.share()` with a File.** This opens the native share sheet on iOS Safari and Android Chrome, and TikTok appears in it. Set the expectation correctly: **a video cannot be posted to TikTok programmatically from mobile web.** The last step is always the player's hand. That is fine, but it is a real conversion step and belongs in the funnel, not in the assumptions.

**Two share modes, and this is the decisive part:**

| Mode | Shows | When |
|---|---|---|
| Result | Route count, level, and after the close the tier. No solution | While the puzzle is live |
| Solution | Full replay with stroke and ball path, plus the tier | After the close only |

A spoiler destroys the game for the recipient and therefore kills the referral. Wordle solved this with the emoji grid; you solve it with the mode switch, and Result is preselected. Solution mode unlocks automatically on the reveal screen, section 2.3, which is also when the tier exists to brag about. The two mechanics reinforce each other.

The same gate applies inside the product, in the solutions gallery (section 2.4). Shipping the spoiler in your own interface while blocking it in the share sheet would be self-defeating.

Every artifact carries the level number, the short link, and the player's unlocked cosmetics. That is why cosmetics exist at all.

### 11.3 The content engine

Your channel publishes on a fixed cadence and **the players supply the content**.

| Format | Structure | Frequency |
|---|---|---|
| A — The norm and the outlier | "59 % solved it like this." Replay. "And then this happened." Solo route replay | daily |
| B — Pause challenge | Show the puzzle, 3 seconds of silence, reveal | 2×/week |
| C — Unsolvable? | A level with a very low solve rate, comments as proposals | 1×/week |
| D — Reaction | Commentary on the week's most absurd solve | 1×/week |

Format A is the engine. No script, no research, no props.

### 11.4 Format A renders itself

Revision 2 called the content cadence the fatal risk and then mitigated it with ten banked videos and a documented floor. Ten videos is two and a half weeks. After that the mitigation is willpower, indefinitely, alongside a job.

**Both clips in Format A already exist as data the moment the day closes.** The largest cluster's `example_attempt` and a randomly drawn solo route are two attempt ids. Rendering them is the same trajectory-to-frames path the share artifact already uses, run headless.

```
close_day() finishes
  │
  └─ render job
       ├─ clip 1: largest cluster example, 4 s, caption "59 % solved it like this"
       ├─ clip 2: random solo route,        4 s, caption "and then this happened"
       ├─ stitch, 9:16, 1080×1920, no audio bed
       └─ drop the mp4 in a folder, notify you
```

Roughly one weekend of work with a headless Chromium and ffmpeg. What it changes is not the cost per video, which was already low; it is what a bad week looks like. The risk stops being *"do I produce four videos this week"* and becomes *"do I upload a finished file"*, which survives illness, holidays and a week where nothing is fun.

You still cut, caption and post by hand when you have the energy, and Formats B, C and D stay manual. The automation exists so that the floor is never zero.

**Build this in stage 1, week 4**, alongside the share encoder, because it is the same renderer. Until then, the Strange tab hands you the material and you cut it yourself.

### 11.5 The feedback loop that carries everything

**Anyone featured in a video receives a permanent badge and a notification.**

```
⬧ Featured 14 Sep
```

This fundamentally changes behaviour: players start hunting for absurd solutions instead of efficient ones. That produces more solo routes, more material for you, and more share moments. One small feature, roughly two hours of work, that permanently secures your content supply.

It also sits correctly inside the two-currency split from section 6.1: chasing a feature is the rarity game, and it costs the player XP, which is exactly the trade the design wants to be real.

Build this in stage 0 despite everything else being cut. It is the cheapest item in the document with the highest leverage.

### 11.6 Invite loop

- Friend code at level 5, exclusive two-sided cosmetic
- Empty friends list is the invite prompt
- Country board as a recruitment reason
- A direct link `oneline.app/d/482` opens that exact puzzle with no interstitial and no sign-up

**Every screen between the link and the playfield halves conversion.** No welcome screen, no consent wall with choices, no registration gate. There is no consent requirement when you run no tracking, and you run none.

The onboarding levels in section 2.6 are the one exception, and they are offered *after* the linked puzzle, never before it. The sender's intent wins.

### 11.7 Launch sequence

```
Week -4   Soft launch, 100–500 players from your circle
          Goal: calibrate ink budgets, quota behaviour at small N,
                and the two noise thresholds in 5.2 against real solves
          Verify the fuzzer's solve-rate and tail-share proxies

Week -2   21 levels finished and reviewed. No launch without three weeks
          10 videos produced, not yet published
          The render job from 11.4 running against real closed days

Day 0     Video 1, no link. Just the puzzle and the reveal
Day 1     Video 2, no link
Day 2     Video 3, link in bio and first comment
Day 3–14  Format A daily
```

Withholding the link in the first two videos is deliberate. It generates questions in the comments, and comments asking questions are the strongest distribution signal the algorithm reads.

Twenty-one levels, not fourteen. Three weeks of buffer is the difference between "I am behind" and "I have to ship something bad tonight", and the `raise warning` in `close_day()` tells you when the buffer starts shrinking.

---

## 12. Level design

The part that gets underestimated and that decides the game.

### 12.0 The fuzzer

Build this in stage 0, before the first level is designed. It is a headless harness that runs the authoritative simulation against generated strokes.

```
for each candidate level:
    generate 10,000 strokes
      - random walks within the ink budget
      - straight segments at sampled angles and positions
      - mutations of any known solution
    simulate each with the server engine
    collect: solved yes/no, ink, steps, topology hash
```

What it returns, and why each number matters:

| Output | Answers |
|---|---|
| Count of distinct topologies | Rule 12.1.1, "at least three distinct solutions", **before publishing** |
| Minimum ink per topology | The real par, instead of the designer's guess in `par_ink` |
| Share of random strokes that solve | A difficulty proxy for rule 12.1.3 |
| **Share of solves landing in clusters of 1–2** | The distribution shape, rule 12.1.5. New in revision 3 |
| Hash collapse check | Whether visually identical solves share a hash, which is how the two thresholds in 5.2 get tuned |
| Regression corpus | Ten thousand stroke-to-hash pairs per runtime version, replayed before any deploy (section 4.1) |

The fuzzer makes the level rules checks instead of intentions, and it is the only thing standing between a pinned `sim_version` and an unnoticed physics drift.

It costs roughly one weekend and doubles as the determinism test harness, the regression suite for the physics constants, and the source of the anomaly detection in section 8.6.

Results are written to `levels.fuzz_topologies`, `fuzz_min_ink`, `fuzz_solve_rate` and `fuzz_tail_share`, and are never exposed to the client.

### 12.1 Rules for every level

1. **At least three topologically distinct solutions**, verified by the fuzzer, not by hand. With only one the rarity axis collapses and the day is wasted
2. **The obvious solution consumes 70 to 85 % of the ink budget.** Tight enough that saving matters, loose enough that beginners get through. Set the budget from `fuzz_min_ink`, not from the designer's own solve
3. **Target solve rate 70 to 85 %.** Below 60 % frustrates, above 90 % is meaningless. Predicted by `fuzz_solve_rate`, confirmed only after the day closes
4. **No more than five obstacles.** Beyond that it is unreadable on a phone
5. **Tail share between 3 and 15 %**, measured by `fuzz_tail_share`. New, and it is the rule that makes the rarity quotas mean something

On rule 5: the quota system in section 5.3 guarantees the *shape* of the tier distribution on any level, but it cannot invent variety. A level whose solves collapse into four clusters hands out its Legendary badge to whoever happened to be in the smallest of four crowds, which is a lottery with a badge attached. A level whose solves are 40 % singletons is noise rather than design and probably means an obstacle is doing nothing. Between 3 and 15 % is the band where the rarest routes are genuinely rare and genuinely findable.

Rule 3 stays a target rather than a guarantee. The fuzzer's random strokes are a weaker player than a real human, so the proxy needs calibrating during the soft launch: collect the real solve rate for the first fourteen levels, fit the offset, then use it. The same applies to rule 5, where the fuzzer's tail will be fatter than a human population's, because random strokes find more junk topologies than people do.

### 12.2 Weekly rhythm

```
Mon  easy        ~90 % solve rate, the on-ramp for new arrivals
Tue  easy        ~88 %
Wed  medium      ~80 %
Thu  medium      ~78 %
Fri  hard        ~70 %
Sat  very hard   ~55 %, the bragging day
Sun  medium      ~80 %, with one surprising mechanical twist
```

Monday being easy is not incidental. The start of the week brings the most social-media arrivals, and an unsolvable first puzzle is the most common cause of immediate abandonment.

Saturday's ~55 % target sits below the rule 3 floor deliberately, once a week, as the day the content engine feeds on. The onboarding in section 2.6 is what makes a Saturday arrival survivable: a new visitor plays two easy archived levels first and only then meets the hard one, so their first experience of the product is a solve.

### 12.3 The editor as the answer to content risk

40 levels are 40 days. The editor is therefore not a nice-to-have, it is what permanently ends your production risk. But it ships only once stage 1 is validated by real numbers. Building an editor for 200 players is wasted time.

The fuzzer is the exception to that rule and ships first, because it is what makes hand-built levels trustworthy in the meantime.

---

## 13. Metrics

| Metric | Target | Meaning if missed |
|---|---|---|
| D1 retention | over 40 % | Below 30 %: first puzzle too hard or entry too slow |
| D7 retention | over 25 % | Below 15 %: the concept does not hold, consider a rebuild |
| D30 retention | over 15 % | Streak mechanics not landing |
| Daily solve rate | 70 – 85 % | Retune level design |
| First-session completion | over 70 % | The onboarding in 2.6 is too long or the archived levels are not easy enough |
| Share rate of solvers | over 8 % | Share artifact unattractive or too hidden |
| k-factor | over 0.25 | Invite loop broken |
| Reveal screen open rate | over 30 % | The next-morning tier is not landing as a reason to return |
| Videos published per week | at least 4 | See section 15. This is the one metric about you, not the players |
| Level buffer | at least 14 days | The `raise warning` in `close_day()` is the alarm |
| Account link rate | 15 – 30 % | Below 10 % is fine and expected; above 40 % suggests the prompt is too aggressive |
| Time to playable | under 1.5 s on 4G | Bundle too large. With no client physics engine there is no excuse left |

**D7 retention is the number you use after four weeks to decide whether to continue.** Everything else is tunable; that is not.

**How retention is actually measured.** From `attempts`, not from `players.last_played_on`. That column holds one date and cannot answer a cohort question. `select player_id, min(level_id), array_agg(distinct level_id) from attempts group by 1` gives you every cohort curve in the product with no vendor, no consent requirement and no third-party script. The index `attempts (player_id, created_at desc)` is already there for it.

Account link rate is explicitly **not** a growth target. It is a diagnostic. A high number here would mean the prompt policy has drifted.

---

## 14. Cost, and who pays it

Revision 2 had a cost table and never said what the project is for or who covers it. That omission quietly decides things, so it gets decided here instead.

**There is no revenue model and none is planned.** No ads, no subscription, no paid cosmetics. Cosmetics are the advertising surface (section 6.4) and selling them would compromise the one job they have.

The consequence, stated as a rule rather than a hope:

| Stage | Monthly cost | Who pays | Decision |
|---|---|---|---|
| Under 5,000 DAU | ~€25 | You | Fine indefinitely. This is a hobby-sized bill |
| 5,000 – 50,000 DAU | €60 – 150 | You | Uncomfortable but survivable. This is the warning band |
| Over 50,000 DAU | €200 – 400 | Undecided | **Stop and decide.** Do not scale into this band on autopilot |

If the game reaches the third row it has succeeded at the thing that was actually hard, which is distribution, and at that point the options are real: a paid cosmetic tier that does not appear in shared replays, a sponsor on the channel rather than in the app, or capping the free tier. All three are decisions to take with 50,000 players and none of them should be pre-built for zero.

**What this locks today:** the data layer sits behind the nine-function module in section 10.7, so the cheap-to-expensive migration is a one-day job, and nothing in the product depends on a payment provider, a consent banner or an ad SDK existing. Those are the only two things the cost question needs to constrain right now.

The bigger cost is not the hosting bill. It is four videos a week for a year, which is why section 11.4 exists.

---

## 15. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| **Your own content cadence stops** | **Fatal** | At k < 1 the game dies the week the channel stops. Format A renders itself (11.4), ten videos banked before day 0, a documented floor of 4 per week. The automation is what turns this from a willpower problem into an upload problem |
| **The spec keeps improving and the prototype never ships** | **High** | This document is hardened for 100,000 users while the plan calls for 50. Weekend 1 in section 16 is throwaway, local, and answers the only question that matters. Do not write revision 4 before it exists |
| Timeline slips past motivation | High | Stage 0 is eight to twelve weekends and everything else waits behind the gate in section 16 |
| Level design yields one solution, or only noise | High | The fuzzer, section 12.0, checks topology count *and* tail share before publishing |
| iOS Safari scrolls while drawing | High | `touch-action: none`, Pointer Events with capture, tested on a real device in weekend 1 |
| Physics drifts between deploys | Medium | `sim_version` pinned and stored per attempt, regression corpus replayed before every deploy, no deploys during a live day (4.1) |
| Rarity ladder collapses at small or large N | Medium | Quotas rather than thresholds, section 5.3. The shape is guaranteed by construction; only the 30-solver floor is a special case |
| Topology hash fragments on noise | Medium | Contact impulse threshold and cell hysteresis, section 5.2, both calibrated with the fuzzer and both part of `sim_version` |
| Rarity not understood | Medium | One explanation card on the first reveal, never again. The live route counter is self-explanatory in a way a tier name is not |
| The one-shot day loses cold traffic | Medium | The first session in 2.6: two easy archived levels before the live puzzle |
| Account prompt drifts into nagging | Medium | The caps in 8.3 are enforced server-side, not by client discipline. Review the link rate monthly |
| Hosting cost outgrows a hobby | Medium | Section 14. The decision point is written down in advance instead of arriving as a surprise invoice |
| Hot-row contention at scale | Low | Sharded counters from day one, section 10.3. Raising the shard count is a one-line change |
| Result forgery | Low | Server authority with no client-supplied scored values at all, sections 4.1 and 4.2 |
| Genre already exists | Low | Draw-plus-physics dates back to Crayon Physics. What is new is the combination of daily puzzle, topological rarity and user levels. Execution decides, not originality |

---

## 16. Build order

### What the stages are for

Stage 0 answers one question: does a person who solved today's puzzle come back tomorrow. Everything else waits.

Revision 2 budgeted four weekends for a fuzzer, an authoritative simulation, topology hashing with two calibrated thresholds, sharded counters, a close job, a reveal screen, seven fuzzed levels, anonymous sessions and a deploy, on evenings and weekends alongside a full-time job. That is the same optimism revision 2 criticised in revision 1, at a smaller scale. The honest figure is **eight to twelve weekends**, and writing that down is worth more than hitting it.

### Stage 0 — answer the one question

| Window | Output |
|---|---|
| 1 | Canvas, pointer drawing with `touch-action: none`, Matter.js **locally**, one hardcoded level. Throwaway. Test on a real iPhone before anything else. Single question: do you want to go again immediately |
| 2–3 | The fuzzer (12.0). Edge Function with the authoritative simulation. Trajectory response format. The local physics is deleted here and the client becomes a renderer |
| 4 | Stroke storage, server-derived ink, replay from stored stroke, `sim_version` and the regression corpus |
| 5–6 | Topology hash with both noise filters, sharded counters, `record_attempt`, the live route counter on the result sheet |
| 7 | `close_day()`, quota tiers, the reveal screen |
| 8 | 7 levels built against the fuzzer, the first session (2.6), anonymous sessions and the `auth.users` trigger, static share PNG, Featured badge (11.5), Cloudflare in front, deploy |

Then two to three weeks of running it.

Everything not in the list is deliberately absent from stage 0: no XP, no levels, no streaks, no shields, no cosmetics, no friends, no country board, no desktop layout, no account linking, no share video, no solutions gallery, no automated render.

### The gate

Revision 2's gate was "D1 over 40 % across 30 to 100 people from your circle." Three problems with using that number as a kill switch:

- **It cannot be read.** At n = 50, a D1 of 40 % carries a 95 % confidence interval of roughly ±14 points. 40 % and 30 % are the same measurement
- **The sample is friendly.** People who know you come back out of politeness, which biases the number in the direction that would tell you to continue
- **It measures the wrong build.** Stage 0 has no streak, no XP and no cosmetics, which are three of the four reasons the finished product retains anybody. Judging the concept on a deliberately stripped version and killing it on that basis would be a mistake you could not detect afterwards

So the gate is three signals, and it takes two of the three:

| Signal | Threshold | Why it is readable |
|---|---|---|
| **Unprompted return** | At least 8 of your testers ask, without being asked, when the next puzzle drops, or message you about a solve | Politeness gets people to open a link. It does not get them to bring the subject up |
| **Cold D1** | Over 35 % across at least 300 strangers, from two or three unlisted videos on the channel | Strangers are the population you are actually building for, and 300 brings the interval to roughly ±5 points |
| **Your own pull** | You want to play tomorrow's level, on a day when you did not build anything | If the person who knows every level does not want to play, nobody else will |

Failing all three means the problem is the level design or the entry speed, and no amount of XP curve fixes it. This is the decision point.

The cold D1 number is the expensive one, because it means producing two or three videos before stage 1 exists. That cost is real and it is worth paying, because it also tells you whether you can make the videos at all, which section 15 calls the fatal risk.

### Stage 1 — retention, once the gate is passed

| Window | Output |
|---|---|
| 1 | XP, levels, streak, shields, retry tokens |
| 2 | Boards: live counts, closed-day percentiles, the value neighbourhood |
| 3 | Solutions gallery with replay, the three tabs, the spoiler gate |
| 4 | Share video with WebCodecs and the filmstrip fallback, lazy-loaded. **The automated Format A render (11.4) on the same renderer** |
| 5 | Anonymous to linked, the prompt policy and its caps, second-device conflict screen |
| 6 | Friend codes, country board, desktop layout |
| 7 | 21 levels finished, 10 videos produced |
| 8 | Public launch |

### Stage 2 — only after D7 is known

Editor, CDN in front of gallery replays, the cached board endpoint from section 10.4, counters to Durable Objects if the numbers demand it.

Then four weeks of measuring and retuning only. No new features until the D7 number is in.

---

## 17. Open before the build starts

Small items, none of them optional, all of them cheaper to resolve now than later.

| Item | Why |
|---|---|
| Domain availability | `oneline.app` is very likely taken. Have the second and third choice ready before the name appears in a video |
| Trademark clearance | Several mobile puzzle games already ship under "1LINE" and "One Line". Do a DPMA and EUIPO search before printing the name on anything |
| Impressum, Datenschutzerklärung, AVV | Section 8.7. Required for a publicly operated site from Germany |
| Age statement on the linking screen | Section 8.7. One line, and it has to exist before the first email address is collected |
| Day boundary confirmed with a real audience | Section 4.4. A 02:00 local rollover is correct for a global board and still worth saying out loud before launch, not after |
| Supabase EU region and Edge Function region | The simulation must run in the same region as the database or the 150–300 ms round trip stops being invisible, and with no client physics there is nothing to hide it behind |
| Cloudflare account and DNS | Section 0. It is in front from day one, and `players.country` has no other source |
| The quota constants | The five bands in 5.3 are a first guess, not a finding. Recheck them against the soft launch and expect to move the Legendary band |
