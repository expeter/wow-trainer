import userEvent from '@testing-library/user-event'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import HudLayoutPreview from './HudLayoutPreview'
import { DEFAULT_HUD_LAYOUT, DEFAULT_TRAINING_SETTINGS } from './trainingSettings'

describe('HUD layout preview', () => {
  afterEach(cleanup)
  it('shows configured boxes and resets their positions', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<HudLayoutPreview settings={{ ...DEFAULT_TRAINING_SETTINGS.hud, showAuras: false }} onChange={onChange} />)
    expect(screen.queryByRole('button', { name: 'Buff / debuff state' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Player health + cooldowns' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Reset HUD positions' }))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ layout: DEFAULT_HUD_LAYOUT }))
  })

  it('keeps drag updates local until release and supports precise key nudging', () => {
    const onChange = vi.fn()
    render(<HudLayoutPreview settings={DEFAULT_TRAINING_SETTINGS.hud} onChange={onChange} />)
    const stage = screen.getByLabelText('Draggable HUD preview')
    vi.spyOn(stage, 'getBoundingClientRect').mockReturnValue({ x: 0, y: 0, left: 0, top: 0, right: 500, bottom: 400, width: 500, height: 400, toJSON: () => ({}) })
    const player = screen.getByRole('button', { name: 'Player health + cooldowns' })
    Object.defineProperties(player, { setPointerCapture: { value: vi.fn() }, hasPointerCapture: { value: () => false } })
    fireEvent.pointerDown(player, { pointerId: 1, clientX: 105, clientY: 212 })
    fireEvent.pointerMove(player, { pointerId: 1, clientX: 200, clientY: 240 })
    expect(onChange).not.toHaveBeenCalled()
    expect(player).toHaveStyle({ left: '40%', top: '60%' })
    fireEvent.pointerUp(player, { pointerId: 1, clientX: 200, clientY: 240 })
    expect(onChange).toHaveBeenCalledTimes(1)
    fireEvent.keyDown(player, { key: 'ArrowRight' })
    expect(onChange).toHaveBeenCalledTimes(2)
  })
})
