# Post-publication performance baseline

Ticket: `CR-234`

Measured on 2026-08-18 with `npm run build` followed by
`npm run measure:build`. Budgets apply to compressed transfer size, not the
uncompressed artifact listing.

| Boundary | Measured | Budget | Loading contract |
| --- | ---: | ---: | --- |
| Initial shell JavaScript | 72.62 KiB gzip | 87.89 KiB | Required by setup |
| Initial shell CSS | 25.54 KiB gzip | 34.18 KiB | Required by setup |
| Three.js renderer chunk | 147.36 KiB gzip | 170.90 KiB | Lazy; Train 3D only |
| Lost Explorers raid plan | 1.76 MB source | Evidence asset | Painted only in Lost Explorers Learn 2D |
| Sszorak raid plan | 2.42 MB source | Evidence asset | Painted only in Sszorak Learn 2D |
| Twin Fangs raid plan | 2.39 MB source | Evidence asset | Painted only in Twin Fangs Learn 2D |
| Coiled Altar raid plan | 1.73 MB source | Evidence asset | Painted only in Coiled Altar Learn 2D |

The measured pass retains encounter packages and both runtimes behind dynamic
imports. The shell must not eagerly import the Three.js renderer. The renderer
uses one simulation snapshot source, one device-independent pixel ratio, and
one shared world implementation across packages.

Runtime acceptance remains the existing local threshold of at least 30 FPS and
p95 below 50 ms in the contract-room browser regression. Hosted software
rendering retains its separately documented 10 FPS / 120 ms threshold.

This pass also suppresses non-essential marker wobble for reduced-motion users,
removes generic floor decoration from custom arena silhouettes, preserves a
visible keyboard focus and interactive role on the 3D canvas, contains arena
painting, and records focused plus complete zero-retry browser duration.

The 2026-08-18 acceptance run completed the focused environment slice in 26.4
seconds (2 tests) and the complete suite in 3.0 minutes (22 tests), both with
one worker and zero retries.

Run the measurement after every production build. A budget failure requires a
measured explanation or a loading/code-splitting correction; do not raise a
limit merely to silence the check.
