# Nek'zali the Soulcoiler — wow-trainer Encounter Specification

**Raid:** The Venomous Abyss\
**Encounter:** Nek'zali the Soulcoiler\
**Role in raid:** First boss\
**Specification date:** 2026-08-16\
**Input:** Supplied German boss-guide transcript\
**Target:** `wow-trainer`, browser-based World of Warcraft raid mechanic simulator

> **Version status:** The encounter is present in the live 12.1 client data, but The Venomous Abyss does not open in Europe until 2026-08-19. The strategy transcript therefore still reflects PTR/pre-release testing. Numerical spell data below was checked against the current live Wowhead encounter journal/spell database on 2026-08-16. Cadence, targeting edge cases, pathing, and several guide-vs-journal discrepancies remain subject to live combat-log verification and early hotfixes.

---

# 1. Encounter Design Summary

Nek'zali is a two-stage encounter separated by a health-triggered intermission.

The central gameplay constraint is the **Soulcoil Well** in the middle of the arena:

- players should normally stay out of it;
- Restless Amani repeatedly attempt to reach it;
- a Restless Amani reaching the well triggers **Soulcoil Rite**;
- a player dying in the well is **Soulcoiled** and ultimately also triggers a Rite;
- every Rite grants Nek'zali **5 energy**;
- at full energy Nek'zali enters **Uncoiled Rage**, effectively the encounter failure/enrage state.

The fight combines four persistent responsibilities:

1. keep adds away from the Soulcoil Well;
2. place **Latent Cultist** hazards at useful locations;
3. execute the tank-facing **Possession Barrage** safely away from the raid;
4. preserve enough boss damage to avoid being overwhelmed by the increasingly dense Stage Two add pressure.

At 50% health, Nek'zali becomes unavailable and the raid must defeat two **Echoes of Jawae**. Previously killed Amani leave **Vessels of Awakening**, which become an intermission cleanup resource: **Hungering Pyre** and **Cremation** can destroy them.

The encounter becomes much more spatially unstable in Stage Two because **Invoke** forces the Latent Cultists to perform **Entwined Step**, rapidly repositioning the persistent hazard layout. On Mythic, Invoke also punishes players who are still casting as it resolves.

A second Mythic gameplay layer exists inside the Soulcoil Well. During **Grasping Depths**, assigned groups deliberately enter the well, interrupt and kill a **Drowned Echo**, dodge **Swirling Spirit**, then leave with **Soul Exhaustion**. The transcript strategy alternates two groups because Soul Exhaustion makes immediate re-entry extremely dangerous.

---

# 2. Recommended wow-trainer State Model

The simulator does not need a full WoW combat engine. It needs enough state to reproduce the encounter's decisions and failure conditions.

Suggested core state:

```text
encounterPhase:
  STAGE_ONE
  INTERMISSION_ECHO_1
  INTERMISSION_ECHO_2
  STAGE_TWO
  ENRAGE
  COMPLETE

boss:
  healthPercent
  energy                # 0..100
  position
  activeTarget
  casting
  attackable

players[]:
  role                   # tank / healer / melee / ranged
  position
  alive
  casting
  selectedTarget
  essenceRendRemaining
  ritualBurnStacks
  hollowingStacks
  corpseBlightStacks
  slitheringFlameRemaining
  cremationRemaining
  soulExhaustionRemaining
  swirlingSpiritStacks
  insideWell

restlessAmani[]:
  position
  alive
  shieldRemaining
  fixatingWell
  crowdControlState
  threatTarget

latentCultists[]:
  position
  active

vessels[]:
  position
  active

echoOfJawae:
  position
  active
  attackable
  castState

drownedEcho:
  active
  health
  castState

configuration:
  stageTwoEssenceRendEnabled
  barrageAppliesHollowing
  corpseBlightMode
  echoSpawnPattern
```

The four configuration switches above exist because the current source material is not yet fully consistent. See **Open / Unverified Details**.

---

# 3. Arena and Spatial Model

## Soulcoil Well

Place a circular forbidden region in the exact center of the arena.

The exact well radius was not found in authoritative spell data and should therefore be a configurable simulator value rather than represented as a claimed in-game yard value.

Normal encounter behavior:

- entering the well deals periodic damage;
- dying inside it leads to Soulcoiled / Soulcoil Rite;
- Restless Amani path toward its center;
- the Mythic Drowned Echo layer is accessible through it only while Grasping Depths is active.

## Outer ring

The transcript strategy deliberately uses the outer arena for:

- Essence Rend expiration / dispel locations;
- Possession Barrage tank positioning;
- keeping Latent Cultists away from the central movement lane;
- storing Amani corpses/Vessels for later intermission cleanup.

## Add-entry sectors

Restless Amani emerge from sarcophagi around the outer arena.

For training, randomize which outer sector activates rather than hard-coding one route. The important skill is:

```text
identify active add side
→ move boss toward it
→ use grips/knockbacks/CC to consolidate stragglers
→ break shields
→ kill before the adds reach the center
```

## Echo anchors

The transcript describes four fixed possible edge positions, with two used during an intermission. The current encounter journal confirms sequential Echoes but does not verify the transcript's exact "two random positions out of four" selection logic.

Represent four configurable anchors in the arena. Spawn one Echo at a time.

---

# 4. Global Failure / Success Conditions

## Encounter success

- both intermission Echoes are defeated;
- Nek'zali is defeated in Stage Two;
- the raid avoids reaching a terminal Soulcoil Rite/enrage state long enough to finish the boss.

## Primary encounter failures

- a Restless Amani reaches the Soulcoil Well;
- a player dies in the Soulcoil Well;
- repeated Soulcoil Rites push Nek'zali to 100 energy;
- Possession Barrage is intercepted close to the raid;
- too many persistent Latent Cultist hazards are placed in high-traffic areas;
- Stage Two add waves reach the well because the raid overcommits to boss damage;
- boss damage is too low because the raid spends too long chasing poorly grouped adds;
- Hungering Pyre is under-soaked;
- Cremation is overlapped onto other players;
- a Drowned Echo cast is allowed to resolve on Mythic;
- the same Mythic well group re-enters while Soul Exhaustion makes the damage unsustainable;
- Invoke interrupts active player casts on Mythic, causing the 3-second silence at a critical moment.

---

# 5. Core Well / Energy Mechanics

## Soulcoil Well — Spell ID 1284032 — 1s damage tick

### What happens

The central well damages players standing within it every second. Restless Amani reaching it trigger Soulcoil Rite. A player who dies in the well becomes Soulcoiled.

### Telegraph

- permanent central arena feature;
- visually distinct pool/well;
- location never changes.

### Targeting

Any player entering the well is affected.

### Required reaction

Stay outside the well unless deliberately entering during the Mythic Grasping Depths mechanic.

### Success condition

No uncontrolled player deaths occur inside the well, and no Restless Amani reaches it.

### Failure conditions

- player remains in the well and dies;
- add reaches the well;
- player is accidentally knocked into the well and does not recover;
- incorrect Mythic group enters the well.

### wow-trainer implementation notes

- central circular hazard;
- periodic health pressure can be represented by a rapidly filling danger meter rather than exact damage;
- touching it should be warning-level failure;
- dying in it should be encounter-critical failure and invoke the Soulcoiled/Rite logic;
- while Grasping Depths is active, allow deliberate entry and switch the player into the sub-realm simulation.

---

## Soulcoil Rite — Spell ID 1284033 — instant / 44s stacking debuff / 2s tick

### What happens

Each Rite:

