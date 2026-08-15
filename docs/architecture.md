# Midnight Season 2 architecture boundary

This document operationalizes `SPEC-018`. Stage 4A implemented the versioned
package, validation, and discovery boundary. Stage 4B adds package-owned lazy
runtime loaders and the first playable Helical Toxins slice while retaining
separate Learn 2D and Train 3D arena authority.

## Product entry points

`src/main.tsx` starts the Season 2 shell by default. In a Vite development
server only, `?reference=lura-v0.9.1` dynamically loads the frozen source
application. Production must neither advertise nor start that reference.

The legacy source remains in place temporarily so extraction can be compared
against reviewed behavior. It is not a dependency direction: new Season 2
modules must not import encounter state, geometry, online clients, or storage
keys from `App.tsx`, `GameScene.tsx`, or the L'ura `/v1` client.

## Ownership

| Owner | Responsibilities | Must not own |
| --- | --- | --- |
| Product shell | Navigation, product identity, preferences, accessibility, encounter/scenario selection, shared terms | Boss mechanics or runtime geometry |
| `EncounterPackageV1` | Encounter identity, shared vocabulary, mechanic timeline/content, assignments, runtime capability declarations and lazy runtime loaders | DOM state, Three.js objects, API clients, global registry switches |
| Learn 2D runtime | Diagrams, explanations, timeline study, 2D planner projection | Train 3D world coordinates or physics |
| Train 3D runtime | Movement simulation, camera, collision, 3D arena projection | Learn 2D canvas state or diagram layout |
| Encounter directory | One boss package, its assets, fixtures, runtime adapters, and focused tests | Other bosses or central registration edits |
| Online platform | Future `/v2` identity, statistics, achievements, and rankings | Inherited L'ura `/v1` calls |

## Package discovery

Each encounter lives at `src/encounters/<encounter-id>/index.ts` and exports
one `EncounterPackageV1`. `src/platform/encounters/discovery.ts` uses the
statically analyzable lazy Vite glob:

```ts
import.meta.glob('../../encounters/*/index.ts')
```

Adding a boss must not require editing a hand-maintained switch, array, or
route table. Validation excludes incompatible versions, duplicate or unstable
IDs, broken references, missing focused/full-fight declarations, invalid
defaults/tactics, and timing without provenance. Load failures become sorted
development diagnostics instead of crashing the catalogue.

Entombed Sentinels remains the architecture-reference encounter. Its package owns
the `ptr_2026-08-13` profile, tactic declarations, abstract 2D diagram arena,
independent 3D world arena, scenario metadata, and lazy runtime adapters. The
focused Helical drill and Heroic/Mythic full fights are `ready`: Learn 2D uses
abstract percentage space over the supplied tactical plan, while Train 3D
resolves side mechanics, energy/Stasis cycles, pairing, movement, and collision
in a headless fixed-step simulation. The reusable Three.js renderer consumes
immutable snapshots and owns no mechanic decisions.

The development-only platform contract room uses the same Train 3D movement,
camera, snapshot, aura, effect, timing, and position-check primitives. It is a
neutral extraction/characterization harness, not a discovered boss or a source
of fabricated encounter behavior, and Vite removes its guarded launch path from
production.

## Delivery order

1. Stabilize repository identity, default shell, safety workflows, and the
   development-only L'ura reference (`CR-230`).
2. Implement and test the `EncounterPackageV1` type and automatic discovery.
3. Build Entombed Sentinels as the only encounter package, with shared content
   and distinct Learn 2D and Train 3D adapters (`FR-072`).
4. Stabilize focused component, runtime, browser, accessibility, and build
   coverage before any second boss begins.
5. Retire inherited L'ura and Season 1 product residue without deleting the
   immutable source baseline, handover evidence, or repository lineage
   (`CR-235`).
6. Apply the restrained token-driven Season 2 visual theme without replacing
   the shared shell or weakening its accessibility contract (`CR-236`).
7. Publish the isolated static trainer, then measure and perform the first
   optimization pass before opening work on another boss (`FR-074`, `CR-234`,
   `FR-075`).
8. Address API `/v2` and public systems only in their later milestone
   (`FR-073`).

No step changes the inherited leaderboard season or authorizes a public
deployment.
