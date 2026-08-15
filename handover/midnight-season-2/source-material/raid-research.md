# Midnight Season 2 raid research for the Lura trainer

**Research state:** 13 August 2026 · **Region:** Europe · **Live raid opening:** 19 August 2026

> The main progression raid is **The Venomous Abyss** with eight bosses. **Nymrissa Wavecaller** is included separately because the Tidebound Grotto Lair is a Season 2 raid-row encounter with flexible Mythic.

## The most important limitation

The raid has not opened on European live servers. The current Dungeon Journal is good enough to model rules, radii, durations and phase triggers, and all seven non-final bosses were scheduled for public Heroic and Mythic PTR testing, with footage/log data available for the tested encounters. Ula'tek, the final boss, was explicitly withheld from public testing. Exact pull-relative cast times therefore remain provisional. Lura should use event-driven encounter state plus replaceable timing profiles, not a single hard-coded timeline.

### Confidence legend
- **A:** Stable encounter rule or duration present in the current Dungeon Journal.
- **B:** Supported by public PTR testing, a current tactical guide, or repeated footage; still subject to tuning.
- **C:** Inference, incomplete journal interpretation, or untested final-boss behaviour; validate from live logs.

## Current information sources

| Source | Best use now | Limitation on 13 Aug 2026 |
|---|---|---|
| Blizzard raid article and PTR schedule | Release, roster and which bosses were publicly tested | No tactical details |
| Wowhead boss pages | Current Dungeon Journal rules and difficulty tags | Several cheat sheets are still marked as coming soon |
| RaidStrats.gg | Heroic phase structure, practical positioning and cadence notes for bosses 1–7 | Its pages currently say no videos yet and warn that timings can change |
| Method | Detailed Heroic text guides currently available for Nek'zali and Entombed Sentinels | Remaining encounter pages are not yet populated to the same level |
| PTR YouTube footage | Visual geometry, cast order, overlaps and player movement | Tuning/build may differ from live |
| Warcraft Logs zone 54 | PTR reports now; live cast timelines after opening | PTR rankings are only a testing snapshot |

## Recommended Lura implementation

1. Model **rules** separately from **timing**. A rule says what a mechanic does; a timing profile says when it occurs.
2. Prefer triggers such as `boss_health <= 50`, `energy == 100`, `add_death`, and `aura_removed`.
3. Give every timing value a provenance flag: `journal`, `ptr_guide`, `ptr_video`, or `live_log`.
4. Support short mechanic packets first. They are more reusable than recreating an eight-minute boss immediately.
5. Let bots fill missing raid slots, but make assignments, visible debuffs and movement rules legible to the human player.
6. Record reaction time, assignment correctness, collisions, missed soaks, stack budgets and positional error—not simulated DPS.

## Recommended build order
1. Entombed Sentinels – Helical Toxins
2. Sszorak – Crosswinds plus Mythic Fury/Virulence
3. The Coiled Altar – Dreadmarch ghosts and globule conveyor
4. The Twin Fangs – Feast groups and Eternal Venom economy
5. Nek'zali – intermission corpse cleanup / Mythic well
6. Ula'tek – Toxic Incubation and Bite pairs after live validation
7. The Lost Explorers – Frostfire and fish state machine
8. Vashnik – infection-package and wave-aim modules
9. Nymrissa – optional orb scheduler quick win

## 1. Nek'zali the Soulcoiler

**Encounter model:** Phase 1 to 50% health, two-Echo intermission, then a 0-to-100-energy burn phase.

**Core abilities / encounter rules**
- Soulcoil Well / Soulcoil Rite: adds or players fed to the well trigger raid damage and boss energy; 100 energy is the hard failure/enrage.
- Soulcoil Ignition: four scripted Rite pulses plus Anguished Echo impact circles.
- Essence Rend: pull/knock plus a 15-second essence; expiry or dispel leaves a Latent Cultist hazard.
- Restless Amani: shielded adds march from active coffins toward the well; shield must be broken before control and kill.
- Possession Barrage: tank line whose raid damage falls with travel distance.
- Hollowing Strikes: stacking tank healing/absorb reduction.

**Heroic additions or tactical changes**
- Ritual Burn makes repeated Soulcoil Rites increasingly dangerous for 60 seconds.
- Dead Amani remain as Vessels of Awakening and can be reanimated in the intermission.
- Hungering Pyre soakers and Slithering Flame carriers can Cremate corpses within roughly 4 yards.

**Mythic additions or tactical changes**
- Grasping Depths places a Drowned Echo inside the well; assigned players enter, handle pulls/spirits, kill it, then exit with Soul Exhaustion.
- Soul Exhaustion heavily increases damage from the well/Immortal Coil, preventing repeated casual entries.
- Invoke interrupts active casts and briefly silences interrupted players while the Latent Cultist field repositions.

### Timeline model

| Trigger / anchor | Duration or interval | Result | Confidence |
|---|---:|---|:---:|
| boss_health <= 50% | event-driven | Intermission starts | A |
| Soul Transfer | 15 s | Move out before beam resolves | A |
| first Echo of Jawae dies | event-driven | Second Echo cadence begins/reset point | B |
| both Echoes die | event-driven | Phase 2; boss energy resets to 0 | B |
| boss_energy >= 100 | event-driven | Uncoiled Rage / failure | A |

### Raid plan

- Tank at the entrance/outer edge and point Possession Barrage away; keep its lane completely empty.
- Move Essence Rend drops to a preselected outer lane so Phase 2 Cultist movement does not cut the raid in half.
- Read glowing coffins, bring the boss toward the dense add side, pre-assign shield-break and crowd-control players.
- On Heroic, place Amani deaths deliberately and assign intermission corpse-clearing lanes to Pyre/Flame players.
- On Mythic, send a fixed well team in one wave; no second entry until Soul Exhaustion has expired.
- Use Bloodlust and remaining throughput in Phase 2; treat every add leak as both immediate damage and lost kill time.