- grants Nek'zali **5 energy**;
- deals raid-wide damage;
- applies a stacking periodic damage effect lasting **44 seconds** in current live spell data.

On the higher-difficulty rules included in this specification, each Rite also interacts with Ritual Burn.

### Telegraph

- Soulcoil Well activation;
- Restless Amani reaching the center;
- Soulcoiled sacrifice;
- Soulcoil Ignition;
- Invoke.

### Targeting

Entire raid.

### Required reaction

The core counterplay is preventive:

- stop Amani from reaching the well;
- do not die in the well;
- resolve the triggering mechanics correctly.

### Success condition

Keep the number of avoidable Rites low enough that raid pressure and boss energy remain controlled.

### Failure conditions

- repeated add leaks;
- player sacrifices;
- unnecessary Rite stacks;
- Nek'zali reaches 100 energy.

### wow-trainer implementation notes

Do not simulate exact damage numbers. Track:

```text
bossEnergy += 5
soulcoilRiteStacks += 1
```

Use Rite stacks as escalating pressure/scoring.

The 44-second duration changed substantially during testing builds, so keep it data-driven.

---

## Ritual Burn — Spell ID 1297624 — 1m debuff

### What happens

Soulcoil Rite increases subsequent Soulcoil Rite damage taken by **15% per stack for 1 minute**.

### Telegraph

Debuff stack on the player/raid.

### Targeting

Raid-wide through Soulcoil Rite.

### Required reaction

No special movement reaction. Prevent additional Soulcoil Rites.

### Success condition

Avoid avoidable Rite triggers.

### Failure conditions

Accumulating enough stacks that later Rites become lethal.

### wow-trainer implementation notes

Background pressure only. A numeric stack counter is enough; no need for a dedicated training module.

---

## Soulcoiled — Spell ID 1290361 — 1m aura

### What happens

A claimed player's soul is compelled toward the Soulcoil Well and is sacrificed on reaching it, triggering Soulcoil Rite.

The main encounter-journal route into this state is a player dying within the Soulcoil Well. The Drowned Echo's Soulcoiler's Curse can also leave players Soulcoiled.

### Telegraph

Visible forced-soul/compulsion state and debuff.

### Targeting

Players affected by the relevant failure mechanic.

### Required reaction

This is primarily a failure-result state, not a normal voluntary reaction.

### Success condition

Do not enter this state.

### Failure conditions

Soulcoiled reaches the well and triggers Soulcoil Rite.

### wow-trainer implementation notes

Treat Soulcoiled as a near-terminal mechanic failure. Animate a forced path toward the center and trigger a Rite on arrival.

---

## Uncoiled Rage — Spell ID 1284034 — 5s cast / full-energy enrage

### What happens

At full energy Nek'zali gains:

- 150% increased attack speed;
- 150% increased movement speed;
- 500% increased damage;
- taunt immunity.

For trainer purposes this is effectively the fail state for allowing too many Soulcoil Rites.

### Telegraph

Boss reaches 100 energy and begins the 5-second cast.

### Targeting

Whole encounter.

### Required reaction

The meaningful reaction happened earlier: prevent enough Rites that the boss never reaches full energy.

### Success condition

Kill Nek'zali before the energy failure state.

### Failure conditions

100 energy reached.

### wow-trainer implementation notes

Trigger an explicit **ENRAGE / RUN FAILED** state after the cast rather than attempting to model the subsequent wipe.

---

# 6. Stage One Mechanics

## Soulcoil Ignition — Spell ID 1285681 — 4s channel / 1s Rite cadence during channel

### What happens

Nek'zali channels for 4 seconds and invokes Soulcoil Rite once per second during the channel.

At the same time, Anguished Echoes emerge from the well and impact the arena. Their impact damages and knocks back players within **5 yards**.

The transcript associates this sequence with the awakening of the Restless Amani wave: spirits travel from the well toward their corpses, then the adds begin moving back toward the well.

### Telegraph

- 4-second boss channel;
- repeated well pulses;
- visible spirit/impact locations;
- active sarcophagi/add spawn direction.

### Targeting

- Rite: whole raid;
- Anguished Echo impacts: ground locations;
- Amani spawn sector: encounter-selected outer locations.

### Required reaction

- dodge the 5-yard impact locations;
- identify the add side immediately;
- tanks reposition boss toward the active add wave;
- assigned players grip/knock/CC stragglers;
- break Gravebound Advance shields and kill the adds.

### Success condition

- no avoidable impact hit;
- add group is consolidated;
- no Amani reaches the well.

### Failure conditions

- player is hit/knocked into the well or another hazard;
- raid fails to identify the add side quickly;
- adds remain split and consume too much raid movement/DPS;
- add reaches center.

### wow-trainer implementation notes

This is a high-value combined module:

1. start a visible 4-second channel;
2. spawn several 5-yard impact telegraphs;
3. reveal one or more active outer add sectors;
4. spawn Amani after the visual travel;
5. require the player to move with the boss/add group while dodging.

Do **not** infer exact add-wave timing from the edited guide video.

---

## Essence Rend — Spell IDs 1287426 / 1287427 / 1287434 — 5s pull / 15s Magic debuff / 1s tick

### What happens

Nek'zali targets several players and pulls them inward for **5 seconds**, then knocks them away.

The affected player retains a **15-second Magic debuff**. When the debuff is removed — by expiration or a dispel — a Latent Cultist appears at that player's location.

The transcript strategy intentionally uses the knockback to shorten the trip toward the outside and places the resulting Latent Cultist hazards near the arena edge.

### Telegraph

- Essence Rend cast/target marker;
- targeted player is visibly pulled;
- 15-second Magic debuff after the pull;
- final knockback before the placement window.

### Targeting

Several players.

Current spell data exposes a default max-target field of 4, but raid-size scaling/actual target count should be verified from live logs before hard-coding it.

### Required reaction

1. orient so the knockback helps move toward a planned outer drop location;
2. move to the edge without crossing dangerous lanes;
3. coordinate dispel timing if the raid is deliberately removing the debuff early;
4. ensure the Latent Cultist spawns away from the central add/tank path.

### Success condition

Latent Cultist hazards are arranged around the outer arena and leave usable movement paths for:

- adds;
- tanks;
- melee;
- intermission Echo movement.

### Failure conditions

- dispel/expires in the raid;
- hazard appears near the Soulcoil Well;
- hazard blocks the route to a future add wave;
- two targeted players stack their hazard placements unnecessarily;
- knockback sends player into the well.

### wow-trainer implementation notes

Primary player training should emphasize **placement geometry**, not healing.

Suggested mechanic state:

```text
target selected
→ 5s pull
→ knockback
→ 15s removable Magic debuff
→ removal/expiration
→ spawn Latent Cultist at current player coordinates
```

Randomize targeted players and allow a simulated dispel button/action.

### Stage Two source conflict

The supplied transcript explicitly states that the Stage One "drop debuff" no longer occurs in Stage Two.

The current 12.1 encounter journal, however, explicitly lists **Essence Rend** under Stage Two.

Do not hide this discrepancy.

Recommended implementation:

```text
stageTwoEssenceRendEnabled = configurable
```

For strict transcript reproduction, set it to `false`.\
For current-journal testing, set it to `true` until live combat logs establish the production behavior.

---

## Latent Cultist — Spell ID 1287198 — instant spawn / hazard lifetime not reliably verified

### What happens

A Latent Cultist materializes where Essence Rend is removed.

Its appearance has a **6-yard** danger radius. The necrotic area around it deals periodic damage and slows players standing within it by **40%**.

