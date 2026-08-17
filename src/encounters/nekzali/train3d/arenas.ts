import type { WorldArena3D } from '../../../platform/encounters'
export const nekzaliArena = { id: 'nekzali_soulwell_world', label: 'Circular Soulcoil chamber', shape: 'circle', width: 90, depth: 90,
  anchors: [
    { id: 'soulcoil-well', label: 'Soulcoil Well', x: 0, z: 0 },
    { id: 'north-echo', label: 'North Echo', x: 0, z: -35 }, { id: 'south-echo', label: 'South Echo', x: 0, z: 35 },
    { id: 'east-rend', label: 'Essence Rend lane', x: 38, z: 0 }, { id: 'south-barrage', label: 'Possession Barrage lane', x: 0, z: 38 },
  ], theme: { kind: 'soulcoil', material: 'cracked-soul-stone', floor: '#263b39', cracks: '#6ca7a1', boundary: '#55b9bd', accent: '#79e3de', well: '#081c22' },
} as const satisfies WorldArena3D
export const train3dArenas = [nekzaliArena]
