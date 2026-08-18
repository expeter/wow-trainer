import EvidenceTrain3DRuntime from '../../../platform/encounters/EvidenceTrain3DRuntime'
import type { EncounterRuntimeProps } from '../../../platform/encounters'
import { definition } from '../definition'
export default function Runtime(props: EncounterRuntimeProps) { return <EvidenceTrain3DRuntime definition={definition} runtime={props} /> }
