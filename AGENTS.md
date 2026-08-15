# Midnight Season 2 Trainer repository instructions

This is the standalone Midnight Season 2 trainer repository. It was seeded
from the reviewed L'ura Trainer v0.9.1 source baseline for incremental,
reuse-first extraction.

Before changing the trainer, read in order:

1. every Markdown file under [`handover/midnight-season-2`](handover/midnight-season-2/00-README.md), in numeric order;
2. the source-material README, anonymized survey summary, raid research, and
   scenario blueprint referenced by that handover;
3. [`docs/specifications.md`](docs/specifications.md);
4. [`docs/README.md`](docs/README.md) for ticket history and open work;
5. [`docs/milestones.md`](docs/milestones.md) for delivery order;
6. [`docs/architecture.md`](docs/architecture.md) for package and runtime
   ownership.

Treat [`handover/midnight-season-2/10-next-session-prompt.md`](handover/midnight-season-2/10-next-session-prompt.md)
as binding context. Read [`docs/p1-encounter.md`](docs/p1-encounter.md) only
when inspecting the frozen L'ura reference; it is not a Season 2 mechanic
contract.

## Delivery discipline

Every new request receives a stable `FR`, `CR`, `BUG`, or `SPEC` ID in
`docs/README.md` before implementation. Mark it implemented only after focused
regression coverage passes and its affected documentation is current. Do not
leave completed work recorded as open or silently drop an unresolved ticket.
Add every user-visible change to `CHANGELOG.md` under `Unreleased` in the same
change. Commit each verified request or coherent ticket batch; do not push
unless the user asks.

Use `sec-helper add`, `sec-helper install`, `sec-helper npm`, or `sec-helper
pip` for dependency changes. Do not bypass the local package proxy, release
cooldown, lockfiles, hash checks, or install-script policy. Before running
project code, run `sec-helper audit` and stop if the installed-package audit
fails. Record `Dependency-Audit: sec-helper` in commits that change dependency
metadata.

Use `./scripts/test-e2e-focused.sh <preset-or-free-text>` for focused
Playwright regressions. Do not bypass it with direct Playwright test commands;
the wrapper owns the repository-local browser path, isolated server, and
zero-retry policy. Use `npm run test:e2e:local` only for the complete browser
suite or Playwright arguments outside the focused wrapper.

## Architecture and safety boundaries

- Never alter or deploy over `lura.asgard.website`, and never deploy the
  inherited L'ura `/v1` API from this repository.
- Preserve the reviewed L'ura v0.9.1 source as a development-only reference
  while extraction is underway. Do not import unfinished L'ura encounter work
  wholesale or make the legacy application the public entry point.
- Reuse the established shell, styles, controls, HUD, tactical-planner, audio,
  persistence, testing, and delivery patterns incrementally. Do not replace
  the product with an unrelated blank interface.
- Learn 2D and Train 3D share shell-owned vocabulary and encounter content but
  have separate runtimes and separate arena models.
- Each boss lives in an isolated `src/encounters/<encounter-id>/` directory and
  is discovered automatically through `EncounterPackageV1`. Do not create a
  central boss switch.
- Entombed Sentinels is the first encounter. Do not begin another boss until
  the package contract, discovery, both runtime boundaries, and focused
  Sentinels regressions are stable.
- API `/v2`, public statistics, achievements, and rankings are later
  milestones. Do not connect the Season 2 shell to inherited `/v1` services.
- Never commit raw named survey responses, production secrets, or identifying
  research data.
- Do not change encounter mechanics merely to make a test pass. Rendering,
  collision, NPC movement, timers, assignments, and the documented encounter
  contract must agree.

This workspace uses the configured GitHub MCP for repository state, Actions
runs, job logs, reruns, and deployment monitoring. Do not use `gh` or the Yeet
workflow. When the user explicitly asks to publish, local `git push` is the
transport; monitor subsequent GitHub state through MCP.

Leaderboard seasons never change without explicit user approval. A SemVer
release does not imply a leaderboard-season change.