The transcript describes these hazards as encounter-persistent and slowly circulating around the well. In Stage Two, Invoke makes them rapidly reposition with Entwined Step.

### Telegraph

- visible spirit/cultist;
- necrotic ground area;
- abrupt movement/reposition during Invoke.

### Targeting

Position is determined by the Essence Rend player's location when the debuff is removed.

### Required reaction

- place Stage One Cultists near the outer edge;
- never stand in their area;
- in Stage Two, react to the new position after Entwined Step rather than relying on a memorized safe spot.

### Success condition

Maintain navigable safe corridors and avoid every repositioned hazard.

### Failure conditions

- spawn in high-traffic area;
- stand in necrotic ground;
- get slowed while an add/well/tank mechanic requires movement;
- pre-move incorrectly during Invoke and get caught by a newly repositioned Cultist.

### wow-trainer implementation notes

Represent as persistent circular moving hazards.

Because the current spell page contains technical aura/area-trigger timing that does not establish the encounter lifetime, do not claim a finite ground-duration value.

Stage One movement can be slow orbital drift.

Stage Two movement should occur in discrete, abrupt reposition events driven by Entwined Step.

---

# 7. Restless Amani Add System

## Restless Amani — NPC ID 263974 — recurring add wave

### What happens

Ancient spirits return to Amani corpses/sarcophagi around the outer edge and attempt to reach the Soulcoil Well.

The transcript strategy:

- moves Nek'zali toward each new add wave;
- uses Death Knight grips for outlying adds;
- supplements with knockbacks such as Evoker/Druid tools when required;
- groups the adds onto the boss for efficient cleave.

### Telegraph

- spirits travel from the center toward outer graves;
- sarcophagi / active add side becomes visible;
- adds begin pathing toward the well.

### Targeting

The well is their initial objective while Gravebound Advance holds.

### Required reaction

- move boss toward the spawn;
- break shields with magic damage;
- use CC/displacement to prevent center progress;
- consolidate and kill efficiently.

### Success condition

Every add dies before reaching the Soulcoil Well.

### Failure conditions

- shield remains intact too long;
- insufficient CC;
- boss is positioned too far from the wave;
- raid follows individual adds instead of grouping them;
- one add reaches the well.

### wow-trainer implementation notes

A full damage model is unnecessary.

Use:

```text
shield state
→ pathing to center
→ player magic-damage action breaks shield
→ CC/displacement enabled
→ normal tank/aggregation state
→ kill progress
```

Training can score:

- time to react to spawn direction;
- total distance adds travel toward well;
- correct shield-break order;
- successful consolidation;
- add leaks.

---

## Gravebound Advance — Spell ID 1287533 — magic absorb equal to 25% max health

### What happens

Restless Amani start protected by a barrier that:

- absorbs magic damage equal to **25% of their maximum health**;
- prevents them from being destroyed while active;
- makes them fixate the Soulcoil Well.

The transcript says the shield must be broken with magic damage; after it breaks, the add follows normal aggro behavior and can be controlled/collected.

### Telegraph

Visible magic shield on the add.

### Targeting

Every relevant Restless Amani.

### Required reaction

Use magic damage to remove the shield quickly, then CC/displace/tank the add away from the well.

### Success condition

Barrier breaks with enough remaining distance to safely control and kill the add.

### Failure conditions

- physical-only response does not progress the intended shield objective;
- shield survives until add reaches well;
- CC is wasted before the simulator considers the add controllable.

### wow-trainer implementation notes

Use a simplified shield bar that only responds to a `MAGIC_DAMAGE` interaction. Once zero:

```text
fixatingWell = false
crowdControlAllowed = true
threatBehavior = normal
```

---

## Corpse Blight — Spell ID 1294729 — 15s stacking debuff / 1s tick

### What happens

A Restless Amani erupts on death and applies stacking periodic Plague damage.

Current live encounter-journal/spell text describes the initial effect as raid-wide and the debuff as **15 seconds**.

The supplied transcript describes a **15 m** proximity effect around each dying add, and at least one strategy source has also described a local-radius version during testing.

### Telegraph

Add death / necrotic death pulse.

### Targeting

**Source conflict:** current journal says all players; transcript says players near the death location.

### Required reaction

No reliable player-positioning requirement should be hard-coded until live behavior is verified.

The strategic reaction remains:

- do not stagger add kills so badly that the raid accumulates uncontrolled pressure;
- heal through expected death bursts.

### Success condition

Adds die without creating an unmanageable stack pattern.

### Failure conditions

Excessive simultaneous/staggered stacks depending tuning.

### wow-trainer implementation notes

Treat primarily as background pressure.

Recommended configurable behavior:

```text
corpseBlightMode = RAID_WIDE | LOCAL_RADIUS
```

Do not use the transcript's 15 m as a production simulator radius until live verification.

---

## Vessel of Awakening — Spell ID 1295263 — persistent corpse object

### What happens

Defeated Restless Amani leave corpses/Vessels on the ground. During the intermission, these can be repossessed unless removed.

The transcript's strategy deliberately uses:

- Hungering Pyre to erase the largest corpse cluster;
- Cremation players to remove isolated corpses.

### Telegraph

Visible corpse object at each defeated Amani's position.

### Targeting

Created by Amani deaths.

### Required reaction

During Stage One, kill/group Amani in locations that create useful corpse piles.

During the intermission, intentionally overlap cleanup mechanics with those piles.

### Success condition

Most or all dangerous Vessels are destroyed before they can become a meaningful intermission problem.

### Failure conditions

- corpses scattered across the room;
- main Pyre soak misses the corpse pile;
- Cremation players fail to clean isolated Vessels.

### wow-trainer implementation notes

Persist each Amani death position as a small object.

This creates a valuable relationship between earlier positioning and later intermission execution.

Do not model the spell database's extremely long technical aura duration as a meaningful encounter duration.

---

# 8. Tank Mechanics

## Possession Barrage — Spell ID 1284103 — 6s cast

### What happens

Nek'zali launches multiple spectral echoes toward her primary target. Each echo bursts on first impact and deals raid-wide damage.

The raid-wide damage is **reduced the farther the echo travels before impact**.

The transcript strategy treats this as a tank mechanic that must be carried far away from the raid in the current movement direction. Nobody should stand between the boss and the tank, because an intercept causes an early detonation close to the group.

### Telegraph

- 6-second cast;
- boss faces primary tank;
- visible spectral echoes/projectiles along the boss-to-tank lane.

### Targeting

Primary tank.

### Required reaction

Tank:

- move far away from the raid;
- choose a lane without other players;
- preferably use the direction the raid is already moving.

Other players:

- stay out of the barrage lane;
- melee remain behind the boss rather than between boss and tank.

### Success condition

Every echo travels a long distance and reaches the intended tank/outer impact point without interception.

### Failure conditions

- raid member intercepts an echo;
- tank remains too close to the boss/raid;
- barrage lane crosses the add group or melee;
- tank positions into a Latent Cultist hazard.

### wow-trainer implementation notes

Render a directional lane from boss toward current tank.

Spawn a sequence of spectral echoes. The current spell data exposes a 2-second periodic sub-aura with 0.5-second ticks, but that alone is not sufficient evidence to hard-code a projectile count. Keep `projectileCount` configurable until logs verify it.

Calculate a simplified raid penalty from distance traveled:

```text
short travel -> severe raid penalty
long travel  -> reduced raid penalty
```

Any non-tank collision before the intended endpoint should count as an avoidable failure.

### PTR immunity interaction

The transcript reports a PTR interaction where Paladin Divine Shield could cancel/prevent the actual echo sequence.

