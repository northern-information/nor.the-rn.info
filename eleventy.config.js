import { EleventyHtmlBasePlugin, IdAttributePlugin } from '@11ty/eleventy'
import markdownIt from 'markdown-it'
import { DateTime } from 'luxon'
import { execSync } from 'child_process'
import implicitFigures from 'markdown-it-implicit-figures'
import discography from '@tyleretters/discography'
import memoize from 'memoize'
import projects from './src/data/projects.js'
import { existsSync, readFileSync } from 'fs'
import {
  imagesPlugin,
  OPTIMIZED_DIR,
  OPTIMIZED_URL_PATH,
  R2,
  SOURCE_DIR,
  SOURCE_URL_PATH,
} from './lib/images.js'

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

const git = (...args) => {
  try {
    return execSync(`git ${args.join(' ')}`)
      .toString()
      .trim()
  } catch {
    return 'unknown'
  }
}

// HtmlBasePlugin adds this prefix to output URLs. The Worker strips it.
export const PATH_PREFIX = '/rm_ation/'

export const META = {
  APPLE_TOUCH_ICON: 'apple-touch-icon.png',
  AUTHOR: 'Tyler Etters',
  BUILD_TIME: new Date().toISOString(),
  CANONICAL: `https://nor.the-rn.info${PATH_PREFIX}`,
  CREATIVE_COMMONS: 'https://creativecommons.org/licenses/by/4.0/',
  DESCRIPTION: 'LONG LIVE THE LOST ONES',
  FAVICON: 'favicon.ico',
  FEED: 'feed.xml',
  GIT_HASH_SHORT: git('rev-parse', '--short', 'HEAD'),
  GIT_HASH: git('rev-parse', 'HEAD'),
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
  INCLUDES: 'includes',
  INPUT: 'src',
  LAYOUTS: 'layouts',
  OUTPUT: 'dist',
  POSTS: 'posts',
}

export const getReleaseSlug = memoize((release) => {
  return `${release.project_slug}/${release.release_slug}/`
})

// Releases use alias slugs. Project pages exist only for the canonical slug.
export const getCanonicalProjectSlug = memoize((projectSlug) => {
  for (const project of projects) {
    const allSlugs = project.slugs || [project.slug]
    if (allSlugs.includes(projectSlug)) {
      return project.slug
    }
  }
  return projectSlug
})

// Sorted, unprefixed page URLs for the XML and HTML sitemaps.
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

// A directory tree from flat pathnames. A name with a trailing slash has children.
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

// Accepts frontmatter Dates (midnight UTC), Long Now strings ("02006-01-01")
// and partial dates ("02006-??-??").
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

