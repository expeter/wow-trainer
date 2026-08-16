# Entombed Sentinels — wow-trainer Encounter Specification

**Raid:** The Venomous Abyss\
**Encounter:** Entombed Sentinels\
**Sentinels:** Breath of Ula'tek (acid/green) and Blood of Ula'tek (blood/red)\
**Specification status:** pre-raid-release / current Patch 12.1 data, checked 2026-08-16\
**Source strategy:** supplied guide transcript, corrected only where current encounter data provides newer names or mechanical values

> **Important data-status note:** Blizzard's EU raid schedule opens The Venomous Abyss on **19 August 2026**. As of this specification date, there are no live-raid combat logs to use as the final authority. Current Wowhead live-data pages and the current Dungeon Journal-backed guide already disagree with some recent guide/PTR material. Values with known conflicts are called out and should remain configurable in wow-trainer until live logs are available.

---

# Encounter Model

Entombed Sentinels is a two-boss split-raid encounter built around four interacting systems:

1. **Permanent spatial separation:** Breath of Ula'tek and Blood of Ula'tek must be kept far apart or both gain 99% damage reduction.
2. **Side-specific stacking marks:** players near Breath accumulate Mark of Acid; players near Blood accumulate Mark of Blood. The raid therefore operates as two teams and swaps sides after each intermission so old mark stacks can expire.
3. **Independent side mechanics:** Breath focuses on an add, Toxic Droplets and returning Living Venom; Blood focuses on group soaking, dispels and persistent Blood Venom puddle placement.
4. **100-energy intermission:** both Sentinels rush together, the weaker Sentinel is restored to the healthier Sentinel's health level, and every player must solve Helical Toxins. Shifting Protovenom immediately before this transition adds a second collision/pairing problem to the unified trainer encounter.

The core training challenge is **movement discipline under collision rules** rather than DPS simulation. wow-trainer should prioritize spatial state, target assignment, timers, collision detection, persistent hazards and mechanic dependencies over reproducing full WoW combat throughput.

## Recommended high-level arena model

Use a broad arena with:

- a **left outer boss position** and **right outer boss position** for the opening split;
- edge/cove drop zones for Blood Venom pools;
- a central intermission rendezvous area;
- room for counter-clockwise rotation to a next corner/cove after each intermission;
- persistent puddles that gradually reduce safe space.

The supplied strategy starts the two Sentinels at opposite edges. The Blood-side team consumes edge space with puddles; the Breath-side tank should remain approximately opposite the Blood Sentinel so the bosses stay safely separated. After each intermission, the tanks cross-taunt and the two raid teams switch which Sentinel they handle.

## Core configuration values

| Parameter | Current implementation value | Confidence / note |
| --- | ---: | --- |
| Sentinel separation safety target | **40 yd** | Use 40 yd as the conservative trainer value. Current sources contain a 25-vs-40 yd internal inconsistency; see Open / Unverified Details. |
| Damage reduction when too close | **99%** | Current spell / Dungeon Journal data. |
| Mark application interval | **5s** | Current live-data spell pages; older Dungeon Journal/transcript material says 6s. |
| Mark duration | **40s** | Current data. |
| Mark damage tick | **2s** | Current data. |
| Toxic Droplets cast | **2.0s** | Current data. |
| Toxic Droplet fuse | **12s** | Current live-data spell page; supplied transcript and current Method guide say 16s. Keep configurable. |
| Living Venom return delay | **4s** | Current data. |
| Venom Coagulation cast | **1.5s** | Current data. |
| Contaminate tick interval | **3s** | Current data. |
| Empowering Slam cast | **1.5s** | Current data. |
| Empowering Slam repeat-target increase | **10% Physical damage** | Current live-data spell page; transcript/Method say 15%. Keep configurable. |
| Blighted Blood duration | **18s** | Current data. |
| Blighted Blood tick | **2s** | Current data. |
| Unstable Miasma cast | **1.0s** | Current data. |
| Unstable Miasma target debuff | **8s** | Current data. |
| Unstable Miasma soak radius | **7.5 yd** | Current data. |
| Clinging Murk duration | **6s** | Current data. |
| Clinging Murk tick | **2s** | Current data. |
| Bloodvenom Injection cast | **1.5s** | Current data. |
| Bloodvenom Injection duration | **40s** | Current data. |
| Bloodvenom Injection tick | **1s** | Current data. |
| Vitriolic Stasis | **30s channel** | Current data. |
| Helical Toxins | **28s debuff** | Current data. |
| Helical Toxins tick | **2s** | Current live-data page checked 2026-08-16. |
| Helical neutralization rule | **exactly 4 total applications** | Current data. |
| Cultivated Burst follow-up DoT | **1 min** | Current data. |
| Shifting Protovenom cast | **4.0s** | Current data. |
| Protovenom Eruption radius | **10 yd** | Current data. |

Do **not** derive encounter recurrence intervals from spell-page cooldown fields. Exact encounter timing/order must come from future combat logs or verified live observations.

---

# Global Mechanics

## Ula'tek's Dominance — Spell ID 1290193 — instant / proximity aura

### What happens

When the Sentinels are too close, they empower each other and take **99% less damage**. The supplied guide and current strategy sources treat **40 yd separation** as the safe operational rule.

### Telegraph

- boss buff / visual empowerment;
- boss positions visibly converge;
- trainer can show the two separation-radius circles touching or overlapping.

### Targeting

Both Sentinels. This is position-based rather than player-targeted.

### Required reaction

The tanks must keep Breath and Blood on opposite sides of the arena. During normal phases, movement of one boss must be coordinated against the location of the other rather than independently drifting toward the center.

### Success condition

The bosses remain outside the configured dominance threshold except during the scripted 100-energy intermission.

### Failure conditions

- bosses enter the prohibited separation zone during an active damage phase;
- one tank follows an add/puddle route too far toward the other Sentinel;
- post-intermission repositioning crosses the bosses incorrectly or stops too early.

### wow-trainer implementation notes

Represent each Sentinel with a separation radius and continuously compute boss-to-boss distance. If `distance < dominanceThreshold`, set `dominanceActive = true`, show a 99% DR warning and mark the attempt as strategically failed if it persists outside the intermission.

Use **40 yd as the default conservative threshold**, but expose it as encounter data because current sources contain both 25 yd and 40 yd values.

Randomization is not important here; the challenge comes from interactions with add movement, puddle space and the post-intermission crossing.

---

## Mark of Acid — Spell ID 1284494 — instant / applied every 5s within 40 yd / 40s debuff / 2s ticks

### What happens

Breath of Ula'tek repeatedly applies a stacking Nature DoT to players within 40 yd. Current data applies the mark every **5 seconds** and each application lasts **40 seconds**.

### Telegraph

- green/acid debuff icon and stack counter;
- optional green tint on the player's side indicator;
- trainer stack counter that increases while the player remains in range.

### Targeting

All players within 40 yd of Breath of Ula'tek.

### Required reaction

