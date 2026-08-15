# Decisions and open risks

## Accepted decisions

### D-001 · Standalone repository

Use a new standalone GitHub repository rather than GitHub’s fork relationship.
Preserve history by seeding from the legacy v0.9.1 tag.

### D-002 · Legacy production remains available

Keep `lura.asgard.website` on its stable application and keep its API results
scoped to `season-1`. Season 2 receives a different domain and product ID.

### D-003 · Reuse-first strangler migration

Begin from the known working code and tests. Extract shell/services through
characterization, then remove L’ura-specific production code after the reuse
audit is satisfied. Do not begin with a blank trainer.

### D-004 · Shared shell, independent game modes

Learn 2D and Train 3D share product configuration, encounter vocabulary,
tactics, roles, audio preferences and reporting IDs. They do not share a world
simulation, coordinate system, collision model, or renderer.

### D-005 · Isolated encounter packages

Each boss owns one directory with definitions, timing, tactics, 2D lessons, 3D
mechanics/arenas/bots and tests. Automatic discovery avoids a global encounter
registry and merge hotspot.

### D-006 · Typed mechanics, declarative facts

Use data for abilities, arenas, tactics and timing profiles. Use typed code for
mechanic state/resolution. Do not build a universal JSON mechanic language.

### D-007 · Timing is replaceable and attributable

Mechanic rules are distinct from PTR/live/hotfix timing profiles. Prefer
health, energy, aura, summon and death triggers over hard-coded pull seconds.

### D-008 · One human plus reliable bots

Initial practice controls one player. Bots fill the raid, reveal assignments,
and default to correct deterministic play. Intentional bot mistakes are an
explicit scenario option with attribution.

### D-009 · Encounter actions only

Support interrupts, taunt/swap and mechanic-specific extra actions. Defer
rotations, generic potions/defensives, class toolkits and movement cooldowns.

### D-010 · Sentinels establishes version 1

Entombed Sentinels, starting with Helical Toxins, proves both modes, tactics,
roles, bots, timing profiles and full-fight composition before other encounter
agents begin.

### D-011 · API v2 is isolated and deferred

Reserve stable local attempt IDs now. Add `/v2` reporting/statistics after the
attempt shape stabilizes. Preserve `/v1` compatibility and one API deployment
owner.

### D-012 · Progression is not a launch dependency

Points, achievements, accepted runs and leaderboards are separate later
milestones. Public aggregate usage statistics precede competitive progression.

## Open risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| PTR research differs from live | Full-fight sequence or durations teach the wrong cadence | Label profiles visibly, keep provenance per value, add immutable live profiles after logs |
| Shell is embedded in `App.tsx` | Extraction accidentally changes reviewed UX | Characterization tests and one-capability-at-a-time replacement |
| Renderer owns bot/mechanic logic | New encounters repeat coupling | Headless Train 3D simulation and snapshot-only renderer contract |
| 2D and 3D are forced into one abstraction | 2D becomes too complex or 3D too shallow | Share semantic IDs only; maintain separate scenario and arena contracts |
| Full fight for every boss expands scope | Late or incomplete releases | Build focused modules first internally, compose them before that boss is public, release bosses independently |
| Core changes during parallel work | Merge conflicts and inconsistent packages | Freeze `EncounterPackageV1`; integration owner reviews core proposals |
| Tactic editor becomes boss-specific | Every encounter touches shell code | Package-provided `TacticSchema` and reusable field/editor primitives |
| Automatic discovery hides bad packages | Catalogue fails at runtime | Build-time and runtime conformance tests with clear diagnostics |
| Bots reveal solutions or cause wipes | Trainer teaches poorly and frustrates players | Configurable reaction policy, reliable defaults, visible responsibility |
| Anonymous “players” metric is misleading | Public statistics overclaim reach | Label attempts/sessions/devices; count true users only for authenticated accounts |
| v1 and v2 workflows compete | Old API or database is overwritten | One production deployment owner and mandatory v1 compatibility rehearsal |
| Raw feedback leaks identities | Guild privacy breach | Commit only anonymized findings; ignore private source folder |
| Styles are copied as one monolith | New shell remains hard to evolve | Extract tokens/base/components before encounter UI expands |
| New storage collides with L’ura | Preferences or tactics corrupt each other | `midnight-s2:` namespace and explicit optional import only |

## Decisions deliberately left for later milestones

These are not implementation gaps in the initial platform:

- Final achievement catalogue and point economy.
- Season 2 competitive leaderboard structure.
- Whether API v2 authenticated identity is enabled before or with achievements.
- Multiplayer/network synchronization.
- Replay/heatmap storage.
- Exact live encounter timings before sufficient logs exist.
- Which later boss is released first if live progression changes the researched
  value order.
