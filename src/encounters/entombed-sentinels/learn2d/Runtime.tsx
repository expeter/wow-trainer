import { useMemo, useState } from 'react'
import TrainingHud from '../../../platform/TrainingHud'
import type { EncounterRuntimeProps } from '../../../platform/encounters'
import { learn2dScenarios } from './scenarios'

const partnerOptions = [
  { id: 'scout-a', label: 'Scout A', green: 2, red: 2 },
  { id: 'scout-b', label: 'Scout B', green: 3, red: 1 },
  { id: 'scout-c', label: 'Scout C', green: 1, red: 3 },
] as const

export default function SentinelsLearn2D({ scenarioId, hudSettings, onExit }: EncounterRuntimeProps) {
  const scenario = useMemo(() => learn2dScenarios.find(item => item.id === scenarioId) ?? learn2dScenarios[0], [scenarioId])
  const [stage, setStage] = useState<'partner' | 'sector' | 'complete'>('partner')
  const [feedback, setFeedback] = useState('You carry 1 green and 3 red. Find the partner that brings the pair to exactly 4 green.')
  const [mistakes, setMistakes] = useState(0)
  const objective = stage === 'partner'
    ? 'Choose the compatible toxin partner'
    : stage === 'sector'
      ? 'Meet your partner in the north sector'
      : 'Helical Toxins solved'

  function choosePartner(green: number) {
    if (green === 3) {
      setStage('sector')
      setFeedback('Correct: 1 + 3 green makes four. Now preserve the center corridor and meet north.')
    } else {
      setMistakes(value => value + 1)
      setFeedback(`${1 + green} green is not four. Read both toxin compositions and try again.`)
    }
  }

  function chooseSector(sector: string) {
    if (sector === 'north-meeting-sector') {
      setStage('complete')
      setFeedback('Resolved. The matching pair met in the assigned sector without blocking the corridor.')
    } else {
      setMistakes(value => value + 1)
      setFeedback('That is not your assigned meeting sector. Use north and leave the center corridor open.')
    }
  }

  function restart() {
    setStage('partner')
    setMistakes(0)
    setFeedback('You carry 1 green and 3 red. Find the partner that brings the pair to exactly 4 green.')
  }

  return <main className="training-shell learn2d-runtime">
    <header className="training-header">
      <div>
        <p className="eyebrow">ENTOMBED SENTINELS · LEARN 2D</p>
        <h1>{scenario.name}</h1>
        <p className="lede">Read the composition, select the compatible partner, then execute the package-owned abstract plan.</p>
      </div>
      <button type="button" className="secondary" onClick={onExit}>Back to setup</button>
    </header>

    <section className="training-runtime-layout">
      <div className="learn2d-board" aria-label="Helical Toxins tactical diagram">
        <div className="learn2d-side acid-side"><span>ACID SIDE</span><b>Ula’tek</b></div>
        <button type="button" className="learn2d-region north" onClick={() => chooseSector('north-meeting-sector')} disabled={stage !== 'sector'}>
          North meeting sector
        </button>
        <div className="learn2d-corridor"><span>KEEP CLEAR</span></div>
        <button type="button" className="learn2d-region south" onClick={() => chooseSector('south-meeting-sector')} disabled={stage !== 'sector'}>
          South meeting sector
        </button>
        <div className="learn2d-side blood-side"><span>BLOOD SIDE</span><b>Lothraxion</b></div>
        <div className="learn2d-player-token">YOU<strong>1G · 3R</strong></div>
      </div>

      <div className="training-sidecar">
        <TrainingHud settings={hudSettings} mode="Learn 2D" objective={objective} status={feedback} />
        {stage === 'partner' && <section className="training-choice" aria-labelledby="partner-choice-title">
          <small>STEP 1 OF 2</small>
          <h2 id="partner-choice-title">Choose your partner</h2>
          {partnerOptions.map(partner => <button type="button" key={partner.id} onClick={() => choosePartner(partner.green)}>
            <strong>{partner.label}</strong><span>{partner.green} green · {partner.red} red</span>
          </button>)}
        </section>}
        {stage === 'sector' && <section className="training-choice">
          <small>STEP 2 OF 2</small>
          <h2>Move the pair</h2>
          <p>Select the assigned north sector directly on the diagram.</p>
        </section>}
        {stage === 'complete' && <section className="training-choice training-complete">
          <small>DRILL COMPLETE</small>
          <h2>Exact composition</h2>
          <p>{mistakes === 0 ? 'Clean solve.' : `${mistakes} incorrect decision${mistakes === 1 ? '' : 's'} reviewed.`}</p>
          <button type="button" onClick={restart}>Practice again</button>
        </section>}
      </div>
    </section>
  </main>
}
