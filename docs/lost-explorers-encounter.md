# The Lost Explorers canonical encounter contract

Ticket: `FR-086`

This is the authoritative trainer contract for the current pre-live package.
Test, Easy, Normal, and Hard are assistance profiles and do not alter the
mechanics or either projection's schedule.

## Evidence and confidence

- The contained arena reference is
  [`INBOX-20260815-135414-bba2f7`](../inbox/INBOX-20260815-135414-bba2f7.md).
  It is the clipped Learn 2D background and visual evidence for the separate
  code-rendered Train 3D octagon; it is never a 3D floor texture.
- Names, spell relationships, radii, and mechanic ordering reconcile the
  user's 2026-08-15 video review with the 2026-08-16 pre-live guide and spell
  data. Exact recurrence remains medium-confidence and replaceable in
  `timing/projections.ts` pending live logs.
- Canonical trainer spelling is Iku, Gebbo, Nama, and Mor’zahi. Older Ikku,
  Namaa, or Morzahi notes are superseded.

## Shared three-boss contract

- Iku and Nama are tanked together while Gebbo roams. United Defense reduces
  incoming damage by 99% only when all three explorers are within 30 yards.
- Mor’zahi is untargetable and gains energy. At full energy, Final Ascension's
  five-second channel is terminal.
- Throw Junk lands crates in small harmful circles. Exactly one crate per
  cycle yields a Disgusting Fish. The controlled player's pickup and throw are
  player-owned.
- Feed exactly one eligible boss per cycle in the fixed Iku, Gebbo, Nama order.
  A successful feed starts that boss's Ultimate, resets Mor’zahi, and advances
  the cycle. The timing profile owns the configurable energy deadline and
  transition delay.
- Boss health advances together through the three cycles. The attempt succeeds
  only after all three Ultimates resolve; an unsupported early-kill rule is not
  invented.

## Iku Ultimate

- The assigned controlled player interrupts four-second Icebound Flames.
- Frostfire Volley marks Fire players outside and Frost players inside. Each
  spread creates a matching patch; survivors retain their element and clear it
  only by entering the opposite patch.
- NPCs resolve assignments not owned by the controlled player. The trainer
  never silently covers the controlled interrupt, spread, or cleanse.

## Gebbo Ultimate

- Explosive Surprise assigns a bomb to the opposite edge from a preserved
  mushroom. Its impact is harmful and leaves a shrinking lava pool.
- Blast Wave crosses the room after the placement. Contact is safe only while
  the simulation says the player is airborne.
- The mushroom applies an encounter-authored vertical launch when reached near
  the incoming wave. The same shared Train 3D vertical-motion state also
  accepts the player's Jump binding; the renderer does not infer clearance.

## Nama Ultimate

- Shell Spin sends three moving shell lanes through the room; contact stuns.
- Mighty Thud marks three sequential six-yard split-soak points. The controlled
  player resolves only their assigned group.
- Each Thud applies an authoritative radial and vertical knockback and leaves a
  30-second Aftershock zone. The player must recover without overlapping the
  remaining soaks or residues.

## Runtime and validation boundaries

- One headless simulation owns boss health and position, Mor’zahi energy,
  crates and fish, interrupts, elemental marks/patches, mushroom and bomb
  placement, airborne state, waves, shell lanes, soaks, knockback, residues,
  failures, and outcome.
- Learn 2D and Train 3D declare explicit separate schedules while preserving
  the same causal order, assignments, mechanic meanings, and outcomes.
- Learn 2D uses cardinal planar movement only. Train 3D owns elevation, gravity,
  grounded state, manual jump, and encounter launches through `FR-089`.
- Source confidence and configurable cadence are visible in package timing and
  the runtime evidence drawer. New live evidence updates the timing profile and
  focused regressions; mechanics are never changed merely to satisfy a test.