Stay with the assigned Breath-side group during that segment of the encounter. After the intermission, rotate to Blood with the rest of the team so Acid stacks can expire rather than continuing to climb.

Do not stand in the middle attempting to interact with both bosses unless the simulation explicitly tests mark-overlap failure.

### Success condition

The player has only the mark corresponding to the assigned Sentinel and changes sides after the intermission cleanly enough for the previous mark to fall off.

### Failure conditions

- accumulating both Acid and Blood marks by standing between the bosses;
- remaining on the same Sentinel after the intended side swap;
- crossing too near the wrong boss during normal combat and receiving unnecessary marks.

### wow-trainer implementation notes

This can be mostly a **background state mechanic**:

- every 5s, apply/increment Acid to actors within 40 yd of Breath;
- individual applications expire after 40s;
- track both mark types independently;
- score dual-mark accumulation as positioning error.

Do not spend simulation complexity on exact DoT damage; stack count and wrong-side exposure are the important trainer signals.

---

## Mark of Blood — Spell ID 1284503 — instant / applied every 5s within 40 yd / 40s debuff / 2s ticks

### What happens

Blood of Ula'tek repeatedly applies the Blood equivalent of the side mark. It stacks while players remain within 40 yd and each application lasts 40 seconds.

### Telegraph

- red/blood debuff icon and stack counter;
- optional red tint on side UI.

### Targeting

All players within 40 yd of Blood of Ula'tek.

### Required reaction

Remain on the correct side, then swap to Breath after each intermission so Blood stacks can expire.

### Success condition

No unintended dual-mark exposure and a clean side rotation after the intermission.

### Failure conditions

Same as Mark of Acid, mirrored for the Blood side.

### wow-trainer implementation notes

Use the same generic `sideMark` system with a different source and visual identity. This is useful for validating side assignments and rotation, but does not need a full damage model.

---

# Breath of Ula'tek Mechanics

## Venom Coagulation — Spell ID 1284251 — 1.5s cast

### What happens

Breath of Ula'tek creates a large living slime. While the add remains alive it channels Contaminate, repeatedly damaging the entire raid.

The supplied strategy immediately prioritizes the add and moves Breath with it where useful so raid damage can cleave the add and boss together, then returns Breath to the outer edge.

### Telegraph

- 1.5s boss cast bar;
- large green slime/add appears;
- clear priority-target frame or marker.

### Targeting

Spawn mechanic rather than a player-targeted attack.

### Required reaction

Switch to the add immediately. If the add spawns away from Breath, the Breath tank may move the boss toward it **only while preserving Sentinel separation**. After the add dies, return Breath to the planned outer position.

### Success condition

The add dies quickly enough to minimize Contaminate ticks and boss movement never compromises Ula'tek's Dominance spacing.

### Failure conditions

- ignoring the add;
- leaving the add alive for excessive Contaminate ticks;
- dragging Breath too close to Blood for cleave;
- boss movement during a dangerous Living Venom return window creates unexpected projectile lanes.

### wow-trainer implementation notes

A movement trainer does not need a real DPS rotation. Model the add with a simplified `timeToKill` or `priorityResponse` interaction:

- spawn add at a variable nearby position;
- require the player/raid AI to switch focus within a reaction window;
- allow the tank to reposition Breath toward the add;
- terminate Contaminate when the add is considered killed.

Randomize add spawn angle/distance within a plausible Breath-side region so the player must evaluate whether moving the boss is safe.

---

## Contaminate — Spell ID 1284257 — channeled / 3s ticks

### What happens

The Venom Coagulation continuously pulses raid-wide Nature damage every **3 seconds** until destroyed. The database represents the channel with a long technical duration; in encounter terms it should be treated as **continuous until add death**, not as a meaningful ten-minute phase timer.

### Telegraph

- channel/cast on the slime;
- raidwide pulse feedback;
- escalating warning if the add remains alive.

### Targeting

Whole raid.

### Required reaction

Kill the Venom Coagulation quickly.

### Success condition

Low number of Contaminate ticks.

### Failure conditions

Too many ticks caused by delayed target switching or poor add priority.

### wow-trainer implementation notes

Treat Contaminate as a background urgency meter. Each 3s tick can increment a `raidDamagePressure` counter. The exact damage amount is unnecessary.

---

## Toxic Droplets — Spell ID 1284434 — 2.0s cast / 12s fuse

### What happens

Breath sprays multiple toxic droplets onto the ground. Each droplet erupts into Noxious Blast if it still exists after **12 seconds**. A player destroys a droplet by stepping on it, taking a localized hit.

**Current-data correction to the supplied transcript:** current Dungeon Journal/Wowhead data places Toxic Droplets under **Breath of Ula'tek**, not as a simultaneous mechanic on both Sentinel sides. Because teams swap Sentinels after intermissions, both raid groups still need to learn it over the encounter. Do not spawn it on the Blood side unless future live logs demonstrate that behavior.

### Telegraph

- 2.0s cast bar;
- visible green ground droplets/orbs;
- individual fuse/countdown indicator in training mode;
- optional warning when a droplet approaches expiration.

### Targeting

Ground-object spawn pattern associated with Breath. Exact droplet count and distribution are not yet verified from live logs.

### Required reaction

Players on the Breath side should distribute responsibility and step on all droplets before they expire. The supplied guide favors **everyone helping** rather than forcing one or two players to absorb many droplets.

### Success condition

Every spawned droplet is removed before its fuse reaches zero.

### Failure conditions

- any droplet reaches 12s and triggers Noxious Blast;
- one player absorbs too many droplets while others ignore nearby ones;
- players cluster around the same droplet and leave others untouched;
- players consume droplets in a pattern that creates difficult overlapping Living Venom return paths.

### wow-trainer implementation notes

Represent droplets as ground entities with:

- spawn position;
- `fuse = 12s`;
- collision radius;
- consumed/unconsumed state;
- source Sentinel reference for later Living Venom behavior.

Do **not** hard-code the transcript's estimated “eight per side.” Keep `dropletCount` configurable/randomizable until combat logs verify the live count.

Good trainer variants:

- random droplet fan/arc positions;
- uneven distances from the player;
- simultaneous player assignments;
- droplet consumption while an add is active;
- droplet consumption immediately before a transition.

**Data conflict:** the supplied transcript and current Method guide say 16s, while the current live-data spell page says 12s. Use **12s** for the current profile and retain a configurable override.

---

## Noxious Blast — Spell ID 1284452 — instant / raidwide on failed Toxic Droplet

### What happens

An unconsumed Toxic Droplet explodes and damages the entire raid.

### Telegraph

Expired droplet flashes/explodes; trainer can show a raidwide failure banner.

### Targeting

Whole raid.

### Required reaction

Prevent it by clearing every Toxic Droplet before expiry.

### Success condition

Noxious Blast never occurs.

### Failure conditions

Any unconsumed droplet reaches the fuse limit.

### wow-trainer implementation notes

Treat this primarily as the failure outcome of Toxic Droplets rather than as a standalone interactive module. One explosion can mark the attempt failed; multiple simultaneous failures can be counted separately for analytics.

