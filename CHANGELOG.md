# Midnight Season 2 Trainer changelog

## Unreleased

- Reconciled Nek'zali with the supplied 2026-08-16 fight research. Essence
  Rend is now a pull, knockback, timed Magic debuff, edge dispel, and one
  persistent Latent Cultist instead of a three-puddle abstraction; healers can
  dispel another edge-positioned target. Soulcoil Rite/Burn, Anguished Echo,
  shield-before-health Amani with NPC crowd control, Soul Transfer, explicit
  Pyre-versus-Cremation assignments, ten-second Well interrupt, Hollowing
  Strikes, timed Soul Exhaustion, and discrete clockwise Invoke steps now use
  the canonical encounter contract.
- Reconciled Entombed Sentinels with its supplied research while retaining the
  approved linked-health/time-driven Stasis simplification. Marks expire per
  application, both encounter sides receive Toxic Droplets and Living Venom
  lanes, Blighted Blood dispel creates an edge pool, Clinging Murk lasts six
  seconds, tank stacks are visible, Protovenom uses a deterministic carrier
  set with invalid-contact knockback, and Stasis/Helical now use their sourced
  30/28-second windows.
- Added reusable projection timing, timed-application, discrete-rotation, and
  radial-knockback mechanic primitives. Each boss now owns explicit Learn 2D
  and Train 3D schedules while trainer difficulty remains assistance/failure
  tolerance only. Canonical iterative specifications live in one document per
  boss.
- Kept focused Playwright runs trainer-only after `npm run dev` became the
  two-service trainer/inbox supervisor. The focused wrapper audits installed
  packages before Playwright starts the repository-local Vite server.
- Made `npm run dev` supervise both the hot-reload Vite trainer and active
  global Project Inbox, with clean combined shutdown and independent
  `dev:trainer`/`dev:inbox` commands. The obsolete repository-local Vite inbox
  implementation remains removed.
- Accepted the reusable Season 2 trainer core across both labs, Nek'zali, and
  Entombed Sentinels. Package discovery, separate projections, actions, entity
  timelines, NPC activity, lifecycle recovery, settings/HUD, and the frozen
  feature audit now pass the complete local gate. The unreachable focused
  Helical prototype left behind when Sentinels became one full fight was
  removed instead of being exposed as an unapproved practice scenario.
- Completed the frozen v0.9.1 core-feature audit without importing legacy
  encounter code. Jump/vertical traversal, diagnostic time scaling, opt-in
  vitality/recovery state, and focused-practice selection are now explicit
  keep/drop backlog decisions; existing audio, planner, results, publication,
  accessibility, and online boundaries were reconfirmed.
- Completed the shared training lifecycle: pause, pull countdowns, focus loss,
  retries, exits, and unmounts now clear held input consistently; full-fight
  retries repeat the locked countdown; and WebGL startup/context failures pause
  simulation behind an in-arena renderer retry without discarding fight state.
- Added a shared simulation-owned entity timeline to every lab and active
  encounter. Controlled players, raid NPCs, enemies, and arena systems now use
  independent deterministic tracks on one encounter clock, with package and
  contract-room actions entering the same path and snapshots exposing it to
  rendering. Raid NPCs also use reusable seeded, bounded idle movement and
  class-cast activity that yields to mechanic positioning and assignments.
- Replaced encounter-local fixed combat keys with validated package-declared
  action registries. The contract rooms, Nek'zali, and Entombed Sentinels now
  share role/mode filtering, shell bindings, keyboard dispatch, action legends,
  and optional HUD buttons across their separate 2D and 3D projections.
- Split keyboard movement into independently autosaved Learn 2D and Train 3D
  layouts while retaining shared pause and encounter-action bindings. Existing
  flat Season 2 settings migrate into both movement layouts.
- Corrected the latest two-dimensional encounter review. Essence Rend now ends
  exactly on its third drop, NPC drops match their visible path, and Invoke
  moves both Rend and additional Cultists with circular-wall reflection.
  Every Learn 2D runtime now attaches Main casting to the controlled actor;
  Main remains independently restartable and advances through Sentinels
  Stasis. Sentinels now uses shared two-cycle boss health, side-aware priority
  NPC attacks, boss-local randomized droplets with faster return shots,
  three-second player/NPC Blood-pool warnings, spaced Protovenom traffic, and
  delayed unguided all-raid Helical matching after the bosses reach the middle.
- Corrected Nek'zali's complete reaction flow from the latest visual review:
  assigned players now enter the Well by reaching its centre during a
  seven-second gate and return on the explicit five-second cast while the outer
  raid continues its work; the full Amani wave travels inward and Main chooses
  the nearest live add before the boss; NPC tanks carry Possession Barrage to a
  genuinely distant lane; every three-patch Rend set persists into Invoke; and
  the ten-second Echo duties distinguish the player's soak or Cremation,
  neutral corpses, confirmation, and resulting fire. Learn 2D now attaches its
  compact Main cast bar below the controlled player's health bar.
- Unified the Season 2 runtime capability boundary across the contract lab,
  Nek'zali, and Entombed Sentinels: both modes now share Main cast/projectile
  lifecycle, NPC class casts, effect intent/travel, pause gating, and smoother
  2D publication. Nek'zali gains reliable downtime targeting and a visible,
  one-shot Well interrupt cast; Sentinels gains a five-hit Venom Coagulation
  add before droplets, moving raid formations, a 15-second all-raid Stasis, and
  immediate resolved-mark cleanup. The 3D camera correction is covered in both
  encounters and shared world markers again wobble without moving their anchors.
- Corrected the Sentinels room and runtime: Acid/green now matches the supplied
  plan's right side, Blood/red matches its left, 100-yard boss separation stays
  inside the visible projection, the droplet assignment has an explicit
  18-second response window, compatible partners render in Learn 2D, Test mode
  reaches Stasis after recording an uncleared pair, and right-mouse facing is
  published correctly even while paused.
