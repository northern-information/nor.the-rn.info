// Marks external links that `npm run links:check` found dead.
//
// dead-links.json maps a URL to { status, since }. `since` is the ISO date of
// the scan that first found the link dead. The build only reads the file, so
// a build never makes network requests.
//
// A marked link gets the `link-dead` class and a ☠ button after it. The
// button opens a popover with the date (tap, click and keyboard need no
// JavaScript). src/scripts/dead-links.js also opens it on hover.
//
// Our own links (this site, the-rn.info hosts, our GitHub accounts) are never
// marked. links:check reports them as errors to fix.

import { existsSync, readFileSync } from 'fs'
import path from 'path'
import { DateTime } from 'luxon'

export const DEAD_LINKS_FILE = 'dead-links.json'

const OWN_HOSTS = [
  /(^|\.)the-rn\.info$/,
  /^(tyleretters|northern-information)\.github\.io$/,
]
const OWN_GITHUB = /^\/(tyleretters|northern-information)(\/|$)/i

export const isExternalUrl = (url) => /^https?:\/\//i.test(url)

export const isOwnUrl = (url) => {
  let parsed
  try {
    parsed = new URL(url)
  } catch {
    return false
  }
  const host = parsed.hostname.toLowerCase()
  if (OWN_HOSTS.some((re) => re.test(host))) return true
  return host === 'github.com' && OWN_GITHUB.test(parsed.pathname)
}

export const readDeadLinks = (rootDir) => {
  const file = path.join(rootDir, DEAD_LINKS_FILE)
  if (!existsSync(file)) return {}
  return JSON.parse(readFileSync(file, 'utf8'))
}

// "2026-11-17" -> "November 17, 02026". Same format as `dateToUTCFull`.
export const formatSince = (since) => {
  const dt = DateTime.fromISO(since, { zone: 'utc' })
  if (!dt.isValid) return null
  return `${dt.toFormat('LLLL dd')}, ${dt.toFormat('yyyy').padStart(5, '0')}`
}

const decodeAmp = (value) => value.replace(/&amp;/g, '&')

export function deadLinksPlugin(eleventyConfig, { rootDir }) {
  const deadLinks = readDeadLinks(rootDir)
  if (!Object.keys(deadLinks).length) return

  eleventyConfig.htmlTransformer.addPosthtmlPlugin('html', (context) => {
    // Popover ids must be unique in the page.
    let count = 0
    const page = (context?.url || '').replace(/\W+/g, '-')
    return (tree) => {
      tree.match({ tag: 'a', attrs: { href: /^https?:\/\// } }, (link) => {
        if (link.deadMarked) return link
        const href = decodeAmp(link.attrs.href.trim())
        const entry = deadLinks[href]
        if (!entry || isOwnUrl(href)) return link
        const since = formatSince(entry.since)
        if (!since) return link

        link.deadMarked = true
        const classes = (link.attrs.class || '').split(/\s+/).filter(Boolean)
        link.attrs.class = [...classes, 'link-dead'].join(' ')

        count += 1
        const id = `dead-link${page}${count}`
        // Explicit anchor: not every browser makes the popovertarget button
        // the implicit anchor of its popover.
        const anchor = `--dead-link-${count}`
        // match() also walks into the returned nodes. Only the <a> is
        // matched, and it is marked, so it is not wrapped twice.
        return [
          link,
          {
            tag: 'button',
            attrs: {
              type: 'button',
              class: 'link-dead-skull',
              popovertarget: id,
              // "show", not the default "toggle": a click after the hover
              // opened the popover must not close it again.
              popovertargetaction: 'show',
              style: `anchor-name: ${anchor}`,
              'aria-label': 'Dead link: show details',
              'data-pagefind-ignore': '',
            },
            // U+2620 SKULL AND CROSSBONES + U+FE0E (text presentation): a
            // one-color glyph in the text color, not an emoji.
            content: ['☠︎'],
          },
          {
            tag: 'span',
            attrs: {
              id,
              popover: '',
              role: 'tooltip',
              style: `position-anchor: ${anchor}`,
              class: 'link-dead-note',
              'data-pagefind-ignore': '',
            },
            content: [`As of ${since}, this link has rotted.`],
          },
        ]
      })
      return tree
    }
  })
}
