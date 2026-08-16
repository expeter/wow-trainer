# L'ura Trainer specifications

These contracts capture stable intent for the trainer’s main components. New
`FR`, `CR`, and `BUG` tickets should reference or amend the relevant contract.
If a request conflicts with one of these rules, clarify the intended spec
change before implementation.

## SPEC-001 · Ticket workflow

- Every new task receives a stable `FR`, `CR`, `BUG`, or `SPEC` ID.
- Record the request before implementation and mark it implemented only after
  focused automated regression coverage passes.
- Update the affected encounter contract, ticket register, milestones, and
  other durable documentation as part of the same change.
- Resolve each completed ticket in the register. Never silently abandon an
  unresolved ticket or leave verified completed work marked as open.
- Commit verified changes unless explicitly asked to leave them uncommitted.

## SPEC-002 · Creator business card

- Keep the card compact and aligned with the setup header.
- Preserve a readable avatar, BattleTag, Raider.IO, Twitch, and Buy me a coffee
  action.
- Keep every visible card label at 16 pixels or larger and prevent the card
  from extending beyond its setup column or viewport.
- Use one consistent external-link mark and avoid generic profile destinations.

## SPEC-003 · Phase 3 to Phase 4 transition

- The first post-Archangel sector relocation lasts six seconds and provides at
  least the normal doubled movement speed, independent of Hard-mode backward
  movement slowdown, so the next standard light/assignment is reachable.
- After the second Dark Archangel sector, every actor gathers on one exact
  north-stack point.
- Normal spread, side, and raid-plan positioning rules no longer apply during
  this gather.
- The player and all NPCs use that same point as the Phase 4 knockup origin.
- Phase 2-only HUD counters must never remain visible in Phase 3 or Phase 4.

## SPEC-004 · Completion achievements

- Results identify the played difficulty and whether the selected position had
  crystal duty.
- L’ura uses one shared damage pool from Phase 1 through the end of Phase 3.
  Before Phase 3 sequence two, Veil Protection clamps displayed health at 3%
  while casts, damage, and points continue accumulating. Protection ends only
  after the first Phase 3 sector relocation, allowing a qualified early clear
  to transition from a reachable position.
- Phase 4 starts with an independent refreshed health pool. Clearing during
  Phase 3 and killing early during Phase 4 award separate achievements.
- Verified Main ability telemetry is not truncated to a fixed cast count. The
  API accepts at most one completed cast per simulated encounter second.
- Flawless means zero recorded mistakes.
- Potion, shield, and main ability use are listed in the completion details;
  potion and shield are permanent phase-refilling actions rather than options.
- Phase cards present the cumulative score at the end of each phase as their
  primary value. Their smaller `Phase contribution` value is that phase's
  signed score change relative to the normal 1,000-point attempt baseline.
  Browser cards, copied summaries, generated images, and Run-ID calculation use
  the same derivation; direct-phase practice still starts at 1,000 and ends at
  its authoritative final practice score. This is presentation only and does
  not make the stored display-normalized phase values individually additive.
- Result-card honors summarize the current completion. They are distinct from
  the canonical browser/API achievement catalogue and do not automatically
  create another permanent achievement.
- The result-card `SUPERHUMAN FLAWLESS` honor requires a full sequential clear,
  zero mistakes, successful potion and shield play, Main ability use, crystal
  duty, and more than 1100 points.
- Canonical achievements use stable IDs and point tiers. Browser-local records
  retain immutable first-earned timestamps; online records are awarded only
  from accepted server attempts.
- Every result card and copied result image carries a quiet browser-generated
  `Run-ID`. It is the truncated SHA-256 checksum of versioned canonical JSON
  containing the displayed run values and remains available without the API.
  Copied result text stays human-readable and ends with the Run-ID; it does not
  embed canonical JSON or a trainer URL. The Run-ID itself is branded quietly
  near the top of the card without a separate copy action. It detects ordinary
  edits but is not an unforgeable signature because the browser contains the
  public algorithm.
- Generated result images mirror the compact browser card hierarchy and carry
  the same top Run-ID stamp. They do not include a hostname, URL, checksum
  explanation, or embedded achievement list; genuine achievement unlocks stay
  in the browser popup system.

## SPEC-005 · Background audio

- Music, encounter sounds, and raid-lead speech are independent persisted
  channels and default to off.
- Music offers the reviewed licensed tracks, preview, volume, looping, and an
  in-arena mute control.
- The live encounter-sound allowlist currently contains only Main ability
  release. Other reviewed samples remain available in the local soundboard and
  must not be re-enabled without explicit approval.
- Raid-lead assistance uses browser TTS except for the timing-critical
  prerecorded Phase 4 `Left`, `Right`, `Left`, `Move` sequence.
- Source-level feature flags may remove a channel. A disabled channel exposes
  no setup control, arena control, or playback initialization.

## SPEC-006 · Phase 4 cadence

- Phase 4 player and NPC movement uses the same global configured movement
  speed with one shared 10% phase bonus.
- Heaven & Hell resolves on a 21-second cycle.
- Three Starsplinters begin 1.1 seconds apart and each detonates after 3.5
  seconds.
