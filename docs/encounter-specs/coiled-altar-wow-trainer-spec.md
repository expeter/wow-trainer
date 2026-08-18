# The Coiled Altar — wow-trainer Encounter Specification

**Encounter:** The Coiled Altar\
**Raid:** The Venomous Abyss\
**Bosses:** Zul'jan and Hex Lord Malacrass\
**Project:** `wow-trainer`\
**Specification date:** 2026-08-16\
**Source strategy:** supplied German guide transcript\
**Mechanical verification:** current Patch 12.1 Dungeon Journal / Wowhead spell data, Warcraft Wiki encounter identity, Blizzard raid announcement

> **Pre-release status:** The Venomous Abyss is not yet live in the EU as of this specification date; Blizzard lists the EU launch for 19 August 2026. Current numbers therefore remain subject to last-minute tuning. This specification deliberately avoids inventing encounter cadences that are not present in reliable game data or logs.

Supplied arena evidence: [`the-coiled-altar.png`](../../inbox/the-coiled-altar.png).
It establishes the rectangular altar silhouette and central seal only;
`FR-096` separately authorizes runtime work, and the image still does not
establish collision measurements.

## Design intent

The Coiled Altar is a three-stage encounter with a short intermission:

1. Fight Zul'jan and manage movable venom objects.
2. Fight Hex Lord Malacrass and manage possession plus gaze-controlled manifestations.
3. Intercept soul fragments during Malacrass's Soulbinding ritual.
4. Fight both bosses together while combining the venom and manifestation systems.

The most important reusable `wow-trainer` concept is:

**hazard creation → player positioning/manipulation → tank frontal cleanup**

- Zul'jan creates venom objects.
- Malacrass creates Manifestations of Dread.
- Players position those objects/entities.
- `Sever`, `Soul Sever`, and later `Blighted Sever` are the cleanup tools.

This relationship should be preserved across isolated training modules and the full encounter simulation.

---

# Encounter State Model

Recommended high-level state:

```text
P1_ZULJAN
  ↓ Zul'jan defeated
P2_MALACRASS
  ↓ Malacrass reaches defeat threshold
INTERMISSION_SOULBINDING
  ↓ Soulbinding ends
P3_COILED_UNION
  ↓ both bosses defeated
ENCOUNTER_COMPLETE
```

Recommended persistent simulation entities:

```text
Player
BossZuljan
BossMalacrass

CoalescedVenom
VirulentMutation
VirulentCyst

ManifestationOfDread
SpitefulSoulcoiler

SoulFragment
FragmentOfMalacrass

Axegrinder
AltarGroundHazard
GuillotineEpicenter
```

Important player state:

```text
position
facingAngle
alive

volatileVenomTimer
mutagenicVenomTimer
taintedBloodTimer

guillotinedState

dreadmarchState
fixatedManifestationId

graveboundTimer
ownedSoulFragments

gloombombTimer

tankFrontalVulnerability
```

Use a normalized 2D arena and keep absolute arena size configurable until combat-log or map measurements are available.

The platform edge must be lethal or effectively lethal because Dreadmarch walks players toward the edge and Manifestation contact can knock players back.

---

# Stage One — Zul'jan

## Fangs of the Coiled Altar — Spell ID 1282487 — 8s channel / 1s ticks

### What happens

Zul'jan channels the altar for 8 seconds.

During the channel:

- the raid takes repeated Nature damage;
- Zul'jan gains 3 applications of `Twinfang Toxin` every 1 second;
- the altar mouths create expanding `Noxious Ground`.

`Twinfang Toxin` is consumed by Zul'jan's melee attacks, causing additional Nature damage to the active tank.

### Telegraph

- visible 8-second boss channel;
- altar mouths activate;
- poisonous floor grows inward from the arena sides;
- raid-wide damage pulses.

The supplied strategy transcript describes the safe area as an hourglass shape while the side hazards expand and later recede.

### Targeting

- raid-wide damage: whole raid;
- `Twinfang Toxin`: affects Zul'jan's active tank through subsequent melee attacks;
- ground hazard: positional.

### Required reaction

- move into the central/hourglass-shaped safe region;
- avoid `Noxious Ground`;
- heal through raid-wide damage;
- active tank uses mitigation for the toxin-enhanced melee sequence.

### Success condition

- player remains outside the expanding poison floor;
- tank survives the enhanced melee sequence;
- raid remains stable through the channel.

### Failure conditions

- player stands in `Noxious Ground`;
- player is trapped against an expanding side hazard;
- tank dies to unmitigated toxin-enhanced melees.

### wow-trainer implementation notes

Represent the arena hazard as two opposing expanding shapes from the altar mouths.

The exact geometry should be configurable rather than hard-coded from the transcript.

Useful trainer scoring:

- time spent in unsafe ground;
- reaction delay from channel start to entering safe region;
- tank mitigation state during toxin stacks.

For a movement-only module, raid damage can be abstracted to a warning meter.

---

## Twinfang Toxin — Spell ID 1300322 — applications generated every 1s during Fangs

### What happens

Zul'jan's melee attacks consume toxin applications and deal additional Nature damage to his current target.

Because `Fangs of the Coiled Altar` grants 3 applications every second for 8 seconds, the ability can create a large bank of empowered melee hits.

### Required reaction

Tank-specific background responsibility:

- use mitigation;
- coordinate tank coverage around the post-channel melee window.

### wow-trainer implementation notes

This does not need a full combat model.

A simple tank pressure state is sufficient:

```text
twinfangStacks += 3 each second during Fangs
on bossMelee:
    if twinfangStacks > 0:
        twinfangStacks -= 1
        applyTankSpike()
```

This mechanic is lower priority than positioning mechanics.

---

## Noxious Ground — Spell ID 1283290 — 1s damage ticks while standing inside

### What happens

Poisonous ground created from the altar damages players every second while they stand in it.

### Telegraph

Large expanding poison floor from the sides of the arena.

### Required reaction

Stay in the shrinking safe area and move with it as the floor expands and subsides.

### Failure conditions

- any unsafe-ground contact;
- repeated ticks;
- being forced into the floor by another mechanic.

### wow-trainer implementation notes

This becomes much more valuable when combined with:

- Guillotine positioning;
- venom-object transport;
- Axegrinder movement.

---

## Toxic Deluge — Spell ID 1299960 — instant / 4y impact zones

### What happens

The crucible launches venom impacts around the room.

Each impact:

- damages players within 4 yards;
- creates a `Coalesced Venom`.

Current high-end encounter data also contains two upgraded venom-object behaviors:

- one venom can become a `Virulent Cyst`;
- some venoms can become `Virulent Mutations`;
- a subsequent `Toxic Deluge` detonates any still-active `Virulent Mutations`.

### Telegraph

- venom impact markers;
- newly spawned globules at impact positions;
- mutated objects should be visually distinct in `wow-trainer`.

### Targeting

Spawn locations around the arena.

Exact count and placement rules are not yet verified.

### Required reaction

1. dodge the 4-yard impact locations;
2. identify normal versus mutated venom objects;
3. plan which objects will be moved;
4. place objects into a future tank-frontal lane;
5. ensure dangerous mutations are resolved before the next `Toxic Deluge`.

### Success condition

- no impact is taken;
- dangerous objects are positioned for cleanup;
- no unresolved mutation survives into the next forced detonation.

### Failure conditions

- hit by a Toxic Deluge impact;
- too many venom objects remain unmanaged;
- a Virulent Mutation survives until the next Toxic Deluge;
- mutation chain reaction creates excessive `Venom Rupture` stacks.

### wow-trainer implementation notes

Randomize:

- impact positions;
- normal/mutated object distribution;
- which venom becomes a cyst;
- relative position of venom objects versus the tank frontal.

Do **not** randomize with impossible spawn overlaps; use minimum separation constraints.

The simulator should treat venom objects as persistent spatial resources rather than ordinary damage circles.

---

## Coalesced Venom — Spell ID 1282403 — persistent object / 2s raid pulse

### What happens

A Coalesced Venom is a persistent globule.

It:

- pulses raid damage every 2 seconds;
- causes `Venom Rupture` when destroyed;
- attaches to a player who steps on it;
- applies `Volatile Venom`.

### Telegraph

Visible venom globule on the floor.

### Targeting

Any player who deliberately or accidentally walks over the globule can pick it up.

### Required reaction

Players assigned to move venom should:

1. step onto the globule;
2. immediately move away from other players;
3. carry it to the assigned frontal-cleave lane;
4. allow it to drop at the intended location when `Volatile Venom` expires.

### Success condition

The venom is deposited inside a future `Sever`/`Blighted Sever` cleanup area without clipping other players.

### Failure conditions

- accidental pickup;
- carrier overlaps another player;
- drop occurs outside the cleanup lane;
- too many venoms are destroyed simultaneously and create excessive raid pressure.

### wow-trainer implementation notes

State machine:

