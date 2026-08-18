# Supplied boss raid-plan evidence

Tickets: `CR-301`, `CR-303`

These user-supplied local images are visual evidence for isolated encounter
packages. They establish recognizable arena silhouettes and major floor
landmarks; they do not establish collision coordinates, mechanic timings, or
implementation approval by themselves.

| Encounter | Evidence | Observed arena structure | Runtime status |
| --- | --- | --- | --- |
| Sszorak | [`sszorak.png`](../inbox/sszorak.png) | Raised octagonal stone platform surrounded by luminous poison | Implemented by `FR-094`; visual environment refined by `CR-303` |
| The Lost Explorers | [`the-lost-explorers.png`](../inbox/the-lost-explorers.png) | Raised octagonal platform suspended over a dark cavern or void | Implemented by `FR-086`; visual environment refined by `CR-303` |
| The Coiled Altar | [`the-coiled-altar.png`](../inbox/the-coiled-altar.png) | Rectangular altar platform with a centered circular seal and side structures | Implemented by `FR-096` |
| The Twin Fangs | [`the-twin-fangs.png`](../inbox/the-twin-fangs.png) | Triangular ring platform surrounding a large central void | Implemented by `FR-095` |
| Ula’tek | [`ulatek.png`](../inbox/ulatek.png) | Octagonal platform with four inset cardinal floor panels and a central emblem | Catalogue only |

Learn 2D may use a contained local image after the encounter receives an
accepted implementation ticket, while Train 3D creates a separate code-rendered
arena model. Do not use these bitmaps as 3D floor textures or infer exact world
measurements from the screenshot crop.

`CR-303` adds only visual surroundings and platform depth: toxic depths for
Sszorak, Twin Fangs, and Coiled Altar, and a dark cave void for Lost Explorers.
Simulation-owned playable boundaries remain aligned with the code-rendered top
surfaces; the surrounding liquid and void are not new mechanic state.
