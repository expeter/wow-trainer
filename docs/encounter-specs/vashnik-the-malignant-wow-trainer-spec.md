# Vashnik the Malignant — wow-trainer Technical Encounter Specification

**Encounter:** Vashnik the Malignant\
**Raid:** The Venomous Abyss — Chamber of Virulence\
**Project:** `wow-trainer`\
**Verification date:** 2026-08-16\
**Data status:** Patch 12.1 / Season 2 launch data is still pre-live at the time of verification. The raid opens during the week of 2026-08-18, so numerical values and reworked mechanics should be rechecked against live combat logs.

---

## 1. Implementation Summary

Vashnik is a single-phase encounter built around three venom fountains surrounding a central **Malignant Cavity**.

At **100 energy**, Vashnik uses **Imbibe** and selects the **two fountains nearest to his current position**. The selected pair determines:

1. which two raid-wide Expulsions occur;
2. which two Living Venom add families spawn;
3. which two Infusion buffs Vashnik receives;
4. which two **Adaptive Infection** variants can be applied.

The supplied guide strategy deliberately rotates the boss counter-clockwise through the three possible fountain pairs:

```text
Flame + Shadow
      ↓
Shadow + Blood
      ↓
Blood + Flame
      ↓
REPEAT
```

This keeps any single fountain from being selected on every consecutive Imbibe and allows old Infusion stacks to expire.

### Core wow-trainer state

Recommended encounter-level state:

```text
boss.energy: 0..100
boss.position: x,y
boss.activeFountains: [two fountain IDs]

infusions.blood.stacks
infusions.shadow.stacks
infusions.flame.stacks
infusions.<type>.expiresAt

toxicVaporStacks

livingVenoms[]
malignantTumors[]

players[].position
players[].role
players[].debuffs
players[].assignedCamp
players[].alive
```

### Arena anchors

Use a fixed arena with the central cavity and three fountain anchors. Exact world distances are not required for the trainer unless later confirmed from logs/map data.

From the entrance-facing orientation in the supplied guide:

```text
                 BLOOD
                  ●

        FLAME ●         ● SHADOW


                  ◎
          MALIGNANT CAVITY

              ENTRANCE
```

The trainer only needs reliable relative geometry:

- center = Malignant Cavity;
- Blood = rear;
- Flame = left;
- Shadow = right;
- boss fountain selection = nearest two fountain anchors.

---

# 2. Fountain Selection and Infusion System

## Imbibe — Spell ID 1283164 — instant / triggers at 100 energy

### What happens

When Vashnik reaches 100 energy, he draws power from the two fountains nearest to him.

Each selected fountain:

- grants its corresponding Infusion;
- causes its associated Expulsion;
- creates its associated Living Venom adds.

Imbibe also gives Vashnik another stack of **Toxic Vapor**.

### Telegraph

- Boss reaches 100 energy.
- Imbibe activation.
- The two selected fountains visibly activate.
- Living Venoms begin moving from those fountains toward the central Malignant Cavity.

### Targeting

The mechanic targets the **two fountains nearest Vashnik**, not random fountains.

### Required reaction

The tank must place Vashnik between the two fountains intended for the next activation.

For the supplied strategy:

1. Flame + Shadow
2. Shadow + Blood
3. Blood + Flame
4. repeat

### Success condition

- Correct fountain pair is activated.
- The raid never repeatedly feeds the same fountain to uncontrolled Infusion stacks.
- Spawned Living Venoms are controlled and killed before reaching the central cavity.

### Failure conditions

Trainer-worthy failures:

- wrong fountain pair selected because boss positioning is incorrect;
- same fountain selected too many times consecutively;
- Living Venom reaches the Malignant Cavity;
- player does not recognize which infection pair is now enabled.

### wow-trainer implementation notes

The trainer should calculate the pair geometrically:

```text
selected = twoClosest(fountains, boss.position)
```

Do not hard-code the selected pair unless running a scripted training module.

Recommended module modes:

- **guided rotation:** highlights the correct boss position;
- **assessment:** player must position Vashnik correctly without an indicator;
- **random pair recognition:** boss is placed automatically and the player must react to the resulting pair.

Do not assign a fixed real-time Imbibe interval yet. The reliable trigger is **100 energy**. Current strategy guides describe an approximate cadence, but no exact combat-log timeline has been verified for this specification.

---

## Blood Infusion — Spell ID 1293969 — instant / 90s aura

## Shadow Infusion — Spell ID 1293968 — instant / 90s aura

## Flame Infusion — Spell ID 1293971 — instant / 90s aura

### What happens

Each selected fountain grants one stack of its Infusion.

Current Adventure Guide/Wowhead data indicates that each stack increases:

- the corresponding Expulsion damage by **100%**;
- the corresponding Living Venom maximum health by **50%**.

The effect stacks.

### Important transcript correction

The supplied transcript describes **+200% Expulsion damage per Infusion stack**.

Current data instead says **+100% per stack** and **+50% add health per stack**.

For `wow-trainer`, use the current +100% / +50% values as the default configuration, but keep them data-driven because this encounter is still subject to launch tuning.

### Required reaction

Rotate fountain pairs so one fountain is left unused long enough for its older Infusion to expire instead of allowing all three Infusions to continuously climb.

### Success condition

The pair rotation remains controlled and no fountain is repeatedly selected to dangerous stack levels.

### Failure conditions

- three consecutive selections of the same fountain;
- uncontrolled Infusion escalation;
- wrong boss rotation.

Three stacks are not documented as a literal scripted wipe trigger; they should be treated as a **strategy failure / likely lethal tuning state**, not as an invented game rule.

### wow-trainer implementation notes

Keep Infusions as timed stack objects instead of simply resetting a type when it is not selected.

```text
onImbibe(fountain):
    add timed infusion stack
    stack.expiresAt = now + 90s
```

This allows later combat-log corrections without rewriting the encounter logic.

---

# 3. Global Living Venom Rules

Every selected fountain produces Living Venom creatures that move toward the Malignant Cavity.

The major common rule is:

```text
Living Venom reaches center
        ↓
Malignant Burst
        ↓
major raid failure
```

Add movement is therefore more important to the trainer than exact DPS simulation.

Recommended abstractions:

- each add has movement speed;
- each add has a normalized health bar;
- allowed CC flags differ by add type;
- adds path toward the cavity;
- reaching the cavity causes a hard or near-hard failure.

---

## Toxic Vapor — Spell ID 1284561 — passive stack / 2s damage tick

### What happens

Each Imbibe adds another stack of ambient Toxic Vapor.

### Trainer relevance

This acts as escalating background raid pressure and a soft encounter timer.

### wow-trainer implementation notes

Do not simulate exact raid healing unless desired.

A simple escalating pressure meter is sufficient:

```text
ambientPressure += 1 per Imbibe
```

This can reduce the amount of mechanic failure the simulated raid can tolerate as the fight progresses.

---

## Malignant Burst — Spell ID 1280189 — 1.5s cast / 30s stacking DoT / 3s DoT tick

### What happens

A Living Venom that reaches the Malignant Cavity bursts and applies severe raid-wide damage plus a stacking 30-second DoT.

### Telegraph

