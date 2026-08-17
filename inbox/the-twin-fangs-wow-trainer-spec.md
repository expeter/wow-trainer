# The Twin Fangs — wow-trainer Encounter Specification

**Encounter:** The Twin Fangs\
**Bosses:** Vexhul and Ithraz\
**Raid:** The Venomous Abyss\
**Project:** `wow-trainer`\
**Specification date:** 2026-08-16\
**Data status:** Pre-release / current Patch 12.1 data. Blizzard lists The Venomous Abyss as opening during the week of 2026-08-18, so live combat-log verification is not yet available at the time of this specification.

---

## 1. Implementation Goal

The Twin Fangs should be implemented as a **two-boss resource-management and spatial-control encounter**.

The encounter's primary state is not boss damage. It is the raid's accumulated **Eternal Venom**. Most execution errors either:

1. give one or more players additional Eternal Venom;
2. force the whole raid to gain Eternal Venom;
3. consume future movement space;
4. make the next Ravenous Feast harder to use safely; or
5. destabilize the requirement to kill Vexhul and Ithraz together.

For `wow-trainer`, the most valuable model is therefore:

- persistent per-player venom stacks;
- explicit avoidable vs unavoidable venom gains;
- coordinated Caustic Globule assignments;
- three distinct Ravenous Feast soak groups;
- persistent arena hazards that affect later mechanics;
- tank-sequence execution and boss swapping;
- simultaneous movement during the Submerge intermission;
- interrupt responsibilities for the current higher-difficulty add/orb mechanics;
- independent boss health with a strong penalty when one boss dies early.

Raw raid DPS, healing throughput and exact damage tuning can be abstracted unless they change a spatial or assignment decision.

---

## 2. Source Status and Reliability

### Primary transcript strategy sources

The supplied strategy is based on two German guide transcripts:

1. **TheHuntred Guides — “Die Zwillingsfänge | GUIDE NHC/HC”**\
   https://www.youtube.com/watch?v=AJsg2u_8i-Y
2. **Magic Guides DE — “Die Zwillingsfänge - Guide - Normal/Heroisch”**\
   https://www.youtube.com/watch?v=FKUP7PJMjZI

The strategic handling in those transcripts is preserved wherever it does not conflict with current mechanical data.

### Verification sources

- **Blizzard — Curse of Ula’tek: The Venomous Abyss Raid Goes Live August 18**\
  https://news.blizzard.com/en-us/article/24294062/curse-of-ulatek-the-venomous-abyss-raid-goes-live-august-18
- **Wowhead — The Twin Fangs Raid Boss Guide / Adventure Journal data**\
  https://www.wowhead.com/guide/midnight/raids/venomous-abyss-twin-fangs-boss-strategy-abilities
- **Icy Veins — Twin Fangs Raid Guide**\
  https://www.icy-veins.com/wow/twin-fangs-raid-guide
- **Method — The Twin Fangs Heroic Guide**\
  https://www.method.gg/guides/the-venomous-abyss/the-twin-fangs-heroic
- **Wowhead spell pages** for spell IDs, cast/channel durations, aura durations, radii and periodic intervals.

### Reliability rules used in this document

- Spell IDs and spell-level timing/radius values come from current Wowhead spell data / Adventure Journal data where available.
- Encounter ordering from Method/Icy Veins is marked **guide-derived** because live logs do not yet exist.
- Video playback timestamps are not used.
- No cooldown or interval is inferred from edited footage.
- Damage numbers are intentionally omitted except where the damage model changes required gameplay.
- Higher-difficulty mechanical additions are integrated into this single encounter definition instead of being split into separate difficulty sections.

---

## 3. Transcript Name Corrections

| Transcript wording | Current English name | Notes |
|---|---|---|
| Wexul | **Vexhul** | Blizzard/current journal name |
| Itas | **Ithraz** | Blizzard/current journal name |
| Ewiges Gift | **Eternal Venom** | Core persistent stack mechanic |
| Ätzende Sündflut | **Caustic Deluge** | Vexhul tank channel |
| Ätzende Kugeln | **Caustic Globule** | Soakable globules |
| Brut rufen | **Venomous Emergence** | Summons Spawn of Vexhul |
| Korrosiver Speichel | **Corrosive Spit** | Spawn frontal line |
| Regung in der Tiefe | **Stir the Depths** | Raid pulses + venom waves |
| Unersättliches Schmausen | **Ravenous Feast** | Three split-soak strikes |
| Windendes Sekret | **Coiling Ichor** | Shrinking player circles |
| Geronnenes Blut | **Congealed Gore** | Two different spell IDs exist depending on source mechanic |
| Steinbrecher | **Stone Breaker** | Tank knockback + three sequential soaks |
| Abscheuliche Flut | **Vile Flood** | Rotating frontal torrent in intermission |
| Blutregen / Blutbeschuss | **Sanguine Storm** | Intermission ground impacts |
| Giftiger Schlick | **Noxious Slick** | Persistent Submerge hazard |

---

## 4. Encounter Model

### Boss state

Vexhul and Ithraz:

- have separate health pools;
- are effectively stationary during the main phase;
- reposition during Submerge;
- should die at approximately the same time;
- punish tanks who leave their current target out of valid range;
- reach a Submerge intermission at 100 energy.

Current Method and Icy Veins guides describe the main mechanic sequence as repeating **twice per cycle**, followed by Submerge. This ordering is useful for the simulator, but should remain data-driven so it can be corrected from live logs without rewriting mechanic code.

### Suggested core state

```text
EncounterState
  cycleIndex
  loopIndexWithinCycle
  submergeCount
  vexhulHealth
  ithrazHealth
  vexhulEnergy
  ithrazEnergy
  activeHazards[]
  activeGlobules[]
  activeAdds[]
  activeMechanic

PlayerState
  role
  position
  alive
  eternalVenomStacks
  feastGroup
  currentBossAssignment
  envenomedStacks
  stoneBreakerStacks
  feastedUntil
  coilingIchorUntil
  currentTargetMarker
  interruptAssignment
```

### Arena representation

Do not hard-code an arena diameter until live arena measurements are available.

Use a normalized arena model with configurable anchors:

- `VEXHUL_MAIN_ANCHOR`
- `ITHRAZ_MAIN_ANCHOR`
- `VEXHUL_SUBMERGE_CENTER`
- `ITHRAZ_SUBMERGE_ANCHORS[]`
- `EDGE_DROP_BAND` for Coiling Ichor
- configurable unsafe floor polygons/circles for Congealed Gore and Noxious Slick.

This allows the trainer to reproduce positioning relationships without requiring exact WoW world coordinates.

---

# Core Persistent Mechanic

## Eternal Venom — Spell ID 1290336 — permanent aura / 1s damage tick

### What happens

Many Vexhul mechanics apply **Eternal Venom**, a permanent stacking debuff. It does not naturally expire. Ravenous Feast is the encounter mechanic that consumes stacks.

Current spell data is internally inconsistent about the lethal threshold:

- the displayed Wowhead tooltip currently says the target dies at **9 applications**;
- the same spell's detailed effect data encodes **11 default / 10 Heroic / 9 Mythic**;
- the supplied transcripts describe the pre-release Normal/Heroic behavior as 11/10;
- current Icy Veins and Method Heroic strategy still describe 10 stacks as lethal.

For a unified `wow-trainer` encounter, do **not** hard-code this as an immutable global constant.

Recommended initial configuration:

```text
eternalVenomLethalStacks = 9
```

Use 9 as the strict unified profile because it matches the current top-level spell tooltip and the highest-difficulty spell-data value. Keep it configurable until live data resolves the discrepancy.

### Telegraph

- Persistent debuff icon and stack count.
- `wow-trainer` should display the stack count prominently beside the player rather than relying only on a small aura icon.
- Optional warning states:
  - safe;
  - elevated;
  - lethal-next-stack.

Do not invent fixed warning thresholds beyond `lethalStacks - 2` and `lethalStacks - 1`.

### Targeting

Any player can acquire Eternal Venom through encounter mechanics.

Important sources include:

- Caustic Deluge acid splashes;
- soaking Caustic Globules;
- unsoaked Caustic Globule rupture — raidwide;
- Venomous Emergence — raidwide/unavoidable;
- Corrosive Spit;
- Stir the Depths waves;
- Vile Flood;
- Caustic Rain/globs in the hard-enrage state;
- death while already poisoned can create additional globules in the current higher-difficulty ruleset.

### Required reaction

- Avoid all unnecessary applications.
- Assign Caustic Globules to players with sufficient stack headroom.
- Ensure every player participates in the correct Ravenous Feast group when stack removal is required.
- Preserve stack headroom for unavoidable future applications.