- Replaced the oversized boss teaser stack with a compact reusable encounter
  selector: all eight packages occupy two desktop rows and each card contains
  a square identity, concise description, and direct Learn 2D/Train 3D actions.
- Completed the Nek'zali presentation and interaction correction batch: visible
  player/NPC projectiles, reliable cast feedback, dynamic corpse cremation,
  moving NPC Essence Rend drops, an expanded Well realm, denser dodge patterns,
  unclipped feedback overlays, and a key-legend-first action presentation.

- Normalized Learn 2D movement so equal-duration up, down, left, and right
  input travels equal visible distance on square and wide encounter boards;
  3D retains its calibrated WoW-like forward, backward, and strafe speeds.
- Replaced the former provisional eight-second Essence Rend tail: after its
  two-second movement lead, the aura now ends on the third one-second puddle
  drop.
- Corrected Nek'zali Essence Rend to select one raid member at application,
  attach its timer to that character, drop exactly three pools,
  retain all three Latent Cultists under the later `CR-272` clarification, and
  avoid revealing the controlled player's reaction before selection.
- Reduced Nek'zali's central Learn 2D and Train 3D mechanic coaching to a
  compact next-event/reaction display without repeated assignment, add-count,
  action-state, or soak-group prose.
- Corrected Entombed Sentinels Learn 2D keyboard and directional-pad movement
  to fixed screen directions, kept both NPC groups inside the visible side
  areas, and made NPCs visibly gather into only their own active soaks while
  preserving facing-relative Train 3D movement.
- Fixed Nek'zali Learn 2D to project its circular yard-space onto a circular
  board, preserve the supplied raid-plan aspect ratio through a centered crop,
  and keep the default player's left/right movement visibly usable.
- Collapsed Nek'zali into one full fight in both Learn 2D and Train 3D. Its
  complete mechanics include alternating raid halves entering an isolated Well realm,
  contribute 20 Main hits, interrupt an assigned Drowned Echo cast, dodge
  orbiting/outward spirits, read seeded variable non-wipe Main disruption, and
  return after a five-second cast. Interrupt is a persisted configurable action.
- Accepted the supplied Vash'nik three-well raid plan and documented `FR-085`
  as the next planned encounter contract without beginning its runtime.
- Accepted the supplied Lost Explorers octagonal raid plan and documented
  `FR-086` as the following planned three-boss encounter without beginning its
  runtime.
- Completed Entombed Sentinels full-fight training in Learn 2D and
  Train 3D with boss separation, side marks, droplets/returning venom,
  Miasma pools, dual energy bars, Stasis matching, side swaps, and repeat cycles.
- Included active-cycle Protovenom pairing and a persisted healer-only Dispel
  binding in the single Sentinels mechanics contract.
- Added isolated, automatically discovered setup packages for all eight
  Venomous Abyss bosses; six remain clearly labelled as catalogue-only while
  Nek'zali and Entombed Sentinels expose their approved playable work.
- Added the first Nek'zali full-fight training contract in separate
  Learn 2D and Train 3D runtimes, including the circular Soulwell arena,
  pre-pull role and soak assignment, Essence Rend, Possession Barrage
  tank swaps, killable Amani waves, the two-Echo intermission, corpse burning,
  and Phase 2 Invoke hazard movement.
- Made Test, Easy, Normal, and Hard trainer assistance/failure-tolerance
  profiles over one fixed mechanics set per boss, with Test attempts recording
  mechanic mistakes without ending the run.
- Restored centered terminal drill cards with dismiss, expandable corrective
  details, retry, and setup-exit actions while retaining clickable failures.
- Added four development-only raid world markers to the Train 3D contract room
  and continuous class-colored cosmetic NPC casts toward bosses.
- Shortened central mechanic coaching to one-line prompts, added compact named
  countdown helpers, and moved contract-lab timing/specification prose into its
  closed configuration drawer.
- Fixed repeated Train 3D raid-position selection so the controlled player and
  vacated default slot keep unique render identities and the camera follows
  every newly selected position.
- Documented the Train 3D calibration boundary: exact yard-space movement,
  approximately 89.16-degree horizontal projection at 16:9, and encounter
  geometry that still requires package-specific evidence.
- Made controlled-player movement in both Learn 2D runtimes paint at display
  rate while mechanic/HUD publication stays throttled, and made the Train 3D
  Main ability cast bar progress continuously between state updates.
- Replaced the development lab's role dropdown with a clickable abstract
  20-position raid plan that preserves the 2/5/5/8 roster, derives role and
  starting position, and assigns a class-colored player silhouette/accessory.
- Returned Keys & Mouse to a compact keyboard-and-camera panel without losing
  immediate autosave, and simplified HUD settings by keeping objective/timer
  mandatory while removing raw position display.
- Pulled the four Train 3D contract-room reaction targets into a range where
  every consecutive target is reachable at 7 yd/s within six seconds, while
  extending the rendered floor into fog beyond the unchanged 90×70-yard
  playable boundary.
- Reworked setup into an automatically discovered encounter catalogue: each
  boss card now contains its Learn 2D/Train 3D scenarios and visibly marks
  planned drills Coming soon, replacing the oversized duplicate banner.
- Removed the redundant report-style Train 3D box from HUD settings and made
  draggable HUD anchors follow the pointer immediately by isolating them from
  inherited button position transitions; positions still autosave on release.

- Corrected the Season 2 runtime shell on wide screens: the status controls now
  occupy one horizontal header, build provenance remains on setup, and the 2D
  split arena preserves its 5:3 geometry instead of stretching with the window.