- The final Starsplinter detonates exactly one second before Heaven & Hell.
- An NPC Starsplinter is lethal to the controlled player but does not wipe for
  crossing another NPC. The controlled player's own Starsplinter remains
  lethal to NPCs, preserving responsibility for the practiced mechanic.
- Every NPC remains inside the moving yellow protection zone. Active
  Starsplinter NPCs move to safe left/right/left positions within its edge,
  hold until detonation, and return to the stack before the next detonation.
- Pause/resume preserves the authoritative quarter and mechanic clock exactly;
  render timing must never infer a Phase 4 quarter transition.

## SPEC-007 · Setup-page hierarchy

- The setup shell exposes six one-active-panel tabs: Game settings,
  Keys & Mouse, HUD, Raid plan, Leaderboard, and Profile.
- Game settings contains difficulty/movement, selected assignment, permanent
  combat actions, audio, the current Global Top 3, and compact personal
  achievement/run/profile summaries.
- Keys & Mouse contains bindings, mouse inversion, keyboard turning, and
  rotation speed. HUD owns draggable placement and optional action buttons.
- HUD action buttons are an optional persisted display aid, off by default.
  When enabled, Main ability, Interrupt, Shield, Health potion, and Crystal drop
  default below the cast bar, have their own draggable HUD anchor, and invoke
  the same handlers and validity rules as their keyboard bindings.
- Raid plan begins with its full-width save/load/share controls.
- Every phase map retains its own visible heading, beginning with
  `PHASE 1 RAID PLAN`, then `INTERMISSION RAID PLAN`.
- A valid `#raidplan=` hash opens Raid plan without losing the hash or allowing
  an older browser-local plan to override it.

## SPEC-008 · Phase 3 Soak protection

- Where the active crystal roster permits it, every unfinished blue ground
  Soak has a crystal NPC positioned beside it.
- The carrier stays outside the puddle while its complete yellow light covers
  the puddle and its soaking players.
- Crystal NPCs attempt to preserve player and crystal-light separation, but
  guaranteed Soak coverage takes priority when the random layout cannot
  satisfy both.
- Crystal NPCs do not count as ground-Soak occupants. Rune-pair movement may
  temporarily override their support position during the memory game.

## SPEC-009 · Audio and raid-lead assistance

- The authoritative cue catalogue is [`audio-cues.md`](audio-cues.md).
- Direct phase entry may speak its visible `3`, `2`, `1`; seamless transitions
  use phase-specific calls without adding another countdown.
- Coaching that reveals a mechanic may be difficulty-restricted. Visual
  telegraphs and counters remain authoritative in every mode.
- Pausing freezes scheduled speech and prerecorded calls with the shared
  encounter clock. Resuming must not replay stale cues or skip the next call.

## SPEC-010 · Canonical achievements

- The browser and API share one canonical catalogue with stable IDs,
  meaningful non-repeatable badges, point tiers, and explicit availability.
- Related badges may unlock from one result. Already-earned badges never
  reappear as newly earned on a later result.
- The catalogue groups achievements into Foundations, Precision, Tools of the
  Trade, and Feats of Movement, with no more than two cards per row.
- Full-run streaks advance only from complete sequential clears. Direct phase
  practice may award that phase's flawless badge and increments only the phases
  actually cleared.
- A complete sequential clear means Phase 1, Intermission, Phase 2, Phase 3,
  and Phase 4 in order. Legacy four-phase summaries do not unlock new
  full-journey achievements. Cumulative and multi-run badges expose compact
  progress without re-awarding badges that are already earned.
- Result-card honors are presentation summaries governed by `SPEC-004`; they
  are not additional canonical achievement IDs.
- Local achievements are browser records. Only achievements derived from an
  accepted server attempt are server-verified and contribute to the online
  Achievement Hall and Global ranking.
- Restoring an authenticated session refreshes server-verified achievements
  and server-derived cumulative progress into an account-scoped browser cache.
  The personal ledger merges those records with device-local practice while
  labelling their provenance; editable local records are never uploaded or
  promoted to verified status.

## SPEC-011 · API-backed highscores and achievements

- Anonymous play remains complete and does not require login.
- The privacy-aware activity stream includes wipes, accepted full runs, and
  newly earned achievements. Initial activity establishes a silent baseline;
  only later unseen event IDs trigger the default-on, dismiss-free,
  bottom-right fading message queue across trainer screens.
- On the start shell, those same genuinely new IDs briefly animate their
  persistent Recent activity row as it arrives. This feed-row signal remains
  active when the optional bottom-right message queue is disabled.
- Posting online results requires Battle.net authentication, a verified
  selected WoW character, and a one-use server-issued attempt.
- Every pull snapshots one explicit attribution mode. A successfully issued
  attempt is `verified`; a deliberately signed-out pull is `anonymous`; a
  signed-in pull without a selected character or valid issuance is local-only.
  The mode cannot silently change during combat. The controlled-player
  nameplate shows the played raid-plan name and, only for verified pulls, the
  selected Battle.net character; incomplete signed-in identity is visibly
  labelled local and not attributed.
