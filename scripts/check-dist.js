#!/usr/bin/env node

/**
 * Check the built site in dist/ for problems that a clean build does not report.
 * Site images are not in dist/: the Worker serves them from R2. A URL to one
 * must be in images.manifest.json, which lists what `npm run images` uploaded.
 *
 * Usage:
 *   npm run build && npm run check:dist
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { PATH_PREFIX } from '../eleventy.config.js'
import {
  getDerivativeUrls,
  OPTIMIZED_URL_PATH,
  readManifest,
  SOURCE_URL_PATH,
} from '../lib/images.js'

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

const manifest = readManifest(path.join(__dirname, '..'))
const r2Urls = new Set([
  ...manifest.originals.map((name) => `${SOURCE_URL_PATH}${name}`),
  ...Object.values(manifest.images).flatMap(getDerivativeUrls),
])

const files = fs.readdirSync(DIST_DIR, { recursive: true })
const htmlFiles = files.filter((file) => file.endsWith('.html'))
const errors = []

// ASSETS redirects a page path with `+` to its percent-encoded form. Headless
// Chromium got a redirect loop on /2022/12/30/sound-+-process/.
const SAFE_PAGE_PATH = /^[A-Za-z0-9_\-/.]+$/

for (const file of files) {
  if (AGENT_FILES.test(file)) {
    errors.push(`${file}: built from an agent instruction file`)
  }
  if (file.endsWith('.html') && !SAFE_PAGE_PATH.test(file)) {
    errors.push(
      `${file}: page path has characters other than letters, digits, -, _ and /`,
    )
  }
}

// Root-relative URLs with a file extension (styles, scripts, media) must
// resolve to a file in dist/, or to an R2 image in the manifest. Page links
// without an extension are skipped.
const isR2Url = (pathname) =>
  pathname.startsWith(SOURCE_URL_PATH) ||
  pathname.startsWith(OPTIMIZED_URL_PATH)

const findMissing = (url) => {
  if (!url.startsWith(PATH_PREFIX)) return null
  const pathname = `/${decodeURIComponent(url.split(/[?#]/)[0]).slice(PATH_PREFIX.length)}`
  if (!path.extname(pathname)) return null
  if (isR2Url(pathname)) {
    return r2Urls.has(pathname) ? null : 'not in images.manifest.json'
  }
  return fs.existsSync(path.join(DIST_DIR, pathname))
    ? null
    : 'not found in dist/'
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
      // Link to an archived copy (https://web.archive.org/web/...) if the
      // host has no HTTPS.
      if (/^http:/i.test(url)) {
        errors.push(`${file}: ${attr} uses http: (${url})`)
        continue
      }
      const problem = findMissing(url)
      if (problem) errors.push(`${file}: ${attr} ${problem} (${url})`)
    }
  }
}

if (errors.length) {
  console.error(errors.join('\n'))
  console.error(`\n${errors.length} problem(s) in dist/`)
  process.exit(1)
}

console.log(`Checked ${htmlFiles.length} HTML files in dist/`)