- Made Season 2 key changes autosave immediately and migrate one binding at a
  time, preserving W/S movement, Q/E turning, and A/D strafing defaults without
  discarding valid custom keys when the settings schema grows.
- Restored reusable in-arena feedback corners with clickable recent-failure
  guidance at bottom left and a scoring-ready, explicitly unscored points frame
  at bottom right.

- CR-245: Reuse the reviewed v0.9.1 in-arena HUD layout for Train 3D, with
  draggable runtime positions and no health bars attached to 3D actors.
- BUG-164: Make the HUD layout editor responsive with local drag updates,
  release-time persistence, a subtle alignment grid, and keyboard nudging.
- CR-246: Restore exact version/build provenance, changelog and issue links,
  and the deployed-version update prompt across the Season 2 shell.
- SPEC-019: Add a maintained v0.9.1 extraction parity audit and ticket every
  reusable platform gap before it can be lost during encounter work.
- CR-247: Restore the full-viewport arena layout with a compact runtime status
  bar and a lab-only slide-in configuration panel instead of a right sidecar.
- FR-076: Restore the shared persisted Pause binding and working pause/resume
  control in every active Learn 2D and Train 3D runtime.
- CR-243: Move role/position choice into the movement lab's pre-pull dialog,
  add its locked 3…2…1 countdown, simplify action references, and keep health
  attached only to Learn 2D actors.
- CR-244: Calibrate Train 3D to one yard per unit, 7 yd/s running/strafe and
  4.5 yd/s backward movement, capped diagonals, and a 90×70-yard lab arena.
- BUG-163: Remove apparent motion blur by making the follow camera track the
  rendered player directly without exponential translation/look-target lag.
- CR-242: Replace the controlled player's ambiguous capsule/reversed cone with
  a compact head, body, shoulders, front panel, and ground chevron aligned to
  the simulation's actual forward axis.
- BUG-162: Move Train 3D visual snapshots off the 20 Hz React HUD path, reduce
  HUD publication to 10 Hz, render at a bounded 1× pixel ratio, and expose
  renderer-local FPS and p95 frame time in the development contract room.
- BUG-161: Restore exact mouse behavior: left-drag orbits independently,
  right-button press aligns the player to the current view, right-drag turns
  both, and reliable mixed-button tracking drives both-buttons-forward.
- CR-241: Restore a persisted HUD configuration preview with draggable boxes
  and independent visibility for objective/timer, player resources, aura
  state, action state, and boss health.
- CR-240: Restore shared action vocabulary in the contract lab; its interim
  panel and mode-inappropriate actions are superseded by CR-243/FR-077.
- BUG-160: Restore the compact SPEC-002 creator business card to the Season 2
  setup header with its avatar, BattleTag, specific external links, and coffee
  action.
- CR-239: Expand the development harness into separate 2D and 3D contract
  rooms with a simulated 20-player raid and four simultaneous ground reactions
  containing one aura-matching choice and three wrong choices.
- BUG-159: Smooth display-rate Train 3D actor/effect motion between deterministic
  fixed-step snapshots, cap pixel density, and remove repeated publication;
  BUG-163 subsequently removes follow-camera lag.
- BUG-158: Make all four Learn 2D directions independently reliable and clear
  held movement after focus, visibility, or pointer cancellation.
- CR-238: Add a development-only 3D contract room with a deterministic seeded
  aura stream, six-second reaction windows, named position checks, animated
  pulse/projectile primitives, live HUD feedback, and the shared player/camera
  controls. It is a platform harness, not another encounter package.
- BUG-157: Replace the fixed tactical-camera Sentinels prototype with a generic
  snapshot-only Three.js renderer and headless 60 Hz mechanic simulation. Train
  3D now uses a third-person player-follow camera, facing-relative WASD,
  Q/E turning, left/right mouse-look, both-buttons-forward, wheel zoom,
  inversion, and persisted camera preferences.
- CR-237: Make Helical Toxins Learn 2D a movable top-down rehearsal. The player
  reaches a compatible character through abstract 2D space, and every toxin
  composition is displayed as attached green/red icons instead of character
  text.
- FR-072 (Stage 4B): Make the focused Helical Toxins scenario playable in both
  a package-owned Learn 2D decision lesson and an independently modelled Train
  3D movement drill. Add lazy runtime loaders, shared persisted movement
  bindings, configurable HUD objective/timer/position visibility and scale,
  and focused component/browser coverage without enabling another encounter.
- CR-233: Add a README-only project-lineage acknowledgement linking the
  original L’ura Trainer and source repository while keeping the deployed
  Midnight shell disconnected from the legacy site and `/v1` API.
- FR-072 (Stage 4A): Add the validated `EncounterPackageV1` contract, lazy
  automatic encounter discovery, development diagnostics, and the isolated
  non-playable Entombed Sentinels research package with shared PTR vocabulary
  and distinct Learn 2D/Train 3D arena declarations. The shell now reads its
  encounter card and runtime readiness from the discovered catalogue.
- CR-232: Wire `npm run inbox` and `npm run inbox:list` directly to the global,
  localhost-only Project Inbox skill, with captures stored in `inbox/` and
  explicitly routed into the Season 2 ticket workflow.
- CR-231: Pin the reviewed Vite 8.2.1, Vitest 4.1.10, and Playwright 1.62.1
  bootstrap toolchain through `sec-helper`, and make local Vite plugin imports
  compatible with the native configuration loader.
- CR-230: Bootstrap the standalone Midnight Season 2 product identity and
  familiar six-section shell, with separate pending Learn 2D and Train 3D
  modes, Entombed Sentinels as the sole first encounter, and the complete L'ura
  v0.9.1 application retained behind a development-only reference route.
