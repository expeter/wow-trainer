import { readdirSync, readFileSync, statSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const assets = resolve(root, 'dist/assets')
const files = readdirSync(assets)
const measure = pattern => {
  const name = files.find(file => pattern.test(file))
  if (!name) throw new Error(`Missing build artifact matching ${pattern}`)
  const bytes = statSync(resolve(assets, name)).size
  const gzipBytes = gzipSync(readFileSync(resolve(assets, name))).length
  return { name, bytes, gzipBytes }
}

const report = {
  shellJavaScript: measure(/^index-.*\.js$/),
  shellCss: measure(/^index-.*\.css$/),
  lazyThreeRenderer: measure(/^ThreeWorldRenderer-.*\.js$/),
}
const budgets = { shellJavaScript: 90_000, shellCss: 35_000, lazyThreeRenderer: 175_000 }
for (const [key, value] of Object.entries(report)) {
  const budget = budgets[key]
  console.log(`${key}: ${(value.bytes / 1024).toFixed(2)} KiB · ${(value.gzipBytes / 1024).toFixed(2)} KiB gzip · ${value.name}`)
  if (value.gzipBytes > budget) throw new Error(`${key} exceeds its ${(budget / 1024).toFixed(2)} KiB gzip budget`)
}