```text
GROUND
  ↓ player collision
CARRIED
  ↓ Volatile Venom expires
GROUND at carrier position
  ↓ hit by valid tank frontal
DESTROYED
```

The ability to deliberately reposition these objects is one of the highest-value trainer mechanics.

---

## Volatile Venom — Spell ID 1282419 — 5s debuff / 5y player AoE / 1s ticks

### What happens

Picking up a normal venom globule applies `Volatile Venom` for 5 seconds.

For those 5 seconds:

- the carrier damages players within 5 yards every second;
- when the debuff expires, a new `Coalesced Venom` is created at the carrier's position.

Current high-end data also applies `Tainted Blood` when the carry ends.

### Telegraph

- visible debuff timer;
- personal 5-yard danger radius;
- attached venom visual.

### Targeting

The player who picks up a Coalesced Venom.

### Required reaction

- immediately separate from the raid;
- move to the assigned deposit point;
- avoid crossing through other players;
- stop at the desired drop point before the 5-second timer expires.

### Success condition

- zero other players enter the 5-yard carrier radius;
- venom drops in the intended cleanup location.

### Failure conditions

- another player enters the carrier radius;
- carrier is too slow and drops the venom in the wrong place;
- carrier drops the venom directly on another hazard or player;
- carrier repeats the pickup too quickly while vulnerable to another Volatile Venom.

### wow-trainer implementation notes

This is ideal for a compact movement drill.

Show:

- 5-second countdown;
- 5-yard radius;
- target deposit zone;
- predicted drop position.

Scoring can include:

- route efficiency;
- nearest-player distance;
- final drop accuracy.

---

## Tainted Blood — Spell ID 1310013 — 10s debuff

### What happens

After `Volatile Venom` expires, the carrier can receive `Tainted Blood`, increasing damage taken from another `Volatile Venom` by 200% for 10 seconds.

### Required reaction

Avoid immediately reusing the same carrier.

### Success condition

Carrier assignments rotate so a player with active `Tainted Blood` does not take another venom.

### wow-trainer implementation notes

Treat this as an assignment lockout:

```text
eligibleVenomCarrier = taintedBloodTimer <= 0
```

This creates a useful role-rotation component without requiring exact damage simulation.

---

## Virulent Cyst / Caustic Secretion — Spell ID 1309174 — ejects 2 venoms every 6s

### What happens

A Virulent Cyst periodically ejects 2 additional `Coalesced Venom` objects every 6 seconds.

Each impact has a 4-yard damage radius.

### Telegraph

Distinct mutated/cyst object with recurring projectile or splash sequence.

### Required reaction

- dodge the two new impact locations;
- prevent uncontrolled venom-object accumulation;
- incorporate newly created venoms into frontal cleanup planning.

### Success condition

The raid keeps the number of active venom objects controlled.

### Failure conditions

- repeated 4-yard impact hits;
- venom population grows faster than the frontal cleanup cycle;
- clutter prevents safe Guillotine or altar movement.

### wow-trainer implementation notes

This is best represented as a venom-production pressure mechanic.

The cyst can be a persistent emitter object:

```text
every 6s:
    spawn 2 CoalescedVenom impacts
```

Exact cyst lifetime/destruction rules remain unverified.

---

## Virulent Mutation — Spell ID 1310544 — persistent object / 1s raid pulse

### What happens

A Virulent Mutation is a dangerous upgraded venom globule.

It:

- pulses raid damage every second;
- can be picked up;
- applies `Mutagenic Venom`;
- causes a severe nearby-globule reaction associated with 20 `Venom Rupture` triggers;
- is forcibly detonated if still present when the next `Toxic Deluge` occurs.

### Telegraph

Must be visually much more dangerous than a normal Coalesced Venom.

### Required reaction

Prioritize mutation cleanup and avoid allowing it to interact with nearby venom objects.

### Success condition

No Virulent Mutation remains when the next Toxic Deluge resolves.

### Failure conditions

- mutation survives until the next Toxic Deluge;
- mutation is destroyed/handled while other venom objects are too close;
- uncontrolled chain reaction.

### wow-trainer implementation notes

This is a hard-priority object.

Trainer rule:

```text
on ToxicDeluge:
    for each active VirulentMutation:
        triggerCatastrophicFailure()
```

A more advanced simulation can model the actual 20-stack rupture burst.

---

## Mutagenic Venom — Spell ID 1310498 — 5s debuff / 8y player AoE / 1s ticks

### What happens

Picking up a Virulent Mutation applies `Mutagenic Venom` for 5 seconds.

It:

- damages players within 8 yards every second;
- can trigger dangerous interactions with nearby venom objects;
- creates a Virulent Mutation again when the carry ends.

### Telegraph

- 5-second personal timer;
- larger 8-yard personal danger radius;
- distinct mutation visual.

### Required reaction

- isolate more aggressively than for normal venom;
- move the mutation to a clean frontal-cleave location;
- keep it separated from other venom objects while carrying/depositing it.

### Failure conditions

- another player enters the 8-yard radius;
- carrier passes close enough to other venom objects to create a mutation chain;
- mutation is dropped outside the frontal lane.

### wow-trainer implementation notes

Use the same carry system as `Volatile Venom`, but with:

```text
radius = 8y
objectType = VirulentMutation
chainReactionRisk = true
```

Reusing the same mechanic primitive is preferable to a separate implementation.

---

## Venom Rupture — Spell ID 1299838 — 10s DoT / 2s ticks / stacks

### What happens

Destroying a venom globule applies raid-wide `Venom Rupture`.

Current spell data shows:

- 10-second duration;
- damage every 2 seconds;
- stacking behavior.

This makes simultaneous venom destruction a healing/pressure decision rather than a free cleanup.

### Required reaction

Do not clear more venom objects in one frontal than the raid can safely tolerate.

### Success condition

Objects are cleared efficiently without creating an excessive stack burst.

### Failure conditions

- too many globules are destroyed at once;
- a mutation causes a massive chain reaction;
- heavy rupture stacks overlap another movement/raid-damage mechanic.

### wow-trainer implementation notes

A simplified trainer can represent this as a raid danger meter:

```text
ruptureStacks += destroyedVenomCount
each stack lasts 10s
```

This is useful for teaching cleanup pacing without implementing healing throughput.

---

## Sever — Spell ID 1299680 — 3.5s channel / 30s vulnerability

### What happens

Zul'jan performs a frontal cleave at his current target.

The frontal:

- heavily damages players caught inside;
- increases damage taken from subsequent `Sever` by 200% for 30 seconds;
- destroys `Coalesced Venom`;
- also destroys `Virulent Mutations` in the current high-end data.

### Telegraph

- boss turns/locks onto current tank;
- 3.5-second channel;
- frontal cone.

### Targeting

Current tank.

### Required reaction

Tank:

- aim the frontal through the prepared venom-object cluster;
- keep the cone away from the raid.

Everyone else:

- remain outside the frontal.

### Success condition

- desired venom objects are inside the frontal;
- no non-tank player is hit;
- tank does not incorrectly overlap the previous Sever vulnerability state.

### Failure conditions

- missed venom cleanup;
- frontal clips a non-tank;
- tank receives an unsafe repeat hit;
- frontal destroys a dangerous number of globules simultaneously.

### wow-trainer implementation notes

This should be a directional aiming mechanic, not just a tank warning.

Recommended inputs:

- player/tank movement;
- boss facing inherited from active tank position;
- visible or hidden cone depending training level.

Score:

- number/type of objects cleared;
- accidental player hits;
- dangerous over-clear count.

---

## Guillotine — Spell ID 1283489 — 3.5s cast / 9y soak / minimum 5 players

### What happens

Zul'jan throws an axe at a targeted player.

Initial impact:

- damage is split among players within 9 yards;
- at least 5 players must be inside the soak;
- failure to reach 5 players triggers `Execution`.

After the soak, the axe erupts with `Widow's Kiss`, dealing heavy damage to players within 40 yards.

Players hit by Guillotine receive a strong vulnerability to future Guillotines. Current data includes a long-duration version and a permanent highest-difficulty version, so the unified `wow-trainer` configuration should treat previous soakers as unavailable for later Guillotines unless a configurable ruleset says otherwise.

### Telegraph

- 3.5-second boss cast;
- marked target;
- 9-yard soak circle;
- axe/epicenter remains at the impact location before the follow-up explosion.

### Targeting

A player target.

Role exclusions and exact target-selection rules are not verified.

### Required reaction

1. assigned soak group stacks within 9 yards of the target;
2. ensure at least 5 players are inside on impact;
3. immediately after the soak, all soakers move more than 40 yards from the axe epicenter;
4. do not reuse players with an active/permanent Guillotine vulnerability.

### Success condition

- at least 5 players soak;
- only the assigned group soaks;
- every relevant player exits the 40-yard danger zone before `Widow's Kiss`;
- future soak groups respect Guillotine lockout.

### Failure conditions

