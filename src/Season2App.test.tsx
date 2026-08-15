import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import Season2App from './Season2App'

describe('Midnight Season 2 bootstrap shell', () => {
  afterEach(cleanup)

  it('keeps the established six-section shell vocabulary around the discovered first encounter', async () => {
    render(<Season2App />)

    expect(screen.getByRole('heading', { name: 'Midnight Season 2 Trainer' })).toBeVisible()
    expect(await screen.findByRole('heading', { name: 'Entombed Sentinels' })).toBeVisible()
    const navigation = screen.getByRole('navigation', { name: 'Setup sections' })
    expect(within(navigation).getAllByRole('button')).toHaveLength(6)
    expect(within(navigation).getByRole('button', { name: 'Tactical plan' })).toBeVisible()
  })

  it('presents Learn 2D and Train 3D as separate pending runtimes', async () => {
    render(<Season2App />)

    await screen.findByRole('heading', { name: 'Entombed Sentinels' })
    expect(screen.getByRole('heading', { name: 'Learn 2D' })).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Train 3D' })).toBeVisible()
    expect(screen.getAllByRole('button', { name: 'Runtime pending' })).toHaveLength(2)
    expect(screen.getAllByRole('button', { name: 'Runtime pending' }).every(button => button.hasAttribute('disabled'))).toBe(true)
  })

  it('keeps online features deferred and disconnected from the legacy service', () => {
    render(<Season2App />)
    fireEvent.click(screen.getByRole('button', { name: 'Statistics' }))

    expect(screen.getByRole('heading', { name: 'Statistics are intentionally offline' })).toBeVisible()
    expect(screen.getByText(/API \/v2/)).toBeVisible()
    expect(document.body.textContent).not.toContain('/v1/auth')
  })
})