---

## Living Venom — Spell ID 1284207 — instant / 4s return delay

### What happens

Venom slime ejected by Breath returns toward the Sentinel after **4 seconds**, damaging players in the return path.

The supplied guide describes the dangerous projectiles as being produced after players remove the green droplets and emphasizes that moving Breath changes the return alignment. Current Dungeon Journal text confirms the **4s return-to-source behavior**, but does not explicitly prove that every Toxic Droplet consumption maps one-to-one to a Living Venom projectile. That trigger relationship should therefore be implemented as transcript strategy for now and flagged for live-log verification.

### Telegraph

- green line/projectile or slime source on the ground;
- line between the slime/droplet origin and Breath;
- delayed return indicator;
- boss position itself acts as the destination cue.

### Targeting

Spatial line toward Breath of Ula'tek rather than a selected player.

### Required reaction

After droplets are handled, players move out of the return lines. The Breath tank should keep the boss **as still as practical during the return window** so lanes remain predictable.

### Success condition

No player is intersecting a return line when the Living Venom travels back to Breath.

### Failure conditions

- standing between a venom source and Breath;
- tank moves Breath during the setup and sweeps the return line through players;
- multiple delayed returns overlap into an undodgeable-looking fan due to staggered droplet collection;
- player clears a droplet then remains on its source-to-boss line.

### wow-trainer implementation notes

For the transcript-faithful version:

1. consuming a Toxic Droplet creates a delayed `livingVenomSource` at that position;
2. for 4s, draw/update a telegraph from source to the **current** Breath position;
3. at return time, launch a straight line/fast projectile toward Breath;
4. collision with the player is an avoidable-mechanic failure.

This makes boss movement mechanically meaningful. A useful trainer toggle can compare:

- **simultaneous collection:** many lines resolve together but create one concentrated dodge event;
- **staggered collection:** fewer simultaneous lines but a longer period of repeated movement.

The supplied strategy prefers broad participation and near-simultaneous handling.

---

## Empowering Slam — Spell ID 1284458 — 1.5s cast / +10% Physical damage per repeated same-target hit

### What happens

Breath slams its current tank. Each consecutive Slam on the same target increases Breath's Physical damage dealt by **10%** until it Slams a different target.

### Telegraph

- 1.5s cast bar;
- tank-target indicator;
- trainer stack/intensity counter on Breath.

### Targeting

Current tank of Breath.

### Required reaction

The encounter strategy solves this through the intermission tank exchange: after the Sentinels reconverge, tanks cross-taunt/swap Sentinels so the next Slam hits a different target and resets the repeat-target ramp.

### Success condition

Breath changes tank at the planned transition and does not accumulate excessive repeated Slam scaling.

### Failure conditions

- same tank remains on Breath through another phase;
- cross-taunt is late or targets the wrong Sentinel;
- movement after the taunt pulls both Sentinels too close.

### wow-trainer implementation notes

This can be abstracted to `lastSlamTarget` and `repeatSlamStacks`. A full tank-damage model is unnecessary; warn when the same actor is hit repeatedly and score correct cross-taunt at transition.

**Data conflict:** current live-data spell text says **10% additional Physical damage**, while the supplied transcript and current Method guide say **15%**. Use 10% in the current profile and keep it configurable until live logs settle the value.

---

# Blood of Ula'tek Mechanics

## Blood Venom — Spell ID 1284208 — instant / creates persistent pool on expiration

### What happens

Blood-venom applications associated with Blood of Ula'tek create a toxic pool when they expire. More applications create a **larger** pool.

This is the central spatial consequence tying together Blood-side mechanics: dispels, group soaking and the tank debuff all eventually consume safe arena space.

### Telegraph

- Blood Venom state/application counter;
- red/blood effect on the affected player;
- projected puddle-size preview can be enabled in training mode;
- persistent red/dark pool after resolution.

### Targeting

Applied through other Blood-side mechanics rather than as a simple standalone target event.

### Required reaction

Affected players move toward the assigned outer/cove drop zone before their venom resolves or is dispelled. Keep puddles along the edge, not through the central movement/intermission path.

### Success condition

Pools are tightly organized in planned edge space and preserve the center/rotation lanes.

### Failure conditions

- pool dropped in melee/center;
- pools block the route required for the next side swap;
- tank drops a very large pool in normal raid space;
- repeated poor placements exhaust safe space early.

### wow-trainer implementation notes

Use persistent circular/irregular hazards. Exact live radius and duration are not currently verified, so model **relative size tiers** based on application count rather than claiming specific yard values.

Recommended state:

```text
bloodVenomApplications -> poolSizeTier
poolPosition = playerPositionAtResolution
poolPersistent = true
```

Make pool placement a scored behavior even if the exact damage model is omitted.

---

## Blighted Blood — Spell ID 1284471 — instant / 18s Magic debuff / 2s ticks

### What happens

Blood applies a dispellable Shadow DoT lasting **18 seconds**. In the unified encounter profile, Blood Venom makes the dispel spatially important because expiration/dispelling produces a toxic pool.

### Telegraph

- Magic debuff icon;
- 18s timer;
- healer-dispel highlight;
- optional target arrow to the assigned edge drop zone.

### Targeting

Player targets on the Blood side. Exact target count per cast needs live-log verification.

### Required reaction

The affected player moves to a safe outer drop location and the healer dispels promptly once placement is acceptable. The supplied strategy says to remove these quickly; the trainer should therefore reward **fast but correctly positioned** dispels rather than an instant dispel in the middle.

### Success condition

Debuff is dispelled before natural expiry and the resulting pool is outside valuable raid space.

### Failure conditions

- instant dispel while the player is in the center;
- debuff expires before a dispel;
- affected player crosses other players/soak locations while moving out;
- pool overlaps an existing route or future intermission space.

### wow-trainer implementation notes

Two useful training roles:

- **affected-player mode:** move to a safe drop location and signal/await dispel;
- **healer mode:** choose when/whom to dispel based on position, not only timer.

For a single-player movement trainer, simulate the dispel automatically once the player enters a designated safe drop zone, with score penalties for late placement.

---

## Unstable Miasma — Spell ID 1288232 — 1.0s cast / 8s debuff / 7.5 yd soak

**Applied aura:** Spell ID 1288260

### What happens

Blood marks one player. After **8 seconds**, the Miasma erupts and its large Shadow hit is split among players within **7.5 yd**. Players hit receive applications of Clinging Murk.

The supplied strategy treats this as a Blood-side **group soak near the edge/melee range**, followed by moving the resulting venom effects outward so later pools consume edge space rather than the arena center.

### Telegraph

- 1.0s boss cast;
- target marker/circle;
- 8s debuff countdown;
- 7.5 yd soak radius visualization;
- incoming-soak indicator for nearby assigned players.

### Targeting

One marked player per event according to the current spell entry. The exact encounter frequency is not inferred from the database cooldown field.

### Required reaction

Blood-side players stack inside the soak circle before the 8s expiration. Immediately after the soak, players carrying the resulting Blood-side venom effects move toward the assigned pool drop area.

