# Midnight Season 2 Trainer

A standalone browser trainer for learning Midnight Season 2 raid encounters in
two complementary modes: tactical study in Learn 2D and movement rehearsal in
Train 3D.

This repository begins with the reviewed L'ura Trainer v0.9.1 platform so its
shell, controls, HUD, tactical planner, audio, persistence, tests, and delivery
lessons can be extracted incrementally. It is a new product, not a continuation
of the L'ura encounter or its online service.

## Current status

The bootstrap shell is active. Entombed Sentinels is the only selected first
encounter, but neither training runtime is playable yet. `EncounterPackageV1`,
automatic encounter discovery, and the isolated Sentinels package are the next
milestone after the bootstrap contract is stable.

- Product ID: `midnight-season-2`
- Short ID: `midnight-s2`
- Planned hostname: `midnight.asgard.website` (not configured yet)
- Public deployment: disabled during extraction
- Online services: API `/v2`, statistics, achievements, and rankings deferred

The [request ledger](docs/README.md), [stable specifications](docs/specifications.md),
[delivery milestones](docs/milestones.md), and [architecture boundary](docs/architecture.md)
are authoritative. Contributors and coding agents must begin with
[`AGENTS.md`](AGENTS.md) and the numbered
[Season 2 handover](handover/midnight-season-2/00-README.md).

## Runtime boundary

The shell owns product navigation, encounter vocabulary, preferences, and
shared presentation. Learn 2D and Train 3D consume the same encounter package
but own different simulations and arena geometry. Bosses will live in isolated,
automatically discovered encounter directories.

The complete L'ura v0.9.1 application remains available only in a development
server at `?reference=lura-v0.9.1`. Production builds use the Season 2 entry
point and do not expose the reference link. The inherited `/v1` API and its
deployment workflow are frozen.

## Local development

Use the repository dependency guard before running project code:

```bash
sec-helper audit
sec-helper install
npm run dev
```

If `sec-helper` blocks a package or artifact, stop and resolve it through the
guard; do not bypass the proxy or installation policy.

Run unit and component coverage with `npm test`. Run focused browser coverage
through `./scripts/test-e2e-focused.sh season2-shell`; use
`npm run test:e2e:local` only for the complete browser suite. Build with
`npm run build`.

There is intentionally no deployment procedure in this bootstrap milestone.
The inherited workflows verify the standalone shell without publishing Pages
or the legacy API.

## License and attribution

The source code is released under the [MIT License](LICENSE). Bundled legacy
audio remains subject to its documented license under
[`sounds/pixabay/README.md`](sounds/pixabay/README.md) while the extraction
audit determines which assets are retained.

This is an unofficial fan-made practice tool and is not affiliated with or
endorsed by Blizzard Entertainment. World of Warcraft and related names are
trademarks of Blizzard Entertainment.