### Success condition

Player remains below the configured lethal threshold for the entire encounter and uses Ravenous Feast efficiently enough to survive the venom economy.

### Failure conditions

- Player reaches the configured lethal stack count.
- Player gains a stack from an avoidable wave, beam or collateral frontal.
- A low-headroom player soaks a globule that should have gone to another player.
- Raid allows a globule to rupture and gives everyone an additional stack.
- A dead poisoned player creates additional globules and causes a failure cascade.

### wow-trainer implementation notes

Eternal Venom should be a first-class state variable, not just a damage modifier.

Recommended scoring:

- **major error:** avoidable +1 Eternal Venom;
- **critical error:** raidwide +1 from expired globule;
- **fatal:** reaches lethal stack threshold;
- **positive execution:** correct Feast strike removes 1 stack;
- **resource decision:** globule soaked by a suitable low-stack player.

The DoT itself can be represented as background pressure without a full health simulator.

### Encounter relationships

`Avoidable mechanic hit → Eternal Venom +1 → less globule-soak capacity → greater dependence on Ravenous Feast → higher late-cycle failure risk`

---

# Vexhul Mechanics

## Caustic Deluge — Spell ID 1289192 — 1.0s cast / 5s channel / 0.5s channel ticks

### What happens

Vexhul channels toxin into the current target for 5 seconds. Acid splashes land nearby during the channel. Each splash:

- hits players within **4 yards**;
- applies Eternal Venom to players hit;
- creates a Caustic Globule at the impact point.

The channel also drives the tank's **Envenomed** vulnerability.

### Telegraph

- Vexhul cast bar.
- Visible channel to current tank.
- Acid impact telegraphs near the channel target.
- Newly formed green globules at impact locations.

### Targeting

- Primary target: Vexhul's current tank.
- Splash locations: around the Deluge target; exact count and distribution are not yet reliably verified.

### Required reaction

**Tank:**

- isolate from the raid during the channel;
- remain within valid boss range despite displacement/pressure;
- do not drag splash danger through the raid.

**Raid:**

- stay outside the 4-yard splash impacts;
- prepare designated players to collect the resulting globules.

### Success condition

- No non-assigned player is hit by a Deluge acid splash.
- Tank survives/maintains boss range.
- Created globules transition into controlled soak assignments.

### Failure conditions

- Player is hit by an avoidable 4-yard splash and gains Eternal Venom.
- Tank loses valid range and triggers Concentrated Spittle.
- Globules form in an unusable cluster because the raid/tank positioned badly.

### wow-trainer implementation notes

- Spawn impact circles around the active Vexhul tank during the 5-second channel.
- Randomize positions inside a configurable band around the target.
- Do **not** hard-code the number of splashes/globules until live logs confirm it.
- Impact circle collision applies +1 Eternal Venom.
- After impact, create a `CausticGlobule` entity with a 10-second expiry timer.
- Tank position should influence where the globules appear, making pre-positioning meaningful.

### Encounter relationships

`Caustic Deluge → creates Caustic Globules → possible Barbed Bulwark protection → interrupt → assigned soak before 10s`

---

## Envenomed — Spell ID 1310360 — 90s debuff

### What happens

Caustic Deluge increases that tank's future Caustic Deluge damage taken by **10% per stack** for **1.5 minutes / 90 seconds**.

### Telegraph

- Tank debuff stack indicator.

### Targeting

Vexhul's Caustic Deluge target.

### Required reaction

Tanks trade boss assignments as the tank-mechanic sets are completed rather than repeatedly taking the same serpent's mechanic.

The supplied transcript recommends swapping after Caustic Deluge and Stone Breaker have both occurred. Current guides similarly use tank alternation after Stone Breaker sets. This produces the practical rule:

**After a completed Vexhul/Ithraz tank-mechanic set, trade boss assignments.**

### Success condition

No tank accumulates an unsafe repeated Deluge sequence while the other tank remains available.

### Failure conditions

- Same tank remains assigned to Vexhul through repeated Deluge sets without intended swap.
- Swap causes one serpent to be left without a valid nearby tank.

### wow-trainer implementation notes

The trainer does not need exact tank damage. Track stacks and flag an assignment error when the wrong tank takes the next intended Deluge/Stone Breaker set.

---

## Caustic Globule — Spell ID 1289993 — 10s lifetime before rupture

### What happens

Each globule ruptures after **10 seconds** if untouched.

- If untouched: it applies Eternal Venom to **all players**.
- If contacted in time: only the contacting player receives the effect.

This converts one unavoidable raidwide stack into one controlled individual stack.

### Telegraph

- Green globule entity.
- Visible 10-second expiry ring/timer in `wow-trainer`.
- Assigned-player marker when using assignment mode.
- Additional shield visual when Barbed Bulwark is active.

### Targeting

Any player may physically collect a globule. Strategically, it should be assigned to a player with sufficient Eternal Venom headroom.

### Required reaction

- Assign one player per globule.
- Prefer low-stack players.
- Avoid accidentally touching multiple clustered globules unless explicitly safe.
- If Barbed Bulwark is present, remove it before attempting the soak.
- Finish all soaks before the 10-second rupture deadline.

### Success condition

Every globule is consumed by one appropriate player before rupture.

### Failure conditions

- Globule expires unsoaked → raidwide Eternal Venom.
- Wrong player soaks and reaches lethal/near-lethal stacks.
- One player accidentally consumes multiple globules.
- Player attempts to contact a shielded globule and is knocked away.

### wow-trainer implementation notes

Each globule should store:

```text
spawnTime
ruptureAt = spawnTime + 10s
position
assignedPlayerId?
shielded
consumed
```

Useful randomization:

- spawn positions;
- clustering;
- assignment based on current venom stacks;
- which globules are hardest to reach due to existing floor hazards.

Globule management is one of the best mechanics for adaptive trainer difficulty: later modules can intentionally give some players high venom stacks so the user must choose safer soakers rather than simply grabbing the nearest orb.

---

## Blood Torrent — Spell ID 1303230 — 1.0s cast / 5s channel / 1s ticks

### What happens

Ithraz channels blood into the current target for 5 seconds. Every second it stacks a healing absorb on that target.

In the unified higher-difficulty encounter rules, Blood Torrent also causes blood to coalesce around each existing Caustic Globule, forming **Barbed Bulwark**.

### Telegraph

- Ithraz cast bar and channel.
- Tank healing-absorb indicator if healing simulation is enabled.
- Globules gain an obvious shield/barbed state.

### Targeting

Ithraz's current tank, plus all active Caustic Globules through the secondary shield interaction.

### Required reaction

- Tank remains in valid range.
- Raid immediately recognizes shielded globules.
- Assigned interrupters remove Barbed Bulwark before the 10-second globule timer becomes critical.

### Success condition

All protected globules become interrupt-cleared early enough to be safely soaked before rupture.

### Failure conditions

- Missed Bulwark interrupt.
- Player tries to soak a protected globule.
- Shield delay causes globule rupture.

### wow-trainer implementation notes

The healing absorb itself can be background-only unless a healer mode is later implemented.

The critical trainer interaction is:

```text
Blood Torrent begins
  → each existing globule gets shielded=true
  → an interrupt action against each shield sets shielded=false
  → normal globule soak becomes possible again
```

The exact place of Blood Torrent in the complete unified encounter sequence still needs live-log verification. Do not invent a fixed timestamp.

---

## Barbed Bulwark — Spell ID 1303378 — persistent channel until interrupted

### What happens

Barbed Bulwark protects a Caustic Globule, causes Shadow damage and knocks players back while it persists. Interrupting the Bulwark destroys it.

Wowhead exposes a technical seven-day duration on the underlying channel. That is not a meaningful encounter duration and should **not** be implemented as a gameplay timer. Treat it as persistent until interrupted or until its owning globule resolves.

### Telegraph

- Distinct shield around the globule.
- Interruptible-cast icon/bar.

### Targeting

One Bulwark per protected Caustic Globule.

### Required reaction

Interrupt the Bulwark, then soak the globule normally.

### Success condition

Shield removed before the orb's rupture timer forces a failure.

### Failure conditions

- Shield not interrupted.
- Player contacts shield and is damaged/knocked away.
- Interrupt assignment collision leaves another orb unhandled.

### wow-trainer implementation notes

Implement as an interrupt objective attached to a globule, not as a separate combat NPC requiring health damage.

Randomization can vary which player is assigned to which Bulwark, while respecting interrupt range if the trainer models it.

---

