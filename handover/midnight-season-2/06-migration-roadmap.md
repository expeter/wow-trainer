# Reuse-first migration roadmap

## Principle

Use a strangler migration: begin with the proven application, create tested
platform seams around reusable behavior, move the Season 2 shell onto those
seams, and retire L’ura-specific production code only after the reuse inventory
has been addressed.

A blank Vite app followed by visual imitation is not acceptable. It would lose
accessibility, settings migrations, control edge cases, planner behavior,
browser-test knowledge, audio clock semantics, and deployment safeguards that
were earned through player feedback.

## Stage 0: repository transfer

1. Clone/open the new empty GitHub repository in its own workspace.
2. Add the legacy repository as a source remote.
3. Fetch tags and create the new main history from `v0.9.1`.
4. Retain a `legacy-source-v0.9.1` tag or branch.
5. Copy this handover folder into the new repository.
6. Replace `NEW_REPOSITORY_URL` only after confirming the actual remote.
7. Create Season 2 `AGENTS.md`, specifications, ticket register, milestones and
   changelog by adapting the workflow rather than copying L’ura encounter
   contracts.
8. Do not configure either public domain yet.

The old repository remains the owner of `lura.asgard.website`. Do not archive
it in a way that prevents a necessary security or deployment repair.

## Stage 1: characterize the baseline

- Run `sec-helper audit` before project code.
- Run v0.9.1 unit tests, existing focused Playwright coverage, and production
  build in the new repository.
- Record environment-specific failures before refactoring.
- Add a migration milestone and explicit feature tickets.
- Preserve the original application behind a development-only legacy entry
  while extraction is active.

The legacy entry is a behavior reference, not a Season 2 feature and not part
of the eventual production navigation.

## Stage 2: visual foundation and shell

Extract without redesigning first:

- Design tokens: background, surfaces, borders, semantic colors, type, radius,
  shadows and spacing.
- Base form controls, buttons, cards, tabs, hints, status/failure treatment and
  responsive breakpoints.
- Build/version indicator, update banner, changelog and issue links.
- Setup-shell tab routing and accessible hidden-panel behavior.
- Product configuration for title, repository URL, issue URL, hostname and
  release copy.

Then adapt the shell hierarchy for Season 2:

- Game settings.
- Keys & Mouse.
- HUD.
- Tactical plan.
- Statistics.
- Profile.

Statistics and Profile may show clear deferred/coming-later states. They should
not use fake production data.

## Stage 3: reusable client services

Extract and characterize:

- `SettingsStore` with the `midnight-s2:` namespace and schema versions.
- Dynamic keybindings and conflict resolution.
- 3D mouse/keyboard movement, camera persistence and both-buttons-forward.
- Mode-declared HUD elements and draggable anchors.
- Independent audio channels and pause-aware scheduling.
- Tactic repository, codecs, validation, import/export, and built-in presets.
- Build manifest/update service.

Do not migrate old local-storage values automatically. If a preference import
is later desired, make it a visible one-time action for compatible fields such
as camera inversion and bindings.

## Stage 4: encounter catalogue and tactic editor

- Introduce the `EncounterPackageV1` types and runtime validator.
- Add automatic directory discovery and lazy loading.
- Build catalogue cards and launch selection.
- Replace fixed L’ura raid-plan fields with `TacticSchema` declarations.
- Generalize player, boss, marker, group, partner, lane and action-owner editor
  components.
- Implement plan schema versioning and JSON sharing.
- Keep the L’ura planner visible only in the legacy reference entry until the
  new editor matches the reusable interactions.

## Stage 5: Learn 2D

- Implement a small diagram renderer and pedagogical step engine.
- Support explanation, observation, decision, action, feedback and recap.
- Provide abstract zones, lanes, actors, arrows, timers, stacks and icons.
- Keep Learn 2D independent of Three.js and exact world coordinates.
- Use the shared shell, tactic/role selection, timing label, audio preferences
  and attempt-result vocabulary.

Helical Toxins tutorial and quiz are the first vertical slice.

## Stage 6: Train 3D

- Extract general actor, camera, ground, beam, cone, circle, marker, aura and
  cast primitives from `GameScene.tsx`.
- Introduce a fixed-step simulation and immutable renderer snapshot.
- Move bot targeting and mechanic resolution out of rendering.
- Implement dynamic encounter actions and reliable bot policies.
- Build the Sentinels world arena and focused Helical Toxins drill.

Use existing L’ura pure-function tests as examples, not as a reason to keep its
phase model.

## Stage 7: Sentinels full package

- Complete Learn 2D side/tank lessons and guided full fight.
- Complete Train 3D Protovenom, side rotation and tank swap drills.
- Compose the Train 3D full Heroic/Mythic scenario from those modules.
- Finish the visual tactic schema and bundled guild/default preset.
- Mark all timing as PTR until live validation is imported as a new profile.
- Run complete package, shell, 2D, 3D and browser acceptance.

This stage freezes `EncounterPackageV1`. Breaking changes afterwards require a
new contract version and migrations rather than silent edits.

## Stage 8: independent encounters

Only after Stage 7:

- Assign one boss directory per subagent.
- Let agents work concurrently against the frozen authoring API.
- Route shared-core proposals through one integration owner.
- Merge and release encounter packages independently.
- Preserve timing-profile history after live/hotfix updates.

## Stage 9: API v2 and statistics

Implement the isolated `/v2` attempt/reporting system after local encounters
produce stable attempt reports. Do not let telemetry design block the shell or
the first encounters.

## Deployment cutover

- Use a separate GitHub Pages workflow and concurrency group.
- Configure the new Pages custom domain before changing DNS.
- Point the `midnight` DNS CNAME directly to the GitHub Pages owner domain.
- Verify domain ownership and HTTPS.
- Confirm the old domain, API v1 health, and all Season 1 boards remain
  unchanged after every infrastructure step.
- Do not enable new API deployment ownership until the v1 compatibility and
  database migration rehearsal passes.
