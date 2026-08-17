# Midnight Season 2 Trainer

A standalone browser trainer for learning Midnight Season 2 raid encounters in
two complementary modes: tactical study in Learn 2D and movement rehearsal in
Train 3D.

This repository began with the reviewed L'ura Trainer v0.9.1 platform so its
shell, controls, HUD, tactical planner, audio, persistence, tests, and delivery
lessons can be extracted incrementally. It is a new product, not a continuation
of the L'ura encounter or its online service.

## Current status

The public release candidate loads all eight isolated encounter packages through
`EncounterPackageV1`. Nek'zali and Entombed Sentinels are playable full fights
in Learn 2D and Train 3D; the remaining packages stay visibly planned. The
shared shell now includes independent controls, draggable HUD setup, a versioned
local tactical planner, opt-in audio channels, and the public boss journey.

- Product ID: `midnight-season-2`
- Short ID: `midnight-s2`
- Public hostname: `midnight.asgard.website`
- Public deployment: GitHub Pages workflow on `main`
- Online services: API `/v2`, statistics, achievements, and rankings deferred

The [request ledger](docs/README.md), [stable specifications](docs/specifications.md),
[delivery milestones](docs/milestones.md), and [architecture boundary](docs/architecture.md)
are authoritative. Contributors and coding agents must begin with
[`AGENTS.md`](AGENTS.md) and the numbered
[Season 2 handover](handover/midnight-season-2/00-README.md).

## Runtime boundary

The shell owns product navigation, encounter vocabulary, preferences, and
shared presentation. Learn 2D and Train 3D consume the same encounter package
but own different simulations and arena geometry. Bosses live in isolated,
automatically discovered encounter directories; malformed packages are
excluded with development diagnostics instead of crashing the catalogue.

The retired Season 1 runtime, `/v1` API, service units, deployment workflow,
review tooling, and bundled audio were removed before publication. The reviewed
baseline remains recoverable from the immutable `legacy-source-v0.9.1` tag and
the separate source repository; it is not an application route in this product.

## Project lineage

Midnight Season 2 Trainer was seeded from the reviewed
[L’ura Trainer](https://lura.asgard.website) v0.9.1 foundation so its proven
shell and engineering lessons could be extracted incrementally. The original
trainer remains a separate Season 1 product with its own
[source repository](https://github.com/expeter/wow-midnight-fall-lura-trainer).
This acknowledgement is repository documentation only; the deployed Midnight
shell does not link to or connect with the original trainer or its service.

## Local development

Use the repository dependency guard before running project code:

```bash
sec-helper audit
sec-helper install
npm run dev
```

`npm run dev` starts both the hot-reload Vite trainer and the localhost-only
global Project Inbox. Use `npm run dev:trainer` or `npm run dev:inbox` when only
one server is wanted. `npm run inbox` is an explicit inbox alias, and
`npm run inbox:list` lists captured evidence without changing it. Ctrl+C stops
both combined-development children. Run the dependency audit as the preflight;
do not wrap the long-lived development command in `sec-helper npm`, whose own
interrupt reporting is outside this repository.

If `sec-helper` blocks a package or artifact, stop and resolve it through the
guard; do not bypass the proxy or installation policy.

Run unit and component coverage with `npm test`. Run focused browser coverage
through `./scripts/test-e2e-focused.sh season2-shell`; use
`npm run test:e2e:local` only for the complete browser suite. Build with
`npm run build`.

Pushes to `main` run unit tests, the focused shell browser suite, and the static
build before deploying `dist/` to the isolated `github-pages` environment. The
artifact contains `CNAME` for `midnight.asgard.website`; repository Pages and
DNS settings must point at this repository before the custom domain resolves.

## License and attribution

The source code is released under the [MIT License](LICENSE). The current audio
bed and cues are generated with browser audio primitives, so no third-party
music or sound pack is bundled.

This is an unofficial fan-made practice tool and is not affiliated with or
endorsed by Blizzard Entertainment. World of Warcraft and related names are
trademarks of Blizzard Entertainment.