- fewer than 5 players soak → `Execution`;
- wrong player joins the soak;
- assigned player misses the soak;
- soaker remains within 40 yards for the follow-up;
- previous soaker is reused while vulnerable.

### wow-trainer implementation notes

This is one of the highest-value standalone modules.

Recommended simulation:

```text
cast starts
  ↓
select marked player
  ↓ 3.5s
evaluate players within 9y
  ↓
if count < 5: fail
else:
    mark soakers as Guillotined
    spawn axe epicenter
    start follow-up escape check
  ↓
evaluate 40y danger zone
```

The exact delay between initial soak and `Widow's Kiss` is **not verified** and must remain configurable rather than invented.

Use configurable raid groups so the player can practice A/B soak rotations.

---

## Execution — Spell ID 1283606 — instant raid failure consequence

Triggered when Guillotine has fewer than 5 players in the soak.

### wow-trainer implementation notes

Treat as immediate failed mechanic / wipe event rather than simulating exact damage.

---

## Widow's Kiss — Spell ID 1283623 — instant / 40y danger radius

### What happens

The Guillotine axe erupts, heavily damaging players within 40 yards.

### Required reaction

Get outside 40 yards after completing the initial soak.

### wow-trainer implementation notes

Use the axe impact point rather than Zul'jan as the center.

This is a two-step positional mechanic:

**stack tightly → rapidly spread/escape far from the same point**

---

## Widow's Touch — Spell ID 1283631 — instant / applies outside 40y

Current data also contains lighter damage to players at least 40 yards away from the epicenter.

For `wow-trainer`, the relevant distinction is still:

- inside 40 yards = major failure;
- outside 40 yards = correct positional outcome.

The lighter unavoidable component can remain background damage.

---

## Venomfang — Spell ID 1282287 — 2s cast / 14s DoT / 2s ticks

### What happens

Zul'jan throws a poisoned axe that bounces between multiple players.

Affected players take Nature damage every 2 seconds for 14 seconds.

### Telegraph

- 2-second cast;
- visible bouncing axe/projectile;
- debuff on affected players.

### Targeting

Multiple players.

Exact bounce count and selection rules are not verified.

### Required reaction

Primarily a healer/background-pressure mechanic.

Avoid combining its healing pressure with unnecessary `Venom Rupture` stacks.

### Failure conditions

No major positional failure is verified from current data.

### wow-trainer implementation notes

Do not dedicate a standalone module.

Represent as optional background pressure or debuff icons during more important movement drills.

---

## Axegrinder — Spell ID 1283832 — 2s cast / 4y impact / persistent roaming axes

### What happens

Zul'jan throws axes into the arena.

Initial impacts:

- damage players within 4 yards;
- knock players back.

After landing, the axes wander through the arena and damage players they contact.

Current highest-difficulty data indicates the axes no longer despawn, turning them into cumulative arena clutter.

### Telegraph

- 2-second cast;
- impact markers;
- moving axe hazards.

### Targeting

Arena positions / paths.

### Required reaction

- dodge initial impact;
- track moving axe paths;
- avoid knockbacks near the platform edge;
- preserve movement routes for venom carrying and Guillotine escape.

### Success condition

No axe collision.

### Failure conditions

- hit by initial impact;
- hit by roaming axe;
- knocked into another hazard;
- knocked from platform;
- movement path blocked during another mechanic.

### wow-trainer implementation notes

Randomize:

- impact points;
- initial movement direction;
- wandering/pathing pattern.

Persistent axes should be enabled in the unified/full trainer configuration.

---

# Stage Two — Hex Lord Malacrass

## Dreadmarch — Spell ID 1285643 — 2s cast

### What happens

Malacrass possesses multiple players.

Possessed players:

- are forced to march toward the platform edge;
- will jump to their death if not freed;
- can be freed by damaging them;
- create Manifestations of Dread when the possession is removed.

Current encounter text indicates two Manifestations can emerge from a freed player in at least one documented ruleset.

### Telegraph

- 2-second Malacrass cast;
- possessed-player visual/debuff;
- forced movement toward nearest/assigned platform edge.

### Targeting

Multiple players.

Exact target count is not verified.

### Required reaction

Raid strategy from the supplied guide:

- fight relatively stacked near the middle of the arena;
- immediately damage/cleave possessed players out of the control effect;
- free them before they reach the edge.

### Success condition

Every possessed player is freed before reaching the lethal edge.

### Failure conditions

- possessed player reaches edge;
- damage is too slow to break control;
- raid is spread too widely for fast rescue;
- freed players create manifestations in uncontrolled positions.

### wow-trainer implementation notes

The trainer does not need full friendly-fire combat.

Model possession with a breakable absorb meter:

```text
on Dreadmarch:
    selectedPlayers.state = POSSESSED
    selectedPlayers.forcedMove(edge)
    selectedPlayers.breakMeter = configuredValue
```

For a single-player module, NPC allies can simulate raid damage while the trainee handles the spatial consequence.

---

## Manifestation of Dread / Unnerving Fixation — Spell ID 1285911 — persistent fixation

### What happens

A Manifestation fixates a player.

The key movement rule is:

- the Manifestation moves toward its target when the target is **not looking at it**;
- it stops when the target directly faces it.

If it reaches its target, it can apply Dreadmarch.

Current high-end encounter data adds:

- a Manifestation is visible only to its fixated player;
- manifestations can refixate every 15 seconds.

### Telegraph

- fixate indicator;
- personal manifestation visual;
- optional arrow showing facing relation during tutorial mode.

### Targeting

One fixated player per manifestation.

### Required reaction

Use the supplied guide strategy:

1. turn away to allow the manifestation to move;
2. kite it toward the shared collection point;
3. face it to freeze it at the desired position;
4. keep it stacked with the other manifestations;
5. hold it in the tank frontal cleanup lane.

### Success condition

Manifestations are grouped tightly enough for `Soul Sever` or later `Blighted Sever` to destroy them.

### Failure conditions

- manifestation reaches its target;
- player freezes it too early and leaves it outside the cleanup cone;
- player loses control of it while repositioning;
- a refixation occurs and the new target fails to react.

### wow-trainer implementation notes

This is a top-priority standalone module because the gaze-controlled movement is unusual.

Core movement rule:

```text
if angleBetween(playerFacing, directionToManifestation) <= gazeThreshold:
    manifestation.speed = 0
else:
    manifestation.moveToward(fixatedPlayer)
```

Use a configurable gaze threshold until live testing confirms how strict the facing check is.

Training modes:

- one manifestation;
- multiple manifestations with common stack point;
- hidden-to-others multiplayer/AI simulation;
- 15-second refixation enabled.

---

## Despair — Spell ID 1307009 — instant contact hit / knockback

### What happens

Manifestation contact damages and knocks the player back.

### Required reaction

Never allow a manifestation to touch its target or another nearby player.

### Failure conditions

- manifestation contact;
- knockback into the platform edge;
- knockback into Gloombomb, altar ground, Axegrinder, or another manifestation.

### wow-trainer implementation notes

A contact can be scored as an immediate mechanic failure even if the simulated player survives.

---

## Malevolent Resonance — Spell ID 1310732 — 5s / 1s damage ticks after manifestation collision

### What happens

When two Manifestations collide, their anguish resonates and damages their fixated targets every second for 5 seconds.

This makes "stack manifestations" a controlled positioning problem rather than permission to literally overlap their collision volumes.

### Required reaction

Bring manifestations into the frontal-cleave cluster without allowing their collision rule to trigger.

### Success condition

All manifestations are inside the cleanup cone while maintaining legal separation.

### Failure conditions

- manifestation-to-manifestation collision;
- resonance applied;
- collision occurs while hidden manifestations are being coordinated.

### wow-trainer implementation notes

Give manifestations:

- a small physical collision radius;
- a larger desired cleanup-cluster radius.

This creates the intended precision problem:

**close enough for one frontal, not close enough to collide.**

---

## Soul Sever — Spell ID 1286620 — 4s cast / 36s DoT / 45y spell-data radius

### What happens

Malacrass casts a frontal blast at his current tank.

It:

- damages players in the frontal;
- increases damage taken from subsequent `Soul Sever`;
- applies a Shadow DoT every 2 seconds for 36 seconds;
- applies `Gravebound`;
- destroys Manifestations of Dread.

### Telegraph

- 4-second cast;
- boss facing current tank;
- frontal cone.

### Targeting

Current tank.

### Required reaction

Tank:

- line Malacrass up with the prepared manifestation cluster;
- keep other players out of the frontal.

Fixated players:

- finish positioning their manifestations before cast resolution.

### Success condition

- manifestations are destroyed by the frontal;
- no unnecessary player is hit;
- affected tank resolves Gravebound correctly.

### Failure conditions

- manifestation survives outside cone;
- non-tank player is clipped;
- affected player fails the resulting Gravebound fragment recovery.

### wow-trainer implementation notes

Reuse the same frontal engine as `Sever`.

The difference is object filter:

```text
Sever:
    destroys venom objects

SoulSever:
    destroys ManifestationOfDread
    applies Gravebound to hit players

BlightedSever:
    destroys both systems
```

This reuse is central to the full encounter implementation.

---

## Gravebound — Spell ID 1286837 — 11s lethal timer

### What happens

A player's soul is fractured.

Current spell data gives an 11-second `Gravebound` duration.

The player must recover their Soul Fragment(s). If the timer expires, the player ceases to exist.

Individual Soul Fragments fade after approximately 10 seconds according to the Dungeon Journal text.

### Telegraph

- large debuff icon;
- visible countdown;
- personal fragment(s) spawned nearby.

### Targeting

Players hit by mechanics that apply Gravebound, including:

- `Soul Sever`;
- `Blighted Sever`;
- Gloombomb explosion hits in the documented advanced version.

### Required reaction

Immediately move through the player's own Soul Fragment(s) before the lethal timer expires.

### Success condition

All required fragments are collected before `Gravebound` expires.

### Failure conditions

- fragment expires;
- Gravebound reaches zero;
- player collects too slowly because of another hazard;
- wrong path causes collision with a manifestation or ground mechanic.

### wow-trainer implementation notes

This is a short personal recovery sub-mechanic.

Recommended representation:

```text
on Gravebound:
    spawn owned SoulFragment(s)
    start 11s lethal timer

on playerCollision(ownedFragment):
    fragmentCollected()

if requiredFragments == collectedFragments:
    clear Gravebound
```

Exact fragment count for every source ability remains configurable.

---

## Eternal Nightfall — Spell ID 1286918 — 15s cast / 1s raid damage during resolution

### What happens

Malacrass begins a 15-second lethal cast and gains `Veil of Twilight`.

While the shield remains:

- the cast cannot be interrupted;
- `Suffocating Darkness` healing absorbs accumulate;
- additional darkness impacts can add stacks to players within 5 yards of their impact points.

Once the shield is broken, `Eternal Nightfall` becomes interruptible.

### Telegraph

- prominent 15-second boss cast;
- visible absorb shield;
- raid-wide darkness;
- impact zones.

### Targeting

Whole raid for the lethal failure.

### Required reaction

1. immediately damage through `Veil of Twilight`;
2. dodge darkness impact locations;
3. remove/break the shield;
4. interrupt `Eternal Nightfall` before the cast completes.

### Success condition

Shield reaches zero and the cast is interrupted before 15 seconds.

### Failure conditions

- shield not broken in time;
- interrupt is attempted while shield still grants interrupt immunity;
- no interrupt after shield break;
- player repeatedly stands in 5-yard darkness impacts and accumulates excessive healing absorbs.

### wow-trainer implementation notes

This is a clean two-stage execution check:

```text
NIGHTFALL_SHIELDED
  ↓ shield <= 0
NIGHTFALL_INTERRUPTIBLE
  ↓ interrupt
RESOLVED
```

For a single-player trainer, raid DPS on the shield can be simulated while the player is responsible for:

- dodging impacts;
- using an interrupt at the correct state.

---

## Veil of Twilight — Spell ID 1286912 — shield / applies Suffocating Darkness every 2s

### What happens

Malacrass gains a large absorb shield and interrupt immunity.

While active it applies `Suffocating Darkness` every 2 seconds.

### Required reaction

Break the shield as quickly as possible.

### wow-trainer implementation notes

Do not simulate exact shield HP unless the trainer includes DPS throughput.

Use a normalized shield bar whose drain rate can be difficulty/configuration dependent.

The important player lesson is **interrupt only after the shield is gone**.

---

## Suffocating Darkness — Spell ID 1286947 — stacking healing absorb

### What happens

A stacking healing absorb is applied during Eternal Nightfall.

### Trainer relevance

Background pressure unless healer gameplay is later added.

For generic `wow-trainer`, display stack count or raid-pressure feedback without requiring a healing engine.

---

## Spiritcackle — Spell ID 1286441 — 3s channel

### What happens

Malacrass summons multiple `Spiteful Soulcoilers`.

The adds create an interrupt and target-priority check.

### Telegraph

- 3-second channel;
- Soulcoilers materialize in the arena.

### Required reaction

- identify Soulcoilers quickly;
- prepare interrupts for `Wail of Terror`;
- kill/disable them before their energy mechanic removes interrupt control.

### Failure conditions

- Wail of Terror completes;
- add reaches 100 energy and becomes immune to interrupt effects;
- Soulcoiler remains alive too long and continues random raid damage.

### wow-trainer implementation notes

Randomize add spawn positions but keep them targetable from the playable area.

A standalone interrupt module can spawn 1–2 adds with overlapping Wail schedules.

Do not invent exact add count until live data confirms it.

---

## Spirit Shield — Spell ID 1309105 — 99% damage reduction until weakened

### What happens

Spiteful Soulcoilers can have `Spirit Shield`, reducing damage taken by 99%.

Being hit by a `Gloombomb` weakens the shield.

### Required reaction

Use Gloombomb positioning offensively:

- marked player places the 15-yard Gloombomb explosion so it hits the intended Soulcoiler;
- avoid hitting other players;
- then kill the weakened add.

### Success condition

Gloombomb hits the shielded Soulcoiler without clipping the raid.

### Failure conditions

- Gloombomb is dropped away from the Soulcoiler;
- marked player clips teammates;
- add remains effectively immune and reaches its dangerous state.

### wow-trainer implementation notes

This creates an important mechanic relationship:

**Gloombomb spread mechanic → intentionally overlaps shielded add → enables add kill**

Model the shield as stacks or a state variable; the currently scraped data verifies that a Gloombomb weakens it but does not provide a reliable total number of shield applications.

---

## Wail of Terror — Spell ID 1286399 — 7s cast / 5s fear

### What happens

A Soulcoiler casts a raid-wide fear.

If it completes, players are feared for 5 seconds.

Current high-end data adds another useful relationship:

- successfully interrupting Wail briefly reveals otherwise hidden Manifestations of Dread.

### Telegraph

7-second interruptible cast bar on the Soulcoiler.

### Required reaction

Interrupt every Wail.

In the advanced manifestation ruleset, use the reveal window to update the manifestation stack/position plan.

### Success condition

Every Wail is interrupted.

### Failure conditions

- Wail completes;
- player uses interrupt too early/late on the wrong add;
- fear causes movement into platform edge or another hazard.

### wow-trainer implementation notes

This is a good secondary module but should eventually be trained combined with manifestation positioning.

---

## Retaliatory Malice — Spell IDs 1308311 / 1308323 — random-player hit every 3s

### What happens

Soulcoilers periodically damage random players every 3 seconds.

### Trainer relevance

Background urgency.

It justifies killing the add quickly but does not need a direct avoidance mechanic.

---

## Consumed by Resentment — Spell ID 1315202 — triggers at 100 energy

### What happens

At 100 energy the Soulcoiler becomes immune to interrupt effects.

### Required reaction

Resolve the add before it reaches this state.

### Failure conditions

- add reaches 100 energy while still able to cast Wail;
- raid loses the ability to interrupt the fear.

### wow-trainer implementation notes

Use a visible energy bar and treat 100 energy as a soft-enrage failure threshold.

Exact energy gain rate is not verified and must remain configurable.

---

## Gloombomb — Spell IDs 1310882 / 1286901 — 2s cast / 5s debuff / 15y explosion

### What happens

Malacrass marks players with Gloombomb.

Current spell data shows:

- 2-second boss cast for the multi-target application;
- up to 3 targets in the current spell record;
- 5-second personal debuff;
- 15-yard explosion when the mark expires;
- players hit by the explosion can receive `Gravebound`;
- the explosion weakens `Spirit Shield` on a Soulcoiler.

### Telegraph

- boss cast;
- marked players;
- 5-second countdown;
- 15-yard personal danger circle.

### Targeting

Multiple players; current spell record has a maximum of 3 targets.

### Required reaction

Base reaction:

- spread away from the raid;
- do not overlap another Gloombomb.

Advanced/add interaction:

- if assigned, place the 15-yard explosion to hit a shielded Soulcoiler;
- still avoid all other players.

### Success condition

- no player is hit by another player's Gloombomb;
- assigned bomb hits the correct Soulcoiler;
- any resulting personal Gravebound is recovered immediately.

### Failure conditions

- bomb overlaps raid;
- two bombs overlap;
- assigned bomb misses the shielded add;
- explosion creates Gravebound on unintended players;
- fragment recovery then fails.

### wow-trainer implementation notes

This should support two scoring goals simultaneously:

```text
avoidPlayers = true
hitAssignedSoulcoiler = true
```

That makes it more interesting than a generic spread mechanic.

---

## Dread Bolt — Spell ID 1307184 — instant tank hit

### What happens

Malacrass shoots his primary target for Shadow damage.

### Trainer relevance

Background tank pressure only.

No dedicated simulation required.

---