### Success condition

Enough players share the Miasma hit and the follow-up movement places later puddles safely.

### Failure conditions

- marked player isolated at expiration;
- insufficient players in the 7.5 yd circle;
- players arrive late and miss the soak;
- group remains stacked after the hit and interferes with subsequent collision/spread mechanics;
- resulting puddles are placed in the main arena.

### wow-trainer implementation notes

The exact minimum safe soak count is not yet verified and should **not be invented**. Configure a `requiredSoakers` parameter separately from the verified 7.5 yd radius.

For movement training:

- select/randomize a target;
- display 8s countdown;
- NPC teammates can converge on the target;
- at expiry count actors within 7.5 yd;
- assign Clinging Murk/blood-venom state to soakers;
- transition immediately into an “exit to edge/drop zone” task.

The important training relationship is **soak first, then reposition**, not raw damage splitting mathematics.

---

## Clinging Murk — Spell ID 1288297 — instant / 6s debuff / 2s ticks / stacks

### What happens

Players struck by Unstable Miasma receive a short stacking Blood-side venom DoT lasting **6 seconds**.

### Telegraph

- stack count and 6s timer;
- red/dark player effect;
- trainer can preview the next safe puddle drop zone.

### Targeting

Players hit by the Unstable Miasma soak.

### Required reaction

After completing the group soak, leave the central/melee stack and reposition toward the planned Blood Venom drop area.

### Success condition

The player handles the post-soak movement without contaminating valuable arena space.

### Failure conditions

- lingering in the soak stack;
- running through another active mechanic;
- dropping the resulting Blood Venom effect in central space.

### wow-trainer implementation notes

Current strategy sources connect the Miasma infection path to Blood Venom puddles, but the exact application-to-pool-size mapping needs live confirmation. Model this as a configurable relationship rather than hard-coding a numerical radius per Murk stack.

---

## Bloodvenom Injection — Spell ID 1284487 — 1.5s cast / 40s stacking debuff / 1s ticks

### What happens

Blood hits its current tank with Physical damage and applies a stacking Shadow DoT lasting **40 seconds**. In the supplied/current strategy, the tank leaving Blood after the intermission carries the venom away and places its eventual large Blood Venom pool outside valuable space.

### Telegraph

- 1.5s cast bar;
- tank debuff stack count;
- 40s timer;
- tank-specific future-puddle warning.

### Targeting

Current tank of Blood.

### Required reaction

At the intermission, tanks cross-taunt so the Blood tank changes. The tank carrying Bloodvenom Injection should move its eventual pool to a safe outside location while the new tank establishes the other Sentinel.

### Success condition

- correct tank exchange;
- old Blood tank deposits its hazard outside the main arena path;
- no accidental Sentinel convergence during the swap.

### Failure conditions

- same tank remains on Blood and stacks continue to grow;
- outgoing Blood tank drops a large puddle in the center;
- tank focuses on puddle placement and drags the other boss across the prohibited separation threshold.

### wow-trainer implementation notes

This is valuable as a **tank-role module**, but can be simplified for non-tank training. Track the debuff timer and spawn a larger pool at the carrier's position when the configured Blood Venom resolution happens.

---

# Transition and Intermission Mechanics

## Shifting Protovenom — Spell ID 1296878 — 4.0s cast / persists until neutralized (functional duration unverified)

**Applied aura observed in current/PTR data:** Spell ID 1296880

### What happens

Shortly before the 100-energy intermission, Vashnik contaminates random players with Shifting Protovenom. A contaminated player clears the toxin by touching **another contaminated player**. Touching a player without Protovenom instead triggers Protovenom Eruption.

This mechanic is included in the unified wow-trainer encounter because it materially changes the transition into Helical Toxins.

The aura data exposes a very long technical duration, but the encounter's functional duration is **not verified**. Strategically, it must be cleared rapidly because Helical Toxins arrives immediately afterward and requires deliberate player-to-player collisions of its own.

### Telegraph

- 4.0s cast bar from Vashnik;
- clear Protovenom debuff/visual on selected players;
- contaminated-player highlight;
- non-contaminated players should be visually distinguishable;
- trainer can show proximity warning before an invalid collision.

### Targeting

Random players. Exact live target count is not considered fully verified here; do not hard-code a count solely from old/secondary selector data until live logs confirm it.

### Required reaction

- Protovenom players immediately find **any other Protovenom player** and touch them to neutralize both.
- Players without Protovenom move outward/yield space and avoid crossing the contaminated players' routes.
- Clear Protovenom before beginning the Helical Toxins matching puzzle.

The supplied strategy gives Protovenom carriers “right of way” while non-carriers drift toward the outer edge.

### Success condition

All Protovenom carriers are neutralized rapidly and no invalid player collision occurs before the 100-energy matching phase.

### Failure conditions

- Protovenom player touches a non-carrier;
- two non-compatible paths cross and trigger an eruption;
- Protovenom remains active when Helical Toxins begins;
- knockback pushes players into hazards, other players or poor intermission positions;
- players panic-stack before checking who is contaminated.

### wow-trainer implementation notes

This is one of the most valuable standalone movement modules.

Use collision rules:

```text
if A.hasProtovenom && B.hasProtovenom:
    clear(A)
    clear(B)
else if exactlyOneHasProtovenom(A, B):
    triggerProtovenomEruption(atCollision)
```

Randomize:

- carrier selection;
- initial positions;
- relative partner distances;
- safe/unsafe crossing lanes;
- amount of edge space already occupied by Blood Venom pools.

Do not assign fixed partners unless a later strategy specifically requires it; the mechanic only requires contaminated-to-contaminated contact.

---

## Protovenom Eruption — Spell ID 1296962 — instant / 10 yd radius / knockback

### What happens

Invalid contact between a Protovenom carrier and a non-carrier triggers an eruption that damages players within **10 yards** and knocks them away.

### Telegraph

- immediate explosion at the collision point;
- 10 yd burst radius;
- knockback trajectory.

### Targeting

Players within 10 yd of the invalid collision.

### Required reaction

Prevent the collision. Once triggered, nearby players should avoid being positioned such that the knockback cascades into other hazards or players.

### Success condition

No Protovenom Eruption occurs.

### Failure conditions

- invalid collision itself;
- secondary players caught in the 10 yd radius;
- knockback into puddles/off-arena/another pairing path;
- eruption delays Helical Toxins matching.

### wow-trainer implementation notes

Model physical displacement; the knockback is part of why this mechanic matters for a movement simulator. A single invalid collision can be a major-failure event even if the player survives.

---

## Vitriolic Stasis — Spell ID 1284588 — 30s channel / 99% boss damage reduction

### What happens

At **100 energy**, both Sentinels rush to the center and channel Vitriolic Stasis for **30 seconds**. During the channel they take **99% less damage**, and the lower-health Sentinel is restored until its health matches the healthier Sentinel.

The important strategic implication is that damage imbalance is effectively refunded. The two sides should keep boss health reasonably even before each intermission.