- The trainer revalidates the server session immediately before issuing each
  attempt. A request that presents authenticated-session metadata may never be
  silently downgraded into anonymous activity when its session has expired or
  its selected character is missing; the player receives a reconnect or
  character-selection warning instead. Anonymous wipe activity remains
  available only to requests that are explicitly signed out.
- Once issued, a one-use attempt remains bound to its original account and
  selected character until it is consumed or expires. Its secret nonce
  authorizes that run's completion and in-progress wipe attribution even if
  the browser login session expires during combat; gameplay is not paused or
  converted to anonymous play.
- The server recomputes accepted scores from validated attempt inputs; OAuth
  proves identity but never proves gameplay legitimacy by itself.
- Normal and Hard each have separate crystal and non-crystal leaderboards,
  sorted by points with duration and acceptance time as tie-breakers.
- Test and Easy completions may earn server-verified achievements but never
  enter run leaderboards or alter a player's Normal/Hard standing.
- Direct phase practice may earn server-verified phase achievements and their
  canonical Achievement Hall/global-ranking points. Only a complete sequential
  run may enter one of the four run leaderboards.
- Authenticated achievement synchronization runs after session restoration and
  each accepted completion. It restores stable achievement IDs, earliest-earned
  metadata, phase-clear totals, duty coverage, and current Normal/Hard flawless
  streaks without changing award eligibility or leaderboard scoring.
- Accepted completions include and retain the browser-generated `Run-ID` used
  by the corresponding result card. Server acceptance remains a separate,
  stronger status; storing a client checksum does not turn it into a server
  signature or alter result validation.
- The Achievement Hall is account-wide and ranks public profiles by lifetime
  canonical achievement points. It shows the highest-value achievement and
  first-earned time; retired achievements retain their points. Catalogue
  entries carry season metadata, while season-specific UI remains deferred.
- Exceptional achievements exist only in the API catalogue and require an
  audited manual grant; their IDs and unlock conditions are not shipped in the
  browser catalogue. A grant never creates a public activity event. Global and
  Hall rows expose only a generic exceptional marker, and public profiles hide
  the title/ID unless the viewer owns that same badge or is viewing their own
  profile. Each account receives the badge and its points at most once.
- Public identity is optional. Anonymous mode hides character, realm, and
  guild and excludes that account from public run and achievement rankings;
  published character, alias, realm, and guild fields are searchable.
- Guild visibility is not a separate privacy switch: character identity may
  publish the imported guild, alias identity does not expose the linked guild,
  and anonymous identity hides all identity/profile detail.
- Public trainer profiles use opaque identifiers and resolve for visitors only
  while the account publishes a character or alias. An authenticated owner may
  inspect their own profile in anonymous mode without making it public. The
  profile summarizes achievement progress, attempts, full runs, wipes, global
  position, all four board positions, and a styled Raider.IO action when a
  published character provides the required identity fields.
- The global ranking adds canonical lifetime achievement points to the best
  accepted score in each of the four current-season run divisions. It never
  includes more than one run score per account and division.
- The Leaderboard tab opens on Global and uses the same Top 10, ellipsis,
  personal-position, and public name/guild search pattern as each run board.
  Runs and Achievement Hall are peer views; the four Normal/Hard duty selectors
  exist only within Runs. Full-list controls remain deferred until paging.
- Run boards and Achievement Hall use stable rank, player, guild, result-points,
  and time/date columns on desktop, with compact responsive stacking. Dates are
  secondary text and Hard run-board selection retains its red treatment.
- Global uses the same five-column rhythm, and personal-position rows in all
  three leaderboard views align to their list columns. Missing guild data is
  shown as `—`; it is never inferred or fabricated.
- The shell's podium labels its score model as “Achievements + All Runs” and
  displays the score legibly over subdued trophy art. The player-summary row
  gives the compact Achievement card one share and gives Best runs and Online
  ranking two shares each, keeping the latter two aligned and equally useful.
- Achievement Hall rows show rank, linked public player name, optional guild,
  lifetime points, and earned date. The linked profile owns the detailed list
  of exact achievements instead of duplicating an arbitrary title per row.
- Global rows expose two server-derived credentials: a crystal glyph after any
  flawless accepted crystal-duty run, and an `H` seal after any accepted Hard
  clear. The banner uses oversized gold/silver/bronze trophy art only for its
  three podium players.
- The personal Best runs summary names all four boards and shows the signed-in
  player's position wherever one exists, plus their global position; missing
  positions remain blank.
- Reaching rank one on a current-season run board awards that board's hidden,
  server-verified 50-point crown. Holding rank one on all four boards awards
  the hidden 200-point Legendary `Four Boards, One Throne` achievement.
- Localhost uses representative Global Top 3 fixtures when its API has no
  rows. Outside localhost, an empty Global Top 3 line is omitted completely.
- A Normal/Hard wipe may appear in the activity feed as generic `Anonymous`
  without login. Such an event contains no account, character, realm, guild,
  or public-profile identifier and remains separately rate-limited.
- Results and verified achievements retain their exact trainer version/build
  so retired accomplishments can become future Feats of Strength.
