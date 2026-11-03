#!/usr/bin/env node

/**
 * Check the built site in dist/ for problems that a clean build does not report.
 * The image transform runs with failOnError: false, so a failed image still
 * builds and ships a broken src.
 *
 * Usage:
 *   npm run build && npm run check:dist
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { PATH_PREFIX } from '../eleventy.config.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DIST_DIR = path.join(__dirname, '../dist')

const ATTR_REGEX = /\b(src|href|srcset)=(["'])(.*?)\2/gi
// Agent instruction files must never become pages.
const AGENT_FILES = /(^|\/)(CLAUDE|AGENTS)(\/|\.md$|\.html$|$)/

if (!fs.existsSync(DIST_DIR)) {
  console.error('dist/ does not exist. Run `npm run build` first.')
  process.exit(1)
}

const files = fs.readdirSync(DIST_DIR, { recursive: true })
const htmlFiles = files.filter((file) => file.endsWith('.html'))
const errors = []

for (const file of files) {
  if (AGENT_FILES.test(file)) {
    errors.push(`${file}: built from an agent instruction file`)
  }
}

// Root-relative URLs with a file extension (images, styles, scripts, media)
// must resolve to a file in dist/. Page links without an extension are skipped.
const toDistPath = (url) => {
  if (!url.startsWith(PATH_PREFIX)) return null
  const pathname = decodeURIComponent(url.split(/[?#]/)[0])
  if (!path.extname(pathname)) return null
  return path.join(DIST_DIR, pathname.slice(PATH_PREFIX.length))
}

for (const file of htmlFiles) {
  const html = fs.readFileSync(path.join(DIST_DIR, file), 'utf8')

  if (html.includes(`${PATH_PREFIX}${PATH_PREFIX.slice(1)}`)) {
    errors.push(`${file}: doubled path prefix ${PATH_PREFIX}`)
  }

  for (const [, attr, , value] of html.matchAll(ATTR_REGEX)) {
    const urls =
      attr.toLowerCase() === 'srcset'
        ? value.split(',').map((candidate) => candidate.trim().split(/\s+/)[0])
        : [value.trim()]

    for (const url of urls) {
      if (/^\/?src\//.test(url)) {
        errors.push(`${file}: ${attr} points into src/ (${url})`)
        continue
      }
      const distPath = toDistPath(url)
      if (distPath && !fs.existsSync(distPath)) {
        errors.push(`${file}: ${attr} not found in dist/ (${url})`)
      }
    }
  }
}

if (errors.length) {
  console.error(errors.join('\n'))
  console.error(`\n${errors.length} problem(s) in dist/`)
  process.exit(1)
}

console.log(`Checked ${htmlFiles.length} HTML files in dist/`)
