#!/usr/bin/env node

/**
 * Download the site images in images.manifest.json from the public R2 domain
 * to src/images/ and src/img-optimized/. Use it on a fresh clone. No
 * Cloudflare login is necessary.
 *
 * Files that exist locally are skipped. Derivative names hold a content hash,
 * so a local derivative is always current. An original can change under the
 * same name; use --force to download the originals again.
 *
 * Usage:
 *   npm run images:download
 *   npm run images:download -- --originals   # originals only (dev redirects the rest)
 *   npm run images:download -- --force       # download the originals again
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getManifestFiles, R2, readManifest } from '../lib/images.js'

const __filename = fileURLToPath(import.meta.url)
const ROOT = path.join(path.dirname(__filename), '..')

const ORIGINALS_ONLY = process.argv.includes('--originals')
const FORCE = process.argv.includes('--force')
const CONCURRENCY = 16

const files = getManifestFiles(readManifest(ROOT), ROOT)
  .filter((file) => !ORIGINALS_ONLY || file.isOriginal)
  .filter((file) => !fs.existsSync(file.file) || (FORCE && file.isOriginal))

console.log(`${files.length} files to download`)

const download = async ({ url, file }) => {
  const response = await fetch(`${R2.PUBLIC_URL}${url}`)
  if (!response.ok) throw new Error(`GET ${url} returned ${response.status}`)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  // Write to a temporary name first, so an interrupted run leaves no partial
  // file that the next run would skip.
  const tmp = `${file}.download`
  fs.writeFileSync(tmp, Buffer.from(await response.arrayBuffer()))
  fs.renameSync(tmp, file)
}

const errors = []
for (let i = 0; i < files.length; i += CONCURRENCY) {
  const batch = files.slice(i, i + CONCURRENCY)
  const results = await Promise.allSettled(batch.map(download))
  for (const result of results) {
    if (result.status === 'rejected') errors.push(result.reason.message)
  }
  const done = Math.min(i + CONCURRENCY, files.length)
  if (done % 320 < CONCURRENCY || done === files.length) {
    console.log(`Downloaded ${done - errors.length} of ${files.length}`)
  }
}

if (errors.length) {
  console.error(errors.join('\n'))
  console.error(`\n${errors.length} download(s) failed`)
  process.exit(1)
}