### Telegraph

- Sentinel energy reaches 100;
- both bosses leave their outer positions and rush together;
- 30s channel bar;
- 99% DR visual;
- weaker boss health rises toward the healthier one.

### Targeting

Both Sentinels / whole encounter state.

### Required reaction

Before the transition:

- stop creating a large HP difference between Sentinels;
- spread enough that player collision mechanics do not instantly chain when Helical Toxins appears;
- clear Shifting Protovenom first when active.

During Stasis:

- ignore boss damage as a training priority;
- solve Helical Toxins calmly;
- prepare for the post-channel cross-taunt and side swap.

### Success condition

- minimal health restored because boss HP was balanced;
- all Helical Toxins are neutralized;
- players are positioned to rotate safely after the channel.

### Failure conditions

- large HP imbalance causes major boss healing;
- players stay stacked as Helical Toxins begins;
- wasted focus on boss DPS instead of matching;
- exit positioning causes a poor post-intermission swap.

### wow-trainer implementation notes

Model boss health only to the fidelity required for the healing relationship:

```text
atStasisStart:
    lowerBoss.hp = higherBoss.hp
```

or animate the restoration over the 30s channel if useful visually. The damage-rotation gameplay can be simplified to a “balance score” rather than a complete combat engine.

The supplied guide suggests parking the bosses far out before this transition to lengthen their travel and gain a few extra seconds for Protovenom. The **exact 2–3s benefit is not verified** and should not be hard-coded; trainer boss starting distance may nevertheless affect transition travel time if live behavior confirms it.

---

## Helical Toxins — Spell ID 1284590 — instant / 28s debuff / 2s ticks

### What happens

During Vitriolic Stasis, every player receives a mixed acid/blood toxin representation. Colliding with another player **combines the toxin applications**. Reaching **exactly 4 applications** neutralizes the toxin harmlessly.

The supplied strategy interprets the visible puzzle as four total colored marks over each player. A player with a 3/1 color split needs the complementary 1/3 player; a 2/2 player needs another 2/2 player. Expressed using the acid/green count:

```text
player A acid count + player B acid count == 4
```

Examples:

- 1 acid + 3 acid -> correct;
- 3 acid + 1 acid -> correct;
- 2 acid + 2 acid -> correct;
- 3 acid + 2 acid -> incorrect.

### Telegraph

- Helical Toxins debuff with **28s** remaining;
- four colored overhead marks/orbs, split between acid/green and blood/red;
- collision radius around players;
- optional trainer UI showing the player's own count while still requiring visual partner recognition.

### Targeting

Whole raid.

### Required reaction

1. Begin the transition **spread**, especially melee players.
2. Read your own acid/green count.
3. Find exactly one compatible partner whose acid count completes a total of four.
4. Move deliberately to that player while avoiding incompatible players.
5. Touch the compatible player to neutralize both toxin states.
6. Once cleared, move away from unresolved players so you do not interfere with their paths.

There is no benefit to remaining on the bosses during this puzzle because Vitriolic Stasis gives them 99% DR.

### Success condition

Every player's Helical Toxins reaches exactly four applications through a compatible collision and clears before the 28s expiration.

### Failure conditions

- wrong partner collision;
- no partner reached before 28s;
- accidental collision while the raid begins stacked;
- cleared player obstructs unresolved players;
- Protovenom is still active and its collision rule conflicts with Helical movement;
- panic movement causes repeated path crossings.

### wow-trainer implementation notes

This should be the **highest-priority standalone training module**.

For a single-player version, spawn NPC raiders with visible signatures and generate a guaranteed solvable set. A robust generator should create complementary pairs rather than independently randomizing counts and risking an unsolvable state.

Example generator logic:

```text
for each pair:
    choose type from [(1,3), (2,2), (3,1)]
    assign complementary acid counts
    bloodCount = 4 - acidCount
shuffle player positions
```

The generated distribution is a **trainer construction**, not a claim that the live encounter uses exactly that assignment algorithm.

Collision handling should be explicit:

```text
combinedAcid = A.acid + B.acid
if combinedAcid == 4:
    neutralize(A, B)
else:
    markInvalidCombination(A, B)
```

The exact internal game behavior after an incorrect collision should be confirmed with live logs. For trainer purposes, an incorrect collision is already a failed execution and can lead to Cultivated Burst at expiry.

Randomize:

- own toxin split;
- partner position;
- density of incompatible players;
- initial spread pattern;
- remaining Blood Venom puddles;
- whether Shifting Protovenom had just forced players into non-ideal locations.

---

## Cultivated Burst — Spell ID 1284941 — instant on failed Helical expiry / 1 min follow-up DoT

### What happens

If Helical Toxins expires unresolved, it erupts for a large hit and applies a severe **1-minute** follow-up Plague DoT.

The supplied guide treats this as generally lethal and therefore a hard failure state. A transcript anecdote reports the debuff persisting after a combat resurrection; that specific resurrection behavior is **not reliable enough to model as intended gameplay**.

### Telegraph

- Helical timer reaches zero while unresolved;
- violent player-centered eruption;
- long failure DoT icon.

### Targeting

The player whose Helical Toxins expires unresolved. An incorrect pair can therefore produce failure on both involved players.

### Required reaction

Prevent the expiry by solving Helical correctly.

### Success condition

Cultivated Burst never occurs.

### Failure conditions

Any unresolved/incorrect Helical state reaches expiry.

### wow-trainer implementation notes

Treat Cultivated Burst as a **terminal mechanic failure** for training. There is little value in simulating the full minute of damage; record why it occurred:

- `no_match`;
- `wrong_match`;
- `blocked_path`;
- `protovenom_overlap`;
- `late_resolution`.

Do not implement the reported resurrection persistence unless live testing demonstrates it is intentional and relevant.

---

# Encounter Relationships

The encounter should not be implemented as disconnected minigames. These dependencies create the actual training value:

```text
Sentinel separation
    -> prevents Ula'tek's Dominance
    -> also keeps Mark of Acid / Mark of Blood assignments clean

Mark stacks
    -> create pressure to swap Sentinel sides after intermission

Balanced boss damage
    -> minimizes healing during Vitriolic Stasis

Venom Coagulation spawn
    -> forces add priority
    -> may require Breath movement for cleave
    -> Breath movement must still preserve Sentinel separation

Toxic Droplet placement
    -> players must consume ground objects before the fuse
    -> transcript strategy links consumed droplets to delayed Living Venom returns
    -> return lane points back toward Breath
    -> therefore Breath movement changes dodge geometry

Unstable Miasma
    -> group soak within 7.5 yd
    -> applies Clinging Murk / Blood-side venom pressure
    -> players then move outward
    -> Blood Venom resolves into persistent puddles

Blighted Blood
    -> dispel decision
    -> Blood Venom pool at affected player's position
    -> therefore dispel timing depends on player position

Bloodvenom Injection
    -> tank carries a long Blood-side venom state
    -> intermission tank swap changes boss ownership
    -> outgoing Blood tank must place the eventual large pool safely

Persistent Blood Venom pools
    -> reduce safe edge space
    -> constrain later Miasma, dispel, transition and side-swap paths

Shifting Protovenom
    -> requires compatible contaminated-player collision
    -> incompatible collision causes 10 yd knockback eruption
    -> must be solved before Helical Toxins begins

Helical Toxins
    -> requires a second, different collision/matching rule
    -> exactly four total applications clears
    -> unresolved toxin causes Cultivated Burst

Vitriolic Stasis end
    -> tanks cross-taunt
    -> teams swap Sentinels
    -> old side marks can expire
    -> each team now plays the other Sentinel's mechanics
```

