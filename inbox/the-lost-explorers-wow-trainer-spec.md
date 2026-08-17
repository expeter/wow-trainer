# The Lost Explorers — wow-trainer Encounter Specification

**Encounter:** The Lost Explorers\
**Raid:** The Venomous Abyss\
**Research snapshot:** 2026-08-16\
**Primary strategy source:** supplied German guide transcript\
**Purpose:** implementation-oriented encounter definition for **wow-trainer**

> This specification preserves the strategy described in the supplied transcript, especially the intended Ultimate order **Scrollsage Iku → Trader Gebbo → First Mate Nama**. External sources are used to correct names and verify mechanics, spell IDs, durations, radii, and other numerical values. Where current game data conflicts with the transcript, the conflict is called out explicitly rather than silently replacing the transcript strategy.

---

## 1. Encounter Model

The Lost Explorers is a three-target council-style encounter involving:

- **Trader Gebbo**
- **Scrollsage Iku**
- **First Mate Nama**
- **Mor'zahi**, an untargetable controller in the center of the arena

The three tortollans have independent health pools in the encounter model used by the supplied strategy. Mor'zahi is not a damage target.

The core encounter loop is built around four simultaneous responsibilities:

1. Keep **exactly two tortollans close enough for cleave** while preventing all three from entering the United Defense radius.
2. Manage Mor'zahi's energy by obtaining a **Disgusting Fish** from Gebbo's crates and throwing it to a possessed tortollan before Final Ascension resolves.
3. Handle the chosen tortollan's empowered / Ultimate mechanic after Mor'zahi retakes control.
4. Bring the three tortollans to death at nearly the same time because surviving explorers gain severe ally-death punishments.

### Important source-status note

As of this research snapshot, Blizzard lists The Venomous Abyss as opening on **2026-08-18**. The encounter values below therefore come primarily from the current Patch 12.1 Dungeon Journal / Wowhead live database and PTR-derived spell data rather than broad live combat-log samples.

---

## 2. Core State and Suggested Simulator Variables

```text
EncounterState
  morzahiEnergy: 0..100
  finalAscensionActive: boolean

  gebboHp: 0..100
  ikuHp: 0..100
  namaHp: 0..100

  gebboAlive: boolean
  ikuAlive: boolean
  namaAlive: boolean

  gebboEmpowered: boolean
  ikuEmpowered: boolean
  namaEmpowered: boolean

  gebboFishUsed: boolean
  ikuFishUsed: boolean
  namaFishUsed: boolean

  activeCrates[]
  activeFish: optional
  activeMushrooms[]
  activeBomb: optional
  activeBlastWave: optional
  spreadingFlamesZones[]

  activeFirePatches[]
  activeFrostPatches[]
  burningFlamesPlayers[]
  piercingFrostPlayers[]

  activeAftershockZones[]
  activeShellProjectiles[]

  unitedDefenseActive: boolean

  tankIkuShardStacks
  tankNamaSteadyStrikeStacks
```

### Suggested high-level encounter states

```text
BASE
  ↓
FISH_AVAILABLE
  ↓
CONTROL_BREAK
  ↓
MORZAHI_REPOSSESSION
  ↓
IKU_ULTIMATE | GEBBO_ULTIMATE | NAMA_ULTIMATE
  ↓
BASE
  ↓
DEATH_RACE
  ↓
VICTORY
```

Possible hard-failure state:

```text
FINAL_ASCENSION → FAIL
```

The trainer does not need a full WoW combat model. Health and healing can be abstracted into:

- mechanic success / failure;
- avoidable-damage strikes;
- raid-stress meter;
- personal survival;
- boss-health synchronization score.

---

# 3. Global Encounter Mechanics

## United Defense — Spell ID 1297646 — active while all three explorers are within 30 yd

### What happens

When **First Mate Nama, Scrollsage Iku, and Trader Gebbo are all within 30 yd of one another**, all three reduce incoming damage by **99%**.

This converts the encounter into a positional two-target cleave fight: two bosses should normally be together while the third remains separated.

### Telegraph

- Shield / defensive visual on the tortollans.
- Boss frames can show the United Defense aura.
- For wow-trainer, a clear three-boss proximity warning is more useful than reproducing the exact visual.

### Targeting

All three tortollans.

### Required reaction

Move one boss out so that the three-way 30 yd condition is broken.

The supplied strategy uses:

- **Gebbo + Iku** together at the pull.
- **Nama** tanked separately, approximately opposite Gebbo's route.
- During specific Ultimates, the two controlled/tanked bosses may be regrouped differently.

### Success condition

At least one of the three pairwise positional relationships prevents all three bosses from satisfying the shared 30 yd cluster condition.

### Failure conditions

- All three bosses remain inside the 30 yd cluster.
- Raid damage is spent into the 99% reduction for a prolonged period.
- Positional correction causes another mechanic failure.

### wow-trainer implementation notes

Model each boss as a point with a collision radius.

```text
if max pairwise grouping condition indicates all 3 within 30 yd:
    unitedDefenseActive = true
else:
    unitedDefenseActive = false
```

Better implementation: use the actual condition "Nama, Iku and Gebbo are all within 30 yd of each other" rather than a generic centroid radius.

Trainer scoring:

- `WARN_UNITED_DEFENSE`
- escalating score penalty while active;
- optional hard failure if active for configurable number of seconds.

No exact tolerated duration should be hard-coded from source data.

---

## Ally-Death Escalation — three separate survivor punishments

The three bosses should die as close together as practical.

### Relationship

```text
First tortollan dies
  ↓
surviving tortollans gain ally-death punishments
  ↓
second boss must die quickly
  ↓
last boss must be finished immediately
```

The transcript recommends **Trader Gebbo as the last survivor if perfect synchronization is impossible**. Current spell data supports the logic: Iku and Nama have especially severe escalating survivor effects.

---

## Cataclysmic Invocation — Spell ID 1291390 — 7.0s cast

### What happens

If one of Iku's allies dies while Iku remains alive, she begins casting a raid-wide explosion. The damage increases with subsequent casts.

The spell data also contains a **+30% damage-from-caster modifier** associated with the effect, with 1 minute metadata.

### Telegraph

- 7.0s cast bar from Scrollsage Iku.

### Targeting

Whole raid.

### Required reaction

Do not leave Iku substantially behind in health. Kill her immediately after / with the other explorers.

### Success condition

Iku dies before repeated Cataclysmic Invocation casts make the end of the encounter unsustainable.

### Failure conditions

- Boss-health desynchronization.
- Multiple Invocation casts.
- Finishing another boss while Iku is still high HP.

### wow-trainer implementation notes

In a trainer, this is primarily a **health synchronization pressure mechanic**, not a movement module.

---

## Relentless Escalation — Spell ID 1296227 — +100% damage every 1s for 30s after an ally dies

### What happens

If one of Nama's allies dies while Nama remains alive, Nama gains **100% increased damage every 1 second for 30 seconds**.

### Required reaction

Nama must be nearly dead when the first explorer dies.

### Failure conditions

- Nama survives long enough for the ramp to become lethal.
- A tank mechanic overlaps after multiple ramp stacks.

### wow-trainer implementation notes

Represent as rapidly increasing danger after an ally death. Exact damage simulation is unnecessary; a short kill deadline / escalating tank-failure meter is sufficient.

---

## Smashing Shovel — Spell ID 1296252 — instant survivor aura

### What happens

If one of Gebbo's allies dies while Gebbo remains alive, his strikes gain additional Physical damage and knock players back.

This corrects an apparent speech-to-text problem in the transcript: the knockback occurs when **an ally is defeated while Gebbo survives**, not after Gebbo himself is dead.

### Required reaction

Finish Gebbo immediately after the other explorers.

### wow-trainer implementation notes

This can be modeled as:

- periodic radial / directional player knockback while Gebbo is the final survivor;
- increased pressure but less complex than Iku's repeated raid explosion or Nama's explosive damage ramp.

This is why the supplied strategy's preference to leave Gebbo last is reasonable.

---

# 4. Mor'zahi: Control and Encounter Timer

## Dark Whispers — Spell ID 1295451 — 7.0s cast

### What happens

Mor'zahi establishes control over the tortollan explorers.

The control relationship explains why the explorers become hostile and why breaking Mor'zahi's concentration with a fish temporarily disrupts the encounter.

### Telegraph

Primarily encounter-state / possession visuals.

### Targeting

The controlled tortollans.

### Required reaction

No direct player counterplay at pull.

### wow-trainer implementation notes

Treat as setup state:

