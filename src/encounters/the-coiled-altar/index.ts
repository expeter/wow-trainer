import { createEvidenceEncounterPackage } from '../../platform/encounters/evidenceFullFight'
import { definition } from './definition'
export default createEvidenceEncounterPackage(definition, { learn2d: () => import('./learn2d/Runtime'), train3d: () => import('./train3d/Runtime') })
