# L’ura v0.9.1 platform extraction audit

This matrix prevents reviewed trainer infrastructure from disappearing during
the Season 2 extraction. It compares the frozen `v0.9.1` baseline and handover
reuse audit with the active Midnight shell. It does not authorize wholesale
import of L’ura encounter code.

## Reusable platform capability

| Capability | Season 2 state | Owning work |
| --- | --- | --- |
| Six-section setup shell and one-active-panel navigation | Extracted | `CR-230`, `SPEC-018` |
| Product identity, repository links, creator card | Extracted | `CR-230`, `CR-233`, `BUG-160` |
| Exact SemVer, Git revision, build UTC, copy action | Extracted on setup | `CR-246`, `CR-248` |
| Relative `version.json` polling and Load new version/Later prompt | Extracted in current batch | `CR-246` |
| Persistent movement bindings, inversion, sensitivity, zoom | Extracted with per-change autosave, field migration, and compact reviewed-style controls | `BUG-157`, `BUG-161`, `BUG-165`, `CR-253` |
| WoW-like left orbit, right face, both-buttons-forward | Extracted in current batch | `BUG-161` |
| Deterministic fixed-step Train 3D simulation and renderer boundary | Extracted | `BUG-157`, `BUG-162` |
| Reviewed in-arena HUD frames, cast bar and action position | Extracted; mandatory mechanic/timer and display-rate cast progress retained | `CR-245`, `BUG-164`, `BUG-167`, `CR-254` |
| Class-specific combat projectile scheduler, travel, and impact vocabulary | Extracted for shared Season 2 snapshots and the Three.js renderer | `CR-256`, `CR-264`, `BUG-176` |
| Pull countdown, pause/resume, restart, failure lifecycle | Extracted with shared held-input clearing, countdown-gated retries, centered outcomes, and state-preserving WebGL recovery | `FR-076`, `BUG-169` |
| Dynamic encounter action declarations and bindings | Extracted and validated across both labs and active encounters | `FR-077` |
| Drop-in player/NPC/enemy/arena entities on one deterministic encounter clock | Extracted across both labs and active encounters; actions and snapshots share the simulation-owned timeline | `CR-283` |
| Reusable bounded NPC ambient movement that yields to mechanics | Extracted with seeded motion, independent class-cast tracks, and mechanic overrides | `FR-088` |
| Independent music, encounter SFX and raid-lead/TTS channels | Active gap | `FR-078` |
| Draggable/group tactical planning with validation and sharing | Active gap | `FR-079` |
| Stable failure review, recap and offline share/result identity | Partial: live corners and detailed terminal drill card extracted; recap/share pending | `CR-249`, `BUG-169`, `FR-080` |
| Namespaced, schema-versioned local persistence | Partial: training settings only | `FR-078`, `FR-079` |
| Unit/component/focused browser/build delivery gates | Extracted and evolving | `CR-231`, `FR-072` |
| Dedicated Pages workflow and production monitoring | Deliberately deferred | `FR-074` |
| Online identity, public activity, achievements and rankings | Deliberately deferred to isolated `/v2` | `FR-073` |

## Final frozen-source review (`FR-087`)

The final review compared the frozen v0.9.1 `App.tsx`, `GameScene.tsx`, complete
ticket register, feature inventory, release changelog, and deferred-ideas list
against the active Season 2 source. It found four reusable decisions not yet
represented precisely enough in the Season 2 backlog:

| Candidate | Decision state | Season 2 work |
| --- | --- | --- |
| Train 3D jump/vertical traversal | Discuss; implement only when an accepted encounter needs vertical collision or traversal | `FR-089` |
| Simulation time-scale control | Discuss as a development/Test-only diagnostic; never alter encounter timing or comparable results | `FR-090` |
| Shared player vitality, damage, potion, defensive, and cooldown state | Discuss as an opt-in package service; do not restore L’ura’s permanent global actions | `FR-091` |
| Player selection of explicitly approved focused practice scenarios | Discuss after encounter authors supply the situations; reuse package scenario declarations | `FR-092` |

The review also confirmed these mappings and exclusions:

- Reduced-motion behavior and measured accessibility work remain in `CR-236`
  and `CR-234`; independent audio remains `FR-078`.
- Attempt recap/share identity remains `FR-080`, planning remains `FR-079`,
  deployment remains `FR-074`, and all online activity/profile/ranking work
  remains isolated under `FR-073` and `/v2`.
- Configurable player movement speed is not retained: `SPEC-020` owns the fixed
  WoW-calibrated Train 3D yard model. A diagnostic time scale, if accepted,
  scales the one encounter clock rather than changing movement alone.
- Permanent global combat actions, render-position-owned collision, L’ura
  phase practice data, fake completion shortcuts, achievements, live activity,
  `/v1`, and production deployment targets remain intentionally excluded.

This closes the audit only. Every discuss item still requires an explicit
keep/drop decision before implementation.

## Boundaries preserved during extraction

- The movement-lab 20-slot raid-position chooser and temporary class treatment
  are a development harness, not a real-encounter entry flow. Encounter role and position come from the
  selected tactic/raid plan.
- Encounter actions are capability records declared by packages. L’ura’s
  permanent global action set is not the Season 2 architecture.
- L’ura arenas, phases, crystal rules, scoring, achievements, raid-plan data,
  audio meanings, `/v1` calls, and deployment targets remain legacy-specific.
- The development reference route exists only while extraction is active and
  is removed in `CR-235` before public release; the README lineage remains.

## Audit sources

- [`handover/midnight-season-2/02-reuse-audit.md`](../handover/midnight-season-2/02-reuse-audit.md)
- [`handover/midnight-season-2/03-target-architecture.md`](../handover/midnight-season-2/03-target-architecture.md)
- [`handover/midnight-season-2/06-migration-roadmap.md`](../handover/midnight-season-2/06-migration-roadmap.md)
- [`handover/midnight-season-2/08-testing-and-release.md`](../handover/midnight-season-2/08-testing-and-release.md)
- Frozen request history and implemented feature inventory in [`README.md`](README.md)
- Frozen `legacy-source-v0.9.1` `App.tsx`, `GameScene.tsx`,
  `docs/README.md`, and `CHANGELOG.md`