## Venomous Emergence — Spell ID 1291404 — 3.0s cast

### What happens

Vexhul calls progeny from the venom sea. The cast:

- damages the raid;
- applies **one unavoidable Eternal Venom stack to all players**;
- current guides describe **three Spawn of Vexhul** appearing together near the center.

This unavoidable stack is important because it continuously reduces the raid's venom margin even with perfect dodging.

### Telegraph

- 3-second Vexhul cast bar.
- Center spawn animation / add markers.

### Targeting

Whole raid for the unavoidable Eternal Venom application.

### Required reaction

- Accept the forced stack.
- Immediately prioritize the three spawned adds.
- Spread/position so their Corrosive Spit lines can be aimed cleanly.

### Success condition

Adds die quickly and create no collateral Corrosive Spit hits.

### Failure conditions

- Adds remain alive long enough for repeated Spit pressure.
- Raid overlaps in a way that makes frontal lines difficult to isolate.
- Players spend venom headroom on avoidable mechanics before/after this forced stack.

### wow-trainer implementation notes

- Apply +1 Eternal Venom to all players at resolution.
- Spawn three adds in the center using the current guide-derived count.
- Do not make the unavoidable stack itself a scored mistake.
- Score subsequent collateral Spit hits.

### Encounter relationships

`Venomous Emergence forced +1 → less stack headroom → stronger need for clean Globule assignments and Feast participation`

---

## Corrosive Spit — Spell ID 1291478 — 5.0s cast / 2s area-trigger lifetime

### What happens

A Spawn of Vexhul focuses on a player and casts a frontal line. Players struck receive Eternal Venom.

The supplied transcripts and current strategy sources agree on the important counterplay: the focused player aims the line away from the raid and other players stay out of it.

Whether the focused player can reliably avoid their own hit should not be assumed from current text. One supplied transcript explicitly treats the focused player's hit as unavoidable. Therefore `wow-trainer` should judge this primarily as a **line-aiming / collateral-avoidance mechanic** until live testing confirms otherwise.

### Telegraph

- Add target/focus indicator.
- 5-second cast bar.
- Frontal/line preview from add toward focused player.

### Targeting

Random/focused player per Spawn of Vexhul.

### Required reaction

**Focused player:**

- take a short moment to move to a safe line;
- aim away from the raid;
- then hold a stable direction near cast completion.

**Other players:**

- leave the projected line.

### Success condition

No non-target player is hit by the line.

### Failure conditions

- Focused player sweeps the line through the raid late in the cast.
- Another player remains inside the line.
- Multiple add lines overlap because assignments are poorly separated.

### wow-trainer implementation notes

- Select random target per active add.
- Track line orientation to the target during the chosen tracking period.
- Near resolution, lock direction according to verified visual behavior once live data is available.
- Score collateral hits as avoidable Eternal Venom errors.
- Keep the focused player's own avoidability configurable pending live verification.

---

## Stir the Depths — Spell ID 1290956 — 6s channel / raid pulse every 2s / wave damage every 1s while inside

### What happens

Vexhul channels for 6 seconds:

- unavoidable raid damage pulses every 2 seconds;
- venom waves travel across the platform;
- players struck by a wave gain Eternal Venom.

### Telegraph

- 6-second channel bar.
- Visible incoming wave edges/directions from the arena boundary.

### Targeting

- Raidwide pulse: all players.
- Waves: spatial collision.

### Required reaction

Identify where waves are coming from and move through safe gaps without being clipped.

### Success condition

Player completes the channel with zero wave collisions.

### Failure conditions

- Wave hit → avoidable Eternal Venom.
- Player tunnels on adds/other mechanics and fails to notice wave direction.
- Player is forced into a wave because earlier floor hazards were placed badly.

### wow-trainer implementation notes

This should be a pure movement module:

- spawn wave lanes from configurable arena edges;
- randomize direction and gap arrangement;
- apply +1 Eternal Venom on collision;
- do not punish the unavoidable 2-second raid pulses as player errors.

Exact number, lane width, velocity and cadence of waves require live/log/video-frame verification.

---

## Concentrated Spittle — Spell ID 1295107 — instant range punishment

### What happens

If Vexhul's current target is out of valid range, Vexhul attacks that target with Concentrated Spittle.

### Telegraph

This is primarily a failure response rather than a planned mechanic.

### Targeting

Vexhul's current tank.

### Required reaction

Maintain valid tank range, including during displacement and tank swaps.

### Success condition

Concentrated Spittle never triggers during intended play.

### Failure conditions

Tank leaves Vexhul without a valid nearby target.

### wow-trainer implementation notes

Use as a tank-position guardrail. The exact minimum trigger distance is not verified; keep range threshold configurable rather than inventing a yard value.

---

# Ithraz Mechanics

## Stone Breaker — Spell ID 1288538 — 1.5s cast / 3 sequential soaks / 3.5yd impact radius / 90s vulnerability

### What happens

Ithraz roars and pushes players away, then performs repeated platform slams.

Current guides describe **three sequential soak zones**. Each successful impact:

- hits players within **3.5 yards**;
- gives those players **+33% Stone Breaker damage taken** for **90 seconds**;
- stacks.

If an impact hits **no player**, it instead damages and knocks back the entire raid with armor-ignoring damage.

The intended strategy in the supplied transcripts is for the active Ithraz tank to catch all three impacts in sequence.

### Telegraph

- 1.5-second Stone Breaker cast.
- Initial raid/tank knockback.
- Three ground soak indicators appearing in sequence.
- Vulnerability-stack icon on tank.

### Targeting

The soak positions are spatial. Current guide strategy assigns all three in a set to Ithraz's active tank.

### Required reaction

- Recover immediately from the pushback.
- Read the order in which the three zones appear.
- Enter each 3.5-yard zone before its impact.
- After the completed tank-mechanic set, perform the planned boss swap.

### Success condition

The assigned tank catches all three slams in correct sequence and the raid takes no empty-soak punishment.

### Failure conditions

- Tank misses any one of the three zones.
- Another player accidentally soaks and takes unintended vulnerability.
- Tank follows the wrong sequence.
- Tanks fail to trade boss assignments after the intended set.

### wow-trainer implementation notes

This is a high-value tank module.

Represent each set as:

```text
knockback
  → show marker A
  → show marker B
  → show marker C
  → resolve A
  → resolve B
  → resolve C
```

The exact time between markers and impacts is not currently verified; make it configurable.

Useful randomization:

- order of three candidate locations;
- distance after knockback;
- interference from existing Congealed Gore/Noxious Slick;
- which tank is currently assigned to Ithraz.

---

## Coiling Ichor — Spell ID 1290809 — 3.0s cast / 12s player effect / 1s damage ticks

### What happens

Ithraz infuses several players with a shrinking area around them for **12 seconds**.

- The effect deals increasing damage as its radius shrinks.
- Other players standing in the affected area are also hit.
- When the effect expires, it creates a **Congealed Gore** pool.

Current spell data exposes a default maximum of **3 targets**, but target scaling should remain configurable until live raid-size behavior is confirmed.

### Telegraph

- 3-second Ithraz cast.
- Debuff icon on selected players.
- Large circle around each target that visibly shrinks over 12 seconds.

### Targeting

Several players; current spell data lists up to 3 default targets.

### Required reaction

- Marked players move to the outer edge/drop band.
- Separate from the raid and from other marked players.
- Place the resulting pools compactly to preserve central and intermission movement space.
- As circles shrink, marked players may move closer together if visually safe, matching the transcript/current guide space-saving strategy.

### Success condition

- No circle overlaps another player.
- Every resulting pool is placed in the assigned edge region.
- Main routes for Vile Flood and other mechanics remain open.

### Failure conditions

- Player damages/overlaps another player.
- Pool is dropped through the middle or on a planned tank/Feast position.
- Pools are spaced inefficiently and consume excessive arena space.

### wow-trainer implementation notes

- Duration is fixed at 12 seconds.
- Circle radius should animate from a configurable initial radius to a configurable final radius.
- **Do not use the current tooltip's displayed 0-yard value** as a real mechanic radius; it is not a useful spatial value.
- On expiry, instantiate Congealed Gore spell 1292505.
- Score placement quality based on distance from configured `EDGE_DROP_BAND` and overlap with reserved movement corridors.

### Encounter relationships

`Coiling Ichor placement → 2-minute Congealed Gore → reduced future movement space → harder waves / Feast knockbacks / Vile Flood intermission`

---

## Congealed Gore — Spell ID 1292505 — 2 min ground hazard / 1s tick / 50% slow

### What happens

