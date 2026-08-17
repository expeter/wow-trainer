# Entombed Sentinels encounter specification

Tickets: `SPEC-022`, `SPEC-024`, `SPEC-025`, `FR-084`, `CR-287`,
`BUG-195`–`BUG-197`, `BUG-208`, `BUG-209`

This is the canonical, iterative trainer definition for Entombed Sentinels.
The 2026-08-16 synthesis remains source evidence. Learn 2D and Train 3D share
mechanics and failure rules but declare separate pacing profiles.

## Evidence boundary and approved abstractions

- Source synthesis: [`inbox/entombed-sentinels-wow-trainer-spec.md`](../inbox/entombed-sentinels-wow-trainer-spec.md).
- Raid-plan evidence: [`INBOX-20260815-131711-f9dac6`](../inbox/INBOX-20260815-131711-f9dac6.md).
- Acid/green is the plan's right side; Blood/red is its left side. Boss homes
  remain about 100 yards apart; Dominance failure begins below 40 yards.
- **Linked-health abstraction:** both frames use one health progression and
  Stasis remains scheduled. The live separate-health/equalization tactic is
  explained but not scored because one player cannot meaningfully control raid
  damage balance in this trainer.
- **Both-side Droplet abstraction:** Toxic Droplets and their Living Venom
  return lanes occur on both sides, matching the supplied video interpretation.
  This deliberately differs from the current-journal Breath-only wording.

## Projection schedules

| Event | Learn 2D | Train 3D | Confidence |
| --- | ---: | ---: | --- |
| Cycle-one active phase | 54s | 60s | trainer proxy |
| Cycle-two active phase | 64s | 72s | trainer proxy |
| Mark application cadence | 5s | 5s | sourced |
| Individual mark lifetime | 40s | 40s | sourced |
| Toxic Droplet fuse | 14s | 12s | 2D movement / sourced 3D |
| Living Venom return | 5s | 4s | 2D projection / sourced 3D |
| Miasma | 9s | 8s | 2D movement / sourced 3D |
| Blighted Blood | 18s | 18s | sourced |
| Vitriolic Stasis | 30s | 30s | sourced |
| Helical Toxins | 28s | 28s | sourced |

## Shared mechanic states

- Independently expiring Acid and Blood mark applications.
- Add cast, add health, Toxic Droplet soak, and one-to-one Living Venom return
  projectile/lane.
- Persistent Blood Venom ground pools with explicit owner and creation cause.
- Timed dispellable Blighted Blood whose removal creates a pool at the target.
- Group soak plus delayed pool-drop debuff.
- Protovenom carrier state, proximity collision, valid pair resolution, invalid
  one-carrier eruption, and knockback.
- Helical composition and complementary-pair resolution.
- Tank stack/debuff state for Empowering Slam and Bloodvenom Injection.

## Active phases

- Each side receives its own boss aura mark every five seconds while inside
  40 yards. Every application expires independently after 40 seconds. The
  actor projection compacts each mark type into one attached icon with a
  numeric stack count; it does not grow a row of duplicate diamonds.
- Crossing below 40 yards records Dominance failure. The tactical default keeps
  the bosses near their 100-yard homes.
- Both bosses share the trainer health proxy. Energy rises on the encounter
  schedule and triggers Stasis at 100.

### Acid/Breath responsibilities

- Venom Coagulation spawns, casts Contaminate until killed, and is the priority
  Main target. NPCs switch to it using the shared target/action vocabulary.
- Toxic Droplets appear independently of the add's death on both encounter
  sides. The player receives one only when assigned to handle a Droplet.
- A soaked Droplet launches Living Venom toward the current position of the
  Breath boss. Soaking is immediate; a three-second return lane first shows the
  path, then a faster projectile travels along it and disappears on impact.
  Collision follows the projectile rather than treating the entire historical
  lane as permanently harmful. NPCs use the same soak and avoidance rules.
- Empowering Slam is a 1.5-second tank cast. Repeated hits on the same tank add
  an independently displayed 10% physical-damage stack; NPC tanks swap under
  their assignment.

### Blood responsibilities

- Miasma targets a player for an eight-second 7.5-yard group soak. Failure to
  gather enough assigned players is terminal. Each participant then receives a
  six-second entity-attached Clinging Murk/Blood Venom pool drop and moves to an
  outer lane. Expiry detaches one permanent pool at that carrier's actual final
  position.
- Blighted Blood is an 18-second Magic debuff. A controlled healer can Dispel
  the affected NPC after it reaches an edge drop location. If the controlled
  player is affected, an NPC healer dispels after the player reaches a clear
  edge. Removal creates a persistent Blood Venom pool at that location.
- Bloodvenom Injection is a 1.5-second tank cast and applies a 40-second stacking
  state. The trainer visualizes the swap state without claiming an unverified
  exact live threshold.

### Protovenom

- Protovenom begins shortly before Stasis. A deterministic seeded subset of the
  raid receives the same carrier aura; any carrier may resolve with exactly one
  other carrier.
- A carrier touching a non-carrier causes a 10-yard eruption, records failure,
  and applies reusable radial knockback. A valid pair clears both carriers.
- Every NPC carrier moves toward a legal partner and resolves through the same
  collision rule. They wait long enough not to reveal the player's answer, then
  resolve before Stasis. An unresolved player assignment at Stasis fails
  according to trainer tolerance.
- The controlled player's deterministic NPC partner remains reachable at a
  stable safe-floor position rather than joining the generic spread motion.
  Other NPCs avoid that pair, remain inside the playable arena, and route out
  of or around persistent poison pools; simulated NPCs may not fail those
  environmental hazards.

## Vitriolic Stasis and Helical Toxins

- At 100 energy both bosses travel to the middle and gain Stasis for 30 seconds.
  The UI explains that the live lower-health boss would heal to the higher, but
  the linked-health trainer does not ask the player to control this.
- After the three-second arrival/readability window, the raid receives Helical
  compositions for 28 seconds. The controlled player must meet exactly one
  complementary carrier so the combined pair has four green and four red.
- Any complementary player is valid. Touching an incompatible carrier fails;
  every NPC pair resolves through the same composition rule after the player
  has had time to identify a partner, avoiding answer-marking.
- When Stasis ends, sides swap and tanks cross-taunt through NPC assignment.
  Old marks are allowed to expire independently rather than being erased. After
  the second accepted cycle, the linked trainer health reaches zero.

## Validation

Coverage must prove both schedules, independent mark expiry with compact
numeric actor presentation, 100/40-yard geometry, both-side Droplets, Droplet
fuse independent of add death, one-to-one four-second return lanes, persistent
Blood pools, safe NPC floor/pool routing, a stable reachable Protovenom partner,
dispel-at-edge consequences, random carrier validity and eruption knockback,
30-second Stasis, 28-second Helical resolution, shared health as a documented
abstraction, side swap, and identical mechanics across trainer difficulty.
