# Sszorak — `wow-trainer` Encounter Specification

> **Design rule:** Treat Sszorak as one complete encounter. Do **not** separate mechanics into Normal/Heroic/Mythic variants.
> The sequence below follows the strategy from the supplied video rather than video timestamps, since the footage is edited.
>
> **Timing rule:** Cast times and aura/debuff durations below are based on the currently available PTR spell data. Exact damage values should not be hard-coded into trainer logic because they are still changing.

## Encounter Overview

Sszorak is a repeating single-phase encounter centered around five mechanics:

1. **Apex Predator** — identify and react to a randomized five-attack combination.
2. **Venomous Surge / Viscous Cyst** — place four knockback bombs around the arena.
3. **Raging Crosswinds** — pair affected players so their directional knockbacks collide.
4. **Serpent's Fury** — periodically stack on the marked player before Sszorak reaches 100 Rage, then immediately spread.
5. **Howling Maelstrom** — use three previously placed Viscous Cysts to counter three successive winds, followed by a fourth cyst immediately afterward.

Environmental poison pools gradually reduce usable arena space.

---

# 1. Apex Predator

## Apex Predator — `Spell ID 1277025` — **Instant**

Sszorak starts a sequence of **five attacks** selected from:

- Ravage
- Mutilate
- Tempest

The sequence is not fixed.

Tempest occurs once per combo, while the frontal attacks may repeat. Taunts can change Sszorak's target while an attack is already being cast.

### wow-trainer objective

The player must recognize the incoming attack from its visual telegraph and immediately execute the correct response.

The combo should therefore be randomized rather than scripted.

Example:

```text
Ravage
→ Mutilate
→ Ravage
→ Tempest
→ Mutilate
```

---

## Ravage — `Spell ID 1277002` — **3.0s cast / 25s vulnerability**

White frontal cone directed toward the tank.

Players hit receive a **25-second Ravage vulnerability**, massively increasing damage from subsequent Ravages.

### Required reaction

- Only the assigned tank should be inside the frontal.
- The second tank must avoid the frontal.
- The same tank must not take consecutive Ravages while the vulnerability is active.
- Tanks may taunt **during the 3-second cast** to redirect the frontal.

### Trainer success

- Correct tank receives Ravage.
- Other players remain outside the cone.

### Trainer failure

- Non-tank is hit.
- Both tanks are hit.
- Tank receives another Ravage while the 25s vulnerability is active.

---

## Mutilate — `Spell ID 1277027` — **3.0s cast**

### Mutilated Gash — `Spell ID 1277051` — **22s debuff**

Green frontal cone that must be intercepted by a player group.

Damage is shared between players struck, and Mutilated Gash remains for **22 seconds**. The encounter journal also requires at least five players to intercept the attack.

The raid strategy uses two alternating soak groups because multiple Mutilates can occur during a combo.

### Required reaction

```text
Mutilate #1 → Group A
Mutilate #2 → Group B
```

The exact order is dynamic because Ravage and Mutilate can occur in different positions within Apex Predator.

### Trainer success

- Player recognizes the green frontal.
- Assigned group moves into the frontal.
- At least the required number of NPC players intercept it.

### Trainer failure

- Player misses their assigned soak.
- Too few players intercept Mutilate.
- Player incorrectly joins the other group's soak.

---

## Tempest — `Spell ID 1287072` — **6s hit debuff**

Poisonous tornadoes originate from Sszorak and move outward.

Players struck receive damage, a stacking DoT and a **30% movement slow for 6 seconds**.

According to the video strategy, the tornadoes reach the arena edge, rebound and return through the arena.

### Required reaction

- Identify tornado trajectories.
- Move between them.
- Continue tracking them after the initial outward movement.

### Trainer failure

- Player touches a tornado.
- Optional scoring penalty for multiple Tempest stacks.

---

# 2. Venomous Surge and Viscous Cysts

## Venomous Surge — `Spell ID 1305959` — **4.0s channel / 10s target debuff**

Sszorak targets several players with venom.