The pool produced by Coiling Ichor persists for **2 minutes**, damages players inside every second and reduces movement speed by **50%**.

Some guides call these pools “permanent,” but current spell data specifies two minutes. `wow-trainer` should use the spell-data value while keeping the duration configurable for live verification.

### Telegraph

Persistent blood/gore pool.

### Targeting

Ground area at the Coiling Ichor target's expiry position.

### Required reaction

Avoid entering the pool and place new pools compactly along the outer arena.

### Success condition

No player path intersects the pool during critical movement.

### Failure conditions

- Standing in the pool.
- Slow causes a subsequent Vile Flood/wave/soak failure.
- Poor placement blocks a critical route.

### wow-trainer implementation notes

This pool should persist across mechanic transitions and therefore be part of the encounter's arena-state memory.

---

## Ravenous Feast — Spell ID 1290516 — 4.25s cast / 3.5s sequence / 3 strikes / 14yd split-soak radius

### What happens

Ithraz attempts to consume players **three times in quick succession**.

Each strike:

- splits Physical damage among players within **14 yards**;
- consumes **1 Eternal Venom stack** from every player struck;
- applies **Feasted**;
- knocks struck players away.

In the unified encounter rules, each player should participate in **only one** of the three strikes because Feasted both prevents further stack consumption and makes a repeated strike extremely dangerous.

This is the central recovery mechanic for Eternal Venom.

### Telegraph

- 4.25-second Ravenous Feast cast.
- Large 14-yard soak zone.
- Three clearly separated impact/strike indicators.
- Pre-assigned group marker: Group 1 / Group 2 / Group 3.

### Targeting

Any player standing within the 14-yard soak area when a strike resolves.

### Required reaction

Pre-assign the raid into three groups.

- **Strike 1:** Group 1 enters, others stay out.
- **Strike 2:** Group 1 leaves; Group 2 enters.
- **Strike 3:** Group 2 leaves; Group 3 enters.

Each group must also account for the knockback direction and avoid being launched into existing floor hazards.

### Success condition

- Each strike has sufficient intended soakers.
- No player soaks twice.
- Every intended player removes one Eternal Venom stack.
- Knockbacks end in safe positions.
- Follow-up Tainted Blood objectives are handled when active.

### Failure conditions

- Wrong group enters a strike.
- Previous group remains inside for a second strike.
- Player with Feasted is struck again.
- Strike has too few intended soakers.
- Knockback sends players into Congealed Gore/Noxious Slick/off-arena danger.
- A player who needs venom removal misses their assigned strike.

### wow-trainer implementation notes

This mechanic should not be reduced to “stand in red circle.” It is primarily a **group sequencing exercise**.

Recommended data model:

```text
feastStrikeIndex = 1..3
player.feastGroup = 1..3
onStrike(player):
  if insideSoak:
    if player.feastedUntil > now:
      criticalFailure()
    else:
      eternalVenomStacks = max(0, stacks - 1)
      feastedUntil = now + 8s
      applyKnockback()
```

Do not invent the exact interval between the three strikes; derive it from live logs later. The total underlying spell duration is currently 3.5 seconds.

Useful randomization:

- group assignment;
- knockback orientation;
- existing hazard layout;
- starting venom distribution so different players have different urgency.

### Encounter relationships

`Accumulated Eternal Venom → Ravenous Feast → -1 stack per valid player → Feasted 8s prevents repeat soak`

`Ravenous Feast knockback → player trajectory → Tainted Blood follow-up / floor-hazard risk`

---

## Feasted — Spell ID 1310096 — 8s debuff / +800% Ravenous Feast damage taken

### What happens

For 8 seconds after a valid Feast hit, the player:

- takes **800% increased Ravenous Feast damage** under the current Heroic/higher spell rule;
- cannot have additional Eternal Venom consumed by Ravenous Feast.

### Telegraph

Large, prominent 8-second debuff indicator.

### Targeting

Every player struck by Ravenous Feast.

### Required reaction

Exit the Feast soak immediately after the assigned strike and do not re-enter for another strike.

### Success condition

No player with Feasted is struck again.

### Failure conditions

Repeated Feast soak while Feasted.

### wow-trainer implementation notes

Treat a repeated hit as a critical/fatal mechanic failure. The key training lesson is group rotation, not exact damage calculation.

---

## Tainted Blood — Spell ID 1310099 — up to 8s fount / 5yd interaction radius

### What happens

The current higher-difficulty Ravenous Feast rule creates several **Tainted Blood** founts for up to **8 seconds**.

Each fount interacts with healing received by players within **5 yards**. If a fount is not fully absorbed before expiry, it triggers Tainted Burst.

Current Icy Veins strategy describes each Feast soak as creating Tainted Blood and recommends using the Feast knockback to travel toward the new fount, then immediately clearing it.

### Telegraph

- Blood fount ground object.
- 8-second expiry timer.
- 5-yard interaction ring.
- Optional “absorption remaining” progress indicator in `wow-trainer`.

### Targeting

Spawned as a follow-up to Ravenous Feast groups.

### Required reaction

- Aim Feast knockback toward the relevant fount.
- Enter the fount's 5-yard area promptly.
- Complete the fount-clearing objective before the 8-second timer expires.

### Success condition

Every fount is fully absorbed/cleared before expiry.

### Failure conditions

- Group knockback travels away from the fount.
- Players are delayed by existing floor hazards.
- Fount remains uncleared at 8 seconds.

### wow-trainer implementation notes

A full WoW healing engine is unnecessary for the core trainer. Use one of two modes:

**Position-training mode:**

- correct players must enter/stay within 5 yards;
- while sufficient assigned players are present, a configurable progress meter drains;
- fount resolves when progress reaches zero.

**Advanced healer mode:**

- simulate healing pulses received by players inside the fount;
- apply those pulses against a fount absorption pool.

The exact absorption/tick presentation in current spell data is PTR-like and should be live-verified before implementing healer-accurate values.

---

## Tainted Burst — Spell ID 1310105 — instant on failed Tainted Blood expiry

### What happens

If a Tainted Blood fount expires before being fully absorbed, it detonates for raidwide Shadow damage.

### Telegraph

Failure countdown reaches zero while fount remains active.

### Targeting

Whole raid.

### Required reaction

Prevent it by clearing every fount within the 8-second window.

### Success condition

Tainted Burst never occurs.

### Failure conditions

Any unresolved Tainted Blood fount expires.

### wow-trainer implementation notes

Treat as a critical mechanic failure rather than simulating exact raid damage.

---

## Rouse the Brood — Spell ID 1308356 — 3.0s cast

### What happens

Ithraz calls several Broodlings of Ithraz to the surface and releases raidwide damage.

The important player-facing responsibility is that each Broodling casts **Visceral Burst**, which must be interrupted.

### Telegraph

- 3-second Ithraz cast.
- Broodling spawn markers near boss/add anchors.
- Interrupt assignment labels.

### Targeting

Several add spawn locations. Exact count and positions need live verification.

### Required reaction

Pre-assign interrupters to expected spawn areas and immediately stop Visceral Burst casts.

### Success condition

Every Broodling is interrupted before Visceral Burst completes.

### Failure conditions

- Unassigned Broodling.
- Duplicate interrupts on one Broodling while another cast completes.
- Player is out of interrupt range due to earlier positioning.

### wow-trainer implementation notes

This is ideal as an interrupt coordination mini-module:

- spawn N adds at configurable points;
- assign one interrupter per add;
- require an interrupt action within the Visceral Burst cast window;
- interrupted add retreats/despawns.

Do not invent N until live data confirms the count.

The exact point at which Rouse the Brood occurs inside the full unified rotation is not yet reliable enough to hard-code.

---

## Visceral Burst — Spell ID 1308385 — 2.5s cast / 6s stacking DoT if completed

### What happens

A Broodling convulses for 2.5 seconds. If the cast completes:

- it deals raidwide Shadow damage;
- applies additional damage every second for **6 seconds**;
- the effect stacks.

If interrupted, the Broodling retreats.

### Telegraph

2.5-second interruptible cast bar on each Broodling.

### Targeting

Whole raid on successful cast completion.

### Required reaction

Assigned player interrupts their Broodling.

### Success condition

100% interrupt success.

### Failure conditions

Any Visceral Burst completes.

### wow-trainer implementation notes

A successful cast should be scored as a major/critical raid error. Exact damage need not be simulated.

---

## Clotted Bolt — Spell ID 1295115 — instant range punishment

### What happens

If Ithraz's current target is out of valid range, Ithraz attacks the target with Clotted Bolt.

### Telegraph

Failure response rather than scheduled mechanic.