### Lura modules

#### `nekzali_coffin_defense` — priority 6
- **Players:** 1-5 humans; bots fill raid
- **Length:** about 60 seconds
- **Goal:** Read active coffins, strip shields, control Amani, and prevent every well contact.
- **Success:** Zero Amani reach the well and all hazards are dropped in the assigned lane.
- **Failure:** Any leak, unsafe Essence Rend drop, or collision with Possession Barrage.
- **Metrics:** add acquisition latency, shield break time, leaks, hazard placement error

#### `nekzali_corpse_cleanup` — priority 4
- **Players:** 2-10 humans
- **Length:** about 55 seconds
- **Goal:** Coordinate Hungering Pyre soaks and Slithering Flame paths to erase assigned corpse clusters.
- **Success:** All required corpses are cleared before their reanimation window.
- **Failure:** Missed soak, unassigned corpse survives, Flame/Pyre overlaps a forbidden area.
- **Metrics:** corpse clear percentage, soak participation, route efficiency, friendly overlap

#### `nekzali_mythic_well` — priority 5
- **Players:** 2-6 humans
- **Length:** about 45 seconds
- **Goal:** Enter once, survive pull/spirits, kill the Drowned Echo, and exit through the safe sector.
- **Success:** Echo dies and every assigned player exits without a second Soul Exhaustion exposure.
- **Failure:** Early ejection, death inside, second entry, or exit through a coil.
- **Metrics:** entry synchronization, spirit hits, kill time, exit spread

### Source starting points

- https://www.wowhead.com/guide/midnight/raids/venomous-abyss-nekzali-the-soulcoiler-boss-strategy-abilities
- https://www.method.gg/guides/the-venomous-abyss/nekzali-the-soulcoiler-heroic
- https://raidstrats.gg/guides/nek-zali-the-soulcoiler/heroic
- https://www.youtube.com/watch?v=f2XUVOsDGJo

## 2. Entombed Sentinels

**Encounter model:** Two-boss split encounter; active phases alternate with a 100-energy Vitriolic Stasis puzzle.

**Core abilities / encounter rules**
- Ula'tek's Dominance: bosses close together gain near-total damage reduction; keep them separated.
- Mark of Acid / Mark of Blood: each side applies a stacking 40-second mark every 5 seconds.
- Vitriolic Stasis: at 100 energy both bosses become nearly immune for 30 seconds and the lower-health boss heals toward the higher one.
- Helical Toxins: players combine toxin values so the resulting green count is exactly four.

**Heroic additions or tactical changes**
- Breath side: Toxic Droplets explode after 16 seconds unless stepped on; Living Venom lines return after about 4 seconds.
- Blood side: Blighted Blood and Unstable Miasma create Blood Venom pools on expiry/dispels; pool size scales with stacks.
- Unstable Miasma is an 8-second group soak; tank debuffs force side swaps and careful pool placement.

**Mythic additions or tactical changes**
- Shifting Protovenom marks players during the active fight; matching Protovenom players must collide to neutralize it.
- Colliding with an unmarked or wrong target causes an eruption/knock, so pairing must happen without crossing other traffic.

### Timeline model

| Trigger / anchor | Duration or interval | Result | Confidence |
|---|---:|---|:---:|
| pull | event-driven | Bosses reportedly start around 50 energy on PTR; first active cycle is shorter | B |
| every 5 seconds while near a boss | event-driven | Acid/Blood mark application | A |
| boss_energy >= 100 | 30 s | Vitriolic Stasis | A |
| Vitriolic Stasis starts | 28 s | Helical Toxins matching window | A |
| Stasis ends | event-driven | Raid and tanks swap sides; old 40-second marks fall off | B |

### Raid plan

- Create two equal teams and keep bosses more than 40 yards apart; maintain health within a narrow agreed delta.
- Green team assigns every Toxic Droplet before it spawns and watches the outgoing and returning Living Venom paths.
- Red team starts at an edge, group-soaks Miasma, then moves together to place Blood Venom pools along a wall.
- At each Stasis, solve Helical pairs first, then reposition to the opposite boss before the active phase resumes.
- On Mythic, pre-assign Protovenom meeting lanes so pairs do not cross the center or clip unmarked players.

### Lura modules

#### `sentinels_helical_toxins` — priority 1
- **Players:** 2-20 humans; highly suitable for multiplayer
- **Length:** about 35 seconds
- **Goal:** Read the visible red/green composition and touch exactly one compatible partner.
- **Success:** All players neutralize to a total of four with no wrong collision before 28 seconds.
- **Failure:** Wrong partner, third-player collision, expiry, or leaving the assigned meeting sector.
- **Metrics:** solve time, wrong collisions, path crossings, pair-call accuracy

#### `sentinels_side_rotation` — priority 7
- **Players:** 4-20 humans
- **Length:** about 90 seconds
- **Goal:** Execute Green/Blood mechanics, preserve floor space, then swap sides on Stasis.
- **Success:** All droplets handled, every Miasma soaked, pools outside the central corridor, balanced boss health.
- **Failure:** Droplet detonation, missed soak, boss proximity, or health delta beyond configured threshold.
- **Metrics:** floor-space consumption, boss-health delta, unhandled objects, swap completion time