The current spell has an "unaffected by invulnerability" flag. Do **not** build the PTR immunity trick into the trainer unless live testing confirms it still works.

---

## Hollowing Strikes — Spell ID 1284109 — 15s stacking debuff / 3s tick

### What happens

Nek'zali's melee attacks apply a stacking debuff that:

- deals Shadow damage every **3 seconds**;
- lasts **15 seconds**;
- reduces healing and absorption received by **5% per stack**.

The transcript recommends a tank swap at a low stack count, usually around each Possession Barrage cycle.

### Telegraph

Stacking tank debuff.

### Targeting

Current boss target / active tank.

### Required reaction

Swap tanks before healing reduction becomes dangerous.

The exact stack threshold should not be a hard-coded "2 stacks" rule because:

- it is strategy/tuning dependent;
- the current value is 5% per stack;
- the relationship between Possession Barrage and additional Hollowing applications is not consistently documented.

### Success condition

Active tank's stacks remain controllable and the off-tank has time for stacks to expire.

### Failure conditions

- tank does not swap;
- healing/absorb reduction stacks too high;
- swap occurs while the next tank is incorrectly positioned for Barrage.

### wow-trainer implementation notes

A tank-specific module should combine:

```text
Hollowing stack management
+ Barrage lane/distance
+ swap timing
```

Use a configurable swap recommendation rather than enforcing a fixed stack number.

### Source conflict: Barrage interaction

The transcript says each Possession Barrage echo adds a tank debuff stack.

The current Wowhead encounter journal explicitly associates Hollowing Strikes with melee attacks and does not state that Barrage adds stacks. Other current/pre-release guide material has described a Barrage/Hollowing interaction.

Recommended implementation:

```text
barrageAppliesHollowing = configurable
```

Live log validation is required.

---

# 9. 50% Intermission: Ritual of Awakening

## Transition behavior

At **50% boss health**:

- Nek'zali retreats into the Soulcoil Well;
- the boss becomes unavailable;
- the raid must resolve sequential Echoes of Jawae;
- the transcript says active boss casts are canceled at the health transition;
- any surviving Restless Amani still matter and must be finished before reaching the well.

The trainer should trigger this transition by health, not by time.

---

## Soul Transfer — Spell ID 1292248 — 15s cast

### What happens

Jawae transfers essence to an Echo over **15 seconds**, after which a blast of soul energy affects players caught in it.

The transcript describes the visual as a laser/beam directed toward the Soulcoil Well that players dodge before the Echo becomes tankable/movable.

### Telegraph

- 15-second cast;
- visible line/beam toward the well;
- stationary Echo at one outer anchor.

### Targeting

Line/area between Echo and central well according to transcript presentation.

### Required reaction

Move out of the beam/blast line, then prepare to pick up and reposition the Echo as it becomes active.

### Success condition

No player is caught by the transfer blast, and the raid immediately starts moving the active Echo toward the intended corpse pile.

### Failure conditions

- player remains in the beam;
- tank reacts late;
- Echo is left too far from the Vessel cluster needed for Pyre cleanup.

### wow-trainer implementation notes

Represent a clear line telegraph from the Echo anchor toward the well.

The exact beam width/geometry is not exposed by the current spell data and must remain configurable.

---

## Tether of Awakening — Spell ID 1289696 — channel / damage immunity

### What happens

An Echo protects Nek'zali through a tether and gains immunity to all damage while the relevant transfer/tether state is active.

Defeating the active Echo severs its tether. The intermission ends after both required Echo sequences are completed.

### Telegraph

Visible tether from Echo toward the well/boss state.

### Targeting

Active Echo.

### Required reaction

Resolve Soul Transfer, then kill the Echo once it becomes attackable.

### Success condition

First tether is severed, then the second Echo is handled identically.

### Failure conditions

Attempting to damage an immune Echo instead of resolving positioning.

### wow-trainer implementation notes

Use a simple attackable/immune state switch.

No detailed damage modeling is required.

---

## Hungering Pyre — Spell ID 1289855 — 7.5s cast / 10yd split-soak radius

### What happens

The active Echo casts Hungering Pyre for **7.5 seconds**.

At resolution, Fire damage is split between players within **10 yards**. Players not hit by the Pyre are targeted by Slithering Flame.

The supplied strategy deliberately tanks the Echo on the largest Vessel pile so the large Pyre area also destroys/cleans the clustered corpses.

### Telegraph

- 7.5-second cast;
- large circular soak around the Echo/tank;
- nearby Vessel pile.

### Targeting

Players inside the 10-yard Pyre area share the hit. Players outside are candidates for Slithering Flame.

### Required reaction

Normal group:

- stack within the 10-yard soak.

Assigned cleanup players:

- remain outside intentionally;
- receive Slithering Flame;
- use the eventual Cremation around isolated Vessel positions without clipping other players.

The transcript suggests "up to four" outside players as a strategy choice, not a verified mechanic requirement.

### Success condition

- enough players soak the Pyre;
- main corpse pile is covered;
- selected non-soakers are correctly spaced for later corpse cleanup.

### Failure conditions

- too few players soak;
- Echo is not positioned over the corpse pile;
- unnecessary players remain outside;
- outside players fail to prepare safe Cremation locations.

### wow-trainer implementation notes

This should be a combined positioning puzzle:

```text
corpse layout from Stage One
→ tank moves Echo to largest cluster
→ player chooses soak vs assigned non-soak
→ Pyre resolves
→ Slithering Flame targets non-soakers
→ Cremation cleanup
```

Randomize Vessel layouts so players practice reading the room rather than memorizing one spot.

---

## Slithering Flame — Spell ID 1294933 — 8s debuff / 1s tick

### What happens

Players not hit by Hungering Pyre are sought by Slithering Flame and receive an **8-second** periodic Fire debuff.

In the higher-difficulty rules included here, it combusts into Cremation when it expires.

### Telegraph

- serpent/flame visual toward non-soaker;
- 8-second debuff.

### Targeting

Players not struck by Hungering Pyre.

### Required reaction

If intentionally assigned:

- move toward an isolated Vessel/corpse;
- stay away from other players;
- time the expiration so Cremation destroys the object.

If unintentionally targeted, still avoid the raid and minimize collateral damage.

### Success condition

Debuff expires over the planned cleanup location with no player overlap.

### Failure conditions

- expiration in group;
- wrong corpse selected;
- player is too far from any useful Vessel;
- cleanup player crosses another hazard.

### wow-trainer implementation notes

Show a visible countdown and highlight viable corpse cleanup targets.

---

## Cremation — Spell ID 1289875 — 4yd explosion / 3s debuff / 0.5s tick

### What happens

On Slithering Flame expiration, Cremation explodes.

It:

- affects players in a **4-yard** radius;
- incinerates corpses and Restless Amani within that radius;
- leaves a 3-second periodic damage effect.

### Telegraph

Slithering Flame countdown reaches zero; show a 4-yard personal danger ring.

### Targeting

Around each affected player.

### Required reaction

Place the 4-yard explosion on an intended Vessel/corpse and away from other players.

### Success condition

- target corpse is removed;
- no other player is inside the 4-yard explosion.

### Failure conditions

- player overlap;
- no useful corpse inside the explosion;
- Cremation is dropped in the Pyre stack.

### wow-trainer implementation notes

This is ideal for precision-placement scoring.

Award full success only if:

```text
destroyedVessels >= 1
AND playersHitByCremation == 0
```

---

# 10. Mythic Well Layer

The supplied transcript describes a recurring Mythic mechanic in which the raid is split into two assigned groups that alternate entering the Soulcoil Well.

