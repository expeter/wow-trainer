# Testing and release strategy

## Safety gate

Before running project code in a new checkout, run `sec-helper install` or
`sec-helper audit` and stop if the installed-package audit fails. Dependency
changes use sec-helper only and retain lockfile/install-script policy.

## Test layers

### Platform unit tests

- Encounter discovery and runtime validation.
- Fixed-step clock, pause/resume and deterministic seeds.
- Geometry, movement and collision primitives.
- Dynamic encounter actions and binding conflicts.
- Settings defaults, parsing and migrations.
- Tactic validation, persistence, import/export and migrations.
- Timing-profile resolution and provenance.
- Attempt-report construction without network submission.

### Encounter contract suite

Run the same conformance tests over every discovered package:

- Identifier/reference integrity.
- Defaults and supported combinations.
- Timing provenance.
- Tactic validity.
- Mode/full-fight availability.
- Asset resolution.
- No cross-encounter imports.

### Learn 2D tests

- Tutorial steps and hints.
- Correct, wrong, and expired choices.
- Randomized quiz determinism.
- Role/tactic selection.
- Abstract diagram accessibility and keyboard operation.
- Stable result/failure reason codes.

### Train 3D tests

- Mechanic state transitions and exact timing.
- Player and bot movement policies.
- Collision, soak, pair, aura, cast and action resolution.
- Reliable default bots and explicitly configured bot-error drills.
- Pause/resume and direct drill/full-fight entry.
- Simulation output independent from renderer frame rate.

### Component tests

- Shell tabs, launch configuration and deferred panels.
- Dynamic keybindings and mode-specific settings visibility.
- HUD dragging and declared elements.
- Tactic editor interactions and validation feedback.
- Audio channel independence and preview.
- Result and failure explanations.
- Update/build metadata.

### Browser tests

Retain the existing principles:

- Repository-local Playwright browser path.
- Isolated local server port.
- Focused wrapper with named presets or free-text fallback.
- Zero retries for focused regressions.
- Full-suite arguments only through the maintained complete-suite wrapper.

Add presets for:

- `shell`.
- `controls`.
- `tactics`.
- `learn2d`.
- `train3d`.
- One preset per public encounter.

The Sentinels browser suite covers Helical success, wrong match, third-player
collision, expiry, mode switching, plan round-trip, tank swap, reliable bots,
focused drills and the full-fight path.

## Renderer boundary verification

- Learn 2D tests do not initialize Three.js or import Train 3D simulation.
- Train 3D simulation can run headlessly without WebGL.
- Three.js consumes immutable snapshots and emits only input/camera events.
- Running the same Train 3D command recording with different render frame
  rates produces the same result and metrics.
- Renderer failure returns to setup without recording a gameplay failure.

## CI organization

- Dependency/security audit.
- Platform unit/component tests.
- Encounter contract matrix.
- Encounter-local tests, shardable by package.
- Focused browser smoke tests for shell and reference encounter.
- Full browser suite before release.
- TypeScript and Vite production build.
- Documentation/privacy checks.
- Pages artifact/deployment only after all release gates.

Encounter CI should make the owning package obvious in failures. Adding a boss
must not cause every other boss to recompile through a central switch beyond
normal TypeScript/package validation.

## Release boundary

The first Season 2 public release requires:

- Familiar extracted shell and styles.
- Persisted controls, HUD and audio.
- Boss/mode/scenario/tactic/role launch selection.
- Schema-driven visual tactic editor.
- Sentinels Learn 2D focused lessons and guided full fight.
- Sentinels Train 3D focused drills and provisional full fight.
- Visible PTR timing provenance.
- No unexplained default bot wipe.
- Passing audit, tests and build.
- `midnight.asgard.website` deployment independent from L’ura.

API v2 is not required for the first local encounter milestone. If public
telemetry is absent, the UI must not imply that an attempt was uploaded.

## Legacy safety checks

Infrastructure work must confirm:

- `lura.asgard.website` still serves v0.9.1 unless a separately approved
  maintenance release exists.
- API `/v1/health` and Season 1 data remain readable.
- No Season 2 workflow deploys to the L’ura Pages environment.
- No new DNS record replaces the old custom domain.
- No API v2 migration runs before the compatibility rehearsal.