# Intermission — The Claimed Vessel

## Soulbinding — Spell ID 1304032 — 35s channel

### What happens

After Malacrass is defeated/reaches the transition state, he begins a 35-second Soulbinding ritual.

During the ritual:

- Zul'jan is revived/regenerated;
- Zul'jan receives `Ghastly Regeneration`;
- healing Zul'jan receives is duplicated to Malacrass;
- fragments of Malacrass move toward Zul'jan;
- Malacrass is effectively protected from normal damage by the transition state/Deathguard.

### Telegraph

- 35-second Malacrass channel;
- revived Zul'jan;
- many fragments moving toward him;
- damage-taken amplification on Zul'jan.

### Required reaction

Supplied guide strategy:

- use Bloodlust/Heroism and offensive cooldowns here;
- push Zul'jan as low as possible during the 100% increased-damage window;
- intercept incoming Malacrass fragments before they reach Zul'jan;
- pace interceptions to avoid excessive raid-damage overlap.

### Success condition

- Zul'jan is heavily damaged during the vulnerability window;
- fragments are intercepted before reaching him;
- fragment interceptions are spaced enough for the raid to survive.

### Failure conditions

- fragments reach Zul'jan and heal him;
- too many fragments are intercepted simultaneously;
- offensive cooldown window is wasted;
- raid dies to stacked `Spirit Erasure`.

### wow-trainer implementation notes

This phase can be implemented independently of DPS throughput.

Primary gameplay loop:

```text
spawn fragments around arena
fragments path toward Zul'jan

player collision:
    fragment removed
    raidPressure += SpiritErasure
    apply short SpiritErasure vulnerability

fragment reaches Zul'jan:
    Zul'jan heals
    score penalty
```

Use randomized spawn angles and staggered travel distances.

---

## Ghastly Regeneration — Spell ID 1304033 — 35s / heals 2% max HP every 1s / +100% damage taken

### What happens

Zul'jan heals 2% of maximum health every second for 35 seconds and takes 100% increased damage.

### Required reaction

Treat this as the encounter's primary burst-damage window.

### wow-trainer implementation notes

For movement-focused training, represent raid damage to Zul'jan as an automatic burn-rate slider rather than requiring a real DPS rotation.

The player-facing task is fragment interception.

---

## Spirit Erasure — Spell ID 1287722 — instant raid hit / 2s stacking vulnerability

### What happens

Stepping on an intermission fragment destroys it.

That interception:

- deals raid-wide Shadow damage;
- causes the raid to take 20% increased damage from another `Spirit Erasure` for 2 seconds;
- stacks if fragments are intercepted too close together.

### Required reaction

Stagger fragment interceptions.

### Success condition

Every fragment is intercepted with safe spacing.

### Failure conditions

- two or more fragments are intercepted inside an unsafe 2-second overlap;
- raid-pressure threshold is exceeded;
- player waits too long and a fragment reaches Zul'jan.

### wow-trainer implementation notes

This is fundamentally a pacing game.

Recommended UI:

- incoming fragment trajectories;
- 2-second global danger/vulnerability timer;
- raid-health or raid-pressure abstraction.

Scoring:

- missed fragments;
- overlapping vulnerability stacks;
- average interception timing.

---

## Reclaim Essence — Spell ID 1287718 — instant heal on fragment arrival

### What happens

If a Malacrass fragment reaches Zul'jan, it heals him.

The supplied transcript says **1%**, but current spell data contains difficulty-dependent values and reaches **10% of maximum health** in the highest documented variant.

For the unified `wow-trainer` configuration, a missed fragment should be treated as a major failure.

### Required reaction

Intercept every fragment before contact.

### wow-trainer implementation notes

Do not hard-code 1%.

Use a configurable heal percentage, with the strongest current verified value available as the advanced preset.

---

## Deathguard — Spell ID 1304028 — 99% damage reduction

### What happens

Malacrass is protected by baleful energy during the transition and takes 99% reduced damage.

It can also absorb stunned Manifestations of Dread according to the current Dungeon Journal text.

### Trainer relevance

Mostly transition-state enforcement.

The trainer should prevent players from treating Malacrass as the burn target during Soulbinding.

---

# Stage Three — Coiled Union

Stage Three combines the two primary spatial systems:

- venom objects from Zul'jan;
- Manifestations of Dread from Malacrass.

The tank frontal becomes the shared cleanup mechanism.

This is the key encounter escalation and should be the final `wow-trainer` module before a full simulation.

---

## Soulbound — Spell ID 1309987 — persistent dual-boss link

### What happens

Malacrass links himself to Zul'jan.

If one boss dies while the other remains alive, the survivor enters a severe berserk state.

Current spell data shows large immediate attack-speed/damage increases rather than the transcript's specific description of a 100% stack every 5 seconds.

### Required reaction

Balance damage and defeat both bosses nearly simultaneously.

### Success condition

Second boss dies before the survivor's berserk becomes relevant.

### Failure conditions

- one boss dies substantially earlier;
- raid cannot finish the surviving boss after Soulbound berserk.

### wow-trainer implementation notes

Do not simulate exact DPS tuning.

Use boss-health sliders and a failure threshold:

```text
if bossA.dead and bossB.health > configuredExecuteThreshold:
    triggerSoulboundBerserkFailure()
```

This teaches health balancing without requiring a full WoW damage engine.

---

## Defilement of the Coiled Altar — Spell ID 1298381 — 8s channel / 1s ticks

### What happens

Zul'jan corrupts the altar for 8 seconds.

During the channel:

- players receive healing absorbs;
- Zul'jan gains 3 applications of `Corrupted Toxin` every 1 second;
- the altar mouths create expanding `Defiled Ground`.

This is the Stage Three shadow/healing-absorb counterpart to Stage One `Fangs of the Coiled Altar`.

### Telegraph

- 8-second channel;
- dark/corrupted altar visuals;
- expanding side ground;
- healing-absorb feedback.

### Required reaction

- stay in the hourglass-style safe area;
- tanks prepare for toxin-derived DoT pressure;
- avoid unnecessary Gravebound/Gloombomb mistakes while healing is constrained.

### Success condition

No player stands in Defiled Ground.

### Failure conditions

- player remains in Defiled Ground;
- healing absorbs compound with Gloombomb/Gravebound pressure;
- movement into the safe zone collides with another mechanic.

### wow-trainer implementation notes

Reuse the same arena geometry primitive as `Fangs`, with a different effect type:

```text
FangsGround:
    direct damage

DefilementGround:
    healing absorb
```

For a non-healer simulator both count as unsafe floor.

---

## Corrupted Toxin — Spell ID 1298795 — 6s DoT / 1s ticks / stacks

### What happens

Zul'jan's melee attacks consume Corrupted Toxin applications and apply a stacking Shadow DoT to the tank for 6 seconds.

### Trainer relevance

Background tank pressure.

No standalone module required.

---

## Defiled Ground — Spell ID 1298591 — 1s healing-absorb ticks while standing inside

### What happens

Standing in the corrupted floor repeatedly applies healing absorption every second.

### Required reaction

Treat the floor as fully unsafe.

### wow-trainer implementation notes

Use identical collision logic to Noxious Ground but a different visual state.

---

## Grim Guillotine — Spell ID 1299267 — 3.5s cast / 9y soak / minimum 5 / 2m vulnerability in current data

### What happens

Stage Three upgrades Guillotine into a Shadow version.

It retains the same core structure:

1. targeted 9-yard split soak;
2. minimum 5 players;
3. strong Guillotine vulnerability;
4. follow-up 40-yard explosion (`Death's Embrace`).

It also adds a healing absorb to affected players.

The current highest-difficulty data makes the Guillotine vulnerability permanent.

### Telegraph

Same two-step telegraph pattern as Stage One, with Shadow visuals.

### Required reaction

- use assigned fresh soak group;
- get at least 5 players inside 9 yards;
- immediately escape beyond 40 yards;
- avoid using permanently Guillotined players again.

### Success condition

Correct soak group + successful 40-yard escape.

### Failure conditions

- fewer than 5 soakers → `Grim Execution`;
- wrong rotation;
- failed 40-yard escape;
- healer pressure becomes unmanageable due to added absorb.

### wow-trainer implementation notes

Reuse the Guillotine module with parameters:

```text
damageSchool = Shadow
addsHealingAbsorb = true
followupSpell = DeathsEmbrace
vulnerabilityMode = permanent in advanced preset
```

---

## Death's Embrace — Spell ID 1299396 — instant / 40y danger radius

### What happens

The Stage Three Guillotine epicenter erupts and heavily damages players within 40 yards.

### Required reaction

Get outside 40 yards immediately after the soak.

### wow-trainer implementation notes

Same geometry as Widow's Kiss.

---

## Death's Whisper — Spell ID 1299401 — instant / applies outside 40y

Current data includes lighter damage to players outside the 40-yard epicenter.

This is background pressure; correct positional play is still to be outside 40 yards.