The exact encounter cadence and whether every occurrence aligns to a Restless Amani wave must be verified from live Mythic logs.

---

## Grasping Depths — Spell ID 1293212 — active until Drowned Echo is defeated / raid tick every 1s

### What happens

A Drowned Echo awakens inside the Soulcoil Well.

While it lives:

- the raid takes periodic Shadow damage every **1 second**;
- players are periodically pulled toward the well;
- players are allowed to enter the well;
- assigned players enter the sub-realm and kill the Drowned Echo.

The transcript describes additional ghost visuals around the well as the cue to enter.

### Telegraph

- Grasping Depths activation;
- additional ghosts around the well;
- periodic pull toward center;
- Drowned Echo visible inside the well layer.

### Targeting

Whole raid is affected by the pull/ambient pressure.

Assigned subgroup deliberately enters the well.

### Required reaction

- assigned group enters promptly;
- non-assigned group remains outside and maintains normal boss/add duties;
- inside group interrupts Soulcoiler's Curse;
- dodge Swirling Spirits;
- kill Drowned Echo rapidly;
- leave and receive Soul Exhaustion;
- next occurrence uses the alternate group.

### Success condition

Drowned Echo dies quickly, no Curse resolves, and the correct group returns alive.

### Failure conditions

- wrong group enters;
- too few players enter and add survives too long;
- same exhausted group re-enters;
- outer group loses control of Restless Amani while too many players are inside.

### wow-trainer implementation notes

Represent the well interior as a second arena state rather than a literal separate map.

For a player assigned to the inside group:

```text
enter well
→ switch layer
→ interrupt check
→ rotating spirit dodge
→ damage/kill progress
→ exit
→ apply Soul Exhaustion
```

For the outside group, continue the normal add/well simulation.

A later full encounter mode should allow both layers to progress concurrently.

---

## Immortal Coil — Spell ID 1299988 — 1m aura / 1s tick

### What happens

Players within the Mythic well layer take Shadow damage every second.

Current spell data shows a 1-minute aura, but in gameplay the relevant window is the time spent inside resolving the Drowned Echo.

### Telegraph

Inside-well visual/aura.

### Targeting

Players in the well layer.

### Required reaction

Minimize time inside by killing the Drowned Echo efficiently.

### Success condition

Exit after the add dies without excessive exposure.

### Failure conditions

Stay inside too long, especially with Soul Exhaustion.

### wow-trainer implementation notes

Use a rising danger meter while inside rather than exact damage values.

---

## Soulcoiler's Curse — Spell ID 1300238 — 10s cast / interruptible

### What happens

The Drowned Echo casts for **10 seconds**.

If it resolves, players inside the well are ejected and left Soulcoiled, creating a severe/wipe-level outcome.

The transcript explicitly says this cast must be interrupted and that allowing repeated/continuous casts to finish quickly causes a wipe.

### Telegraph

Highly visible 10-second Drowned Echo cast bar.

### Targeting

Players inside the well.

### Required reaction

Interrupt before completion.

### Success condition

Every Soulcoiler's Curse cast is interrupted.

### Failure conditions

Cast completes.

### wow-trainer implementation notes

This is a binary interrupt check.

Randomize which assigned inside player is responsible for the interrupt in advanced modules.

Do not invent a recast interval.

---

## Swirling Spirit — Spell ID 1300239 — 5s stackable contact debuff / 1s tick

### What happens

Spirits swirl inside the well. Contact applies a stacking effect that deals Shadow damage every second for **5 seconds**.

The transcript visually describes white spirit orbs in a cross-like pattern that also rotates around the center.

### Telegraph

Visible white spirit projectiles/orbs rotating around the interior encounter space.

### Targeting

Collision based.

### Required reaction

Move through safe gaps while maintaining interrupt/DPS uptime on the Drowned Echo.

### Success condition

No spirit contact, or minimal stacks if unavoidable tuning requires it.

### Failure conditions

- collision;
- repeated collision stacks;
- dodging causes missed Soulcoiler's Curse interrupt.

### wow-trainer implementation notes

A useful representation is a rotating four-arm hazard, based on the transcript visual.

Keep:

- orbit speed;
- arm radius;
- projectile count;
- spawn cadence

configurable because exact geometry is not verified in current spell data.

---

## Soul Exhaustion — Spell ID 1300235 — 1m debuff / +300% well damage taken

### What happens

Players leaving the well receive Soul Exhaustion for **1 minute**, increasing damage taken from **Soulcoil Well** and **Immortal Coil** by **300%**.

This mechanically supports the transcript strategy of alternating two well groups.

### Telegraph

1-minute player debuff after exiting.

### Targeting

Players who leave the well during Grasping Depths.

### Required reaction

Do not re-enter while assigned as the exhausted group. Use the alternate group for the next occurrence.

### Success condition

Group assignment alternates correctly.

### Failure conditions

- exhausted player re-enters;
- group assignment confusion;
- too many players from both groups enter together, leaving outer add control weak.

### wow-trainer implementation notes

For the training UI, mark groups clearly:

```text
Group A: READY / EXHAUSTED
Group B: READY / EXHAUSTED
```

A player attempting to enter while exhausted should trigger an immediate severe warning/failure score.

---

# 11. Stage Two: Uncoiling

Stage Two begins after the intermission Echo sequence.

The transcript characterizes this phase as the same foundational encounter under much higher add pressure:

- Possession Barrage continues;
- Hollowing Strikes continues;
- Restless Amani continue and now arrive with little/no practical downtime between waves;
- 100-energy failure remains relevant;
- the boss must be moved from wave to wave;
- the raid must balance boss damage against shielded add control.

The major new spatial mechanic is Invoke → Entwined Step.

---

## Uncoiling — Spell ID 1290003 — 5s cast / 0.9s raid tick afterward

### What happens

Nek'zali uncoils the well and begins the final stage.

After the **5-second** cast, the encounter applies continuous Shadow damage every **0.9 seconds** until the boss is defeated.

### Telegraph

Stage transition cast and overflowing-well visual.

### Targeting

Whole raid.

### Required reaction

No direct movement response. This creates end-stage healing pressure and reinforces the damage race.

### Success condition

Finish Stage Two before add pressure and boss energy become unmanageable.

### Failure conditions

Indirect attrition / inability to finish.

### wow-trainer implementation notes

Background-only. Use an increasing urgency meter or passive drain; exact damage numbers are unnecessary.

---

## Invoke — Spell ID 1299673 — 5s cast / 3s silence if caught casting on Mythic

### What happens

Nek'zali casts Invoke for **5 seconds**.

At resolution:

- Soulcoil Rite is invoked;
- Latent Cultists perform Entwined Step and reposition around the Soulcoil Well;
- under the Mythic rules, active player spell casts are interrupted;
- players interrupted this way are silenced for **3 seconds**.

### Telegraph

Clear 5-second boss cast bar.

### Targeting

- Rite: raid;
- Entwined Step: all active Latent Cultists;
- Mythic cast interruption: players who are actively casting as Invoke resolves.

### Required reaction

All players:

- anticipate that persistent Cultist safe zones will change;
- be ready to dodge the new hazard positions.

Casters on Mythic:

- stop/finish casting before Invoke resolves;
- avoid beginning a cast that will still be active at resolution.

### Success condition

- player is not standing in a newly repositioned Cultist;
- caster has no active cast at the resolution moment;
- raid resumes output immediately afterward.

### Failure conditions

- clipped by moved hazard;
- active cast is interrupted;
- 3-second silence prevents a needed heal/interrupt/utility action;
- player prepositions using the old Cultist locations and gets trapped.