- Logout and complete deletion are separate actions. Complete deletion removes
  every account-linked live record, including Blizzard identifiers, sessions,
  characters, scores, attempts, achievements, and guild cache.
- Milestone 1 uses backed-up SQLite and deploys independently to the existing
  Caddy-fronted VPS. Guild-wide tracking remains Milestone 2.

See [`api-highscores.md`](api-highscores.md) for the complete API, storage,
privacy, deployment, and acceptance contract.

## SPEC-012 · Phase 3 landing Soaks

- Either opening yellow landing pool counts as occupied by the controlled
  player or a rendered NPC; the required resolution wipes only when neither
  pool has an occupant.
- During the landing window, the controlled player's health visibly drains at
  18% per second outside both yellow pools and recovers at 4% per second while
  inside one. NPC occupancy can satisfy the raid Soak but never suppresses this
  personal positioning feedback.
- Phase 3 Stars-orb beams are local links: two orbs more than 48 yards apart
  never connect visually and never produce collision along that gap.

## SPEC-017 · Tank assignments and Heaven's Lance

This contract is implemented as a localhost-only encounter preview. Public
hosts retain the pre-tank-role encounter until the user explicitly approves
the mechanic for release. The public trainer therefore exposes no tank
assignments, Heaven's Lance HUD/action, tank achievements, or deterministic P4
tank ownership.

- A raid plan owns exactly two distinct tank assignments. Saved, shared, and
  maintained guild plans preserve those assignments; legacy plans normalize
  to the two default tank positions.
- While L'ura is available in Phase 1, Phase 2, and Phase 3, Heaven's Lance
  gains one counter every two seconds. At five, all five impacts remain on the
  active tank and apply independent, expiring Impaled stacks.
- The active tank prepares its shield before impact one. The off-tank Taunts
  only after impact five and within the two-second swap window. One failed
  responsibility costs a strike; the second is terminal for the attempt.
- NPC tanks mitigate and swap without player intervention. Encounter sections
  where L'ura is unavailable suspend the counter and resynchronize to the
  lower-risk tank while existing Impaled duration continues to elapse.
- A controlled tank's shield recharges every 20 seconds. Tank and crystal duty
  remain independent and may overlap; the combination is recorded for its
  canonical achievement and Heroic crystal interaction.
- In Phase 4 the normal Lance loop is suspended and neither configured tank
  receives Starsplinter. Tank 1 owns the repeatable frontal cone on the
  Taunt/tank-action binding. Tank 2 owns the rendered moving yellow protection
  zone and the raid follows that tank's visual position. Each controlled role
  has a distinct canonical completion achievement.

The detailed encounter, UI, recovery, and edge-case contract is maintained in
[`tank-mechanic.md`](tank-mechanic.md).

## SPEC-013 · Phase 2 center pull and crystals

- Each of the three beam sets randomly assigns four distinct non-crystal
  players. Crystal carriers are never eligible.
- Controlled-player beam duty remains a localhost encounter preview until it
  is explicitly approved. Public trainers assign all four beams to NPCs, so
  the continuous orb sequence remains playable without a random unreviewed
  player-aiming wipe.
- Phase 2 owns one roster of twelve orbs that orbit continuously
  counterclockwise. Their orbit never pauses, slows, or reverses for a beam,
  glow, or return state.
- Each set targets four unresolved orbs, choosing the orb nearest each of the
  four cross regions at the predicted beam-impact moment. Targets are near the
  markers, not locked to exact cardinal coordinates; all twelve orbs are
  resolved exactly once across the three sets.
- NPC assignees aim their beams through the predicted moving targets. If the
  controlled player is assigned, the rendered beam runs from L'ura through
  the player's current rendered position. That visual ray must intersect the
  assigned orb when the beam resolves or the attempt wipes.
- The four resolved orbs become the yellow return set while preserving their
  indices and counterclockwise motion, then glow and travel inward. They are
  not duplicated by a second overlapping orb roster.
- The five-second center pull remains weak enough through most of its duration
  for a non-carrier walking outward to hold outside the middle. Its final force
  exceeds normal walking speed.
- The transition preserves the controlled player's resolved position instead
  of teleporting everyone to the exact center.
- After the third return set resolves, every raid member regroups at their
  configured personal-circle position. The Phase 3 outward launch begins from
  each actor's rendered regroup position; it never restacks or teleports the
  raid to the center first.
- Touching another player's dropped Phase 2 crystal is recoverable like the
  Phase 1 wrong-pickup rule: drop it within five seconds for NPC recovery or
  wipe. An assigned crystal player treats a touched crystal as their own.
- A crystal deliberately dropped for the Phase 2 beam follows the global
  dropped-crystal rule. It becomes collectible after exactly one second even
  while the beam is active, so remaining on or crossing the drop can recollect
  it and cause the beam to hit the carried crystal.

## SPEC-014 · Releases, changelog, and leaderboard seasons

- Add every user-visible feature, behavior change, and bug fix to
  `CHANGELOG.md` under `Unreleased` as part of the implementing change.
- A release moves the relevant Unreleased entries into a dated version,
  updates the package and lockfile version, uses the SemVer bump implied by the
  dominant change, and publishes a matching Git tag.
