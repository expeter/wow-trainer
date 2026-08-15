# Delivery milestones

This is the maintained grouping of open tickets. Individual requirements and
status remain authoritative in [`README.md`](README.md); stable behavior lives
in [`specifications.md`](specifications.md).

## Current release boundary

- No standalone Midnight Season 2 release has been cut and no public deployment
  is configured. The repository starts from the tagged L'ura v0.9.1 source
  baseline solely for incremental extraction.
- The inherited L'ura leaderboard remains `season-1` and is owned by the legacy
  repository. This repository does not change, migrate, or deploy it.

## Midnight Season 2 transition

Goal: preserve the reviewed L’ura trainer platform knowledge while moving new
encounter development into an independently deployed Season 2 repository.

- `CR-229` — completed the privacy-safe migration dossier under
  [`handover/midnight-season-2`](../handover/midnight-season-2/00-README.md),
  including the reuse audit, separate Learn 2D and Train 3D contracts,
  isolated encounter packages, Sentinels reference, API `/v2` statistics
  boundary, verification strategy, source material, and new-session prompt.
- `CR-230` — completed: establish the standalone product identity, default
  Season 2 shell, development-only L'ura reference, documentation set,
  dependency baseline, and hard deployment safeguards.
- `CR-231` — completed: pin and verify the reviewed Vite 8.2.1, Vitest
  4.1.10, and Playwright 1.62.1 bootstrap toolchain through `sec-helper`, with
  a native-loader-compatible Vite configuration.
- `CR-232` — completed: add and start the localhost-only global Project Inbox
  skill, with captures routed into the maintained Season 2 ticket workflow.
- `CR-233` — completed: acknowledge the original L’ura Trainer in repository
  documentation only, never as a deployed Midnight shell link.
- `SPEC-018` — completed: make the shared-shell/separate-runtime and isolated
  auto-discovered encounter-package boundaries binding.
- `FR-072` — in progress now that `CR-230` and `SPEC-018` are stable: Stage 4A
  introduced `EncounterPackageV1`, conformance validation, lazy automatic
  discovery, and the isolated Entombed Sentinels package. Stage 4B makes the
  focused Helical Toxins lesson playable through separate package-owned Learn
  2D and Train 3D runtimes, with shell-owned persisted movement bindings and
  HUD preferences. Corrective Stage 4C adds movable icon-based 2D practice,
  headless fixed-step 3D mechanics, a snapshot-only third-person renderer, and
  the development contract room. Stage 4D restores input reliability,
  interpolated rendering, the creator/action/HUD platform features, and paired
  full-raid 2D/3D contract labs. Full-fight and plan-image work is now present;
  planner editing and scoring remain.
- `CR-237` — completed under `FR-072`: make Learn 2D movement-driven and
  represent each character's toxin composition with attached icons rather than
  character text while preserving abstract 2D geometry.
- `BUG-157` — completed under `FR-072`: replace the fixed tactical 3D camera
  and renderer-owned resolution with WoW-like player/camera controls, a
  deterministic headless simulation, and a snapshot-only generic renderer.
- `CR-238` — completed under `FR-072`: provide a development-only abstract
  contract room with seeded aura events, reaction prompts, position checks,
  spell primitives, and the same reusable 3D host used by encounter drills.
- `BUG-158` — completed under `FR-072`: restore independent four-direction
  Learn 2D input and clear held movement when pointer or window focus is lost.
- `BUG-159` — completed under `FR-072`: interpolate fixed-step Train 3D
  snapshots at display rate, bound render cost, and remove avoidable snapshot
  publication after an outcome; `BUG-163` later removed follow-camera lag.
- `CR-239` — completed under `FR-072`: provide paired 2D and 3D contract
  rooms with multiple correct/incorrect ground reactions and one simulated
  20-player raid of two tanks, five healers, and mixed melee/ranged damage
  players.
- `BUG-160` — completed under `FR-072`: restore the creator business card
  from its stable `SPEC-002` contract in the extracted Season 2 setup shell.
- `CR-240` — completed under `FR-072`: restore shared Main ability, Taunt,
  Health potion, and role-aware Shield vocabulary in the contract lab; its
  interim action panel was revised by `CR-243`, and `FR-077` owns real actions.