```text
onPull:
    Iku.possessed = true
    Gebbo.possessed = true
    Nama.possessed = true
```

Do not make the player interact with this cast unless live data later demonstrates meaningful pull-time counterplay.

---

## Malevolent Presence — Spell ID 1295449 — passive / damage every 2s

### What happens

Mor'zahi deals raid-wide Shadow damage every **2 seconds**.

### Telegraph

Passive encounter aura.

### Targeting

Whole raid.

### Required reaction

Healer background responsibility only.

### wow-trainer implementation notes

Do not simulate this as a detailed mechanic. Use it only as:

- background raid-stress;
- reason that avoidable failures cannot be ignored;
- optional healing-pressure modifier.

---

## Evil Eyes — Spell ID 1292388 — instant / 3 yd impacts / 5s internal aura metadata

### What happens

Statues in the chamber project spirit-flame impacts at players. Each impact damages players within **3 yd**.

The supplied transcript identifies these as small green ground impacts that must be dodged.

The spell data has a hidden/internal **5s aura** with a **0.5s trigger interval**. This should not automatically be interpreted as a 5-second player telegraph.

### Telegraph

- Small green / spirit-flame ground impacts.

### Targeting

Player locations.

Exact target count and selection cadence are not verified.

### Required reaction

Step out of the impact locations.

### Success condition

No contact with a 3 yd impact.

### Failure conditions

- Hit by Evil Eyes.
- Dodging into a crate, shell, Frostfire circle, or other active hazard.

### wow-trainer implementation notes

Use small randomized circles around relevant player / raid positions.

This mechanic becomes most useful when layered with:

- Throw Junk;
- Shell Spin;
- Frostfire Volley positioning.

---

## Final Ascension — Spell ID 1292779 — costs 100% energy / 5.0s cast-channel / damage every 0.5s

### What happens

Mor'zahi builds energy throughout the fight. At full energy he can begin Final Ascension.

The verified spell:

- costs **100% of base energy**;
- has a **5.0s cast/channel**;
- is flagged as an **unbreakable channel**;
- triggers raid-wide Shadow damage every **0.5s**.

The Encounter Journal describes allowing Final Ascension to finish / channel as deadly.

### Telegraph

- Mor'zahi energy reaches 100.
- 5.0s Final Ascension cast/channel.

### Targeting

Whole raid.

### Required reaction

The practical counterplay occurs **before** the lethal state:

1. Obtain the Disgusting Fish from Gebbo's crate.
2. Use it on an eligible possessed tortollan.
3. Break Mor'zahi's concentration before Final Ascension resolves.

### Success condition

Fish is used in time and Mor'zahi's energy is expended/reset by the control-break / repossession cycle.

### Failure conditions

- Fish not found in time.
- Fish crate left unresolved.
- Player holding the fish fails to throw it.
- Wrong / ineligible tortollan selected.
- Final Ascension reaches its lethal resolution.

### wow-trainer implementation notes

This should be a core fail condition.

Do **not** invent Mor'zahi's energy-per-second rate. Until logs provide a reliable generation rate, configure the trainer using a tunable encounter deadline rather than claiming a real-game interval.

Example:

```text
if morzahiEnergy >= 100:
    start FinalAscension(5.0s)

if validFishHit before lethal resolution:
    cancel/prevent FinalAscension
    begin controlBreakSequence
else:
    FAIL_MORZAHI_ASCENSION
```

---

## Disgusting Fish — NPC ID 265670 — extra-action interaction; throw spell ID unverified

### What happens

One of Gebbo's crates contains a Disgusting Fish.

A player obtains the fish and throws it to a possessed tortollan. This interrupts Mor'zahi's concentration and causes Mor'zahi to retake control of that tortollan with Mor'zahi's Command, granting that tortollan its empowered / Ultimate ability.

### Telegraph

- Fish object revealed from a destroyed crate.
- Extra Action Button in the real encounter.

### Targeting

A possessed tortollan that is eligible to receive the fish.

### Required reaction

Pick up the fish, then throw it to the raid's planned target before Mor'zahi reaches the lethal state.

The supplied strategy chooses:

1. Scrollsage Iku
2. Trader Gebbo
3. First Mate Nama

### Success condition

The intended boss receives the fish in time.

### Failure conditions

- No player picks up the fish.
- Fish holder is out of useful position.
- Fish used too late.
- Fish thrown to the wrong boss, changing the planned Ultimate order.
- Attempting to reuse a boss if the current "one fish per tortollan" restriction applies.

### wow-trainer implementation notes

Model as a temporary player action:

```text
player.hasFish = true
ExtraActionButton = enabled

onFishThrow(targetBoss):
    validate eligibility
    consume fish
    trigger controlBreak
    schedule targetBoss ultimate
```

A useful module can randomize:

- which crate contains the fish;
- fish-holder player;
- boss positions at the moment the fish becomes available.

---

## Fishy Feedback — Spell ID 1313303 — 12s / damage every 2s

### What happens

Breaking Mor'zahi's concentration causes an initial raid hit followed by Shadow damage every **2s for 12s**.

### Targeting

Whole raid.

### Required reaction

No positional counterplay. The raid should avoid stacking unnecessary avoidable damage during this window.

### wow-trainer implementation notes

Background pressure. Use as a temporary "mistakes are more expensive" state around each successful fish use.

---

## Mor'zahi's Command — Spell ID 1297022 — control reassertion; exact scripted delay unverified

### What happens

After concentration is broken, Mor'zahi retakes control of the fish-targeted tortollan and grants that boss additional abilities.

The current database entry contains long aura/cast metadata that appears to function as encounter scripting/container data. It should **not** be interpreted as a verified one-minute player reaction timer.

### Relationship

```text
Destroy crate
  ↓
Find fish
  ↓
Throw fish at chosen tortollan
  ↓
Mor'zahi concentration broken
  ↓
Fishy Feedback (12s)
  ↓
Mor'zahi's Command
  ↓
Chosen tortollan uses Ultimate mechanic
```

### wow-trainer implementation notes

Use a short configurable scripted transition based on observed live behavior later. Do not expose an invented exact delay in the UI.

---

# 5. Trader Gebbo Mechanics

## Gebbo movement — strategy behavior from supplied transcript

The supplied strategy describes Trader Gebbo as continuously moving around the arena on a circular route.

This movement is tactically important because the raid tries to keep Iku near Gebbo for cleave while tanking Nama roughly opposite the moving pair.

### wow-trainer implementation notes

A normalized arena representation is sufficient:

```text
arena center = (0,0)
Gebbo follows radius R on a circular path
direction = configurable
```

The transcript describes the raid progressing **counter-clockwise** relative to this route. Exact arena radius and Gebbo movement speed are not verified and should remain tunable.

---

## Throw Junk — Spell ID 1291933 — 3.0s cast / 3 yd impact

### What happens

Gebbo throws crates at player locations.

Verified data:

- **3.0s cast**
- crate impact damages players within **3 yd**
- stepping on a crate destroys / opens it
- destroying a crate applies Splinters
- one crate can reveal the Disgusting Fish / relic interaction needed for Mor'zahi

The current spell data has difficulty-dependent / evolving target-count metadata. Do not hard-code the number of crates from the database without log verification.

### Telegraph

- Throw Junk cast bar.
- Ground impact marker / falling crate.
- Persistent crate object.

### Targeting

Player locations.

Exact number of crate targets per cast should be configurable.

### Required reaction

1. Dodge the crate impact.
2. Clear crates deliberately by stepping on them.
3. Space crate clears to control Splinters pressure.
4. Identify and collect the fish.
5. Keep the room reasonably crate-free before movement-heavy Ultimates.

The supplied transcript recommends clearing crates at roughly **6-second intervals**. This is a raid strategy spacing value, **not a verified Throw Junk cooldown**.

### Success condition

- No one is hit by crate landing.
- Crates are cleared before Relic Rupture.
- Fish is found and used before Final Ascension.
- Arena does not become cluttered.

### Failure conditions

- Hit by crate impact.
- Multiple crate stomps create uncontrolled bleed pressure.
- Crate remains too long.
- Fish inaccessible during Blink Nova / Ultimate movement.
- Accidental crate stomp during Gebbo's Blast Wave sequence.

### wow-trainer implementation notes

Crates should be persistent colliders.

Randomize:

- targeted player positions;
- which crate contains the fish;
- number of crates within a configurable data profile.

Useful scoring:

- `FAIL_CRATE_IMPACT`
- `WARN_CRATE_OVERDUE`
- `FAIL_RELIC_RUPTURE`
- `WARN_EXCESSIVE_SPLINTERS`
- `FAIL_FISH_NOT_RECOVERED`