#### `sentinels_mythic_protovenom` — priority 2
- **Players:** 4-20 humans
- **Length:** about 50 seconds
- **Goal:** Match Protovenom partners while normal side mechanics remain active.
- **Success:** Every pair clears without contact with an unmarked player.
- **Failure:** Wrong collision, missed timer, or pair movement through a forbidden lane.
- **Metrics:** pair recognition time, collision count, route deviation, mechanic uptime lost

### Source starting points

- https://www.wowhead.com/guide/midnight/raids/venomous-abyss-entombed-sentinels-boss-strategy-abilities
- https://www.method.gg/guides/the-venomous-abyss/entombed-sentinels-heroic
- https://raidstrats.gg/guides/entombed-sentinels/heroic
- https://www.youtube.com/watch?v=jL-ekL__37k

## 3. Vashnik the Malignant

**Encounter model:** One repeating phase. At 100 energy Vashnik imbibes the two closest of three elemental fountains for a 90-second infusion package.

**Core abilities / encounter rules**
- Three fountains: Blood, Flame and Shadow. Boss position determines the two selected at Imbibe.
- Imbibe spawns fountain-specific Living Venom adds that move toward the centre; any leak triggers Malignant Burst.
- Blood add splits on death; Shadow add has a large absorb and launches impacts on death; Flame add has a raid aura and dangerous death burst.
- Dripping Fangs is the tank hit plus long physical-vulnerability debuff.

**Heroic additions or tactical changes**
- Malignant Catalyst creates mandatory Catalytic Bile soaks.
- Plague Froth expires into four cardinal Plague Waves.
- Flame add deaths apply a short stacking DoT, so kills should be staggered.
- Adaptive Infection changes with the selected infusions: Blood healing absorb/spread, Flame ordered dispel/explosion, Shadow healing absorb plus personal spread.

**Mythic additions or tactical changes**
- Imbibe creates Malignant Totems that apply stacking Malignance.
- Plague Waves must be aimed through assigned totem/tumour objects to remove them.
- Blood infection adds Thinned Blood, punishing repeated nearby exposure.
- Flame infection gains stacks every roughly 1.5 seconds, making the dispel order increasingly important.

### Timeline model

| Trigger / anchor | Duration or interval | Result | Confidence |
|---|---:|---|:---:|
| boss_energy >= 100 | event-driven | Imbibe the two closest fountains | A |
| Imbibe resolves | 90 s | Selected infusion package active | A |
| Flame add alive >= 60 seconds | event-driven | Hardened / severe add failure state | A |
| Plague Froth applied | 6 s | Cardinal waves on expiry | A/B |
| Mythic Flame infection active | every 1.5 s | Growing dispel danger | A |

### Raid plan

- Choose the desired fountain pair before pull and pin Vashnik at the geometric point that keeps those two closest.
- Assign fixed add lanes and control roles; no add may reach the centre.
- Assign every Catalyst impact to a named soaker or group, not ad-hoc volunteers.
- Use a fountain-pair-specific infection plan: spread/anti-repeat for Blood, staged dispels for Flame, spread plus absorb healing for Shadow.
- On Mythic, number the totems and Froth players; each cardinal wave is aimed through its assigned target while avoiding the raid.

### Lura modules

#### `vashnik_fountain_selection` — priority 12
- **Players:** 1-5 humans
- **Length:** about 45 seconds
- **Goal:** Position the boss so exactly the called fountain pair is selected.
- **Success:** Correct pair selected and add lanes remain clear.
- **Failure:** Wrong fountain pair or boss crosses the centre during the Imbibe lock.
- **Metrics:** position error, time in target zone, wrong-pair count

#### `vashnik_infection_packages` — priority 10
- **Players:** 4-20 humans
- **Length:** about 75 seconds
- **Goal:** Resolve a randomized pair of Blood/Flame/Shadow infection rules.
- **Success:** No spread, heal, or premature-dispel failure; all absorbs resolved.
- **Failure:** Forbidden proximity, unordered dispel, add heal, or unresolved absorb.
- **Metrics:** dispel order, minimum spacing, infection duration, boss/add healing caused

#### `vashnik_mythic_wave_aim` — priority 8
- **Players:** 4-20 humans
- **Length:** about 55 seconds
- **Goal:** Drop Froth and aim cardinal waves through the assigned totem without crossing allies.
- **Success:** All assigned objects destroyed and zero friendly wave hits.
- **Failure:** Wrong target, missed target, overlap, or wave through the raid.
- **Metrics:** angular error, objects cleared, friendly hits, drop-position accuracy

### Source starting points

- https://www.wowhead.com/guide/midnight/raids/venomous-abyss-vashnik-the-malignant-boss-strategy-abilities
- https://raidstrats.gg/guides/vashnik-the-malignant/heroic
- https://www.youtube.com/watch?v=zLUbSK83W7c

## 4. The Lost Explorers

**Encounter model:** Three-target council controlled by Mor'zahi. Fish from Gebbo's crates interrupts Final Ascension and changes which Tortollan is controlled.

**Core abilities / encounter rules**
- Disgusting Fish from Trader Gebbo's crates is fed to the currently controlled explorer to interrupt Mor'zahi's Final Ascension.
- Each explorer can be fed once; the possession order therefore drives the encounter state.
- Killing one explorer early causes severe escalation on the survivors; plan a near-simultaneous finish.

**Heroic additions or tactical changes**
- United Defense gives near-total damage reduction while all three explorers are within 30 yards; isolate the current kill target while keeping the other two together.
- Gebbo: crates must be stomped before Relic Rupture; mushroom bounces are used to survive the Blast Wave; Spreading Flames persists.
- Iku: Frostfire Volley creates opposing elemental patches/debuffs; the opposite element clears the player/ground state.
- Nama: Mighty Thud marks three players for sequential group soaks; Shell Spin projectiles stun.