- A patch release contains compatible fixes, a minor release contains
  backward-compatible features, and a major release is reserved for breaking
  changes.
- Trainer SemVer and leaderboard seasons are independent.
- Only the user may authorize a leaderboard-season change. Never infer one
  from a SemVer bump or change it automatically.
- Before releasing changes that may affect scoring, mechanic difficulty,
  achievement eligibility, server validation, or accepted-run comparability,
  explicitly warn the user and ask whether to start a new season. Without
  explicit approval, retain the current season.

## SPEC-015 · Shipped trainer and service boundary

- The released sequential encounter is Phase 1, Intermission, Phase 2, Phase
  3, then Phase 4. Every phase is also directly playable for focused practice;
  direct entry uses a countdown while sequential handoffs preserve encounter
  movement.
- Phase 1 owns the detailed contract in
  [`p1-encounter.md`](p1-encounter.md). Intermission trains boss beams,
  six-ray Starsplinters, and crystal recovery. Phase 2 trains three cross-beam,
  orb-return, pull, and personal-circle cycles. Phase 3 trains split-side
  landing Soaks, crystal protection, ground Soaks, Stars, ordered runes, Dark
  Archangel, and the north gather. Phase 4 trains four protected
  counterclockwise quarters with sequential Starsplinters, adds, and Heaven &
  Hell.
- Test, Easy, Normal, and Hard share one simulation. Test records non-blocking
  failures, assisted modes may coach, and Hard removes selected help and makes
  failures terminal. Mechanics are never weakened solely for automated tests.
- Raid plans contain twenty profiles, all phase positions, movable Phase 1 and
  Phase 3 bosses, start slots, and six crystal assignments per applicable
  phase. A valid shared hash has precedence over an explicitly loaded or
  browser-local plan; the bundled I Asgard I plan is used only when browser
  storage is empty.
- Player-facing systems include persistent inputs/camera/HUD, optional HUD
  action buttons, phase-refilling potion and shield, one-second Main ability
  casts, cosmetic class projectiles, audio channels, exact failure review,
  local achievements, and shareable completion/achievement images.
- Anonymous offline play is complete. The optional service adds Battle.net
  identity, verified characters, one-use attempts, server score validation,
  four run boards, Global ranking, Achievement Hall, public profiles, privacy,
  activity events, logout, and full deletion.
- [`api-highscores.md`](api-highscores.md) is the detailed service contract and
  [`milestones.md`](milestones.md) owns the current delivery grouping. The
  historical request ledger remains in [`README.md`](README.md).

## SPEC-016 · Ranking continuity and finite scoring

- Retain `season-1` and its accepted results while repairing ranking and
  achievement integrity. These corrections do not erase or reset legitimate
  existing runs.
- A rank-one board badge is a permanent account achievement. It is awarded
  once when first earned and its canonical achievement points are counted once,
  even if the account later loses or retakes that crown or qualifies with
  another character or trainer version.
- Global score contains one best accepted run score per account in each of the
  four current-season divisions plus the finite, account-deduplicated canonical
  achievement catalogue.
- Main ability score is finite and server-validated: accepted casts cannot
  exceed one completed cast per simulated encounter second, and accepted
  encounter duration remains bounded.

## SPEC-017 · Global dropped-crystal lifecycle

- Every ordinary player or NPC crystal dropped onto the arena becomes
  collectible after exactly one simulated second. Pickup availability never
  depends on the current phase event, difficulty, or whether another mechanic
  is resolving.
- Remaining on the drop point or crossing it after the one-second lock may
  immediately recollect the crystal. A non-carrier who touches another
  player's collectible crystal enters the existing wrong-crystal recovery
  path and must drop it before that path expires.
- An ordinary dropped crystal that remains grounded for six simulated seconds
  explodes as a wipe. Phase-specific transitions must not silently shorten,
  extend, or bypass that timer.
- The sole committed exception is an assigned Phase 3 crystal placed inside
  its valid Dark Archangel protection position during its assigned round. It
  supplies the protection bubble and cannot be recollected or expire while
  committed. A missing, early, or incorrectly positioned P3 drop remains an
  ordinary collectible crystal.

## SPEC-018 · Midnight Season 2 platform and encounter boundary

- The product identity is `midnight-season-2` with the short identifier
  `midnight-s2`. Its planned public hostname is `midnight.asgard.website`, but
  no public deployment is enabled during bootstrap.
- The reviewed L'ura v0.9.1 application is a development-only reference. It
  must not be the production entry point, contact the inherited `/v1` service
  from the Season 2 shell, or deploy over `lura.asgard.website`.
- The existing shell, navigation vocabulary, controls, HUD concepts, tactical
  planning patterns, audio boundaries, and persistence lessons are extracted
  incrementally. The repository must not be replaced with an unrelated blank
  interface and unfinished L'ura encounter work must not be imported wholesale.
- Learn 2D and Train 3D share shell-owned vocabulary and encounter content, but
  they remain separate runtimes with separate arena models. Neither runtime may
  treat the other's geometry or simulation state as authoritative.
- Each boss lives in one isolated `src/encounters/<encounter-id>/` directory
  and is exposed through `EncounterPackageV1`. Discovery is automatic from
  encounter entry modules; a central hand-maintained boss switch is forbidden.