- Living Venom reaches the center.
- Malignant Burst cast begins.

### Required reaction

Prevent every Living Venom from reaching the cavity.

### Success condition

All Living Venoms die before entering the center.

### Failure conditions

- any Living Venom reaches the cavity;
- repeated Malignant Burst stacks.

### wow-trainer implementation notes

For mechanic training, this can be treated as an immediate major failure even though the real encounter technically applies raid damage/DoT.

---

## Hardened Venom — Spell ID 1314837 — activates after 60s alive

### What happens

A Living Venom that remains alive for 60 seconds becomes:

- immune to crowd control;
- 50% faster.

Current guide presentation differs on whether this is intended for all Living Venoms or specifically the Flame add family. Method describes it as a general Living Venom timeout; the current Wowhead hierarchy places it beneath Burning Venom.

### wow-trainer implementation notes

Implement this as a configurable add timeout.

Default recommended behavior:

```text
if add.aliveFor >= 60s:
    add.ccImmune = true
    add.moveSpeed *= 1.5
```

Mark the affected add families as a data setting until live logs resolve the scope.

---

# 4. Flame Fountain Package

## Conflagrating Expulsion — Spell ID 1298587 — instant

### What happens

Activating the Flame Fountain causes raid-wide Fire damage.

The damage scales with Flame Infusion stacks.

### Telegraph

- Flame Fountain activates.
- Expulsion visual / raid-wide damage event.

### Required reaction

No positional counterplay beyond controlling Flame Infusion stacks and planning healing.

### wow-trainer implementation notes

Background pressure only. It does not need a dedicated player-control exercise.

---

## Burning Venom / Burning Presence — Spell ID 1305902 — passive / 3s pulse

### What happens

Current strategy data supports **2 Burning Venoms** spawning from a Flame activation.

Each Burning Venom:

- moves toward the Malignant Cavity;
- pulses raid-wide Fire damage every 3 seconds while alive;
- can be displaced/controlled before hardening;
- triggers **Caustic Surge** when killed.

### Transcript correction

The strategy narration later says “three Fire adds,” but current encounter guides consistently describe **2 Burning Venoms**. Use 2 as the current `wow-trainer` default.

### Telegraph

- Two burning/orange Living Venoms emerge from the Flame Fountain.
- Repeating raid pulse while they live.

### Targeting

Adds move toward the center rather than targeting a specific player.

### Required reaction

- Grip/move Burning Venoms into the other active add pack where possible.
- Prioritize them.
- Do **not** kill both at exactly the same time if this would overlap Caustic Surge.

### Success condition

- Both adds die before reaching the cavity.
- Their deaths are staggered enough to avoid dangerous stacked Caustic Surge.

### Failure conditions

- add reaches center;
- both adds die simultaneously;
- add survives until Hardened Venom;
- player wastes control after the add has hardened.

### wow-trainer implementation notes

The useful skill is **kill timing**, not DPS rotation.

Represent each Burning Venom with:

```text
health: normalized 0..100
moveTarget: cavity
ccAllowed: true until Hardened Venom
deathEvent: Caustic Surge
```

Allow simulated grip/knock/stun/slow actions as generic utility buttons rather than reproducing class kits.

---

## Caustic Surge — Spell ID 1285979 — on-death trigger / 3s stacking DoT / 1s tick

### What happens

A Burning Venom explodes on death and applies raid damage plus a short stacking burn.

### Required reaction

Stagger Burning Venom deaths.

### Success condition

Only one dangerous Caustic Surge window is active at a time, according to the strategy.

### Failure conditions

- both Burning Venoms die together;
- second add dies while the previous Caustic Surge is still considered unsafe.

### wow-trainer implementation notes

The trainer does not need health simulation.

Use a simple post-death hazard window:

```text
causticSurgeDanger = 3s
```

Score a second Burning Venom death during that window as an overlap error.

---

## Exploding Infection — Spell ID 1295173 — instant application / Magic debuff / 1.5s damage tick

### Caustic Explosion — Spell ID 1295209 — instant on removal

### What happens

When Flame is one of the active Infusions, Adaptive Infection can apply **Exploding Infection**.

The affected player takes periodic Fire damage. When the debuff is removed, the player causes a raid-wide **Caustic Explosion**.

Current strategy sources and earlier Dungeon Journal data support distance falloff: the farther the infected player is from the raid at detonation, the lower the raid damage.

The current guide also indicates the debuff gains stacks over time in the full-mechanic version of the encounter.

### Telegraph

- large fire circle around affected player;
- arrow/marker above the player in current guide footage;
- Flame-colored debuff icon.

### Targeting

The supplied transcript says **2 random players** receive each active infection variant.

Current external encounter text says “several players” and does not expose a stable target-count rule.

For `wow-trainer`:

```text
defaultTargetsPerInfectionType = 2   // transcript-derived
```

Keep this configurable until combat logs confirm it.

### Required reaction

- Immediately move away from the raid.
- Do not cross another infection target's path.
- Detonate/dispell only after reaching a safe distance.
- Avoid detonating both targets simultaneously if the raid cannot safely absorb both events.

### Success condition

- infected player reaches a safe outer position before removal;
- Caustic Explosion occurs far from the raid;
- multiple infected players separate cleanly.

### Failure conditions

- explosion near raid;
- target remains stacked;
- two Exploding Infection players stack on one another;
- simultaneous explosions during other heavy overlap;
- target moves through Plague Froth lanes or Blood support camps.

### wow-trainer implementation notes

The exact distance-to-damage formula is not currently exposed reliably enough to reproduce.

Use a normalized distance score instead:

```text
explosionQuality =
    distance(player, raidCentroid) / arenaReferenceRadius
```

Suggested scoring:

- outer safe zone = success;
- intermediate distance = warning;
- inside raid stack = failure.

Do not invent an exact yard threshold until live data is available.

---

# 5. Shadow Fountain Package

## Gloom Expulsion — Spell ID 1298583 — instant

### What happens

Activating the Shadow Fountain causes raid-wide Shadow damage.

The damage scales with Shadow Infusion stacks.

### wow-trainer implementation notes

Background pressure. No dedicated player exercise required.

---

## Shrouded Venom / Miasmic Coating — Spell ID 1312366 — passive absorb equal to 100% max health

### What happens

Current strategy data supports **5 Shrouded Venoms** spawning from a Shadow activation.

Each Shrouded Venom:

- starts with an absorb shield equal to 100% of its maximum health;
- moves toward the Malignant Cavity;
- can be controlled;
- creates **Umbral Ejection** impacts when destroyed.

### Telegraph

- five purple/shadow Living Venoms emerge from the Shadow Fountain;
- shield visual/absorb state.

### Required reaction

In the supplied strategy:

- kill them near the boss for efficient cleave;
- when paired with Flame, bring Burning Venoms onto them;
- when paired with Blood, control Shadow adds while Blood adds are prioritized;
- move from Umbral Ejection impacts after deaths.

### Success condition

All Shadow adds die before reaching the cavity without players being hit by their death impacts.

### Failure conditions

- add reaches center;
- poor control causes adds to spread;
- player remains in Umbral Ejection impact;
- wrong add priority causes a more dangerous add family to survive.