**Mythic additions or tactical changes**
- Crate stomps add a raid-wide stacking bleed, turning fish retrieval into a planned healing and cooldown sequence.
- The state-machine and simultaneous-kill requirements remain, with tighter room and overlap pressure.

### Timeline model

| Trigger / anchor | Duration or interval | Result | Confidence |
|---|---:|---|:---:|
| Throw Junk / crate appears | 25 s | Retrieve fish before Relic Rupture | A |
| fish fed to controlled explorer | event-driven | Final Ascension interrupted; possession state advances | A |
| Mighty Thud | event-driven | Three marked sequential group soaks | A |
| one explorer dies while another remains | event-driven | Survivor escalation / soft or hard failure | A |

### Raid plan

- Select a possession/fish order and isolate that explorer more than 30 yards from the other two.
- Assign a crate team and a fish carrier; on Mythic, rotate raid cooldowns for each forced crate stomp.
- For Gebbo, pre-place mushroom bounce paths so the group can deliberately use the bounce for Explosive Surprise.
- For Iku, define two polarity lanes and never improvise which opposing patch clears which debuff.
- For Nama, use three named soak groups for Mighty Thud rather than a single moving stack.
- Stop damage at health checkpoints and execute a controlled near-simultaneous kill.

### Lura modules

#### `explorers_fish_state_machine` — priority 11
- **Players:** 2-10 humans
- **Length:** about 120 seconds
- **Goal:** Retrieve fish, identify the controlled explorer, feed the correct target, and maintain the planned possession order.
- **Success:** Every Final Ascension is interrupted and no fish is used on an invalid/previously fed explorer.
- **Failure:** Relic Rupture, wrong target, missed channel, or invalid state transition.
- **Metrics:** fish retrieval time, wrong-target attempts, channel margin, state-call accuracy

#### `explorers_frostfire_polarity` — priority 9
- **Players:** 2-20 humans
- **Length:** about 60 seconds
- **Goal:** Clear player debuffs and ground patches using the opposite element without causing an eruption.
- **Success:** All assigned states cleared and lanes remain usable.
- **Failure:** Same-element contact, wrong lane, or uncleared patch at timeout.
- **Metrics:** polarity errors, clear time, lane contamination, collisions

#### `explorers_mighty_thud` — priority 13
- **Players:** 4-20 humans
- **Length:** about 40 seconds
- **Goal:** Execute three ordered group soaks while Aftershock zones accumulate.
- **Success:** All three hits have sufficient soakers and no repeated forbidden exposure.
- **Failure:** Missed soak, late movement, or Aftershock contact.
- **Metrics:** soaker count per hit, arrival margin, repeat exposure, movement distance

### Source starting points

- https://www.wowhead.com/guide/midnight/raids/venomous-abyss-lost-explorers-boss-strategy-abilities
- https://raidstrats.gg/guides/the-lost-explorers/heroic
- https://www.youtube.com/watch?v=Bd81YKcWvCA

## 5. Sszorak

**Encounter model:** One repeating phase with a major Howling Maelstrom around the two-minute point and a Mythic raid-stack/charge check.

**Core abilities / encounter rules**
- Howling Maelstrom creates directional gales that push players; Sszorak digs in and takes increased damage during the roughly 25-second event.
- Apex Predator tank sequence combines Ravage, a multi-player Mutilate frontal soak, and Tempest hazards.
- Corroding Venom is the tank vulnerability baseline.

**Heroic additions or tactical changes**
- Venomous Surge marks players for distance-scaled explosions and creates Viscous Cysts.
- Viscous Cysts persist, burst/knock on contact or expiry, and can provide adhesion against the Maelstrom wind.
- Raging Crosswinds mark players, explode after about 8 seconds, and apply directional gusts; opposite gusts can cancel.

**Mythic additions or tactical changes**
- Serpent's Fury requires at least 14 players stacked within roughly 8 yards so Sszorak can consume rage with To the Slaughter before reaching 100.
- The resulting charge applies Virulence; its removal after about 5 seconds bursts and propagates to players hit, demanding planned spread/transfer control.

### Timeline model

| Trigger / anchor | Duration or interval | Result | Confidence |
|---|---:|---|:---:|
| approximately 02:00 PTR | 25 s | Howling Maelstrom; exact live start must be logged | B |
| Venomous Surge applied | 10 s | Distance explosion and cyst creation | A |
| Raging Crosswinds applied | 8 s | Explosion and directional knock/gust | A |
| Mythic rage approaches 100 | event-driven | 14-player Fury stack and To the Slaughter charge | A/B |
| Virulence applied | 5 s | Burst/propagation on removal | A |

### Raid plan

- Keep the centre and one windward path free of cysts; drop Surge far enough apart to preserve usable adhesion anchors.
- Assign opposite Crosswind symbols into fixed pairs and have each pair meet at a designated cancellation point.
- Call wind direction before Maelstrom; players choose either a safe lane or a deliberate cyst-adhesion route.
- Use a named Mutilate soak group and taunt timing for the Apex Predator sequence.
- On Mythic, predefine the 14-player stack, charge lane, and Virulence exit sectors; nobody crosses the propagation line.

### Lura modules

#### `sszorak_crosswind_vectors` — priority 3
- **Players:** 2-20 humans
- **Length:** about 55 seconds
- **Goal:** Identify directional gusts, pair opposites, and neutralize without knocking allies into hazards.
- **Success:** Every pair cancels and all players remain inside the safe arena.
- **Failure:** Same-direction pair, unpaired expiry, edge knock, or cyst collision.
- **Metrics:** pairing time, vector error, knock distance, hazard contacts