- Ready scenarios are launched through package-owned lazy runtime loaders. The
  product shell may pass shared preferences and select a scenario, but it must
  not import a boss runtime directly or resolve boss mechanics itself.
- Movement, pause, and reusable encounter-action bindings are shell-owned, use
  Season 2 storage keys, and autosave with each change without sharing
  simulation state. Learn 2D and Train 3D movement maps are independent; pause
  and encounter-action bindings remain shared. Additive schema migrations
  preserve valid bindings field by field, and migrate the former flat movement
  map into both runtime scopes rather than resetting custom keys. The default
  movement contract is W forward, S backward, Q/E turn, and A/D strafe. Train
  3D HUD visibility, scale, and box layout are likewise shell-owned; Learn 2D
  uses diagram-native attached state instead of inheriting 3D frames.
- Learn 2D accepts its shell-owned movement map, but owns only abstract
  percentage-space movement and icon/diagram contact. Character debuffs are
  represented by attached visual icons with accessible labels, not text baked
  into actor tokens. Controlled-player transforms update directly at display
  rate while React publishes mechanic/HUD summaries less frequently; throttled
  UI state must not make movement appear stepped.
- Learn 2D directional movement is screen-relative and projection-aware. Equal
  held-input durations cover equal rendered-pixel distance up, down, left, and
  right even when a board's visual aspect ratio differs from its world-space
  dimensions. Diagonal input is normalized. This diagram profile does not
  alter Train 3D's yard-space movement calibration.
- Train 3D uses a deterministic headless fixed-step simulation for movement,
  events, collision, bots, and mechanic outcomes. A general renderer consumes
  immutable snapshots and emits input/camera commands; it never decides
  gameplay. The baseline input contract is facing-relative WASD, Q/E turning,
  left-button camera orbit, right-button facing look, both-buttons-forward,
  wheel zoom, inversion, and persisted camera preferences. Left orbit never
  changes player facing; pressing right after an orbit aligns the player to the
  current camera heading before right-drag turns both together.
- Train 3D rendering consumes the latest fixed-step state outside React's HUD
  publication cadence. Visual forward uses the same `-Z` basis as simulation
  movement, camera translation/look-target follow the rendered player directly
  without lag or apparent blur, production pixel ratio is bounded to one, and
  the development contract room reports renderer-local FPS and p95 frame time.
- Train 3D uses one yard per world unit, a sourced 7 yd/s forward/strafe
  baseline and 4.5 yd/s backwards baseline. Diagonal input is capped at 7 yd/s.
  Arena dimensions, radii, and travel distances use yards; mechanic timings use
  seconds and require encounter-specific provenance. Calibration details live
  in [`wow-movement-calibration.md`](wow-movement-calibration.md).
- Yard-space calibration does not imply pixel-identical camera projection.
  The default 58-degree vertical perspective is approximately 89.16 degrees
  horizontal at 16:9, close to WoW's documented 90-degree ceiling; viewport,
  zoom, pitch, and WoW's user-selectable FOV reduction legitimately alter the
  apparent pixels per yard without altering authoritative travel distance.
- Separate development-only Learn 2D and Train 3D contract rooms may exercise
  shared generic event vocabulary, auras, timers, role-aware actions, position
  checks, and spell primitives through their own geometry and simulation. Each
  room represents a 20-player raid with two tanks, five healers, and thirteen
  mixed melee/ranged damage players including the controlled player. Reaction
  rounds present multiple simultaneous ground objects with one aura-matching
  answer and explicit wrong answers. These rooms are not encounter packages
  and must be excluded from production builds. Every consecutive Train 3D lab
  target remains reachable at the calibrated run speed inside the six-second
  event window. The rendered room floor may extend into fog beyond the 90×70-
  yard lab, but collision stays clamped to those explicit playable bounds.
- Role and starting-position choice inside the contract room belongs only to
  that development movement lab. Its entrance exposes all 20 abstract raid-plan
  slots directly; selecting a slot transfers control to that existing raid
  member, preserving the two-tank/five-healer composition and deriving the
  locked role, start, and temporary class treatment. Real encounter packages
  receive the selected role and assignment from setup and the versioned tactic/
  raid plan.
- Learn 2D may attach compact health bars to diagram actors. Train 3D does not
  attach player or boss health bars to world objects; it uses the extracted
  configurable in-arena interface. Its defaults follow the reviewed v0.9.1
  composition: player health/status left, boss health right, mechanic/action
  display upper middle, cast bar lower middle, and optional action buttons
  beneath the cast bar. Objective and timer are mandatory training information;
  they have no visibility toggles. Raw world coordinates are not player-facing
  HUD information. Cast progress paints at display rate without increasing
  mechanic or React publication frequency.
- Running lessons use a full-viewport arena under one compact status bar. The
  bar exposes drill/phase context left, current coaching state centrally, and
  available audio, pause/resume, performance, and exit controls right. Lab-only
  diagnostics/configuration belong in a closed slide-in drawer that real
  encounter runtimes do not render. Unimplemented audio channels are visibly
  unavailable rather than interactive no-ops. At wide desktop widths those
  groups remain one horizontal row. Exact build and repository provenance stays
  on setup and does not consume the running lesson header.
