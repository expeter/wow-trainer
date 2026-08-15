# The Lost Explorers provisional encounter contract

Ticket: `FR-086`

This is an accepted implementation brief, not yet an authoritative mechanic
specification. The encounter begins only after the preceding approved Vash'nik
package is stable. The supplied encounter mechanics remain fixed; Test, Easy,
Normal, and Hard remain trainer-assistance profiles rather than raid
difficulties.

## Evidence and confidence

- The supplied arena reference and short note are
  [`INBOX-20260815-135414-bba2f7`](../inbox/INBOX-20260815-135414-bba2f7.md).
- The image shows a large octagonal room, a central focal marking, broad
  cardinal lanes, and ample outer routing space. It is approved as the
  contained Learn 2D raid-plan background and as visual evidence for a
  code-rendered Train 3D interpretation.
- The rules below come from the user's video review on 2026-08-15. Boss and
  spell-name spelling, exact counts, ranges, cast cadence, effect ownership,
  dispel type, and encounter cadence require reconciliation with current
  authoritative encounter material before implementation.

## Shared three-boss contract

- Simulate three targetable turtle bosses: Ikku, Namaa, and Gebbo. Their health
  should be brought down together, preferably killing Gebbo last; the exact
  penalty for uneven or early deaths still requires evidence.
- Gebbo roams the room. Tanks route Ikku and Namaa so all three bosses never
  converge at one location and avoid colliding with the roaming boss.
- The central ghost Morzahi is untargetable, creates small avoidable ground
  circles, and gains energy. Full energy is a terminal failure.
- Thrown boxes telegraph a harmful landing circle before becoming collectible.
  Some contain Fish and grant one encounter extra action. A player may safely
  collect only one box before a deadly pickup debuff prevents another.
- Fish is thrown at a targetable boss to stop or reduce Morzahi's energy gain.
  The same boss cannot receive Fish again immediately, producing a rotating
  one–two–three target order. The exact lockout and energy effect belong in a
  replaceable timing profile.

## Gebbo package

- Gebbo throws the boxes and continues roaming independently of the two held
  bosses.
- A mushroom appears on a random non-tank player. The target carries it away
  from the raid, waits for its readable activation window, then uses its upward
  launch to cross an incoming fire wave.
- A separate random player carries a bomb/fire-wave placement responsibility
  away from the raid. While the bomb is airborne, that player returns toward
  the group; everyone avoids the large landing impact. The resulting wave and
  mushroom launch form one coordinated traversal sequence.
- The bomb leaves a harmful lava pool that visibly shrinks over time rather
  than remaining for the complete encounter.
- The precise ordering and ownership of bomb targeting, wave origin, mushroom
  activation, and safe crossing must be confirmed before simulation timing is
  fixed.

## Ikku package

- Ikku performs a regular interruptible cast throughout the fight. The trainer
  may assign the controlled player approximately every 45 seconds only as a
  replaceable provisional cadence. The interrupter receives a follow-up effect
  that a healer must dispel.
- A lightning-marked player separates far from the raid so the effect does not
  connect to or strike the group.
- A multi-hit tank cast currently observed as approximately seven splinters
  stacks a debuff on Ikku's active tank. Its swap threshold and interaction
  with other tank mechanics require authoritative confirmation.
- Four players receive an Ice effect and four different players receive a Lava
  effect. Both groups spread so their explosions do not hit other marked or
  unmarked players. Each survivor then uses one of the resulting ground areas
  to clear the retained elemental debuff. Which element clears which state and
  how long the areas persist remain validation gaps.

## Namaa package

- Namaa briefly launches three turtle-shaped projectiles outward. Players
  dodge their lanes; contact stuns the controlled player for three seconds.
- Namaa stacks a tank debuff. At 20 stacks the other tank takes aggro.
- Namaa marks three players for sequential impacts with enough warning to form
  three nearby but non-overlapping groups. Each impact requires its target and
  at least five helpers.
- A player assigned as a helper enters only their designated impact. A marked
  player receives their own group while avoiding the other two impact zones.
- Each resolved impact leaves a harmful ground zone for 30 seconds. Arena
  routing must reserve enough space for all three residues without changing
  their authoritative duration merely to simplify the trainer.

## Runtime and validation boundaries

- One shared headless simulation owns boss health, aggro, boss positions,
  Morzahi energy, box contents/pickup lockout, Fish target lockout, hazards,
  assignments, stacks, interrupts, dispels, stuns, soaks, and outcomes.
- Learn 2D and Train 3D consume those events through separate octagonal arena
  models. The bitmap is not used as a 3D floor texture.
- NPCs resolve mechanics outside the controlled player's assignment, but the
  controlled player's assigned Fish, interrupt, dispel, tank swap, movement,
  elemental clear, or soak remains player-owned and cannot be silently covered.
- Before implementation, confirm canonical names/spelling, encounter phase
  structure, simultaneous-kill rule, Fish/Morzahi relationship, box pickup
  debuff, bomb-wave-mushroom sequence, Ikku cast and cleanse rules, Namaa tank
  stacks, soak size/count, and every timing currently described as provisional.