#### `sszorak_maelstrom` — priority 4
- **Players:** 1-20 humans
- **Length:** about 35 seconds
- **Goal:** Survive changing wind directions using movement and selected cyst adhesion.
- **Success:** No player leaves the arena or triggers an unassigned cyst.
- **Failure:** Edge loss, cyst detonation, or failure to reach the safe sector.
- **Metrics:** maximum displacement, recovery time, cyst usage, safe-lane occupancy

#### `sszorak_mythic_fury` — priority 2
- **Players:** 4-20 humans; bots can model the 14-player threshold
- **Length:** about 45 seconds
- **Goal:** Form the stack before rage caps, survive the charge, then resolve Virulence without uncontrolled spread.
- **Success:** Threshold met, charge lane clear, all Virulence transfers match assignment.
- **Failure:** Rage cap, insufficient stack, charge clipping, or unauthorized propagation.
- **Metrics:** stack completion time, players in charge lane, Virulence branch count, spread accuracy

### Source starting points

- https://www.wowhead.com/guide/midnight/raids/venomous-abyss-sszorak-boss-strategy-abilities
- https://raidstrats.gg/guides/sszorak/heroic
- https://www.youtube.com/watch?v=CgUE_QLAQZ4

## 6. The Twin Fangs

**Encounter model:** Three active cycles separated by two Submerges; PTR sources place the final enrage near 8:05.

**Core abilities / encounter rules**
- Vexhul and Ithraz share an Eternal Venom economy; repeated applications become lethal at the journal threshold.
- Vexhul: Caustic Deluge on the tank creates Caustic Globules that must be intercepted before rupture.
- Ithraz: Ravenous Feast is three rapid group soaks; each hit consumes venom stacks and leaves an 8-second Feasted lockout, so use three groups.
- At 100 energy both submerge, reposition, leave slicks, then overlap Vile Flood with Sanguine Storm.
- If one Fang dies first, the survivor ramps rapidly with Uncoiled Wrath.

**Heroic additions or tactical changes**
- Coiling Ichor creates shrinking areas and Congealed Gore.
- Sanguine Storm adds persistent/short-lived gore hazards.
- Stone Breaker requires repeated small intercept soaks and applies stacking vulnerability.

**Mythic additions or tactical changes**
- Blood Torrent creates healing absorbs and Barbed Bulwarks around globules; assigned interrupts destroy the Bulwarks.
- Rouse the Brood adds Broodlings; interrupting their Visceral Burst forces retreat.
- Ravenous Feast creates Tainted Blood founts that must be completed before they cause Tainted Burst.
- A player dying with Eternal Venom can create additional globules, making deaths compound the encounter.

### Timeline model

| Trigger / anchor | Duration or interval | Result | Confidence |
|---|---:|---|:---:|
| Caustic Globule spawns | 10 s | Intercept before rupture | A |
| Ravenous Feast begins | event-driven | Three rapid soak hits; separate groups due to Feasted | A |
| Feast hit taken | 8 s | Feasted vulnerability/lockout | A |
| Coiling Ichor | 12 s | Shrinking area / gore creation | A |
| boss_energy >= 100 | event-driven | Submerge overlap: slicks, Vile Flood, Sanguine Storm | A |
| after second Submerge | event-driven | Third active cycle into centre enrage | B |
| approximately 08:05 PTR | event-driven | Final enrage; verify live | B |

### Raid plan

- Maintain a visible raid-wide Eternal Venom ledger and reserve low-stack players for globule intercepts.
- Pre-assign Feast groups A/B/C; each group takes exactly one of the three hits and immediately clears the centre.
- Assign Stone Breaker intercept order rather than allowing repeat volunteers to accumulate vulnerability.
- During Submerge, move as one group to the safe wedge between Flood and Storm while avoiding slicks.
- On Mythic, pair every Blood Torrent/Bulwark with an interrupt owner and assign Broodlings separately.
- Create explicit Tainted Blood fount teams and stop damage to equalize both bosses before the kill.

### Lura modules

#### `twin_fangs_venom_economy` — priority 5
- **Players:** 4-20 humans
- **Length:** about 80 seconds
- **Goal:** Assign globule intercepts dynamically based on current Eternal Venom stacks.
- **Success:** Every globule is intercepted and no player reaches the lethal stack threshold.
- **Failure:** Rupture, lethal stack, or two players intercepting the same globule.
- **Metrics:** assignment latency, maximum stacks, duplicate intercepts, missed globules

#### `twin_fangs_feast_rotation` — priority 3
- **Players:** 6-20 humans
- **Length:** about 35 seconds
- **Goal:** Execute three distinct Feast soaks and resolve Mythic founts.
- **Success:** Correct group on every hit, no Feasted repeat, every required fount completed.
- **Failure:** Repeat soaker, insufficient soak, or expired fount.
- **Metrics:** soaker roster accuracy, arrival margin, repeat exposure, fount completion time

#### `twin_fangs_submerge_geometry` — priority 6
- **Players:** 1-20 humans
- **Length:** about 45 seconds
- **Goal:** Identify and reach the safe wedge during the Flood/Storm/slick overlap.
- **Success:** All players reach the safe sector before both telegraphs resolve.
- **Failure:** Flood hit, Storm impact, slick contact, or edge knock.
- **Metrics:** safe-spot recognition time, path length, hazard contacts, group spread

### Source starting points

- https://www.wowhead.com/guide/midnight/raids/venomous-abyss-twin-fangs-boss-strategy-abilities
- https://raidstrats.gg/guides/the-twin-fangs/heroic
- https://www.youtube.com/watch?v=Q211gxmc43U
- https://www.youtube.com/watch?v=T5v5KSToMTg

## 7. The Coiled Altar

