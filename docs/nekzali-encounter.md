# Nek'zali the Soulcoiler encounter specification

Tickets: `SPEC-022`, `SPEC-024`, `SPEC-025`, `FR-082`, `FR-083`, `CR-286`, `BUG-195`–`BUG-197`

This is the canonical, iterative trainer definition for Nek'zali. The supplied
2026-08-16 research is source evidence, not a second implementation contract.
Learn 2D and Train 3D use the same mechanics, assignments, causal order, and
failure conditions with separately declared schedules.

## Evidence boundary

- Source synthesis: [`inbox/nekzali-the-soulcoiler-wow-trainer-spec.md`](../inbox/nekzali-the-soulcoiler-wow-trainer-spec.md).
- Arena reference: [`INBOX-20260815-124454-f3a9e1`](../inbox/INBOX-20260815-124454-f3a9e1.md).
- The raid was not live in EU when the synthesis was written. Intrinsic spell
  durations supported by current spell/journal data are higher confidence than
  pull-relative recurrence inferred from edited footage.
- Unknown target counts, recurrence, add count, shield size, and movement
  geometry remain configurable trainer assumptions and must not be described as
  validated live values.

## Projection schedules

| Event | Learn 2D | Train 3D | Confidence |
| --- | ---: | ---: | --- |
| Phase 1 pacing to 50% | 82s | 90s | trainer proxy |
| Soulcoil Ignition channel | 4s | 4s | sourced |
| Essence Rend pull | 5s | 5s | sourced |
| Essence Rend Magic debuff | 12s | 15s | 2D projection / sourced 3D |
| Possession Barrage | 7s | 6s | 2D movement / sourced 3D |
| Drowned Echo interrupt | 10s | 10s | sourced |
| Hungering Pyre | 9s | 7.5s | 2D projection / sourced 3D |
| Slithering Flame | 8s | 8s | sourced |
| Return from Well | 5s | 5s | sourced trainer realization |
| Invoke | 5s | 5s | sourced |

Cadence arrays live beside these profiles. A profile changes only between
projections, never with Test/Easy/Normal/Hard.

## Arena, raid, and assignments

- Circular 90-yard room with a lethal six-yard Soulcoil Well.
- Twenty players: two tanks, five healers, five melee, and eight ranged.
- Pre-pull assignment states the player's Well team and either `Pyre soak` or
  `Cremation cleanup`. Cleanup is a smaller deterministic group; the main raid
  soaks. Selecting a roster player deterministically selects Realm Group 1 or
  Realm Group 2; that assignment is prominent pre-pull and remains visible in
  the runtime HUD.
- The active tank owns aggro. Possession Barrage swaps aggro immediately; NPC
  tanks carry it to a far clear edge lane. Player tanks use Taunt when assigned.
- Main damages priority adds before Nek'zali. NPCs use the same target/action
  vocabulary and own crowd control; there is no player CC keybind.

## Shared mechanic states

- Cast/channel: Soulcoil Ignition, Possession Barrage, Soul Transfer, Hungering
  Pyre, Slithering Flame, Invoke, Drowned Echo interrupt, and return.
- Timed Magic debuff: Essence Rend, including target, remaining time, removal
  reason, and spawned remain.
- Absorb/fixate/CC: Gravebound Advance on Restless Amani; the shield is damaged
  before health and NPC crowd control begins only after the shield breaks.
- Persistent ground entity: one Latent Cultist per Rend removal. It remains for
  the fight and never behaves as a disposable puddle.
- Soak/spread: filled Pyre requests entry and becomes outline-only when
  satisfied; Cremation is a harmful player circle used to burn a corpse.
- Projectile/lane: Barrage spirits and Soul Transfer.

## Phase 1

### Soulcoil cycle

- Soulcoil Ignition is a four-second channel. Its one-second pulses create
  Anguished Echo impact circles and advance the Well's Rite state.
- Each Rite adds five energy and a 44-second Ritual Burn application. The
  simulation tracks applications independently; they tick every two seconds.
- One hundred energy begins Uncoiled Rage and fails the attempt after its
  five-second cast.

### Essence Rend