The **Protovenom -> Helical Toxins transition** is the most important dependency to preserve. The trainer should never teach these as if players can ignore spacing and simply pair twice in the same clump.

---

# Logical Encounter Flow

Exact timestamps and recurrence intervals are intentionally omitted because reliable live combat logs are not yet available.

```text
PULL
  ↓
Split raid into two teams
  ↓
Tanks establish Breath and Blood on opposite outer edges
  ↓
NORMAL SPLIT PHASE — mechanics run in parallel
  │
  ├─ Breath side
  │    ├─ Venom Coagulation -> kill priority -> Contaminate ends
  │    ├─ Toxic Droplets -> consume before fuse
  │    │                    -> Living Venom returns toward Breath
  │    └─ Empowering Slam repeats on Breath tank
  │
  └─ Blood side
       ├─ Blighted Blood -> move outward -> dispel -> Blood Venom pool
       ├─ Unstable Miasma -> group soak -> Clinging Murk -> move outward/pools
       └─ Bloodvenom Injection stacks on Blood tank
  ↓
Approaching 100 energy
  ├─ keep Sentinel HP close
  ├─ push both bosses toward planned outer positions
  ├─ raid spreads
  └─ Shifting Protovenom -> contaminated players pair immediately
  ↓
100 ENERGY
  ↓
Sentinels rush together
  ↓
Vitriolic Stasis — 30s / 99% DR / weaker Sentinel restored
  ↓
Helical Toxins — 28s
  └─ find one compatible player so toxin total reaches exactly 4
  ↓
Stasis ends
  ↓
Tanks cross-taunt / teams switch Sentinels
  ↓
Re-establish opposite outer positions, preferably rotating counter-clockwise
  ↓
Outgoing Blood tank places delayed large Blood Venom hazard safely
  ↓
NORMAL SPLIT PHASE with teams now playing the opposite kit
  ↓
REPEAT until both Sentinels are defeated or arena space/execution collapses
```

## Positioning strategy from the supplied guide

Use this as the default strategy profile, not as a universal assertion that other raid plans are invalid:

- initial teams: equivalent to groups 1+3 on one side and 2+4 on the other;
- both tanks begin near their intended outer positions so the bosses can be pulled/spotted outward immediately;
- Blood-side puddles are placed into the outer cove/edge to preserve central space;
- Breath should generally remain opposite Blood; Breath-side repositioning follows the Blood-side spatial plan rather than forcing Blood to chase Breath;
- after each intermission, tanks cross-taunt and both teams rotate to the other Sentinel;
- the supplied guide favors a counter-clockwise move into the next corner/cove if earlier puddles make the previous location less attractive;
- before the intermission, especially melee players should spread early to avoid accidental pairing collisions;
- non-Protovenom players should yield/outward-position while Protovenom carriers have direct movement priority.

---

# Suggested wow-trainer State Machine

```text
EncounterState
  SPLIT_PHASE
  PRE_INTERMISSION
  STASIS_HELICAL
  POST_STASIS_SWAP
  ENDED

SentinelState
  id: BREATH | BLOOD
  position
  healthNormalized
  energy
  currentTank
  sideMarkSource
  dominanceActive

PlayerState
  assignedTeam
  position
  acidMarkStacks
  bloodMarkStacks
  unstableMiasmaTimer?
  clingingMurkStacks?
  blightedBloodTimer?
  bloodVenomApplications?
  bloodvenomInjectionStacks?
  protovenomActive
  helicalAcidCount?
  helicalBloodCount?
  helicalResolved

ArenaState
  toxicDroplets[]
  livingVenomSources[]
  bloodVenomPools[]
  venomCoagulationAdd?
```

## Event-driven logic

Avoid using video timestamps. Trigger mechanics from encounter events/data:

```text
onPull -> SPLIT_PHASE
onBreathAbility(VenomCoagulation) -> spawnAdd
onBreathAbility(ToxicDroplets) -> spawnDroplets
onDropletConsumed -> optionallyScheduleLivingVenomReturn(4s)
onDropletFuseExpired -> NoxiousBlast failure
onBloodAbility(UnstableMiasma) -> assignTarget(8s)
onMiasmaExpire -> resolveSoak(7.5yd) -> applyMurk
onBloodVenomResolve -> spawnPersistentPool
onEnergyApproaches100 -> PRE_INTERMISSION
onShiftingProtovenom -> assignRandomCarriers
onEnergy100 -> moveSentinelsToCenter -> STASIS_HELICAL
onHelicalAssigned -> generateSolvableMatchingProblem(28s)
onStasisEnd -> POST_STASIS_SWAP
onCrossTauntAndRepositionComplete -> swapTeamKits -> SPLIT_PHASE
```

The exact trigger threshold for “approaches 100” and the real timing between Shifting Protovenom and Vitriolic Stasis must be filled from live logs rather than guessed.

---

# Player-Facing Failure Taxonomy

Use consistent machine-readable failure reasons so wow-trainer can provide useful post-run feedback.

| Failure code | Meaning |
| --- | --- |
| `dominance_overlap` | Sentinels were brought inside the configured separation threshold. |
| `dual_mark_exposure` | Player accumulated both Acid and Blood marks outside the intermission. |
| `missed_add_priority` | Venom Coagulation lived through excessive Contaminate ticks. |
| `droplet_expired` | Toxic Droplet reached its fuse and caused Noxious Blast. |
| `droplet_overload` | Player consumed an excessive share while nearby assigned players ignored droplets. |
| `living_venom_hit` | Player intersected a returning Living Venom line. |
| `bad_boss_movement` | Breath movement unnecessarily swept return lines across players or compromised separation. |
| `miasma_under_soak` | Unstable Miasma resolved without the configured safe soak count. |
| `miasma_late_entry` | Player missed the 7.5 yd soak circle at resolution. |
| `bad_blood_pool` | Blood Venom pool was dropped in valuable central/route space. |
| `bad_dispel_position` | Blighted Blood was dispelled before the player reached a safe drop zone. |
| `tank_swap_missed` | Same tank remained on the Sentinel when the strategy expects cross-taunt. |
| `protovenom_invalid_collision` | Protovenom carrier touched a non-carrier. |
| `protovenom_unresolved` | Protovenom remained when Helical matching began. |
| `protovenom_knockback_hazard` | Protovenom Eruption knocked player into a hazard/bad position. |
| `helical_wrong_match` | Player collided with an incompatible Helical partner. |
| `helical_timeout` | Helical Toxins expired unresolved. |
| `helical_accidental_collision` | Pairing happened before player had intentionally selected a compatible target. |
| `stasis_hp_imbalance` | Large pre-Stasis boss HP difference caused avoidable healing. |
| `post_stasis_bad_rotation` | Player/tank used wrong side/path after the intermission. |

