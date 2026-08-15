# Midnight Season 2 architecture boundary

This document operationalizes `SPEC-018`. It defines ownership before the
first encounter runtime is extracted; it does not implement
`EncounterPackageV1` or Entombed Sentinels.

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
| Product shell | Navigation, product identity, preferences, accessibility, encounter selection, shared terms | Boss mechanics or runtime geometry |
| `EncounterPackageV1` | Encounter identity, shared vocabulary, mechanic timeline/content, assignments, runtime capability declarations | DOM state, Three.js objects, API clients, global registry switches |
| Learn 2D runtime | Diagrams, explanations, timeline study, 2D planner projection | Train 3D world coordinates or physics |
| Train 3D runtime | Movement simulation, camera, collision, 3D arena projection | Learn 2D canvas state or diagram layout |
| Encounter directory | One boss package, its assets, fixtures, runtime adapters, and focused tests | Other bosses or central registration edits |
| Online platform | Future `/v2` identity, statistics, achievements, and rankings | Inherited L'ura `/v1` calls |

## Package discovery target

Each encounter will live at `src/encounters/<encounter-id>/index.ts` and export
one `EncounterPackageV1`. A discovery module will use a statically analyzable
Vite glob equivalent to:

```ts
import.meta.glob('./encounters/*/index.ts', { eager: true })
```

Adding a boss must not require editing a hand-maintained switch, array, or
route table. Validation will reject duplicate IDs, incompatible package
versions, missing runtime adapters, and cross-package imports.

## Delivery order

1. Stabilize repository identity, default shell, safety workflows, and the
   development-only L'ura reference (`CR-230`).
2. Implement and test the `EncounterPackageV1` type and automatic discovery.
3. Build Entombed Sentinels as the only encounter package, with shared content
   and distinct Learn 2D and Train 3D adapters (`FR-072`).
4. Stabilize focused component, runtime, browser, accessibility, and build
   coverage before any second boss begins.
5. Address API `/v2` and public systems only in their later milestone
   (`FR-073`).

No step changes the inherited leaderboard season or authorizes a public
deployment.
