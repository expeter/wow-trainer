import type { AbilityDefinition, SourceProvenance } from '../../platform/encounters'

const journal = { kind: 'ptr-guide', confidence: 'medium', asOf: '2026-08-16', note: 'Reconciled supplied guide transcript and current pre-live spell data; uncertain recurrence remains configurable.' } as const satisfies SourceProvenance
const ability = (id: string, name: string, description: string, severity: AbilityDefinition['severity'], tags: readonly string[], seconds?: number): AbilityDefinition => ({ id, name, description, severity, tags, timings: seconds === undefined ? [] : [{ key: 'duration', seconds, provenance: journal }], provenance: journal })

export const abilities = [
  ability('lost_united_defense', 'United Defense', 'All three explorers within 30 yards reduce incoming damage by 99%.', 'warning', ['positioning', 'bosses'], 30),
  ability('lost_final_ascension', 'Final Ascension', 'Mor’zahi reaches full energy and begins a lethal five-second channel.', 'lethal', ['energy', 'fish'], 5),
  ability('lost_throw_junk', 'Throw Junk', 'Crates land in small harmful circles, then become collectible; one reveals the fish.', 'warning', ['crate', 'movement'], 3),
  ability('lost_disgusting_fish', 'Disgusting Fish', 'Feed each eligible explorer once in the planned Iku, Gebbo, Nama order.', 'warning', ['extra-action', 'ultimate']),
  ability('lost_icebound_flames', 'Icebound Flames', 'Interrupt Iku’s four-second Frostfire cast.', 'lethal', ['interrupt'], 4),
  ability('lost_frostfire_volley', 'Frostfire Volley', 'Place Fire outside or Frost inside, then cleanse in the opposite patch.', 'lethal', ['spread', 'cleanse'], 10),
  ability('lost_explosive_surprise', 'Explosive Surprise', 'Place Gebbo’s bomb at the edge opposite the preserved mushroom.', 'lethal', ['bomb', 'placement'], 10),
  ability('lost_blast_wave', 'Blast Wave', 'Use the mushroom launch or a valid airborne state to cross the wave.', 'lethal', ['wave', 'jump']),
  ability('lost_shell_spin', 'Shell Spin', 'Dodge three moving shell lanes from Nama.', 'warning', ['projectile', 'stun'], 4),
  ability('lost_mighty_thud', 'Mighty Thud', 'Resolve three sequential six-yard split soaks and control each knockback.', 'lethal', ['soak', 'knockback'], 6),
] as const satisfies readonly AbilityDefinition[]