---

## Splinters — Spell ID 1308853 — 8s / ticks every 1s / stacks

### What happens

In the standard current data profile, the player who stomps a crate receives a stacking Bleed for **8s**, ticking every **1s**.

The supplied transcript matches this 8-second stacking bleed and recommends bleed removals / immunities to allow selected players to clear multiple crates safely.

### Telegraph

- Splinters debuff stack on crate stomper.

### Targeting

The player who destroys the crate.

### Required reaction

- Deliberately assign / pace crate clearing.
- Avoid accidental crate contact.
- Use bleed removal or immunity tools if the chosen raid strategy supports it.

### Success condition

Crates are cleared without dangerous simultaneous stacks.

### Failure conditions

- Same player unintentionally accumulates excessive stacks.
- Multiple players trigger crates simultaneously during raid-damage windows.
- Crates are ignored to avoid the bleed and then trigger Relic Rupture.

### wow-trainer implementation notes

For a movement simulator, model Splinters as a **stack counter + danger score** rather than full health.

---

## Splinters raid-wide variant — Spell ID 1312868 — 6s raid bleed / ticks every 1s / stacks

Current data also contains a stricter crate-stomp variant in which opening a crate:

- immediately damages the raid;
- applies a stacking raid-wide Bleed;
- Bleed lasts **6s**;
- ticks every **1s**.

The Encounter Journal currently associates this with a higher-difficulty data profile.

Because wow-trainer is intended to combine relevant encounter mechanics rather than split the spec into difficulty chapters, implement this as a **configurable high-fidelity modifier** on the same Throw Junk system.

Do not merge the incompatible 8s personal and 6s raid-wide durations into one fake value.

Recommended config:

```text
splintersMode:
  PERSONAL_8S
  RAID_WIDE_6S
```

The complete encounter module can default to the profile the guild intends to train.

---

## Relic Rupture — Spell ID 1310027 — triggers after 25s untouched

### What happens

The relic inside a crate ruptures if left untouched for **25 seconds**, dealing major raid-wide Shadow damage.

The transcript specifically treats the fish/relic-containing crate as something the raid cannot leave indefinitely.

### Telegraph

- Persistent unresolved crate / relic.
- Trainer should show an age indicator only if the actual UI provides equivalent awareness; otherwise use subtle urgency.

### Required reaction

Destroy/open relevant crates before 25s.

### Success condition

No relic reaches the 25s rupture threshold.

### Failure conditions

- Any tracked relic crate reaches 25s.
- Player deliberately leaves fish crate untouched and forgets it.

### wow-trainer implementation notes

Hard deadline:

```text
crate.relicAge >= 25.0 → FAIL_RELIC_RUPTURE
```

Whether every Throw Junk set contains exactly one rupture-capable relic should be verified from logs.

---

# 6. Trader Gebbo Ultimate Sequence

The supplied strategy treats Gebbo's Ultimate as a linked sequence:

```text
Mushroom Toss
  ↓
bait one useful mushroom
  ↓
Explosive Surprise target selected
  ↓
bomb placed at outer edge, opposite mushroom
  ↓
Concussive Blast + Blast Wave
  ↓
raid waits for wave to approach
  ↓
first player touches mushroom
  ↓
raid is launched over wave
  ↓
Fungal Burst removes the used mushroom
  ↓
avoid residual Spreading Flames
```

This relationship is one of the highest-value mechanics to practice in wow-trainer.

---

## Mushroom Toss — Spell ID 1292104 — 7.0s cast

### What happens

Gebbo tosses Bouncy Mushrooms at player locations.

Touching a mushroom launches a player into the air and perturbs the mushroom, starting Fungal Burst.

### Telegraph

- 7.0s Mushroom Toss cast.
- Mushroom spawned at targeted player location.

### Targeting

Player location(s).

Exact target count per cast should be verified from logs.

### Required reaction

Before the cast resolves, the raid should be grouped where the strategy wants the mushroom to spawn.

After spawn:

- **do not touch it early**;
- preserve it for the incoming Blast Wave.

### Success condition

Mushroom appears in the planned location and remains unused until the wave jump.

### Failure conditions

- Mushroom baited in a bad location.
- Player accidentally touches mushroom early.
- Mushroom is consumed before Blast Wave.
- Raid is too dispersed to use the mushroom coherently.

### wow-trainer implementation notes

Spawn mushroom at selected player position with collision disabled for a short visual spawn grace only if observed in game; otherwise immediate collision.

Core failure:

- `FAIL_MUSHROOM_EARLY_TRIGGER`

---

## Fungal Burst — Spell ID 1305618 — 5.0s cast / 5 yd radius

### What happens

Once a Bouncy Mushroom has been touched, it becomes perturbed and bursts after a **5.0s** delay/cast, damaging players within **5 yd**.

### Required reaction

After using the mushroom to jump:

- move away from its location;
- do not remain within 5 yd when Fungal Burst resolves.

### wow-trainer implementation notes

A used mushroom:

```text
state = PERTURBED
burstTimer = 5.0
after 5.0:
    damage radius 5 yd
    despawn
```

---

## Explosive Surprise — Spell ID 1297625 — 10s target marker / 10 yd impact

### What happens

One player is marked for **10 seconds**. Gebbo then throws a bomb to that player's location.

Verified:

- one target in current spell data;
- **10s target aura**;
- bomb impact radius **10 yd**.

The supplied transcript calls out a red arrow over the target.

### Telegraph

- Red arrow / target marker from the transcript.
- 10s targeted debuff.

### Targeting

One player.

### Required reaction

The marked player moves the bomb to the assigned outer-edge location, opposite the mushroom.

The player must also move out of the final bomb impact location rather than treating the marker as a soak.

### Success condition

- Bomb lands at the planned edge position.
- No unnecessary players are inside 10 yd.
- Raid has enough distance/time to react to the resulting wave.

### Failure conditions

- Bomb dropped in the raid.
- Bomb dropped near the mushroom.
- Bomb placed too centrally, shortening wave reaction time.
- Marked player remains in the 10 yd impact.

### wow-trainer implementation notes

This should be a spatial-placement scoring mechanic, not simply "dodge circle."

Score bomb placement by:

- distance from arena center;
- distance from mushroom;
- free wave-travel corridor;
- collateral players in 10 yd.

---

## Concussive Blast — Spell ID 1296247 — instant / 10 yd / 12s DoT

### What happens

The bomb explodes:

- damages and knocks back players within **10 yd**;
- affected players suffer a Fire DoT for **12s**, ticking every **1s**;
- triggers the Blast Wave.

The spell-detail aura metadata contains a longer container duration, but the ability tooltip explicitly states the gameplay DoT is **12s**. Use 12s for trainer behavior.

### Required reaction

No player should be within 10 yd at detonation.

---

## Blast Wave — Spell ID 1305844 — contact applies 10s DoT / ticks every 1s

### What happens

The bomb creates a traveling shockwave.

Contact is extremely dangerous and applies a **10s** Fire DoT ticking every **1s**.

The Encounter Journal explicitly states the wave can be avoided using the Bouncy Mushrooms.

### Telegraph

- Expanding / traveling wave from bomb position.

### Targeting

Arena geometry rather than a player target.

### Required reaction

The supplied strategy intentionally waits until the wave has approached, then the raid uses the mushroom to become airborne and pass over it.

### Success condition

Player is airborne / outside the wave collision volume when the wave crosses their position.

### Failure conditions

- Player touches Blast Wave.
- Mushroom used too early and player lands before wave crossing.
- Mushroom used too late.
- Player is separated from the mushroom.
- Tank remains outside and cannot cross the wave.

### wow-trainer implementation notes

This is a top-priority standalone module.

The exact radial propagation speed is **not verified**. Keep it configurable after live-log / video-frame validation.

Collision model:

```text
waveRadius(t) = configurableSpeed * elapsed
waveThickness = configurable
if player grounded and intersects wave band:
    FAIL_BLAST_WAVE_HIT
```

---

## Spreading Flames — Spell ID 1297650 — persistent hazard / ticks every 1s

### What happens

The bomb leaves / creates a large fire hazard that deals damage every **1s**.

The supplied transcript says the area persists, then later becomes smaller / disappears.

Current spell data does **not** expose a reliable fixed lifetime for the area.

### Required reaction

Place bombs at the outer edge so the persistent hazard consumes as little useful space as possible.

### wow-trainer implementation notes

Treat as persistent zone with a configurable lifetime and shrink curve.

