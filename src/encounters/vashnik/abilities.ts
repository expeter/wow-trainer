import type { AbilityDefinition, SourceProvenance } from '../../platform/encounters'

const journal = { kind: 'journal', confidence: 'high', asOf: '2026-08-16', note: 'Patch 12.1 pre-live journal/spell data; values remain subject to launch tuning.' } as const satisfies SourceProvenance
const guide = { kind: 'ptr-guide', confidence: 'medium', asOf: '2026-08-16', note: 'Reconciled current guide strategy and PTR evidence; no live-log cadence available.' } as const satisfies SourceProvenance
const provisional = { kind: 'local-tactic', confidence: 'low', asOf: '2026-08-16', note: 'Trainer schedule or disputed pre-live behavior isolated for later live-log replacement.' } as const satisfies SourceProvenance
const ability = (id: string, name: string, description: string, provenance: SourceProvenance, tags: string[] = []): AbilityDefinition => ({ id, name, description, severity: 'warning', tags, timings: [], provenance })

export const abilities = [
  ability('vashnik_imbibe', 'Imbibe', 'At 100 energy, activates the two fountains nearest Vashnik and maps their adds, Infusions, and infections.', journal, ['positioning', 'energy']),
  ability('vashnik_infusions', 'Blood, Shadow, and Flame Infusions', 'Independently expiring stacks increase their matching Expulsion pressure and Living Venom health.', guide, ['aura', 'pressure']),
  ability('vashnik_toxic_vapor', 'Toxic Vapor', 'Each Imbibe adds background raid pressure.', journal, ['informational', 'soft-enrage']),
  ability('vashnik_living_venoms', 'Living Venoms', 'Flame, Shadow, and Blood add families move toward the Malignant Cavity.', journal, ['adds', 'priority']),
  ability('vashnik_malignant_burst', 'Malignant Burst', 'A Living Venom reaching the cavity causes a major encounter failure.', journal, ['adds', 'lethal']),
  ability('vashnik_caustic_surge', 'Caustic Surge', 'Burning Venom deaths must be staggered outside the three-second overlap window.', journal, ['adds', 'timing']),
  ability('vashnik_umbral_ejection', 'Umbral Ejection', 'Shrouded Venom deaths create small avoidable impacts.', journal, ['adds', 'movement']),
  ability('vashnik_splitting_clot', 'Splitting Clot', 'The Blood add splits through an explicit one-to-two-to-four lineage.', journal, ['adds', 'priority']),
  ability('vashnik_adaptive_infection', 'Adaptive Infection', 'Applies only the two infection variants mapped from the active fountain pair.', journal, ['assignment']),
  ability('vashnik_exploding_infection', 'Exploding Infection', 'Run to an uncontested outer lane before removal.', guide, ['movement', 'spread']),
  ability('vashnik_stygian_infection', 'Stygian Infection', 'Keep moving to leave repeated Shadow bursts behind the carrier.', guide, ['movement', 'ground']),
  ability('vashnik_siphoning_infection', 'Siphoning Infection', 'Two separated support camps use nearby helpers to clear normalized absorbs.', guide, ['stack', 'healing']),
  ability('vashnik_malignant_catalyst', 'Malignant Catalyst', 'Every six-yard Catalytic Bile circle needs at least one occupant.', journal, ['soak']),
  ability('vashnik_plague_froth', 'Plague Froth', 'Targets spread before four arena-fixed cardinal waves fire on expiry.', journal, ['spread', 'wave']),
  ability('vashnik_malignant_tumor', 'Malignant Tumor', 'Provisional Tumors are destroyed by Plague Wave within two Froth opportunities.', provisional, ['object', 'wave']),
  ability('vashnik_dripping_fangs', 'Dripping Fangs', 'A two-second tank cast requires ownership to swap after every application.', journal, ['tank', 'swap']),
] as const satisfies readonly AbilityDefinition[]