**Encounter model:** Zul'jan Phase 1, Malacrass Phase 2, a 35-second Claimed Vessel intermission, then both together in Phase 3.

**Core abilities / encounter rules**
- Phase 1 centres on Coalesced Venom globules, pickup/drop logistics, and tank Sever cleaves that can destroy objects.
- Guillotine is a group soak followed by Widow's Kiss, forcing the soak team to evacuate beyond roughly 40 yards.
- Phase 2 centres on Dreadmarch and Manifestations of Dread that behave like gaze-controlled 'weeping angel' ghosts.
- Soul Sever gives Gravebound; the target must collect ejected Soul Fragments before their roughly 10-second expiry.
- The 35-second intermission doubles damage taken by Zul'jan while Malacrass heals him; fragments reaching Zul'jan also heal.
- Phase 3 combines the two kits and requires a controlled dual kill.

**Heroic additions or tactical changes**
- Destroyed globules apply stacking Venom Rupture.
- Guillotine applies a large repeat-vulnerability, requiring rotating soak teams.
- Manifestations reaching their target can reapply Dreadmarch.
- Eternal Nightfall requires breaking a shield before interrupting the cast.

**Mythic additions or tactical changes**
- Virulent Cysts continuously expel globules and Virulent Mutations can chain-explode nearby globules.
- Guillotined/Grim Guillotine repeat-vulnerability is effectively permanent for the encounter.
- Only the fixated player can reliably see their Manifestation; refixates and collisions add complexity.
- Soulcoilers begin with a near-total Spirit Shield; Gloombomb hits remove it before Wail of Terror can be interrupted.
- Spirit Erasure from intercepting intermission fragments gives a stacking two-second damage-taken window.

### Timeline model

| Trigger / anchor | Duration or interval | Result | Confidence |
|---|---:|---|:---:|
| Fangs of the Coiled Altar | 8 s | Raid ticks and toxin generation | A |
| Soul Fragment ejected | 10 s | Collect before expiry | A |
| Gloombomb applied | 5 s | 15-yard explosion; aim through shielded Soulcoilers on Mythic | A |
| Phase 2 endpoint | 35 s | Claimed Vessel intermission | A |
| intermission fragment intercepted | 2 s | Spirit Erasure vulnerability stack | A |
| intermission ends | event-driven | Phase 3 combined kit; dual-health finish | A/B |

### Raid plan

- Create one globule drop stack and one tank-cleave lane; carriers move objects into the lane without causing chain ruptures.
- Rotate Guillotine teams and immediately send the active team beyond the 40-yard Widow's Kiss boundary.
- In Phase 2, stack ghosts at a designated point, have each fixated player face their own ghost, and route the tank's Soul Sever through the pile.
- Assign every Gravebound player a short shard route and a fallback collector call.
- On Mythic, place Gloombomb circles through the shielded Soulcoiler pack, then execute an interrupt rotation.
- During intermission, stagger fragment interceptions around the two-second vulnerability window while burning Zul'jan.
- In Phase 3, preserve both bosses within a small health delta and avoid killing one before the final synchronized call.

### Lura modules

#### `altar_globule_conveyor` — priority 3
- **Players:** 2-10 humans
- **Length:** about 75 seconds
- **Goal:** Pick up, route, and drop globules into a tank-cleave lane without chain reactions.
- **Success:** Required objects are cleared by Sever and no unintended rupture chain occurs.
- **Failure:** Carrier collision, mutation chain, unsafe recreation point, or missed Sever.
- **Metrics:** object-routing time, chain reactions, Sever clear count, carrier spacing

#### `altar_dreadmarch_ghosts` — priority 2
- **Players:** 2-20 humans
- **Length:** about 60 seconds
- **Goal:** Control gaze-based ghosts, stack them, and let the tank clear them without a fixation reaching its target.
- **Success:** All ghosts enter the cleanup lane and are hit by Soul Sever.
- **Failure:** Ghost reaches target, wrong-facing movement, collision, or tank cleave misses the pack.
- **Metrics:** gaze uptime, ghost stack radius, refixation response, cleave efficiency

#### `altar_mythic_gloombomb` — priority 4
- **Players:** 4-20 humans
- **Length:** about 50 seconds
- **Goal:** Aim Gloombombs through the correct Soulcoiler shields and interrupt every exposed Wail.
- **Success:** All shields broken and casts interrupted.
- **Failure:** Bomb misses, bomb clips raid, shield survives, or Wail completes.
- **Metrics:** bomb alignment, shield break count, interrupt latency, friendly hits

#### `altar_claimed_vessel` — priority 7
- **Players:** 4-20 humans
- **Length:** about 35 seconds
- **Goal:** Intercept healing fragments without overlapping dangerous vulnerability stacks while maximizing boss damage.
- **Success:** No fragment reaches Zul'jan and configured damage target is met.
- **Failure:** Fragment heal, excessive simultaneous Erasure stacks, or missed damage threshold.
- **Metrics:** fragments intercepted, stack overlap, damage-window usage, boss healing prevented

### Source starting points

- https://www.wowhead.com/guide/midnight/raids/venomous-abyss-coiled-altar-boss-strategy-abilities
- https://raidstrats.gg/guides/the-coiled-altar/heroic
- https://www.youtube.com/watch?v=Pob2JMFlQH8

## 8. Ula'tek

**Encounter model:** Three phases with an intermission between the last two. The final boss was not publicly available for raid testing, so only journal constants are trustworthy before launch.