### wow-trainer implementation notes

This is one of the best standalone trainer mechanics.

For a caster:

```text
5.0s Invoke bar
→ allow normal simulated casting
→ at 0.0s check player.casting
→ if true: INTERRUPTED + SILENCED(3s)
→ reposition all Latent Cultists
→ force immediate spatial dodge
```

The module should reward stopping at the latest safe moment without excessive lost uptime.

---

## Entwined Step — Spell ID 1293497 — instant reposition

### What happens

Latent Cultists reposition around the Soulcoil Well.

The transcript describes them as suddenly and unpredictably moving much faster than the slow Stage One orbital behavior, with positions changing from one void/hazard location to another.

### Telegraph

Invoke cast followed by sudden spirit movement/reposition.

### Targeting

All active Latent Cultists.

### Required reaction

Read the new hazard layout after the move and enter a safe zone.

### Success condition

No collision with the old or new Cultist danger areas.

### Failure conditions

- assumes hazard remains where it was;
- paths through a new Cultist;
- gets slowed while handling an add wave/Barrage.

### wow-trainer implementation notes

Do not use a fixed sequence.

Randomize each Cultist's destination among valid positions around the well with constraints that preserve at least one navigable safe solution.

Useful generator rules:

- avoid impossible complete arena coverage;
- prevent every Cultist from selecting the exact same point unless testing overlap recognition;
- vary angular displacement;
- optionally alternate clockwise/counterclockwise-looking reposition patterns.

---

# 12. Encounter Relationships

These dependencies are central to the wow-trainer implementation.

```text
Essence Rend placement
→ creates Latent Cultist locations
→ determines Stage One movement safety
→ determines intermission melee/Echo access
→ becomes moving hazard layout during Stage Two Invoke
```

```text
Restless Amani kill locations
→ create Vessels of Awakening
→ determine intermission corpse layout
→ influence where Echo should be tanked
→ influence which players intentionally miss Hungering Pyre
→ determine Cremation cleanup routes
```

```text
Soulcoil Ignition
→ adds unavoidable Rite pressure
+ dodgeable Anguished Echo impacts
+ visual cue/add-wave pressure
→ demands simultaneous movement and add preparation
```

```text
Gravebound Advance
→ Amani fixates well and cannot die
→ magic shield must break
→ CC / displacement / normal aggregation becomes useful
→ add can be cleaved with boss
```

```text
Possession Barrage
→ tank must create distance
→ raid must keep lane clear
→ tank swap/Hollowing management follows encounter rhythm
→ tank route must avoid Latent Cultist hazards
```

```text
50% boss health
→ current boss actions end
→ boss becomes unavailable
→ remaining Amani still threaten well
→ intermission Echo sequence begins
```

```text
Hungering Pyre
→ main raid stacks
→ destroys clustered Stage One corpses
→ non-soakers receive Slithering Flame
→ Slithering Flame expires into Cremation
→ Cremation cleans isolated corpses
```

```text
Grasping Depths
→ assigned group enters well
→ Soulcoiler's Curse interrupt + Swirling Spirit dodge
→ Drowned Echo dies
→ group exits with Soul Exhaustion
→ alternate group must handle next entry
```

```text
Invoke
→ Soulcoil Rite
+ Entwined Step
+ Mythic cast-stop check
→ immediate moving-hazard dodge
```

```text
Stage Two continuous Amani pressure
→ boss moved toward each wave
→ shield break / CC / cleave
→ choose whether to keep boss DPS or swap harder to adds
→ leaking an add increases energy
→ too much add focus loses boss DPS and eventually causes wave saturation
```

---

# 13. Transcript-Preserving Strategy

## Stage One positioning

1. Start Nek'zali roughly central so the raid can react to any add side.
2. Keep melee behind the boss.
3. Essence Rend players use the knockback/movement to reach the outside efficiently.
4. Place resulting Latent Cultists along the edge, not in the middle.
5. Move Possession Barrage far away from the raid along a clear lane.
6. When the add wave becomes visible:
   - tanks move boss into the add side;
   - assigned grips pull external adds in;
   - knockbacks supplement grouping where needed;
   - magic damage breaks Gravebound Advance;
   - kill/cleave adds before they reach the well.
7. Repeat until Nek'zali reaches 50%.
8. At transition, finish any still-living Amani before they reach the center.

## Intermission

For each Echo:

1. move toward the active Echo;
2. dodge Soul Transfer toward the center;
3. once movable/attackable, tank the Echo at the largest Vessel pile;
4. stack the main group for Hungering Pyre;
5. allow only assigned cleanup players to remain outside;
6. use their Slithering Flame → Cremation to remove isolated Vessels;
7. kill the Echo;
8. repeat for the second Echo.

## Stage Two

1. Re-establish boss/add movement around the arena.
2. Move from add wave to add wave more aggressively because pressure is effectively continuous according to the transcript.
3. Keep maximum practical cleave on Nek'zali while prioritizing any add that may reach the Soulcoil Well.
4. Execute Possession Barrage/tank swaps as before.
5. React to Invoke:
   - casters stop before resolution on Mythic;
   - Latent Cultists reposition;
   - immediately move into the new safe space.
6. On Grasping Depths:
   - send the assigned well group;
   - interrupt Soulcoiler's Curse;
   - dodge Swirling Spirit;
   - kill the Drowned Echo;
   - return and mark that group exhausted;
   - alternate for the next occurrence.
7. Kill Nek'zali before 100 energy/add saturation.

---

# 14. Logical Encounter Flow

No exact encounter timestamps are assigned because the supplied video is edited and current live combat logs do not yet exist for the raid.

```text
PULL
  ↓
Boss held near center
  ↓
Stage One mechanic loop
  ├─ Essence Rend → edge placement → Latent Cultists
  ├─ Possession Barrage → tank takes lane far from raid
  ├─ Soulcoil Ignition → Rite pulses + impact dodges
  └─ Restless Amani wave
       → magic shield break
       → CC / grip / knock / consolidate
       → cleave with boss
       → Vessels remain
  ↓
Repeat while controlling boss energy
  ↓
BOSS 50%
  ↓
Boss submerges / finish surviving Amani
  ↓
INTERMISSION — ECHO 1
  ├─ Soul Transfer dodge
  ├─ move Echo to Vessel pile
  ├─ Hungering Pyre main soak
  └─ Slithering Flame → Cremation cleanup
  ↓
Kill Echo 1
  ↓
INTERMISSION — ECHO 2
  └─ repeat sequence
  ↓
Kill Echo 2
  ↓
STAGE TWO — UNCOILING
  ├─ continuous Restless Amani pressure
  ├─ Possession Barrage / Hollowing
  ├─ Invoke
  │    ├─ Soulcoil Rite
  │    ├─ Mythic stop-casting check
  │    └─ Entwined Step → moving Cultists
  ├─ Essence Rend [SOURCE-CONFLICT CONFIGURATION]
  └─ Grasping Depths occurrences
       → alternate assigned well groups
       → interrupt Curse
       → dodge Swirling Spirit
       → kill Drowned Echo
       → Soul Exhaustion
  ↓
KILL before 100 energy / add saturation
```

---

# 15. Trainer Implementation Architecture

## A. Player representation

A player needs only:

- 2D position;
- movement velocity;
- role;
- current cast state;
- interrupt action;
- optional dispel action;
- simplified damage type selector (`MAGIC` vs generic);
- CC/displacement action for Amani;
- debuff states.

No class-specific combat rotation is required for the encounter trainer.

