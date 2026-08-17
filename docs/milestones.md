# Delivery milestones

This file defines the Season 2 execution order and owns each open Season 2
ticket exactly once. Individual ticket status remains authoritative in
[`README.md`](README.md); stable behavior belongs in
[`specifications.md`](specifications.md). The frozen L’ura record at the end is
source archaeology, not part of this roadmap.

## Current release boundary

- No standalone Midnight Season 2 release has been cut and no public deployment
  is configured.
- The repository uses the tagged L’ura v0.9.1 source solely as an immutable
  extraction reference.
- The inherited L’ura leaderboard remains `season-1` and belongs to the legacy
  repository. This repository does not change, migrate, or deploy it.
- Nek’zali and Entombed Sentinels are the only playable encounter packages.
  Every other boss remains catalogue-only until its own ticket is accepted.

## Season 2 roadmap

### M1 · Core rework — complete

Goal: establish the reusable trainer platform and prove it with the contract
rooms, Nek’zali, and Entombed Sentinels before parallel encounter work.

Completed scope includes the migration dossier and standalone identity; guarded
Vite, Vitest, and Playwright tooling; the global Project Inbox workflow; the
shared-shell/separate-runtime boundary; `EncounterPackageV1` discovery; shared
actions, HUD, input, lifecycle, actor/effect projection, entity-owned mechanics,
bounded NPC locomotion, ambient activity, and the first two full-fight packages.

The detailed completion record remains in [`README.md`](README.md), including
`CR-229`–`CR-233`, `FR-072`, `FR-076`–`FR-077`, `FR-087`–`FR-088`,
`SPEC-018`–`SPEC-025`, and their corrective `CR`/`BUG` batches through
`CR-292`. Completed tickets do not remain duplicated in later milestones.

### M2 · Encounters and playtesting — current

Goal: stabilize the two acceptance encounters through playtesting, then add the
remaining bosses one at a time from accepted evidence and canonical per-boss
specifications.

Open tickets:

- `FR-093` — review a reusable Death Knight grip assignment/action without
  silently adding a general player crowd-control binding.
- `FR-075` — expansion umbrella: keep non-approved bosses catalogue-only and
  require an individually accepted implementation ticket for each package.
- `FR-085` — reconcile and implement Vash’nik the Malignant as the next isolated
  full-fight package.
- `FR-086` — reconcile and implement The Lost Explorers after Vash’nik.

Sszorak, The Twin Fangs, The Coiled Altar, and Ula’tek have no accepted
implementation tickets yet. Research files or catalogue metadata do not
authorize runtime work.

Exit gate:

- Nek’zali and Entombed Sentinels pass the agreed playtesting loop in Learn 2D
  and Train 3D.
- Every implemented boss uses the shared entity/action/effect contracts and has
  a canonical encounter specification plus focused simulation and browser
  coverage.
- No boss-specific implementation weakens the M1 architecture contract.

### Publication gate · After M2

Goal: publish an isolated static Season 2 trainer without exposing or mutating
the legacy trainer, service, or leaderboard.

Run in this order:

1. `CR-235` — remove L’ura and Season 1 runtime, service, deployment, asset,
   storage, test, and branding residue while preserving the immutable baseline
   tag, privacy-safe history, handover evidence, and README lineage.
2. `CR-236` — apply the restrained token-driven troll, nature, venom, and
   spirit-realm theme required for the initial public identity.
3. `FR-074` — enable the dedicated GitHub Pages workflow and
   `midnight.asgard.website`, with explicit legacy-domain safety checks.

Publication does not authorize API `/v2`, rankings, achievements, or a
leaderboard-season change.

### M3 · Tactical planner

Goal: restore the reusable planning workflow against versioned Season 2
encounter data rather than imported L’ura encounter state.

Open ticket:

- `FR-079` — implement the versioned encounter tactic schema, draggable
  role/assignment markers, validation, save/load/import/export, and safe
  persistence using package-owned arena and anchor semantics.

### M4 · Sounds and music

Goal: restore independent, pause-aware audio services after encounter behavior
is stable enough to own meaningful cues.

Open ticket:

- `FR-078` — extract persisted music, encounter-sound, and raid-lead/TTS
  channels with preview controls and reviewed/licensed assets only.

### M5 · Front design and shell

Goal: refine the public-facing journey and setup hierarchy after the encounter
catalogue and core workflows are established.

Open tickets:

- `CR-281` — remove the development extraction-status banner.
- `CR-282` — redesign the boss journey/catalogue, per-boss 2D/3D actions,
  setup density, difficulty selector, interaction states, and contract-room
  presentation without replacing the reviewed shell or copying supplied art.

