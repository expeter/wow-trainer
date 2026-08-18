# Sszorak canonical encounter contract

Ticket: `FR-094`

This is the authoritative trainer contract for the current pre-live package.
Trainer difficulty changes assistance and failure tolerance only; Learn 2D and
Train 3D keep their own schedules without changing mechanic meaning or order.

## Evidence and confidence

- The maintained research handoff is
  [`encounter-specs/sszorak-wow-trainer-spec.md`](encounter-specs/sszorak-wow-trainer-spec.md).
- Spell relationships and reaction windows are based on the 2026-08-16 PTR
  guide and spell data. Exact recurrence remains medium-confidence and belongs
  to the replaceable pre-live timing profile.
- No supplied arena bitmap exists. Both projections therefore use a restrained
  code-rendered circular wind platform and do not invent decorative landmarks.

## Full-fight contract

- Apex Predator contains five reads. Every pull has one Tempest and a changing
  deterministic order of Ravage and alternating-group Mutilate attacks.
- Serpent's Fury requires the late marked stack followed immediately by the
  Virulence spread.
- Venomous Surge creates four ordered Viscous Cysts at outer anchors. Cysts are
  encounter state, not decorative effects.
- Raging Crosswinds requires the controlled player to meet the assigned paired
  trajectory before the knock resolves.
- Howling Maelstrom consumes the first three prepared anchors in order for its
  three counter-knocks; the fourth cyst remains the next-cycle preparation.

## Runtime boundary

One headless simulation owns movement, circular collision, cyst state,
knockback elevation, step success, failures, and terminal outcome. Learn 2D is
planar; Train 3D uses shared vertical motion for encounter-authored knockbacks.
Rendering never decides whether a responsibility succeeded.