### wow-trainer implementation notes

Spawn five adds in a loose group with mild positional randomization.

Their shield can simply double their effective normalized HP:

```text
baseHealth = 100
shield = 100
```

The player-facing trainer does not need true damage numbers.

---

## Congealing Bolt — Spell ID currently unverified — 5s stacking 5% slow in earlier PTR data

### Verification status

The supplied transcript describes Shadow adds applying a stacking slow to nearby/closest players.

Earlier PTR Dungeon Journal data names this mechanic **Congealing Bolt** and describes:

- Shadow impact damage;
- **5% movement-speed reduction**;
- **5-second duration**;
- stacking.

However, the 2026-08-10 current Wowhead encounter hierarchy no longer lists Congealing Bolt.

### wow-trainer implementation notes

Do not make this a mandatory core mechanic yet.

Recommended configuration:

```text
shadow.congealingBolt.enabled = false   // until live-log confirmation
shadow.congealingBolt.slowPerStack = 0.05
shadow.congealingBolt.duration = 5s
```

If enabled, use the nearest-player behavior from the supplied transcript as a provisional targeting rule.

---

## Umbral Ejection — Spell ID 1286737 — instant on death / 3yd impact radius

### What happens

When a Shrouded Venom dies, Shadow venom impacts nearby locations.

Players inside a 3-yard impact are hit.

### Telegraph

- Shadow add dies.
- Small dark impact circles appear.

### Targeting

Impact locations are generated from the dying add event.

The exact number/distribution of impacts should be verified from live logs/video.

### Required reaction

Move out of the small ground impacts.

### Success condition

No player is hit.

### Failure conditions

- standing still on dying Shadow adds;
- pathing through an impact while handling another mechanic.

### wow-trainer implementation notes

Spawn small avoidable circles near the add death position.

Randomize the exact offsets.

---

## Stygian Infection — Spell ID 1294994 — instant application / 1.5s damage tick / heal absorb

## Stygian Burst — Spell ID 1302489 — instant / current 6yd impact radius

### What happens

When Shadow is active, Adaptive Infection can apply **Stygian Infection**.

Current encounter data gives the target:

- periodic Shadow damage;
- a healing absorb;
- repeated **Stygian Burst** eruptions at/near the player's position while the infection persists.

Current tooltip data lists the absorb at approximately **710,491 healing**, but this is tuning-sensitive and should not be hard-coded into gameplay scoring.

### Transcript correction

The transcript describes one small ground area appearing after the absorb is healed.

Current guide data instead describes **periodic Stygian Bursts while the infection is active**.

The trainer should use the repeated-movement behavior.

### Telegraph

- Shadow-colored debuff.
- Healing absorb indicator.
- Repeated ground eruption under/near the affected player.

### Targeting

Default `wow-trainer` target count: **2 players per active infection type**, derived from the supplied transcript and kept configurable pending log verification.

### Required reaction

- Spread away from other players.
- Keep moving enough to leave successive bursts behind.
- Do not move so far that a simulated healer-range constraint would be broken.
- Avoid crossing Blood camps, Fire run-out lanes, or Plague Wave lanes.

### Success condition

- no Stygian Burst hits the infected player or another player;
- burst trail is placed away from the raid;
- target remains in a viable outer/mid-range path.

### Failure conditions

- standing still and being hit by the next eruption;
- clipping another player;
- crossing the boss stack;
- moving into another infection target's path.

### wow-trainer implementation notes

This is a strong standalone movement module.

Recommended simulation:

```text
while stygianInfection.active:
    periodically spawn burst at player's recent position
```

Exact Stygian Burst cadence is not yet reliable enough to hard-code. Keep it data-driven and use a trainer-friendly provisional cadence only in explicitly marked development/test builds.

---

# 6. Blood Fountain Package

## Hemo Expulsion — Spell ID 1298582 — instant

### What happens

Activating the Blood Fountain causes raid-wide Shadow damage.

The damage scales with Blood Infusion stacks.

### wow-trainer implementation notes

Background pressure only.

---

## Clotting Venom / Sanguineous Fortitude — Spell ID 1291530 — passive CC immunity on initial add

## Splitting Clot — Spell ID 1286631 — instant on death

### What happens

Current strategy data supports **1 initial Clotting Venom** spawning from a Blood activation.

The initial add:

- moves toward the Malignant Cavity;
- is immune to crowd control;
- splits into **2 smaller Clotting Venoms** when killed.

Each of those smaller adds then splits once more into **2 final smaller adds**.

So one Blood activation creates the following lineage:

```text
1 initial
  ↓ dies
2 children
  ↓ each dies
4 final children
```

The smaller generations can be crowd controlled according to current strategy guidance.

### Telegraph

- large red/blood Living Venom emerges.
- death visibly splits the add.

### Required reaction

- focus the initial CC-immune add;
- immediately control/focus the split adds;
- prevent every generation from reaching the center.

### Success condition

All generations die before entering the cavity.

### Failure conditions

- attempting to CC the initial add instead of killing it;
- losing track of split adds;
- any split add reaches center;
- Shadow adds are prioritized over a dangerous Blood add while Blood is active.

### wow-trainer implementation notes

Implement explicit generations:

```text
generation 0: count 1, ccImmune = true
generation 1: count 2, ccImmune = false
generation 2: count 4, ccImmune = false, no further split
```

Randomize child spawn angles slightly around the parent death point.

---

## Siphoning Infection — Spell ID 1295224 — instant application / 1.5s damage tick / heal absorb / -100% normal healing received

## Siphon Blood — Spell ID 1295229 — 1.5s pulse / 10yd radius

### What happens

When Blood is active, Adaptive Infection can apply **Siphoning Infection**.

The infected player receives:

- a strong healing absorb;
- 100% reduction to normal healing received;
- repeated Siphon Blood pulses.

Siphon Blood:

- damages allies within 10 yards;
- heals the infected player once per nearby ally hit.

Current tooltip values are approximately:

- absorb: **1,065,736 healing**;
- healing per nearby ally hit: **21,315**;
- pulse: every **1.5 seconds**.

This means each helper hit currently restores about **2% of the listed absorb**, making nearby-player density the essential mechanic rather than conventional healing.

### Telegraph

- large blood/red circle around infected player;
- Blood infection debuff;
- absorb indicator.

### Targeting

The supplied strategy expects **2 Siphoning Infection targets simultaneously**.

Current general encounter text only says “several players,” so keep target count configurable.

### Required reaction

The supplied strategy uses two separate raid camps:

```text
Camp A: one infected target in melee / close to boss
Camp B: second infected target slightly behind the boss

Raid divides between them.
```

Players enter the infected target's 10-yard Siphon Blood circle long enough to feed healing into the absorb.

The raid then moves on quickly because this mechanic occurs in a dense sequence with other infections and Plague Froth.

### Success condition

- both infected targets receive enough nearby allies;
- the two support groups remain separated;
- the absorb is resolved quickly enough to leave for the next mechanic.

### Failure conditions

- infected player has too few helpers;
- all helpers stack on only one infected target;
- both infection circles overlap;
- helpers remain inside too long and take unnecessary repeated Siphon Blood damage;
- support camp fails to break before Plague Froth/spread requirement.

