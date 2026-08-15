import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import Season2App from './Season2App'

describe('Midnight Season 2 bootstrap shell', () => {
  afterEach(cleanup)
  beforeEach(() => localStorage.clear())

  it('keeps the established six-section shell vocabulary around the discovered first encounter', async () => {
    render(<Season2App />)

    expect(screen.getByRole('heading', { name: 'Midnight Season 2 Trainer' })).toBeVisible()
    expect(await screen.findByRole('heading', { name: 'Entombed Sentinels' })).toBeVisible()
    const navigation = screen.getByRole('navigation', { name: 'Setup sections' })
    expect(within(navigation).getAllByRole('button')).toHaveLength(6)
    expect(within(navigation).getByRole('button', { name: 'Tactical plan' })).toBeVisible()
  })

  it('presents Learn 2D and Train 3D as separate launchable runtimes', async () => {
    render(<Season2App />)

    await screen.findByRole('heading', { name: 'Entombed Sentinels' })
    expect(screen.getByRole('heading', { name: 'Learn 2D' })).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Train 3D' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Launch Learn 2D' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Launch Train 3D' })).toBeEnabled()
  })

  it('loads the package-owned Learn 2D runtime and completes the first toxin decision', async () => {
    render(<Season2App />)
    await screen.findByRole('heading', { name: 'Entombed Sentinels' })

    fireEvent.click(screen.getByRole('button', { name: 'Launch Learn 2D' }))
    expect(await screen.findByRole('heading', { name: 'Helical Toxins tutorial' })).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: /Scout B/ }))
    fireEvent.click(screen.getByRole('button', { name: 'North meeting sector' }))

    expect(screen.getByText('DRILL COMPLETE')).toBeVisible()
    expect(screen.getByText('Clean solve.')).toBeVisible()
  })

  it('persists unique movement bindings and exposes the configured keys to the shell', async () => {
    const view = render(<Season2App />)
    fireEvent.click(screen.getByRole('button', { name: 'Keys & Mouse' }))
    fireEvent.click(screen.getByRole('button', { name: 'Rebind forward, current W' }))
    fireEvent.keyDown(window, { code: 'ArrowUp' })

    expect(screen.getByRole('button', { name: 'Rebind forward, current ArrowUp' })).toHaveTextContent('ArrowUp')
    view.unmount()
    render(<Season2App />)
    fireEvent.click(screen.getByRole('button', { name: 'Keys & Mouse' }))
    expect(screen.getByRole('button', { name: 'Rebind forward, current ArrowUp' })).toHaveTextContent('ArrowUp')
  })

  it('updates the shared HUD preview from persisted visibility settings', () => {
    render(<Season2App />)
    fireEvent.click(screen.getByRole('button', { name: 'HUD' }))
    expect(within(screen.getByRole('complementary', { name: 'Training HUD' })).getByText('Time')).toBeVisible()

    fireEvent.click(screen.getByRole('checkbox', { name: 'Show timer' }))
    expect(within(screen.getByRole('complementary', { name: 'Training HUD' })).queryByText('Time')).not.toBeInTheDocument()
  })

  it('keeps online features deferred and disconnected from the legacy service', () => {
    render(<Season2App />)
    fireEvent.click(screen.getByRole('button', { name: 'Statistics' }))

    expect(screen.getByRole('heading', { name: 'Statistics are intentionally offline' })).toBeVisible()
    expect(screen.getAllByText(/API \/v2/)).toHaveLength(2)
    expect(document.body.textContent).not.toContain('/v1/auth')
  })
})
