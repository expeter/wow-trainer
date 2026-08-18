import EvidenceLearn2DRuntime from '../../../platform/encounters/EvidenceLearn2DRuntime'
import type { EncounterRuntimeProps } from '../../../platform/encounters'
import { definition } from '../definition'
export default function Runtime(props: EncounterRuntimeProps) { return <EvidenceLearn2DRuntime definition={definition} runtime={props} /> }