### wow-trainer implementation notes

This is one of the highest-value modules.

Do not simulate healing spells.

Instead:

```text
for each siphon pulse:
    helpers = players within 10yd
    absorbRemaining -= helpers * siphonHealingPerHelper
```

For a simplified normalized model, one current tooltip-based helper pulse is approximately:

```text
~2% of the absorb per helper per pulse
```

This creates meaningful positioning pressure without recreating WoW healing.

For single-player training, simulate the rest of the raid as moving NPC markers and require the player to join the correct camp or, if the player is the infected target, move to the assigned camp.

---

## Thinned Blood — Spell ID 1314273 — passive / +100% damage taken from Siphon Blood

### What happens

The full-mechanic encounter includes **Thinned Blood**, which increases damage taken from Siphon Blood by 100%.

The current available data does not expose a sufficiently reliable application rule or duration for this specification.

### wow-trainer implementation notes

Use it as an optional pressure/scoring layer rather than a hard-coded timer.

Potential trainer rule:

- repeated or unnecessary exposure to Siphon Blood increases a helper's danger score;
- standing in both Blood circles is strongly penalized.

Do not assign an unverified duration.

---

# 7. Malignant Catalyst and Catalytic Bile

## Malignant Catalyst — Spell ID 1282525 — instant/triggered

## Catalytic Bile — Spell ID 1282601 — instant impact / 6yd impact radius

### What happens

Vashnik forms an orb over the Malignant Cavity and launches multiple **Catalytic Bile** impacts around the arena.

Each impact must hit **at least one player**.

If an impact hits nobody, the encounter instead deals raid-wide damage.

### Transcript correction

The transcript calls these “solo soak” circles.

Current encounter data only requires **at least one player per impact**.

For the trainer:

- one player is the preferred efficient solution;
- a second player in the same circle is not automatically a mechanic failure;
- leaving another circle empty is the real failure.

### Telegraph

- central poison orb / catalyst animation;
- multiple green impact/soak circles.

### Targeting

Multiple arena locations.

Current testing feedback indicates Bile locations were reworked to spawn closer to Vashnik's current position.

Exact number and spawn radius should be verified from live logs.

### Required reaction

- quickly identify uncovered circles;
- one player enters each circle;
- avoid sending multiple players to the same circle while another remains empty.

### Success condition

Every Catalytic Bile impact contains at least one player.

### Failure conditions

- any circle resolves empty;
- two players race to one circle while another has no assigned soaker;
- soaker is forced through an incompatible infection/wave hazard.

### wow-trainer implementation notes

Randomize:

- number of circles within a configurable range;
- angular position;
- distance from the boss/current raid position.

Score coverage at resolution:

```text
for each bile:
    if playersWithin(6yd) >= 1:
        success
    else:
        raidFailure
```

Do not hard-code a circle count until live combat logs are available.

---

# 8. Plague Froth and Plague Wave

## Plague Froth — Spell ID 1281907 — instant application / current guide: 6s aura / 1s proximity tick / 4.5yd radius

### What happens

Several players receive **Plague Froth**.

For the currently exposed aura duration:

- nearby players within 4.5 yards are damaged every 1 second;
- after 6 seconds, the debuff expires;
- four **Plague Waves** erupt in the cardinal directions from that player's location.

### Data discrepancy

This mechanic has changed during pre-release data:

- older Dungeon Journal data showed **4 seconds**;
- Method currently describes **8 seconds / about 5 yards**;
- the current 2026-08-10 Wowhead encounter data shows **6 seconds / 4.5 yards**.

Use **6s / 4.5yd** as the default `wow-trainer` configuration, but keep both values configurable for post-launch correction.

### Telegraph

- Plague Froth debuff;
- personal green/poison radius;
- impending cross-shaped wave release.

### Targeting

Several random players.

Current spell data exposes varying target caps across difficulty data. For the unified full-mechanic `wow-trainer` profile, use a configurable target count rather than encoding a difficulty branch.

Recommended initial trainer default:

```text
plagueFrothTargets = 5
```

Reconfirm from live logs.

### Required reaction

- pre-spread before application where possible;
- Froth targets move out from the raid;
- keep the boss area and behind-boss movement lane clear;
- orient/position the upcoming cross so it does not hit other players;
- in the full encounter, use the waves to interact with Malignant Tumors.

### Success condition

- no player remains inside another Froth target's 4.5-yard radius;
- no Plague Wave hits another player;
- tumor-clear requirements are met when tumors are active.

### Failure conditions

- two Froth targets overlap;
- target drops the cross through the raid;
- target blocks the raid's next movement direction;
- player dodges the Froth spread but is hit by another target's wave;
- tumor remains unresolved after its available wave opportunities.

### wow-trainer implementation notes

Show a cross preview only in beginner mode.

Assessment mode should force the player to infer the four outgoing lines from their own facing/world axes.

The supplied guide recommends moving each subsequent Froth set only a few meters farther around the room while keeping the boss and rear lane clean. Exact “2–3 m” guide narration should be treated as a positioning concept, not an authoritative game radius.

---

## Plague Wave — Spell ID 1295798 — instant on Froth expiry / four cardinal directions

### What happens

Four linear waves erupt from each expired Plague Froth target.

### Telegraph

- Froth countdown reaches zero.
- Cross-shaped poison waves fire outward.

### Required reaction

Avoid all lines and, when Tumors are active, deliberately align lines through Tumors.

### Success condition

- no player hit;
- desired Tumor targets intersect the line.

### Failure conditions

- wave clips the raid;
- two Froth players place mutually blocking crosses;
- Tumor is missed;
- player over-rotates and hits a different group.

### wow-trainer implementation notes

Use ray/rectangle collision rather than actual projectile physics.

```text
origin = frothTarget.position
directions = [north, east, south, west]
```

The “cardinal” axes should be arena/world-fixed, not based on player facing.

---

# 9. Malignant Tumors

## Malignant Tumor — spell IDs/cast timing not yet reliably verified

## Hardened Tumor — spell ID not reliably verified — 99% damage reduction in earlier PTR data

## Tumor Burst — spell ID/cast timing not reliably verified — stacking 1-minute raid DoT in earlier PTR data

### What happens

The supplied guide describes stationary green Tumors spawning at random positions around the room.

They must be hit by Plague Wave. The transcript's intended tactic is:

```text
Tumor spawn
   ↓
Plague Froth set #1 → aim waves through as many Tumors as possible
   ↓
Plague Froth set #2 → clear remaining Tumors
   ↓
no Tumors may remain
```

### Current-data conflict

This mechanic was reworked during testing and current sources are not fully synchronized.

Available descriptions include multiple mutually inconsistent versions:

**Version A — supplied transcript / current Wowhead Plague Wave wording**
- Plague Wave destroys Malignant Tumors.

**Version B — older PTR journal / current Icy Veins wording**
- Tumor has Hardened Tumor, reducing damage taken by 99%;
- Plague Wave removes Hardened Tumor;
- raid then kills the exposed Tumor.

