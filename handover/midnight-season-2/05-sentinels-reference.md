# Entombed Sentinels reference package

Entombed Sentinels is the architecture reference because Helical Toxins tests
recognition, assignments, partner matching, movement, collision, bots, tactics,
timing and both teaching modes without first requiring a complete damage model.

## Shared encounter facts

- Two bosses must remain separated.
- Acid and Blood marks stack during active phases.
- At 100 energy the bosses enter the trainer's 15-second Vitriolic Stasis.
- Helical Toxins gives players red/green compositions; a valid pair combines
  to exactly four green and four red.
- The researched matching window is approximately 28 seconds.
- The sole full-fight contract includes side-specific droplets, returning
  lines, Miasma soaks/pools, and Protovenom partner matching. Test, Easy,
  Normal, and Hard change failure tolerance, not mechanics.

Initial timings are labelled `ptr_2026-08-13`. They may not be renamed to
“live”. A later `live_eu_week1_2026-08-19` profile is created from validated
logs and retained separately.

## Tactic schema

The reference tactic supports:

- Acid tank and Blood tank.
- Acid-side and Blood-side raid groups.
- Helical Toxin pairs and meeting sectors.
- Protovenom pairs and meeting lanes.
- Toxic Droplet ownership.
- Miasma soak groups.
- Pool/drop zones.
- Side-swap destinations and tank boss ownership.
- Controlled player and role/action selection.

The visual editor shows one split-arena overview. Built-in presets are
read-only and can be duplicated. Validation rejects duplicate exclusive tanks,
missing partners, odd pair groups, players assigned to both sides, invalid
meeting lanes, missing soak members, and positions outside the selected arena.

## Learn 2D scenarios

### Helical Toxins tutorial

1. Explain red/green toxin composition and the target total.
2. Highlight the controlled player’s composition.
3. Present fixed candidate partners and explain the valid choice.
4. Animate the selected meeting sector and warn about third-player contact.
5. Repeat with randomized compositions and tactic-defined partners.
6. Report recognition time, wrong choices, and unhandled expiry.

This mode uses abstract pair cards and meeting sectors. It does not simulate
exact collision radii or tactical coordinates.

### Side responsibilities

- Acid lesson: droplets, outgoing/returning venom lanes, and safe central
  corridor preservation.
- Blood lesson: Miasma group soak, edge drop, and pool-space conservation.
- Tank lesson: keep bosses separated, recognize swap condition, use the
  encounter action, and move to the opposite ownership anchor.

### Full-fight walkthrough

Compose active side responsibilities, Stasis/Helical matching, side swap, and
the next active cycle as a guided sequence. Protovenom is always included.
The 2D full fight remains explanatory and decision-focused.

## Train 3D arena

Provide a split world arena with:

- Acid and Blood boss zones.
- Configurable outer drop bands.
- A readable central swap corridor.
- Named partner meeting sectors and Mythic meeting lanes.
- Boss and raid spawn anchors.
- Planner bounds and camera presets.

The renderer uses general world primitives. The encounter package defines
theme colors and arena geometry; it does not construct Three.js meshes.

## Train 3D focused drills

### `sentinels_helical_toxins`

- One human plus tactic-aware bots.
- Read the debuff and meet exactly one compatible partner.
- Fail on a wrong partner, third-player collision, expiry, or leaving the
  assigned meeting sector when the tactic requires it.
- Bots wait long enough not to reveal the answer immediately, then resolve
  their configured pairs reliably.
- Metrics: recognition latency, solve time, wrong collision, path crossing,
  route deviation, expiry margin.

### `sentinels_mythic_protovenom`

- Resolve tactic-defined pairs while ordinary side traffic continues.
- Fail on wrong/unmarked contact or timer expiry.
- Metrics: pair recognition, collision count, lane adherence, resolution
  margin.

### `sentinels_side_rotation`

- Acid actors handle droplets and returning lines.
- Blood actors handle Miasma and planned pool placement.
- Tanks maintain boss separation and execute the swap action.
- Raid crosses through the preserved corridor during Stasis.
- Metrics: unhandled objects, floor consumption, boss-distance violations,
  soak participation, swap completion time.

## Train 3D full fight

Compose the focused mechanic modules under energy/state triggers. Do not copy
their rules into a separate full-fight implementation or vary them by trainer
difficulty.

The current realization uses one shared boss-health value on both frames and
ends after at most two Stasis phases. Droplets appear at four deterministic
randomized positions within roughly 20 yards of the Acid boss and every soak
launches a fast return projectile. Miasma gives the controlled Blood-side
player and three NPCs a three-second pool-drop warning; each carrier moves
outward before dropping. During Stasis, bosses move inward while the raid
spreads, toxins appear only after that arrival window, the player may choose
any compatible visible partner without an answer marker, and NPC pairs begin
resolving only after the player succeeds.

The initial full fight is explicitly provisional. It trains the planned
sequence but does not claim authoritative live DPS timings. Boss health may be
a scenario driver or configurable pacing proxy; player damage rotation is not
simulated.

## Reference acceptance

- The same package appears once in the catalogue with both modes.
- Both modes use identical ability, role, tactic and timing-profile IDs.
- Their visuals and resolution code remain independent.
- Switching modes preserves boss/tactic/role selection but starts a new
  attempt.
- Bots cannot cause an unexplained default-mode wipe.
- Both tanks can practice the swap action.
- A package-only change does not require editing another encounter or global
  event union.
- Focused and full-fight browser presets pass with zero retries.
