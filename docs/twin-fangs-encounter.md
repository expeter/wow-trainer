# The Twin Fangs canonical encounter contract

Ticket: `FR-095`

This is the authoritative trainer contract for the current pre-live package.
It condenses the maintained research into one testable full-fight sequence in
Learn 2D and Train 3D.

## Evidence and confidence

- The mechanic handoff is
  [`encounter-specs/the-twin-fangs-wow-trainer-spec.md`](encounter-specs/the-twin-fangs-wow-trainer-spec.md).
- The supplied [`the-twin-fangs.png`](../inbox/the-twin-fangs.png) establishes
  the triangular ring and central void for Learn 2D. It does not establish
  dimensions, collision coordinates, or timings.
- Train 3D independently code-renders the ring and treats both its outer edge
  and central void as authoritative movement boundaries.

## Full-fight contract

- Eternal Venom is persistent encounter state. Avoidable failures add stacks;
  assigned Ravenous Feast groups restore headroom; reaching nine is terminal.
- Caustic Deluge and Caustic Globule preserve the avoidable impact and assigned
  low-stack collection responsibilities. Barbed Bulwark requires the declared
  player Interrupt rather than an automatic NPC resolution.
- Stir the Depths exposes a safe wave gap. Corrosive Spit must be aimed away
  from the raid.
- Ravenous Feast uses ordered groups. Ithraz's Stone Breaker uses three
  sequential soaks and a recovery push before the boss swap.
- Submerge requires movement around the triangular ring without crossing the
  central void. Vexhul and Ithraz share the displayed completion pacing so the
  trainer does not reward an unsupported early kill.

## Runtime boundary

One headless simulation owns venom, actions, movement, ring collision,
knockback elevation, failures, and outcome. The image is used only as the
contained Learn 2D plan; it is never painted onto the 3D floor.