- Rend pulls selected targets for five seconds, then knocks them outward and
  applies a dispellable Magic debuff.
- The target carries one visible icon and countdown, not text over the actor.
- The target moves to a clear outer lane. A controlled affected player is
  automatically dispelled once they reach a clear edge position. If they do not,
  expiry removes the debuff at their current location and records bad placement.
- A controlled healer who is not affected may use Dispel on the assigned NPC
  target once that NPC reaches its clear edge destination.
- Removal by dispel or expiry creates exactly one six-yard Latent Cultist at the
  removal location. It persists until the fight ends. NPC targets visibly move
  to their actual removal position.

### Possession Barrage and tank state

- Six-second distance-scaled spirit barrage from boss to target tank. The tank
  travels to the far edge and other players leave the lane and impact zones.
- Hollowing Strikes is a reusable 15-second independently expiring tank stack;
  each stack reduces healing/absorb received by five percent. The trainer shows
  stack state and swaps according to assignment rather than inventing an exact
  live threshold.

### Restless Amani

- A wave spawns around the room and fixates the Well. Gravebound Advance is a
  25%-maximum-health Magic absorb; NPC crowd control becomes effective only
  after it breaks.
- Main prefers the closest living Amani. The player is responsible for three
  marked targets; NPCs handle the rest, including while the player is in the
  Well realm. A leak remains a trainer wipe condition.
- Every death leaves a Vessel of Awakening at that exact location.
- In the deterministic trainer cadence the first wave begins before the Phase 1
  Realm Group call, so the adds remain a visible independent responsibility
  rather than being replaced by the realm transition.

## Well realm

- Grasping Depths is separate from Essence Rend and from the 50% Echo
  intermission. The deterministic trainer schedules one Group 1 occurrence in
  Phase 1 and one Group 2 occurrence in Phase 2; exact live recurrence and
  phase availability remain unverified and are not invented as twice per phase.
- The assigned player enters the centre during a projection-specific entry
  window. An unassigned player remains outside while the assigned NPC group
  handles the Well, and the outer encounter keeps advancing under NPC
  responsibility.
- NPC realm participants move to the Well, transfer realms explicitly, and
  later return; the transition is not an ordinary position jump. Outer-realm
  actors continue bounded locomotion around the lethal Well.
- Inside, Main kills the Drowned Echo in 20 hits. The player must interrupt its
  ten-second assigned cast while avoiding orbiting and outward spirits.
- Nek'zali's three-second disruption cancels a Main cast if it completes during
  that cast; it is a performance record until scoring is approved.
- Death begins a five-second return and applies 60-second Soul Exhaustion.

## Intermission

- At the time-driven 50% proxy, surviving adds remain authoritative and must be
  killed before the transition. Nek'zali becomes untargetable in the Well.
- Grasping Depths does not occur during this trainer intermission.
- Two Echoes activate sequentially. Soul Transfer is a 15-second line hazard
  from Nek'zali to the active Echo.
- The main raid receives Hungering Pyre and soaks the 7.5-yard split. Assigned
  cleanup players stay out, receive Slithering Flame, spread, and place their
  four-yard Cremation explosions on visible Vessels.
- Cremation leaves a three-second burning zone. Every required Vessel must be
  removed before the Echo sequence ends.

## Phase 2

- Phase 1 mechanics continue. Boss health drains from 50% as a trainer pacing
  proxy.
- Invoke is a five-second cast and advances the Rite state. On completion every
  persistent Latent Cultist makes one abrupt clockwise Entwined Step around the
  Well while retaining its radius. Cultists do not drift continuously or bounce
  from the wall.
- A player caught casting is silenced for three seconds. Later Rend removals
  join the persistent field and move on subsequent Invokes.
- One hundred Well energy is terminal; zero boss health completes the lesson.

## Validation

Coverage must prove both schedules, pull/debuff/removal state, edge auto-dispel,
healer dispel assignment, exactly one persistent remain, discrete clockwise
Invoke steps, Pyre/cleanup assignments, 10-second interrupt, persistent NPC and
arena timelines, shield-before-health Amani damage, NPC-owned CC, tank swap,
and identical mechanics across trainer difficulty.
