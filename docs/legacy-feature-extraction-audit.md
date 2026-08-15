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
| Persistent movement bindings, inversion, sensitivity, zoom | Extracted with per-change autosave and field migration | `BUG-157`, `BUG-161`, `BUG-165` |
| WoW-like left orbit, right face, both-buttons-forward | Extracted in current batch | `BUG-161` |
| Deterministic fixed-step Train 3D simulation and renderer boundary | Extracted | `BUG-157`, `BUG-162` |
| Reviewed in-arena HUD frames, cast bar and action position | Extracted in current batch | `CR-245`, `BUG-164` |
| Pull countdown, pause/resume, restart, failure lifecycle | Partial: lab countdown only | `FR-076` |
| Dynamic encounter action declarations and bindings | Prototype only; contract gap | `FR-077` |
| Independent music, encounter SFX and raid-lead/TTS channels | Active gap | `FR-078` |
| Draggable/group tactical planning with validation and sharing | Active gap | `FR-079` |
| Stable failure review, recap and offline share/result identity | Partial: in-arena failure/points corners extracted; recap/share pending | `CR-249`, `FR-080` |
| Namespaced, schema-versioned local persistence | Partial: training settings only | `FR-076`, `FR-078`, `FR-079` |
| Unit/component/focused browser/build delivery gates | Extracted and evolving | `CR-231`, `FR-072` |
| Dedicated Pages workflow and production monitoring | Deliberately deferred | `FR-074` |
| Online identity, public activity, achievements and rankings | Deliberately deferred to isolated `/v2` | `FR-073` |

## Boundaries preserved during extraction

- The movement-lab role and starting-position chooser is a development harness,
  not a real-encounter entry flow. Encounter role and position come from the
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
