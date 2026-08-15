# Product direction

## Goal

Build a reusable Midnight Season 2 raid-training platform that helps players
understand encounters before progression and practice the movement,
assignments, role actions, and situational awareness that are difficult to
learn from a written guide or video alone.

The platform should favor selected high-value mechanics over visually complete
but educationally weak boss replicas. Every implemented mechanic must answer
one of these questions:

- What must the player notice?
- Which assignment applies to them?
- Where or when must they move?
- Which encounter action must they use?
- What mistake occurred, and how should they correct it?

## Evidence from the L’ura trainer

The August 2026 guild survey contained 22 responses. Sixteen respondents said
they used the trainer; five said they did not, and one response did not answer
that question. Among the answered usefulness responses, five reported that it
helped clearly, ten that it helped somewhat, and two that it did not help.
Eighteen respondents expected to use a future trainer, two would use one for
selected difficult mechanics, and two did not want one.

The strongest positive theme was spatial learning: positioning, movement paths
and minimizing unnecessary movement became easier to remember. The recurring
friction themes were:

- Camera behavior and controls did not feel close enough to the game.
- Some players wanted a fixed top-down or Pineapple-style presentation.
- NPC-caused Hard-mode wipes felt unfair and demotivating.
- Tank players could not practice the actual role-specific responsibilities.
- Generic potion, shield, or damage-button simulation distracted from the
  encounter lesson.
- A trainer is most valuable before the guild’s first pull, not late in
  progression.
- Some players will use a trainer only for mechanics that genuinely benefit
  from interactive practice.

These are product requirements, not requests to reproduce every suggestion
literally.

## Two game modes

### Learn 2D

Learn 2D is a simplified teaching mode. It may use diagrams, abstract lanes,
cards, icons, arrows, short animations, click decisions, and lightweight
movement. It explains the encounter and rehearses the selected role’s decision
sequence.

Learn 2D does not promise exact world distances, collision fidelity, camera
practice, tactical coordinates, or a one-to-one representation of Train 3D.
It shares semantic data such as ability IDs, phase names, role names, timing
provenance, tactic labels, and reporting reason codes.

### Train 3D

Train 3D is the positional practice mode. It owns exact arena geometry,
movement, facing, telegraphs, collisions, player assignments, bot movement,
role actions, success/failure resolution, and positional metrics.

Its input should feel familiar to a WoW player: WASD, keyboard turning,
mouse-look, wheel zoom, both mouse buttons to move forward, configurable
inversion, and rebindable encounter actions.

## Shared product shell

The two modes share one application shell:

- Boss catalogue and availability state.
- Mode, scenario, difficulty, arena/start point, tactic, role, and controlled
  player selection.
- Game settings, Keys & Mouse, HUD, Tactical plan, Statistics, and Profile
  panels. Statistics and Profile may remain visibly deferred initially.
- Version/build indicator, update notification, changelog and issue link.
- Persistent controls, audio channels, accessibility preferences, and HUD
  layout.
- Tactical plan save/load/import/export and built-in guild presets.
- Result/failure presentation and eventual API reporting.

Mode-specific controls appear only when relevant. A 2D user should not see a
camera-inversion setting as part of the active lesson, while their global
preference remains saved for Train 3D.

## Initial scope

- One controlled human player; deterministic bots fill required raid slots.
- Focused mechanic modules and a composed full-fight scenario for each shipped
  boss.
- Encounter-provided actions such as interrupt, taunt/swap, claim, soak, dispel
  request, vehicle, or extra-action button.
- Versioned PTR/live/hotfix timing profiles with visible provenance.
- Visual tactic editor from the first reference encounter.
- Entombed Sentinels as the reference package, starting with Helical Toxins.

## Deferred scope

- Online multiplayer and lobbies.
- Class/spec rotations, damage simulation, healing simulation, and complete
  class toolkits.
- Generic movement cooldowns.
- Competitive points, achievements, accepted-run leaderboards, and rank
  rewards.
- Replay heatmaps and detailed personal analytics.
- Exact anonymous-person counts; anonymous statistics can count attempts,
  sessions, or device estimates only.

## Content order

After the Sentinels reference package stabilizes the authoring contract, use
the researched value order:

1. Sszorak: Crosswinds and Mythic Fury/Virulence.
2. The Coiled Altar: Dreadmarch ghosts and globule routing.
3. The Twin Fangs: Feast groups and Eternal Venom economy.
4. Nek’zali: corpse cleanup and the Mythic well.
5. Ula’tek: Toxic Incubation and Bite pairs after live validation.
6. The Lost Explorers: Frostfire and fish state machine.
7. Vashnik: infection packages and wave aiming.
8. Nymrissa: optional orb-scheduler quick win.

Each boss must justify its Learn 2D and Train 3D content independently. A mode
may explicitly omit a mechanic when it adds no useful lesson in that mode.