---

## Grim Execution — Spell ID 1299301 — instant raid failure consequence

Triggered if fewer than 5 players resolve Grim Guillotine.

Treat as immediate failed mechanic / wipe state.

---

## Blighted Sever — Spell ID 1307279 — 3.5s channel / 45s vulnerability

### What happens

Zul'jan performs the Stage Three frontal.

It:

- damages players in a frontal cone;
- increases damage taken from subsequent `Blighted Sever` by 200% for 45 seconds;
- applies `Gravebound`;
- destroys Coalesced Venom;
- destroys Manifestations of Dread;
- current advanced data also allows it to destroy Virulent Mutations.

### Telegraph

3.5-second tank-targeted frontal channel.

### Targeting

Current tank.

### Required reaction

This is the combined-cleanup mechanic.

Before the cast resolves:

- venom carriers must have deposited globules in the frontal lane;
- manifestation targets must have positioned/frozen manifestations in the same lane;
- raid must be clear of the cone;
- tank must aim the boss through both object sets.

### Success condition

One safe frontal clears the intended venom objects and manifestations without clipping players.

### Failure conditions

- either object type remains outside the cone;
- frontal clips a non-tank;
- too many venom objects are destroyed simultaneously;
- tank/player fails resulting Gravebound;
- mutation chain occurs in the cleanup cluster.

### wow-trainer implementation notes

This is the encounter's best final standalone drill.

The simulator should generate both object systems concurrently and force the player to solve a shared geometry problem.

Potential scoring:

```text
+ manifestation cleared
+ required venom cleared
- missed object
- non-tank frontal hit
- excess Venom Rupture stacks
- Gravebound failure
- mutation chain
```

---

# Stage Three Malacrass Mechanics

Malacrass continues to contribute the Stage Two systems in Stage Three.

The full Stage Three simulation should therefore include:

- `Dreadmarch`;
- Manifestations and gaze control;
- advanced hidden/refixating manifestation behavior;
- `Eternal Nightfall` + `Veil of Twilight`;
- `Spiritcackle`;
- `Spiteful Soulcoilers`;
- `Wail of Terror`;
- `Gloombomb`;
- `Spirit Shield` interaction;
- tank/background `Dread Bolt`.

The German guide transcript specifically calls out Guillotine and Gloombomb as returning/active in the final phase. Current Dungeon Journal data also lists the broader Malacrass kit in Stage Three.

---

# Mechanic Relationships

These relationships should be explicit in code and training design.

## Venom creation → venom transport → frontal cleanup

```text
Toxic Deluge
  ↓
Coalesced Venom / Virulent object spawns
  ↓
player picks up venom
  ↓
5s carry timer
  ↓
venom dropped at assigned position
  ↓
Sever / Blighted Sever
  ↓
venom destroyed
  ↓
Venom Rupture raid pressure
```

## Mutation cleanup → deadline at next Toxic Deluge

```text
Virulent Mutation exists
  ↓
must be repositioned/cleared
  ↓
NEXT Toxic Deluge
  ↓
remaining mutation detonates catastrophically
```

## Dreadmarch → manifestation creation → gaze positioning → tank frontal

```text
Dreadmarch
  ↓
player freed before edge
  ↓
Manifestation(s) spawn
  ↓
fixate player
  ↓
look away = moves
look at = freezes
  ↓
position near shared cleanup lane
  ↓
Soul Sever / Blighted Sever
  ↓
manifestation destroyed
```

## Manifestation collision constraint

```text
multiple manifestations need to be close enough for one frontal
BUT
must not physically collide
  ↓
Malevolent Resonance
```

## Gloombomb → Spirit Shield → add kill

```text
Spiteful Soulcoiler with Spirit Shield
  ↓
Gloombomb target isolates near add
  ↓
15y Gloombomb explosion hits add
  ↓
Spirit Shield weakened
  ↓
raid can kill add
```

## Wail interrupt → hidden manifestation information

```text
Wail of Terror cast
  ↓
successful interrupt
  ↓
hidden Manifestations briefly revealed
  ↓
players update positioning plan
```

## Soul Sever / Blighted Sever / Gloombomb → Gravebound → fragment recovery

```text
player hit by Gravebound-applying mechanic
  ↓
Soul Fragment(s) spawn
  ↓
11s lethal timer
  ↓
player collects own fragment(s)
  ↓
Gravebound removed
```

## Guillotine → immediate long-distance escape

```text
marked target
  ↓
minimum 5-player 9y stack
  ↓
soak resolves
  ↓
same players immediately leave
  ↓
must be outside 40y follow-up explosion
```

## Guillotine vulnerability → soak-group rotation

```text
Group A soaks
  ↓
Guillotine vulnerability
  ↓
Group A unavailable
  ↓
Group B must handle next soak
```

## Intermission fragments → interception pacing

```text
Fragment of Malacrass moves toward Zul'jan
  ↓
intercept now?
  ├─ yes → Spirit Erasure + 2s raid vulnerability
  └─ no  → fragment reaches Zul'jan → heal
```

The player must choose a safe interception moment while still preventing arrival.

## Stage Three combined cleanup

```text
venom objects + manifestations
  ↓
different players manipulate both systems
  ↓
shared frontal lane
  ↓
Blighted Sever
  ↓
both systems cleared
```

This is the defining Stage Three trainer interaction.

---

# Logical Encounter Flow

No exact timestamps are assigned because the supplied guide is edited and reliable combat-log timing has not yet been established.

```text
PULL
  ↓
ZUL'JAN
  ├─ Fangs of the Coiled Altar
  │    └─ expanding Noxious Ground + tank toxin pressure
  ├─ Toxic Deluge
  │    └─ spawn/move venom objects
  ├─ Sever
  │    └─ clear prepared venom cluster
  ├─ Guillotine
  │    └─ 5+ soak → escape >40y
  ├─ Venomfang
  └─ Axegrinder
       └─ persistent movement hazards
  ↓ repeat mechanics without inferred cadence
ZUL'JAN DEFEATED
  ↓
MALACRASS
  ├─ Dreadmarch
  │    └─ free players before edge
  │         └─ Manifestations spawn
  │              └─ gaze-kite/freeze into frontal lane
  ├─ Soul Sever
  │    └─ clear Manifestations + Gravebound
  ├─ Eternal Nightfall
  │    └─ break Veil → interrupt
  ├─ Spiritcackle
  │    └─ Spiteful Soulcoilers
  │         └─ interrupt Wail
  │         └─ Gloombomb weakens Spirit Shield
  ├─ Gloombomb
  │    └─ spread / hit assigned add / recover Gravebound
  └─ background Dread Bolt / raid pressure
  ↓
MALACRASS TRANSITION
  ↓
SOULBINDING — 35s
  ├─ Zul'jan +100% damage taken
  ├─ Zul'jan regenerates
  └─ intercept Fragments of Malacrass
       ├─ safe intercept → Spirit Erasure
       └─ miss → Zul'jan healed
  ↓
COILED UNION — BOTH BOSSES
  ├─ Defilement of the Coiled Altar
  ├─ Toxic Deluge / venom transport
  ├─ Dreadmarch / Manifestations
  ├─ Blighted Sever
  │    └─ combined venom + manifestation cleanup
  ├─ Grim Guillotine
  │    └─ 5+ soak → escape >40y
  ├─ Gloombomb
  │    └─ spread / Soulcoiler shield interaction
  ├─ Eternal Nightfall
  ├─ Spiritcackle / Wail
  └─ health balancing via Soulbound
  ↓
BOTH BOSSES DIE NEAR-SIMULTANEOUSLY
  ↓
ENCOUNTER COMPLETE
```

---

# Recommended Training Modules

Ranked by implementation/training value.

## 1. Manifestation Gaze Control + Frontal Stacking

**Highest priority.**

Train:

- fixate recognition;
- look-away-to-move behavior;
- look-at-to-freeze behavior;
- stacking multiple manifestations without collision;
- delivering them into a tank-frontal lane;
- optional 15-second refixation;
- optional hidden-to-non-target behavior.

Why:

This is mechanically unusual and difficult to learn from ordinary UI warnings alone.

---

## 2. Guillotine / Grim Guillotine — Soak Then 40y Escape

Train:

- marked target recognition;
- assigned 5+ player soak;
- 9-yard stack validation;
- immediate post-soak escape;
- 40-yard boundary;
- permanent/long-duration soak-group lockout;
- movement while other arena hazards exist.

Why:

It contains a sharp reversal of movement intent:

**stack → immediately run very far away.**

---

## 3. Venom Pickup, Carry, and Frontal Placement

Train:

- pickup intentionality;
- 5-second carrier countdown;
- 5-yard normal venom isolation;
- 8-yard mutation isolation;
- deposit accuracy;
- Tainted Blood carrier rotation;
- frontal cleanup.

Why:

This directly prepares the spatial resources used again in Stage Three.

---

## 4. Combined Blighted Sever Cleanup

