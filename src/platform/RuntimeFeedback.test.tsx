import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import RuntimeFeedback from './RuntimeFeedback'

describe('runtime feedback corners', () => {
  it('reveals corrective information and leaves points unscored without a scoring contract', () => {
    render(<RuntimeFeedback elapsed={4.2} failures={[{
      id: 'wrong-ground-1', code: 'wrong-ground', time: 3.8,
      label: 'Entered the wrong rune', advice: 'Match the attached aura icon.',
    }]} />)

    expect(screen.getByRole('complementary', { name: 'Points' })).toHaveTextContent('Not scored')
    fireEvent.click(screen.getByRole('button', { name: 'Help for Entered the wrong rune' }))
    expect(screen.getByRole('status')).toHaveTextContent('Match the attached aura icon.')
  })
})
