# Encounter package and agent guide

## Directory template

```text
src/encounters/<encounter-id>/
  index.ts
  manifest.ts
  abilities.ts
  phases.ts
  roles.ts
  timing/
    ptr.ts
    live-week-1.ts
  tactics/
    schema.ts
    default.ts
  learn2d/
    scenarios.ts
    diagrams.ts
  train3d/
    scenarios.ts
    arenas.ts
    mechanics/
    bots/
  tests/
    package.test.ts
    learn2d.test.ts
    train3d.test.ts
  README.md
```

Small encounters may combine files within their directory. They must preserve
the same ownership boundary and single package export.

## Authoring rules

- `index.ts` exports one `EncounterPackageV1`; it does not perform side effects.
- Stable IDs are lowercase ASCII with encounter scope where ambiguity is
  possible.
- Abilities and phases contain shared semantic facts, not mode behavior.
- Learn 2D may simplify or omit spatial mechanics explicitly.
- Train 3D owns exact mechanic resolution but uses platform primitives for
  geometry, actors, effects, clocks and commands.
- Bots expose readable assignments and follow the active tactic.
- Bot mistakes default to disabled. An intentional bot-error drill declares
  its policy and attributes its failures visibly.
- The renderer receives snapshots only. A mechanic cannot inspect Three.js or
  DOM objects.
- No package imports another encounter package.
- No package writes browser storage or calls the reporting API directly.
- Every uncertain timing points to a timing-profile key and provenance.
- Every omitted or informational ability appears in the encounter README.

## Mechanic-module pattern

A mechanic module should be small and composable:

```ts
interface Train3DMechanic<State> {
  id: string
  abilityIds: readonly string[]
  initialize(context: MechanicContext): State
  update(state: State, frame: SimulationFrame): MechanicUpdate<State>
  handleCommand?(state: State, command: PlayerCommand): MechanicUpdate<State>
}
```

Updates emit state, effects, auras, prompts, metrics and outcome events. They
do not render. Focused drills instantiate selected modules; a full fight
composes the same modules under a scenario state graph.

The platform should offer reusable primitives only after two real mechanics
need the same concept. Expected early primitives include:

- Circles, rings, cones, lines, waves and moving projectiles.
- Casts, auras, stacks, expiry and dispel/clear events.
- Pair matching and collision guards.
- Soak occupancy and ordered rotations.
- Arena zones, lanes and boundaries.
- Boss ownership, taunt and tank-swap state.
- Assignment-aware navigation targets.

Avoid an unrestricted JSON mechanic language. Typed modules make exceptional
fight behavior reviewable and testable; data remains appropriate for metadata,
tactics, arenas and timing profiles.

## Package conformance

The shared contract suite must verify every discovered package:

- Unique package, ability, phase, scenario, role, tactic and timing IDs.
- All referenced abilities, phases, arenas, roles and profiles exist.
- Default selections are supported.
- At least one Learn 2D and one Train 3D scenario for a public boss.
- A full-fight scenario and focused drill declarations.
- Tactic defaults pass their schema.
- Unsupported difficulty/mode combinations cannot be selected.
- Every timing field has provenance and confidence.
- Required assets resolve.
- Scenario imports remain inside the encounter or documented platform API.

## Parallel-agent workflow

Do not start parallel boss implementation until Entombed Sentinels has shipped
through the local acceptance suite and `EncounterPackageV1` is explicitly
versioned.

After that point:

1. Give one agent one encounter directory, its research section, supported
   difficulties, and concrete acceptance scenarios.
2. The encounter agent edits only its directory and encounter-local assets and
   tests.
3. It may consume documented platform APIs but must not expand them silently.
4. A missing capability is reported as a small platform proposal with two
   concrete encounter uses or a clear Sentinels precedent.
5. The integration owner implements/approves core changes and runs the full
   contract suite.
6. Each agent reports omitted abilities, timing confidence and remaining live
   validation in its README.
7. Merge one verified encounter at a time even if agents work in parallel.

This prevents several agents from reshaping the core around their boss at the
same time and prevents a central encounter registry from becoming a merge
hotspot.

## Definition of done for one boss

- Package passes conformance validation.
- Built-in tactic and visual editor fields cover every trained assignment.
- Focused Learn 2D lessons explain the selected role.
- Focused Train 3D drills validate movement/actions without unexplained bot
  failures.
- Full fight composes the same mechanic modules.
- PTR/live status and omitted mechanics are visible.
- Unit, component and focused browser tests pass with zero retries.
- User-facing docs and changelog are current.
- No unrelated encounter directory changed.
