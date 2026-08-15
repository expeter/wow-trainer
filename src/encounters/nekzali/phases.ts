import type { PhaseDefinition } from '../../platform/encounters'

export const phases = [
  { id: 'nekzali_phase_1', name: 'Soulcoiler Initiation', description: 'Edge drops, distance tank play, and Well-bound adds.', abilityIds: ['nekzali_soulcoil_well', 'nekzali_essence_rend', 'nekzali_training_rend_trail', 'nekzali_possession_barrage', 'nekzali_hollowing_strikes', 'nekzali_restless_amani'] },
  { id: 'nekzali_intermission', name: 'Ritual of Awakening', description: 'Two alternating Echo soak/spread cycles clear every Amani corpse.', abilityIds: ['nekzali_soulcoil_well', 'nekzali_hungering_pyre', 'nekzali_cremation'] },
  { id: 'nekzali_phase_2', name: 'Uncoiling', description: 'Phase 1 rules continue while Invoke moves Cultist hazards and raises energy.', abilityIds: ['nekzali_soulcoil_well', 'nekzali_essence_rend', 'nekzali_possession_barrage', 'nekzali_invoke'] },
  { id: 'nekzali_mythic_well', name: 'Grasping Depths', description: 'Planned Mythic-only Well team scenario.', abilityIds: ['nekzali_grasping_depths'] },
] as const satisfies readonly PhaseDefinition[]