**Core abilities / encounter rules**
- Caustic Waves cross the platform; any wave touching an egg immediately hatches it.
- Accidental Blightscale hatches create Vipers and add Putrid Membrane raid pressure.
- Spectral Coils are raid split-soaks; Heroic Soul Constrictor prevents the same players from mitigating the next set.
- Rage of the Shackled lasts about 20 seconds and exposes the Venomous Heart for a 20-second, +200% damage window.
- Phase 2 uses Doomscale Eggs, Doomscale Wardens, Mass Gestation and synchronized Weakened Doomscale kills.
- Phase 3 destroys usable platform with Circling Prey and combines add waves with Serpent's Bite pair-cleanses.

**Heroic additions or tactical changes**
- Blightscale Rawlings gain Poisonous Bite; Vipers use Acidic Burst and Petrifying Sting.
- Mass Gestation can begin a side-wide egg/Spawn timer.
- Soul Constrictor forces rotating Spectral Coil groups.
- Serpent's Bite lasts around 15 seconds; a nearby partner leeches it, then carries a roughly 5-second Volatile Purge explosion.

**Mythic additions or tactical changes**
- Eggs gain a Hardened shield and cannot be moved until broken; carriers must remain separated and receive Rancid Yolk after removal.
- Toxic Womb creates a Wretch; Toxic Incubation fires four one-second venom ticks that players intercept, each producing Caustic Waves.
- Unintercepted Incubation grants Mother's Boon to the Wretch; intercepted ticks stack Toxic Burn on players.
- Rawlings/Wretches/Shriekers reach Boiling Venom after about 25-30 seconds and become urgent.
- When one Weakened Doomscale dies, its clutchmate gains Revenge, demanding an even tighter synchronized kill.

### Timeline model

| Trigger / anchor | Duration or interval | Result | Confidence |
|---|---:|---|:---:|
| Blightscale Wretch spawns | 20 s | Wretch wakes | A |
| Toxic Incubation starts | 4 s, every 1 s | Four interceptable ticks; each emits Caustic Waves | A |
| Blightscale Rawling alive | 25 s | Boiling Venom | A |
| Wretch/Shrieker alive | 30 s | Boiling Venom | A |
| Doomscale Egg disturbed | 20 s | Hatch; early disruption creates Weakened Doomscale | A |
| Rage of the Shackled | 20 s | Raid event followed by Venomous Heart vulnerability | A |
| Venomous Heart exposed | 20 s | +200% damage taken | A |
| Serpent's Bite applied | 15 s | Partner leech before Calcified Corpse | A |
| Bite leeched | 5 s | Volatile Purge spacing window | A |
| Circling Prey | event-driven | Platform segment is destroyed; current spell data contains several cast variants, so do not freeze one live timer yet | C |

### Raid plan

- Treat eggs as a logistics board: mark safe parking cells, wave lanes, carriers, and the maximum acceptable hatch debt.
- Rotate Spectral Coil groups because Soul Constrictor blocks repeat mitigation.
- On Mythic, use a four-tick Toxic Incubation interceptor rotation and orient every intercepted wave away from all eggs.
- In Phase 2, kill/move Wardens before touching protected eggs; trigger Mass Gestation one side at a time.
- Bring paired Weakened Doomscales to matched health and execute a synchronized kill before Revenge can snowball.
- In Phase 3, pair every Serpent's Bite target with a cleanser; cleanser immediately exits seven yards for Volatile Purge.
- Do not build a full fixed timeline until live logs exist; implement every phase as a state graph with configurable health/energy triggers.

### Lura modules

#### `ulatek_egg_logistics` — priority 8
- **Players:** 2-20 humans
- **Length:** about 90 seconds
- **Goal:** Move eggs through changing wave lanes while preserving carrier spacing and minimizing hatches.
- **Success:** All required eggs reach safe cells/deposit points and hatch debt stays below the scenario limit.
- **Failure:** Wave touches protected egg, carrier proximity splash, wrong-side Mass Gestation, or unsafe drop.
- **Metrics:** eggs moved, accidental hatches, carrier proximity violations, safe-cell accuracy

#### `ulatek_toxic_incubation` — priority 5
- **Players:** 4-20 humans
- **Length:** about 45 seconds
- **Goal:** Intercept four sequential ticks with the assigned rotation and aim the resulting waves away from eggs.
- **Success:** All four ticks intercepted, Wretch gains no Mother's Boon, no egg is hatched.
- **Failure:** Missed tick, repeated player beyond stack budget, or Caustic Wave hits an egg.
- **Metrics:** tick ownership, intercept timing, Toxic Burn stacks, wave angular error

#### `ulatek_doomscale_pair` — priority 9
- **Players:** 4-20 humans
- **Length:** about 75 seconds
- **Goal:** Manage Wardens and Mass Gestation, then equalize and kill the Doomscale pair together.
- **Success:** Both Doomscales die inside the configured synchronization window.
- **Failure:** Dread Roar, clutchmate Revenge beyond tolerance, or uncontrolled hatch wave.
- **Metrics:** health delta, kill-time delta, Warden uptime, hatch count

#### `ulatek_serpents_bite_pairs` — priority 6
- **Players:** 4-20 humans
- **Length:** about 55 seconds
- **Goal:** Pair-cleanse every Bite and move each cleanser out for Volatile Purge while Circling Prey removes space.
- **Success:** Every Bite is leeched and every Purge explodes clear of allies.
- **Failure:** Calcified Corpse, wrong partner, Purge overlap, or falling into a destroyed platform sector.
- **Metrics:** pair time, Purge clearance, platform awareness, wrong-pair attempts

### Source starting points

- https://www.wowhead.com/guide/midnight/raids/venomous-abyss-ulatek-boss-strategy-abilities
- https://www.youtube.com/watch?v=W2zNL31Ly-A

## 9. Nymrissa Wavecaller
*Tidebound Grotto Lair (separate from the eight-boss raid)*