### Targeting

Ithraz's current tank.

### Required reaction

Keep a valid tank in range, especially during swaps and after Stone Breaker knockback.

### Success condition

Clotted Bolt never triggers during correct execution.

### Failure conditions

Ithraz is left without a valid nearby tank target.

### wow-trainer implementation notes

Use as an immediate tank-position/assignment failure. Exact minimum trigger distance is unverified.

---

# Intermission / Joint Mechanics

## Submerge — Spell ID 1308556 — instant / 6yd venom impact radius

### What happens

At **100 energy**, both serpents submerge and reposition.

Submerge itself showers nearby areas with venom impacts. Each impact:

- hits players within **6 yards**;
- creates a Noxious Slick.

Current Method/Icy Veins strategy describes Submerge after the **second Ravenous Feast / two main-sequence repetitions** per cycle.

### Telegraph

- Boss energy reaches 100.
- Bosses disappear/submerge.
- Venom impact circles appear on the ground.

### Targeting

Ground impacts around the arena. Exact spawn pattern is not yet verified.

### Required reaction

- Stop treating boss positions as safe anchors.
- Move out of every 6-yard impact.
- Preserve open lanes for the immediately following Vile Flood + Sanguine Storm movement sequence.

### Success condition

No player is hit by a Submerge impact or forced into newly created Noxious Slick.

### Failure conditions

- Standing in a 6-yard impact.
- Poor movement creates a bad starting position for Vile Flood.
- Existing edge hazards leave no viable route because earlier placement was inefficient.

### wow-trainer implementation notes

- Trigger when configured energy reaches 100 or when the guide-derived sequence reaches the intermission node.
- Spawn random impact positions with 6-yard collision areas.
- Each impact creates a persistent Noxious Slick.
- Then reposition Vexhul to center and Ithraz to one of the configured opposite/side anchors.

Do not infer exact energy gain per second until live logs exist.

---

## Noxious Slick — Spell ID 1309471 — persistent ground hazard / 1s tick / +30% damage taken

### What happens

Noxious Slick damages players standing inside every second and increases all damage taken by **30%**.

Current spell data has no meaningful expiry duration, so it should be treated as persistent for encounter-space management unless live data proves otherwise.

### Telegraph

Persistent poison ground patch.

### Targeting

Ground position created by Submerge impacts.

### Required reaction

Avoid and path around it.

### Success condition

Players do not enter the slick during later movement.

### Failure conditions

Standing in a slick, especially while handling Vile Flood/Sanguine Storm.

### wow-trainer implementation notes

Persist across cycles. Noxious Slick is important because it makes later intermissions progressively less forgiving even without simulating its actual damage.

---

## Vile Flood — Spell ID 1294293 — 4.0s cast / 14s channel / 0.5s damage ticks

### What happens

After resurfacing in the center, Vexhul casts and then channels a continuous frontal torrent for **14 seconds**. Players caught in it receive repeated damage and Eternal Venom.

Current strategy sources describe rotating/orbiting orbs around Vexhul that indicate the sweep direction. Method's current strategy is to move **against the indicated rotation**, cross the beam early, and use the already-swept side as safe space. The guide also states that the sweep does not complete a full circle.

Icy Veins additionally states the beam starts on Vexhul's tank, which can be used to pre-separate raid and tank movement.

### Telegraph

- 4-second cast bar.
- Orbiting/rotating venom orbs showing clockwise/counter-clockwise direction.
- Wide frontal beam/torrent from Vexhul.

### Targeting

Spatial frontal originating from center Vexhul. Current guide strategy indicates initial orientation toward Vexhul's tank.

### Required reaction

- Read rotation direction before the beam begins.
- Move against the sweep and cross early where safe.
- Continue into already-cleared space.
- Simultaneously dodge Sanguine Storm impacts.

### Success condition

Player completes the 14-second channel with zero Vile Flood contact while maintaining safe movement through Storm impacts and existing floor hazards.

### Failure conditions

- Player misreads clockwise/counter-clockwise telegraph.
- Player runs with the beam and gets trapped.
- Beam contact gives rapid Eternal Venom applications.
- Player dodges Storm into the beam or into a persistent pool.

### wow-trainer implementation notes

This should be one of the flagship movement modules.

Randomization:

- clockwise vs counter-clockwise;
- initial tank/beam orientation;
- starting player quadrant;
- existing floor-hazard layout;
- Sanguine Storm impact positions.

Do not invent exact angular speed or total sweep angle. Implement them as configurable parameters and calibrate from live logs/video once available.

### Encounter relationships

`Submerge floor impacts → Noxious Slick layout → Vile Flood movement route`

`Vile Flood sweep + Sanguine Storm impacts → simultaneous directional movement + local dodging`

---

## Sanguine Storm — Spell ID 1306872 — 18s channel / 4yd impact radius

### What happens

While Vexhul performs Vile Flood, Ithraz showers the platform with gore for **18 seconds**. Each ground impact hits players within **4 yards**.

In the unified ruleset, each impact also leaves a short-lived Congealed Gore pool using spell ID 1306922.

### Telegraph

- 18-second Ithraz channel.
- Repeated red/blood ground impact circles.
- Short-lived slow pools after impacts.

### Targeting

Ground impact locations across the platform. Exact target-selection logic and cadence need live verification.

### Required reaction

Continue moving correctly around Vile Flood while sidestepping each local impact.

### Success condition

No Storm impact and no short-lived Congealed Gore pool is touched while maintaining correct Vile Flood pathing.

### Failure conditions

- Impact collision.
- Entering a slow pool and then being caught by Vile Flood.
- Dodging a local impact in the wrong global direction relative to the beam.

### wow-trainer implementation notes

Spawn impact circles during the 18-second channel using configurable cadence. Favor positions around predicted player paths only if later logs/visuals confirm player-targeted behavior; until then use bounded arena randomization.

The trainer should teach **global path planning plus local micro-dodges**.

---

## Congealed Gore — Spell ID 1306922 — 6s ground hazard / 1s tick / 50% slow

### What happens

The Sanguine Storm version of Congealed Gore persists for **6 seconds** and slows players inside by **50%**.

This is a separate spell ID from the 2-minute pool produced by Coiling Ichor.

### Telegraph

Short-lived gore pool at a recent Sanguine Storm impact.

### Targeting

Ground area.

### Required reaction

Avoid entering it while maintaining beam movement.

### Success condition

No slow application.

### Failure conditions

Slow contributes to a follow-up Vile Flood hit.

### wow-trainer implementation notes

Model as a six-second temporary obstacle. Current Icy Veins text says 60% slow in one place, but current spell data says **50%**; use 50% for now.

---

# Encounter-Wide Mechanics

## Toxic Fumes — Spell ID 1295049 — permanent background aura / 2s raid tick

### What happens

The Twin Fangs deal unavoidable raidwide Nature damage every **2 seconds** throughout the encounter.

### Telegraph

No meaningful player telegraph required beyond ambient encounter pressure.

### Targeting

Whole raid.

### Required reaction

Healer throughput in the real encounter; no movement reaction.

### Success condition

Not a player-execution mechanic by itself.

### Failure conditions

None worth scoring in the base spatial trainer.

### wow-trainer implementation notes

Treat as background pressure. A healer-specific mode may render a pulsing raid-health load, but the normal simulator should not spend complexity reproducing it.

---

## Uncoiled Wrath — Spell ID 1308583 — instant activation / +30% damage every 4s, stacking

### What happens

When either Vexhul or Ithraz dies, the surviving serpent gains **30% increased damage every 4 seconds**, stacking.

This makes boss-health balance a full-encounter requirement.

The supplied second transcript says 10% per stack, and Method currently says 25%, but current Wowhead spell data says **30% every 4 seconds**. Use the current spell value while flagging it for live confirmation.

### Telegraph

- Independent Vexhul/Ithraz health bars.
- Health-difference warning in `wow-trainer`.
- Enrage indicator when one dies.

### Targeting

Surviving boss self-buff.

### Required reaction

Keep both health pools close throughout the encounter and coordinate the final kill.

### Success condition

Both bosses die close enough together that Uncoiled Wrath does not become a meaningful survival problem.

### Failure conditions

- One boss dies substantially before the other.
- Player focuses only one boss and creates an unrecoverable health gap.

### wow-trainer implementation notes

Do not invent a maximum acceptable percentage or number of seconds between deaths.

For a simplified trainer:

- show both health bars;
- provide a configurable soft warning when their difference exceeds a scenario-defined tolerance;
- trigger Uncoiled Wrath when one reaches zero;
- escalate a generic danger meter +30% every 4 seconds;
- consider the encounter failed if the second boss is not finished before a configurable terminal threshold.