Do not label the configured trainer lifetime as verified real-game timing until logs confirm it.

---

## Gebbo Ultimate: supplied strategy positioning

The transcript describes:

1. Raid stacks on the active cleave bosses before Mushroom Toss so the mushroom is consistently baited.
2. Explosive Surprise is taken to the outer edge, opposite the mushroom.
3. Tanks allow Gebbo to continue his route while **Iku + Nama** are brought together near the mushroom.
4. This also creates a convenient tank-swap opportunity.
5. Raid jumps the first Blast Wave.
6. On landing, a following mushroom may already appear: **do not immediately trigger it**.
7. Second bomb is placed at the outer edge near the previous fire-zone edge.
8. Raid uses the next mushroom for the next wave.
9. Temporary United Defense overlap may occur in the guide strategy. The transcript accepts a brief shield and then uses Iku's next Blink Nova positioning to separate the bosses again.
10. An immunity-based tank exception is mentioned in the transcript, but should be an advanced strategy toggle rather than required core behavior.

### wow-trainer implementation notes

The basic module should train steps 1–8.

The full encounter can later layer:

- United Defense positioning;
- Throw Junk crates that must **not** be accidentally stomped during the wave;
- tank placement;
- next Blink Nova.

---

# 7. Scrollsage Iku Mechanics

## Icebound Flames — Spell ID 1286922 — 4.0s cast / 12s Magic debuff / 1s ticks / 50% slow

### What happens

Iku casts Icebound Flames at a player.

If completed:

- large initial Frostfire hit;
- 12s Magic debuff;
- damage every **1s**;
- movement speed reduced by **50%**.

The debuff is Magic-dispellable.

### Telegraph

- 4.0s interruptible cast bar.

### Targeting

A player.

Exact role restrictions are not verified.

### Required reaction

**Interrupt the cast.**

If an interrupt is missed:

- dispel the Magic debuff quickly;
- compensate for the target's slow and damage.

The supplied strategy explicitly requires Iku to be interrupted immediately at pull so she moves into the intended cleave position with Gebbo.

### Success condition

Cast is interrupted.

### Failure conditions

- Missed interrupt.
- Interrupt unavailable due to Iku being out of range after Blink Nova.
- Debuff not dispelled after failed interrupt.
- Slowed player is then hit by another movement mechanic.

### wow-trainer implementation notes

Add an interrupt input / key action.

In a movement-only trainer, this can be abstracted as:

```text
cast starts
player has interrupt window 4.0s
success → cast cancelled
failure → debuff + score penalty
```

A full simulation should force the player to choose between movement and interrupt range.

---

## Blink Nova — Spell ID 1296021 — 7.0s cast; targeting aura Spell ID 1296025 — 7s / one player

### What happens

Iku targets one player, gathers power for **7.0s**, then teleports to that player's location and deals raid-wide Arcane damage.

Raid damage is lower the farther players are from Iku's target location.

### Telegraph

- 7s target debuff / marker on one player.
- 7s cast bar.

### Targeting

Current spell data: **one player**.

### Required reaction

The transcript's strategy is not simply "run as far away as possible."

Instead, the target places Blink Nova **slightly ahead in the counter-clockwise direction of Gebbo's route** so that:

- most of the raid gains useful distance and takes less damage;
- Iku teleports into a controlled forward location;
- Iku can quickly rejoin Gebbo for two-target cleave;
- Iku remains reachable if she is the planned fish target.

### Success condition

- Raid gets useful distance from the target.
- Iku teleports to the planned forward location.
- Iku can be repositioned back into the two-target cleave quickly.

### Failure conditions

- Target places Nova inside the raid.
- Target goes excessively far from the route and strands Iku.
- Fish becomes available but Iku is too far away to be targeted in time.
- Iku teleports close enough to Nama to create prolonged United Defense.

### wow-trainer implementation notes

This is a **placement quality** mechanic.

Score target position using:

- raid distance at resolution;
- distance from expected Gebbo forward path;
- distance from Nama;
- future fish accessibility.

Randomize which player receives the marker.

---

## Shredding Shards — Spell ID 1295854 — 3.5s channel / 0.5s ticks / 7 shard hits

## Shredding Shards vulnerability — Spell ID 1295858 — +50% per shard / 80s

### What happens

Iku channels at the active tank for **3.5s**, hitting every **0.5s**: seven shard events.

Each shard increases damage taken from later Shredding Shards by **50%**.

The vulnerability aura's precise database duration is **1.333 minutes = approximately 80 seconds**.

This corrects the transcript's speech-to-text implication that the vulnerability itself lasts only 3.5s; **3.5s is the channel duration**.

### Telegraph

- 3.5s channel on current tank.
- stacking Shredding Shards vulnerability.

### Targeting

Active Iku tank.

### Required reaction

The supplied strategy recommends a tank swap after each completed Shredding Shards sequence.

Tank timing must also account for:

- Nama's Steady Strikes;
- boss movement;
- Gebbo Ultimate wave positioning;
- United Defense.

### Success condition

Next Shredding Shards is not taken by a tank with dangerous residual vulnerability stacks.

### Failure conditions

- Same tank receives consecutive Shredding Shards sequences while stacks remain.
- Tank swap moves all three bosses together.
- Tank swap occurs during Blast Wave and strands a tank.

### wow-trainer implementation notes

For a non-tank module, keep as background.

For tank training:

```text
on each 0.5s shard:
    vulnerabilityStacks += 1

vulnerability expiration ≈ 80s
```

The simulator should emphasize **swap decision / boss positioning**, not tank DPS rotation.

---

# 8. Iku Ultimate: Frostfire Volley

## Frostfire Volley — Spell ID 1295893 — instant scripted activation / 10 yd impact radius

### What happens

Iku launches elemental missiles at several player targets.

Each target receives either a Fire or Frost effect.

At impact:

- damage occurs within **10 yd** around the targeted location;
- the targeted player receives the corresponding elemental debuff;
- a matching elemental patch remains on the ground;
- an impact that strikes a player already afflicted by Burning Flames or Piercing Frost triggers Elemental Explosion.

Exact number of targets is not reliably established by current spell metadata and should be configurable.

### Telegraph

- Large Fire circles on some players.
- Large Frost circles on other players.

### Targeting

Several raid members.

Exact count / role restrictions unverified.

### Required reaction

The transcript's formation:

- **Fire targets:** move to the outer ring / arena edge.
- **Frost targets:** place slightly inward, in front of the Fire positions.
- Unmarked raid members move farther inward and stay out of all impact circles.
- Circles / resulting patches may spatially overlap if no afflicted player is struck by another impact.
- After impacts:
  - Frost-debuff players enter Fire patches.
  - Fire-debuff players enter Frost patches.
- All players then regroup on the two active cleave bosses.

### Success condition

1. No Frostfire impact hits another already-afflicted player.
2. Each target creates a usable opposite-element patch layout.
3. Every Burning Flames / Piercing Frost player cancels their debuff with the opposite element.
4. Patches are removed cleanly.
5. Raid regroups quickly.

### Failure conditions

- Two targeted players overlap in a way that causes an afflicted player to be struck.
- An unmarked debuffed player is clipped by an impact.
- Player walks into same-element patch and gains no cleanse.
- Opposite patches are placed too far apart to reach safely.
- Piercing Frost player's slow prevents timely movement because patches were badly placed.
- Elemental Explosion triggers.

### wow-trainer implementation notes

This is a top-priority module.

Generate:

- N Fire targets;
- N Frost targets or a configurable distribution;
- positions relative to the player's current raid stack.

The trainer can represent AI raidmates as target circles and expected destination zones rather than fully simulated characters.

The controlled player may be:

- Fire target;
- Frost target;
- unmarked player.

Success requires both **placement** and **post-impact cleanse**.

---

## Elemental Explosion — Spell ID 1295952 — instant / raid-wide

### What happens

An invalid Frostfire interaction causes a raid-wide Frostfire explosion.

Current data describes a direct raid-wide hit; no additional verified duration is required.

### Failure condition

Use as a clear trainer failure:

- `FAIL_ELEMENTAL_EXPLOSION`

---

## Burning Flames — Spell ID 1295928 — 60s / 1s ticks / canceled by Frost

### What happens

Fire-marked players receive Burning Flames:

- lasts **60s** if not cleared;
- ticks every **1s**;
- canceled by a Frost effect.

### Required reaction

Enter a Frost Patch after the initial circles resolve.

---

## Fire Patch — Spell ID 1297649 — 5 yd / ticks every 1s / no fixed verified lifetime