- A runtime viewport preserves the aspect implied by its arena model; expanding
  the browser may extend the surrounding room treatment but must not stretch
  arena coordinates or playable bounds. The current split arena is 5:3.
- Both runtimes reserve the reviewed bottom corners for a reusable recent-
  failures log on the left and points on the right. Failure records expose a
  stable reason code and clickable corrective explanation. The points frame
  reads as unscored until a package supplies an approved scoring contract; it
  must not invent placeholder scores.
- Terminal drill outcomes freeze authoritative mechanics behind a centered,
  dismissible result card. The card states the wipe/completion reason, exposes
  expandable corrective detail, and offers Try again and Change setup. Dismissal
  restores an unobstructed arena while the same failure remains available in
  the clickable bottom-left log.
- Central mechanic coaching is a short one-line reaction instruction. Detailed
  spell and mechanic specifications belong in encounter setup or the closed
  development lab drawer. The HUD may show multiple compact named countdowns
  when concurrent upcoming events aid reaction, but must not replace them with
  paragraph-style prose.
- Train 3D snapshots may carry scheduled ambient NPC projectiles toward a boss.
  They reuse the reviewed class-specific L'ura silhouettes, actor-origin travel,
  near-centre target penetration, and brief impact vocabulary instead of a
  continuously looping generic sphere. Cadence may be calibrated per trainer,
  but these remain cosmetic life signals only: rendering never feeds them into
  collision, damage, scoring, timing validation, or outcomes. Encounter-owned
  player shots use the same visual vocabulary while their damage remains
  authoritative in the headless simulation.
- The development contract room may carry dummy raid world markers to validate
  marker silhouette, height, color, footprint, and apparent yard scale. They
  use shared snapshot/renderer vocabulary, are explicitly non-mechanical, and
  do not appear in the real Sentinels lesson unless an encounter later declares
  actual marker semantics.
- Setup presents automatically discovered packages as a compact four-column
  desktop encounter matrix. Each card contains one reusable square identity,
  title, short description, and direct Learn 2D/Train 3D actions; planned
  actions say Coming soon. The complete eight-boss catalogue fits in two rows
  when its setup panel is in view. Setup must not duplicate the selected
  encounter in a separate oversized banner or invent playable mechanics for
  catalogue-only packages.
- HUD settings show the same draggable arena-layout frame used by Train 3D,
  without a second report-style HUD summary above it. Dragging tracks the
  pointer without animated positional lag, persists once on release, and keeps
  grid snapping plus keyboard nudging.
- Keys & Mouse retains the complete autosaved binding and camera contract in a
  dense keyboard grid beside compact mouse-camera controls; individual actions
  must not expand into oversized full-width cards. Learn 2D and Train 3D own
  independent movement maps, while pause and encounter actions remain shared.
  A previously stored flat Season 2 map initializes both movement maps so an
  existing customization is not lost during migration.
- Entombed Sentinels is the first encounter package. No second boss begins
  until the package contract, automatic discovery, both runtime boundaries,
  and focused Sentinels regressions are stable.
- API `/v2`, public statistics, achievements, rankings, and production hosting
  are later milestones. The inherited L'ura `/v1` service remains frozen and
  has no deployment path from this repository.

## SPEC-019 · Reviewed-platform extraction parity

- [`legacy-feature-extraction-audit.md`](legacy-feature-extraction-audit.md) is
  the maintained parity matrix between the frozen v0.9.1 platform and Season 2.
- Every reusable capability is classified as extracted, an active ticketed
  gap, or explicitly deferred. Encounter-specific L’ura behavior is listed as
  excluded rather than silently treated as missing platform work.
- A new encounter may consume only stable shared contracts. It must not grow a
  private replacement for an active platform gap such as input, HUD, audio,
  lifecycle, tactics, build metadata, or result/failure presentation.
- The audit is reviewed before the first encounter release candidate and again
  during `CR-235` legacy retirement.

## SPEC-021 · Raid difficulty and approved encounter sequence

- Encounter difficulty and trainer difficulty are separate axes. Encounter
  packages select Heroic or Mythic rules; Easy, Normal, and Hard select only
  assistance, reaction windows, and failure tolerance.
- Never describe the default Heroic encounter contract as Normal because the
  trainer profile is named Normal.
- Nek'zali is explicitly approved as the first full-fight package alongside the
  existing focused Sentinels slice. Catalogue panels for the remaining raid
  bosses may expose planned metadata but not playable mechanics.
- Nek'zali Heroic and Mythic use separate scenario/timing declarations. Mythic
  mechanics never leak into Heroic, and withdrawn PTR testing cannot supply
  invented Mythic timing.
- The detailed encounter contract lives in
  [`nekzali-encounter.md`](nekzali-encounter.md).

`SPEC-021` is retained as decision history. Its Heroic/Mythic selection axis is
superseded by `SPEC-022`; its approved encounter sequence remains in force.

## SPEC-022 · Single encounter contract and trainer tolerance