## B. Boss/add damage abstraction

Use progress bars rather than real combat calculations:

- boss HP progress;
- Amani magic shield progress;
- Amani kill progress;
- Echo kill progress;
- Drowned Echo kill progress.

The challenge should come from **where and when the player acts**, not from simulating every WoW coefficient.

## C. Role-specific actions

### Tank

- move boss;
- identify add spawn;
- create Barrage distance/lane;
- tank swap decision;
- move Echo to corpse pile.

### Healer

- all movement mechanics;
- Essence Rend dispel timing if assigned;
- Invoke cast-stop;
- optional pressure display for Rite/Corpse Blight.

### DPS

- shield break;
- CC/grip/knock abstraction;
- add/boss target priority;
- Invoke cast-stop;
- well interrupt assignment.

## D. Randomization that adds training value

Randomize:

- active Amani spawn sector;
- Essence Rend targets;
- Essence Rend player's initial position;
- Anguished Echo impact locations;
- Latent Cultist positions;
- Entwined Step destinations;
- intermission Echo anchor selection;
- Vessel distribution based on prior Amani deaths;
- assigned Cremation cleanup targets;
- Mythic well group assignment;
- Soulcoiler's Curse interrupt owner;
- Swirling Spirit rotation direction/start angle.

Do **not** randomize so heavily that the trainer creates impossible states.

## E. Difficulty integration

Do not implement separate Normal/Heroic/Mythic encounter pages.

Use one complete ruleset with feature toggles for mechanics that need isolated modules:

```text
enableVessels = true
enableCremation = true
enableGraspingDepths = true
invokeCastStop = true
```

The final full-simulation mode should simply enable the entire training ruleset.

---

# 16. Recommended Training Modules

Ranked by expected practice value.

## 1. Stage Two: Invoke + Entwined Step + Add Pressure

**Why first:** Combines cast discipline, abrupt spatial movement, target priority, and continuous pressure.

Train:

- stop casting before 5-second Invoke resolves;
- instantly identify new safe area;
- maintain Amani awareness;
- avoid getting slowed by Cultists.

Recommended randomization:

- Cultist count/angles;
- destination angles;
- current player cast length;
- concurrent add approach lane.

---

## 2. Restless Amani: Shield Break → CC → Well Prevention

**Why:** This is the encounter's central repeated fail condition.

Train:

- identify spawn side;
- use correct damage type on shield;
- apply CC only when useful;
- group stragglers;
- decide when to leave boss and commit to adds.

Recommended randomization:

- spawn sector;
- add spread;
- shield values;
- CC availability;
- boss position.

---

## 3. Mythic Grasping Depths

**Why:** Unique sub-realm with several sequential failure checks.

Train:

- correct group entry;
- interrupt Soulcoiler's Curse;
- dodge rotating spirits;
- kill add quickly;
- exit;
- respect Soul Exhaustion group rotation.

Recommended randomization:

- interrupt owner;
- rotation direction;
- spirit starting angle;
- movement route;
- outer add pressure when used in full encounter.

---

## 4. Essence Rend Placement → Stage Two Hazard Payoff

**Why:** Early placement changes later room quality.

Train:

- use pull/knockback intelligently;
- select outer drop location;
- choose safe dispel timing;
- preserve central/boss/add corridors.

Advanced version:

- store placements and later run an Invoke/Entwined Step mini-phase using the player's own hazard set.

---

## 5. Intermission Corpse Cleanup Puzzle

**Why:** Connects Stage One add deaths to Pyre/Cremation assignments.

Train:

- tank Echo onto largest corpse pile;
- decide whether player should soak;
- assigned non-soaker moves to isolated Vessel;
- 4-yard Cremation without player overlap.

---

## 6. Possession Barrage Tank Lane

**Why:** Simple mechanic but very punishing if another player intercepts.

Train:

- find long clean lane;
- maximize projectile travel;
- avoid Latent Cultists;
- keep raid behind boss/outside the lane.

---

## 7. Soulcoil Ignition + Impact Dodges

**Why:** Useful movement pressure, but mechanically simpler once add reaction is learned.

Train:

- dodge 5-yard impacts;
- avoid knockback into well/hazards;
- simultaneously identify upcoming add side.

---

# 17. Full Encounter Simulation

A full wow-trainer encounter should combine:

### Stage One

- fixed central Soulcoil Well;
- boss energy;
- Soulcoil Ignition;
- Anguished Echo impacts;
- Essence Rend / Latent Cultist placement;
- Possession Barrage;
- Hollowing Strikes/tank swapping;
- recurring Restless Amani;
- Gravebound Advance shield logic;
- CC/aggregation;
- Amani deaths leaving Vessels.

### 50% transition

- health-triggered transition;
- boss becomes unavailable;
- surviving Amani remain active;
- player must finish them before the well.

### Intermission

- sequential Echoes;
- Soul Transfer line dodge;
- Echo movement;
- Hungering Pyre soak;
- Slithering Flame;
- Cremation corpse cleanup.

### Stage Two

- Uncoiling background pressure;
- faster/back-to-back Amani pressure according to transcript;
- Possession Barrage / Hollowing;
- Invoke;
- Entwined Step moving hazards;
- configurable Stage Two Essence Rend;
- boss/add damage-priority pressure;
- full-energy failure.

### Mythic layer integrated into the same simulation

- Grasping Depths;
- assigned alternating groups;
- Drowned Echo;
- interrupt check;
- Swirling Spirit;
- Soul Exhaustion.

The simulator should win/lose primarily on **mechanical decisions**, not exact DPS tuning. Boss/add progress rates should be adjustable so trainer sessions remain deterministic enough to learn.

---

# 18. Background Mechanics

These matter in the real encounter but do not need detailed standalone simulation.

## Soulcoil Rite raid damage

Track stacks/energy and show pressure, but exact damage calculation is unnecessary.

## Ritual Burn

Display stack escalation; the player does not have a separate mechanical response beyond preventing further Rites.

## Corpse Blight damage

Useful as background raid-pressure feedback. Exact radius behavior is currently source-conflicted and should not drive a training module yet.

## Hollowing Strikes periodic tank damage

Tank stack/swapping is useful; exact Shadow damage and healing math are not.

## Uncoiling passive raid damage

Represent as Stage Two urgency/attrition.

## Boss melee attacks

Only their Hollowing Strikes consequence matters to wow-trainer.

## Exact damage checks

The simulator should not attempt to reproduce class balance or current raid tuning. Use abstract kill/shield progress.

---

# 19. Open / Unverified Details

These should be revisited after the raid opens and combat logs become available.

## 1. No live raid logs yet

As of 2026-08-16, the European raid unlock is scheduled for **2026-08-19**.

Current spell IDs/tooltips can be verified from the shipped 12.1 data, but live:

- cadence;
- target selection;
- movement paths;
- spawn order;
- hotfix tuning

cannot yet be confirmed from real raid logs.

## 2. Stage Two Essence Rend contradiction — HIGH PRIORITY

**Transcript:** Essence Rend/drop debuff is gone in Stage Two.\
**Current 12.1 encounter journal:** Essence Rend is explicitly listed in Stage Two.

Implementation should remain configurable until live logs settle this.

## 3. Possession Barrage → Hollowing Strikes interaction — HIGH PRIORITY

**Transcript:** Barrage impacts add the tank debuff.\
**Current encounter journal:** Hollowing Strikes is documented on boss melee attacks; Barrage text does not mention applying it.\
**Other pre-release/current guide material:** has described Barrage/Hollowing interaction.

Verify with combat logs.