// Partial dates sort as January 1st. Unparseable dates sort last (descending).
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

  // Cache-busting value for CSS/JS. One value per build, not per page.
  const buildTimestamp = Math.floor(new Date(META.BUILD_TIME).getTime() / 1000)
  eleventyConfig.addShortcode('getTimestamp', () => buildTimestamp)

  eleventyConfig.addFilter('padIndex', (index) => {
    return String(index).padStart(2, '0')
  })

  eleventyConfig.addFilter('formatTrackLength', (input) => {
    if (typeof input !== 'string') return input
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

  // Remote images (release covers on R2) skip imagesPlugin.
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
    const trailingPunct = /[.,;:!?)]+$/
    const match = url.match(trailingPunct)
    const cleanUrl = match ? url.slice(0, -match[0].length) : url
    const trailing = match ? match[0] : ''
    return `<a href="${cleanUrl}" class="text-yellow-300 underline hover:text-yellow-500 hover:no-underline">${cleanUrl}</a>${trailing}`
  }

  eleventyConfig.addFilter('linkify', (content) => {
    if (typeof content !== 'string') return content
    // Link bare URLs. Tags and existing <a> elements land at odd indexes.
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
    const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i)
    return imgMatch ? imgMatch[1] : null
  })

  eleventyConfig.addFilter('toAbsoluteUrl', (url, baseUrl) => {
    if (!url || typeof url !== 'string') return url
    if (url.startsWith('http://') || url.startsWith('https://')) return url
    const base = baseUrl.replace(/\/$/, '')
    return url.startsWith('/') ? base + url : `${base}/${url}`
  })

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

  eleventyConfig.addFilter('dateToRfc822Utc', (dateObj) =>
    new Date(dateObj).toUTCString()
  )

  // Feed content has not been through HtmlBasePlugin, so root-relative URLs
  // are unprefixed and resolve against META.CANONICAL. Relative URLs resolve
  // against `pageUrl`. Schemes, `//` and `#` URLs pass through.
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

  // Nunjucks has no replace_last or remove_first.
  eleventyConfig.addFilter('replaceLast', (s, find, replace) => {
    if (typeof s !== 'string') return s
    const i = s.lastIndexOf(find)
    return i === -1 ? s : s.slice(0, i) + replace + s.slice(i + find.length)
  })

  eleventyConfig.addFilter('removeFirst', (s, find) => {
    if (typeof s !== 'string') return s
    return s.replace(find, '')
  })

  // `base` is META.CANONICAL, with the prefix and trailing slash.
  eleventyConfig.addFilter('sitemapUrls', (collection, base) =>
    collectSitemapUrls(collection).map((url) =>
      new URL(url.slice(1), base).toString()
    )
  )

  eleventyConfig.addFilter('sitemapTree', (collection) =>
    buildSitemapTree(collectSitemapUrls(collection))
  )

  // All inputs are trusted. Escape attribute values with `| escape`.
  eleventyConfig.setNunjucksEnvironmentOptions({
    autoescape: false,
  })

  eleventyConfig.addPlugin(IdAttributePlugin)

  eleventyConfig.addPlugin(EleventyHtmlBasePlugin, {
    extensions: 'html,md,css',
  })

  // A production build reads only images.manifest.json (see lib/images.js).
  const isServe = process.env.ELEVENTY_RUN_MODE === 'serve'
  eleventyConfig.addPlugin(imagesPlugin, {
    process: isServe || process.env.IMAGES_PROCESS === '1',
  })

  if (isServe) {
    // Serve local images in place (never copied to dist/). Redirect missing
    // ones to R2.
    eleventyConfig.setServerPassthroughCopyBehavior('passthrough')
    eleventyConfig.addPassthroughCopy({ [SOURCE_DIR]: SOURCE_URL_PATH })
    eleventyConfig.addPassthroughCopy({ [OPTIMIZED_DIR]: OPTIMIZED_URL_PATH })
    const localDirs = {
      [SOURCE_URL_PATH]: SOURCE_DIR,
      [OPTIMIZED_URL_PATH]: OPTIMIZED_DIR,
    }
    eleventyConfig.setServerOptions({
      middleware: [
        (req, res, next) => {
          const pathname = req.url.split(/[?#]/)[0]
          const unprefixed = pathname.startsWith(PATH_PREFIX)
            ? pathname.slice(PATH_PREFIX.length - 1)
            : pathname
          const urlPath = Object.keys(localDirs).find((dir) =>
            unprefixed.startsWith(dir)
          )
          if (!urlPath) return next()
          const name = unprefixed.slice(urlPath.length)
          let file
          try {
            file = `${localDirs[urlPath]}/${decodeURIComponent(name)}`
          } catch {
            return next()
          }
          if (existsSync(file)) return next()
          res.writeHead(302, {
            Location: `${R2.PUBLIC_URL}${urlPath}${name}`,
          })
          res.end()
        },
      ],
    })
  }

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

  const getYearFromDate = (date) => {
    const parsed = parseDate(date)
    if (!parsed) return null
    return parsed.partial ? Number(parsed.year) : parsed.dt.year
  }

  eleventyConfig.addCollection('projects', () => {
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
