# WoW movement and world-unit calibration

Train 3D treats one world unit as one in-game yard and advances authoritative
mechanics at 60 fixed steps per second.

## Baseline

The live client API `GetUnitSpeed(unit)` reports movement in yards per second.
The maintained API reference records normal running as `7 yd/s`, the
`BASE_MOVEMENT_SPEED` constant as `7`, and backwards movement as `4.5 yd/s`.

Sources:

- [WoW API: GetUnitSpeed](https://warcraft.wiki.gg/wiki/API_GetUnitSpeed)
- [WoW movement speed measurements](https://warcraft.wiki.gg/wiki/Movement_speed)
- [Mirrored current Blizzard UI source](https://github.com/Gethe/wow-ui-source)

The platform therefore uses:

| Motion | Trainer velocity |
| --- | ---: |
| Forward run | 7 yd/s |
| Strafe | 7 yd/s |
| Backward | 4.5 yd/s |
| Diagonal | capped at 7 yd/s |

Keyboard turning remains a trainer preference pending a reliable live-client
measurement. It is not used to infer encounter spell timing.

## Encounter use

Arena dimensions, actor coordinates, radii, travel distances, and projectile
speeds in Train 3D are yards. Cast times, warnings, cooldowns, and mechanic
windows remain seconds sourced from encounter evidence. Calibrated movement
does not make an unsourced spell radius or timer authentic; each encounter
package must record that provenance separately.

The development contract arena is `90 × 70 yd`. It is deliberately large
enough to validate 20-player formations and movement reactions at the 7 yd/s
baseline without changing the independent Learn 2D percentage model.

## Projection confidence boundary

World scale and screen projection are separate contracts:

- Authoritative Train 3D state uses a flat Euclidean `x/z` yard plane. One
  coordinate unit is one yard, so an unmodified forward run covers exactly
  seven coordinate units per simulated second regardless of frame rate,
  viewport size, camera zoom, or the decorative floor extension.
- The camera uses a 58-degree vertical perspective field of view. At 16:9 this
  converts to approximately 89.16 degrees horizontally, closely matching the
  documented 90-degree WoW field-of-view ceiling. Blizzard also exposes FOV
  reduction as a user accessibility option, so there is no single screen
  projection shared by every WoW player.
- Camera zoom, pitch, viewport aspect, avatar dimensions, and monitor geometry
  change how many pixels a yard occupies without changing travel time or
  collision distance. The trainer therefore claims calibrated world-space
  movement, not pixel-for-pixel reproduction of an individual WoW camera.
- The floor rendered into fog is four times the authoritative arena footprint
  for visual continuity. It does not scale coordinates or enlarge the explicit
  90 × 70-yard collision boundary.

Official camera references:

- [Blizzard accessibility update describing the FOV reduction option](https://worldofwarcraft.blizzard.com/en-us/news/23876525/accessibility-updates-in-dragonflight)
- [Blizzard hotfix note confirming the intended 90-degree FOV ceiling](https://worldofwarcraft.blizzard.com/en-us/news/23800887/hotfixes-july-25-2022)

Exact boss-room dimensions, mechanic radii, player hitboxes, server latency,
and spell timing remain encounter evidence. They must be measured or sourced
per package; the platform's correct yard scale must not be used to invent them.