## 4. Exact tank swap threshold

Transcript recommends about two stacks / approximately after each Barrage.

Current Hollowing Strikes value is **5% healing and absorption reduction per stack**, not 15%.

Do not hard-code a two-stack failure threshold.

## 5. Corpse Blight range

**Transcript:** local 15 m death-area effect.\
**Current journal:** damage to all players.\
**Some testing strategy material:** has also described a local range.

The current 15-second duration is verifiable; the positioning radius needs live validation.

## 6. Essence Rend target count

Spell data contains a default max-target value of four, but exact raid-size scaling/target-selection logic is not confirmed.

## 7. Latent Cultist lifetime

The transcript treats the ground hazards as encounter-persistent. Current spell data includes technical area-trigger/aura timing that does not cleanly represent encounter lifetime.

Verify despawn rules from logs/video after release.

## 8. Latent Cultist Stage One movement

Transcript says the hazards slowly move around the well.

Current journal emphasizes their materialization and Stage Two Entwined Step but does not provide path speed/orbit details.

Need video/log validation.

## 9. Entwined Step geometry

Repositioning is confirmed. Exact:

- destination pattern;
- movement speed;
- angular offset;
- whether every Cultist always moves

is not exposed in the spell tooltip.

## 10. Possession Barrage projectile count

The spell has a 6-second cast and a 2-second periodic internal aura with 0.5-second ticks. This is not sufficient on its own to claim an exact number of visible echoes.

Verify from combat logs/video.

## 11. Possession Barrage Divine Shield PTR trick

Transcript reports Paladin Divine Shield could cancel/prevent the echo sequence on PTR.

Current spell data contains an invulnerability-related flag. Do not implement the PTR trick without live proof.

## 12. Echo of Jawae spawn pattern

**Transcript:** two of four fixed outer positions, apparently random; one active at a time.\
**Current encounter journal:** confirms sequential Echoes but not exact anchor selection.\
**Testing guides:** have described more deterministic layouts in some builds.

Keep anchor selection configurable.

## 13. Soul Transfer geometry

15-second cast is verified.

The transcript's center-directed "laser" is useful for trainer visualization, but exact:

- width;
- range;
- final blast shape

is not verified from spell data.

## 14. Amani spawn counts and wave cadence

Do not derive timings from video cuts.

Need logs for:

- count per wave;
- raid-size scaling;
- exact Stage One intervals;
- exact Stage Two interval;
- exact overlap with Invoke/Grasping Depths.

## 15. Grasping Depths cadence / phase availability

The transcript ties Mythic well entries closely to recurring add waves.

The current encounter journal documents Grasping Depths under the Ritual of Awakening mechanics, but this does not by itself establish the exact live cadence or every phase in which it can occur.

Verify from live Mythic logs.

## 16. Mythic well-group size

The transcript describes two approximately equal groups but explicitly notes that tuning/composition may allow smaller inside groups.

Treat group size as raid strategy, not a mechanic constant.

## 17. Swirling Spirit exact shape

Spell behavior confirms stacking contact damage.

The rotating cross-shaped visual comes from the supplied transcript and should be used as the trainer baseline, but its exact number, orbit radius, speed, and cadence are unverified.

## 18. Soulcoil Rite duration has changed during testing

Current live spell data reports **44 seconds** with 2-second ticks.

Earlier testing data used different durations. Keep this field data-driven because it is a plausible early-hotfix candidate.

## 19. Corpse Blight duration changed during testing

Current live data reports **15 seconds** with 1-second ticks.

Earlier PTR material used longer values. Use 15 seconds for the current build but keep it configurable.

---

# 20. Verification Sources and Source Policy

Data was checked on 2026-08-16.

Preferred source order for mechanical values in this specification:

1. current live 12.1 spell database / encounter journal;
2. Blizzard raid release information;
3. current specialist raid guides for strategy interpretation;
4. supplied transcript for the intended raid strategy and observed visual behavior;
5. older PTR data only when needed to explain a discrepancy.

Current sources consulted include:

- Blizzard Entertainment — *Curse of Ula'tek: The Venomous Abyss Raid Goes Live 19 August* (EU schedule);
- Wowhead — *Nek'zali the Soulcoiler Raid Boss Guide - Midnight Season 2* (updated 2026-08-15);
- Wowhead live spell database for the spell IDs listed below;
- current Icy Veins / Method encounter-guide material where the transcript needed strategy-context cross-checking;
- Warcraft Wiki / encounter data for supplemental identity/context checks.

The supplied transcript remains the strategy baseline. External guides were not used to silently substitute a different raid plan.

---

# 21. Spell Reference

| Spell | Spell ID | Relevant timing / value | Trainer relevance |
|---|---:|---|---|
| Soulcoil Well | 1284032 | 1s periodic tick | Central forbidden zone / Mythic entry |
| Soulcoil Rite | 1284033 | 44s stacking effect; 2s tick; +5 boss energy | Core failure/resource escalation |
| Ritual Burn | 1297624 | 1m; +15% Rite damage taken per stack | Background escalation |
| Uncoiled Rage | 1284034 | 5s cast at full energy | Enrage/failure state |
| Soulcoiled | 1290361 | 1m aura | Forced sacrifice / Rite trigger |
| Soulcoil Ignition | 1285681 | 4s channel; Rite every 1s | Raid pressure + impact/add setup |
| Essence Rend target/cast | 1287426 / 1287427 | 5s pull before knockback | Placement setup |
| Essence Rend debuff | 1287434 | 15s Magic debuff; 1s tick | Dispel/expiration placement |
| Latent Cultist | 1287198 | 6yd materialization; 40% slow; lifetime unverified | Persistent spatial hazard |
| Gravebound Advance | 1287533 | Magic absorb = 25% add max health | Shield-break / add-control check |
| Corpse Blight | 1294729 | 15s stack; 1s tick; radius behavior disputed | Background add-death pressure |
| Vessel of Awakening | 1295263 | Persistent corpse object | Intermission setup/cleanup |
| Possession Barrage | 1284103 | 6s cast | Tank lane + distance |
| Hollowing Strikes | 1284109 | 15s stack; 3s tick; -5% healing/absorb per stack | Tank swap |
| Soul Transfer | 1292248 | 15s cast | Intermission line dodge |
| Tether of Awakening | 1289696 | Channel / damage immunity | Intermission Echo state |
| Hungering Pyre | 1289855 | 7.5s cast; 10yd split-soak | Group soak + corpse cleanup |
| Slithering Flame | 1294933 | 8s debuff; 1s tick | Non-soaker assignment |
| Cremation | 1289875 | 4yd explosion; 3s effect; 0.5s tick | Precision corpse cleanup |
| Grasping Depths | 1293212 | Raid pressure every 1s until Drowned Echo defeated | Mythic sub-realm trigger |
| Immortal Coil | 1299988 | 1m aura; 1s tick | Inside-well time pressure |
| Soulcoiler's Curse | 1300238 | 10s cast; interruptible | Mandatory Mythic interrupt |
| Swirling Spirit | 1300239 | 5s stackable contact effect; 1s tick | Rotating dodge hazard |
| Soul Exhaustion | 1300235 | 1m; +300% Soulcoil Well/Immortal Coil damage taken | Enforces alternating well groups |
| Uncoiling | 1290003 | 5s cast; then 0.9s periodic raid tick | Stage Two attrition |
| Invoke | 1299673 | 5s cast; Mythic 3s silence when active cast is interrupted | Cast-stop + hazard transition |
| Entwined Step | 1293497 | Instant reposition | Stage Two moving hazards |
