# L’ura platform reuse audit

## Baseline

Use tag `v0.9.1` as the stable extraction baseline. It is the known production
release, whereas the current `feature/m1-encounter` branch contains additional
localhost-only and unreleased encounter work. Individual later ideas, notably
tank presentation and action-state lessons, may be reviewed and ported through
focused changes after the baseline is established.

The present coupling is measurable:

- `src/App.tsx`: approximately 3,853 lines, owning shell, persistence, planner,
  simulation, online orchestration, results, and most state transitions.
- `src/GameScene.tsx`: approximately 2,066 lines, mixing Three.js primitives,
  L’ura arenas, bot strategies, mechanic visualization, camera and actor state.
- `src/game.ts`: approximately 1,569 lines of shared and phase-specific rules.
- `src/styles.css`: approximately 1,587 lines of valuable but globally coupled
  product styling.

This is why reuse must happen by behavior and responsibility, not by preserving
the current component boundaries.

## Reuse matrix

| Capability | Current source | Preserve | Extraction target | Main caution |
| --- | --- | --- | --- | --- |
| Vite/React/TypeScript build | `package.json`, Vite/TS configs | Existing dependency set, relative Pages build, Git revision/build time manifest | Platform root | Rename L’ura constants and avoid unnecessary dependencies |
| Setup shell | `App.tsx` | Six-tab hierarchy, accessible panels, compact settings cards, summaries | `shell/` components | Shell must consume catalogue/settings services, not encounter state |
| Visual language | `styles.css` | Manrope/DM Mono, dark surfaces, jade focus, readable hierarchy, responsive grids | `styles/tokens.css`, `base.css`, component files | Do not copy the monolithic stylesheet unchanged |
| Build/update UI | `App.tsx`, Vite config | Version, revision, build time, update polling, changelog/issue links | `shell/build/` | Product/repository URLs become configuration |
| Persistence | `App.tsx`, achievement collection | Safe defaults, parsing, validation, migrations, account/device separation lessons | `platform/storage/` | Use a new `midnight-s2:` namespace; never read/write L’ura keys silently |
| Keybindings | `App.tsx` | Rebinding, conflict clearing, labels, reset, missing-binding state | `platform/input/` | Actions are capability IDs, not a fixed L’ura interface |
| Camera/input | `GameScene.tsx` | Mouse-look, facing, inversion, wheel zoom, keyboard turning, camera-relative movement | `modes/train3d/input/` | Add both-buttons-forward; remove encounter assumptions |
| HUD editor | `App.tsx` | Draggable percentage anchors, reset, optional buttons, persisted layout | `shell/hud/` | HUD elements must be declared by mode/scenario |
| Tactical planner | `App.tsx` position maps and plan codec | Drag interactions, selected-player treatment, markers, validation, save/load/share | `shell/tactics/` | Replace hard-coded phase maps and `RaidPlan` with a schema |
| Audio | `audio.ts`, encounter sounds, `App.tsx` | Independent opt-in channels, volume, TTS voice selection, preview, pause-aware cues | `platform/audio/` | Ability cues come from the encounter package; review asset licences |
| Three.js primitives | `GameScene.tsx` | Rings, discs, cones, beams, markers, actors, nameplates, textures, disposal/caching | `modes/train3d/rendering/` | Rendering functions consume snapshots; no mechanic decisions |
| Deterministic helpers | `game.ts`, `p1.ts`, `tank.ts` | Geometry, seeded randomness, timing helpers, explicit pure resolution functions | `platform/simulation/` or mechanic modules | Port tests with behavior; do not preserve phase-specific naming |
| Bot lessons | `GameScene.tsx`, mechanic helpers | Assignment-aware priorities, deterministic reactions, readable duties | `modes/train3d/bots/` | Bots belong to simulation and default to reliable play |
| Results | `completion.ts`, result proof | Clear failure reasons, phase/scenario summaries, copy/image layout, versioned Run-ID concept | `shell/results/` | Points and achievements remain optional consumers |
| Online shell | `online.ts`, `OnlinePanel.tsx` | Fetch wrapper, identity/privacy presentation patterns, local fixtures | Deferred `api-v2/` client | Do not send Season 2 data to `/v1` |
| Feature flags | `features.ts` | Explicit environment/release boundaries with tests | `platform/features/` | Prefer build/config flags over hostname-only product logic |
| Unit test harness | Vitest config and setup | jsdom, media/TTS mocks, pure helper coverage | Repository root | Generalize L’ura-specific fetch fixtures |
| Browser harness | Playwright config and scripts | Local browser path, isolated ports, zero-retry focused wrapper | Repository root | Rename environment variables and presets |
| CI/Pages | `.github/workflows/pages.yml` | Parallel unit/UI/build gates and Pages artifact | New repository workflow | Never reuse the old domain or deployment concurrency group |
| API tests/operations | `api/` | Migration discipline, idempotency, validation, privacy, health/version checks | Deferred isolated v2 modules | Preserve `/v1` compatibility and one deployment owner |
| Documentation workflow | `AGENTS.md`, `docs/` | Stable IDs, specs, changelog, milestones, focused verification, commits | New repository root | Start Season 2 contracts before implementation |
| Project Inbox | `project-inbox/` | Localhost-only evidence capture and explicit triage | Optional development tool | Do not run an automatic watcher |

## Preserve behavior, not coupling

The new shell should look familiar because its tokens, spacing, panels,
controls, feedback hierarchy, and accessibility rules come from reviewed L’ura
work. It should not preserve a single component owning hundreds of state values
or a game renderer receiving the complete encounter as props.

Use the existing application as a temporary characterization fixture:

1. Establish the v0.9.1 baseline and tests in the new repository.
2. Extract one capability at a time behind unchanged behavior.
3. Add focused tests at the new boundary.
4. Switch the shell to the extracted capability.
5. Retain the old implementation until the characterization check passes.

## Refactor or rewrite

The following need new contracts rather than direct extraction:

- The global `EventKind` union and nested duration conditional.
- `EntryMode` values such as `arena0` through `arena4`.
- `GameArena` and `GameScene` prop surfaces.
- Renderer-owned NPC target calculation and mechanic visual decisions.
- Fixed `RaidPlan` fields for L’ura phases and crystal carriers.
- A global `KeyBindings` interface containing every possible encounter action.
- Achievement evaluation coupled to L’ura phase results.
- API attempt validation coupled to L’ura difficulty/duty/scoring.

## Excluded legacy content

Do not ship these merely because they exist in the baseline:

- L’ura encounters, arenas, crystal rules, scores, phase results, achievements,
  bundled Asgard plan, or Season 1 boards.
- L’ura storage keys, hostnames, project links, creator copy, and release copy
  without an explicit Season 2 review.
- Unreviewed soundboard assets or tracks whose licence/attribution has not been
  carried into the new repository.
- Production environment files, OAuth secrets, SSH details, certificates, or
  database backups.
- Raw guild survey data containing names or free-text attribution.

L’ura code may remain on the extraction reference branch and in Git history.
It does not need to remain in the Season 2 production bundle after the reuse
checklist is satisfied.