The publication-gate theme work is intentionally not duplicated here: it
provides the minimum coherent public identity, while M5 owns the later
structural shell refinement.

### M6 · Results, scoring, achievements, and API

Goal: add result presentation and online services only after the offline trainer
and encounter packages are stable.

Open tickets:

- `FR-080` — finish reusable offline recap and shareable result identity;
  scoring, achievements, rankings, and submission remain separate consumers.
- `FR-073` — introduce API `/v2`, public statistics, achievements, and rankings.

Any change to scoring, achievement eligibility, accepted-run comparability, or
rankings requires an explicit leaderboard-season decision. A SemVer release
does not imply one.

### Post-publication optimization

Open ticket:

- `CR-234` — run a measured bundle-loading, runtime/frame-performance,
  accessibility, responsive, and regression-duration pass after the first
  static publication without changing encounter mechanics.

### Deferred outside the delivery sequence

- `FR-089` — shared Train 3D jumping and vertical traversal; reconsider only
  when accepted encounter evidence requires it.
- `FR-090` — development/Test-only simulation-speed control; reconsider only
  with one deterministic-clock contract.
- `FR-091` — shared vitality, potion, defensive, and cooldown service;
  reconsider only for package-declared actions backed by encounter evidence.

## Frozen L’ura v0.9.1 delivery record

The sections below are retained for source archaeology. Their open-looking
entries belong to the legacy repository and are not Season 2 work or ordering.

### Legacy M0 · Online identity hotfix

Goal: ensure a run that starts authenticated remains attributable and that the
shell never silently mistakes an expired server session for a valid login.

- `BUG-145` — revalidate before issuance, bind the full run and its wipes to
  the issued attempt capability, reject stale-session anonymous downgrades, and
  align API/client version acceptance at `0.6.2`.
- `CR-194` — open public Recent activity identities in their trainer profile
  instead of navigating directly to Raider.IO.
- `BUG-148` — show whether the next pull is a verified attempt, deliberately
  anonymous, or local because the signed-in account lacks an active character.
- `CR-196` — show the played raid-plan name and selected verified Battle.net
  character together on the controlled-player nameplate without implying
  attribution when no active character is selected.
- `BUG-149` — keep a transition-started Phase 2 crystal grounded throughout
  the beam/orb event, matching direct entry and every difficulty.
- `CR-226` — publish v0.9.1 with synchronized frontend/API compatibility and
  verify production leaderboard continuity while retaining `season-1`.

This legacy patch retains `season-1`; it does not belong to the Season 2
publication gate.

### Legacy M1 · Encounter completion

Goal: preserve the outstanding L’ura mechanic record without making it active
Season 2 work.

Dependency order recorded by the legacy repository:

1. `FR-048` — drop and recover the landing trio’s crystal, then make the
   crystal carrier and one helper cover one opening Soak while the controlled
   player resolves the other.
2. `CR-051` — swap the second Phase 3 sequence’s ground Soak and memory-game
   order after the exact overlap timing is confirmed.

Implemented for legacy localhost review:

- `CR-198` — ordinary dropped-crystal pickup/explosion lifecycle.
- `FR-050` — random non-crystal Phase 2 beam assignees.
- `FR-049` — final Phase 2 regroup and Phase 3 flight origins.
- `BUG-150` — stable NPC tank position during active Starsplinters.
- `FR-068`, `CR-195`, and `BUG-152` — localhost two-tank assignments and the
  public-host release boundary.
- `FR-023` — superseded by deterministic two-tank ownership.
- `CR-197` — full-journey and cumulative achievement progress.

These legacy mechanics, scoring, and accepted-run rules require a leaderboard
season decision in their owning repository before release.

### Legacy M2 · Ranking and achievement integrity — completed

- `BUG-136`–`BUG-143` — authoritative best-run, rank, phase-clear, issuance,
  rate-limit, identity, season-scope, and browser-achievement corrections.
- `SPEC-016` — retain `season-1` while making rank-one achievement points
  permanent, account-deduplicated, and finite.

### Legacy M3 · Developer and test tooling

- `FR-051` — remove avoidable runner warnings while retaining diagnostics.
- `FR-038` — localhost-only `Gnomkaiser` admin mode.
- `FR-067` — private, rate-limited live bug-report inbox.
- `CR-199` — stable focused-Playwright wrapper.

### Legacy M4 · Easter egg and activity polish

- `FR-039` — live `Gnomkaiser` crown, raid scale, and hidden achievement.
- `FR-069` — API-only manually granted exceptional achievements.
- `FR-066` — clearly fictional live-activity flavor.

### Legacy documentation milestone

`SPEC-015` owns the frozen legacy specification, inventory, and API
reconciliation record. Season 2 documentation is governed by the roadmap and
ticket register above.
