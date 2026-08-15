import type { AbilityDefinition, SourceProvenance } from '../../platform/encounters'

const journal = { kind: 'journal', confidence: 'high', asOf: '2026-08-15', note: 'Current 12.1 Dungeon Journal transcription; live timing not yet available.' } as const satisfies SourceProvenance
const tactic = { kind: 'local-tactic', confidence: 'medium', asOf: '2026-08-15', note: 'Heroic recap and requested trainer behavior; timing remains provisional.' } as const satisfies SourceProvenance
const ability = (id: string, name: string, description: string, provenance: SourceProvenance, tags: string[] = []): AbilityDefinition => ({ id, name, description, severity: 'warning', tags, timings: [], provenance })

export const abilities = [
  ability('nekzali_soulcoil_well', 'Soulcoil Well', 'Consumes leaked spirits and players, causing Soulcoil Rite and boss energy.', journal, ['arena', 'lethal']),
  ability('nekzali_essence_rend', 'Essence Rend', 'Pulls several players before a lingering essence leaves a Latent Cultist hazard.', journal, ['movement', 'ground']),
  ability('nekzali_possession_barrage', 'Possession Barrage', 'Spirits travel toward the primary tank and deal less raid damage over longer distance.', journal, ['tank', 'distance']),
  ability('nekzali_hollowing_strikes', 'Hollowing Strikes', 'Primary-target attacks apply stacking healing and absorption reduction.', journal, ['tank', 'swap']),
  ability('nekzali_restless_amani', 'Restless Amani', 'Shielded adds advance from sarcophagi toward the Well and leave Vessels for intermission.', journal, ['adds', 'priority']),
  ability('nekzali_hungering_pyre', 'Hungering Pyre', 'One raid half shares a large soak while the other half receives Slithering Flame.', journal, ['soak', 'assignment']),
  ability('nekzali_cremation', 'Cremation', 'Slithering Flame explosions incinerate nearby Amani corpses and leave fire.', journal, ['spread', 'corpse']),
  ability('nekzali_invoke', 'Invoke', 'Triggers Soulcoil Rite and causes Latent Cultists to reposition around the Well.', journal, ['phase-2', 'movement']),
  ability('nekzali_training_rend_trail', 'Provisional Rend trail', 'One-second edge drops create a repeatable movement drill pending live-log validation.', tactic, ['training-profile', 'provisional']),
  ability('nekzali_grasping_depths', 'Grasping Depths', 'The assigned raid half enters the Well to defeat a Drowned Echo.', journal, ['realm']),
  ability('nekzali_drowned_echo', 'Drowned Echo', 'The inner-realm add requires player damage and one assigned interrupt.', tactic, ['realm', 'add', 'interrupt']),
  ability('nekzali_swirling_spirits', 'Swirling Spirits', 'Orbiting and outward-moving spirits make the inner realm a movement drill.', tactic, ['realm', 'movement']),
  ability('nekzali_soul_exhaustion', 'Soul Exhaustion', 'Returning players cannot immediately re-enter Grasping Depths.', journal, ['realm', 'aura']),
  ability('nekzali_disruption', 'Realm Disruption', 'A readable three-second cast interrupts an active Main cast as a performance mistake.', tactic, ['realm', 'cast', 'performance']),
] as const satisfies readonly AbilityDefinition[]