---

## Caustic Rain — Spell ID 1308841 — instant hard-enrage state / raid tick every 3s / 4yd glob impacts

### What happens

Current Method strategy describes the **third Submerge** as the hard-enrage point. At that point the bosses move center and Vexhul uses Caustic Rain.

Current Caustic Rain spell data shows:

- continuous raidwide Nature damage every **3 seconds**;
- several caustic globs released;
- each glob hits players within **4 yards**;
- each hit applies Eternal Venom;
- each glob then forms a Caustic Globule.

Because the raid has not yet opened at the date of this specification, the exact “third Submerge” sequencing should be considered guide-derived rather than live-log verified.

### Telegraph

- Hard-enrage state indicator.
- Repeated caustic ground impacts/globs.
- rapidly accumulating globules.

### Targeting

Whole raid for periodic damage plus spatial 4-yard glob impacts.

### Required reaction

The intended encounter strategy is to kill both bosses before this state becomes relevant.

### Success condition

Bosses die before Caustic Rain hard enrage.

### Failure conditions

Third-Submerge/enrage state begins with significant boss health remaining.

### wow-trainer implementation notes

For the initial full encounter, treat Caustic Rain as a terminal or near-terminal enrage state rather than building a long survival simulation around it.

Once live data is available, it can become a playable desperation phase if useful.

---

# 5. Encounter Relationships

These relationships are more important for `wow-trainer` than isolated spell descriptions.

### Venom economy

```text
Avoidable hit
  → Eternal Venom +1
  → less stack headroom
  → fewer safe Caustic Globule soakers
  → greater pressure on Ravenous Feast
  → increased late-cycle death risk
```

### Globule chain

```text
Caustic Deluge
  → acid impacts
  → Caustic Globules
  → Blood Torrent may apply Barbed Bulwark
  → interrupt Bulwark
  → assign low-stack player
  → soak before 10s
```

### Raidwide globule failure cascade

```text
Globule left unsoaked
  → entire raid gains Eternal Venom
  → more players near lethal threshold
  → future globules harder to assign
  → Feast becomes mandatory for more players
```

### Death cascade

```text
Player dies with Eternal Venom
  → additional Caustic Globules in unified higher-difficulty rules
  → more interrupt/soak burden
  → possible raidwide ruptures
```

### Add handling

```text
Venomous Emergence
  → unavoidable raidwide Eternal Venom
  → 3 Spawn of Vexhul
  → Corrosive Spit target lines
  → targeted players aim away
  → raid avoids collateral stacks
```

### Tank relationship

```text
Caustic Deluge
  → Envenomed 90s vulnerability

Stone Breaker
  → 3 sequential tank soaks
  → +33% Stone Breaker vulnerability per hit for 90s

Completed tank-mechanic set
  → tanks trade boss assignments
```

### Space-management relationship

```text
Coiling Ichor placement
  → 2-minute Congealed Gore
  → reduced usable arena

Submerge impacts
  → persistent Noxious Slick
  → further reduced usable arena

Reduced arena
  → harder Stir the Depths / Feast knockbacks / Vile Flood + Sanguine Storm
```

### Feast relationship

```text
Ravenous Feast strike
  → split soak
  → -1 Eternal Venom
  → Feasted for 8s
  → knockback
  → Tainted Blood follow-up
  → move/land toward fount
  → clear within 8s
```

### Intermission relationship

```text
100 Energy / after second loop
  → Submerge
  → venom impacts + Noxious Slick
  → bosses reposition
  → Vexhul center: Vile Flood
  + Ithraz: Sanguine Storm
  → navigate both simultaneously
  → bosses return to main sequence
```

### Boss-health relationship

```text
Uneven damage
  → one serpent dies first
  → Uncoiled Wrath on survivor
  → +30% damage every 4s
  → rapidly escalating wipe risk
```

---

# 6. Logical Encounter Flow

The following flow preserves the supplied transcript strategy and uses the current Method/Icy Veins sequence where externally supported. It intentionally contains **no inferred wall-clock timestamps**.

```text
PULL
  ↓
Keep Vexhul + Ithraz health balanced
Tanks hold one serpent each
Raid loosely spread
  ↓
MAIN LOOP A
  ↓
Caustic Deluge
  → tank isolates
  → acid splashes create Caustic Globules
  → assigned players prepare globule soaks
  → if Barbed Bulwark is active: interrupt shields first
  ↓
Stone Breaker
  → raid/tank knockback
  → Ithraz tank soaks marker 1
  → marker 2
  → marker 3
  ↓
Tank assignment trade after completed tank-mechanic set
  ↓
Venomous Emergence
  → whole raid +1 Eternal Venom
  → 3 Spawn of Vexhul
  → aim/dodge Corrosive Spit
  → kill adds
  ↓
Coiling Ichor
  → marked players move to edge
  → compact 2-minute Congealed Gore placement
  ↓
Stir the Depths
  → dodge venom waves
  ↓
Ravenous Feast
  → Group 1 soaks strike 1
  → Group 2 soaks strike 2
  → Group 3 soaks strike 3
  → each valid player loses 1 Eternal Venom
  → Feasted prevents repeat soak
  → handle Tainted Blood follow-up when active
  ↓
MAIN LOOP B
  ↓
Repeat the main sequence
  ↓
Second Ravenous Feast completes / bosses reach 100 Energy
  ↓
SUBMERGE
  → dodge 6yd venom impacts
  → Noxious Slick remains
  → bosses reposition
  ↓
INTERMISSION COMBO
  → Vexhul: Vile Flood
       read orb rotation
       move against/cross sweep early
  + Ithraz: Sanguine Storm
       dodge repeated 4yd impacts
       avoid 6s slow pools
  ↓
Bosses return / reposition
  ↓
NEXT CYCLE
  → repeat with more Eternal Venom
  → more floor hazards
  → less movement space
  ↓
CURRENT GUIDE-DERIVED HARD ENRAGE
  → third Submerge
  → Caustic Rain
  → pull rapidly becomes unsustainable
  ↓
SUCCESS: both bosses die together before enrage
```

### Placement of Blood Torrent and Rouse the Brood

Their mechanical behavior is current and verified, but their exact slots inside the full combined rotation are not yet reliable enough to assign without live logs. `wow-trainer` should therefore:

1. implement them as reusable mechanics now;
2. support injecting them into the main sequence from encounter data;
3. set their final ordering only after live-log/PTR sequence verification.

This avoids inventing a chronology that the current source material does not support.

---

# 7. Full-Encounter Success and Failure Model

## Encounter success

The full simulation succeeds when:

- all required mechanic checks are executed;
- no player reaches the configured lethal Eternal Venom threshold;
- critical globules do not rupture raidwide;
- Feast groups rotate correctly;
- required interrupts succeed;
- arena remains navigable through the required cycles;
- both boss health bars reach zero in a controlled near-simultaneous finish;
- the kill occurs before the configured hard-enrage state becomes terminal.

## Recommended critical failures

The trainer may end the run immediately for:

- lethal Eternal Venom stack threshold;
- missed Stone Breaker soak causing raidwide punishment;
- unhandled Tainted Blood causing Tainted Burst if configured as lethal;
- repeated Ravenous Feast hit while Feasted if configured as lethal;
- catastrophic Vile Flood contact resulting in lethal venom accumulation;
- unrecoverable boss-health split / one boss dead far ahead of the other;
- Caustic Rain hard-enrage terminal state.

## Recommended non-terminal scored failures

- avoidable Eternal Venom gained;
- wrong globule soaker;
- collateral Corrosive Spit hit;
- Coiling Ichor overlap;
- poor pool placement;
- Sanguine Storm hit;
- wave hit;
- unnecessary entry into Congealed Gore/Noxious Slick;
- late/messy interrupt that still succeeds;
- wrong tank swap timing that is corrected before a range punishment.

---

# 8. Recommended Training Modules

Ranked by practical value for learning the fight.

## 1. Vile Flood + Sanguine Storm intermission

**Why first:** highest-value combined movement challenge and the place where prior floor placement matters most.

Train:

- reading clockwise/counter-clockwise orb telegraph;
- moving against the beam;
- crossing early;
- dodging local Storm circles without losing global beam path;
- navigating around existing Noxious Slick / Congealed Gore.

Randomize:

- rotation direction;
- starting orientation;
- initial player position;
- Storm impact positions;
- existing hazard map.

## 2. Ravenous Feast — three-group rotation + Feasted + knockback

