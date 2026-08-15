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
    const catalogue = screen.getByLabelText('Encounter catalogue')
    expect(within(catalogue).getByRole('heading', { name: 'Entombed Sentinels' })).toBeVisible()
    expect(within(catalogue).getAllByText('Coming soon').length).toBeGreaterThan(0)
  })

  it('loads the movement-driven Learn 2D runtime with icon-only character toxins', async () => {
    render(<Season2App />)
    await screen.findByRole('heading', { name: 'Entombed Sentinels' })

    fireEvent.click(screen.getByRole('button', { name: 'Launch Learn 2D' }))
    expect(await screen.findByRole('heading', { name: 'Helical Toxins tutorial' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Move forward' })).toBeVisible()
    expect(screen.getAllByRole('img')).toHaveLength(4)
    expect(screen.getByLabelText('Controlled character with 1 green and 3 red toxins')).toBeVisible()
    expect(screen.queryByText(/1G|3R/)).not.toBeInTheDocument()
  })

  it('persists unique movement bindings and exposes the configured keys to the shell', async () => {
    const view = render(<Season2App />)
    fireEvent.click(screen.getByRole('button', { name: 'Keys & Mouse' }))
    fireEvent.click(screen.getByRole('button', { name: 'Rebind forward, current W' }))
    fireEvent.keyDown(window, { code: 'ArrowUp' })

    expect(screen.getByRole('button', { name: 'Rebind forward, current ArrowUp' })).toHaveTextContent('ArrowUp')
    expect(JSON.parse(localStorage.getItem('midnight-s2:training-settings:v1') || '{}').keyBindings.forward).toBe('ArrowUp')
    view.unmount()
    render(<Season2App />)
    fireEvent.click(screen.getByRole('button', { name: 'Keys & Mouse' }))
    expect(screen.getByRole('button', { name: 'Rebind forward, current ArrowUp' })).toHaveTextContent('ArrowUp')
  })

  it('keeps build provenance on setup and uses scoring-ready runtime corners', async () => {
    render(<Season2App />)
    expect(screen.getByLabelText('Build information')).toBeVisible()
    await screen.findByRole('heading', { name: 'Entombed Sentinels' })
    fireEvent.click(screen.getByRole('button', { name: 'Launch Learn 2D' }))
    expect(await screen.findByRole('heading', { name: 'Helical Toxins tutorial' })).toBeVisible()
    expect(screen.queryByLabelText('Build information')).not.toBeInTheDocument()
    expect(screen.getByRole('complementary', { name: 'Recent failures' })).toHaveTextContent('No failures yet')
    expect(screen.getByRole('complementary', { name: 'Points' })).toHaveTextContent('Not scored')
  })

  it('keeps mechanic and timer mandatory while optional HUD frames remain configurable', () => {
    render(<Season2App />)
    fireEvent.click(screen.getByRole('button', { name: 'HUD' }))
    expect(screen.queryByRole('complementary', { name: 'Training HUD' })).not.toBeInTheDocument()
    expect(screen.getByLabelText('Draggable HUD preview')).toBeVisible()

    expect(screen.getByRole('button', { name: 'Mechanic / action display' })).toBeVisible()
    expect(screen.queryByRole('checkbox', { name: 'Show objective' })).not.toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: 'Show timer' })).not.toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: 'Show position' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('checkbox', { name: 'Show boss health' }))
    expect(screen.queryByRole('button', { name: 'Boss health' })).not.toBeInTheDocument()
  })

  it('keeps online features deferred and disconnected from the legacy service', () => {
    render(<Season2App />)
    fireEvent.click(screen.getByRole('button', { name: 'Statistics' }))

    expect(screen.getByRole('heading', { name: 'Statistics are intentionally offline' })).toBeVisible()
    expect(screen.getAllByText(/API \/v2/)).toHaveLength(2)
    expect(document.body.textContent).not.toContain('/v1/auth')
  })
})
