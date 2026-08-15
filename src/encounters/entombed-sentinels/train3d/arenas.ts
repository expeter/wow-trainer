import type { WorldArena3D } from '../../../platform/encounters'

export const train3dArenas = [
  {
    id: 'sentinels_split_world',
    label: 'Sentinels split arena',
    shape: 'rectangle',
    width: 100,
    depth: 60,
    anchors: [
      { id: 'acid-boss', label: 'Acid boss', x: -30, z: 0 },
      { id: 'blood-boss', label: 'Blood boss', x: 30, z: 0 },
      { id: 'acid-raid', label: 'Acid raid', x: -22, z: 0 },
      { id: 'blood-raid', label: 'Blood raid', x: 22, z: 0 },
      { id: 'center-corridor', label: 'Swap corridor', x: 0, z: 0 },
      { id: 'north-meeting-sector', label: 'North meeting sector', x: 0, z: -18 },
      { id: 'south-meeting-sector', label: 'South meeting sector', x: 0, z: 18 },
    ],
    theme: { floor: 'venom-stone', acid: '#71d49a', blood: '#d66b78', corridor: '#d8c680' },
  },
] as const satisfies readonly WorldArena3D[]