- Every boss exposes one current encounter-mechanics contract. Learn 2D and
  Train 3D share that vocabulary and mechanic set while retaining separate
  runtimes, arena models, and projections.
- The trainer does not expose LFR, Normal-raid, Heroic, or Mythic selection.
  All mechanics explicitly accepted for an encounter belong to its one full
  fight in both modes; a trainer profile cannot add, remove, or retime them.
- Test, Easy, Normal, and Hard are trainer profiles only. Test prevents
  mechanic mistakes from ending the attempt, Easy ends only on encounter-level
  failure conditions, Normal also ends after two recorded mistakes, and Hard
  ends on the first recorded mistake. Guidance may vary, but assignments,
  event order, geometry, and timings remain identical.
- A package has one full-fight scenario per supported mode. Focused scenarios
  are optional and may be added only by an explicit accepted ticket; they are
  not generated as default catalogue placeholders.
- Timing profiles preserve evidence provenance, confidence, and revision
  history. They are implementation inputs, not player-facing raid-difficulty
  choices.
- Entombed Sentinels preserves 100-yard boss separation in world space while
  projecting Acid/green on the supplied plan's right side and Blood/red on its
  left. Both bosses remain visible inside the tactical room. Test-mode failure
  recording may not prevent the 100-energy transition into Stasis.
- This contract supersedes the raid-difficulty portions of `SPEC-021`,
  `FR-082`, `FR-083`, and `FR-084` without discarding the mechanics already
  supplied under those tickets.

## SPEC-023 · Shared encounter runtime capabilities

- The development contract rooms are the acceptance harness for platform
  capabilities, not private alternatives to the encounter runtime. A capability
  demonstrated there is complete only when Nek'zali and Entombed Sentinels can
  consume the same public contract without encounter-local reimplementation.
- Every package action declaration has a stable action ID, one shell binding
  slot, eligible player roles, supported runtime modes, and HUD eligibility.
  Package validation rejects duplicate binding slots and role references to
  unknown actions. The shell binds declarations once; keyboard dispatch,
  below-arena legends, and optional HUD buttons consume that bound registry.
- Controlled players, raid NPCs, enemies, and arena systems are composable
  entities with independent deterministic action timelines coordinated by one
  encounter clock. Keyboard, mouse, and HUD actions enqueue controlled-player
  commands into that same timeline; they do not bypass it through renderer or
  component-local mechanic paths.
- Simulation owns movement constraints, collision/contact, range, occupancy,
  positioning, target validity, and mechanic outcomes. Renderers consume the
  resulting snapshots and may never infer those outcomes from DOM or Three.js
  geometry.
- Encounter packages consume the platform Main lifecycle: begin, display-rate
  cast progress, pause/resume, completion, projectile publication, and impact.
  A package selects the valid target and authoritative damage/outcome only; it
  must not privately remove the action or reproduce the lifecycle. A mechanic
  may cancel an active cast, but the action becomes immediately restartable;
  ordinary phase/state transitions cannot strand or freeze it.
- Learn 2D and Train 3D retain separate movement, camera, arena, and projection
  models. Both consume the same actor/effect snapshots and meanings for harmful
  zones, soaks, spreads, arrows, domes, travelling projectiles, and impacts.
- Harmful and spread zones mean avoid; filled soak zones mean enter and become
  outlines when satisfied. These semantics are renderer-independent and remain
  authoritative in encounter simulation rather than DOM or Three.js collision.
- Every supported full-fight runtime exposes the package's shared action legend,
  player cast/projectile feedback, cosmetic NPC class casts, actor health, and
  encounter-owned cast/interrupt feedback. Renderers may change presentation,
  but may not filter a declared capability out of one mode. Learn 2D always
  attaches Main cast progress below the controlled actor's health presentation;
  the configurable central cast-bar anchor belongs only to Train 3D.
- Shared HUD capability means common state and action semantics, not identical
  screen geometry. Train 3D uses its configurable WoW-like frames; Learn 2D
  keeps actor-attached health, cast, aura, and mechanic visuals appropriate to
  its tactical projection. Spell and debuff state must remain visibly readable
  in both modes.
- Soak, avoid, spread, assignment, and occupancy visuals retain the existing
  shared behavior: filled shapes request player/NPC entry, satisfied shapes
  become outlines, harmful shapes remain visibly hazardous, and guidance may
  be reduced by trainer difficulty without changing the underlying mechanic.
- During mechanic downtime, NPCs use bounded, seeded ambient movement and
  class-appropriate activity so the raid remains alive. Active assignments,
  tank positioning, formation, hazards, targeting, and scheduled casts always
  override ambient behavior; tests can reproduce it from the same seed.
- Runtime pause blocks new movement and combat actions and freezes active cast
  progress. Camera look may remain available while paused, but an encounter
  snapshot may not mask the resulting player-facing update.
- The contract lab exercises these production contracts in both modes. Its 2D
  room uses the shared projectile/effect projection and its 3D dummy world
  markers use the reviewed subtle wobble without moving their world anchors.
- React state publication is limited to a display-rate summary; deterministic
  simulation and imperative player/render transforms continue at their own
  fixed or animation-frame cadence.