- `CR-241` — completed under `FR-072`: restore a persisted, draggable HUD
  configuration preview for objective/timer, player resources, aura state,
  actions, and boss health; `CR-245` applies it to the Train 3D arena.
- `BUG-161` — completed under `FR-072`: restore the retained left-orbit,
  right-align/right-face, and both-buttons-forward mouse interaction contract.
- `BUG-162` — completed under `FR-072`: move render snapshots off the 20 Hz
  React publication path, lower pixel cost, and measure renderer-local pacing.
- `CR-242` — completed under `FR-072`: replace the ambiguous player capsule
  and reversed cone with a readable humanoid marker and aligned front chevron.
- `CR-243` — completed under `FR-072`: keep role/starting-position choice in
  the movement lab only, add its locked overlaid countdown, attach health only
  to Learn 2D actors, and replace oversized action panels with below-arena keys.
- `CR-244` — completed under `FR-072`: calibrate Train 3D units, movement
  speed, arena dimensions, spell radii, and timing vocabulary to sourced WoW
  yards/second instead of the prototype's arbitrary scale.
- `BUG-163` — completed under `FR-072`: remove the apparent motion blur by
  eliminating follow-camera translation/look-target lag during movement.
- `CR-245` — completed under `FR-072`: extract the reviewed v0.9.1 in-arena
  HUD layout into Season 2 and keep 3D world actors free of health bars.
- `BUG-164` — completed under `FR-072`: make HUD positioning smooth with
  local drag drafts, release-time persistence, a subtle grid, and key nudging.
- `CR-246` — completed under `FR-072`: restore exact build provenance,
  changelog/issue links, and deployed-version update notification.
- `SPEC-019` — completed: maintain the v0.9.1 extraction parity matrix and
  link every reusable active gap to a Season 2 ticket.
- `FR-076` — in progress under `FR-072`: shared countdown/pause/failure lifecycle;
  pause/status controls land now while failure/results remain open.
- `FR-077` — planned under `FR-072`: dynamic package-declared actions.
- `FR-078` — planned under `FR-072`: independent persisted audio services.
- `FR-079` — planned under `FR-072`: versioned encounter tactic editor; the
  supplied Sentinels raid-plan image is preserved as package evidence.
- `FR-080` — in progress under `FR-072`: `CR-249` restores reusable live
  failure/points corners; recap and offline result identity remain.
- `CR-247` — completed under `FR-072`: restore the full-viewport runtime,
  compact status header, top-right lab performance, and lab-only slide-in panel.
- `CR-248` — completed under `FR-072`: correct the wide-screen status-bar and
  arena-aspect regressions captured in `INBOX-20260815-104139-edd60f`, and keep
  setup-only build provenance out of running lessons.
- `BUG-165` — completed under `FR-072`: autosave shell-owned bindings and migrate
  individual settings without periodically discarding the user's key map.
- `CR-249` — completed under `FR-080`: restore clickable recent failures at the
  bottom left and a scoring-ready, currently unscored points frame at the
  bottom right of both runtimes.
- `BUG-166` — completed under `FR-072`: make every consecutive contract-room
  reaction reachable at 7 yd/s while rendering a continuous floor outside the
  unchanged playable bounds.
- `CR-250` — completed under `FR-072`: remove the redundant HUD summary preview
  and make arena-layout dragging follow the pointer directly.
- `CR-251` — completed under `FR-072`: replace duplicate setup banners with one
  auto-discovered encounter card per package containing its playable and
  Coming soon scenarios.
- `BUG-167` — completed under `FR-072`: render Learn 2D player motion and Train 3D
  cast progress at display rate without increasing mechanic or React publication
  frequency.
- `CR-252` — completed under `FR-072`: replace the lab role dropdown with an
  abstract 20-slot position picker and class-readable controlled-player marker.
- `CR-253` — completed under `FR-072`: return shell-owned bindings and camera
  preferences to a dense, reviewed-style settings panel.
- `CR-254` — completed under `FR-072`: make mechanic objective and timer mandatory,
  remove raw position output, and retain only meaningful optional HUD frames.
- `BUG-168` — completed under `FR-072`: keep controlled and vacated raid-slot
  renderer identities unique so every pre-pull 3D position change moves the
  player-follow perspective reliably.
