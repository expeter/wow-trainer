import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Season2App from './Season2App'

describe('Midnight Season 2 bootstrap shell', () => {
  afterEach(() => { cleanup(); vi.restoreAllMocks() })
  beforeEach(() => { localStorage.clear(); window.history.replaceState(null, '', '/') })

  it('keeps the established six-section shell vocabulary around the discovered first encounter', async () => {
    render(<Season2App />)

    expect(screen.getByRole('heading', { name: 'Midnight Season 2 Trainer' })).toBeVisible()
    expect(await screen.findByRole('heading', { name: "Nek'zali the Soulcoiler" })).toBeVisible()
    const navigation = screen.getByRole('navigation', { name: 'Setup sections' })
    expect(within(navigation).getAllByRole('button')).toHaveLength(7)
    expect(within(navigation).getByRole('button', { name: 'Tactical plan' })).toBeVisible()
  })

  it('presents 2D and 3D as separate launchable runtimes', async () => {
    render(<Season2App />)

    const selector = await screen.findByRole('navigation', { name: 'Boss fight selector' })
    fireEvent.click(within(selector).getByRole('button', { name: /Entombed Sentinels/ }))
    const sentinels = screen.getByRole('heading', { name: 'Entombed Sentinels' }).closest('article')!
    expect(within(sentinels).getByRole('button', { name: 'Launch Entombed Sentinels 2D' })).toHaveTextContent('2D')
    expect(within(sentinels).getByRole('button', { name: 'Launch Entombed Sentinels 3D' })).toHaveTextContent('3D')
    expect(screen.getByRole('button', { name: 'Launch Entombed Sentinels 2D' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Launch Entombed Sentinels 3D' })).toBeEnabled()
    const catalogue = screen.getByLabelText('Encounter catalogue')
    expect(within(catalogue).getByRole('heading', { name: 'Entombed Sentinels' })).toBeVisible()
    expect(within(catalogue).getByRole('navigation', { name: 'Boss fight selector' })).toBeVisible()
  })

  it('opens package-owned fight tactics and keeps research-only bosses honest', async () => {
    render(<Season2App />)

    const selector = await screen.findByRole('navigation', { name: 'Boss fight selector' })
    fireEvent.click(screen.getByRole('button', { name: "Read Nek'zali the Soulcoiler tactics" }))
    const tactics = screen.getByRole('dialog', { name: "Nek'zali the Soulcoiler" })
    const guidance = within(tactics).getByText('What to do').closest('section')!
    expect(within(guidance).getByText('Soulcoil Well')).toBeVisible()
    expect(within(guidance).getByText('Stay clear of the Well and stop spirits or adds from reaching it.')).toBeVisible()
    expect(within(tactics).getByText('Soulcoiler Initiation')).toBeVisible()
    expect(within(tactics).getByText('Fight flow and responsibilities')).toBeVisible()
    expect(within(tactics).getByText('Carry Possession Barrage away from the raid, then swap Hollowing Strikes without dragging Nek’zali through the room.')).toBeVisible()
    expect(within(tactics).getByText('Enter with the assigned half, hold the Drowned Echo, and interrupt Disruption while avoiding Swirling Spirits.')).toBeVisible()
    fireEvent.click(within(tactics).getByText('Spell reference · 13'))
    expect(within(tactics).getByRole('link', { name: 'Essence Rend on Wowhead' })).toHaveAttribute('href', 'https://www.wowhead.com/ptr/search?q=Essence%20Rend')
    fireEvent.click(within(tactics).getByRole('button', { name: 'Close tactic breakdown' }))

    fireEvent.click(within(selector).getByRole('button', { name: /Ula'tek/ }))
    fireEvent.click(screen.getByRole('button', { name: "Read Ula'tek tactics" }))
    expect(screen.getByRole('dialog', { name: "Ula'tek" })).toHaveTextContent('No maintained tactic breakdown yet')
  })

  it('uses one compact boss selector and only expands the selected encounter', async () => {
    render(<Season2App />)
    const selector = await screen.findByRole('navigation', { name: 'Boss fight selector' })
    expect(within(selector).getAllByRole('button')).toHaveLength(8)
    expect(within(selector).getByText('Boss order')).toBeVisible()
    expect(selector.querySelectorAll('[data-boss-portrait]')).toHaveLength(8)
    expect(within(selector).getByRole('button', { name: /Entombed Sentinels/ })).toHaveAttribute('data-path-stage', 'branch-one-upper')
    expect(within(selector).getByRole('button', { name: /The Lost Explorers/ })).toHaveAttribute('data-path-stage', 'branch-one-lower')
    expect(within(selector).getByRole('button', { name: /The Twin Fangs/ })).toHaveAttribute('data-path-stage', 'convergence')
    expect(document.querySelectorAll('.season2-selected-encounter h3')).toHaveLength(1)

    fireEvent.click(within(selector).getByRole('button', { name: /Vashnik the Malignant/ }))
    expect(screen.getByRole('heading', { name: 'Vashnik the Malignant' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Launch Vashnik the Malignant 2D' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Launch Vashnik the Malignant 3D' })).toBeEnabled()
  })

  it('loads the reconciled Vashnik Learn 2D full fight', async () => {
    render(<Season2App />)
    const selector = await screen.findByRole('navigation', { name: 'Boss fight selector' })
    fireEvent.click(within(selector).getByRole('button', { name: /Vashnik the Malignant/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Launch Vashnik the Malignant 2D' }))
    expect(await screen.findByRole('heading', { name: 'Vashnik the Malignant full fight' })).toBeVisible()
    expect(screen.getByLabelText('Vashnik three-fountain raid-plan training arena')).toBeVisible()
    expect(screen.getByRole('dialog', { name: 'Vashnik encounter setup' })).toHaveTextContent('Flame + Shadow, Shadow + Blood, Blood + Flame')
  })

  it('loads the single Sentinels Learn 2D full fight', async () => {
    render(<Season2App />)
    const selector = await screen.findByRole('navigation', { name: 'Boss fight selector' })
    fireEvent.click(within(selector).getByRole('button', { name: /Entombed Sentinels/ }))

    fireEvent.click(screen.getByRole('button', { name: 'Launch Entombed Sentinels 2D' }))
    expect(await screen.findByRole('heading', { name: 'Entombed Sentinels full fight' })).toBeVisible()
    expect(screen.getByLabelText('Entombed Sentinels raid-plan training arena')).toBeVisible()
    expect(screen.getByRole('dialog', { name: 'Entombed Sentinels encounter setup' })).toHaveTextContent('Protovenom pairing occurs before Stasis')
  })

  it('persists independent Learn 2D and Train 3D movement bindings', async () => {
    const view = render(<Season2App />)
    fireEvent.click(screen.getByRole('button', { name: 'Keys & Mouse' }))
    fireEvent.click(screen.getByRole('button', { name: 'Rebind Learn 2D movement forward, current W' }))
    fireEvent.keyDown(window, { code: 'ArrowUp' })

    expect(screen.getByRole('button', { name: 'Rebind Learn 2D movement forward, current ArrowUp' })).toHaveTextContent('ArrowUp')
    expect(screen.getByRole('button', { name: 'Rebind Train 3D movement forward, current W' })).toHaveTextContent('W')
    const saved = JSON.parse(localStorage.getItem('midnight-s2:training-settings:v1') || '{}')
    expect(saved.keyBindings.learn2d.forward).toBe('ArrowUp')
    expect(saved.keyBindings.train3d.forward).toBe('KeyW')
    view.unmount()
    render(<Season2App />)
    fireEvent.click(screen.getByRole('button', { name: 'Keys & Mouse' }))
    expect(screen.getByRole('button', { name: 'Rebind Learn 2D movement forward, current ArrowUp' })).toHaveTextContent('ArrowUp')
    expect(screen.getByRole('button', { name: 'Rebind Train 3D movement forward, current W' })).toHaveTextContent('W')
  })

  it('separates both movement layouts, shared actions, and mouse camera settings', () => {
    render(<Season2App />)
    fireEvent.click(screen.getByRole('button', { name: 'Keys & Mouse' }))
    const bindings = screen.getByRole('group', { name: 'Input bindings' })
    expect(within(bindings).getByRole('region', { name: 'Learn 2D movement' })).toBeVisible()
    expect(within(bindings).getByRole('region', { name: 'Train 3D movement' })).toBeVisible()
    expect(within(bindings).getByRole('region', { name: 'Mouse camera' })).toBeVisible()
    expect(within(bindings).getByRole('region', { name: 'Shared actions' })).toBeVisible()
  })

  it('keeps build provenance on setup and uses scoring-ready runtime corners', async () => {
    render(<Season2App />)
    expect(screen.getByLabelText('Build information')).toBeVisible()
    const selector = await screen.findByRole('navigation', { name: 'Boss fight selector' })
    fireEvent.click(within(selector).getByRole('button', { name: /Entombed Sentinels/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Launch Entombed Sentinels 2D' }))
    expect(await screen.findByRole('heading', { name: 'Entombed Sentinels full fight' })).toBeVisible()
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

  it('shows public aggregate statistics without connecting to the legacy service', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async input => String(input).includes('/v2/statistics/summary') ? new Response(JSON.stringify({
        generatedAt: '2026-08-18T12:00:00.000Z', pageViews: 14, pageViews7d: 9, attempts7d: 4,
        started: 6, finished: 5, completed: 3, failed: 2, exited: 0, authenticated: 1,
        modes: [{ modeId: 'learn2d', started: 4, completed: 2, failed: 1 }, { modeId: 'train3d', started: 2, completed: 1, failed: 1 }],
        encounters: [{ encounterId: 'sszorak', encounterName: 'Sszorak', started: 6, completed: 3, failed: 2 }],
      }), { status: 200, headers: { 'content-type': 'application/json' } }) : new Response(JSON.stringify({ version: '0.10.0' }), { status: 200 }))
    render(<Season2App />)
    fireEvent.click(screen.getByRole('button', { name: 'Statistics' }))

    expect(await screen.findByRole('heading', { name: 'Season 2 usage statistics' })).toBeVisible()
    expect(await screen.findByText('14')).toBeVisible()
    expect(screen.getByText('Learn 2D')).toBeVisible()
    expect(screen.getByText('Sszorak')).toBeVisible()
    expect(screen.getByText(/not unique players/)).toBeVisible()
    expect(document.body.textContent).not.toContain('/v1/auth')
  })

  it('labels Test, Easy, Normal, and Hard as trainer tolerance rather than raid difficulty', async () => {
    render(<Season2App />)
    await screen.findByRole('navigation', { name: 'Boss fight selector' })
    const group = screen.getByRole('group', { name: 'Trainer difficulty' })
    expect(within(group).getByRole('button', { name: 'Normal' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(group).getByRole('button', { name: 'Test' })).toBeVisible()
    expect(group).toHaveTextContent('Encounter mechanics stay fixed')
  })

  it('selects one encounter and one important phase in the actor planner', async () => {
    render(<Season2App />)
    await screen.findByRole('navigation', { name: 'Boss fight selector' })
    fireEvent.click(screen.getByRole('button', { name: 'Tactical plan' }))
    expect(screen.getByRole('combobox', { name: 'Encounter' })).toHaveValue('nekzali')
    expect(screen.getByRole('navigation', { name: "Nek'zali the Soulcoiler planner phases" })).toBeVisible()
    expect(screen.getByRole('button', { name: "Move NEK'ZALI in Phase 1" })).toBeVisible()
    expect(screen.getAllByRole('button', { name: /Move [THMR][0-9]+ in Phase 1/ })).toHaveLength(20)
    fireEvent.click(screen.getByRole('button', { name: 'Echo intermission' }))
    expect(screen.getByRole('button', { name: 'Move ECHO N in Echo intermission' })).toBeVisible()
  })
})
