import { EleventyHtmlBasePlugin, IdAttributePlugin } from '@11ty/eleventy'
import { eleventyImageTransformPlugin } from '@11ty/eleventy-img'
import markdownIt from 'markdown-it'
import { DateTime } from 'luxon'
import { execSync } from 'child_process'
import implicitFigures from 'markdown-it-implicit-figures'
import discography from '@tyleretters/discography'
import memoize from 'memoize'
import projects from './src/data/projects.js'
import { readFileSync } from 'fs'

const discographyPackageJson = JSON.parse(
  readFileSync(
    new URL(
      './node_modules/@tyleretters/discography/package.json',
      import.meta.url
    ),
    'utf8'
  )
)

const LONG_NOW_YEAR_DIGITS = 5

// The site is served from this prefix. Eleventy's pathPrefix + HtmlBasePlugin
// rewrite root-relative URLs in the output; dist/ itself stays flat and the
// Worker strips the prefix before hitting the ASSETS binding.
export const PATH_PREFIX = '/rm_ation/'

export const META = {
  APPLE_TOUCH_ICON: 'apple-touch-icon.png',
  AUTHOR: 'Tyler Etters',
  BUILD_TIME: new Date().toISOString(),
  CANONICAL: `https://nor.the-rn.info${PATH_PREFIX}`,
  CREATIVE_COMMONS: 'https://creativecommons.org/licenses/by/4.0/',
  DESCRIPTION: 'LONG LIVE THE LOST ONES',
  DOMAIN: 'https://nor.the-rn.info',
  FAVICON: 'favicon.ico',
  FEED: 'feed.xml',
  GIT_HASH_SHORT: (() => {
    try {
      return execSync('git rev-parse --short HEAD').toString().trim()
    } catch {
      return 'unknown'
    }
  })(),
  GIT_HASH: (() => {
    try {
      return execSync('git rev-parse HEAD').toString().trim()
    } catch {
      return 'unknown'
    }
  })(),
  GITHUB_URL: 'https://github.com/northern-information/nor.the-rn.info',
  INVOCATION: 'cd LOST_DIR && ./DISAPPEAR',
  LOGO: 'applied-sciences-and-phantasms-working-division.png',
  DISCOGRAPHY_URL: 'https://www.npmjs.com/package/@tyleretters/discography',
  DISCOGRAPHY_VERSION: discographyPackageJson.version,
  TITLE: 'Northern Information',
  YEAR: String(new Date().getUTCFullYear()).padStart(LONG_NOW_YEAR_DIGITS, '0'),
}

export const DIRS = {
  DATA: 'data',
  IMAGES: 'images',
  INCLUDES: 'includes',
  INPUT: 'src',

  LAYOUTS: 'layouts',
  OUTPUT: 'dist',
  PAGES: 'pages',
  POSTS: 'posts',
}

export const getReleaseSlug = memoize((release) => {
  return `${release.project_slug}/${release.release_slug}/`
})

// Map a release's project_slug to the canonical project slug
export const getCanonicalProjectSlug = memoize((projectSlug) => {
  for (const project of projects) {
    const allSlugs = project.slugs || [project.slug]
    if (allSlugs.includes(projectSlug)) {
      return project.slug
    }
  }
  return projectSlug
})

// Collect the site's public page URLs from a collection (e.g. `collections.all`)
// as deduped, sorted flat pathnames (unprefixed, as Eleventy's `page.url`).
// Prefixed with META.CANONICAL they match the canonical URLs emitted in
// metaTags.njk, and they seed both the XML and HTML sitemaps.
const collectSitemapUrls = (collection) => {
  const seen = new Set()
  for (const item of collection || []) {
    const url = item && item.url
    if (typeof url !== 'string' || !url.startsWith('/')) continue
    if (!(url.endsWith('/') || url.endsWith('.html'))) continue
    if (/\.(xml|txt|json)$/.test(url)) continue
    seen.add(url)
  }
  return [...seen].sort((a, b) => a.localeCompare(b))
}