**Version C — another section of the current Wowhead encounter hierarchy**
- Imbibe is described as creating **Malignant Totems** instead;
- those Totems use **Malignance** (Spell ID 1304459), a stacking raid-pressure mechanic.

The same current Wowhead page simultaneously still states that Plague Waves destroy Malignant Tumors, so the pre-launch database/guide is internally inconsistent. Blizzard's Mythic testing feedback thread explicitly notes that Malignant Tumor behavior was reworked.

For `wow-trainer`, preserve the supplied guide's Tumor + Plague Wave strategy as the default, but keep the entire Tumor/Totem package behind encounter configuration until live combat logs resolve which implementation shipped.

### Telegraph

- stationary green Tumor NPC/object;
- while aiming a Plague Wave, the supplied guide reports a Tumor that will be hit becomes visibly highlighted/white at long range.

That white-hit-preview behavior is guide/video-derived and should be confirmed live.

### Targeting / spawning

Random arena positions.

No fixed assignments should be assumed.

### Required reaction

- all players actively scan for Tumors;
- Froth targets pre-position so each cross intersects useful Tumors;
- avoid wasting multiple wave lines on the same already-resolved Tumor when another is still untouched;
- clear all Tumors within the available Froth opportunities.

### Success condition

Every spawned Tumor is resolved before it can Burst.

### Failure conditions

- Tumor never intersected by a Plague Wave;
- bad pre-spread makes remaining Tumor angles impossible;
- player aims at one Tumor but clips the raid;
- unresolved Tumor reaches its burst condition.

### wow-trainer implementation notes

This should be parameterized instead of choosing a disputed implementation permanently:

```text
tumor.mode =
    "destroy_on_wave"
    OR
    "remove_hardened_then_kill"

tumor.spawnPositions = randomized
tumor.waveHitPreview = optional
tumor.allowedFrothSets = 2   // transcript strategy; verify live
```

For the first `wow-trainer` build, **`destroy_on_wave`** best matches the supplied strategy and current Wowhead wording.

The exposed-Tumor kill version can remain a feature flag until combat logs after launch resolve the mechanic.

Do not invent a Tumor Burst cast duration.

---

# 10. Tank Mechanic

## Dripping Fangs — Spell ID 1280935 — 2.0s cast / 32s debuff / 2s Nature DoT tick

### What happens

Vashnik bites the active tank and applies:

- a heavy Physical hit;
- a 32-second Nature DoT;
- a stacking increase to Physical damage taken.

### Current numerical conflict

This value changed during testing:

- older Dungeon Journal / some current guide prose: **+100% Physical damage taken**;
- current Wowhead encounter tooltip: **+200%**;
- current underlying spell table has also exposed different tuning values.

The important strategy is stable: **swap after every Dripping Fangs / at one stack**.

### Telegraph

- 2-second boss cast.
- tank debuff.

### Targeting

Current active tank.

### Required reaction

- active tank uses mitigation for the hit;
- other tank taunts after the cast;
- new active tank continues positioning Vashnik for the next desired fountain pair.

### Success condition

- clean one-stack tank swap;
- boss remains positioned correctly for Imbibe.

### Failure conditions

- same tank takes consecutive Dripping Fangs;
- taunt turns or drags boss into the wrong fountain pair;
- tank focuses on swap but misses required boss movement.

### wow-trainer implementation notes

This is especially useful in a tank-focused positioning module.

The trainer need not model exact damage amplification.

Use:

```text
if activeTank.hasDrippingFangs:
    nextDrippingFangsOnSameTank = failure
```

Combine this with boss-position scoring so the player must swap **without losing the intended fountain selection**.

---

# 11. Adaptive Infection Dispatcher

## Adaptive Infection — Spell ID 1282184 — instant dispatcher / 20s hidden aura in current spell data

The encounter has multiple spell wrappers/variants associated with Adaptive Infection. Spell ID 1282184 currently exposes the expected “infect players according to current infusions” behavior; wrapper IDs may change.

The player-facing behavior is defined by the three infection debuffs:

| Active fountain | Infection enabled |
|---|---|
| Blood | Siphoning Infection |
| Shadow | Stygian Infection |
| Flame | Exploding Infection |

Therefore the supplied pair rotation creates:

| Fountain pair | Simultaneous infection package |
|---|---|
| Flame + Shadow | Exploding + Stygian |
| Shadow + Blood | Stygian + Siphoning |
| Blood + Flame | Siphoning + Exploding |

### Core recognition skill

The most important trainer relationship is:

```text
Boss position
   ↓
Imbibe selects two fountains
   ↓
Player predicts two add families
   ↓
Player predicts two Infection types
   ↓
Player pre-positions before Adaptive Infection
```

Adaptive Infection itself is not strengthened by Infusion stacks according to the supplied guide and current Infusion tooltips; the Infusions specifically scale their Expulsion and associated Living Venom health.

### wow-trainer implementation notes

Do not choose infection type randomly from all three.

```text
enabledInfections = activeFountains.map(fountainToInfection)
```

Randomize the player targets inside those two enabled types.

Recommended provisional rule from the supplied transcript:

```text
2 unique targets per active infection type
```

Whether a player can receive both active variants simultaneously needs combat-log verification.

---

# 12. Mechanic Relationships

These dependencies are central to the `wow-trainer` implementation.

## Boss position → fountain pair

```text
Tank moves boss
   ↓
two nearest fountains chosen at 100 energy
```

Bad boss positioning changes the entire upcoming mechanic package.

---

## Fountain pair → adds + Infusions + infections

```text
Imbibe
   ↓
selected Flame + Shadow
   ├─ Flame Infusion
   ├─ Shadow Infusion
   ├─ Burning Venoms
   ├─ Shrouded Venoms
   ├─ Exploding Infection
   └─ Stygian Infection
```

Equivalent mapping applies to the other two pair combinations.

---

## Infusion rotation → future difficulty

Selecting the same fountain repeatedly increases:

- its Expulsion pressure;
- associated add health.

Therefore fountain rotation is a long-horizon positioning mechanic, not merely a one-cast choice.

---

## Burning Venom kill timing → Caustic Surge overlap

```text
Burning Venom #1 dies
   ↓
3s Caustic Surge danger window
   ↓
Burning Venom #2 should not die immediately
```

---

## Blood Infection → temporary stack requirement

```text
Siphoning Infection
   ↓
raid splits into two support camps
   ↓
Siphon Blood consumes helper health / heals infected
   ↓
absorb resolved
   ↓
players must immediately leave camps for next spread mechanic
```

This stack-to-spread transition is a major trainer value point.

---

## Stygian Infection → movement trail

```text
Stygian Infection
   ↓
periodic burst at affected player's position
   ↓
continuous controlled movement
```

The movement path must not interfere with the raid stack or other infection targets.

---

## Exploding Infection → distance before removal

```text
Exploding Infection
   ↓
move away
   ↓
safe outer position
   ↓
dispel/removal
   ↓
Caustic Explosion with minimized raid impact
```

---

## Plague Froth placement → Plague Wave lanes

```text
Froth spread position
   ↓
fixed cardinal cross at expiry
   ↓
future safe/unsafe movement lanes
```

The player is solving a future geometry problem, not merely spreading for a circle.

---

