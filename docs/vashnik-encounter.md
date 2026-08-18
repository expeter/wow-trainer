# Vashnik the Malignant encounter contract

Ticket: `FR-085`

Evidence: [`encounter-specs/vashnik-the-malignant-wow-trainer-spec.md`](encounter-specs/vashnik-the-malignant-wow-trainer-spec.md)

Evidence state: 2026-08-16 pre-live research; provisional values remain timing-profile data.

This is the concise iterative implementation contract. The research handoff is
evidence, not a parallel runtime specification. Vashnik has one accepted
full-fight mechanic set in Learn 2D and Train 3D. Test, Easy, Normal, and Hard
change guidance and failure tolerance only; they never select, remove, or
retime encounter mechanics.

## Encounter lesson and arena

Vashnik is a one-phase positioning encounter around a central Malignant Cavity
and three fixed fountains: Blood at the rear, Flame at the left, and Shadow at
the right when viewed from the entrance. At 100 energy, Imbibe selects the two
fountains geometrically nearest the boss. The accepted tactic rotates:

1. Flame + Shadow.
2. Shadow + Blood.
3. Blood + Flame.
4. Repeat.

The selected pair determines its Expulsions, Living Venom families, timed
Infusion stacks, and Adaptive Infection variants. The lesson is the causal
chain from boss position to fountain pair to adds and infections—not simulated
DPS or healing. Learn 2D uses an abstract plan with these same relative anchors;
Train 3D owns yard-space movement and collision. Both projections keep the
three fountain origins on the visible edge lanes and constrain movement to the
mapped tapered chamber. Train 3D renders that chamber outline, its three lanes,
fountain daises, and central cavity on neutral stone without green distance fog.

## Shared mechanic contract

### Imbibe and Infusions

- Imbibe triggers from 100 energy, never from a trainer-difficulty timer.
- It selects the two closest fountain anchors, activates both packages, adds
  one Toxic Vapor pressure stack, and applies one independently expiring
  90-second Infusion stack for each selected fountain.
- Each provisional Infusion stack adds 100% corresponding Expulsion pressure
  and 50% corresponding add health. These are attributable data values, not
  hard-coded resolution rules.
- Selecting the wrong pair is a player-owned positioning mistake. Repeated
  selection raises strategy pressure but three stacks are not an invented
  scripted wipe.

### Living Venoms and the cavity

Every selected fountain spawns its own entity-owned add family directly on its
visible Blood, Flame, or Shadow edge lane. Parallel members of one pack retain
small lane-local spacing, then move inward along that same bounded lane; they
cannot spawn, travel, die, or resolve outside the mapped chamber. Any add reaching
the cavity begins Malignant Burst and is an encounter-level failure. A living
add hardens after the provisional 60-second timeout, becoming crowd-control
immune and 50% faster; the affected-family scope remains configurable pending
live evidence.

- Flame spawns two Burning Venoms. Their deaths open independent three-second
  Caustic Surge danger windows; the second death inside an active window is a
  mistake. Their raid pulse is background pressure.
- Shadow spawns five Shrouded Venoms with an absorb equal to base health.
  Their deaths create small three-yard Umbral Ejection avoid zones near the
  death position. Congealing Bolt remains disabled until live confirmation.
- Blood spawns one crowd-control-immune Clotting Venom. Its death creates two
  controllable children, and each child creates two final children. The
  explicit lineage is 1 → 2 → 4.

The controlled player's Main action may damage the selected priority target;
reliable NPCs cover remaining assignments. No generic class rotation or
unreviewed crowd-control action is introduced by this encounter.

### Adaptive Infection

Adaptive Infection reads the active pair; it never randomly selects from all
three variants. Target counts remain configurable, initially two unique targets
per active type with no double-targeting of one actor.

| Fountain | Infection | Required response |
| --- | --- | --- |
| Flame | Exploding Infection | Take an uncontested outer lane, then remove the debuff at distance; exact falloff is represented by normalized placement quality until live data exists. |
| Shadow | Stygian Infection | Keep moving along an outer/mid-range path so repeated six-yard bursts land behind the carrier without clipping the raid. Burst cadence remains attributable profile data. |
| Blood | Siphoning Infection | Form two separate ten-yard support camps; nearby helpers advance each normalized absorb on the 1.5-second pulse, then both groups break promptly. |

NPC and player carriers use the same timed applications, attachments, movement,
removal reasons, and outcomes. Exact absorb and damage numbers are not trainer
objectives.

### Malignant Catalyst

Catalytic Bile creates a configurable number of six-yard soak circles near the
boss. Each circle succeeds with at least one occupant. Multiple occupants are
not inherently wrong; an empty circle is the failure. Reliable NPC assignments
leave a meaningful player-owned circle when the selected roster assignment
requires it.

### Plague Froth, Waves, and Tumors

- Plague Froth provisionally lasts six seconds with a 4.5-yard proximity
  radius and five configurable targets.
