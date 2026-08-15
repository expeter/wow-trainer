import type { WorldArena3D } from '../../../platform/encounters'

export const sentinelsArena = {
    id: 'sentinels_split_world',
    label: 'Sentinels split arena',
    shape: 'rectangle',
    width: 180,
    depth: 70,
    anchors: [
      { id: 'acid-boss', label: 'Acid boss', x: 50, z: 0 },
      { id: 'blood-boss', label: 'Blood boss', x: -50, z: 0 },
      { id: 'acid-raid', label: 'Acid raid', x: 39, z: 0 },
      { id: 'blood-raid', label: 'Blood raid', x: -39, z: 0 },
      { id: 'center-corridor', label: 'Swap corridor', x: 0, z: 0 },
      { id: 'north-meeting-sector', label: 'North meeting sector', x: 0, z: -18 },
      { id: 'south-meeting-sector', label: 'South meeting sector', x: 0, z: 18 },
    ],
    theme: { kind: 'sentinels', floor: '#172116', boundary: '#90b64d', acid: '#71d49a', blood: '#d66b78', corridor: '#d8c680' },
  } as const satisfies WorldArena3D

export const train3dArenas = [sentinelsArena] as const satisfies readonly WorldArena3D[]