**Encounter model:** One repeating phase; flexible Mythic. A useful optional Lura quick win rather than a main-raid progression module.

**Core abilities / encounter rules**
- Alluring Bubble lures Bubblefin Shorerunners; murlocs reaching it become Berserkers that pulse raid damage every three seconds.
- Swirling Whirlpools travel toward the bubble and damage players in their paths.
- Chilling Frost ticks every 1.5 seconds for six seconds and leaves Frost Orbs plus slippery Lingering Frost.
- Abyssal Rain is a four-second raid channel; Unending Tides is the catastrophic end state.

**Heroic additions or tactical changes**
- Untouched Frost Orbs Shatter, causing raid damage and a stacking 30-second DoT.
- Abyssal Rain grants stacking Wavecaller's Might, increasing future Frost damage.

**Mythic additions or tactical changes**
- Bubblefin Frostscales give nearby murlocs a 99% Waterfog Shield, creating a strict priority/positioning target.
- Touching a Frost Orb causes a raid-wide Frost Burst; orb clears must therefore be scheduled rather than mass-soaked.
- Water Jet replaces the normal tank sequence, applies a stacking 40-second vulnerability, pushes the tank, and can wash away Lingering Frost.

### Timeline model

| Trigger / anchor | Duration or interval | Result | Confidence |
|---|---:|---|:---:|
| Chilling Frost applied | 6 s, every 1.5 s | Four Frost Orb drops per target | A |
| Frost Orb touched | 16 s | Stacking orb vulnerability/DoT and Lingering Frost | A |
| Frost Orb left untouched on Heroic/Mythic | 30 s | Shatter raid DoT | A |
| Abyssal Rain | 4 s | Raid healing event; Heroic+ grants Wavecaller's Might | A |
| Water Jet stack applied | 40 s | Mythic tank vulnerability; use jet path for frost cleanup | A |

### Raid plan

- Assign add lanes and kill Shorerunners before they reach the bubble; on Mythic, isolate/kill Frostscales before shielded packs.
- Drop Chilling Frost orbs in compact rows, then clear them one at a time on a raid-cooldown schedule.
- Route Mythic Water Jet through Lingering Frost while keeping its push line away from the raid.
- Keep whirlpool lanes clear and prepare for the bubble Pop knock.
- Use Wavecaller's Might stacks as the soft-enrage timeline rather than relying on a pre-release absolute kill time.

### Lura modules

#### `nymrissa_orb_scheduler` — priority 10
- **Players:** 2-20 humans
- **Length:** about 70 seconds
- **Goal:** Lay out Frost Orbs cleanly and clear them in a staggered assigned order.
- **Success:** No Shatter and no two Mythic Frost Bursts occur inside the configured healing lockout.
- **Failure:** Orb Shatter, duplicate clear, uncontrolled chain clear, or frost lane blocks the arena.
- **Metrics:** orb spacing, clear interval, Shatters, overlapping Bursts

#### `nymrissa_murloc_lanes` — priority 14
- **Players:** 1-10 humans
- **Length:** about 60 seconds
- **Goal:** Prioritize Frostscales and stop Shorerunners before the bubble.
- **Success:** No Berserker transformation and all shield networks are broken in time.
- **Failure:** Murloc reaches bubble or protected pack survives the timer.
- **Metrics:** target-priority accuracy, lane leaks, shield uptime, time to first intercept

### Source starting points

- https://www.wowhead.com/guide/midnight/nymrissa-wavecaller-tidebound-grotto-lair-boss-strategy-rewards
- https://www.youtube.com/watch?v=ROFGW7s8MN8
- https://www.youtube.com/watch?v=TwlnCNFcl0c

## Live-week timeline capture

For exact timelines, collect a small clean-pull sample after the European reset on 19 August. Use Warcraft Logs cast starts, aura applications/removals, summons, deaths and energy changes; normalize them both to pull time and to phase/state starts. Store the median and observed jitter rather than a single number. Health-push-dependent casts should become explicit branches, and every hotfix should create a new timing-profile version.

Suggested profile names:

- `ptr_2026_07`
- `live_eu_week1_2026-08-19`
- `live_eu_week2_hotfix_2026-08-26`

## Global source index

- Blizzard raid release article: https://news.blizzard.com/en-us/article/24294062/curse-of-ulatek-the-venomous-abyss-raid-goes-live-august-18
- Blizzard EU Season 2 date: https://news.blizzard.com/en-gb/article/24294369/the-shadows-deepen-midnight-season-2-begins-august-18
- Blizzard PTR schedule: https://us.forums.blizzard.com/en/wow/t/the-venomous-abyss-raid-testing-schedule/2317466
- Wowhead raid overview: https://www.wowhead.com/guide/midnight/raids/the-venomous-abyss-overview-location-rewards-bosses
- Warcraft Logs PTR/live zone: https://www.warcraftlogs.com/zone/rankings/54
- Ready Check Pull all-boss preview: https://www.youtube.com/watch?v=W2zNL31Ly-A
- Kalamazi testing playlist: https://www.youtube.com/playlist?list=PLRaKX9snqZlqpI4Wgw6SEvSFwpsSwVNTP

## Known uncertainties to validate immediately on live

- Exact pull-relative casts and overlap windows for every boss.
- Ula'tek phase-health triggers, Circling Prey cast variant, arena destruction order and final Mythic overlaps.
- Twin Fangs' displayed Eternal Venom lethal threshold wording and any live tuning of the three-cycle enrage.
- Vashnik's Mythic totem/tumour naming and the exact Plague Wave object-destruction behaviour.
- Which Heroic/Mythic mechanics boss mods expose through stable spell IDs after launch.