The cast is a **4-second channel**. Affected players carry Venomous Surge for **10 seconds** before it expires and creates a Viscous Cyst. Raid-wide explosion damage decreases with distance from the targeted player.

### Required reaction

When targeted:

1. Identify the assigned bomb position.
2. Move away from the raid.
3. Reach the position before the 10-second debuff expires.
4. Drop the Viscous Cyst accurately.
5. Return to the group.

Movement-speed abilities are useful here because the placement window is limited.

---

## Viscous Cyst — `Spell ID 1287008` — **120s lifetime / 5s post-burst toxin**

The spawned cyst remains for **2 minutes** or until triggered by player contact.

When triggered:

- it explodes;
- knocks all players away from the cyst;
- applies a toxin effect lasting **5 seconds**;
- reduces movement speed by 30%;
- provides significant resistance against forced movement.

This forced-movement interaction is the key to surviving Howling Maelstrom.

### Bomb strategy

Four cysts are created during one complete encounter cycle.

```text
Cyst #1 → counters Wind #1
Cyst #2 → counters Wind #2
Cyst #3 → counters Wind #3
Cyst #4 → handles the additional knock immediately after Maelstrom
```

The first three cysts are placed **opposite their corresponding wind direction** so their knockback pushes the raid back toward safe ground.

### Trainer failure

- Bomb dropped inside the raid.
- Bomb dropped in the wrong arena sector.
- Bomb overlaps another required position.
- Bomb cannot produce the required counter-knock.
- Bomb is accidentally triggered early.

---

# 3. Raging Crosswinds

## Raging Crosswinds — `Spell ID 1285419` — **8s debuff**

Several players receive directional wind indicators.

The debuff lasts **8 seconds**. When it expires:

- affected players explode within 6 yards;
- they are launched in the indicated direction;
- they receive Turbulent Gusts.

Each player's directional indicator shows exactly where they will be knocked.

### Required reaction

Affected players find a partner whose knock trajectory points toward them.

```text
Player A   →           ←   Player B
```

The players should **not stack before expiration**, because Raging Crosswinds explodes around each affected player.

Instead:

```text
find partner
→ align trajectories
→ maintain separation
→ debuff expires
→ both players are knocked
→ collide
```

---

## Turbulent Gusts — `Spell ID 1285447` — **10s debuff**

After the knock, affected players receive Turbulent Gusts for up to **10 seconds**.

Contact with another player affected by Turbulent Gusts removes the effect.

### wow-trainer objective

This should be a spatial matching mechanic rather than simply "stand on marker".

Randomize:

- player's knock direction;
- partner position;
- partner knock direction;
- unrelated affected players;
- poison puddles;
- platform-edge distance.

### Success

The player's trajectory intersects the correct partner and both Turbulent Gusts effects are removed.

### Failure

- Player is knocked off the platform.
- Player chooses the wrong partner.
- Trajectories do not intersect.
- Player stands within another Crosswinds player's explosion radius before expiration.

---

# 4. Serpent's Fury

## Serpent's Fury — `Spell ID 1297367` — **Instant / encounter-long Rage mechanic**

One player is marked and Sszorak continuously gains Rage.

When **at least 14 players are within 8 yards** of the marked player, Sszorak triggers To the Slaughter and consumes his Rage.

If Sszorak reaches **100 Rage**, the raid effectively wipes.

### Target selection

According to the video strategy, the player farthest from Sszorak can be deliberately positioned to receive the mark when the mechanic initializes.

This allows the raid to control who handles the marked-player position.

### Timing strategy

The stack should be triggered **late**, rather than immediately when enough players could stack.

Reason:

```text
early Rage reset
→ next Rage cycle occurs earlier
→ later reset can overlap Apex Predator
→ insufficient time to stack
```

The first two resets should therefore be delayed safely so that the third does not collide badly with the following Apex Predator sequence.

The same principle applies to subsequent cycles.

### wow-trainer representation

Display a visible Rage resource:

```text
Sszorak Rage
██████████████████░░  89 / 100
```

