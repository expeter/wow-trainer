# The Coiled Altar canonical encounter contract

Ticket: `FR-096`

This is the authoritative trainer contract for the current pre-live package.
It preserves one causal sequence across separate Learn 2D and Train 3D arena
models while leaving uncertain recurrence configurable.

## Evidence and confidence

- The mechanic handoff is
  [`encounter-specs/coiled-altar-wow-trainer-spec.md`](encounter-specs/coiled-altar-wow-trainer-spec.md).
- The supplied [`the-coiled-altar.png`](../inbox/the-coiled-altar.png) establishes
  the rectangular platform, central seal, and side structures for Learn 2D. It
  does not establish exact world measurements or mechanic timing.
- Train 3D independently code-renders a bounded altar platform and never uses
  the supplied bitmap as a floor texture.

## Full-fight contract

- Zul'jan's stage opens in the Fangs safe region. Toxic Deluge creates a venom
  object; the assigned player collects and deposits it in a future cleanup
  lane, then leaves Sever while the frontal removes the prepared object.
- Guillotine is a group soak followed by immediate Widow's Kiss movement away
  from the epicenter.
- Malacrass applies Dreadmarch forced-movement recovery and creates a fixating
  Manifestation of Dread that must be kept away from contact and cleanup lines.
- During Soulbinding the controlled player must intercept the assigned fragment
  with the package-declared Main action. NPCs do not silently complete it.
- The Coiled Union stage combines both systems: Blighted Sever clears prepared
  venom and manifestations before the raid returns to the altar seal.

## Runtime boundary

One headless simulation owns venom-object count, actions, rectangular collision,
movement, failures, and outcome. Images and renderers project simulation state;
they do not decide collection, cleanup, fragment interception, or success.