---

# Recommended Training Modules

## 1. Helical Toxins Matching — highest value

**Why:** This is a hard binary coordination check for every player and is easy to reproduce accurately without a full combat engine.

Train:

- identify own 1/3, 2/2 or 3/1 color split;
- scan other players;
- choose the correct complement;
- navigate without touching wrong players;
- clear within 28s;
- re-clear the lane after success so unresolved players can move.

Difficulty scaling should come from player density, partner distance, obstructed routes and remaining puddles—not artificial timer reduction.

## 2. Shifting Protovenom -> Helical Transition

**Why:** This combines two superficially similar but mechanically different collision puzzles in immediate succession.

Train:

- recognize Protovenom carrier state;
- contaminated players find another carrier;
- non-carriers yield outward;
- avoid 10 yd eruption/knockback;
- re-spread;
- immediately solve Helical with the new matching rule.

This is likely the most important advanced module.

## 3. Toxic Droplets + Living Venom Return Geometry

**Why:** Good movement practice: object collection creates delayed line hazards whose destination depends on boss position.

Train:

- divide droplets across players;
- collect before the fuse;
- recognize delayed return lines;
- dodge multiple lines;
- hold Breath stable during return resolution;
- compare simultaneous vs staggered collection patterns.

## 4. Unstable Miasma -> Exit -> Blood Venom Placement

**Why:** The mechanic reverses movement intent: first converge for a soak, then immediately disperse toward safe edge space.

Train:

- locate marked player;
- enter 7.5 yd soak;
- stay until resolution;
- leave promptly afterward;
- choose a valid puddle drop location without blocking future paths.

## 5. Blighted Blood Dispel Positioning

**Why:** The “correct dispel” depends on geometry, not only reacting to a debuff icon.

Train affected-player and healer variants:

- move to edge;
- dispel promptly once safe;
- avoid early central dispel;
- pack puddles efficiently.

## 6. Full Side-Swap / Marks / Boss Separation

**Why:** Teaches encounter macro-positioning and why teams alternate Sentinels.

Train:

- maintain opposite bosses;
- avoid dual marks;
- pre-spread before Stasis;
- cross-taunt and swap sides;
- route around accumulated Blood Venom pools;
- re-establish separation quickly.

## 7. Breath Add Priority Under Movement Pressure

**Why:** Less mechanically complex but useful when combined with Toxic Droplets/Living Venom.

Train:

- notice Venom Coagulation;
- prioritize it;
- optionally reposition Breath for cleave without entering dominance range;
- return boss to the planned edge before return projectiles.

## 8. Tank Transition Module

**Why:** Role-specific but combines both tank ramps with positioning.

Train:

- track Empowering Slam repeat target;
- track Bloodvenom Injection;
- cross-taunt after Stasis;
- carry outgoing Blood venom to a safe pool location;
- establish opposite Sentinel positions without crossing too closely.

---

# Full Encounter Simulation

A mature wow-trainer full simulation should combine:

- two simultaneously active Sentinel positions;
- two raid teams, with NPC teammates on the non-player side when running a single-player scenario;
- side marks and 40 yd side ownership;
- Ula'tek's Dominance separation check;
- Breath-side add priority;
- Toxic Droplet ground objects and Living Venom return lines;
- Blood-side Miasma soak, Blighted Blood dispels and persistent puddles;
- simplified tank-ramp state;
- boss HP parity score;
- pre-100-energy spread state;
- Shifting Protovenom collision puzzle;
- Vitriolic Stasis center movement and 30s channel;
- 28s Helical Toxins matching puzzle;
- post-intermission cross-taunt/team side switch;
- persistent arena contamination across repeats.

The full simulation should be **event-driven**, not a fabricated timestamp script. Once live logs exist, a verified event scheduler can be layered on top without changing the individual mechanic implementations.

## Recommended single-player abstraction

The player controls one raid character while NPC raiders provide believable context:

- NPCs execute baseline-safe movement but leave meaningful gaps/tasks to the player;
- NPCs can carry visible Helical/Protovenom states so partner recognition remains real;
- the player's assigned side changes after each intermission;
- difficulty comes from target/random spawn geometry and overlapping responsibilities rather than NPC sabotage;
- trainer scoring explains *which dependency was violated*, not only that the player took damage.

## Recommended randomization

Randomize only values that preserve the encounter's rules:

- Breath/Blood initial left-vs-right assignment;
- player team assignment;
- add spawn angle;
- Toxic Droplet positions/count within a configurable verified range;
- Helical toxin signature and compatible-partner location;
- Shifting Protovenom carrier positions;
- existing puddle layout after earlier cycles;
- Miasma target;
- Blighted Blood target(s) once live target count is known.

Do not randomize verified mechanic rules such as `helicalTotal == 4`, 7.5 yd Miasma radius or 10 yd Protovenom Eruption radius.

---

# Background Mechanics

These matter to the real encounter but probably do not require detailed wow-trainer combat simulation:

- exact damage values from Mark of Acid / Mark of Blood;
- exact Contaminate damage per pulse;
- raw tank damage from Empowering Slam and Bloodvenom Injection;
- healer throughput required for droplet consumption;
- precise raid-health loss from Blighted Blood / Clinging Murk;
- exact player health/defensive cooldown modeling;
- 99% damage reduction arithmetic during Stasis/Dominance beyond a visible “damage effectively disabled” state;
- detailed boss DPS rotations;
- combat resurrection behavior of failed toxin debuffs;
- precise Venom Coagulation HP.

These can be represented as pressure/failure counters unless a later wow-trainer mode explicitly trains healing or defensive planning.

---

# Open / Unverified Details

These should remain explicit implementation TODOs rather than hidden assumptions.

