#!/usr/bin/env node

/**
 * Check every <a href> in the built site in dist/.
 *
 * - Internal links and our own external links (see isOwnUrl in
 *   lib/deadLinks.js) must work. A broken one is an error, and the script
 *   exits with code 1. Fix these links in the source.
 * - Other external links that are dead go into dead-links.json. The build
 *   marks them with a ☠ (see lib/deadLinks.js). A link that works again is
 *   removed from the file.
 *
 * A link is dead only when it fails two times: one time in a parallel pass,
 * and again in a slow sequential pass. Statuses that bot protection or rate
 * limits also send (400, 401, 403, 429) and timeouts are "unknown". They are
 * reported but never marked.
 *
 * The script makes about 1,800 requests and takes some minutes. Run it by
 * hand, then review and commit dead-links.json.
 *
 * Usage:
 *   npm run build && npm run links:check
 */

import { execFileSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { META, PATH_PREFIX } from '../eleventy.config.js'
import {
  DEAD_LINKS_FILE,
  isExternalUrl,
  isOwnUrl,
  readDeadLinks,
} from '../lib/deadLinks.js'

const ROOT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST_DIR = path.join(ROOT_DIR, 'dist')
const SITE_ORIGIN = new URL(META.CANONICAL).origin
const TODAY = new Date().toISOString().slice(0, 10)
const CONCURRENCY = 16
const TIMEOUT_MS = 20000
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'
// Edit and blob links point at files in this repository. GitHub rate-limits
// them (429 or 503), so check them with git.
const REPO_FILE_LINK = new RegExp(
  `^${META.GITHUB_URL.replace(/\./g, '\\.')}/(edit|blob)/main/`,
  'i'
)

const DEAD_CODES = new Set([
  'ENOTFOUND',
  'ECONNREFUSED',
  'CERT_HAS_EXPIRED',
  'ERR_TLS_CERT_ALTNAME_INVALID',
  'DEPTH_ZERO_SELF_SIGNED_CERT',
  'SELF_SIGNED_CERT_IN_CHAIN',
  'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
])
const UNKNOWN_STATUSES = new Set([400, 401, 403, 429])

if (!fs.existsSync(DIST_DIR)) {
  console.error('dist/ does not exist. Run `npm run build` first.')
  process.exit(1)
}

// url -> Set of pages that link to it
const collectLinks = () => {
  const links = new Map()
  const files = fs
    .readdirSync(DIST_DIR, { recursive: true })
    .filter((file) => file.endsWith('.html') && !file.startsWith('pagefind'))
  for (const file of files) {
    const html = fs.readFileSync(path.join(DIST_DIR, file), 'utf8')
    const page = `/${file}`.replace(/index\.html$/, '')
    for (const [, , value] of html.matchAll(
      /<a\b[^>]*?\shref=(["'])(.*?)\1/gis
    )) {
      const href = value.replace(/&amp;/g, '&').trim()
      if (!href || href.startsWith('#')) continue
      // Client-side templates (the search results on /search/).
      if (href.includes('{{')) continue
      // Only http(s) links. mailto:, gemini: and others are skipped.
      if (/^[a-z][a-z0-9+.-]*:/i.test(href) && !isExternalUrl(href)) continue
      if (!links.has(href)) links.set(href, new Set())
      links.get(href).add(page)
    }
  }
  return links
}

// A path under PATH_PREFIX must be a file in dist/, or a directory with an
// index.html. Images are served from R2, and check:dist covers them.
const internalProblem = (pathname) => {
  if (
    pathname !== PATH_PREFIX.slice(0, -1) &&
    !pathname.startsWith(PATH_PREFIX)
  ) {
    return `no ${PATH_PREFIX} prefix`
  }
  let rel
  try {
    rel = decodeURIComponent(pathname.slice(PATH_PREFIX.length - 1)) || '/'
  } catch {
    return 'bad percent-encoding'
  }
  if (rel.startsWith('/images/') || rel.startsWith('/img-optimized/'))
    return null
  const target = path.join(DIST_DIR, rel)
  const isFile = (file) => fs.existsSync(file) && fs.statSync(file).isFile()
  if (isFile(target) || isFile(path.join(target, 'index.html'))) return null
  if (!rel.endsWith('/') && isFile(`${target}.html`)) return null
  return 'not in dist/'
}

const editLinkProblem = (url) => {
  const file = decodeURIComponent(
    url.replace(REPO_FILE_LINK, '').split(/[?#]/)[0]
  )
  try {
    execFileSync('git', ['ls-files', '--error-unmatch', file], {
      cwd: ROOT_DIR,
      stdio: 'ignore',
    })
    return null
  } catch {
    return 'file not tracked in this repository'
  }
}

const request = async (url) => {
  const options = {
    redirect: 'follow',
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { 'user-agent': USER_AGENT, accept: 'text/html,*/*' },
  }
  try {
    let response = await fetch(url, { ...options, method: 'HEAD' })
    // Some servers do not support HEAD.
    if (response.status >= 400) {
      response = await fetch(url, { ...options, method: 'GET' })
    }
    return { status: response.status }
  } catch (error) {
    return { status: error.cause?.code || error.name || 'ERROR' }
  }
}

// 'ok', 'dead' or 'unknown'
const classify = ({ status }) => {
  if (typeof status === 'number') {
    if (status < 400) return 'ok'
    if (UNKNOWN_STATUSES.has(status)) return 'unknown'
    return 'dead'
  }
  return DEAD_CODES.has(status) ? 'dead' : 'unknown'
}

const runPool = async (items, worker, concurrency) => {
  const results = new Map()
  let next = 0
  const run = async () => {
    while (next < items.length) {
      const item = items[next++]
      results.set(item, await worker(item))
    }
  }
  await Promise.all(Array.from({ length: concurrency }, run))
  return results
}

const links = collectLinks()
const ownProblems = []
const external = []

for (const [href, pages] of links) {
  if (REPO_FILE_LINK.test(href)) {
    const problem = editLinkProblem(href)
    if (problem) ownProblems.push({ href, problem, pages })
    continue
  }
  if (isExternalUrl(href) && new URL(href).origin !== SITE_ORIGIN) {
    if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(new URL(href).hostname)) {
      ownProblems.push({ href, problem: 'local development URL', pages })
      continue
    }
    external.push(href)
    continue
  }
  // Root-relative, relative or on this site.
  const base = new URL(`${SITE_ORIGIN}${PATH_PREFIX}${[...pages][0].slice(1)}`)
  let pathname
  try {
    pathname = new URL(href, base).pathname
  } catch {
    ownProblems.push({ href, problem: 'not a valid URL', pages })
    continue
  }
  // The Worker redirects an absolute, unprefixed URL on this site to the
  // prefixed path. It works, but costs a redirect: write it root-relative.
  const unprefixed =
    isExternalUrl(href) &&
    pathname !== PATH_PREFIX.slice(0, -1) &&
    !pathname.startsWith(PATH_PREFIX)
  const target = unprefixed
    ? `${PATH_PREFIX.slice(0, -1)}${pathname}`
    : pathname
  const problem = internalProblem(target)
  if (problem) {
    ownProblems.push({ href, problem, pages })
  } else if (unprefixed) {
    ownProblems.push({
      href,
      problem: `redirects; write it as ${pathname}`,
      pages,
    })
  }
}

console.log(
  `Checking ${external.length} external links (${links.size} unique links in all)...`
)

const firstPass = await runPool(external, request, CONCURRENCY)
const suspects = external.filter((url) => classify(firstPass.get(url)) !== 'ok')

console.log(`Checking ${suspects.length} failed links again, one at a time...`)

const results = new Map(external.map((url) => [url, firstPass.get(url)]))
for (const url of suspects) {
  await new Promise((resolve) => setTimeout(resolve, 500))
  results.set(url, await request(url))
}

const previous = readDeadLinks(ROOT_DIR)
const deadLinks = {}
const unknown = []
const added = []

for (const url of external) {
  const first = classify(firstPass.get(url))
  const second = classify(results.get(url))
  const { status } = results.get(url)
  if (first === 'ok' || second === 'ok') continue
  const pages = links.get(url)
  if (isOwnUrl(url)) {
    ownProblems.push({ href: url, problem: `status ${status}`, pages })
    continue
  }
  if (first === 'dead' && second === 'dead') {
    deadLinks[url] = { status, since: previous[url]?.since || TODAY }
    if (!previous[url]) added.push(url)
  } else {
    unknown.push({ url, status, pages })
  }
}

const recovered = Object.keys(previous).filter((url) => !deadLinks[url])
const sorted = Object.fromEntries(
  Object.entries(deadLinks).sort(([a], [b]) => a.localeCompare(b))
)
fs.writeFileSync(
  path.join(ROOT_DIR, DEAD_LINKS_FILE),
  `${JSON.stringify(sorted, null, 2)}\n`
)

const pageList = (pages) => [...pages].join(' ')

if (unknown.length) {
  console.log(`\nUnknown (bot protection, rate limit or timeout), not marked:`)
  for (const { url, status, pages } of unknown) {
    console.log(`  ${status} ${url}\n      on ${pageList(pages)}`)
  }
}

console.log(
  `\n${DEAD_LINKS_FILE}: ${Object.keys(sorted).length} dead, ${added.length} new, ${recovered.length} working again`
)
for (const url of added) console.log(`  + ${url}`)
for (const url of recovered) console.log(`  - ${url}`)

if (ownProblems.length) {
  console.error(`\nOur own links that do not work. Fix them in the source:`)
  for (const { href, problem, pages } of ownProblems) {
    console.error(`  ${href} (${problem})\n      on ${pageList(pages)}`)
  }
  process.exit(1)
}
