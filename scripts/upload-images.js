#!/usr/bin/env node

/**
 * Upload site images to R2. Run through `npm run images`, which first builds
 * the site with IMAGES_PROCESS=1 to process src/images/ and write the manifest.
 *
 * Uploads every original and derivative in images.manifest.json that the
 * public R2 domain does not have yet. Derivative names hold a content hash,
 * so a file that exists is never sent again.
 *
 * Usage:
 *   npm run images                 # process, then upload
 *   node scripts/upload-images.js --dry-run
 *   node scripts/upload-images.js --local   # wrangler's local R2, for `wrangler dev`
 */

import fs from 'fs'
import os from 'os'
import path from 'path'
import { execFileSync } from 'child_process'
import { fileURLToPath } from 'url'
import {
  getManifestFiles,
  OPTIMIZED_URL_PATH,
  R2,
  readManifest,
  SOURCE_URL_PATH,
} from '../lib/images.js'

const __filename = fileURLToPath(import.meta.url)
const ROOT = path.join(path.dirname(__filename), '..')

const DRY_RUN = process.argv.includes('--dry-run')
const LOCAL = process.argv.includes('--local')
const CHECK_CONCURRENCY = 32

const CONTENT_TYPES = {
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
}

// Derivative names change when the content changes. An original keeps its
// name when it is replaced, so it gets a short cache lifetime.
const CACHE_CONTROL = {
  [SOURCE_URL_PATH]: 'public, max-age=86400',
  [OPTIMIZED_URL_PATH]: 'public, max-age=31536000, immutable',
}

const files = getManifestFiles(readManifest(ROOT), ROOT).map((file) => ({
  ...file,
  contentType: CONTENT_TYPES[path.extname(file.file).toLowerCase()],
  cacheControl:
    CACHE_CONTROL[file.isOriginal ? SOURCE_URL_PATH : OPTIMIZED_URL_PATH],
}))

const exists = async (url) => {
  const response = await fetch(`${R2.PUBLIC_URL}${url}`, { method: 'HEAD' })
  if (response.ok) return true
  if (response.status === 404) return false
  throw new Error(`HEAD ${R2.PUBLIC_URL}${url} returned ${response.status}`)
}

// The local R2 is empty at first, so --local uploads everything.
let uploads = files
if (!LOCAL) {
  uploads = []
  for (let i = 0; i < files.length; i += CHECK_CONCURRENCY) {
    const batch = files.slice(i, i + CHECK_CONCURRENCY)
    const results = await Promise.all(batch.map((file) => exists(file.url)))
    uploads.push(...batch.filter((_, index) => !results[index]))
  }
}

console.log(
  `${files.length} files in the manifest, ${uploads.length} to upload`
)
if (!uploads.length) process.exit(0)

const problems = uploads.flatMap((upload) => [
  ...(fs.existsSync(upload.file)
    ? []
    : [`${upload.url}: no local file at ${upload.file}`]),
  ...(upload.contentType ? [] : [`${upload.url}: unknown content type`]),
])
if (problems.length) {
  console.error(problems.join('\n'))
  process.exit(1)
}

if (DRY_RUN) {
  for (const upload of uploads) console.log(`${upload.key} <- ${upload.file}`)
  process.exit(0)
}

// `wrangler r2 bulk put` sets one content type and cache policy per call, so
// group the files by both.
const groups = Map.groupBy(
  uploads,
  (upload) => `${upload.contentType}|${upload.cacheControl}`
)
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'upload-images-'))

for (const [group, entries] of groups) {
  const [contentType, cacheControl] = group.split('|')
  const listFile = path.join(
    tmpDir,
    `${entries.length}-${contentType.replace('/', '-')}.json`
  )
  fs.writeFileSync(
    listFile,
    JSON.stringify(entries.map(({ key, file }) => ({ key, file })))
  )
  console.log(`Uploading ${entries.length} ${contentType} files`)
  execFileSync(
    'npx',
    [
      'wrangler',
      'r2',
      'bulk',
      'put',
      R2.BUCKET,
      `--filename=${listFile}`,
      `--content-type=${contentType}`,
      `--cache-control=${cacheControl}`,
      LOCAL ? '--local' : '--remote',
      '--force',
    ],
    { cwd: ROOT, stdio: 'inherit' }
  )
}

fs.rmSync(tmpDir, { recursive: true })
