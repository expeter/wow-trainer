# Delivery milestones

This file defines the Season 2 execution order and owns each open Season 2
ticket exactly once. Individual ticket status remains authoritative in
[`README.md`](README.md); stable behavior belongs in
[`specifications.md`](specifications.md). The frozen L’ura record at the end is
source archaeology, not part of this roadmap.

## Current release boundary

- `v0.10.0` is the first standalone public release at
  `https://midnight.asgard.website`. Its isolated Pages workflow, custom domain,
  approved TLS certificate, and first production response are verified.
- The repository uses the tagged L’ura v0.9.1 source solely as an immutable
  extraction reference.
- The inherited L’ura leaderboard remains `season-1` and belongs to the legacy
  repository. This repository does not change, migrate, or deploy it.
- Nek’zali, Entombed Sentinels, Vashnik, The Lost Explorers, Sszorak, The Twin
  Fangs, and The Coiled Altar are playable encounter packages in the current
  workspace; the published v0.10.0 subset remains unchanged until a later
  release is explicitly requested. Ula’tek remains catalogue-only.

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

Open ticket:

- `FR-085` — reconcile and implement Vash’nik the Malignant as the next isolated
  full-fight package.

`FR-075`, `FR-086`, `FR-089`, and `FR-094`–`FR-096` are complete: the
individual encounter gate remains enforced, Lost Explorers plus the three
evidence-backed follow-up bosses are isolated full-fight packages, and shared
Train 3D elevation supports encounter-authored airborne mechanics.

`CR-303` is complete: newly supplied Sszorak and Lost Explorers plans drive
their contained Learn 2D backgrounds, while code-rendered raised platforms,
toxic depths, and cave-void surroundings align all four evidenced environments
without changing simulation ownership.

`FR-097` keeps Ula’tek deferred until mechanic evidence exists; its arena image
and catalogue metadata alone do not authorize runtime work.

Exit gate:

- Nek’zali and Entombed Sentinels pass the agreed playtesting loop in Learn 2D
  and Train 3D.
- Every implemented boss uses the shared entity/action/effect contracts and has
  a canonical encounter specification plus focused simulation and browser
  coverage.
- No boss-specific implementation weakens the M1 architecture contract.

### Parallel publication runway · M2 remains open

Goal: keep encounter expansion and playtesting active while completing M3–M5,
then publish the accepted subset as an isolated static Season 2 trainer without
exposing or mutating the legacy trainer, service, or leaderboard. Publication
does not require every raid boss to be implemented.

Run the publication-specific gates in this order after the accepted M3–M5
slices are ready:

1. `CR-235` — complete: retired Season 1 runtime, service, deployment, assets,
   tests, and branding while preserving the baseline tag and lineage.
2. `CR-236` — complete: applied the restrained token-driven forest, venom,
   spirit, stone, and bone identity plus procedural encounter floors.
3. `FR-074` — complete: the dedicated GitHub Pages workflow publishes
   `midnight.asgard.website` with explicit legacy-domain safety checks; the
   public repository, Pages deployment, approved certificate, HTTPS response,
   and deployed version artifact are verified.

Publication does not authorize API `/v2`, rankings, achievements, or a
leaderboard-season change.

### M3 · Tactical planner — complete

Goal: restore the reusable planning workflow against versioned Season 2
encounter data rather than imported L’ura encounter state.

`FR-079` supplies the versioned package-owned tactic editor, required-field
validation, local save/load, reset, and checked JSON exchange. `BUG-222` closes
the first implementation's regression by restoring selectable important-phase
maps with actual package-declared 20-player raid and boss/add actors instead of
dragging assignment labels. Phase positions persist independently and V1 plans
migrate into the checked V2 layout format.

`BUG-228` normalizes the compact Import, Export, Save, and Reset controls.
`CR-300` adds direct single- and multi-player selection, relative group dragging,
and assignment drop targets without weakening persistence or migration checks.

### M4 · Sounds and music — complete

Goal: restore independent, pause-aware audio services after encounter behavior
is stable enough to own meaningful cues.

`FR-078` supplies independent persisted Music, Sounds, and Raidlead channels,
setup previews, runtime toggles, and pause-aware browser-generated cues.

### M5 · Front design and shell — complete

Goal: refine the public-facing journey and setup hierarchy after the encounter
catalogue and core workflows are established.

`CR-281` removes extraction banners. `CR-282` introduced the discovered boss
journey; `CR-295` corrects its over-expanded first presentation into the
reviewed compact boss selector plus one selected encounter launch panel and a
separate compact two-by-two trainer-difficulty control.

The publication-gate theme work is intentionally not duplicated here: it
provides the minimum coherent public identity, while M5 owns the later
structural shell refinement.

`CR-299` presents the supplied local Venomous Abyss portraits as a selectable
ordered boss path with its two progression branches and concise player-facing
`2D`/`3D` launch labels while retaining the internal runtime contracts.

`CR-302` removes decorative boss-path connector lines and reduces corner
sequence-number prominence without changing the accepted selector geometry.

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

### Post-publication optimization — complete

`CR-234` records gzip budgets and loading boundaries, retains the existing
runtime frame threshold, reduces custom-arena paint work, improves reduced-
motion and canvas accessibility behavior, and keeps the measurement repeatable
through `npm run measure:build` without changing encounter mechanics.

### Deferred outside the delivery sequence

- `FR-097` — Ula’tek runtime; reconsider only when a maintained mechanic
  specification exists in addition to the supplied arena image.
- `FR-093` — reusable Death Knight grip assignment/action; reconsider after
  higher-priority encounter and platform work without adding generic player CC.
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