### What happens

Fire impact leaves a **5 yd** damaging patch.

A Frost effect dissipates the Fire Patch.

### wow-trainer implementation notes

Patch should remain until consumed by the correct opposite-element interaction or encounter scripting removes it.

---

## Piercing Frost — Spell ID 1295954 — 60s / 1s ticks / movement slow up to 60%

### What happens

Frost-marked players receive Piercing Frost:

- lasts **60s** if not cleared;
- ticks every **1s**;
- canceled by a Fire effect;
- applies a movement-speed reduction.

Current database values vary by difficulty profile; the current maximum shown is **60%**, while lower profiles show smaller slows.

For a merged wow-trainer definition, make the slow configurable and use the intended training profile rather than claiming one universal difficulty-independent number.

### Required reaction

Enter a Fire Patch.

---

## Frost Patch — Spell ID 1297648 — 5 yd / ticks every 1s / no fixed verified lifetime

### What happens

Frost impact leaves a **5 yd** damaging patch.

A Fire effect dissipates the Frost Patch.

---

# 9. First Mate Nama Mechanics

## Shell Spin — Spell ID 1296061 — instant / 3 shells / 4s collision stun

### What happens

Nama launches **three spinning shells in a cone** in front of him.

Any shell that contacts a player stuns them for **4 seconds**.

The underlying spell has hidden 5s aura and 30 yd radius metadata, but this should not be treated as a verified projectile lifetime or travel distance.

### Telegraph

- Nama launch animation.
- Three visible moving shell projectiles.

### Targeting

Directional cone from Nama.

### Required reaction

Read the launch directions and move between / away from the shell paths.

The supplied transcript emphasizes that a Shell Spin stun becomes especially dangerous when combined with falling crates or other ground mechanics.

### Success condition

No shell collision.

### Failure conditions

- Hit and stunned for 4s.
- Stun causes a second unavoidable collision.
- Stunned during Throw Junk impact.
- Stunned during Frostfire placement or Mighty Thud positioning.

### wow-trainer implementation notes

Use three moving projectiles with simple linear or observed trajectories.

Randomize Nama facing before each Shell Spin within plausible tank-facing constraints.

Layering priority:

1. Shell Spin alone.
2. Shell Spin + Throw Junk.
3. Shell Spin + Evil Eyes.

---

## Steady Strikes — Spell ID 1291930 — +4% Physical damage per attack / stacks last 30s

### What happens

Each Nama attack against his current target increases Nama's Physical damage to that target by **4%**, lasting **30s**.

### Telegraph

- Tank stack count / danger indicator.

### Targeting

Active Nama tank.

### Required reaction

Swap when tank danger, Iku Shredding Shards state, and positioning allow.

The supplied transcript reports that around **20–30 stacks** was currently possible in the guide's tested tuning, but explicitly describes this as situational rather than a fixed mechanic requirement.

Therefore:

- record 20–30 as a **strategy reference**;
- do not make 20 or 30 a hard wow-trainer failure threshold.

### Success condition

Tank swap occurs before incoming damage becomes unsustainable and without ruining council spacing.

### wow-trainer implementation notes

Tank module should score:

- stack awareness;
- safe swap window;
- maintaining desired boss pairing.

---

# 10. Nama Ultimate: Mighty Thud

## Mighty Thud — Spell ID 1296092 — instant targeting / 3 marked players / 6 yd split-soak

### What happens

Nama marks **three players**, then leaps to their locations sequentially.

Each impact:

- deals Physical damage split evenly among players within **6 yd**;
- knocks hit players back;
- if the impact hits **no player**, the full effect is dealt to the entire raid.

Each landing leaves Aftershock.

### Telegraph

- Three marked players.
- Small circles around the marked players in the supplied transcript.
- Nama jumps to each in sequence.

### Targeting

Current spell data: **three players**.

### Required reaction

The supplied strategy divides the raid into **three approximately equal soak groups**.

For each marked target:

- assigned helpers stack inside the 6 yd impact;
- target places the impact along the planned movement route;
- helpers orient so the knockback sends them toward safe / inner arena space;
- do not overlap Aftershock zones with the next soak location.

The transcript describes positional groups around the moving bosses:
- ranged / one group ahead in the movement direction;
- another group also forward;
- melee group directly behind the boss and following it.

For wow-trainer, the exact role labels can be configuration; the crucial gameplay is **correct assigned group + safe impact placement + knockback direction**.

### Success condition

For each of three jumps:

- marked target is in assigned location;
- sufficient assigned players are inside 6 yd;
- no impact is empty;
- knockback remains safe;
- new Aftershock does not trap the raid.

### Failure conditions

- Empty soak → raid-wide fallback.
- Wrong soak group.
- Too few helpers for the strategy's assigned split.
- Two groups overlap unnecessarily.
- Knockback sends player into edge / fire / crate / shell.
- Aftershock placement blocks the next jump or main boss path.

### wow-trainer implementation notes

This should be a standalone assignment module.

Randomize:

- which of three raid markers the controlled player receives;
- controlled player's soak group;
- Nama approach direction;
- nearby pre-existing hazards.

Do not invent a minimum number of players beyond the verified rule that at least one player must be hit to avoid the empty-soak fallback. The guide's "three equal groups" is the raid strategy for survivable damage splitting.

---

## Aftershock — Spell ID 1310500 — 6 yd / ticks every 1s / exact lifetime unresolved

### What happens

Each Mighty Thud landing leaves a **6 yd** damaging zone ticking every **1s**.

### Source disagreement

- Current Wowhead spell data / Encounter Journal displays the normal/heroic version as lasting **"until canceled"** and exposes no fixed duration.
- The supplied transcript states **30 seconds**.
- Some strategy-guide material has also described a 30-second practical duration.

Until live logs confirm the despawn behavior, **do not hard-code 30s as verified game data**.

### wow-trainer implementation notes

Use:

```text
aftershockLifetime = configurable
```

For layout training, 30s can be used as a **strategy preset** clearly labeled unverified, since it reproduces the guide's described space-management problem.

---

# 11. Encounter Relationships

These dependencies are more important than isolated spell descriptions.

## Crates → Fish → Mor'zahi energy → chosen Ultimate

```text
Throw Junk
  ↓
crate lands
  ↓
raid deliberately clears crates
  ↓
fish is found
  ↓
fish holder targets planned tortollan
  ↓
Mor'zahi concentration breaks
  ↓
Fishy Feedback
  ↓
Mor'zahi's Command
  ↓
chosen boss gains / executes Ultimate mechanic
```

If crate management is delayed, the raid simultaneously risks:

- Relic Rupture;
- missing the fish deadline;
- entering an Ultimate with arena clutter.

---

## Blink Nova placement → fish accessibility

```text
Blink Nova target moves forward along Gebbo route
  ↓
Iku teleports forward
  ↓
raid gains distance mitigation
  ↓
Iku remains close enough to rejoin cleave
  ↓
Iku remains reachable if next fish is intended for Iku
```

Bad Blink Nova placement can therefore cause more than raid damage; it can break the planned fish cycle.

---

## Frostfire Volley → patch creation → opposite-element cleanse

```text
Fire/Frost circles placed
  ↓
circles resolve
  ↓
matching debuffs + matching ground patches
  ↓
Fire player enters Frost patch
Frost player enters Fire patch
  ↓
debuffs canceled + patches dissipated
  ↓
raid regroups
```

---

## Mushroom placement → bomb placement → Blast Wave crossing

```text
Raid stacks to bait mushroom
  ↓
mushroom preserved
  ↓
bomb marked player goes to opposite outer edge
  ↓
bomb detonates
  ↓
Blast Wave travels toward raid
  ↓
raid triggers mushroom at correct moment
  ↓
airborne players cross wave
```

This is a timing-and-space relationship, not three independent mechanics.

---

## Gebbo Ultimate → temporary boss regroup → tank swap

The transcript uses the mushroom location as a controlled regroup point:

```text
Gebbo continues route
Iku + Nama are moved near mushroom
  ↓
tank positions both controlled bosses safely
  ↓
tank swap can happen
  ↓
raid jumps wave
```

The implementation should therefore test boss-position management during the wave module in advanced mode.

---

## Shell Spin + Throw Junk / Evil Eyes

Shell Spin is low-complexity in isolation but dangerous when its 4s stun overlaps random ground hazards.

This makes it a good **background randomizer** rather than the first standalone module.

---

## Boss health synchronization → survivor punishments

```text
3 independent HP pools
  ↓
burn bosses toward common kill window
  ↓
first death starts survivor punishments
  ↓
second and third deaths must follow rapidly
```