## Plague Froth → Malignant Tumor resolution

```text
Tumor locations
   ↓
pre-position Froth targets
   ↓
aim cardinal Plague Waves
   ↓
Tumors resolved / exposed
```

This is likely the most important full-mechanic spatial relationship.

---

## Add control → central-cavity failure prevention

```text
every Living Venom
   ↓
moves toward center
   ↓
must be killed/controlled
   ↓
otherwise Malignant Burst
```

---

# 13. Encounter Flow Based on the Supplied Strategy

No exact timestamps are assigned below.

The flow is event-based because the supplied video is edited and because current pre-live guides do not provide a sufficiently reliable combat-log timeline.

```text
PULL
  ↓
Tank places Vashnik near the Shadow side,
between the intended Flame + Shadow pair
  ↓
Core mechanics interleave:
Dripping Fangs / Malignant Catalyst / Plague Froth
  ↓
100 ENERGY → IMBIBE
  ↓
FLAME + SHADOW ACTIVE
  ├─ Conflagrating Expulsion + Gloom Expulsion
  ├─ 2 Burning Venoms
  ├─ 5 Shrouded Venoms
  └─ Adaptive Infection:
       Exploding Infection + Stygian Infection
  ↓
Grip/control Flame adds into Shadow adds
Stagger Burning Venom deaths
Dodge Shadow death impacts
Handle Bile soaks
Pre-spread Froth and keep boss/rear lanes clean
  ↓
Rotate counter-clockwise toward BLOOD
  ↓
100 ENERGY → IMBIBE
  ↓
SHADOW + BLOOD ACTIVE
  ├─ Gloom Expulsion + Hemo Expulsion
  ├─ 5 Shrouded Venoms
  ├─ 1 Clotting Venom → 2 → 4
  └─ Adaptive Infection:
       Stygian Infection + Siphoning Infection
  ↓
Control Shadow adds while prioritizing dangerous Blood add
Handle Bile
  ↓
Siphoning Infection:
raid forms two separate support camps
(one close/melee, one slightly behind)
  ↓
Absorbs handled
  ↓
BREAK CAMPS IMMEDIATELY
  ↓
Plague Froth spread / wave placement
  ↓
Restack if another Blood-infection event occurs
  ↓
Rotate counter-clockwise toward FLAME
  ↓
100 ENERGY → IMBIBE
  ↓
BLOOD + FLAME ACTIVE
  ├─ Hemo Expulsion + Conflagrating Expulsion
  ├─ Clotting Venom chain
  ├─ 2 Burning Venoms
  └─ Adaptive Infection:
       Siphoning Infection + Exploding Infection
  ↓
Prioritize Blood add lineage
Bring Burning Venoms into cleave
Stagger Fire add deaths
  ↓
Catalytic Bile coverage
  ↓
Exploding targets run outward
while Blood targets form two support camps
  ↓
Plague Froth spread / wave placement
  ↓
Continue counter-clockwise movement
  ↓
REPEAT FROM FLAME + SHADOW
until Vashnik dies
```

### Tumor overlay

When Tumors are present, overlay this objective on the normal flow:

```text
Tumors spawn randomly
  ↓
next Plague Froth set:
clear as many as possible
  ↓
next Plague Froth set:
clear remaining Tumors
  ↓
continue normal pair rotation
```

Do not create fixed Tumor locations because the supplied strategy explicitly relies on random spawns and player observation.

---

# 14. Suggested wow-trainer Event Architecture

The encounter should be implemented as mechanics that subscribe to state changes rather than as one giant timestamp script.

Example:

```text
EVENT boss_energy_100
    -> resolve Imbibe pair
    -> increment Infusions
    -> add Toxic Vapor stack
    -> emit two Expulsions
    -> spawn two Living Venom families
    -> update active infection variants

EVENT adaptive_infection
    -> read active fountain pair
    -> select targets
    -> apply both matching infection variants

EVENT plague_froth
    -> select targets
    -> apply proximity circles
    -> on expiry emit cardinal waves
    -> wave collision checks players
    -> wave collision checks Tumors

EVENT living_venom_reaches_cavity
    -> Malignant Burst
    -> major failure

EVENT burning_venom_dies
    -> Caustic Surge overlap window

EVENT shadow_venom_dies
    -> spawn Umbral Ejection impacts

EVENT clotting_venom_dies
    -> spawn next generation if available
```

This makes later live-tuning corrections local to data/configuration instead of requiring encounter-flow rewrites.

---

# 15. Useful Randomization

Randomization should test recognition while preserving the encounter's strategic logic.

## Good randomization

- which eligible player receives each Infection;
- Plague Froth targets;
- Tumor positions;
- Umbral Ejection impact offsets;
- Catalytic Bile impact positions;
- small variations in add spawn spacing;
- exact position of generic NPC raid members within their assigned camp;
- whether the player is personally targeted or must react to another targeted player.

## Avoid randomizing

- fountain identities/arena anchors;
- the mapping from fountain → add type → infection type;
- the guide strategy's intended pair rotation in a strategy-practice module;
- cardinal direction behavior of Plague Wave.

An advanced assessment mode may allow free boss positioning and therefore naturally produce a different fountain pair, but that should result from geometry rather than random selection.

---

# 16. Recommended Training Modules

Ranked by individual practice value.

## 1. Plague Froth + Malignant Tumor Alignment

**Highest value.**

Practice:

- pre-spread;
- 4.5-yard personal spacing;
- predicting cardinal wave geometry;
- finding high-value Tumor lines;
- keeping raid movement lanes clear;
- clearing all Tumors within the allowed wave opportunities.

Randomize Tumor positions every attempt.

---

## 2. Fountain Pair Recognition + Adaptive Infection Response

Show/resolve a fountain pair and immediately ask the player to execute the correct response:

- Flame + Shadow → run-out + moving Shadow trail;
- Shadow + Blood → moving Shadow trail + Blood camp;
- Blood + Flame → Blood camp + Fire run-out.

This directly trains the encounter's core cognitive mapping.

---

## 3. Siphoning Infection Two-Camp Split

Practice:

- identifying the two infected targets;
- joining the correct camp;
- maintaining separation between camps;
- staying long enough to clear the absorb;
- leaving immediately for the next spread.

Add a later mode where Plague Froth follows immediately to train the stack → spread transition.

---

## 4. Full Mixed Infection Overlaps

Target the player with one infection while simulated raid members handle the second active type.

Examples:

- Blood target while another player has Exploding Infection;
- Fire target while Blood camps are forming;
- Shadow target while the raid must remain stacked elsewhere.

This trains path selection rather than isolated mechanic recognition.

---

## 5. Add Control and Kill Ordering

Provide generic control actions and normalized add HP.

Practice:

- Flame priority;
- grip Flame adds into other adds;
- stagger Burning Venom deaths;
- kill CC-immune initial Blood add;
- control split Blood adds;
- delay/control Shadow adds when a higher priority family exists;
- prevent any add from reaching the cavity.

---

## 6. Catalytic Bile Coverage

Practice rapid spatial assignment:

- multiple randomized circles;
- at least one player per circle;
- don't double-cover one while leaving another empty.

Combine later with Infection movement.

