#!/usr/bin/env node

/**
 * Check the tracked files for media that belongs in R2, not git. Site images
 * left git in a history rewrite; this keeps them out. The merge is a squash,
 * so the tree of the PR head is what lands on main.
 *
 * Usage:
 *   npm run check:repo
 */

import fs from 'fs'
import path from 'path'
import { execFileSync } from 'child_process'
import { fileURLToPath } from 'url'
import { DIRS, META } from '../eleventy.config.js'
import { OPTIMIZED_DIR, SOURCE_DIR } from '../lib/images.js'

const __filename = fileURLToPath(import.meta.url)
const ROOT = path.join(path.dirname(__filename), '..')

const MAX_FILE_BYTES = 1024 * 1024
const IMAGE_EXTENSIONS =
  /\.(avif|bmp|gif|heic|ico|jpe?g|png|psd|svg|tiff?|webp)$/i

// The only images that stay in git: files the site serves from its root.
const ALLOWED_IMAGES = new Set(
  [META.APPLE_TOUCH_ICON, META.FAVICON, META.LOGO].map(
    (name) => `${DIRS.INPUT}/${name}`
  )
)

const files = execFileSync('git', ['ls-files', '-z'], { cwd: ROOT })
  .toString()
  .split('\0')
  .filter(Boolean)

const errors = []
for (const file of files) {
  if (
    file.startsWith(`${SOURCE_DIR}/`) ||
    file.startsWith(`${OPTIMIZED_DIR}/`)
  ) {
    errors.push(
      `${file}: site images live in R2. Run \`npm run images\` and untrack it.`
    )
    continue
  }
  if (IMAGE_EXTENSIONS.test(file) && !ALLOWED_IMAGES.has(file)) {
    errors.push(
      `${file}: put images in ${SOURCE_DIR}/ and run \`npm run images\`.`
    )
    continue
  }
  // A file that git tracks but the checkout lacks (deleted, not staged) has no size.
  const stat = fs.statSync(path.join(ROOT, file), { throwIfNoEntry: false })
  if (stat && stat.size > MAX_FILE_BYTES) {
    errors.push(
      `${file}: ${(stat.size / 1024 / 1024).toFixed(1)} MB is over the 1 MB limit.`
    )
  }
}

if (errors.length) {
  console.error(errors.join('\n'))
  console.error(`\n${errors.length} problem(s) in the tracked files`)
  process.exit(1)
}

console.log(`Checked ${files.length} tracked files`)
