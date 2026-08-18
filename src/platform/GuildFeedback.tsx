import { useEffect, useRef, useState, type ChangeEvent, type ClipboardEvent, type DragEvent, type FormEvent, type KeyboardEvent } from 'react'

const FEEDBACK_API_URL = (import.meta.env.VITE_FEEDBACK_API_URL || 'https://api.asgard.website').replace(/\/$/, '')
const CODE_STORAGE_KEY = 'midnight-s2-feedback-code'
const MAX_SCREENSHOTS = 4
const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024
const ACCEPTED_SCREENSHOTS = new Set(['image/png', 'image/jpeg', 'image/webp'])
const APP_VERSION = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'development'
const GIT_REVISION = typeof __GIT_REVISION__ === 'string' ? __GIT_REVISION__ : 'unknown'

interface ScreenshotDraft { file: File; dataUrl: string; name: string }
export type FeedbackContext = Record<string, string | number | boolean | undefined>

function readDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Screenshot could not be read.')))
    reader.addEventListener('error', () => reject(new Error('Screenshot could not be read.')))
    reader.readAsDataURL(file)
  })
}

export default function GuildFeedback({ context }: { context: FeedbackContext }) {
  const [open, setOpen] = useState(false)
  const [guildCode, setGuildCode] = useState(() => sessionStorage.getItem(CODE_STORAGE_KEY) ?? '')
  const [message, setMessage] = useState('')
  const [screenshots, setScreenshots] = useState<ScreenshotDraft[]>([])
  const [status, setStatus] = useState<'idle' | 'submitting' | 'sent'>('idle')
  const [notice, setNotice] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const launchButton = useRef<HTMLButtonElement>(null)
  const messageField = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (open) window.setTimeout(() => messageField.current?.focus(), 0)
  }, [open])

  function close() {
    if (status === 'submitting') return
    setOpen(false)
    window.setTimeout(() => launchButton.current?.focus(), 0)
  }

  async function appendScreenshots(files: readonly File[]) {
    setNotice('')
    const available = MAX_SCREENSHOTS - screenshots.length
    const selected = files.slice(0, available)
    const invalid = selected.find(file => !ACCEPTED_SCREENSHOTS.has(file.type) || file.size > MAX_SCREENSHOT_BYTES)
    if (invalid) {
      setNotice('Screenshots must be PNG, JPEG, or WebP and no larger than 5 MiB each.')
      return
    }
    try {
      const drafts = await Promise.all(selected.map(async (file, index) => ({
        file,
        dataUrl: await readDataUrl(file),
        name: file.name || `pasted-screenshot-${screenshots.length + index + 1}.${file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1]}`,
      })))
      setScreenshots(current => [...current, ...drafts].slice(0, MAX_SCREENSHOTS))
      if (files.length > available) setNotice('Only the first four screenshots are attached.')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'A screenshot could not be read.')
    }
  }

  async function addScreenshots(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    await appendScreenshots(files)
  }

  function pasteScreenshots(event: ClipboardEvent<HTMLElement>) {
    const files = Array.from(event.clipboardData.items).filter(item => item.kind === 'file').map(item => item.getAsFile()).filter((file): file is File => Boolean(file))
    if (!files.length) return
    event.preventDefault()
    void appendScreenshots(files)
  }

  function dragScreenshots(event: DragEvent<HTMLElement>) {
    if (!Array.from(event.dataTransfer.types).includes('Files')) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
    setDragActive(true)
  }

  function dropScreenshots(event: DragEvent<HTMLElement>) {
    if (!Array.from(event.dataTransfer.types).includes('Files')) return
    event.preventDefault()
    setDragActive(false)
    void appendScreenshots(Array.from(event.dataTransfer.files))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setStatus('submitting')
    setNotice('')
    try {
      const response = await fetch(`${FEEDBACK_API_URL}/v2/feedback`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          guildCode,
          message,
          screenshots: screenshots.map(({ file, dataUrl, name }) => ({ name, type: file.type, dataBase64: dataUrl.slice(dataUrl.indexOf(',') + 1) })),
          context: {
            ...context,
            revision: GIT_REVISION,
            version: APP_VERSION,
            url: window.location.href,
            userAgent: navigator.userAgent,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
          },
        }),
      })
      const result = await response.json().catch(() => ({})) as { id?: string; error?: string }
      if (!response.ok || !result.id) throw new Error(result.error ?? 'The report could not be sent.')
      sessionStorage.setItem(CODE_STORAGE_KEY, guildCode)
      setStatus('sent')
      setNotice(`Report received · ${result.id}`)
      setMessage('')
      setScreenshots([])
    } catch (error) {
      setStatus('idle')
      setNotice(error instanceof Error ? error.message : 'The report could not be sent.')
    }
  }

  function dialogKeyDown(event: KeyboardEvent) {
    event.stopPropagation()
    if (event.key === 'Escape') close()
  }

  return <>
    <button ref={launchButton} type="button" className="guild-feedback-launch" onClick={() => { setOpen(true); setStatus('idle'); setNotice('') }}>Report bug</button>
    {open && <div className="guild-feedback-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) close() }} onKeyDown={dialogKeyDown}>
      <section className="guild-feedback-dialog" role="dialog" aria-modal="true" aria-labelledby="guild-feedback-title" onPaste={pasteScreenshots}>
        <button type="button" className="guild-feedback-close" aria-label="Close feedback form" onClick={close}>×</button>
        <p className="eyebrow">GUILD PLAYTEST</p>
        <h2 id="guild-feedback-title">Report a problem</h2>
        {status === 'sent' ? <div className="guild-feedback-sent" role="status">
          <strong>Thank you — it is in the private test inbox.</strong>
          <p>{notice}</p>
          <button type="button" onClick={() => { setStatus('idle'); setNotice(''); messageField.current?.focus() }}>Send another</button>
        </div> : <form onSubmit={event => void submit(event)}>
          <label>What happened?
            <textarea ref={messageField} required minLength={1} maxLength={4000} value={message} onChange={event => setMessage(event.target.value)} placeholder="Boss, mode, mechanic, what you expected…" />
          </label>
          <label>Guild access code
            <input type="password" required autoComplete="off" aria-label="Guild access code" value={guildCode} onChange={event => setGuildCode(event.target.value)} />
            <small>Remembered only in this browser tab after a successful report.</small>
          </label>
          <div className={`guild-feedback-attachments${dragActive ? ' dragging' : ''}`} role="group" aria-label="Screenshot attachments" onDragEnter={dragScreenshots} onDragOver={dragScreenshots} onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragActive(false) }} onDrop={dropScreenshots}>
            <div><strong>Screenshots</strong><span>{screenshots.length} / {MAX_SCREENSHOTS}</span></div>
            {screenshots.length > 0 && <ul>{screenshots.map((screenshot, index) => <li key={`${screenshot.name}-${index}`}>
              <img src={screenshot.dataUrl} alt="" /><span>{screenshot.name}<small>{Math.ceil(screenshot.file.size / 1024)} KiB</small></span><button type="button" aria-label={`Remove ${screenshot.name}`} onClick={() => setScreenshots(current => current.filter((_, itemIndex) => itemIndex !== index))}>Remove</button>
            </li>)}</ul>}
            <p className="guild-feedback-drop-copy">Drop screenshots here or paste from your clipboard.</p>
            <label className={`guild-feedback-file${screenshots.length >= MAX_SCREENSHOTS ? ' disabled' : ''}`}>
              Choose screenshots
              <input type="file" aria-label="Add screenshots" accept="image/png,image/jpeg,image/webp" multiple disabled={screenshots.length >= MAX_SCREENSHOTS} onChange={event => void addScreenshots(event)} />
            </label>
            <small>Up to four PNG, JPEG, or WebP files, 5 MiB each. Files are stored as supplied for maintainer review.</small>
          </div>
          {notice && <p className="guild-feedback-notice" role="alert">{notice}</p>}
          <div className="guild-feedback-actions"><button type="button" className="secondary" onClick={close}>Cancel</button><button type="submit" disabled={status === 'submitting'}>{status === 'submitting' ? 'Sending…' : 'Send report'}</button></div>
        </form>}
      </section>
    </div>}
  </>
}