- CR-230: Disable inherited GitHub Pages and L'ura API production deployments,
  and remediate the dependency lock through `sec-helper` without bypassing a
  blocked artifact policy.
- SPEC-018: Define shared-shell, separate-runtime, isolated encounter-package,
  automatic discovery, and deferred API `/v2` boundaries.

## Frozen L'ura v0.9.1 history

## 0.9.1 · 2026-07-31

- CR-228: Redesign copied result images to mirror the approved compact browser
  card, including its top Run-ID stamp and five phase cards, while removing the
  hostname, “Client checksum” footer, and embedded achievement list. Tracked
  from `INBOX-20260731-203647-31fd16`.
- CR-227: Keep copied result text concise and human-readable, ending with the
  Run-ID while omitting canonical JSON and the trainer URL.
- BUG-156: Compact Test previews, practice clears, and full completion results
  into one share-card-like desktop layout. Achievement unlocks remain popups
  instead of being duplicated inside the card, while the non-copyable Run-ID
  is branded near the top. Tracked from `INBOX-20260731-202036-2d506e`.

## 0.9.0 · 2026-07-31

- CR-225: Show cumulative end-of-phase scores on completion cards, copied
  summaries, generated images, and the Run-ID calculation, with each signed score
  delta explicitly labelled `Phase contribution`. Scoring and leaderboard
  comparability are unchanged.
- FR-071: Add a quiet offline browser-generated `Run-ID` to result cards and
  copied images. It checks versioned canonical result JSON with SHA-256, offers
  the exact run data in copied result text, and is stored with accepted API attempts
  when online without claiming to be an unforgeable server signature.

## 0.8.0 · 2026-07-31

- FR-070: Synchronize account-owned verified achievements and cumulative
  progress into the personal collection after login restoration and accepted
  completions, using account-scoped browser caching while retaining local-only
  records as unverified device data.
- CR-202: Retire obsolete maintainer and laptop-transfer handoff snapshots,
  consolidate their durable references into the repository instructions and
  specifications, and reconcile stale release-boundary documentation with
  v0.7.2.

## 0.7.2 · 2026-07-31

- BUG-155: Restore verified online-attempt issuance by aligning the API with
  trainer v0.7.2. Root trainer-version changes now trigger the independently
  tested API deployment, and production verification requires the public API
  health version to match. Leaderboard season `season-1` is unchanged.
- BUG-154: Keep Phase 2 moving-orb beam duty on NPCs in public play so a
  randomly selected controlled player cannot block the live run. The complete
  player-aiming and miss-wipe mechanic remains available on localhost for
  encounter validation.

## 0.7.1 · 2026-07-31

- BUG-152: Restore the public pre-tank encounter while retaining the complete
  Heaven's Lance and deterministic P4 tank-role implementation on localhost
  for user validation. Public hosts no longer expose or advance tank state,
  controls, assignments, achievements, protection ownership, cone ownership,
  or tank-based Starsplinter selection.
- CR-201: Make the focused Playwright wrapper the documented required workflow
  and give it an isolated dev-server port so another running worktree cannot
  silently supply the application under test.
- BUG-151: Stabilize the Phase 2 personal-circle/NPC-crystal browser scenario
  against the random beam-assignment mechanic so it reaches the intended
  collision assertion without changing either encounter failure rule.
- CR-199: Add a stable local focused-Playwright wrapper with named regression
  presets and a free-text fallback, using the repository-local Chromium install
  and zero retries by default.
- CR-198: Make every ordinary dropped crystal collectible after exactly one
  second during every mechanic, while retaining its six-second ground
  explosion. Only a correctly placed assigned Phase 3 protection crystal is
  committed and therefore cannot be recollected; remove the Phase 2 beam lock
  and the early silent return of wrongly picked crystals.
- BUG-150: Hold the Phase 4 NPC tank at the rendered group position throughout
  each active three-Starsplinter set, then resume its frontal route after the
  final Splinter resolves.
- FR-069: Add audited API-only exceptional achievements that do not generate
  public activity. Public rankings show a generic exceptional marker, while a
  profile reveals the achievement only to its owner or another account that
  owns the same secret. The first manually granted badge is the 10-point
  **Find a Bug** achievement.

## 0.7.0 · 2026-07-31

- BUG-148 / CR-196: Freeze each pull as verified, deliberately anonymous, or
  local-only. Signed-in players without an active character can no longer
  publish anonymous wipes by accident, and the controlled-player nameplate
  distinguishes the played name from its verified Battle.net identity.
- BUG-149: Keep a crystal dropped during the sequential Phase 2 beam grounded
  for the complete beam/orb event on every difficulty; normal recovery resumes
  in the following pull window. This shipped behavior is superseded by CR-198.
- CR-197: Require Phase 1 through Phase 4 for every new full-journey
  achievement and show compact saved progress on cumulative and multi-run
  badges. Already-earned records remain unchanged.
- FR-068: Add two persisted/shareable tank assignments. During boss-active
  Phase 1, Phase 2, and Phase 3, the tanks play the visible five-count
  Heaven's Lance burst, mitigation, Impaled, and post-impact-five swap loop;
  NPC tanks resolve it correctly while a controlled tank uses a recharging
  defensive and Taunt action under a two-strike failure rule. Suspend the loop
  through unavailable-boss transitions, support tank-plus-crystal duty and
  canonical achievements.
- CR-195: Give the configured Phase 4 tanks deterministic assignments: Tank 1
  owns the repeatable frontal add-clearing cone, Tank 2 carries the rendered
  moving protection zone, and the raid follows Tank 2. Exclude both tanks from
  Starsplinter and award a distinct achievement for completing either role.
- FR-050: Assign each Phase 2 beam set to four random non-crystal players and
  four unresolved continuously counterclockwise-orbiting orbs near the cross
  regions. NPCs intercept their predicted targets; a selected controlled
  player aims with their rendered position and wipes if that ray misses.
