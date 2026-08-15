# Entombed Sentinels package

This is the sole architecture-reference encounter for `EncounterPackageV1`.
It contains validated shared facts, the `ptr_2026-08-13` timing profile, tactic
declarations, an abstract Learn 2D arena, an independent Train 3D world arena,
and package-owned lazy runtime loaders.

One complete full-fight scenario is ready in each runtime. Learn 2D projects
the encounter onto the supplied tactical image; Train 3D uses a headless
fixed-step mechanic model and an independent yard-space arena. Helical Toxins
and Shifting Protovenom are both part of that single mechanics contract.

Movement bindings, the healer Dispel binding, and HUD visibility/scale are
supplied by the shell through the package runtime contract. The encounter does
not read global or legacy L'ura storage keys. Editable roster detail remains
open for the tactical-planner milestone.

All timings remain PTR-labelled. No live profile exists yet.

## FR-084 full-fight contract

- Learn 2D uses the supplied split-room image as a contained tactical backdrop;
  Train 3D uses an independent 180-by-70-yard interpretation with the two boss
  anchors 100 yards apart. Acid/green begins on the raid plan's right and
  Blood/red on its left; the wider projection keeps both outer anchors visible.
- Ula'tek's Dominance is active below the sourced 40-yard separation threshold
  and reduces both bosses' incoming damage by 99%. It is not an exact
  100-yard-position check.
- During active cycles, each boss applies its Acid or Blood mark every five
  seconds to players within 40 yards. The controlled player receives only the
  mark for their current side unless they incorrectly cross into the other
  aura.
- Acid-side players handle four Toxic Droplets. The controlled player owns one
  droplet only when assigned to Acid; reliable bots clear the others. A cleared
  droplet sends a readable Living Venom beam/projectile back to the Breath and
  its lane remains harmful. The current PTR-labelled trainer cadence gives the
  controlled player 18 seconds from droplet appearance to eruption and exposes
  that deadline in the HUD.
- Blood-side players group-soak Unstable Miasma. Every participant receives a
  short pool-drop aura and places Blood Venom after five training seconds. The
  journal's eight-second Miasma eruption and six-second Clinging Murk remain
  authoritative metadata; the five-second post-soak placement cadence is a
  tactic/profile assumption supplied for this trainer.
- Blighted Blood selects a Blood-side player. A controlled healer must use the
  encounter Dispel binding; other roles and the opposite side are not assigned
  that action.
- Both boss frames show ordinary health plus a yellow zero-to-100 energy bar.
  At 100 energy the bosses move to the centre for 30-second Vitriolic Stasis.
- Helical Toxins appear as four attached red/green icons. Compatible pairs
  combine to the exact-four composition; wrong or third-player contact fails.
  The raid swaps sides after Stasis and repeats the active cycle.
- Shifting Protovenom marks pairs during the active cycle. Marked
  red-circle partners collide with each other, touching an unmarked player
  fails, and unresolved Protovenom before Stasis is terminal outside Test.
  Test records that mistake and still enters Stasis so its non-wipe contract
  cannot trap the active phase at zero seconds. Learn 2D renders the extra
  compatible and incompatible partners declared by the simulation snapshot.
- Bots resolve off-side mechanics deterministically and cannot create an
  unexplained default-mode wipe.
- Learn 2D input is screen-relative: W/S/A/D always mean up/down/left/right on
  the raid plan, independent of actor facing. NPC side groups stay visibly
  inside the green/red playable areas and gather into NPC-owned soak circles;
  they never cover the controlled player's assigned mechanic.
