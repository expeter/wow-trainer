# Vash'nik the Malignant provisional encounter contract

Ticket: `FR-085`

This is an accepted implementation brief, not yet an authoritative mechanic
specification. Vash'nik begins only after the current full-fight correction is
stable. The supplied encounter mechanics remain fixed; Test, Easy, Normal, and
Hard remain trainer-assistance profiles rather than raid difficulties.

## Evidence and confidence

- The supplied arena reference and short note are
  [`INBOX-20260815-133633-4706bd`](../inbox/INBOX-20260815-133633-4706bd.md).
- The image shows an asymmetric room with a large central green pool and three
  colored well lanes: Fire, Shadow, and Blood. It is approved as the contained
  Learn 2D raid-plan background and as visual evidence for a code-rendered 3D
  interpretation.
- The rules below come from the user's video review on 2026-08-15. Exact spell
  names, counts, ranges, cadence, and tank-hit behavior
  still require reconciliation with current authoritative encounter material.

## Arena, wells, and encounter loop

- Vash'nik absorbs the two wells closest to the boss. Tanks position the boss
  to train the ordered pair sequence Fire–Shadow, Shadow–Blood, Blood–Fire.
- A tank hit requires an aggro swap. The final contract must identify the spell,
  debuff duration, and swap threshold before implementation.
- Well activations spawn distinct add packages. Adds moving into the central
  poison pool are a terminal failure; the controlled player target-switches and
  kills assigned adds while NPCs cover the remainder.
- Boss positioning, current well pair, aggro, target priority, and add routes
  belong to the shared headless simulation. Learn 2D and Train 3D project that
  state into separate arena models.

## Fire package

- Two large Fire adds spawn. Their deaths give nearby players large red damage
  zones that should be carried away from the raid; large blobs split into two
  smaller adds on death.
- Two players receive an effect that prevents direct healing. A small red help
  circle allows nearby allies to be leeched to sustain the affected player, so
  the reaction is to gather helpers without overlapping unrelated hazards.

## Shadow package

- Five Shadow adds spawn. Their deaths release small purple projectiles along
  varying paths; players avoid their visible ground-impact lanes or zones.
- A random player receives a heal-removal debuff. Healers must restore the
  required health to clear it. Removal leaves a void zone at that player's
  current position, so the target carries it toward an outer lane first.

## Blood and central-pool package

- Vash'nik fires an orb into the central pool and creates five green ground
  circles that the raid must soak.
- Approximately six players receive small green circles with directional cross
  indicators. After three seconds each emits a poison wave along the indicated
  direction until it reaches the arena wall. Players spread and aim so waves do
  not strike other players; the waves remain slow enough to read and avoid.
- Green untargetable enemies appear around the room and can only be killed by
  those poison waves. The player's assignment requires aiming through at least
  one enemy; the projected trajectory highlights valid targets before release,
  while NPCs cover the remaining enemies.

## Required validation before implementation

- Confirm the canonical well names/colors and exactly which two are active in
  each positioning step.
- Confirm add counts, splitting rules, central-pool leak behavior, and whether
  the same add family is shared between well combinations.
- Confirm Fire leech and Shadow heal-removal success/failure thresholds.
- Confirm soak count, poison-wave target count/speed/width, collision rules,
  and the target-highlight behavior that is trainer coaching rather than raid
  truth.
- Confirm the tank-hit spell and swap cadence. Unsupported values must remain
  replaceable timing-profile data, never hidden constants.