1. **Pre-release status:** the raid is scheduled to open in the EU on 19 August 2026. Live combat logs are not yet available as of 16 August.
2. **Ula'tek's Dominance threshold:** current Wowhead guide text includes **25 yd**, while its own strategy says **40+ yd**; the linked spell's quick range is 25 yd but its description/effect text says 40 yd. The supplied transcript and Method both use 40 yd. Use 40 yd conservatively and verify from live logs.
3. **Mark cadence:** current live-data spell pages say every **5s**; older Dungeon Journal/transcript material says every **6s**. Use 5s now; verify live.
4. **Toxic Droplet fuse:** current live-data spell page says **12s**; supplied transcript and Method's 12-Aug guide say **16s**. Use 12s now; parameterize.
5. **Toxic Droplet count:** supplied transcript estimates roughly eight per side/round, but current encounter data does not verify the count. Do not hard-code eight.
6. **Toxic Droplet side assignment:** current Dungeon Journal data lists it under Breath only; transcript says droplets occur on both sides. Implement Breath-side only unless live logs show otherwise.
7. **Living Venom trigger relationship:** current data verifies a 4s delayed return to Breath; transcript says these projectiles arise from destroyed Toxic Droplets. Verify whether each consumed droplet creates one Living Venom return and whether the line locks to Breath's position at release or dynamically tracks during travel.
8. **Empowering Slam scaling:** current spell page says **+10% Physical damage** per repeated same-target Slam; transcript/Method say **15%**. Use 10% now and make configurable.
9. **Blood Venom pool size/radius/duration:** current data verifies that more applications create larger pools, but exact size mapping and persistence duration are not verified here.
10. **Unstable Miasma safe soak count:** 7.5 yd radius and 8s delay are verified, but the minimum practical number of soakers should come from live damage/log analysis rather than being invented.
11. **Miasma -> Clinging Murk -> Blood Venom mapping:** strategy sources confirm puddles follow Blood-side infections, but exact stack-to-pool behavior should be log-verified.
12. **Blighted Blood target count:** not verified in current source data used here.
13. **Shifting Protovenom target count:** current spell text only says random players. Do not hard-code a count until live encounter data confirms it.
14. **Shifting Protovenom functional duration:** the applied aura has a long technical database duration, but strategically it behaves as “until neutralized.” Do not expose the technical 10-minute value as a meaningful player timer without live confirmation.
15. **Shifting Protovenom timing before 100 energy:** the supplied guide says it occurs shortly before Stasis, but the exact energy/timestamp offset is not verified.
16. **Boss travel-time advantage before Stasis:** the supplied guide recommends keeping bosses far out to gain roughly 2–3 additional seconds for Protovenom. The exact gain has not been verified and should not be encoded yet.
17. **Exact ability ordering / recurrence:** no normal-phase timeline should be inferred from video cuts or spell database cooldown fields. Fill from live combat logs.
18. **Helical wrong-collision internal state:** “exactly four clears” is verified. The exact server-state behavior after a non-four collision should be checked in logs; for training it is sufficient to mark the collision incorrect and let unresolved toxins fail at expiry.
19. **Cultivated Burst resurrection anecdote:** the transcript reports a possible bug where a failed debuff survived death/resurrection. Do not simulate this as intended behavior without confirmation.
20. **Cultivated Burst puddle:** current Method text mentions a large puddle after failure, while the current direct spell data and supplied transcript emphasize the explosion + 1-minute DoT. Do not add a Cultivated Burst puddle until live evidence confirms it.

---

# Spell Reference

| Spell | Spell ID | Relevant timing | Trainer relevance |
| --- | ---: | --- | --- |
| Ula'tek's Dominance | **1290193** | instant proximity aura; threshold source conflict 25/40 yd | Boss separation / 99% DR failure |
| Mark of Acid | **1284494** | every 5s within 40 yd; 40s duration; 2s ticks | Side ownership / rotation |
| Mark of Blood | **1284503** | every 5s within 40 yd; 40s duration; 2s ticks | Side ownership / rotation |
| Venom Coagulation | **1284251** | 1.5s cast | Add-priority event |
| Contaminate | **1284257** | channeled until add dies; 3s ticks | Raid-pressure / add urgency |
| Toxic Droplets | **1284434** | 2.0s cast; current fuse 12s | Ground-object collection |
| Noxious Blast | **1284452** | instant on failed droplet | Hard failure for missed droplet |
| Living Venom | **1284207** | returns to Breath after 4s | Delayed line dodge / boss-position dependency |
| Empowering Slam | **1284458** | 1.5s cast; current +10% Physical per repeated same target | Tank exchange state |
| Blood Venom | **1284208** | pool on expiration; larger with more applications | Persistent arena-space management |
| Blighted Blood | **1284471** | instant; 18s Magic debuff; 2s ticks | Position-before-dispel |
| Unstable Miasma | **1288232** | 1.0s cast; 8s target delay; 7.5 yd soak | Group soak / movement reversal |
| Unstable Miasma aura | **1288260** | 8s debuff | Target countdown / collision area |
| Clinging Murk | **1288297** | 6s; 2s ticks; stacks | Post-soak movement / Blood Venom pressure |
| Bloodvenom Injection | **1284487** | 1.5s cast; 40s stacking debuff; 1s ticks | Tank swap + delayed pool placement |
| Shifting Protovenom | **1296878** | 4.0s cast | Pre-intermission compatible-collision puzzle |
| Shifting Protovenom aura | **1296880** | technical long duration; functional duration unverified | Carrier collision state |
| Protovenom Eruption | **1296962** | instant; 10 yd radius; knockback | Invalid-collision failure |
| Vitriolic Stasis | **1284588** | 30s channel | Intermission / health equalization / 99% DR |
| Helical Toxins | **1284590** | instant; 28s debuff; 2s ticks | Primary matching module; exactly 4 clears |
| Cultivated Burst | **1284941** | instant on Helical expiry; 1 min follow-up DoT | Hard failure for unresolved matching |

---

# Verification Sources

Checked 2026-08-16. Strategy from the supplied transcript is retained unless current spell/Dungeon Journal data directly corrects names or values.

- **Blizzard Entertainment — Curse of Ula'tek: The Venomous Abyss Raid Goes Live 19 August**\
  https://worldofwarcraft.blizzard.com/en-gb/news/24294062
- **Wowhead — Entombed Sentinels Raid Boss Guide, Midnight Season 2 / Patch 12.1** (updated 2026-08-10)\
  https://www.wowhead.com/guide/midnight/raids/venomous-abyss-entombed-sentinels-boss-strategy-abilities
- **Method — Entombed Sentinels Heroic Boss Guide** (updated 2026-08-12; used as a strategy cross-check and to identify current guide/data conflicts)\
  https://www.method.gg/guides/the-venomous-abyss/entombed-sentinels-heroic
- **Wowhead current spell data:** spell IDs linked throughout the reference section; key pages include:\
  https://www.wowhead.com/spell=1290193/ulateks-dominance\
  https://www.wowhead.com/spell=1284494/mark-of-acid\
  https://www.wowhead.com/spell=1284503/mark-of-blood\
  https://www.wowhead.com/spell=1284434/toxic-droplets\
  https://www.wowhead.com/spell=1284207/living-venom\
  https://www.wowhead.com/spell=1284458/empowering-slam\
  https://www.wowhead.com/spell=1284208/blood-venom\
  https://www.wowhead.com/spell=1284471/blighted-blood\
  https://www.wowhead.com/spell=1288232/unstable-miasma\
  https://www.wowhead.com/spell=1288297/clinging-murk\
  https://www.wowhead.com/spell=1284487/bloodvenom-injection\
  https://www.wowhead.com/spell=1296878/shifting-protovenom\
  https://www.wowhead.com/spell=1296962/protovenom-eruption\
  https://www.wowhead.com/spell=1284588/vitriolic-stasis\
  https://www.wowhead.com/spell=1284590/helical-toxins\
  https://www.wowhead.com/spell=1284941/cultivated-burst