The player needs to judge when to join the marked player.

### Failure

- Rage reaches 100.
- Player fails to join the stack when required.
- Fewer than 14 raid members reach the 8-yard area.

---

## To the Slaughter — `Spell ID 1297414` — **Triggered charge**

Once the Serpent's Fury stack condition is satisfied, Sszorak charges the marked player and resets his accumulated Rage.

Players struck by the charge receive Virulence.

---

## Virulence — `Spell ID 1297707` — **5s debuff**

Affected players carry Virulence for **5 seconds**.

When it expires, the player releases damaging projectiles/explosions and creates additional poisonous ground.

### Required reaction

The complete Serpent's Fury movement is therefore:

```text
STACK
  ↓
trigger To the Slaughter
  ↓
charge hits raid
  ↓
IMMEDIATELY SPREAD
  ↓
Virulence expires after 5s
  ↓
projectiles / poison resolve safely
```

### Trainer failure

- Virulence explosion hits another player.
- Player remains stacked.
- Player spreads into another Virulence player's path.
- Player spreads into existing hazardous ground.

---

## Unbound Ferocity — `Spell ID 1296898` — **failure state**

Triggered when Sszorak reaches 100 Rage.

For `wow-trainer`, this should simply be treated as:

```text
Rage == 100
→ encounter failed
```

There is no training value in simulating the subsequent enrage.

---

# 5. Howling Maelstrom

## Howling Maelstrom — `Spell ID 1285732` — **Instant trigger**

Three wind fields activate sequentially around the arena.

Their visual indicators reveal the activation order beforehand.

Each wind produces enough forced movement that players risk being pushed from the platform.

Before the mechanic begins, the trainer should communicate:

```text
Wind #1
Wind #2
Wind #3
```

The player then needs to use the previously created cysts in that order.

---

## Dig In — `Spell ID 1286033` — **25s channel**

During Howling Maelstrom, Sszorak channels Dig In for **25 seconds** and takes **30% increased damage**.

This makes the Maelstrom sequence the major damage window of the encounter.

For `wow-trainer`, the damage bonus itself is secondary, but the **25-second duration is useful as the overall Maelstrom phase window**.

### Maelstrom execution

For each wind:

```text
wind activates
→ raid begins being pushed
→ raid reaches assigned cyst
→ cyst is triggered
→ cyst knockback opposes wind
→ players remain on platform
→ reposition for next wind
```

Example:

```text
WIND >>>>>>>>>>>>>>>>

       Raid
        ●
        |
      [CYST]

CYST <<<<<<<<<<<<<<<<
```

The forces do not have to be represented as perfectly cancelling vectors; the important gameplay result is that correct cyst positioning keeps players safely on the platform.

### Fourth cyst

Immediately after the three Maelstrom winds:

```text
Wind #1 + Cyst #1
→ Wind #2 + Cyst #2
→ Wind #3 + Cyst #3
→ prepare immediately
→ trigger Cyst #4
→ next encounter cycle begins
```

The fourth activation needs to happen quickly because the encounter resumes almost immediately.

### Trainer failure

- Wrong cyst triggered.
- Cyst triggered too early.
- Player stands on the wrong side of the cyst.
- Wind pushes player from arena.
- Fourth cyst is missed.
- Player fails to reposition between winds.

---

# 6. Environmental Poison

## Caustic Claws — `Spell ID 1305998`

Creates poison impacts around players and leaves Caustic Residue.

These hazards should primarily function as **progressive arena denial** rather than their own standalone exercise.

---

## Caustic Residue — `Spell ID 1296602` — **1s damage ticks while inside**

Standing in the pool:

- deals Nature damage every **1 second**;
- increases damage taken by 30%.

### wow-trainer use

Spawn pools throughout the encounter so that repetition gradually reduces available space.

They become particularly relevant during:

- Raging Crosswinds pairing;
- Virulence spreading;
- Viscous Cyst placement;
- Maelstrom repositioning.

---

# 7. Tank Background Mechanic

## Corroding Venom — `Spell ID 1282869` — **12s debuff**

