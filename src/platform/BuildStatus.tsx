import { useEffect, useState } from 'react'
import { PRODUCT } from '../product'

interface VersionManifest { version: string; revision: string; builtAt: string }

const APP_VERSION = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.9.1'
const BUILD_TIME = typeof __BUILD_TIME__ === 'string' ? __BUILD_TIME__ : new Date().toISOString()
const GIT_REVISION = typeof __GIT_REVISION__ === 'string' ? __GIT_REVISION__ : 'unknown'

const RECENT_CHANGES = [
  'WoW-calibrated Train 3D movement and a larger contract arena.',
  'Restored mouse controls, smoother rendering, and direct camera follow.',
  'Extracted the reviewed in-arena HUD and pre-pull movement-lab flow.',
]

export default function BuildStatus() {
  const [availableVersion, setAvailableVersion] = useState<VersionManifest | null>(null)
  const [dismissedRevision, setDismissedRevision] = useState('')
  const [copyStatus, setCopyStatus] = useState('')
  const built = new Date(BUILD_TIME)
  const timestamp = Number.isNaN(built.getTime()) ? BUILD_TIME : `${built.toISOString().slice(0, 16).replace('T', ' ')} UTC`
  const buildLabel = `v${APP_VERSION} · ${GIT_REVISION} · ${timestamp}`
  const changelogUrl = `${PRODUCT.repositoryUrl}/blob/main/CHANGELOG.md`
  const issueUrl = `${PRODUCT.repositoryUrl}/issues/new`

  useEffect(() => {
    let active = true
    async function checkForUpdate() {
      try {
        const response = await fetch(new URL('version.json', document.baseURI), { cache: 'no-store' })
        if (!response.ok) return
        const manifest = await response.json() as VersionManifest
        if (active && manifest.revision && manifest.revision !== 'unknown' && manifest.revision !== GIT_REVISION) setAvailableVersion(manifest)
      } catch { /* Offline development and tests may not expose a manifest. */ }
    }
    void checkForUpdate()
    const timer = window.setInterval(checkForUpdate, 5 * 60 * 1000)
    return () => { active = false; window.clearInterval(timer) }
  }, [])

  async function copyBuildVersion() {
    try {
      await navigator.clipboard.writeText(buildLabel)
      setCopyStatus('Copied')
    } catch { setCopyStatus('Copy failed') }
    window.setTimeout(() => setCopyStatus(''), 1600)
  }

  const showUpdate = availableVersion && availableVersion.revision !== dismissedRevision
  return <>
    {showUpdate && <aside className="update-banner" role="alert"><span><strong>New trainer version available</strong> · {availableVersion.revision}</span><details><summary>What’s changed</summary><ul>{RECENT_CHANGES.map(change => <li key={change}>{change}</li>)}</ul><a href={changelogUrl} target="_blank" rel="noreferrer">Full changelog ↗</a></details><button type="button" onClick={() => window.location.reload()}>Load new version</button><button type="button" className="secondary" onClick={() => setDismissedRevision(availableVersion.revision)}>Later</button></aside>}
    <aside className="build-indicator" aria-label="Build information" title={`Built ${Number.isNaN(built.getTime()) ? BUILD_TIME : built.toISOString()}`}>
      <button className="build-copy" type="button" onClick={() => void copyBuildVersion()} title="Copy build version">{copyStatus || `${buildLabel} · Copy`}</button>
      <nav aria-label="Project links"><a href={PRODUCT.repositoryUrl} target="_blank" rel="noreferrer">GitHub ↗</a><a className="changelog-link" href={changelogUrl} target="_blank" rel="noreferrer">Changelog ↗</a><a className="issue-link" href={issueUrl} target="_blank" rel="noreferrer">File an issue ↗</a></nav>
    </aside>
  </>
}