Train simultaneously:

- Coalesced Venom placement;
- Virulent Mutation priority;
- manifestation gaze positioning;
- tank-frontal direction;
- avoidance of excessive Venom Rupture stacks;
- Gravebound recovery after frontal hits.

Why:

This is the encounter's main synthesis mechanic.

---

## 5. Gloombomb + Spirit Shield Add Interaction

Train:

- 5-second bomb timer;
- 15-yard player exclusion radius;
- deliberate overlap with assigned Soulcoiler;
- follow-up add kill;
- possible Gravebound recovery.

Why:

It combines "spread from players" with "hit a specific NPC."

---

## 6. Dreadmarch Rescue + Manifestation Spawn Transition

Train:

- player possession;
- forced march to edge;
- rescue before death;
- immediate switch from rescue state to manifestation-control state.

Why:

The transition from one mechanic to the next matters more than either mechanic in isolation.

---

## 7. Soulbinding Fragment Interception

Train:

- fragment path prediction;
- intercept before boss contact;
- 2-second Spirit Erasure spacing;
- raid-pressure awareness.

Why:

This is a clean timing/pacing module and does not require a combat simulator.

---

## 8. Eternal Nightfall Shield → Interrupt

Train:

- 15-second cast;
- shield phase;
- interrupt-immune state;
- shield break;
- interrupt window;
- dodge 5-yard darkness impacts.

Why:

Useful execution check, but less unique than the modules above.

---

## 9. Axegrinder Hazard Navigation

Train as an overlay rather than a primary module.

Add roaming axes to venom-carry, Guillotine, or manifestation modules.

---

## 10. Altar Hourglass Movement

Train expanding side hazards during another mechanic rather than by itself.

---

# Full Encounter Simulation

A complete `wow-trainer` implementation should combine the following systems.

## Core required systems

- normalized 2D arena with lethal edge;
- boss health/state transitions;
- player position and facing;
- target markers and debuff timers;
- movable venom objects;
- gaze-controlled manifestations;
- tank-frontal directional cleanup;
- persistent roaming Axegrinders;
- soak-group validation;
- 40-yard post-soak escape;
- Soulcoiler add state + interrupts;
- Gloombomb target placement;
- Gravebound fragment recovery;
- intermission fragment interception;
- boss health-balancing end condition.

## Suggested simplifications

Do not reproduce:

- real class DPS rotations;
- exact healing throughput;
- tank mitigation kits;
- threat;
- armor/resistance;
- real spell queueing;
- exact boss melee swings.

Instead use:

- normalized raid-pressure meter;
- scripted AI teammates;
- configurable cast-order controller;
- success/failure flags.

## Event scheduling

Until reliable combat logs are available:

- do not assign fake fixed timestamps;
- use logical mechanic sequencing;
- use configurable event intervals;
- optionally randomize mechanic order only where logs later show the encounter permits variation.

The trainer should clearly distinguish:

```text
verified spell cast duration
vs.
unverified encounter recurrence interval
```

---

# Background Mechanics

These matter in the real encounter but do not need detailed standalone simulation.

## Venomfang

Healing-pressure debuff; 14 seconds with 2-second ticks.

## Dread Bolt

Tank damage.

## Twinfang Toxin

Tank spike sequence after/during Fangs.

## Corrupted Toxin

Stacking tank DoT in Stage Three.

## Suffocating Darkness

Stacking healing absorb during Eternal Nightfall.

## Retaliatory Malice

Random-player damage from Soulcoilers every 3 seconds.

## Raid-wide Fangs / altar damage

Can be represented through a raid-pressure meter.

## Venom Rupture damage values

The stack count and duration matter more to the movement trainer than exact damage numbers.

---

# Trainer Failure Taxonomy

Recommended standardized failure events:

```text
FAIL_AVOIDABLE_GROUND
FAIL_TOXIC_DELUGE_IMPACT
FAIL_AXEGRINDER_HIT
FAIL_AXEGRINDER_KNOCKOFF

FAIL_VENOM_CARRIER_OVERLAP
FAIL_VENOM_WRONG_DROP
FAIL_MUTATION_NOT_CLEARED
FAIL_MUTATION_CHAIN
FAIL_EXCESS_RUPTURE_STACKS

FAIL_FRONTAL_PLAYER_HIT
FAIL_FRONTAL_MISSED_OBJECTS

FAIL_GUILLOTINE_UNDERSOAK
FAIL_GUILLOTINE_WRONG_GROUP
FAIL_GUILLOTINE_FOLLOWUP_RANGE
FAIL_GUILLOTINE_REUSED_PLAYER

FAIL_DREADMARCH_EDGE
FAIL_MANIFESTATION_CONTACT
FAIL_MANIFESTATION_COLLISION
FAIL_MANIFESTATION_MISPOSITION

FAIL_NIGHTFALL_SHIELD
FAIL_NIGHTFALL_INTERRUPT

FAIL_WAIL_INTERRUPT
FAIL_SOULCOILER_ENRAGE
FAIL_GLOOMBOMB_PLAYER_OVERLAP
FAIL_GLOOMBOMB_MISSED_ADD

FAIL_GRAVEBOUND_TIMEOUT
FAIL_SOUL_FRAGMENT_EXPIRED

FAIL_INTERMISSION_FRAGMENT_MISSED
FAIL_SPIRIT_ERASURE_OVERLAP

FAIL_BOSS_HEALTH_DESYNC
```

This failure taxonomy makes mechanic-specific scoring consistent across modules.

---

# Open / Unverified Details

These should remain configurable until live logs, updated Dungeon Journal data, or direct testing confirms them.

## 1. Exact encounter timeline and recurrence intervals

No reliable full combat-log timeline was established from the supplied videos.

Do not infer timing from edited footage.

Needed:

- first-cast timings;
- repeat intervals;
- exact overlaps;
- whether order is deterministic.

## 2. Toxic Deluge object count and spawn rules

Verified:

- 4-yard impact;
- creates Coalesced Venom;
- advanced mutation/cyst behaviors exist.

Not yet verified:

- exact number of impact locations per cast;
- exact number of mutations;
- positional selection constraints.

## 3. Phase-one death cleanup statement

The supplied German transcript says all remaining poison globules explode when Zul'jan dies.

The current Dungeon Journal text located during verification clearly states that venom globules produce `Venom Rupture` when destroyed, and that remaining `Virulent Mutations` explode on a subsequent `Toxic Deluge`, but the source examined did **not** explicitly confirm that every remaining normal Coalesced Venom automatically detonates when Stage One ends.

Implementation recommendation:

- keep "detonate remaining venom on P1 transition" as a configurable rule;
- verify with live combat logs/PTR video before making it mandatory.

## 4. Guillotine follow-up delay

Verified:

- 3.5-second Guillotine cast;
- 9-yard soak;
- minimum 5 players;
- 40-yard follow-up danger zone.

Not verified:

- exact time from initial soak impact to Widow's Kiss / Death's Embrace.

Do not invent this number.

## 5. Guillotine vulnerability duration across rulesets

Current data exposes different forms:

- long-duration debuff (approximately 1.7 minutes in the Stage One tooltip);
- 2-minute Stage Three tooltip;
- permanent highest-difficulty `Guillotined`.

Unified advanced trainer recommendation:

- make a soaker unavailable for the remainder of the relevant phase/encounter.

Keep duration configurable for other presets.

## 6. Soulbound berserk behavior conflict

Transcript:

- survivor gains a stacking +100% damage/attack-speed effect every 5 seconds.

Current spell data:

- `Soulbound` immediately gives a major damage and attack-speed increase when the partner dies;
- current records contain +100% and +500% variants.

Implementation recommendation:

- do not simulate the transcript's unverified 5-second stacking timer;
- treat large boss-health desynchronization as an immediate strategic failure.

## 7. Reclaim Essence heal conflict

Transcript:

- a fragment reaching Zul'jan heals 1% maximum health.

Current spell data:

- records include difficulty-dependent values and a 10% maximum-health heal in the strongest current variant.

Implementation recommendation:

- configurable heal value;
- advanced unified trainer treats a missed fragment as a major error regardless of exact percentage.

## 8. Dreadmarch target count

Verified:

- multiple players are possessed;
- 2-second cast.

Not verified:

- exact number of targets for a 20-player raid;
- role targeting rules.

## 9. Manifestations per freed Dreadmarch player

The current Dungeon Journal scrape shows a two-manifestation value in at least one entry, but formatting is not clean enough to guarantee the rule for every current configuration.

Keep spawn count configurable.

## 10. Manifestation gaze angle

Mechanic is verified qualitatively:

- moves if target is not staring at it;
- stops when stared at.

Exact facing-angle tolerance is not published.

## 11. Soul Sever geometry

Spell data exposes a 45-yard effect radius, but the exact frontal cone angle/width is not established in the sources used.

Keep cone angle configurable.

## 12. Sever / Blighted Sever cone geometry

