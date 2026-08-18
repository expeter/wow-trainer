import type { WorldArena3D } from '../../../platform/encounters'

export const vashnikArena = {
  id: 'vashnik_chamber_world', label: 'Chamber of Virulence', shape: 'circle', width: 96, depth: 96,
  anchors: [
    { id: 'malignant-cavity', label: 'Malignant Cavity', x: 0, z: 0 },
    { id: 'blood-fountain', label: 'Blood Fountain', x: 0, z: -36 },
    { id: 'flame-fountain', label: 'Flame Fountain', x: -31, z: 18 },
    { id: 'shadow-fountain', label: 'Shadow Fountain', x: 31, z: 18 },
  ],
  theme: { kind: 'vashnik', layout: 'three-fountain-plan', fog: 'none', material: 'three-fountain-stone', floor: '#191a18', cracks: '#4e4a40', boundary: '#9a8a62', accent: '#d4bf79', cavity: '#173a25', blood: '#c04a5a', flame: '#e57c3f', shadow: '#8468d4' },
} as const satisfies WorldArena3D

export const train3dArenas = [vashnikArena]
