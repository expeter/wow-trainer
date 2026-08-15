import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import RuntimeOutcomeOverlay from './RuntimeOutcomeOverlay'

describe('runtime outcome overlay', () => {
  it('shows details and actions, then dismisses without invoking either action', () => {
    const retry = vi.fn()
    const exit = vi.fn()
    render(<RuntimeOutcomeOverlay resultKey="attempt-1" kind="wipe" reason="Wrong partner" advice="Read the attached icons." onRetry={retry} onExit={exit} />)
    expect(screen.getByRole('dialog', { name: 'Drill wipe summary' })).toBeVisible()
    fireEvent.click(screen.getByText('Details'))
    expect(screen.getByText('Read the attached icons.')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss outcome summary' }))
    expect(screen.queryByRole('dialog', { name: 'Drill wipe summary' })).not.toBeInTheDocument()
    expect(retry).not.toHaveBeenCalled()
    expect(exit).not.toHaveBeenCalled()
  })

  it('provides retry and setup-exit actions', () => {
    const retry = vi.fn()
    const exit = vi.fn()
    render(<RuntimeOutcomeOverlay resultKey="attempt-2" kind="success" reason="Toxins resolved" advice="Review and repeat." onRetry={retry} onExit={exit} />)
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    fireEvent.click(screen.getByRole('button', { name: 'Change setup' }))
    expect(retry).toHaveBeenCalledOnce()
    expect(exit).toHaveBeenCalledOnce()
  })
})
