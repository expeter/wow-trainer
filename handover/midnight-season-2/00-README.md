# Midnight Season 2 trainer handover

This folder is the durable handover from the L’ura trainer to the new Midnight
Season 2 trainer repository. It exists so a fresh workspace does not interpret
“new repository” as “new product from scratch”.

The L’ura project already solved valuable platform problems: a readable setup
shell, WoW-inspired controls, a draggable HUD and raid planner, independently
persisted audio channels, deterministic mechanic helpers, browser and API
testing, build provenance, privacy-aware online identity, and a disciplined
ticket/release workflow. The Season 2 project should extract and generalize
those capabilities while replacing the encounter-specific monolith.

## Repository boundary

- Legacy source: `git@github.com:expeter/wow-midnight-fall-lura-trainer.git`
- Stable extraction baseline: tag `v0.9.1`
- Legacy production: `https://lura.asgard.website`
- New repository: supply its URL as `NEW_REPOSITORY_URL` in the new workspace
- Planned Season 2 production: `https://midnight.asgard.website`
- Shared API hostname: `https://api.asgard.website`

The old site remains available and its leaderboard remains `season-1`. The new
repository starts from the stable v0.9.1 history, proves that baseline, and
then performs an incremental extraction. Unfinished L’ura encounter work from
`feature/m1-encounter` is reference material only and must not be imported as a
batch.

## Required reading order

1. [Product direction](01-product-direction.md)
2. [Reuse audit](02-reuse-audit.md)
3. [Target architecture](03-target-architecture.md)
4. [Encounter package guide](04-encounter-package-guide.md)
5. [Entombed Sentinels reference](05-sentinels-reference.md)
6. [Migration roadmap](06-migration-roadmap.md)
7. [API v2 and public statistics](07-api-v2-and-public-statistics.md)
8. [Testing and release](08-testing-and-release.md)
9. [Decisions and risks](09-decisions-and-open-risks.md)
10. [Next-session prompt](10-next-session-prompt.md)

The source-material folder contains the researched encounter blueprint, the
long-form raid research, and an anonymized survey summary. The named raw survey
is deliberately excluded from this public handover.

## First migration checklist

1. Open the new empty repository as its own Codex workspace.
2. Copy this complete handover folder into it.
3. Add the legacy repository as a temporary read-only source remote.
4. Seed the new repository from `v0.9.1`, preserving commit and tag history.
5. Retain a `legacy-source-v0.9.1` tag before changing product identity.
6. Read the new repository’s `AGENTS.md` and this handover before editing.
7. Run `sec-helper audit`, unit tests, focused browser tests, and the build.
8. Extract the shell and services incrementally; do not start a blank UI.
9. Stabilize `EncounterPackageV1` with Entombed Sentinels.
10. Only then assign separate encounter directories to parallel agents.

## Non-negotiable boundaries

- Do not deploy Season 2 code over `lura.asgard.website`.
- Do not change the legacy API’s `/v1` behavior or `season-1` data implicitly.
- Do not publish raw named survey responses.
- Do not put mechanic resolution, bot decisions, or clocks in a renderer.
- Do not require Learn 2D and Train 3D to share a world simulation.
- Do not make one encounter import another encounter.
- Do not add a boss by extending one global event union or central switch.
- Do not begin achievements or competitive scoring before encounter practice is
  useful and the `/v2` attempt contract is stable.

## What success looks like

The first public Season 2 release looks and feels descended from the L’ura
trainer, retains its controls and planning strengths, removes its architectural
coupling, and ships Entombed Sentinels in two distinct forms:

- Learn 2D teaches what happens and what the selected role should do.
- Train 3D practices exact movement, timing, assignments, collisions, and tank
  actions with deterministic bot raidmates.

Both modes use the same boss catalogue, ability names, roles, timing-profile
labels, tactics, settings shell, audio preferences, build metadata, and
reporting vocabulary.
