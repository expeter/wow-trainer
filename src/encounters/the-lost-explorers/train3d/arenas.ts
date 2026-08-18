import type { WorldArena3D } from '../../../platform/encounters'

export const lostExplorersArena = {
  id: 'lost_explorers_octagonal_world', label: 'Lost Explorers octagonal chamber', shape: 'rectangle', width: 96, depth: 96,
  anchors: [
    { id: 'morzahi', label: 'Mor’zahi', x: 0, z: 0 },
    { id: 'cleave-pair', label: 'Gebbo and Iku route', x: -18, z: -12 },
    { id: 'nama-separate', label: 'Nama separation', x: 24, z: 18 },
    { id: 'outer-bomb', label: 'Outer bomb placement', x: 0, z: 42 },
  ],
  theme: { kind: 'lost-explorers', layout: 'octagonal-council', fog: 'none', material: 'explorer-octagon-stone', floor: '#20201d', cracks: '#4f554b', boundary: '#b49c64', accent: '#e0c57b', center: '#594178' },
} as const satisfies WorldArena3D

export const train3dArenas = [lostExplorersArena]