**Why:** only venom removal; repeated-soak mistake is extremely punishing.

Train:

- Group 1/2/3 sequencing;
- entering and leaving the 14-yard soak;
- knockback positioning;
- current venom-stack awareness;
- Tainted Blood follow-up.

Randomize:

- player's assigned group;
- knockback direction;
- starting venom stacks;
- hazard layout after the soak.

## 3. Caustic Globule economy + Barbed Bulwark interrupts

**Why:** converts raidwide venom into controlled personal venom and tests assignment under time pressure.

Train:

- evaluate who has stack headroom;
- interrupt shielded globules;
- one player per orb;
- complete before 10 seconds.

Randomize:

- globule positions;
- stack distributions;
- shield state;
- interrupt assignments;
- existing hazards.

## 4. Stone Breaker tank sequence + swap

**Why:** clear tank-specific execution with an immediate raidwide failure state.

Train:

- recover from knockback;
- memorize/read three-zone order;
- soak all three 3.5-yard impacts;
- swap boss assignment afterward.

Randomize:

- marker order;
- marker distances;
- tank starting position;
- hazard obstruction.

## 5. Venomous Emergence + Corrosive Spit line control

**Why:** common source of unnecessary venom and add pressure.

Train:

- recognize focus target;
- aim away;
- avoid other players' lines;
- maintain awareness with multiple adds.

Randomize:

- focused player;
- add positions;
- simultaneous line angles.

## 6. Coiling Ichor edge placement

**Why:** low mechanical complexity individually but directly determines future arena quality.

Train:

- separation;
- compact edge drops;
- shrinking-radius awareness;
- route preservation.

Randomize marked targets and existing pools.

## 7. Stir the Depths wave dodge

**Why:** simple but every mistake permanently consumes venom budget.

Train wave recognition and safe-gap pathing.

Randomize wave origin/direction/gaps.

## 8. Rouse the Brood interrupt assignments

**Why:** simple individual action with large raid consequence; best as coordination drill.

Train one-interrupter-per-add discipline and avoid duplicate interrupts.

## 9. Boss-health balancing overlay

**Why:** not an isolated movement mechanic, but important in complete runs.

Train target swapping based on independent health bars while other mechanics continue.

---

# 9. Full Encounter Simulation

The eventual complete `wow-trainer` encounter should combine the following persistent systems rather than resetting after each module:

### Persistent venom state

- Eternal Venom stacks carry across every main loop and intermission.
- Feast removes only one stack per valid player per sequence under the unified Feasted rule.
- Forced Venomous Emergence stacks make later cycles intrinsically more dangerous.

### Persistent floor state

- Coiling Ichor → 2-minute Congealed Gore.
- Submerge → persistent Noxious Slick.
- Sanguine Storm → temporary 6-second Congealed Gore.
- Later mechanics must path around earlier placement errors.

### Persistent boss state

- separate Vexhul/Ithraz health;
- boss energy / cycle count;
- tank assignment;
- Envenomed and Stone Breaker vulnerabilities;
- Submerge count;
- Uncoiled Wrath if one boss dies early.

### Add/interrupt state

- Spawn of Vexhul with Corrosive Spit;
- Broodlings of Ithraz with Visceral Burst;
- Barbed Bulwark interrupt objectives on globules.

### Recommended player-facing UI

Always visible:

- player's Eternal Venom stack count;
- configured lethal threshold;
- Feast group;
- current tank/boss assignment where relevant;
- independent boss health bars;
- boss energy/cycle progress if the trainer exposes it;
- current assigned interrupt/soak target.

Temporary:

- Feasted 8-second timer;
- Coiling Ichor 12-second timer;
- globule 10-second rupture timers;
- Tainted Blood 8-second timers;
- tank vulnerability stacks.

### Suggested encounter randomization

Safe to randomize without changing the intended strategy:

- Caustic Globule positions;
- which valid low-stack player is assigned to each globule;
- Corrosive Spit focus targets;
- Coiling Ichor targets;
- Stone Breaker marker order;
- Stir the Depths wave direction/gaps;
- Rouse the Brood spawn assignments once count is verified;
- Vile Flood clockwise/counter-clockwise direction;
- Sanguine Storm impact locations;
- Submerge impact locations;
- starting venom distribution in isolated training modes;
- player Feast group in repeated practice;
- existing floor-hazard layouts in advanced modules.

Do **not** randomize the strategic relationship between mechanics merely for variety. The trainer should teach the real encounter logic, not arbitrary patterns.

---

# 10. Background Mechanics

These matter in the real raid but do not need detailed simulation in the base `wow-trainer` encounter.

### Toxic Fumes throughput

Unavoidable raid damage every 2 seconds. Represent as ambient pressure or omit from non-healer modules.

### Raw Caustic Deluge tank damage

The important training element is position + Envenomed/swap behavior, not reproducing tank health exactly.

### Raw Blood Torrent healing absorb

The important unified mechanic is that it shields Caustic Globules with Barbed Bulwark. A healer mode can later simulate the actual absorb.

### Envenomed and Stone Breaker numerical damage scaling

Track stacks to drive assignment/swap correctness. Full armor/damage formulas are unnecessary.

### Base melee damage and threat

Only model enough to require one valid tank per serpent and to trigger range punishments when that invariant is broken.

### Raidwide damage from Venomous Emergence / Rouse the Brood / failed Visceral Burst

Use success/failure severity rather than exact health unless building a healer-specific module.

### Exact boss DPS requirements

Health balancing matters; class rotation/DPS simulation does not.

---

# 11. Open / Unverified Details

These should remain explicit configuration points or TODOs.

1. **Live data availability**\
   Blizzard lists the raid opening during the week of August 18, 2026. This spec is dated August 16, so final live logs/hotfixes are not yet available.

2. **Eternal Venom lethal threshold**\
   Current Wowhead presentation conflicts with its own spell-effect detail and with current Heroic strategy guides. Implement as a configurable threshold. Initial strict unified profile: 9.

3. **Exact Caustic Deluge globule count and splash pattern**\
   The 4-yard splash radius and 10-second globule expiry are verified; count and placement algorithm are not.

4. **Exact Caustic Deluge displacement behavior**\
   Current Icy Veins describes tank pushback; spell data confirms the channel but does not expose all movement behavior. Verify visually/live.

5. **Corrosive Spit focused-player avoidability**\
   Current text confirms a focused target and frontal line. One supplied transcript treats the focused player's own hit as unavoidable. Score collateral hits now; verify whether the focus target can avoid their own line before enforcing it.

6. **Coiling Ichor exact radius curve**\
   12-second duration and shrinking behavior are verified; the current tooltip's 0-yard radius is not usable. Need initial/final radius from live visual/log data.

7. **Coiling Ichor target scaling**\
   Spell data shows max 3 default targets. Confirm raid-size/difficulty behavior live.

8. **Congealed Gore persistence wording**\
   Current spell 1292505 says 2 minutes while some guides call it permanent. Use 2 minutes until live confirmation.

9. **Stone Breaker impact timing**\
   Three-zone sequence and 3.5-yard radius are supported; exact interval between appearance/resolution of each zone is not verified.

10. **Ravenous Feast inter-strike timing**\
    4.25-second cast, 3.5-second underlying sequence, three quick strikes and 14-yard soak are known. Exact strike timestamps should come from logs.

11. **Tainted Blood exact healing-absorption behavior**\
    8-second lifetime and 5-yard radius are known. The exact tick/absorption behavior in current spell data appears PTR-shaped. Position-training mode should abstract the healing engine until live verification.

12. **Blood Torrent placement in full rotation**\
    Mechanical effect is verified; exact encounter slot relative to the standard six-ability loop needs live data.

13. **Rouse the Brood exact count, spawn points and rotation slot**\
    “Several” adds and 2.5-second Visceral Burst are known. Count/positions/order need verification.

14. **Stir the Depths wave geometry**\
    6-second channel and damage intervals are known. Wave count, width, speed, gap pattern and exact origins need visual/log calibration.

15. **Submerge energy rate / wall-clock timing**\
    100-energy trigger is known. Do not infer seconds per cycle from edited video.

16. **Submerge impact count/pattern**\
    6-yard radius is verified. Spawn count and targeting algorithm need live confirmation.

17. **Vile Flood angular speed and total sweep angle**\
    4-second cast and 14-second channel are verified. Current Method says it does not complete a full circle. Calibrate actual sweep from live footage/log sync.

18. **Vile Flood exact starting orientation**\
    Icy Veins currently says it begins on Vexhul's tank. Verify live before using this as a mandatory invariant rather than a strategy hint.

