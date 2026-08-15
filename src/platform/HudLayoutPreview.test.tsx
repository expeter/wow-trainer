import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import HudLayoutPreview from './HudLayoutPreview'
import { DEFAULT_HUD_LAYOUT, DEFAULT_TRAINING_SETTINGS } from './trainingSettings'

describe('HUD layout preview', () => {
  it('shows configured boxes and resets their positions', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<HudLayoutPreview settings={{ ...DEFAULT_TRAINING_SETTINGS.hud, showAuras: false }} onChange={onChange} />)
    expect(screen.queryByRole('button', { name: 'Buff / debuff state' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Player health + cooldowns' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Reset HUD positions' }))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ layout: DEFAULT_HUD_LAYOUT }))
  })
})
