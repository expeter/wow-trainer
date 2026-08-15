import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ContractActionBar from './ContractActionBar'
import { DEFAULT_TRAINING_SETTINGS } from './trainingSettings'

describe('contract action bar', () => {
  it('keeps taunt role-gated and gives tank shield a repeating cooldown', async () => {
    const user = userEvent.setup()
    render(<ContractActionBar keyBindings={DEFAULT_TRAINING_SETTINGS.keyBindings} eventIndex={0} />)
    expect(screen.getByRole('button', { name: /Taunt/ })).toBeDisabled()
    await user.selectOptions(screen.getByLabelText('Contract player role'), 'tank')
    await user.click(screen.getByRole('button', { name: /Shield/ }))
    expect(screen.getByRole('button', { name: /Shield/ })).toHaveTextContent('20.0s')
    expect(screen.getByRole('button', { name: /Taunt/ })).toBeEnabled()
  })
})