- `SPEC-020` — completed under `FR-072`: document the verified yard-space model,
  current camera projection, and the boundary between calibrated platform
  movement and encounter geometry that still needs sourced evidence.
- `BUG-169` — completed under `FR-076`: restore the centered dismissible outcome
  card with details, retry, and setup-exit behavior while retaining the live
  clickable failure log.
- `CR-255` — completed under `FR-072`: add lab-only dummy raid world markers to
  the shared 3D snapshot/renderer vocabulary for visual scale review.
- `CR-256` — completed under `FR-072`: restore continuous class-colored NPC
  cosmetic casts toward bosses without feeding rendering back into mechanics.
- `CR-257` — completed under `FR-072`: keep central coaching to one-line prompts,
  move lab specifications into its drawer, and support multiple compact named
  countdown helpers.
- `SPEC-021` — superseded by `SPEC-022`; its Nek'zali priority change remains.
- `SPEC-022` — completed: one current mechanics contract per encounter, one
  full-fight scenario per runtime, and Test/Easy/Normal/Hard as assistance and
  failure-tolerance profiles only.
- `CR-261` — completed: remove the raid-difficulty axis from package contracts,
  setup, Nek'zali, and Sentinels, then collapse each implemented boss into its
  single complete supplied mechanics set.
- `FR-081` — completed under `FR-075`: expose all eight raid bosses through
  isolated auto-discovered package panels while keeping six metadata-only.
- `FR-082` — completed under `FR-075` and collapsed by `CR-261`: implement the
  supplied Nek'zali active phases and intermission in both runtimes.
- `FR-083` — completed under `FR-075` and collapsed by `CR-261`: include the
  alternating Well-realm halves, Drowned Echo duty, spirit avoidance,
  disruption, and return in Nek'zali's sole full fight.
- `CR-259` — completed under `FR-077`: add the persisted encounter Interrupt
  binding required by Nek'zali's assigned Well-realm cast.
- `FR-084` — completed under `FR-072` and collapsed by `CR-261`: complete the
  Sentinels reference package with all supplied mechanics, including
  Protovenom, in one full fight per runtime.
- `CR-258` — completed under `FR-077`: add a persisted encounter Dispel binding
  that only healer-capable Sentinels roles can resolve.
- `FR-085` — planned under `FR-075`: implement Vash'nik as the next isolated
  full-fight package after `CR-261` is stable, preserving the
  supplied three-well raid plan and provisional player/role mechanic contract.
- `FR-086` — planned under `FR-075`: implement The Lost Explorers after
  Vash'nik as an isolated three-boss full fight, preserving the supplied
  octagonal raid plan and provisional Ikku/Namaa/Gebbo/Morzahi contract.
- `BUG-170` — completed under `FR-082`: restore a circular, undistorted and
  movement-complete Nek'zali Learn 2D board from the supplied visual report.
- `BUG-171` — completed under `FR-082`: replace the continuous Essence Rend trail
  with an affected-player timer and exactly three movement-driven puddles.
- `CR-260` — completed under `CR-257`: make Nek'zali's central mechanic display
  compact and preserve target uncertainty until the player is selected.
- `BUG-172` — completed under `FR-084`: make Sentinels Learn 2D movement
  screen-relative and keep simulated side groups visibly inside their colored
  play/soak areas without covering the player's mechanic.
- `BUG-173` — completed under `FR-072`: normalize visible horizontal and vertical
  movement speed across Season 2 Learn 2D full-fight arena projections.
- `CR-262` — completed under `FR-082`: give the provisional Essence Rend drill a
  practical outward lead, three-drop window, and recovery margin while
  preserving calibrated Train 3D movement.
- `BUG-174` — completed under `FR-072`: keep Learn 2D feedback overlays above
  the circular board and inside the visible arena frame.
- `BUG-175` — completed under `FR-082`: move NPC Rend targets around the edge
  and separate their three puddles.
- `CR-263` — completed under `FR-077`: retain the key legend while removing
  duplicated generic Nek'zali action-button banks.
- `BUG-176` — completed under `FR-077` and `FR-082`: visibly launch and impact
  controlled-player Main shots in both runtimes.
- `BUG-177` — completed under `FR-082`: resolve the player's spread against
  any corpse actually contacted instead of a fixed arrow target.
