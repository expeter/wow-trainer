# Target architecture

## Dependency direction

```text
TrainerShell
 ├── Catalogue and launch configuration
 ├── Settings / controls / HUD / audio
 ├── TacticalPlanEditor
 ├── Learn2DHost  ── Learn2DScenario
 ├── Train3DHost  ── Train3DScenario
 └── ReportingClient ── deferred API /v2
              │
EncounterPackageV1
 ├── manifest, abilities, phases, roles
 ├── timing profiles and tactics
 ├── Learn 2D modules and diagram arenas
 └── Train 3D scenarios, world arenas, mechanics and bots
```

Platform code must not import a concrete encounter. Encounters import only the
versioned authoring contracts and reusable platform primitives. Encounter
discovery provides packages to the catalogue.

## Core package contract

The concrete TypeScript names may evolve during the Sentinels spike, but this
semantic contract is fixed for version 1.

```ts
interface EncounterPackageV1 {
  apiVersion: 1
  manifest: EncounterManifest
  abilities: readonly AbilityDefinition[]
  phases: readonly PhaseDefinition[]
  roles: readonly RoleDefinition[]
  timingProfiles: readonly TimingProfile[]
  tacticSchema: TacticSchema
  tactics: readonly TacticPreset[]
  learn2d: readonly Learn2DScenario[]
  train3d: readonly Train3DScenario[]
}
```

### `EncounterManifest`

- Stable machine ID and display name.
- Raid, encounter order, content season, source confidence.
- Supported modes and difficulties.
- Availability such as research, PTR preview, live validated, or retired.
- Default scenario, timing profile and tactic preset per mode/difficulty.
- Optional feature capabilities such as tank actions, interrupts, dispel calls,
  or extra-action buttons.

### `AbilityDefinition`

- Stable encounter-scoped ability ID and optional game spell ID.
- Player-facing name and concise description.
- Telegraph, cast, active-effect, aura, or expiry durations where known.
- Severity and semantic tags: movement, spread, stack, tank, interrupt, pair,
  soak, object, add, informational.
- Source provenance: journal, PTR guide, PTR video, live log, hotfix, or local
  tactic decision.
- Confidence and timing-profile override keys.

Ability metadata describes what is observable. It does not define whether the
player fails. Each mode references the ability and implements its own lesson or
resolution rule.

### `RoleDefinition` and `EncounterAction`

A role has a stable ID, label, responsibilities, tactic slots, eligibility,
and zero or more actions. Actions are capability records, not fixed global
fields:

```ts
interface EncounterActionDefinition {
  id: string
  label: string
  kind: 'interrupt' | 'taunt' | 'swap' | 'claim' | 'soak' | 'special'
  defaultBinding?: string
  cooldown?: number
}
```

The input service maps active action IDs to bindings and HUD buttons. A
scenario owns availability, validity, cooldown, feedback, and resolution.

### `TimingProfile`

- Stable ID such as `ptr_2026-08-13` or
  `live_eu_week1_2026-08-19`.
- Encounter ID, supported difficulty, version and status.
- Per-value source and confidence.
- Trigger values for health, energy, aura expiry, add death, phase entry, or
  elapsed time.
- Replacement/supersession metadata without mutating historical profiles.

Mechanics should prefer state triggers. Elapsed-time schedules are profiles,
not mechanic code.

## Distinct mode contracts

### Learn 2D

`Learn2DScenario` is a pedagogical state machine. It may define:

- Explanation, observation, decision, action, feedback and recap steps.
- Abstract diagram actors, zones, arrows, lanes, timers, stacks and icons.
- Fixed tutorials and randomized quizzes.
- Correct choices, allowed alternatives, hints and correction text.
- A simplified role or tactic context.

`DiagramArena2D` uses named semantic regions such as `acid-side`,
`center-corridor`, `green-meeting-lane`, or `outer-drop-zone`. Coordinates are
layout anchors only and never claim 3D yard accuracy.

Learn 2D does not import the 3D simulation, collision system, Three.js, or
world arena. It reports the same encounter/scenario/ability/role IDs and stable
failure categories where they overlap.

### Train 3D

`Train3DScenario` owns a deterministic fixed-step simulation:

- State/event graph and completion rules.
- Exact `WorldArena3D` geometry and boundaries.
- Actors, auras, cast/action state, effects and encounter objects.
- Assignment-aware bot policies.
- Player commands and encounter actions.
- Success, wipe, non-terminal mistake, and metrics.

Renderers receive an immutable snapshot containing actors, primitive effects,
HUD facts, prompts, timers and outcome state. Renderers never decide hits,
movement targets, timers, or bot behavior.

`WorldArena3D` describes polygons/circles, holes, obstacles, heights, spawn
anchors, boss anchors, planner bounds, camera presets and visual theme. A boss
may provide several arenas, and a scenario declares which arena it uses.

## Tactical plan contract

The tactic editor operates on a package-provided schema:

- Roster slots and display profiles.
- Exclusive and repeatable roles.
- Groups/sides and ordered rotations.
- Pairs, chains, lanes, sectors and object ownership.
- Player, boss, add and marker coordinates per declared 3D arena.
- Abstract region ownership for Learn 2D when useful.
- Encounter-action ownership.
- Difficulty and scenario applicability.

Built-in presets are immutable. A user duplicates a preset before editing.
Plans have `encounterId`, `schemaVersion`, stable preset/custom ID, and migration
metadata. Import validates before persistence. Unknown future schema versions
are rejected with a useful message instead of being partially loaded.

JSON copy/download/import is canonical. A URL hash may carry a plan only when
the encoded value remains below a conservative limit; larger plans use files.
No server is required for initial sharing.

## Discovery and isolation

Use Vite `import.meta.glob` over `src/encounters/*/index.ts` to discover package
loaders. Validate every loaded package before adding it to the catalogue.
Dynamic loading keeps unselected encounter code out of the initial bundle when
practical.

The discovery module is generic and should not enumerate encounter IDs. The
catalogue sorts by manifest metadata. Adding a package therefore adds files in
one directory and tests, not a global union, duration conditional, or renderer
switch.

## Shared platform services

- `SettingsStore`: namespaced, schema-versioned storage with safe parsing.
- `InputManager`: movement/facing commands plus dynamic encounter actions.
- `HudLayoutStore`: scenario-declared HUD elements with percentage anchors.
- `AudioDirector`: independent music/effect/raid-lead channels driven by the
  authoritative mode clock.
- `TacticRepository`: built-ins, local custom plans, migrations, import/export.
- `EncounterCatalogue`: discovery, validation, availability and lazy loading.
- `AttemptReporter`: no-op/local initially, `/v2` client later.
- `BuildManifest`: version, revision, build timestamp and update detection.

## Error handling

- A malformed encounter package is excluded and reported on a development
  diagnostics screen; it must not crash the entire catalogue.
- A missing tactic falls back to the package default and explains the change.
- An incompatible custom tactic remains stored but is not applied until it can
  be migrated.
- A missing timing profile blocks the affected scenario rather than silently
  choosing arbitrary constants.
- An unavailable renderer produces a clear mode-specific error and returns to
  setup without losing configuration.
- Reporting/API failure never changes simulation outcome or presents a
  gameplay strike.