19. **Sanguine Storm impact cadence/selection logic**\
    18-second channel, 4-yard impact radius and 6-second follow-up pool are verified; exact spawn cadence is not.

20. **Sanguine Storm slow discrepancy**\
    Current spell ID 1306922 says 50%; one Icy Veins line says 60%. Use spell-data 50%.

21. **Uncoiled Wrath discrepancy**\
    Current spell data: +30% every 4 seconds. Supplied transcript: +10% per stack. Current Method text: +25%. Use 30% pending live confirmation.

22. **Range-punishment minimum distance**\
    Concentrated Spittle and Clotted Bolt are confirmed as out-of-range punishments, but no useful minimum-yard threshold is exposed in current spell text.

23. **Exact complete unified rotation with higher-difficulty additions**\
    The six-ability main loop and two-repetitions-before-Submerge flow are current guide-derived. Blood Torrent/Rouse the Brood insertion points need live-log confirmation.

24. **Third-Submerge hard enrage**\
    Current Method says the third Submerge triggers Caustic Rain. Spell ID 1308841 exists and its behavior is verified, but the encounter sequencing is not yet live-log verified.

25. **Any hotfixes between this spec and raid release**\
    Re-check Adventure Journal and spell data immediately after the raid becomes available.

---

# 12. Recommended Implementation Order

For fastest usable `wow-trainer` value:

```text
1. Arena + player movement + hazard collision
2. Eternal Venom persistent stack state
3. Caustic Globules + 10s rupture + assignment logic
4. Ravenous Feast 3-group sequence + Feasted
5. Coiling Ichor + persistent floor placement
6. Stir the Depths waves
7. Vile Flood rotation + Sanguine Storm overlap
8. Stone Breaker tank module + boss swaps
9. Venomous Emergence + Corrosive Spit adds
10. Submerge + Noxious Slick persistence
11. Barbed Bulwark / Blood Torrent interrupt chain
12. Rouse the Brood / Visceral Burst interrupts
13. Tainted Blood follow-up
14. Independent boss health + Uncoiled Wrath
15. Complete cycle state machine + hard enrage
16. Live-log calibration pass after raid release
```

---

# 13. Spell Reference

| Spell | Spell ID | Relevant timing / numerical mechanic | Trainer relevance |
|---|---:|---|---|
| Eternal Venom | **1290336** | Permanent; damage tick every 1s; lethal threshold source-conflicted (9 top-level / 11 default / 10 Heroic / 9 Mythic in spell detail) | **Core state** |
| Caustic Deluge | **1289192** | 1s cast; 5s channel; ticks every 0.5s; acid splash **4yd** | **Core** |
| Caustic Globule | **1289993** | Ruptures after **10s** | **Core** |
| Envenomed | **1310360** | **90s**; +10% Deluge damage taken per stack | Tank swap state |
| Venomous Emergence | **1291404** | **3s cast** | Core unavoidable venom + adds |
| Corrosive Spit | **1291478** | **5s cast**; area trigger 2s | Core line control |
| Stir the Depths | **1290956** | **6s channel**; raid pulse every **2s**; wave damage every **1s** while struck | Core movement |
| Blood Torrent | **1303230** | **1s cast + 5s channel**; 1s ticks | Globule-shield dependency |
| Barbed Bulwark | **1303378** | Persists until interrupt in encounter terms | Interrupt before orb soak |
| Rouse the Brood | **1308356** | **3s cast** | Interrupt-add setup |
| Visceral Burst | **1308385** | **2.5s cast**; failed cast adds **6s**, 1s-tick stacking DoT | Critical interrupt |
| Ravenous Feast | **1290516** | **4.25s cast**; 3.5s underlying sequence; **3 strikes**; **14yd** split soak | **Core venom removal** |
| Feasted | **1310096** | **8s**; +800% Feast damage taken; prevents further venom consumption | **Core soak-group lockout** |
| Tainted Blood | **1310099** | Up to **8s**; **5yd** radius | Post-Feast follow-up |
| Tainted Burst | **1310105** | Instant on failed fount expiry | Critical failure |
| Coiling Ichor | **1290809** | **3s cast**; **12s** player effect; 1s ticks; default max targets 3 | **Core space management** |
| Congealed Gore (Ichor) | **1292505** | **2 min**; 1s ticks; **50% slow** | Persistent arena hazard |
| Stone Breaker | **1288538** | **1.5s cast**; 3 sequential soaks; **3.5yd** radius; +33% per hit for **90s** | **Core tank module** |
| Submerge | **1308556** | Instant at 100 energy; impact **6yd** | Intermission transition |
| Noxious Slick | **1309471** | Persistent; 1s tick; **+30% damage taken** | Persistent arena hazard |
| Vile Flood | **1294293** | **4s cast + 14s channel**; 0.5s ticks | **Core intermission movement** |
| Sanguine Storm | **1306872** | **18s channel**; impacts **4yd** | **Core intermission overlap** |
| Congealed Gore (Storm) | **1306922** | **6s**; 1s ticks; **50% slow** | Temporary movement hazard |
| Toxic Fumes | **1295049** | Raid damage every **2s** | Background |
| Uncoiled Wrath | **1308583** | +**30% damage every 4s**, stacking | Health-balance fail pressure |
| Concentrated Spittle | **1295107** | Instant out-of-range punishment | Tank guardrail |
| Clotted Bolt | **1295115** | Instant out-of-range punishment | Tank guardrail |
| Caustic Rain | **1308841** | Instant state; raid damage every **3s**; glob impacts **4yd**; creates Globules | Hard enrage |

---

# 14. Source Links for Spell Verification

- Eternal Venom — https://www.wowhead.com/spell=1290336/eternal-venom
- Caustic Deluge — https://www.wowhead.com/spell=1289192/caustic-deluge
- Caustic Globule — https://www.wowhead.com/spell=1289993/caustic-globule
- Envenomed — https://www.wowhead.com/spell=1310360/envenomed
- Venomous Emergence — https://www.wowhead.com/spell=1291404/venomous-emergence
- Corrosive Spit — https://www.wowhead.com/spell=1291478/corrosive-spit
- Stir the Depths — https://www.wowhead.com/spell=1290956/stir-the-depths
- Vile Flood — https://www.wowhead.com/spell=1294293/vile-flood
- Ravenous Feast — https://www.wowhead.com/spell=1290516/ravenous-feast
- Feasted — https://www.wowhead.com/spell=1310096/feasted
- Coiling Ichor — https://www.wowhead.com/spell=1290809/coiling-ichor
- Congealed Gore (Ichor) — https://www.wowhead.com/spell=1292505/congealed-gore
- Stone Breaker — https://www.wowhead.com/spell=1288538/stone-breaker
- Submerge — https://www.wowhead.com/spell=1308556/submerge
- Noxious Slick — https://www.wowhead.com/spell=1309471/noxious-slick
- Sanguine Storm — https://www.wowhead.com/spell=1306872/sanguine-storm
- Congealed Gore (Storm) — https://www.wowhead.com/spell=1306922/congealed-gore
- Toxic Fumes — https://www.wowhead.com/spell=1295049/toxic-fumes
- Uncoiled Wrath — https://www.wowhead.com/spell=1308583/uncoiled-wrath
- Concentrated Spittle — https://www.wowhead.com/spell=1295107/concentrated-spittle
- Clotted Bolt — https://www.wowhead.com/spell=1295115/clotted-bolt
- Blood Torrent — https://www.wowhead.com/spell=1303230/blood-torrent
- Barbed Bulwark — https://www.wowhead.com/spell=1303378/barbed-bulwark
- Rouse the Brood — https://www.wowhead.com/spell=1308356/rouse-the-brood
- Visceral Burst — https://www.wowhead.com/spell=1308385/visceral-burst
- Tainted Blood — https://www.wowhead.com/spell=1310099/tainted-blood
- Tainted Burst — https://www.wowhead.com/spell=1310105/tainted-burst
- Caustic Rain — https://www.wowhead.com/spell=1308841/caustic-rain

---

## Final Implementation Summary

The Twin Fangs should feel in `wow-trainer` like a fight where **every avoidable venom error has a persistent cost**.

The essential simulation loop is:

```text
manage venom
→ preserve floor space
→ execute tank set
→ control adds/frontals
→ dodge waves
→ spend venom through exactly one Feast hit
→ survive the Submerge movement combination
→ repeat with less room and less venom headroom
→ keep both boss health bars synchronized
```

The most important implementation principle is to keep the encounter **stateful across cycles**. Resetting venom stacks or floor hazards between mechanics would remove the central decision-making that makes the fight worth training.