- `CR-264` — completed under `FR-072`: reconnect Season 2 snapshots to the
  reviewed L'ura class projectile scheduler, silhouettes, travel, and impact.
- `CR-265` — completed under `FR-082`: enlarge and populate the Well realm
  with a faster, denser dodge pattern.
- `BUG-178` — completed under `FR-072`: prevent smooth Main cast feedback from
  stalling across rapid casts and pause/resume.
- `BUG-179` — completed under `FR-084`: align Sentinels Acid/green and Blood/red
  with the raid plan while keeping the 100-yard bosses inside the room.
- `CR-266` — completed under `FR-084`: expose a reachable 18-second controlled
  droplet window without varying mechanics by trainer difficulty.
- `BUG-180` — completed under `FR-084`: render snapshot-declared Protovenom and
  Helical partners in Learn 2D.
- `BUG-181` — completed under `SPEC-022`: let Test record uncleared Protovenom
  and still transition both bosses into Stasis at 100 energy.
- `BUG-182` — completed under `BUG-161`: publish Sentinels player facing so
  right-button camera look remains visible while paused.
- `CR-267` — completed under `FR-081`: condense the eight bosses into a reusable
  two-row, four-column encounter selector with direct mode actions.
- `FR-073` — deferred: API `/v2`, public statistics, achievements, and rankings.
- `CR-235` — deferred until the first trainable Sentinels release candidate:
  remove L’ura and Season 1 runtime, service, deployment, asset, storage, test,
  and branding residue from the active product while preserving the immutable
  baseline tag, privacy-safe history, handover evidence, and README lineage.
- `CR-236` — deferred until the legacy-retirement pass: give the retained shell
  a restrained token-driven troll, nature, venom, and spirit-realm palette while
  preserving its structure, accessibility, responsiveness, and semantics.
- `FR-074` — deferred until the trainable Sentinels release candidate and both
  pre-publication cleanup passes are accepted:
  enable an isolated GitHub Pages workflow and `midnight.asgard.website` with
  an explicit production gate and legacy-domain safety checks.
- `CR-234` — deferred until the first static publication: perform a measured
  bundle, runtime, accessibility, responsive, and test-duration optimization
  pass without changing encounter mechanics.
- `FR-075` — in progress with its sequence revised by `SPEC-022`: Nek'zali is
  the first approved full-fight package; other bosses remain metadata-only until
  individually approved.

The approved encounter sequence is `FR-085` Vash'nik → `FR-086` The Lost
Explorers. Publication remains separate: the still-required pre-publication
sequence is `CR-235` → `CR-236` → `FR-074`, followed by the measured `CR-234`
optimization pass.
`FR-073` remains a separate later online-platform milestone and does not block
the static trainer sequence.

No boss beyond Nek'zali, Entombed Sentinels, and the explicitly approved
`FR-085` Vash'nik and `FR-086` Lost Explorers packages may gain playable
mechanics without a new approved ticket. Catalogue-only metadata does not
authorize an encounter runtime. The L'ura API and leaderboard remain frozen
legacy reference behavior and cannot deploy from this repository.

The remaining milestones below are the frozen L'ura v0.9.1 delivery record.
They are retained for source archaeology, not as the Season 2 execution order.

## M0 · Online identity hotfix

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

This patch retains `season-1`: it repairs attribution and version acceptance
without changing encounter scoring or ranking order.

- `CR-226` — publish v0.9.1 with synchronized frontend/API compatibility and
  verify production leaderboard continuity while retaining `season-1`.

## M1 · Encounter completion

Goal: finish the remaining encounter mechanics and reconcile the NPC strategy,
visual state, collision, scoring, and accepted-run rules.

This is the next implementation milestone and today's priority.

### Phase 2 and Phase 3

Implement in dependency order:

1. `FR-048` — drop and recover the landing trio's crystal, then make the
   crystal carrier and one helper cover one opening Soak while the controlled
   player resolves the other.
2. `CR-051` — swap the second Phase 3 sequence's ground Soak and memory-game
   order after the exact overlap timing is confirmed.

Implemented for localhost review in this milestone:

- `CR-198` — every ordinary dropped crystal now follows the global one-second
  pickup and six-second explosion lifecycle, with only a correctly committed
  P3 protection crystal exempt.
