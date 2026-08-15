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