Health synchronization should be scored even if the trainer does not simulate full DPS.

---

# 12. Strategy and Encounter Flow from the Supplied Transcript

This section intentionally preserves the guide's strategy rather than substituting another guide's routing.

## Pull setup

1. **Iku is interrupted immediately by a ranged player** so she walks toward the desired position.
2. Pull **Iku to Gebbo** and keep them together for two-target cleave.
3. Use Heroism / Bloodlust and offensive potions once Iku + Gebbo are together.
4. Tank **Nama separately**, moving him counter-clockwise and roughly opposite the Gebbo path.
5. Watch Shell Spin paths while maintaining the separation.
6. Place Blink Nova slightly forward along Gebbo's counter-clockwise route.

### Base formation objective

```text
        Nama
         |
     >30 yd from
   all-three cluster

Gebbo + Iku
(two-target cleave)
```

The exact geometry changes continuously because Gebbo moves.

---

## Base rotation

No exact encounter timestamps are assigned.

```text
PULL
  ↓
Immediate Iku interrupt
  ↓
Stack Iku + Gebbo
  ↓
Nama held apart
  ↓
Heroism / burst
  ↓
Dodge Shell Spin / Evil Eyes / crate impacts
  ↓
Interrupt Icebound Flames
  ↓
Place Blink Nova forward on route
  ↓
Clear crates deliberately
  ↓
Recover fish
  ↓
Use fish before Final Ascension
  ↓
Chosen Ultimate
  ↓
Return to two-target cleave
```

### Crate-clearing strategy

The transcript spaces crate stomps at approximately **6 seconds** to prevent uncontrolled bleed stacking.

This is a strategy cadence only. It must not be presented as a verified Throw Junk interval.

---

# 13. Intended Ultimate Order

The supplied guide uses:

```text
1. Scrollsage Iku
2. Trader Gebbo
3. First Mate Nama
```

The guide then says the sequence repeats.

### Current-data conflict

Current Patch 12.1 Wowhead / Encounter Journal text says:

> each tortollan can only be fed once

Therefore the following must **not** be assumed yet:

```text
Iku → Gebbo → Nama → Iku → ...
```

For the implementation, use:

```text
ultimatePlan = [IKU, GEBBO, NAMA]
allowRepeatFishTargets = CONFIGURABLE / false by current data
```

Until live testing proves repeatability, the safest complete encounter model is:

```text
Iku Ultimate
  ↓
Gebbo Ultimate
  ↓
Nama Ultimate
  ↓
finish encounter before another fish target would be required
```

This is one of the highest-priority live-log verification items.

---

# 14. Iku Ultimate Strategy Flow

```text
Fish → Iku
  ↓
Fishy Feedback
  ↓
Mor'zahi's Command
  ↓
Frostfire Volley
  ↓
Fire targets outer ring
Frost targets slightly inside
  ↓
Impacts resolve
  ↓
Frost players enter Fire patches
Fire players enter Frost patches
  ↓
patches/debuffs removed
  ↓
all players regroup on cleave bosses
```

### Trainer layout concept

Use a ring arena with:

- outer placement band for Fire;
- inner placement band for Frost;
- central safe/raid band.

Do not make the exact band radii "real WoW yards" unless the arena has been measured.

---

# 15. Gebbo Ultimate Strategy Flow

```text
Fish → Gebbo
  ↓
Fishy Feedback
  ↓
Mor'zahi's Command
  ↓
Raid stacks
  ↓
Mushroom Toss
  ↓
mushroom baited at stack
  ↓
Explosive Surprise
  ↓
marked player moves to opposite outer edge
  ↓
bomb detonates
  ↓
Blast Wave expands
  ↓
Iku + Nama positioned near mushroom
  ↓
raid waits
  ↓
raid triggers mushroom
  ↓
jump over wave
  ↓
avoid Fungal Burst + fire zone
  ↓
preserve next mushroom if another wave follows
```

Advanced layering:

- crates may spawn but should not be stomped at the wrong time;
- brief United Defense may occur as tanks regroup;
- next Blink Nova can be used to restore separation.

---

# 16. Nama Ultimate Strategy Flow

```text
Fish → Nama
  ↓
Fishy Feedback
  ↓
Mor'zahi's Command
  ↓
3 players marked
  ↓
3 assigned soak groups form
  ↓
Thud #1 → knockback inward → Aftershock
  ↓
Thud #2 → knockback inward → Aftershock
  ↓
Thud #3 → knockback inward → Aftershock
  ↓
regroup on bosses
  ↓
resume base rotation
```

The supplied strategy places the soak points along the current direction of travel so that the encounter can resume without large repositioning.

---

# 17. Recommended wow-trainer Failure Codes

```text
FAIL_MORZAHI_ASCENSION
FAIL_RELIC_RUPTURE
FAIL_FISH_WRONG_TARGET
FAIL_FISH_TARGET_INELIGIBLE
FAIL_FISH_NOT_USED

FAIL_UNITED_DEFENSE_POSITIONING
FAIL_CRATE_IMPACT
FAIL_EXCESSIVE_SPLINTERS

FAIL_MUSHROOM_EARLY_TRIGGER
FAIL_BOMB_IN_RAID
FAIL_BOMB_IMPACT
FAIL_BLAST_WAVE_HIT
FAIL_FUNGAL_BURST_HIT

FAIL_ICEBOUND_FLAMES_INTERRUPT
FAIL_BLINK_NOVA_PLACEMENT
FAIL_SHREDDING_SHARDS_SWAP

FAIL_FROSTFIRE_IMPACT_OVERLAP
FAIL_ELEMENTAL_EXPLOSION
FAIL_WRONG_ELEMENT_CLEANSE
FAIL_ELEMENT_DEBUFF_UNCLEARED

FAIL_SHELL_COLLISION
FAIL_MIGHTY_THUD_EMPTY_SOAK
FAIL_MIGHTY_THUD_WRONG_GROUP
FAIL_MIGHTY_THUD_BAD_KNOCKBACK
FAIL_AFTERSHOCK_CONTACT

FAIL_BOSS_HEALTH_DESYNC
```

Not every failure should instantly end a training run. Suggested classes:

- **Hard reset:** Final Ascension, Elemental Explosion, empty Mighty Thud soak in strict mode, Blast Wave contact in strict mode.
- **Major error:** wrong fish target, Relic Rupture, bad bomb placement, missed interrupt.
- **Minor / score error:** crate impact, shell collision, low-quality Blink Nova placement, unnecessary patch contact.

---

# 18. Randomization Model

Randomization should train recognition without turning the fight into noise.

## Good random variables

### Global

- controlled player role / assignment;
- boss starting angular offsets within strategy-valid bounds;
- minor variation in Gebbo route starting point;
- Evil Eyes impact locations.

### Crates

- target player positions;
- exact crate landing positions;
- which crate contains fish;
- crate count according to selected data profile.

### Blink Nova

- random eligible target;
- boss positions when target marker appears.

### Frostfire Volley

- player gets Fire, Frost, or no mark;
- positions of AI-marked players;
- number of marks after data verification.

### Gebbo Ultimate

- mushroom target within raid stack;
- bomb target;
- small variation in bomb-to-mushroom angle;
- optional simultaneous crate spawn.

### Mighty Thud

- which three raid members are marked;
- controlled player's assigned soak group;
- ordering of player marks if logs show variable ordering;
- pre-existing Aftershock / ground hazards.

### Shell Spin

- Nama facing;
- shell lane orientation.

---

# 19. Suggested Player Controls

A practical browser implementation can use:

```text
WASD / mouse click     movement
Interrupt key          interrupt Iku
Interact / contact     stomp crate / trigger mushroom
Extra Action key       throw fish
Target-cycle key       select tortollan for fish
Optional defensive     immunity / bleed-removal training
```

For early modules, target selection can be simplified to direct boss buttons.

---

# 20. Recommended Training Modules

Ranked by likely training value.

## 1. Gebbo Bomb + Mushroom + Blast Wave

**Value:** Very high.

Train:

- bait mushroom;
- do not trigger early;
- identify bomb marker;
- place bomb at edge opposite mushroom;
- move away from 10 yd impact;
- wait for wave;
- trigger mushroom at correct time;
- clear wave while airborne;
- move away before 5s Fungal Burst.

Advanced:

- second mushroom / second wave;
- crates present during sequence;
- tank/boss-position overlay.

---

## 2. Iku Frostfire Volley

**Value:** Very high.

Train:

- recognize Fire vs Frost;
- place Fire outer / Frost inner;
- avoid other circles;
- wait for impact;
- move into opposite patch;
- confirm own debuff removed;
- return to raid.

Failure feedback should explicitly explain **why** Elemental Explosion happened.

---

## 3. Crate + Fish + Mor'zahi Energy Management

**Value:** Very high.

Train:

- dodge crate landings;
- clear crates deliberately;
- manage Splinters;
- find fish;
- use extra action;
- select correct planned boss;
- beat Final Ascension deadline.

Advanced:

- Blink Nova displaces Iku shortly before fish is found;
- fish target eligibility restrictions.

---

## 4. Nama Three-Group Mighty Thud

**Value:** High.

Train:

- identify own assigned group;
- stack within 6 yd;
- place target along route;
- orient knockback inward;
- avoid previous Aftershock;
- repeat for three sequential jumps.

---

## 5. Blink Nova Routing

**Value:** Medium-high.

Train:

- move target forward along Gebbo route;
- create raid distance;
- do not strand Iku;
- preserve United Defense separation;
- keep Iku accessible to planned fish.

This mechanic becomes particularly valuable in combination with crate/fish timing.

---

## 6. Council Positioning + Tank Swaps

**Value:** High for tanks, lower for general raid.

Train:

- two-boss cleave;
- keep third boss outside 30 yd all-three condition;
- Shredding Shards swap;
- Steady Strikes awareness;
- regroup near mushroom without creating prolonged United Defense.

---

## 7. Shell Spin + Ground-Hazard Avoidance

**Value:** Medium alone, high as combined noise.

Use as a secondary mechanic layered into other modules.

---

# 21. Full Encounter Simulation

A mature wow-trainer version should combine:

### Persistent systems

- Gebbo circular movement.
- Iku + Gebbo cleave pairing.
- Nama separate tank positioning.
- United Defense 30 yd logic.
- Mor'zahi energy.
- passive Malevolent Presence as pressure only.

### Recurring base mechanics

- Throw Junk.
- crate clearing / Splinters.
- Relic Rupture deadline.
- Evil Eyes.
- Shell Spin.
- Icebound Flames interrupt.
- Blink Nova placement.
- Shredding Shards / Steady Strikes as tank-state indicators.

### Fish / Ultimate state machine

```text
fish found
  ↓
planned target selected
  ↓
control break
  ↓
Fishy Feedback
  ↓
boss Ultimate
  ↓
return to base state
```

Use the guide's desired order:

```text
Iku → Gebbo → Nama
```

Do not repeat targets unless live verification proves the transcript's repeat loop remains valid.

### Endgame

When any boss dies:

- activate corresponding survivor punishments;
- score time to remaining deaths;
- strongly penalize health desynchronization.

---

# 22. Background Mechanics

These matter in the real encounter but do not need high-detail simulation initially.

## Malevolent Presence

Passive raid damage every 2s. Represent as raid-stress only.

## Fishy Feedback damage

12s raid damage after fish use. Important for healing pressure but not a movement mechanic.

## Raw tank damage

Shredding Shards and Steady Strikes matter primarily for swap state. A full armor / mitigation engine is unnecessary.

## Cataclysmic Invocation damage amount

The 7s cast and repeated escalation matter; exact numeric damage does not need simulation.

## Relentless Escalation damage scaling

Model as rapid endgame danger rather than real damage arithmetic.

## Smashing Shovel strike damage

Model the knockback and "finish immediately" pressure; exact melee damage is not necessary.

---

# 23. Open / Unverified Details

These should remain configurable until current live logs, updated Dungeon Journal data, or direct raid testing resolves them.

## 23.1 Fish reuse / Ultimate repeat

**Highest priority.**

Transcript:
- Iku → Gebbo → Nama → repeat.

Current 12.1 Wowhead / Encounter Journal:
- each tortollan can only be fed once.

Need live verification of:

- whether a boss can receive a second fish;
- whether guide footage predates a mechanic change;
- whether the fight is now expected to end before a fourth fish.

---

## 23.2 Exact Mor'zahi energy generation rate

No reliable rate was established from current spell data.

Need combat logs to determine:

- energy gain per second / tick;
- time from reset to next 100 energy;
- whether gain pauses during control-break / Ultimate state;
- exact safe fish-use windows.

Do not infer this from edited guide footage.

---

## 23.3 Exact timing from fish hit to Mor'zahi's Command / Ultimate

Database metadata for Mor'zahi's Command is not a trustworthy player-facing timer.

Need logs for:

- control-break duration;
- repossession delay;
- delay from Command to Ultimate;
- whether Fishy Feedback starts exactly on fish hit.

---

## 23.4 Throw Junk recurrence and crate count

Verified:
- 3.0s cast;
- 3 yd impact.

Unverified:
- exact encounter cadence;
- exact number of crates per cast for the intended training profile;
- whether target count changes with raid size;
- whether fish/relic location follows a deterministic rule.

---

## 23.5 Disgusting Fish throw spell ID

The fish object is verified as **NPC ID 265670**.

The exact player Extra Action Button spell ID used to throw it was not confidently identified and should not be invented.

---

## 23.6 Gebbo movement speed / circle radius

The circular route is strategy-relevant from the transcript, but exact:

- radius;
- speed;
- starting point;
- direction;
- path pauses

need live observation / arena coordinate extraction.

---

## 23.7 Blast Wave propagation geometry

Verified:
- contact is highly dangerous;
- mushroom can avoid it;
- contact applies a 10s DoT.

Unverified:
- radial speed;
- wave thickness;
- exact collision height;
- whether airborne immunity is purely Z-height or scripted mushroom state.

These values are essential for a faithful timing trainer.

---

## 23.8 Spreading Flames lifetime / shrink behavior

Transcript:
- large persistent area later becomes smaller / disappears.

Current spell data:
- damage every 1s;
- no fixed lifetime exposed.

Need log / visual validation.

---

## 23.9 Number of Mushroom Toss targets

7.0s cast is verified.

Exact number of mushrooms and whether it changes through the Ultimate sequence needs live confirmation.

---

## 23.10 Frostfire Volley target count

Verified:
- several targets;
- 10 yd impact;
- Fire/Frost assignment;
- 60s debuffs;
- 5 yd patches.

Unverified:
- exact number of Fire and Frost targets;
- raid-size scaling;
- role eligibility;
- deterministic color balance.

---

## 23.11 Piercing Frost slow magnitude

Current spell data exposes different slow values by difficulty profile, up to 60%.

wow-trainer should keep this configurable rather than claiming one universal number.

---

## 23.12 Aftershock lifetime

Transcript:
- 30s.

Current Wowhead tooltip:
- normal/heroic text currently shows "until canceled";
- no fixed duration metadata.

Need live logs / direct observation. A 30s trainer preset can reproduce the guide strategy but must remain labeled as unverified.

---

## 23.13 Mighty Thud leap spacing

Verified:
- three marked players;
- sequential leaps;
- 6 yd split soak;
- empty impact becomes raid-wide.

Unverified:
- exact time between jumps;
- marker-to-first-jump delay;
- whether jump order follows marker application order.

---

## 23.14 Shell Spin projectile physics

Verified:
- three shells;
- frontal cone;
- collision stun 4s.

Unverified:
- projectile speed;
- path length;
- collision width;
- exact lifetime.

Do not infer these from the hidden 5s/30 yd spell aura metadata.

---

## 23.15 Tank-stack practical thresholds

Nama:
- +4% Physical damage per attack, 30s.

Transcript:
- approximately 20–30 stacks was manageable in the tested tuning.

This is not a mechanic-enforced threshold and should remain strategy/configuration data.

---

## 23.16 Brief United Defense during Gebbo Ultimate

The supplied strategy says a short all-three shield overlap may be unavoidable / accepted during the wave sequence, then cleared by subsequent movement / Blink Nova.

Need live testing to determine:

- whether this is still true;
- how long the overlap normally lasts;
- whether current routing can avoid it entirely.

The simulator should not hard-fail immediately on the first frame of United Defense.

---

## 23.17 Dark Unity

Current Encounter Journal lists **Dark Unity** as a Raid Finder-only mechanic in which controlled tortollans share health.

The supplied strategy explicitly treats the encounter as independent HP pools.

For wow-trainer's primary encounter model, use independent HP and omit Dark Unity unless a Raid Finder training profile is intentionally added later.

---

# 24. Spell Reference