- `FR-050` — four random non-crystal beam assignees now intercept four
  continuously orbiting unresolved orbs per set, with rendered player aim and
  a terminal miss rule.
- `FR-049` — the final Phase 2 regroup now uses configured personal circles,
  and each visible actor position becomes that actor's Phase 3 flight origin.

### Phase 4 roles

Completed in this milestone:

- `BUG-150` — the NPC tank now holds the rendered group position throughout an
  active three-Starsplinter set and resumes its frontal route afterward.
- `FR-068` — two explicit shared tank assignments drive the localhost P1/P2/P3
  Heaven's Lance mitigation/swap loop. This incorporates the playable-cone
  foundation previously tracked separately by `FR-022`; `CR-195` finalizes
  which configured tank owns each Phase 4 role.
- `FR-023` — superseded by deterministic two-tank ownership under `CR-195`.
- `CR-195` — on localhost, Tank 1 owns the frontal cone, Tank 2 owns the moving rendered
  protection zone, neither receives Starsplinter, and each controlled role has
  its own canonical achievement.
- `BUG-152` — public hosts retain the released pre-tank behavior while the
  complete tank-role implementation remains available for local validation.
- `CR-197` — full-journey achievements now require Phase 1 through Phase 4 and
  cumulative/multi-run badges display their saved progress.

All current M1 tickets affect mechanic difficulty, failures, scoring, or accepted-run
comparability. Before releasing this milestone, explicitly ask whether it
starts a new leaderboard season. Until the user says otherwise, retain
`season-1`.

## M2 · Ranking and achievement integrity — completed

Goal: make every public position, crown, profile, and lifetime achievement
agree before another SemVer release can mix results into the current season.

- `BUG-136` — one best run per account and board.
- `BUG-137` — stable authoritative ranks while searching run boards.
- `BUG-138` — actual phase-clear counts and full-run-only streaks.
- `BUG-139` — issued-configuration validation and idempotent completion retry.
- `BUG-140` — rate-limit attempt issuance.
- `BUG-141` — never expose a linked guild from alias identity.
- `BUG-142` — one current-season scope for public, personal, and profile ranks.
- `BUG-143` — award the missing browser-local flawless Phase 1 achievement.
- `SPEC-016` — retain `season-1` while making rank-one achievement points
  permanent, account-deduplicated, and finite.

Completed under `BUG-136`–`BUG-143` and `SPEC-016`. The repairs retain
`season-1`. Their visible ranking and lifetime-point effects still require the
explicit leaderboard reminder before a release.

## M3 · Developer and test tooling

Goal: make local verification faster without creating production bypasses.

- `FR-051` — remove avoidable runner warnings while retaining real diagnostics.
- `FR-038` — localhost-only `Gnomkaiser` admin mode for completion and
  achievement testing.
- `FR-067` — add a private, rate-limited live bug-report inbox with an audited
  promotion path to GitHub.
- `CR-199` — provide one stable local focused-Playwright wrapper with named
  regression presets and a free-text fallback.

This milestone is not leaderboard-visible. `FR-067` is a production support
surface, but it does not alter encounter or ranking behavior.

## M4 · Easter egg and activity polish

Goal: add optional flavor only after encounter and ranking correctness.

- `FR-039` — live `Gnomkaiser` crown, raid scale treatment, and hidden
  achievement.
- `FR-069` — API-only manually granted exceptional achievements, beginning
  with the hidden 10-point Find a Bug badge and concealed public credentials.
- `FR-066` — clearly fictional live-activity flavor using the prepared copy
  deck after frequency, injection, accessibility, and localization decisions.

`FR-039` changes achievement eligibility and therefore needs a leaderboard
season reminder before release. `FR-066` must remain visibly distinct from
verified player events and must never write fictional records into the API.

## Documentation milestone

`SPEC-015` owns the current specification/inventory/API reconciliation and this
milestone register. It is complete only when:

- the feature inventory matches the shipped trainer;
- the API document matches deployed routes and operations while listing known
  deviations as tickets;
- released Phase 1 tickets no longer claim localhost-only status;
- every open ticket appears in exactly one milestone;
- `CHANGELOG.md` contains the post-v0.6 work under `Unreleased`.
