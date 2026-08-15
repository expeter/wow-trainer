# New workspace handoff prompt

Paste the following into the first Codex thread opened in the new repository.
Replace `NEW_REPOSITORY_URL` with the actual repository URL.

```text
We are continuing the Midnight Season 2 raid-trainer project from the L’ura
Trainer workspace. This is a reuse-first migration, not a greenfield rewrite.

Repositories and production boundaries:
- New repository: NEW_REPOSITORY_URL
- Legacy source: git@github.com:expeter/wow-midnight-fall-lura-trainer.git
- Stable extraction baseline: tag v0.9.1
- Keep https://lura.asgard.website and API /v1 season-1 unchanged.
- Planned new site: https://midnight.asgard.website
- Planned backend namespace: https://api.asgard.website/v2

Before doing anything else:
1. Read AGENTS.md completely.
2. Read every file in handover/midnight-season-2 in numeric order.
3. Inspect the repository/remotes/status and verify whether v0.9.1 history has
   already been seeded.
4. Run sec-helper audit before project code.
5. Do not edit until you have inspected the v0.9.1 shell, controls, planner,
   audio, persistence, styles, tests and deployment workflow.

Settled product decisions:
- Preserve and extract the reviewed L’ura shell, visual language, controls,
  HUD, tactical-planning interactions, audio services, persistence patterns,
  build metadata, feedback hierarchy and test environment.
- Do not preserve the monolithic App.tsx/GameScene.tsx architecture.
- Learn 2D is a simplified teaching/diagram mode focused on what happens and
  what the selected role should do. It does not promise exact 3D positions.
- Train 3D is the detailed movement, timing, collision, assignment, bot and
  role-action simulation.
- Both modes share the shell, encounter manifest, ability/phase/role IDs,
  tactics, timing provenance, settings and reporting vocabulary, but have
  separate runtimes and arena types.
- One human plus deterministic reliable bots initially.
- Encounter actions include interrupt, taunt/swap and mechanic-specific extra
  actions. Class rotations, generic potions/defensives and movement cooldowns
  are deferred.
- Each boss lives in one isolated encounter directory with its definitions,
  timing, tactics, Learn 2D content, Train 3D mechanics/arenas/bots and tests.
- Use automatic encounter discovery. Adding a boss must not edit a central
  event union, duration conditional, renderer switch, or encounter registry.
- Typed code owns mechanic behavior; data owns descriptive abilities, timing,
  tactics and arena configuration.
- Each public boss has focused modules and a composed full-fight mode.
- Entombed Sentinels and Helical Toxins establish EncounterPackageV1 before
  parallel encounter implementation begins.
- API v2 and public aggregate statistics are deferred until local AttemptReportV2
  is stable. Points, achievements and leaderboards are later milestones.

Privacy:
- Do not commit lura-umfrage.json or named/free-text raw responses.
- Use only source-material/survey-summary.md.
- Do not copy production secrets, databases or deployment credentials.

First implementation objective:
Create the repository bootstrap and migration tickets, establish the v0.9.1
characterization baseline, and extract the first reusable shell/design-token
boundary without changing its reviewed presentation. Preserve a development-
only legacy reference until the reuse audit is complete. Do not start another
encounter and do not implement API v2 yet.

Verification:
- Follow the repository’s focused Playwright wrapper.
- Preserve zero-retry focused tests and isolated local server ports.
- Commit each verified ticket; do not push unless explicitly requested.
- Record Dependency-Audit: sec-helper in commit/PR notes when dependency work
  occurs.

Report any conflict between the handover and actual repository state before
making an irreversible choice. Otherwise make reasonable local assumptions and
complete the first coherent ticket.
```

## Files to make available locally

The public handover includes the anonymized survey summary and Season 2
research. If deeper survey analysis is needed, attach the raw survey directly
to the private Codex session rather than committing it.

The previous workspace may contain unrelated untracked inbox screenshots and
notes. Do not copy them into the new repository unless they are explicitly
triaged as Season 2 evidence.
