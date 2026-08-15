import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import BuildStatus from './BuildStatus'

describe('Season 2 build status', () => {
  afterEach(() => vi.restoreAllMocks())

  it('shows exact build provenance and project links', () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 404 }))
    render(<BuildStatus />)
    expect(screen.getByLabelText('Build information')).toHaveTextContent(/^v\d+\.\d+\.\d+ · /)
    expect(screen.getByRole('link', { name: 'Changelog ↗' })).toHaveAttribute('href', expect.stringContaining('/wow-trainer/blob/main/CHANGELOG.md'))
  })

  it('offers to load a different deployed revision and can defer it', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ version: '9.9.9', revision: 'newrev1', builtAt: new Date().toISOString() }), { status: 200 }))
    const user = userEvent.setup()
    render(<BuildStatus />)
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('New trainer version available'))
    expect(screen.getByRole('button', { name: 'Load new version' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Later' }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