// Build a single directory-style tree rooted at "/" from flat pathnames. Each
// URL segment becomes a node; a node is a linkable page when a pathname
// terminates on it, otherwise a structural directory. A trailing slash marks a
// directory (a node with descendants); leaf pages read as files without one.
const buildSitemapTree = (pathnames) => {
  const root = { segment: '/', url: null, isHtml: false, children: new Map() }

  for (const pathname of pathnames) {
    if (pathname === '/') {
      root.url = '/'
      continue
    }
    const isHtml = pathname.endsWith('.html')
    const segments = pathname.replace(/\/+$/, '').split('/').filter(Boolean)
    let node = root
    segments.forEach((segment, index) => {
      if (!node.children.has(segment)) {
        node.children.set(segment, {
          segment,
          url: null,
          isHtml: false,
          children: new Map(),
        })
      }
      node = node.children.get(segment)
      if (index === segments.length - 1) {
        node.url = pathname
        node.isHtml = isHtml
      }
    })
  }

  const finalize = (node) => {
    const children = [...node.children.values()]
      .map(finalize)
      .sort((a, b) => a.name.localeCompare(b.name))
    let name
    if (node.segment === '/') name = '/'
    else if (node.isHtml) name = node.segment
    else name = node.segment + (children.length ? '/' : '')
    return { name, url: node.url || null, children }
  }

  return finalize(root)
}

// Helper to parse dates, handling:
// - JS Date objects from frontmatter (midnight UTC)
// - 5-digit Long Now years (e.g., "02006-01-01" -> "2006-01-01")
// - Partial dates with ?? for unknown month/day (e.g., "02006-??-??")
const parseDate = (date) => {
  if (date instanceof Date) {
    const dt = DateTime.fromJSDate(date, { zone: 'utc' })
    return dt.isValid ? { dt, partial: false } : null
  }
  const str = String(date).replace(/^0(\d{4})/, '$1')
  if (str.includes('??')) {
    const match = str.match(/^(\d{4})/)
    return match ? { year: match[1], partial: true } : null
  }
  const dt = DateTime.fromISO(str, { zone: 'utc' })
  return dt.isValid ? { dt, partial: false } : null
}

// Sortable timestamp for a Long Now release date; unknown month/day sort as
// January 1st, unparseable dates sort last (descending).
const getReleaseTimestamp = (date) => {
  const parsed = parseDate(date)
  if (!parsed) return Number.MIN_SAFE_INTEGER
  if (parsed.partial) return Date.UTC(Number(parsed.year), 0, 1)
  return parsed.dt.toMillis()
}