Exact cone angle and effective length should be measured from logs/gameplay rather than guessed.

## 13. Virulent Cyst lifetime and direct interaction

Verified:

- cyst exists;
- ejects 2 Coalesced Venoms every 6 seconds.

Not verified:

- whether players can directly destroy it;
- exact lifetime;
- exact placement rule.

## 14. Spirit Shield application count

Verified:

- 99% damage reduction;
- Gloombomb weakens it.

Not verified:

- exact number of shield applications that must be removed.

## 15. Soulcoiler energy rate

Verified:

- at 100 energy it becomes immune to interrupts.

Not verified:

- exact energy gain per second;
- whether rate changes in Stage Three.

## 16. Gravebound fragment counts per source

Verified:

- Gravebound has an 11-second lethal timer;
- Soul Fragments expire on a roughly 10-second window;
- fragment collection resolves the player's soul fracture.

Not yet cleanly verified:

- exact fragment count from every individual source ability.

## 17. Exact arena dimensions

Needed for authentic:

- 40-yard Guillotine escape feasibility;
- edge distance;
- altar safe-zone geometry;
- knockback tuning.

Use normalized units until measured.

## 18. Release-tuning risk

As of 2026-08-16, the raid has not yet opened in the EU.

Spell IDs are likely more stable than tuning values, but:

- damage values;
- absorb values;
- exact target counts;
- advanced mechanic tuning

can still change.

---

# Spell Reference

| Spell / object | Spell ID | Relevant timing / radius | Trainer relevance |
|---|---:|---|---|
| Fangs of the Coiled Altar | 1282487 | 8s channel; 1s ticks | Altar movement + tank pressure |
| Twinfang Toxin | 1300322 | consumed by melees | Background tank pressure |
| Noxious Ground | 1283290 | 1s ticks | Unsafe expanding floor |
| Toxic Deluge | 1299960 | instant; 4y impacts | Spawns venom resources |
| Coalesced Venom | 1282403 | 2s raid pulse | Movable persistent object |
| Volatile Venom | 1282419 | 5s; 5y; 1s ticks | Venom carrying |
| Tainted Blood | 1310013 | 10s; +200% Volatile Venom damage taken | Carrier rotation |
| Venom Rupture | 1299838 | 10s; 2s ticks; stacks | Cleanup pacing |
| Caustic Secretion | 1309174 | 2 venoms every 6s; 4y impacts | Venom population pressure |
| Virulent Mutation | 1310544 | persistent; 1s raid pulse | Priority venom object |
| Mutagenic Venom | 1310498 | 5s; 8y; 1s ticks | Advanced mutation carrying |
| Sever | 1299680 | 3.5s channel; 30s vuln | P1 tank frontal / venom cleanup |
| Guillotine | 1283489 | 3.5s cast; 9y soak; min 5 | Major soak mechanic |
| Execution | 1283606 | instant | Under-soak failure |
| Widow's Kiss | 1283623 | instant; 40y danger | Post-soak escape |
| Widow's Touch | 1283631 | outside 40y | Background follow-up damage |
| Venomfang | 1282287 | 2s cast; 14s DoT; 2s ticks | Background healing pressure |
| Axegrinder | 1283832 | 2s cast; 4y impact; roaming | Persistent avoidable hazard |
| Dreadmarch | 1285643 | 2s cast | Possession / rescue |
| Unnerving Fixation | 1285911 | persistent; refixation 15s in advanced data | Gaze-controlled manifestation |
| Despair | 1307009 | instant + knockback | Manifestation contact failure |
| Malevolent Resonance | 1310732 | 5s; 1s ticks | Manifestation collision failure |
| Soul Sever | 1286620 | 4s cast; 36s DoT; 45y data radius | P2 frontal / manifestation cleanup |
| Gravebound | 1286837 | 11s lethal timer | Personal fragment recovery |
| Eternal Nightfall | 1286918 | 15s cast; 1s periodic damage | Shield → interrupt check |
| Veil of Twilight | 1286912 | applies Darkness every 2s | Interrupt immunity shield |
| Suffocating Darkness | 1286947 | stacking absorb | Background healer pressure |
| Spiritcackle | 1286441 | 3s channel | Soulcoiler spawn |
| Spirit Shield | 1309105 | 99% DR | Requires Gloombomb interaction |
| Wail of Terror | 1286399 | 7s cast; 5s fear | Priority interrupt |
| Retaliatory Malice | 1308311 / 1308323 | random hit every 3s | Add urgency |
| Consumed by Resentment | 1315202 | at 100 energy | Add soft enrage |
| Gloombomb | 1310882 / 1286901 | 2s cast; 5s mark; 15y explosion; max 3 targets in spell data | Spread + hit shielded add |
| Dread Bolt | 1307184 | instant | Background tank pressure |
| Soulbinding | 1304032 | 35s channel | Intermission |
| Ghastly Regeneration | 1304033 | 35s; 2% max HP heal every 1s; +100% damage taken | Burn window |
| Spirit Erasure | 1287722 | 2s vulnerability after intercept | Intermission pacing |
| Reclaim Essence | 1287718 | instant; up to 10% max HP in current strongest record | Missed-fragment penalty |
| Deathguard | 1304028 | 99% DR | Transition protection |
| Soulbound | 1309987 | persistent | Simultaneous-kill requirement |
| Defilement of the Coiled Altar | 1298381 | 8s channel; 1s ticks | P3 altar movement |
| Corrupted Toxin | 1298795 | 6s DoT; 1s ticks; stacks | P3 tank pressure |
| Defiled Ground | 1298591 | 1s healing-absorb ticks | Unsafe expanding floor |
| Grim Guillotine | 1299267 | 3.5s cast; 9y soak; min 5; 2m tooltip vuln | P3 soak mechanic |
| Grim Execution | 1299301 | instant | Under-soak failure |
| Death's Embrace | 1299396 | instant; 40y danger | P3 post-soak escape |
| Death's Whisper | 1299401 | outside 40y | Background follow-up damage |
| Blighted Sever | 1307279 | 3.5s channel; 45s vuln | Combined P3 cleanup frontal |

---

# Verification Sources

Primary strategy source:

- Supplied video transcript: **"Der gewundene Altar - Guide"**
- Video: <https://www.youtube.com/watch?v=ErT5I3L66X0>

Secondary supplied transcript:

- **"Season 2 PTR | Mythic Raid Testing"**
- Used only for encounter/meta context, not for mechanic timing.
- Video: <https://www.youtube.com/watch?v=gCNuP2AWvjU>

Encounter / Dungeon Journal verification:

- Wowhead — The Coiled Altar Raid Boss Guide:\
  <https://www.wowhead.com/guide/midnight/raids/venomous-abyss-coiled-altar-boss-strategy-abilities>
- Warcraft Wiki — The Coiled Altar:\
  <https://warcraft.wiki.gg/wiki/The_Coiled_Altar>
- Blizzard — The Venomous Abyss raid launch announcement:\
  <https://worldofwarcraft.blizzard.com/en-gb/news/24294062>

Spell IDs and timings were checked against current Wowhead spell records. Direct spell lookup pattern:

```text
https://www.wowhead.com/spell=<SPELL_ID>
```

Examples:

- Fangs of the Coiled Altar: <https://www.wowhead.com/spell=1282487>
- Toxic Deluge: <https://www.wowhead.com/spell=1299960>
- Volatile Venom: <https://www.wowhead.com/spell=1282419>
- Guillotine: <https://www.wowhead.com/spell=1283489>
- Sever: <https://www.wowhead.com/spell=1299680>
- Dreadmarch: <https://www.wowhead.com/spell=1285643>
- Soul Sever: <https://www.wowhead.com/spell=1286620>
- Eternal Nightfall: <https://www.wowhead.com/spell=1286918>
- Gloombomb: <https://www.wowhead.com/spell=1310882>
- Soulbinding: <https://www.wowhead.com/spell=1304032>
- Blighted Sever: <https://www.wowhead.com/spell=1307279>
- Grim Guillotine: <https://www.wowhead.com/spell=1299267>

---

# Implementation Priority Summary

If only a first playable prototype is built, implement these systems in this order:

```text
1. Player movement + facing
2. Manifestation gaze behavior
3. Tank frontal geometry
4. Coalesced Venom pickup / 5s carry / drop
5. Guillotine 9y soak → 40y escape
6. Dreadmarch forced movement
7. Gravebound personal fragment recovery
8. Gloombomb 15y placement + Soulcoiler target
9. Intermission fragment interception
10. Full P3 combined Blighted Sever scenario
11. Full encounter state machine
```

The strongest single `wow-trainer` scenario for this boss is:

```text
Stage Three combined cleanup:
  venom objects
  + hidden/refixating manifestations
  + Gloombomb target
  + roaming Axegrinders
  + Blighted Sever cleanup
  + Guillotine movement reversal
```

That scenario captures the encounter's main spatial decision-making without requiring a complete World of Warcraft combat engine.