| Spell | Spell ID | Relevant timing / radius | Trainer relevance |
|---|---:|---|---|
| Dark Whispers | 1295451 | 7.0s cast | Setup / possession state |
| Mor'zahi's Command | 1297022 | Scripted repossession; exact player-facing delay unverified | Ultimate state transition |
| Malevolent Presence | 1295449 | Damage every 2s | Background |
| Evil Eyes | 1292388 | 3 yd impact; internal 5s aura / 0.5s trigger metadata | Dodge |
| Fishy Feedback | 1313303 | 12s; ticks every 2s | Raid-pressure window |
| Final Ascension | 1292779 | 100 energy; 5.0s cast/channel; 0.5s damage ticks | Hard fail / fish deadline |
| United Defense | 1297646 | 30 yd all-three condition; 99% damage reduction | Core positioning |
| Throw Junk | 1291933 | 3.0s cast; 3 yd impact | Core crate system |
| Splinters | 1308853 | 8s; ticks every 1s; stacks | Crate-clear pressure |
| Splinters raid-wide variant | 1312868 | 6s raid bleed; ticks every 1s; stacks | Configurable high-fidelity crate pressure |
| Relic Rupture | 1310027 | 25s untouched deadline | Hard crate deadline |
| Mushroom Toss | 1292104 | 7.0s cast | Gebbo Ultimate setup |
| Fungal Burst | 1305618 | 5.0s after trigger; 5 yd | Mushroom consumption hazard |
| Explosive Surprise | 1297625 | 10s target marker; 10 yd impact | Bomb placement |
| Concussive Blast | 1296247 | 10 yd; 12s DoT; 1s ticks | Bomb impact / knockback |
| Blast Wave | 1305844 | Contact DoT 10s; 1s ticks; propagation speed unverified | Core Gebbo Ultimate |
| Spreading Flames | 1297650 | Persistent; ticks every 1s; lifetime unverified | Space management |
| Smashing Shovel | 1296252 | Activates after ally death | Endgame pressure |
| Icebound Flames | 1286922 | 4.0s cast; 12s Magic debuff; 1s ticks; 50% slow | Interrupt |
| Blink Nova | 1296021 | 7.0s cast | Placement / routing |
| Blink Nova target aura | 1296025 | 7s; max 1 player | Telegraph |
| Shredding Shards | 1295854 | 3.5s channel; every 0.5s = 7 hits | Tank swap |
| Shredding Shards vulnerability | 1295858 | +50% per shard; ~80s | Tank state |
| Frostfire Volley | 1295893 | Instant scripted activation; 10 yd impacts | Core Iku Ultimate |
| Elemental Explosion | 1295952 | Instant raid-wide | Frostfire failure |
| Burning Flames | 1295928 | 60s; 1s ticks; canceled by Frost | Element cleanse |
| Fire Patch | 1297649 | 5 yd; 1s ticks; no fixed duration | Element cleanse |
| Piercing Frost | 1295954 | 60s; 1s ticks; slow varies up to 60%; canceled by Fire | Element cleanse |
| Frost Patch | 1297648 | 5 yd; 1s ticks; no fixed duration | Element cleanse |
| Cataclysmic Invocation | 1291390 | 7.0s cast; increases with repeated casts | Endgame pressure |
| Shell Spin | 1296061 | 3 shells; 4s collision stun | Dodge |
| Steady Strikes | 1291930 | +4% Physical per attack; 30s | Tank swap |
| Mighty Thud | 1296092 | 3 marked players; 6 yd split soak | Core Nama Ultimate |
| Aftershock | 1310500 | 6 yd; 1s ticks; lifetime unresolved | Space management |
| Relentless Escalation | 1296227 | +100% damage every 1s for 30s after ally death | Endgame pressure |

---

# 25. Suggested Minimal Implementation Milestones

## Milestone A — mechanic prototypes

Implement independently:

1. Frostfire Volley module.
2. Bomb + mushroom + Blast Wave module.
3. Mighty Thud three-soak module.
4. Crate + fish + energy module.

No boss HP required yet.

## Milestone B — movement relationships

Add:

- circular Gebbo route;
- Blink Nova forward placement;
- United Defense;
- Shell Spin;
- crate clutter.

## Milestone C — fish/Ultimate state machine

Add player-controlled fish target order:

```text
Iku → Gebbo → Nama
```

with one-fish-per-boss validation enabled by current data.

## Milestone D — full encounter

Add:

- independent boss health percentages;
- health synchronization objective;
- tank swap state;
- ally-death punishments;
- background raid-pressure model.

## Milestone E — post-live validation

Replace configurable placeholders with measured values for:

- Mor'zahi energy rate;
- Ultimate delays;
- Throw Junk cadence/count;
- Blast Wave speed;
- Spreading Flames lifetime;
- Aftershock lifetime;
- Shell Spin physics;
- exact target counts.

---

# 26. Verification Sources

Primary mechanical reference:

- Wowhead — The Lost Explorers Raid Boss Guide, Patch 12.1\
  https://www.wowhead.com/guide/midnight/raids/venomous-abyss-lost-explorers-boss-strategy-abilities

Official release-status reference:

- Blizzard — The Venomous Abyss raid opening announcement\
  https://worldofwarcraft.blizzard.com/news/24294062/curse-of-ulatek-the-venomous-abyss-raid-goes-live-august-18

Key current spell-data pages:

- Final Ascension — https://www.wowhead.com/spell=1292779/final-ascension
- Fishy Feedback — https://www.wowhead.com/spell=1313303/fishy-feedback
- Evil Eyes — https://www.wowhead.com/spell=1292388/evil-eyes
- Malevolent Presence — https://www.wowhead.com/spell=1295449/malevolent-presence
- Throw Junk — https://www.wowhead.com/spell=1291933/throw-junk
- Splinters — https://www.wowhead.com/spell=1308853/splinters
- Relic Rupture — https://www.wowhead.com/spell=1310027/relic-rupture
- Mushroom Toss — https://www.wowhead.com/spell=1292104/mushroom-toss
- Fungal Burst — https://www.wowhead.com/spell=1305618/fungal-burst
- Explosive Surprise — https://www.wowhead.com/spell=1297625/explosive-surprise
- Concussive Blast — https://www.wowhead.com/spell=1296247/concussive-blast
- Blast Wave — https://www.wowhead.com/spell=1305844/blast-wave
- Spreading Flames — https://www.wowhead.com/spell=1297650/spreading-flames
- Icebound Flames — https://www.wowhead.com/spell=1286922/icebound-flames
- Blink Nova — https://www.wowhead.com/spell=1296021/blink-nova
- Shredding Shards — https://www.wowhead.com/spell=1295854/shredding-shards
- Shredding Shards vulnerability — https://www.wowhead.com/spell=1295858/shredding-shards
- Frostfire Volley — https://www.wowhead.com/spell=1295893/frostfire-volley
- Burning Flames — https://www.wowhead.com/spell=1295928/burning-flames
- Piercing Frost — https://www.wowhead.com/spell=1295954/piercing-frost
- Fire Patch — https://www.wowhead.com/spell=1297649/fire-patch
- Frost Patch — https://www.wowhead.com/spell=1297648/frost-patch
- Elemental Explosion — https://www.wowhead.com/spell=1295952/elemental-explosion
- Shell Spin — https://www.wowhead.com/spell=1296061/shell-spin
- Steady Strikes — https://www.wowhead.com/spell=1291930/steady-strikes
- Mighty Thud — https://www.wowhead.com/spell=1296092/mighty-thud
- Aftershock — https://www.wowhead.com/spell=1310500/aftershock
- Cataclysmic Invocation — https://www.wowhead.com/spell=1291390/cataclysmic-invocation
- Relentless Escalation — https://www.wowhead.com/spell=1296227/relentless-escalation
- Smashing Shovel — https://www.wowhead.com/spell=1296252/smashing-shovel

---

# 27. Implementation Summary

For wow-trainer, the encounter is best understood as a **moving two-target council fight controlled by a player-selected Ultimate cycle**.

The highest-value simulation relationships are:

```text
Crate management → fish → Mor'zahi reset → chosen Ultimate

Iku Blink Nova placement → future cleave + fish accessibility

Frostfire placement → opposite-element patch cleanse

Mushroom bait → bomb edge placement → jump over Blast Wave

Mighty Thud marks → assigned group soaks → controlled knockbacks

Independent boss HP → synchronized kill → avoid survivor escalation
```

The supplied strategy's intended Ultimate order remains:

```text
IKU → GEBBO → NAMA
```

but the **repeat after Nama must remain disabled/unverified** until live evidence resolves the conflict with current data saying each tortollan can only receive one fish.