- FR-049: Regroup the raid on its configured Phase 2 personal circles after
  the final orb return, then launch every player into Phase 3 from their own
  rendered position without a hidden center teleport.

## 0.6.2 · 2026-07-31

- Stabilized the two release-gating opening/P2 browser assertions without changing encounter behavior.
- BUG-145: Revalidate the online session before every run and reject stale
  authenticated wipe submissions instead of silently publishing them as
  anonymous activity. A server-issued attempt remains bound to its account and
  character for wipes and completion even if the browser session expires
  during play. Align the deployed API's accepted trainer version with `0.6.2`
  while retaining leaderboard `season-1`. Deliberately signed-out Normal/Hard
  practice remains eligible for the generic anonymous wipe feed.
- CR-194: Open public identities in Recent activity as trainer player profiles
  instead of external Raider.IO character pages.

## 0.6.1 · 2026-07-31

- BUG-144: Keep the documented Phase 3 timings intact while allowing the
  terminal-wipe browser regression enough wall-clock time to complete on
  GitHub's software-rendered runner, unblocking the Pages release.
- BUG-136–BUG-143 / SPEC-016: Retain `season-1` while repairing ranking and
  achievement integrity: publish one best run per account with stable search
  ranks, use one current-season scope across boards and profiles, count actual
  direct-phase clears, restrict full-run feats correctly, bind completion to
  issued configuration with safe idempotent retry, throttle attempt issuance,
  hide guild identity in alias mode, restore local flawless Phase 1 awards,
  and store canonical/rank-one achievement points only once per account.
- FR-065 / CR-178: Add the persisted optional in-arena action strip for Main
  ability, Interrupt, Shield, Health potion, and Crystal drop, with its own
  draggable HUD anchor.
- CR-176–CR-177 / CR-183 / BUG-131: Extend live activity with accepted
  completions, default-on bottom-right messages across setup and arena screens,
  and matching recent-feed arrival animation.
- CR-179 / CR-181–CR-193 / BUG-120–BUG-121 / BUG-129 / BUG-132–BUG-135:
  Reconcile the Global podium, five-column ranking views, personal summaries,
  profiles, privacy controls, localhost fixtures, failure advice, and
  achievement navigation into one responsive online experience.
- BUG-123–BUG-125 / BUG-127–BUG-130: Correct Phase 3 landing occupancy and
  health feedback, Phase 1 Glaive lifetime, Phase 4 tank avoidance, Phase 2
  pull/crystal recovery, P3 Stars connection range, and authoritative
  Intermission positioning time.
- BUG-126: Award canonical server achievement points to eligible direct-phase
  achievements while retaining their exclusion from run leaderboards.
- BUG-134: End Normal attempts when accumulated penalties reduce the score to
  zero.
- SPEC-014: Require completed tickets to close with focused regression coverage
  and current durable documentation, record user-visible work under
  `Unreleased`, maintain SemVer at release time, and reserve leaderboard-season
  changes for explicit user approval after a ranking-impact reminder.
- SPEC-015: Reconcile the shipped trainer and API feature contracts, record
  known online correctness gaps as explicit bugs, normalize released Phase 1
  ticket statuses, and organize all remaining work into maintained milestones.

## 0.6.0 · 2026-07-30

- FR-064: Add privacy-aware public player profiles, account attempt/wipe
  counters, all four personal run-board positions, global ranking, and hidden
  rank-one achievements worth 50 points per board plus the 200-point
  four-board sweep. Keep leaderboard continuity in `season-1`.
- BUG-116: Make Intermission crystal pickup follow the player's continuous
  movement path and extend positioning to the measured 24-second legal-route
  window around the middle void.
- BUG-117/BUG-118: Label flawless clears correctly and publish anonymous
  Normal/Hard wipes without exposing player identity.
- BUG-121/BUG-122: Keep production podiums hidden when empty, populate
  localhost preview rankings, and repair stale illegal saved Phase 1 plans
  before they can spawn a player in the opening void.
- CR-168/CR-169: Make health pressure react faster while preserving a
  two-second recoverable red window, and extend Phase 1 glaives through the
  Intermission handoff without suppressing overlaps.
- CR-170–CR-175: Rework the setup hierarchy and leaderboard presentation around
  a dedicated Global Top 3 banner, compact player summaries, Global Top 10 plus
  own position and search, a simplified Achievement Hall, consistent visual
  anchors, and slightly tighter top spacing.

## 0.5.1 · 2026-07-29

- BUG-115: Decouple run-leaderboard seasons from trainer SemVer. Compatible
  releases now share the explicitly selected `season-1`, while exact historical
  version queries remain available and a fresh board requires a deliberate
  season change.

## 0.5.0 · 2026-07-29

- BUG-113: Restrict the legacy Intermission annulus check to its live beam and
  Splinter mechanics so Phase 2 and the Phase 2-to-Phase 3 handoff cannot emit
  the generic “Entered the void zone” message.
- BUG-114: Suppress player and NPC combat projectiles during the Phase
  1-to-Intermission handoff, then target centered Intermission L’ura.
- CR-165: Include each recorded wipe reason in the public activity feed.
- CR-166: Let a Phase 1 crystal carrier drop and recollect their assigned
  crystal through the normal six-second explosion countdown without treating
  the interaction itself as a failure.
- CR-167: Keep a small yellow ground glow visible beneath the controlled player
  whenever they actually carry a crystal, including Phase 2.
- CR-168: Show the front-page activity box only while it contains activity from
  the last ten minutes, leaving permanent records intact.

## 0.4.2 · 2026-07-29

