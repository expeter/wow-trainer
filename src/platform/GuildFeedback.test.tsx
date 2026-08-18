import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import GuildFeedback from './GuildFeedback'

describe('guild feedback reporter', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 'FEEDBACK-20260818-120000-abcd1234' }), { status: 201, headers: { 'content-type': 'application/json' } })))
  })
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('submits text, context, and up to four raw screenshot payloads', async () => {
    const user = userEvent.setup()
    render(<GuildFeedback context={{ encounterId: 'sszorak', mode: 'train3d' }} />)
    await user.click(screen.getByRole('button', { name: 'Report bug' }))
    await user.type(screen.getByLabelText('What happened?'), 'Platform edge is wrong.')
    await user.type(screen.getByLabelText('Guild access code'), 'guild-code')
    const file = new File([new Uint8Array([137, 80, 78, 71])], 'boss.png', { type: 'image/png' })
    await user.upload(screen.getByLabelText('Add screenshots'), file)
    expect(await screen.findByText('boss.png')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Send report' }))
    expect(await screen.findByText(/FEEDBACK-20260818-120000-abcd1234/)).toBeVisible()
    const [, request] = vi.mocked(fetch).mock.calls[0]
    const payload = JSON.parse(String(request?.body))
    expect(payload).toMatchObject({ guildCode: 'guild-code', message: 'Platform edge is wrong.', context: { encounterId: 'sszorak', mode: 'train3d' } })
    expect(payload.screenshots).toHaveLength(1)
    expect(payload.screenshots[0]).toMatchObject({ name: 'boss.png', type: 'image/png' })
    expect(sessionStorage.getItem('midnight-s2-feedback-code')).toBe('guild-code')
  })

  it('keeps the form open and explains rejected access', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ error: 'Guild access code is not valid.' }), { status: 403, headers: { 'content-type': 'application/json' } }))
    const user = userEvent.setup()
    render(<GuildFeedback context={{ screen: 'setup' }} />)
    await user.click(screen.getByRole('button', { name: 'Report bug' }))
    await user.type(screen.getByLabelText('What happened?'), 'Something moved.')
    await user.type(screen.getByLabelText('Guild access code'), 'wrong')
    await user.click(screen.getByRole('button', { name: 'Send report' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Guild access code is not valid.')
    expect(screen.getByRole('dialog', { name: 'Report a problem' })).toBeVisible()
  })

  it('caps a selection at four screenshots before submission', async () => {
    const user = userEvent.setup()
    render(<GuildFeedback context={{ screen: 'setup' }} />)
    await user.click(screen.getByRole('button', { name: 'Report bug' }))
    const files = Array.from({ length: 5 }, (_, index) => new File([new Uint8Array([137, 80, 78, 71])], `boss-${index + 1}.png`, { type: 'image/png' }))
    await user.upload(screen.getByLabelText('Add screenshots'), files)
    expect(screen.getByText('4 / 4')).toBeVisible()
    expect(screen.queryByText('boss-5.png')).not.toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Only the first four screenshots are attached.')
    expect(screen.getByLabelText('Add screenshots')).toBeDisabled()
  })

  it('accepts screenshots pasted from the clipboard and dropped onto the form', async () => {
    const user = userEvent.setup()
    render(<GuildFeedback context={{ screen: 'setup' }} />)
    await user.click(screen.getByRole('button', { name: 'Report bug' }))
    const dialog = screen.getByRole('dialog', { name: 'Report a problem' })
    const pasteFile = new File([new Uint8Array([137, 80, 78, 71])], 'clipboard.png', { type: 'image/png' })
    fireEvent.paste(dialog, { clipboardData: { items: [{ kind: 'file', getAsFile: () => pasteFile }] } })
    expect(await screen.findByText('clipboard.png')).toBeVisible()

    const dropZone = screen.getByRole('group', { name: 'Screenshot attachments' })
    const dropFile = new File([new Uint8Array([255, 216, 255])], 'dropped.jpg', { type: 'image/jpeg' })
    fireEvent.dragEnter(dropZone, { dataTransfer: { types: ['Files'], dropEffect: 'none' } })
    expect(dropZone).toHaveClass('dragging')
    fireEvent.drop(dropZone, { dataTransfer: { types: ['Files'], files: [dropFile] } })
    expect(await screen.findByText('dropped.jpg')).toBeVisible()
    expect(dropZone).not.toHaveClass('dragging')
    expect(screen.getByText('2 / 4')).toBeVisible()
  })
})