export default async (eleventyConfig) => {
  eleventyConfig.addShortcode('getTitle', (title) => {
    return title && title !== META.TITLE
      ? `${title} | ${META.TITLE}`
      : META.TITLE
  })

  // Cache-busting query param for CSS/JS. Uses the build start time so every
  // page in a build shares one value (a per-render timestamp would differ
  // between pages and defeat browser caching).
  const buildTimestamp = Math.floor(new Date(META.BUILD_TIME).getTime() / 1000)
  eleventyConfig.addShortcode('getTimestamp', () => buildTimestamp)

  eleventyConfig.addFilter('padIndex', (index) => {
    return String(index).padStart(2, '0')
  })

  eleventyConfig.addFilter('formatTrackLength', (input) => {
    if (typeof input !== 'string') return input
    // Strip leading "00:" for tracks under an hour (e.g., "00:03:13" -> "03:13")
    return input.replace(/^00:/, '')
  })

  eleventyConfig.addFilter(
    'dateToUTCFull',
    memoize((date) => {
      const parsed = parseDate(date)
      if (!parsed) return ''
      if (parsed.partial) return parsed.year.padStart(LONG_NOW_YEAR_DIGITS, '0')
      const longNowYear = parsed.dt
        .toFormat('yyyy')
        .padStart(LONG_NOW_YEAR_DIGITS, '0')
      return `${parsed.dt.toFormat('LLLL dd')}, ${longNowYear}`
    })
  )

  eleventyConfig.addFilter(
    'dateToUTCYear',
    memoize((date) => {
      const parsed = parseDate(date)
      if (!parsed) return ''
      if (parsed.partial) return parsed.year.padStart(LONG_NOW_YEAR_DIGITS, '0')
      return parsed.dt.toFormat('yyyy').padStart(LONG_NOW_YEAR_DIGITS, '0')
    })
  )

  eleventyConfig.addFilter(
    'dateToUTCISO',
    memoize((date) => {
      const parsed = parseDate(date)
      if (!parsed) return ''
      if (parsed.partial) return parsed.year
      return parsed.dt.toFormat('yyyy-MM-dd')
    })
  )

  const markdownLib = markdownIt({
    html: true,
    breaks: true,
  }).use(implicitFigures, {
    figcaption: false,
  })

  // Tag remote images so eleventyImageTransformPlugin skips them. Release covers
  // on the R2 asset buckets are already optimized.
  const defaultImageRender =
    markdownLib.renderer.rules.image ||
    ((tokens, idx, options, env, self) =>
      self.renderToken(tokens, idx, options))
  markdownLib.renderer.rules.image = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    const src = token.attrGet('src') || ''
    if (/^https?:\/\//.test(src)) {
      token.attrSet('eleventy:ignore', '')
    }
    return defaultImageRender(tokens, idx, options, env, self)
  }

  eleventyConfig.setLibrary('md', markdownLib)

  eleventyConfig.addFilter(
    'markdown',
    memoize((content) => {
      return markdownLib.render(content)
    })
  )

  const linkifyUrl = (url) => {
    // Clean up trailing punctuation that's likely not part of the URL
    const trailingPunct = /[.,;:!?)]+$/
    const match = url.match(trailingPunct)
    const cleanUrl = match ? url.slice(0, -match[0].length) : url
    const trailing = match ? match[0] : ''
    return `<a href="${cleanUrl}" class="text-yellow-300 underline hover:text-yellow-500 hover:no-underline">${cleanUrl}</a>${trailing}`
  }

  eleventyConfig.addFilter('linkify', (content) => {
    if (typeof content !== 'string') return content
    // Convert bare URLs (http, https) in text to anchor tags. Existing <a>
    // elements and all tags (and therefore attribute values) are passed through
    // untouched, so already-linked URLs are not wrapped a second time.
    // split() with a capture group puts the skipped markup at odd indexes.
    const skipRegex = /(<a\b[\s\S]*?<\/a>|<[^>]*>)/gi
    const urlRegex = /https?:\/\/[^\s<>"']+/gi
    return content
      .split(skipRegex)
      .map((part, i) =>
        i % 2 === 1 ? part : part.replace(urlRegex, linkifyUrl)
      )
      .join('')
  })

  // Plain-text excerpt (tags stripped, common entities decoded). Escape it at
  // the point of use, e.g. `| escape` inside an HTML attribute.
  eleventyConfig.addFilter('extractExcerpt', (content, maxLength = 160) => {
    if (typeof content !== 'string') return ''
    const entities = {
      amp: '&',
      lt: '<',
      gt: '>',
      quot: '"',
      apos: "'",
      nbsp: ' ',
    }
    const text = content
      .replace(/<[^>]+>/g, '')
      .replace(/&(?:#(\d+)|#x([\da-f]+)|(\w+));/gi, (match, dec, hex, name) => {
        if (dec) return String.fromCodePoint(Number(dec))
        if (hex) return String.fromCodePoint(parseInt(hex, 16))
        return entities[name.toLowerCase()] ?? match
      })
      .replace(/\s+/g, ' ')
      .trim()
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength).replace(/\s\S*$/, '') + '...'
  })

  eleventyConfig.addFilter('extractFirstImage', (content) => {
    if (typeof content !== 'string') return null
    // Match the first <img> tag and extract its src attribute
    const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i)
    return imgMatch ? imgMatch[1] : null
  })

  // RSS feed filters (for custom feed template in src/feed.njk)
  eleventyConfig.addFilter('toAbsoluteUrl', (url, baseUrl) => {
    // Converts a URL to absolute if it's relative
    if (!url || typeof url !== 'string') return url
    if (url.startsWith('http://') || url.startsWith('https://')) return url
    const base = baseUrl.replace(/\/$/, '')
    return url.startsWith('/') ? base + url : `${base}/${url}`
  })

  // MIME type for an RSS <enclosure> from the image URL's extension.
  eleventyConfig.addFilter('imageMimeType', (url) => {
    const ext = String(url).split(/[?#]/)[0].split('.').pop().toLowerCase()
    const types = {
      avif: 'image/avif',
      gif: 'image/gif',
      jpeg: 'image/jpeg',
      jpg: 'image/jpeg',
      png: 'image/png',
      svg: 'image/svg+xml',
      webp: 'image/webp',
    }
    return types[ext] || 'application/octet-stream'
  })

  eleventyConfig.addFilter('dateToRfc822Utc', (dateObj) => {
    // Formats dates as RFC 822 with GMT timezone for RSS feeds
    const date = new Date(dateObj)
    return date.toUTCString()
  })

  // Converts relative src/href/srcset URLs in HTML to absolute URLs for feeds.
  // Root-relative URLs (`/images/x.png`) resolve against the site root
  // (META.DOMAIN + PATH_PREFIX); document-relative ones (`x.png`) resolve
  // against `pageUrl`. Content here has not been through HtmlBasePlugin yet, so
  // root-relative URLs are still unprefixed. URLs with a scheme (`https:`,
  // `mailto:`, `data:`), protocol-relative `//` URLs, and `#` fragments pass
  // through untouched.
  eleventyConfig.addFilter(
    'convertHtmlToAbsoluteUrls',
    (htmlContent, pageUrl) => {
      if (typeof htmlContent !== 'string') return htmlContent

      const toAbsolute = (url) => {
        if (/^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(url)) return url
        if (url.startsWith('/')) {
          return new URL(url.slice(1), META.CANONICAL).toString()
        }
        return new URL(url, pageUrl).toString()
      }

      return htmlContent
        .replace(
          /(?<![\w-])(src|href)=(["'])(.*?)\2/gi,
          (_, attr, quote, url) =>
            `${attr}=${quote}${toAbsolute(url.trim())}${quote}`
        )
        .replace(/(?<![\w-])srcset=(["'])(.*?)\1/gi, (_, quote, srcset) => {
          const candidates = srcset.split(',').map((candidate) => {
            const [url, ...descriptor] = candidate.trim().split(/\s+/)
            return [toAbsolute(url), ...descriptor].join(' ')
          })
          return `srcset=${quote}${candidates.join(', ')}${quote}`
        })
    }
  )

  // Replace the last occurrence of `find` with `replace` (Nunjucks lacks Liquid's replace_last).
  eleventyConfig.addFilter('replaceLast', (s, find, replace) => {
    if (typeof s !== 'string') return s
    const i = s.lastIndexOf(find)
    return i === -1 ? s : s.slice(0, i) + replace + s.slice(i + find.length)
  })

  // Remove the first occurrence of `find` (Nunjucks lacks Liquid's remove_first).
  eleventyConfig.addFilter('removeFirst', (s, find) => {
    if (typeof s !== 'string') return s
    return s.replace(find, '')
  })

  // Absolute page URLs for the XML sitemap (src/sitemap.njk). `base` is
  // META.CANONICAL, which already carries the path prefix and trailing slash.
  eleventyConfig.addFilter('sitemapUrls', (collection, base) =>
    collectSitemapUrls(collection).map((url) =>
      new URL(url.slice(1), base).toString()
    )
  )

  // Nested directory tree for the human-readable sitemap (src/pages/sitemap.njk).
  eleventyConfig.addFilter('sitemapTree', (collection) =>
    buildSitemapTree(collectSitemapUrls(collection))
  )

  // Preserve Liquid's no-autoescape behavior so existing templates render HTML directly
  // without piping every interpolation through `| safe`. All template inputs are trusted
  // (markdown content, YAML data files, code constants).
  eleventyConfig.setNunjucksEnvironmentOptions({
    autoescape: false,
  })

  eleventyConfig.addPlugin(IdAttributePlugin)

  eleventyConfig.addPlugin(EleventyHtmlBasePlugin, {
    extensions: 'html,md,css',
  })

  // eleventy-img writes derivatives into src/ (committed to git) and we passthrough
  // them to dist/. Cloudflare clones the repo and skips Sharp processing when the
  // hashed outputs already exist, so deploys stay fast.
  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
    extensions: 'html',
    formats: ['avif', 'webp', 'auto'],
    widths: [400, 800, 1600, 'auto'],
    outputDir: `./${DIRS.INPUT}/img-optimized/`,
    urlPath: '/img-optimized/',
    htmlOptions: {
      imgAttributes: {
        loading: 'lazy',
        decoding: 'async',
      },
    },
    failOnError: false,
  })

  eleventyConfig.addPassthroughCopy(`${DIRS.INPUT}/${DIRS.IMAGES}`)
  eleventyConfig.addPassthroughCopy(`${DIRS.INPUT}/img-optimized`)
  eleventyConfig.addPassthroughCopy(`${DIRS.INPUT}/${META.APPLE_TOUCH_ICON}`)
  eleventyConfig.addPassthroughCopy(`${DIRS.INPUT}/${META.FAVICON}`)
  eleventyConfig.addPassthroughCopy(`${DIRS.INPUT}/${META.LOGO}`)
  eleventyConfig.addPassthroughCopy(`${DIRS.INPUT}/robots.txt`)
  eleventyConfig.addPassthroughCopy(`${DIRS.INPUT}/styles/pagefind.css`)
  eleventyConfig.addPassthroughCopy(`${DIRS.INPUT}/scripts`)
  eleventyConfig.addPassthroughCopy(`${DIRS.INPUT}/fonts`)

  eleventyConfig.addCollection('discography', () => {
    return discography.map((release) => ({
      ...release,
      slug: getReleaseSlug(release),
      canonical_project_slug: getCanonicalProjectSlug(release.project_slug),
    }))
  })

  // Year from a Long Now date (e.g., "02025-11-18" or "02006-??-??")
  const getYearFromDate = (date) => {
    const parsed = parseDate(date)
    if (!parsed) return null
    return parsed.partial ? Number(parsed.year) : parsed.dt.year
  }

  eleventyConfig.addCollection('projects', () => {
    // Validate all discography projects are accounted for
    const discographyProjectSlugs = [
      ...new Set(discography.map((r) => r.project_slug)),
    ]
    const allProjectSlugs = new Set(
      projects.flatMap((p) => (p.slugs ? p.slugs : [p.slug]))
    )
    const missing = discographyProjectSlugs.filter(
      (slug) => !allProjectSlugs.has(slug)
    )
    if (missing.length > 0) {
      console.warn(
        'WARNING: Missing projects in projects.js:',
        missing.join(', ')
      )
    }

    return projects.map((project) => {
      const matchSlugs = project.slugs || [project.slug]
      const releases = discography
        .filter((r) => matchSlugs.includes(r.project_slug))
        .map((r) => ({ ...r, slug: getReleaseSlug(r) }))
        .sort(
          (a, b) =>
            getReleaseTimestamp(b.released) - getReleaseTimestamp(a.released)
        )

      const years = releases
        .map((r) => getYearFromDate(r.released))
        .filter((y) => y !== null)
        .sort((a, b) => a - b)

      const earliestYear =
        years.length > 0
          ? String(years[0]).padStart(LONG_NOW_YEAR_DIGITS, '0')
          : null
      const latestYear =
        years.length > 0
          ? String(years[years.length - 1]).padStart(LONG_NOW_YEAR_DIGITS, '0')
          : null

      return {
        ...project,
        releases,
        earliestYear,
        latestYear,
        dateRange: earliestYear
          ? project.active
            ? `${earliestYear} — Present`
            : earliestYear === latestYear
              ? earliestYear
              : `${earliestYear} — ${latestYear}`
          : '',
      }
    })
  })

  eleventyConfig.addCollection('posts', (collectionApi) => {
    return collectionApi.getFilteredByGlob(`${DIRS.INPUT}/${DIRS.POSTS}/*`)
  })

  eleventyConfig.addCollection('postsByYear', (collectionApi) => {
    const posts = collectionApi.getFilteredByGlob(
      `${DIRS.INPUT}/${DIRS.POSTS}/*`
    )
    const grouped = posts.reduce((acc, post) => {
      const year = String(post.date.getUTCFullYear()).padStart(
        LONG_NOW_YEAR_DIGITS,
        '0'
      )
      if (!acc[year]) {
        acc[year] = []
      }
      acc[year].push(post)
      return acc
    }, {})

    return Object.entries(grouped)
      .map(([year, posts]) => ({
        year,
        posts: posts.sort((a, b) => b.date - a.date),
      }))
      .sort((a, b) => b.year.localeCompare(a.year))
  })

  return {
    pathPrefix: PATH_PREFIX,
    markdownTemplateEngine: 'njk',
    dir: {
      input: DIRS.INPUT,
      data: DIRS.DATA,
      includes: DIRS.INCLUDES,
      layouts: DIRS.LAYOUTS,
      output: DIRS.OUTPUT,
    },
  }
}