- BUG-111: Restore production online-attempt issuance after the VPS retained an
  obsolete trainer-version override. The API now owns and reports its release
  compatibility version, and deployment verification rejects a mismatched
  frontend/API release.
- FR-060: Recover Pestivator's documented Normal/crystal result with one
  administrative production backfill after BUG-111 prevented attempt issuance,
  without adding a public bypass or awarding unverifiable achievements.
- CR-164: Correct the FR-060 backfill's duty from non-crystal to crystal after
  player confirmation, retaining the original score, duration, and identity.
- CR-163: Keep all five phase cards and wrapped completion details inside the
  copied result image.
- BUG-112: Store authenticated Normal/Hard wipes independently from profile
  visibility, resolve identity when reading the feed, and backfill the
  explicitly confirmed Pestivator Phase 4 wipe.
- FR-061: Add future-only first-earned achievement events to the same
  privacy-aware chronological activity feed without backfilling history.

## 0.4.1 · 2026-07-29

- CR-162: Hide an empty wipe feed and retain private-profile wipe activity
  only as “Anonymous”, without exposing a character link or mutable raid-plan
  position.

## 0.4.0 · 2026-07-29

- FR-059: Add a permanent privacy-aware public wipe feed backed by the API,
  refreshed every five seconds on the front page with timestamps and
  Raider.IO character links.
- BUG-108: Restore immediate visual confirmation on the raid-plan Save action.
- BUG-109: Keep Phase 2 player coordinates unchanged when crystal duty changes.
- BUG-110: Make NPC Starsplinters prioritize avoiding the player's dropped
  crystal and prevent one crystal impact from resolving twice.
- CR-161: Show recent release notes directly in the new-version prompt, retain
  the full changelog link, and adopt automatic SemVer/changelog release upkeep.
- FR-027 is complete; off-VPS backup replication is user-managed outside the
  project.

- CR-160: Clamp the shared P1–P3 boss pool at 3% behind visible Veil
  Protection until Phase 3 sequence two, while continuing to count damage,
  casts, and points; retain Phase 4's independent refreshed pool.
- CR-159: Remove the 200-cast result truncation and validate completed Main
  ability casts against simulated attempt duration instead.
- CR-158: Show a spinner and explicit Battle.net redirect status immediately
  after the login action is clicked.
- BUG-107: Canonicalize the localhost submission lab to `127.0.0.1` so the
  OAuth callback's loopback session cookie is included in API requests.
- BUG-106: Treat `localhost` and `127.0.0.1` as equivalent only for explicitly
  configured loopback CORS origins, fixing local verified submission requests.
- FR-058: Add the account-wide Achievement Hall of Fame with canonical
  weighted tiers, lifetime totals, highest-achievement timestamps, privacy
  filtering, local preview data, and Top 10/full/search presentations.
- CR-157: Add a Vite-development-only verified submission lab at
  `/dev/online-submit`, backed by the real attempt APIs and excluded from
  production builds.
- CR-156: Make time outside the Phase 4 protected stack visibly drain health
  and deduct ten points for every full unsafe second.
- CR-155: Polish leaderboard/profile controls, add distinct localhost
  categories, expose profile-linked practice naming and direct logout, and
  retain privacy-mode anonymous results without publishing them.
- CR-154: Simplify the rankings-only leaderboard and populate empty or
  unavailable localhost categories with 100 deterministic preview players,
  including a test position at rank 65 beneath the first ten.
- CR-153: Split setup into six one-active-section tabs, keep character choice
  and a compact current-category Top 10 in Game settings, and make Leaderboard
  a rankings-only view with four primary categories and the user's rank below
  the first ten rows.
- CR-152: Split online character/profile management from public rankings,
  explain visibility saves, leaderboard rows, filters, and search, and restyle
  the controls to match the trainer.
- CR-151: Increase L’ura's shared pre-Phase-4 health budget by 5% without
  changing encounter mechanics, phase sequencing, or Phase 4 health.
- CR-150: Replace the long setup scroll with Practice, Raid plan, and Online
  tabs; surface login and the selected character near the top, explicitly
  confirm automatic character selection saves, and clarify profile actions.
- CR-149: Remove GitHub-hosted API backup artifacts and their repository
  certificate; retain VPS-local rotation until separate storage is provided.
- FR-057: Rebalance the setup page around practice settings and present online
  standings as a compact Top 10 with a separate full leaderboard view.
- FR-027: Begin the optional highscore service with an isolated Node/SQLite
  backend, operator preparation guide, privacy-aware public leaderboard
  endpoints, migrations, backups, and VPS deployment scaffolding. Add
  Battle.net authorization-code login with one-use state, short-lived provider
  tokens, verified WoW character import and selection, opaque application
  sessions, authenticated profile lookup, and origin/CSRF-protected logout.
  Add privacy controls and complete cascading deletion, one-use
  character-bound attempts, server-side score recomputation, verified
  achievements, endpoint rate limits, and a plain-language privacy page.
  Integrate optional login, verified character/privacy management, searchable
  public leaderboards, online attempt submission, and verified achievements
  into the trainer while retaining complete offline/local play. Encrypt daily
  SQLite backup exports and archive rotating generations off the VPS.
- FR-056: Add an original favicon designed for clear recognition at
  browser-tab size.
- BUG-105: Prevent active Phase 3 memory-rune NPCs from running away when
  Stars avoidance or other positioning rules overlap their matching turn.
- CR-148: Integrate the persisted Phase 1 rune-panel orientation control into
  HUD settings instead of presenting it as a difficulty and movement option.
- BUG-104: Suppress Phase 2 carrier `Drop crystal` voice coaching on Hard
  while retaining the call in Test, Easy, and Normal.
- SPEC-011: Define the optional Battle.net-authenticated highscore and
  achievement API, including server-issued attempts, privacy and deletion,
  searchable versioned leaderboards, SQLite backups, and VPS deployment.