Sszorak's melee attacks stack a debuff increasing Physical damage taken.

Each stack lasts **12 seconds**.

This does not need substantial simulation for non-tank training.

For tank training, it can be used as additional pressure around Apex Predator and tank swaps.

---

# 8. Passive Raid Damage

## Ula'tek's Presence — `Spell ID 1285961` — **2s damage interval**

The altar periodically deals raid-wide Nature damage every **2 seconds**.

This can remain abstract background damage in `wow-trainer`; it does not require player interaction.

---

# Encounter Flow

The encounter should follow the strategy demonstrated in the video without relying on timestamps from the edited footage.

```text
PULL
  ↓
Position Sszorak near outer edge
  ↓
APEX PREDATOR
5 randomized attacks
Ravage / Mutilate / Tempest
  ↓
SERPENT'S FURY
delay stack → stack → charge → spread
  ↓
VENOMOUS SURGE
place cysts
  ↓
Move boss toward opposite side
  ↓
RAGING CROSSWINDS
find partner → align → knock → collide
  ↓
APEX PREDATOR
second randomized combo
  ↓
SERPENT'S FURY
delay stack → stack → charge → spread
  ↓
VENOMOUS SURGE
place remaining cysts
  ↓
RAGING CROSSWINDS
pair again
  ↓
Move Sszorak to center
  ↓
HOWLING MAELSTROM / DIG IN
25s phase
  ↓
Wind #1 → Cyst #1
Wind #2 → Cyst #2
Wind #3 → Cyst #3
  ↓
Additional knock → Cyst #4
  ↓
REPEAT
```

# Recommended `wow-trainer` Training Modules

| Priority | Module | Primary skill |
|---|---|---|
| 1 | **Raging Crosswinds** | Quickly identify the correct partner and align knock trajectories |
| 2 | **Howling Maelstrom** | Read wind order, position correctly and trigger cysts |
| 3 | **Apex Predator** | Rapid recognition of Ravage / Mutilate / Tempest |
| 4 | **Serpent's Fury** | Stack timing followed immediately by controlled spread |
| 5 | **Venomous Surge** | Accurate bomb placement under movement pressure |
| 6 | **Full Encounter** | Combine all mechanics with progressively restricted arena space |

# Spell Reference

| Spell | Spell ID | Relevant timing |
|---|---:|---|
| Apex Predator | `1277025` | Instant; 5-attack combo |
| Ravage | `1277002` | **3s cast**, vulnerability **25s** |
| Mutilate | `1277027` | **3s cast** |
| Mutilated Gash | `1277051` | **22s debuff** |
| Tempest | `1287072` | Hit debuff **6s** |
| Venomous Surge | `1305959` | **4s channel**, target debuff **10s** |
| Viscous Cyst | `1287008` | Exists **120s**, post-burst toxin **5s** |
| Raging Crosswinds | `1285419` | **8s debuff** before knock |
| Turbulent Gusts | `1285447` | **10s debuff** or until player collision |
| Serpent's Fury | `1297367` | Persistent Rage mechanic |
| To the Slaughter | `1297414` | Triggered when 14 players are within 8 yd |
| Virulence | `1297707` | **5s debuff** |
| Unbound Ferocity | `1296898` | Encounter failure state |
| Howling Maelstrom | `1285732` | Instant trigger |
| Dig In | `1286033` | **25s channel** |
| Caustic Claws | `1305998` | Impact mechanic |
| Caustic Residue | `1296602` | **1s damage ticks** while inside |
| Corroding Venom | `1282869` | **12s debuff** |
| Ula'tek's Presence | `1285961` | **2s damage interval** |

## Notes for Implementation

Do not derive an exact boss timeline in seconds from the source video. The footage is edited, so time between mechanics is unreliable.

Use the source for:

- mechanic order and relationships;
- player responsibilities;
- mechanic combinations;
- individual cast/debuff durations.

A precise encounter timeline should later be derived from combat logs / Warcraft Logs once representative Sszorak pulls are available.
