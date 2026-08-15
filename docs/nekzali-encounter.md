# Nek'zali the Soulcoiler encounter contract

Tickets: `SPEC-022`, `FR-081`, `FR-082`, `FR-083`, `CR-261`

This is one complete supplied mechanics contract shared by Learn 2D and Train
3D. Test, Easy, Normal, and Hard control guidance and failure tolerance only;
they never add, remove, or retime mechanics. Evidence profiles remain internal,
versioned, and visibly replaceable until authoritative live data is available.

## Evidence and confidence

- The supplied arena reference is
  [`INBOX-20260815-124454-f3a9e1`](../inbox/INBOX-20260815-124454-f3a9e1.md).
  It is used as the contained Learn 2D arena background; the Train 3D room uses
  a code-rendered interpretation rather than applying the bitmap as a texture.
- The supplied Heroic quick recap is
  [`INBOX-20260815-125743-a610b5`](../inbox/INBOX-20260815-125743-a610b5.md).
- The maintained pre-release synthesis is
  [`raid-research.md`](../handover/midnight-season-2/source-material/raid-research.md).
- The current Dungeon Journal transcription is represented by the
  [Wowhead PTR encounter guide](https://www.wowhead.com/ptr/guide/midnight/raids/venomous-abyss-nekzali-the-soulcoiler-boss-strategy-abilities),
  updated 2026-08-10.
- The raid has not opened on live EU servers. Pull-relative timing remains a
  replaceable PTR/profile assumption. Rules tied to health, deaths, energy, or
  aura removal remain event driven.
- Nek'zali was withdrawn from scheduled pre-release testing for the Well-realm
  additions. Their timing may not be inferred from other footage or presented
  as validated.

## Arena and raid

- Use a circular 90-yard playable room around a lethal central Soulcoil Well.
- Learn 2D uses the supplied top-down reference as a contained tactical
  background. Train 3D recreates its readable structure with dark teal stone,
  radial platforms, spectral cyan light, and restrained venom accents; it does
  not use the 2D bitmap as a 3D floor texture.
- Simulate a 20-player raid: two tanks, five healers, five melee, and eight
  ranged. The controlled slot is selected before pull and is locked in combat.
- Randomly assign the controlled player to intermission soak group one or two
  and show that assignment before the countdown.
- The current aggro holder controls boss pursuit. Player-controlled tanks can
  use Taunt/Spott; the other tank swaps automatically when Possession Barrage
  begins. Boss health is green when the player tank owns aggro and red when the
  player does not; non-tanks always see the hostile red state.

## Phase 1 · Soulcoiler Initiation

- Boss health drains from 100% to 50% over approximately 90 simulated seconds.
  This is a trainer pacing profile, not an asserted live DPS check.
- **Essence Rend:** several players are pulled for five seconds and carry an
  essence. Target selection remains unknown until applied. When the controlled
  player is selected, a compact attached timer appears; the player moves toward
  a free outer lane and drops exactly three provisional training puddles before
  the aura ends and ordinary play resumes. One persistent Latent Cultist zone
  remains at removal. Current journal evidence proves only the final Cultist,
  so the three-drop training model remains explicit and replaceable.
- **Possession Barrage:** the active tank moves away in a clear lane. Spirits
  travel from boss to tank and burst in a small area; raid damage decreases with
  travel distance. Non-tanks avoid the lane and impacts. The off-tank takes
  aggro so the boss does not chase the Barrage target.
- **Restless Amani:** at roughly 60 seconds, adds spawn from outer sarcophagi and
  move toward the Well. NPCs switch targets and attack them. The controlled
  player is responsible for killing exactly three marked adds with Main ability;
  each add has an attached health bar. Any living add reaching the Well fails
  the attempt. Dead Amani leave Vessels of Awakening for intermission.

## Intermission · Ritual of Awakening

- Trigger at 50% boss health. Nek'zali moves to the Well and is untargetable.
- Two Echoes of Jawae activate one after the other at opposite outer edges.
- Each Echo casts Hungering Pyre on one raid half. A pending group soak is a
  filled large circle with an inward arrow; once enough assigned players enter,
  it becomes outline-only. Only the active half soaks.
- The other half receives small red spread circles, fans into available room,
  and uses the explosions to Cremate every assigned Amani corpse within four
  yards. The explosion leaves a short-lived burning zone that all players avoid.
- Repeat with the second Echo and the opposite soak half. Any missed group soak,
  harmful overlap, or surviving required corpse is a terminal failure.

## Phase 2 · Uncoiling

- Begins after both Echoes die. Phase 1 mechanics continue.
- **Invoke** is shown as a five-second training cast. On completion it triggers
  Soulcoil Rite and sends every Latent Cultist hazard in a deterministic seeded
  random direction around the Well. Players avoid the moving six-yard zones.
- Boss energy rises from Rites and leaked adds. Reaching 100 energy is a
  terminal failure; defeating Nek'zali is the completion condition.

## Well-realm mechanics

- Grasping Depths opens the Well for one assigned team.
- The team kills the Drowned Echo while avoiding Swirling Spirits, exits once,
  and receives Soul Exhaustion. Re-entry while exhausted is invalid.
- Invoke interrupts active casts and silences interrupters for three
  seconds while Cultists reposition.
- These rules are part of the sole full-fight mechanics contract. Their
  provisional cadence remains isolated in a versioned evidence profile, not a
  player-selectable raid-difficulty scenario.

### Approved trainer realization

- Active phases assign alternating raid halves to Grasping Depths. Only the
  assigned half enters; the other half and outer arena are hidden while the
  controlled player is inside the centre dome.
- Entry begins with a slight three-second pull toward the Well. The inner team
  attacks one Drowned Echo; the player contributes 20 completed Main casts.
- The Drowned Echo gives the player one readable five-second assigned cast to
  Interrupt. Missing it is terminal.
- Four small spirits orbit the Echo. Every ten seconds four additional spirits
  travel outward along the cardinal directions. Contact is harmful.
- Nek'zali schedules seeded variable three-second disruption casts inside the
  realm. If one completes during the player's Main cast, that cast is cancelled
  and a non-terminal performance record is emitted. It cannot wipe or deduct
  points until scoring is explicitly implemented.
- Killing the Echo begins a five-second return cast, after which the player
  returns to the unchanged outer encounter state with Soul Exhaustion.

## Rendering and validation

- Learn 2D and Train 3D consume shared encounter events but own separate arena
  coordinates and renderers.
- Before a target is selected, central coaching may indicate only an
  approximate upcoming mechanic. Once the controlled player is affected, the
  attached timer and one concise reaction line become authoritative; the
  central panel must not duplicate assignment/status prose.
- Soak fill/outline state, spread circles, harmful ground, add health, target
  switching, aggro color, boss pursuit, spirit travel, corpse state, and Invoke
  motion must come from simulation snapshots rather than renderer-owned logic.
- Automated coverage must prove phase triggers, three controlled add kills,
  add leaks, distance-scaled Barrage, tank swap/boss pursuit, alternating soak
  groups, corpse cremation, residual-corpse failure, moving Phase 2 hazards,
  alternating Well-realm entry, isolated snapshots, 20 completed Main hits,
  assigned interrupt failure, non-terminal disruption, and five-second return.