## 0.3.0 · 2026-07-28

- FR-030 / CR-144: Released the complete Phase 1 encounter in production:
  five assigned interrupts, two three-crystal pickup sets,
  ricocheting Heaven Glaives, the ordered TXOV+ memory sweep, rotating beams
  with reactive Soaks, a dedicated raid plan, and the Intermission handoff.
- BUG-072 / CR-103 / CR-104: Removed invisible P1/Intermission planner
  barriers, expanded P1 into a visibly collapsing outer annulus with L’ura
  moving between outside quarters, and changed Heaven Glaives to 60-second
  hazards that launch at triple speed and bounce from both arena boundaries.
- CR-105 / CR-106: Added a draggable lower-left P1 L’ura opening with a nearby
  safe-telegraph beam, split crystal pickups into two assigned trios, held NPC
  pickups until an assigned player acts, and exposed Kick plus pickup duty on
  the pull countdown.
- CR-107 / CR-108 / CR-109: Added a large red/orange/green interrupt tile,
  redirected P1 cosmetic attacks to the visible outside boss, and restored an
  evenly spaced five-direction glaive star that changes from triple speed to
  110% player speed only after its first ricochet.
- BUG-073 / FR-047: Anchored the P1 memory order and sweep to L’ura’s outward
  ray, then extended lasso-select-and-place editing to every raid plan.
- FR-048 / FR-049: Recorded the P3-entry crystal recovery/paired Soak and
  position-driven P2-to-P3 knockback refinements in the backlog.
- FR-050: Recorded the four-player P2 orb-aiming redesign: continuously
  orbiting targets near the cross marks, perfect NPC interception, no crystal
  carrier selection, and a wipe when a selected player misses their orb.
- CR-110 / CR-111 / BUG-074: Replaced P1 glaive orbs with larger flat flying
  saucers, added late-settling memory NPC motion and correct rotating-beam NPC
  movement, moved L’ura toward raid-plan tank positions 1/2, and preserved one
  continuous beam angle from the low safe telegraph into the lethal laser.
- CR-112: Replaced static P1 NPC downtime with deterministic cast-and-move
  waypoints around L’ura while preserving crystal pickups, memory alignment,
  and rotating-beam movement; tracked from the linked inbox capture.
- CR-113 / CR-114: Enlarged the spinning P1 Heaven Glaive saucers, aligned
  their collision radius, shortened lethal beams to one 45-degree sweep, and
  made the compact NPC raid follow L’ura along a tank-led arc; tracked from
  the linked inbox capture.
- BUG-075 / BUG-076: Unified P1’s configured L’ura origin across rendering,
  rune placement, memory validation, NPC movement, and rotating-beam movement.
  Wrong rune order now resolves after the visible sweep instead of silently
  passing or disagreeing with what the player saw.
- BUG-077 / CR-115: Rearmed Heaven Glaive contact after the player exits,
  exposed each disc during its direction telegraph, increased launch and
  return speeds by 1.5×, and accelerated their visible spin.
- CR-116 / CR-118: Reused the established ground-crystal and carried-crystal
  visuals in P1 while explicitly suppressing P3-style protection rings.
- CR-117: Separated the Interrupts label/count and anchored the 100×100
  red/orange/green kick tile directly beneath it.
- CR-119: Enabled vertical mouse-camera inversion by default for new users
  while preserving any existing saved preference.
- CR-120: Rendered P1’s memory verification as one 35-yard
  Starsplinter-style sweep beam.
- BUG-078: Changed lethal P1 rotating-beam collision from a single-frame ray
  sample to a swept-angle check, so a beam catching a player between frames
  reliably starts the reactive Soaks.
- CR-121 / CR-122: Kept memory NPCs chaotic until the final 1.5-second
  settling window, retained the new single 35-yard memory sweep, and moved the
  nearest rotating-beam opener from ten degrees to five degrees beside L’ura.
- BUG-079 / CR-123: Limited reactive P1 beam-hit Soaks to players who have
  collected a crystal. Non-carriers now lose points and continue, while
  carriers receive two P3-opening-style yellow circles; tracked from the
  linked inbox screenshot.
- BUG-080 / CR-124: Reworked P1 NPC movement into compact boss-relative
  roaming, moved crystal trios into readable boss-to-center lanes, anchored
  NPC beam movement to the real center ray, and standardized every rotating
  beam to one clockwise direction.
- BUG-081 / CR-126: Preserved both 60-second Heaven Glaive sets across the
  second sequence and let otherwise-free NPCs sidestep an approaching glaive;
  browser coverage verifies that the live overlap continues to advance.
- BUG-082: Kept non-carrier rotating-beam penalties from aborting the P1
  animation tick; only collected-crystal carriers enter reactive Soaks.
- CR-125 / CR-129: Extended the P1 memory sweep to a darker, slightly raised
  40-yard Starsplinter visual, clear each rune as it resolves, and keep all
  roaming NPC targets inside the playable arena.
- CR-127 / CR-128 / BUG-098: Warp L’ura directly to the Intermission center
  during the P1 handoff, and ship the reviewed P1 positions/boss marker as the maintained
  I Asgard I fallback for plans without P1 data.
- CR-130: Made the P1 memory sweep visually decisive after screenshot review:
  a 55-yard, 2.35-times wider dark Starsplinter blade with a stronger raised
  core now visibly sweeps through the rune formation.
- BUG-083: Reversed the P1 NPC center-beam crossing lane so the raid crosses
  counterclockwise during the safe telegraph and follows just ahead of the
  beam rather than running directly behind it.

## 0.2.0 — 2026-07-27

- Published the reviewed Main ability release sound as an opt-in production
  sound while leaving unfinished mechanic effects in the local soundboard.