---

## 7. Tank Rotation + Fountain Positioning

Tank-specific module:

- Dripping Fangs cast;
- swap after every cast;
- move/turn Vashnik without changing the desired Imbibe pair;
- rotate counter-clockwise through pair positions.

Failure scoring should prioritize wrong fountain selection over minor positioning precision.

---

## 8. Stygian Infection Trail

Short personal movement drill:

- repeated bursts behind player;
- avoid raid/NPCs;
- remain within a reasonable healer-range band;
- end at a position compatible with the next mechanic.

---

## 9. Exploding Infection Run-Out

Practice:

- immediate reaction to marker;
- choose uncontested outer lane;
- maximize distance before detonation;
- stagger with second infected target.

---

# 17. Full Encounter Simulation

A complete `wow-trainer` Vashnik simulation should eventually combine:

1. boss energy and position;
2. geometric two-nearest-fountain selection;
3. timed Infusion stacks;
4. Toxic Vapor escalation;
5. all three Living Venom families;
6. add-to-cavity movement and Malignant Burst;
7. Burning Venom death staggering;
8. Blood add splitting;
9. Shadow death impacts;
10. Adaptive Infection mapping from the active pair;
11. Exploding Infection movement/removal;
12. Stygian Infection movement trail;
13. Siphoning Infection two-camp resolution;
14. Malignant Catalyst / Catalytic Bile coverage;
15. Plague Froth proximity and cross waves;
16. random Malignant Tumors;
17. Tumor-wave interaction;
18. Dripping Fangs tank swap;
19. pair rotation:
    - Flame + Shadow
    - Shadow + Blood
    - Blood + Flame
    - repeat.

### Recommended abstraction level

The full simulation should **not** attempt to reproduce:

- player DPS rotations;
- real spell healing;
- class-specific defensive cooldown values;
- exact boss/raid health;
- damage scaling by item level.

Instead, use mechanic states:

```text
safe
warning
major_error
lethal_error
```

and normalized health/pressure where necessary.

---

# 18. Background Mechanics

These matter in the real raid but probably do not need deep interactive simulation.

## Fountain Expulsion raid damage

- Hemo Expulsion
- Gloom Expulsion
- Conflagrating Expulsion

Represent as ambient/healing pressure tied to Infusion stacks.

---

## Toxic Vapor

Represent as accumulating raid pressure / soft enrage.

---

## Burning Presence

Its tactical effect is already represented by making Burning Venoms high priority.

Exact raid damage need not be simulated.

---

## Infection DoT damage

The relevant player skill is positional handling.

Exact ticking health loss can be abstracted unless implementing a healer-specific mode.

---

## Dripping Fangs numerical damage

The trainer needs:

- cast recognition;
- one-stack swap;
- boss positioning.

It does not need exact tank-health simulation.

---

## Exact raw heal-absorb numbers

Use normalized progress bars where possible.

Keep the real tooltip values in data/reference notes for later calibration.

---

# 19. Open / Unverified Details

These should be revisited after Season 2 raid combat logs are available.

## High priority

1. **Malignant Tumor final behavior**
   - Does Plague Wave directly destroy the Tumor?
   - Or does it remove Hardened Tumor and require DPS afterward?
   - Or was the package replaced by Malignant Totems using Malignance?
   - The current Wowhead page contains both Tumor and Totem descriptions after a documented PTR rework.

2. **Tumor Burst spell ID and cast/activation timer**
   - Do not invent this value.
   - Confirm from live logs.

3. **Number of Tumors per spawn event**
   - Random positioning is clear.
   - Exact count is not stable enough to encode here.

4. **“Two Plague Froth sets to clear Tumors” rule**
   - This is explicit in the supplied strategy.
   - Needs live-log confirmation as an encounter rule versus a guide-specific cadence observation.

5. **Adaptive Infection target counts**
   - Supplied transcript: 2 targets per active infection type.
   - Current external text: “several.”
   - Confirm with combat logs.

6. **Can the same player receive both active Infection variants?**
   - Keep targets unique by default until confirmed.

7. **Exact Adaptive Infection cadence**
   - No reliable timestamp is assigned in this spec.

8. **Plague Froth final aura duration**
   - current Wowhead: 6s;
   - Method: 8s;
   - older PTR journal: 4s.
   - Use 6s provisionally.

9. **Plague Froth target count**
   - Keep configurable; confirm full-mechanic live count.

10. **Exploding Infection duration and exact distance-falloff formula**
    - Current player-facing page exposes removal behavior but not a stable exact duration/falloff curve.
    - Do not invent a threshold.

11. **Exploding Infection stack effect**
    - Current full-mechanic text says it gains a stack every 1.5s until dispelled.
    - Exact consequence/scaling of those stacks should be verified.

12. **Dripping Fangs Physical vulnerability**
    - older data / some guide prose: +100%;
    - current encounter tooltip: +200%;
    - underlying spell tuning has shown additional variation.
    - Trainer rule remains swap after every cast.

## Medium priority

13. **Congealing Bolt current status**
    - older PTR data: 5% stacking slow for 5s;
    - absent from current 2026-08-10 Wowhead hierarchy.
    - Keep disabled/configurable until confirmed.

14. **Congealing Bolt targeting**
    - supplied transcript implies nearest player;
    - earlier journal says nearby players.
    - Verify.

15. **Hardened Venom scope**
    - 60s timeout is verified;
    - confirm whether it applies to all Living Venoms or only a subset.

16. **Umbral Ejection missile/impact count and distribution**
    - 3-yard impact radius is current;
    - exact spawn pattern still needs log/video verification.

17. **Catalytic Bile impact count**
    - requirement of at least one player per circle is current;
    - exact number per cast should come from logs.

18. **Catalytic Bile spawn-distance bounds**
    - testing feedback says the mechanic was adjusted closer to Vashnik.
    - exact geometry is not known.

19. **Living Venom movement speeds**
    - needed only if the add-control trainer is tuned against real encounter pacing.

20. **Exact boss energy gain rate**
    - do not infer from edited video.
    - use event-driven 100-energy trigger until logs are available.

21. **Infusion duration**
    - current guide: 90s;
    - older PTR journal: 120s.
    - use 90s provisionally.

22. **Infusion damage scaling**
    - current guide/tooltips: +100% Expulsion damage and +50% add health per stack;
    - supplied transcript says +200% Expulsion per stack.
    - use current +100/+50 default and recheck live.

---

# 20. Implementation Constants — Initial Recommended Defaults

These are intended as data, not hard-coded encounter logic.