- On expiry, each carrier emits four arena-fixed cardinal Plague Wave lanes.
  The waves check player collision and Tumor intersection in simulation.
- Tumors spawn at deterministic seeded random positions. For this first
  contract, one Plague Wave destroys a Tumor. All Tumors must be cleared within
  the two available Froth sets.
- The alternative shield-removal-then-kill Tumor behavior and the competing
  Malignant Totem/Malignance package are not implemented until live evidence
  resolves the pre-release conflict.
- Easy/Test guidance may preview the cardinal cross and valid Tumor lines;
  reduced guidance never changes wave geometry, targets, or timing.

### Dripping Fangs

Dripping Fangs is a two-second cast that applies a 32-second tank state. The
other tank must take ownership after every cast. A second Fangs on the same
tank is a player-owned failure when the controlled player owns the swap. The
swap must preserve positioning for the intended Imbibe pair. Exact physical
vulnerability tuning is intentionally omitted.

## Accepted full-fight flow

Each projection declares its own explicit schedule while preserving this order
and causality:

1. Position Vashnik for Flame + Shadow while core Fangs, Catalyst, and Froth
   events interleave.
2. At 100 energy, activate Flame + Shadow; handle Burning and Shrouded Venoms,
   Exploding and Stygian Infections, and staggered Flame deaths.
3. Rotate toward Blood; activate Shadow + Blood; prioritize the Clotting
   lineage, handle Stygian movement and the two Siphoning camps, then break for
   Froth.
4. Rotate toward Flame; activate Blood + Flame; handle the Clotting lineage,
   staggered Burning deaths, Blood camps, and Flame run-outs concurrently.
5. Repeat the pair cycle until the configured completion condition.

Tumors overlay the normal sequence and are resolved by the next two Froth sets.
A tolerated mistake records and resolves without pausing or trapping the event
sequence.

## Projection schedules

The first implementation must declare named `learn2d` and `train3d` schedules
in encounter timing data. Both preserve the full three-pair loop, assignments,
mechanic semantics, and sourced durations above. Learn 2D may compress downtime
and widen an explicitly named movement window; Train 3D uses the sourced
durations and yard radii where confidence supports them. No global time scale
or trainer profile may mutate either schedule.

Exact energy gain, Adaptive Infection cadence, Stygian cadence, Bile count and
spawn bounds, Living Venom speeds, and encounter completion timing remain
provisional profile values. They must be named, tested, and visibly attributed
rather than disguised as live facts.

Every colored effect supplies the same intent in both projections and a concise
player-facing reaction. The persistent fountain/lane legend explains that the
three colored edge rings spawn matching adds which must die before the green
cavity. Active purple/orange spreads say to move out, the rose/green filled
circles say to stack or soak, and pale outlined Tumors say to align a cardinal
wave. Accessible labels repeat those meanings on the actual effect entities.

## Stable outcomes and metrics

Required failure reasons include wrong fountain pair, add reached cavity,
overlapping Caustic Surge, Umbral Ejection hit, infection path/placement error,
Siphoning camp underfilled or overlapped, empty Bile soak, Froth proximity or
Wave hit, uncleared Tumor, and missed tank swap. Each failure identifies whether
the controlled player, an intentionally configured bot-error drill, or the raid
owned it; reliable default bots do not create unexplained wipes.

Metrics include selected-pair correctness, pair-rotation history, add leaks,
Burning death interval, infection reaction/placement quality, Siphoning helper
coverage and clear time, Bile occupancy, Froth spacing, Tumors intersected, Wave
hits, and tank-swap latency.

## Explicit omissions and live-validation queue

- No LFR/Normal/Heroic/Mythic selector or trainer-difficulty mechanic branch.
- No exact DPS, healing, item-level scaling, class toolkit, generic grip, or
  defensive simulation.
- No mandatory Congealing Bolt or Thinned Blood behavior.
- No invented Tumor Burst timer, exact Exploding falloff, or fixed pull-relative
  Imbibe cadence.
- Recheck Tumor versus Totem behavior, target counts, Froth duration/count,
  Infection cadence, Infusion duration/scaling, Hardened Venom scope, Bile
  geometry, add speeds, and Fangs tuning against live logs before promoting the
  profile beyond pre-live status.

## Runtime acceptance

- The package is isolated under `src/encounters/vashnik/`, is auto-discovered,
  and exposes one ready full fight for each mode without a central boss switch.
- Package conformance proves references, actions, tactics, actors, arenas,
  timing provenance, and both schedules.
- Focused simulation tests cover all three pair mappings, geometric selection,
  timed Infusion expiry, add leak/death/split behavior, all infections, Bile
  occupancy, Froth/Wave/Tumor collision, tank ownership, deterministic retry,
  and non-terminal assisted-profile advancement.
- Focused browser coverage launches both modes, observes the three-pair cycle,
  verifies one player-owned infection response and one Wave/Tumor resolution,
  confirms the shared lane/circle meanings and no-fog three-fountain 3D floor,
  and confirms trainer difficulty does not change encounter state or timing.