- Added persistent achievement history, newly-earned completion celebrations,
  shareable achievement cards, five-run flawless Normal and Hard streaks, and
  cumulative 10/50/100 phase-clear milestones.
- Completed and stabilized the Phase 3 and Phase 4 encounter simulations,
  including plan-driven raid movement, crystal lights, Soaks, Stars, ordered
  runes, Dark Archangel protection, Starsplinters, Heaven & Hell movement,
  incoming adds, and the front-tank cone.
- Added the browser-local feedback inbox and maintained I Asgard I raid-plan
  loader for faster testing and guild sharing.
- Improved rendering performance and split the browser test workload for
  reliable deployment on GitHub Pages runners.
- CR-089: Keep the health bar under steady combat pressure while making critical potion/shield recovery windows occasional and short-lived.
- CR-088: Keep the Phase 3 rune partner from evading the player in every difficulty; assisted modes still approach after their reaction delay, while Hard waits in place for the player.
- Made health potion and shield permanent one-charge-per-phase actions, added
  continuously changing health with held low-health moments and three HUD
  color bands, and limited missed-recovery penalties to Hard mode.
- Split recovery achievements into using a recovery item at least once and
  completing a successful low-health response in every phase.
- Made the build identifier copyable and separated direct links to GitHub, the
  changelog, and the repository issue form.
- Added a localhost-only feedback inbox at `/inbox` that saves pasted,
  dropped, or selected screenshots together with short Markdown notes and
  stable reference IDs under `inbox/`.
- Rebuilt Phase 2 around one continuous twelve-orb roster: each beam now
  converts four existing purple orbs to yellow before those same orbs return,
  eliminating duplicate, colliding, or direction-changing orb sets.
- Stabilized the renderer-heavy P3/P4 CI shard on slower GitHub runners by
  testing the second P4 Splinter cycle directly, retaining pure-rule coverage
  for the full phase, and allowing one retry only for that heavy shard.
- Reduced per-frame Three.js allocation pressure by reusing stable transient
  ring, disc, beam-marker, Starsplinter, cone, add, and sector geometry without
  changing encounter timing, collision logic, placement, or appearance.
- Reset L’ura to a fresh 100% health pool for Phase 4 so damage dealt in
  earlier phases cannot skip the final encounter.
- End remaining Phase 3 mechanics at 0% player-dealt health and award “The
  Stars Can Wait” before Phase 4.
- Keep “The Stars Can Wait” focused on the 0% feat without revealing transition
  tactics, and visibly hold L’ura at exactly 0% during the Phase 3 damage clear.
- Add an in-arena Raidlead mute button that immediately toggles and persists
  raid-lead TTS without leaving the encounter.
- Replaced the pre-Phase-4 damage instruction beneath L’ura’s health with an
  atmospheric encounter line.
- Kept returning orbs visible in both Phase 2 sequences while making every orb
  continue counterclockwise through its normal and glowing states.
- Standardized the setup page around explicit Game settings, Keyboard
  settings, Interface, Raid planning, and phase-plan headings, with keyboard
  and mouse controls grouped beneath the Keyboard settings topic.
- Added a compact four-link setup menu for jumping to Game settings, Keyboard
  settings, HUD, or Raid planning without replacing shared raid-plan hashes.
- Restyled setup jumps as quiet inline navigation, added reduced-motion-aware
  smooth scrolling, and added a small Back to top action to each main setup
  section.
- Made the five-second opening movement boost permanent and removed its setup
  toggle and retired browser preference.
- Changed the difficulty selector to a two-by-two grid so every mode label
  remains readable without forcing adjacent Game settings cards to overlap.
- Consolidated Game settings into three desktop cards, reduced setup
  whitespace, and restored the Intermission raid-plan heading before its map.
- Moved raid-plan save, load, and sharing controls into a full-width section
  between HUD settings and the raid-planning maps.
- Prevented the creator card from overflowing its setup column and raised every
  visible card label to a minimum of 16 pixels.
- Added mode-, crystal-duty-, option-, and flawless-aware completion
  achievements, including the Superhuman Flawless full-run tier.
- Disabled background music through a feature flag while replacement ambience
  is being selected.
- Tightened Phase 4 to a 21-second Heaven & Hell cadence while retaining the
  shared 10% movement bonus and placing the last Starsplinter detonation one
  second before movement begins.
- Cleared the Phase 2 orb-return HUD at the Phase 3 boundary and aligned the
  entire final north gather plus Phase 4 knockup on one exact raid-stack point.
- Added durable component specifications and stable `SPEC` ticket handling.
- Added a fixed I Asgard I raid-plan loader so guild members can refresh the
  maintained plan without exchanging another long share link.
- Added automatic new-version detection using the deployed Git revision.
- Added the Git revision and this changelog beneath the application version.
- Restored a clearly labeled Twitch profile link alongside the Raider.IO and
  support links in Pestivator's creator card. The generic Discord application
  link was removed because it did not identify Pestivator's profile.
- Improved the creator card with larger readable typography, a stronger avatar,
  balanced spacing, and consistent external-link marks.
- Shared raid plans now replace stale locally saved assignments before the
  first render and remain active after a clean reload. The same loaded plan is
  passed into live Intermission, both Phase 2 assignments, Phase 3, and the
  shared Phase 4 roster.
- Phase 3 NPC movement, landing groups, crystal-light ownership, opening-side
  scoring, and safe-zone scoring now follow the loaded raid plan.

## 0.1.0

- Initial public movement trainer with Intermission, Phase 2, Phase 3, and
  Phase 4 practice; editable and shareable raid plans; Test through Hard
  difficulties; configurable controls and HUD; scoring; failure review; and a
  shareable completion certificate.