```text
FROTH_DURATION_SECONDS = 6
FROTH_PROXIMITY_RADIUS_YARDS = 4.5
FROTH_TARGET_COUNT = 5                 // provisional; verify live

PLAGUE_WAVE_DIRECTIONS = 4             // cardinal, arena-fixed

CATALYTIC_BILE_RADIUS_YARDS = 6
CATALYTIC_BILE_MIN_SOAKERS = 1

STYGIAN_BURST_RADIUS_YARDS = 6

SIPHON_BLOOD_RADIUS_YARDS = 10
SIPHON_BLOOD_INTERVAL_SECONDS = 1.5

DRIPPING_FANGS_CAST_SECONDS = 2
DRIPPING_FANGS_DURATION_SECONDS = 32
DRIPPING_FANGS_SWAP_AT_STACKS = 1

BURNING_PRESENCE_INTERVAL_SECONDS = 3
CAUSTIC_SURGE_DOT_SECONDS = 3
CAUSTIC_SURGE_TICK_SECONDS = 1

MALIGNANT_BURST_CAST_SECONDS = 1.5
MALIGNANT_BURST_DOT_SECONDS = 30
MALIGNANT_BURST_DOT_TICK_SECONDS = 3

HARDENED_VENOM_AFTER_SECONDS = 60
HARDENED_VENOM_SPEED_MULTIPLIER = 1.5

INFUSION_DURATION_SECONDS = 90
INFUSION_EXPULSION_DAMAGE_PER_STACK = 1.00
INFUSION_ADD_HEALTH_PER_STACK = 0.50

BURNING_VENOM_COUNT = 2
SHROUDED_VENOM_COUNT = 5
CLOTTING_GENERATIONS = [1, 2, 4]

INFECTION_TARGETS_PER_ACTIVE_TYPE = 2  // transcript-derived; verify live

TUMOR_MODE = "destroy_on_wave"          // provisional strategy-compatible default
TUMOR_ALLOWED_FROTH_SETS = 2            // transcript-derived; verify live
```

Any constant marked provisional should live in encounter data/configuration.

---

# 21. Spell Reference

| Spell | Spell ID | Relevant timing | Trainer relevance |
|---|---:|---|---|
| Imbibe | 1283164 | Instant; triggers at 100 energy | Selects two nearest fountains; core state transition |
| Blood Infusion | 1293969 | 90s aura, stacking | Scales Blood package |
| Shadow Infusion | 1293968 | 90s aura, stacking | Scales Shadow package |
| Flame Infusion | 1293971 | 90s aura, stacking | Scales Flame package |
| Hemo Expulsion | 1298582 | Instant | Background Blood raid pressure |
| Gloom Expulsion | 1298583 | Instant | Background Shadow raid pressure |
| Conflagrating Expulsion | 1298587 | Instant | Background Flame raid pressure |
| Sanguineous Fortitude | 1291530 | Passive | Initial Blood add cannot be CC'd |
| Splitting Clot | 1286631 | On death | Blood add generation 1 → 2 → 4 |
| Miasmic Coating | 1312366 | Passive absorb = 100% max HP | Shadow add effective-health mechanic |
| Congealing Bolt | **Unverified** | Earlier PTR: 5s, stacking 5% slow | Optional Shadow-add pressure |
| Umbral Ejection | 1286737 | On death; 3yd impacts | Dodge Shadow add death zones |
| Burning Presence | 1305902 | 3s pulse | Makes Flame adds priority |
| Caustic Surge | 1285979 | 3s stacking DoT; 1s tick | Stagger Flame add deaths |
| Hardened Venom | 1314837 | After 60s alive | Add timeout; +50% speed + CC immunity |
| Toxic Vapor | 1284561 | 2s damage tick; stacking | Soft-enrage/background pressure |
| Malignant Burst | 1280189 | 1.5s cast; 30s DoT; 3s tick | Major failure if add reaches cavity |
| Malignant Catalyst | 1282525 | Instant/triggered | Creates Catalytic Bile |
| Catalytic Bile | 1282601 | Instant impact; 6yd radius | Every impact needs ≥1 player |
| Plague Froth | 1281907 | Current: 6s aura; 1s tick; 4.5yd radius | Spread + prepares wave geometry |
| Plague Wave | 1295798 | On Froth expiry; 4 cardinal waves | Dodge + Tumor interaction |
| Dripping Fangs | 1280935 | 2s cast; 32s debuff; 2s DoT tick | Tank swap after each cast |
| Adaptive Infection | 1282184 | Instant dispatcher; 20s hidden aura in current spell data | Maps active fountains to infection variants |
| Siphoning Infection | 1295224 | 1.5s damage tick; heal absorb; -100% healing received | Two-camp Blood mechanic |
| Siphon Blood | 1295229 | 1.5s pulse; 10yd radius | Nearby allies heal infected target |
| Thinned Blood | 1314273 | Duration/application rule unverified | Punishes repeated Siphon Blood exposure |
| Exploding Infection | 1295173 | 1.5s damage tick; removal-triggered | Run far before removal |
| Caustic Explosion | 1295209 | Instant on infection removal | Distance-sensitive raid explosion |
| Stygian Infection | 1294994 | 1.5s damage tick; heal absorb | Continuous controlled movement |
| Stygian Burst | 1302489 | Instant; current 6yd radius | Dodge trail eruptions |
| Malignance | 1304459 | Current database exposes a long NPC/totem cast and stacking 1min DoT; shipped behavior uncertain | Competing Malignant Totem variant; do not enable by default |
| Hardened Tumor | **Unverified** | Earlier PTR: 99% DR until Plague Wave | Tumor interaction variant |
| Tumor Burst | **Unverified** | Earlier PTR: stacking 1min raid DoT; cast timing unverified | Failure for unresolved Tumor |

---

# 22. Verification Basis

Sources checked for this specification:

- Blizzard official **The Venomous Abyss** raid/Season 2 announcement.
- Current Wowhead **Vashnik the Malignant** encounter guide, updated 2026-08-10.
- Current Wowhead individual spell data for the spell IDs listed above.
- Icy Veins **Vashnik Raid Guide**, updated 2026-08-13.
- Method **Vashnik the Malignant** guide, updated 2026-08-13.
- Blizzard PTR feedback thread for **The Venomous Abyss (Mythic)**, especially the documented Malignant Tumor rework.
- Earlier Patch 12.1 Dungeon Journal snapshots where current sources no longer expose a mechanic such as Congealing Bolt.

### Source-use policy for this spec

The supplied guide transcript remains the source of the intended raid strategy and pair rotation.

External sources were used to:

- correct spell names;
- verify spell IDs;
- verify mechanical radii/timings;
- resolve obvious speech-to-text errors;
- identify pre-release mechanics that changed;
- avoid treating guide-video editing as encounter timing.

Where external data conflicts with the supplied strategy or with another current source, the conflict is explicitly documented instead of being silently resolved.

---

# 23. Recommended First wow-trainer Implementation Slice

If implementing incrementally, the best first playable version is:

```text
1. Fixed arena + three fountain anchors + central cavity
2. Boss movement and two-nearest-fountain Imbibe
3. Pair rotation:
   Flame+Shadow → Shadow+Blood → Blood+Flame
4. Adaptive Infection pair mapping
5. Three infection movement patterns
6. Plague Froth cross waves
7. Random Tumors + destroy-on-wave behavior
8. Success/failure scoring
```

Then add:

```text
9. Living Venom add movement
10. Fire death staggering
11. Blood splitting
12. Shadow death impacts
13. Catalytic Bile
14. Dripping Fangs tank-position module
15. Infusion stack/expiry system
16. Toxic Vapor soft-enrage pressure
```

This order prioritizes the mechanics with the most real practice value and avoids spending early implementation effort on passive damage simulation.
