import { createHash } from 'node:crypto'
import fs from 'node:fs'

// A short hash of the files' contents, for `?ver=` on CSS and JS URLs. The
// Worker caches those URLs for a year (worker/index.js), so the value must
// change only when a file changes: a new deploy of the same files keeps the
// cache.
//
// Results are cached by path and mtime, because every page asks for the same
// files and the Webamp bundle is about 1 MB.

const cache = new Map()

const hashFile = (file) => {
  const { mtimeMs } = fs.statSync(file)
  const cached = cache.get(file)
  if (cached?.mtimeMs === mtimeMs) return cached.hash
  const hash = createHash('sha256').update(fs.readFileSync(file)).digest('hex')
  cache.set(file, { mtimeMs, hash })
  return hash
}

export function assetVersion(...files) {
  const combined = createHash('sha256')
  for (const file of files) combined.update(hashFile(file))
  return combined.digest('hex').slice(0, 10)
}
