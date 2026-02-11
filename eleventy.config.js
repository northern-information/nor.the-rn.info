import { EleventyHtmlBasePlugin, IdAttributePlugin } from '@11ty/eleventy'
import markdownIt from 'markdown-it'
import { DateTime } from 'luxon'
import { execSync } from 'child_process'
import implicitFigures from 'markdown-it-implicit-figures'
import slugify from 'slugify'
import discography from '@tyleretters/discography'
import memoize from 'memoize'
import projects from './src/data/projects.js'
import titleCaseExceptions from './src/data/titleCaseExceptions.js'
import { readFileSync } from 'fs'

const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'))

const LONG_NOW_YEAR_DIGITS = 5

export const META = {
  APPLE_TOUCH_ICON: 'apple-touch-icon.png',
  AUTHOR: 'Tyler Etters',
  EMAIL: 'tyler@etters.co',
  BUILD_TIME: new Date().toISOString(),
  CANONICAL: 'https://nor.the-rn.info/rm_ation/',
  CREATIVE_COMMONS: 'https://creativecommons.org/licenses/by/4.0/',
  DESCRIPTION: 'LONG LIVE THE LOST ONES',
  DOMAIN: 'https://nor.the-rn.info',
  FAVICON: 'favicon.ico',
  FEED: 'feed.xml',
  GIT_HASH_SHORT: (() => { try { return execSync('git rev-parse --short HEAD').toString().trim() } catch { return 'unknown' } })(),
  GIT_HASH: (() => { try { return execSync('git rev-parse HEAD').toString().trim() } catch { return 'unknown' } })(),
  GITHUB_URL: 'https://github.com/tyleretters/nor.the-rn.info',
  INVOCATION: 'cd LOST_DIR && ./DISAPPEAR',
  LOGO: 'applied-sciences-and-phantasms-working-division.png',
  DISCOGRAPHY_URL: 'https://www.npmjs.com/package/@tyleretters/discography',
  DISCOGRAPHY_VERSION: packageJson.devDependencies['@tyleretters/discography'].replace(/^\^/, ''),
  TITLE: 'Northern Information',
  YEAR: String(new Date().getUTCFullYear()).padStart(LONG_NOW_YEAR_DIGITS, '0'),
}

export const DIRS = {
  DATA: 'data',
  IMAGES: 'images',
  INCLUDES: 'includes',
  INPUT: 'src',
  FONTS: 'fonts',
  LAYOUTS: 'layouts',
  OUTPUT: 'dist',
  PAGES: 'pages',
  POSTS: 'posts',
}

export const getReleaseSlug = memoize((release) => {
  return `${release.project_slug}/${release.release_slug}/`
})

// Map a release's project_slug to the canonical project slug
const getCanonicalProjectSlug = memoize((projectSlug) => {
  for (const project of projects) {
    const allSlugs = project.slugs || [project.slug]
    if (allSlugs.includes(projectSlug)) {
      return project.slug
    }
  }
  return projectSlug
})

export default async (eleventyConfig) => {
  eleventyConfig.addShortcode(
    'getTitle',
    memoize((title) => {
      return title ? `${title} | ${META.TITLE}` : META.TITLE
    })
  )

  eleventyConfig.addShortcode(
    'getReleaseSlug',
    memoize((release) => getReleaseSlug(release))
  )

  eleventyConfig.addShortcode('getTimestamp', () => {
    return Math.floor(new Date().getTime() / 1000)
  })

  eleventyConfig.addFilter(
    'toTitleCase',
    memoize((input) => {
      // Check if input is in the exceptions list (imported from data file)
      if (titleCaseExceptions.includes(input)) {
        return input
      }
      // prettier-ignore
      const exceptions = ['of', 'a', 'the', 'and', 'in', 
      'on', 'with', 'at', 'by', 'from', 'to']
      return input
        .split(' ')
        .map((word, index) => {
          if (/^[A-Z]\.[A-Z](\.[A-Z])?$/i.test(word)) {
            return word.toUpperCase()
          }
          if (index === 0 || !exceptions.includes(word.toLowerCase())) {
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          }
          return word.toLowerCase()
        })
        .join(' ')
    })
  )

  eleventyConfig.addFilter(
    'stripLeadingZero',
    memoize((input) => {
      return typeof input === 'string' ? input.replace(/^0/, '') : input
    })
  )

  eleventyConfig.addFilter(
    'toLongNowYear',
    memoize((year) => {
      return String(year).padStart(LONG_NOW_YEAR_DIGITS, '0')
    })
  )

  eleventyConfig.addFilter(
    'padIndex',
    memoize((index) => {
      return String(index).padStart(2, '0')
    })
  )

  eleventyConfig.addFilter(
    'formatTrackLength',
    memoize((input) => {
      if (typeof input !== 'string') return input
      // Strip leading "00:" for tracks under an hour (e.g., "00:03:13" -> "03:13")
      return input.replace(/^00:/, '')
    })
  )

  // Helper to parse dates, handling:
  // - 5-digit Long Now years (e.g., "02006" -> "2006")
  // - Partial dates with ?? for unknown month/day (e.g., "02006-??-??")
  const parseDate = (date) => {
    // Strip leading zero from 5-digit years
    const str = String(date).replace(/^0(\d{4})/, '$1')
    const hasUnknown = str.includes('??')
    if (hasUnknown) {
      // Extract year from partial date like "2006-??-??"
      const match = str.match(/^(\d{4})/)
      return match ? { year: match[1], partial: true } : null
    }
    const dt = DateTime.fromJSDate(new Date(str), { zone: 'utc' })
    return dt.isValid ? { dt, partial: false } : null
  }

  eleventyConfig.addFilter(
    'dateToUTC',
    memoize((date, format = 'yyyy/MM/dd') => {
      const parsed = parseDate(date)
      if (!parsed) return ''
      if (parsed.partial) return parsed.year
      return parsed.dt.toFormat(format)
    })
  )

  eleventyConfig.addFilter(
    'dateToUTCFull',
    memoize((date) => {
      const parsed = parseDate(date)
      if (!parsed) return ''
      if (parsed.partial) return parsed.year.padStart(LONG_NOW_YEAR_DIGITS, '0')
      const longNowYear = parsed.dt.toFormat('yyyy').padStart(LONG_NOW_YEAR_DIGITS, '0')
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

  eleventyConfig.addFilter(
    'toJson',
    memoize((json) => {
      return JSON.stringify(json, null, 2)
    })
  )

  const markdownLib = markdownIt({
    html: true,
    breaks: true,
  }).use(implicitFigures, {
    figcaption: false,
  })

  eleventyConfig.setLibrary('md', markdownLib)

  eleventyConfig.addFilter(
    'markdown',
    memoize((content) => {
      return markdownLib.render(content)
    })
  )

  eleventyConfig.addFilter('linkify', (content) => {
    if (typeof content !== 'string') return content
    // Match URLs (http, https) and convert to anchor tags
    const urlRegex = /(https?:\/\/[^\s<>"']+)/gi
    return content.replace(urlRegex, (url) => {
      // Clean up trailing punctuation that's likely not part of the URL
      const trailingPunct = /[.,;:!?)]+$/
      const match = url.match(trailingPunct)
      const cleanUrl = match ? url.slice(0, -match[0].length) : url
      const trailing = match ? match[0] : ''
      return `<a href="${cleanUrl}" class="text-yellow-300 underline hover:text-yellow-500 hover:no-underline">${cleanUrl}</a>${trailing}`
    })
  })

  eleventyConfig.addFilter('extractExcerpt', (content, maxLength = 160) => {
    if (typeof content !== 'string') return ''
    const text = content.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength).replace(/\s\S*$/, '') + '...'
  })

  eleventyConfig.addFilter('extractFirstImage', (content) => {
    if (typeof content !== 'string') return null
    // Match the first <img> tag and extract its src attribute
    const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i)
    return imgMatch ? imgMatch[1] : null
  })

  // RSS feed filters (for custom feed template in src/feed.liquid)
  eleventyConfig.addFilter('toAbsoluteUrl', (url, baseUrl) => {
    // Converts a URL to absolute if it's relative
    if (!url || typeof url !== 'string') return url
    if (url.startsWith('http://') || url.startsWith('https://')) return url
    const base = baseUrl.replace(/\/$/, '')
    return url.startsWith('/') ? base + url : `${base}/${url}`
  })

  eleventyConfig.addFilter('dateToRfc822Utc', (dateObj) => {
    // Formats dates as RFC 822 with GMT timezone for RSS feeds
    const date = new Date(dateObj)
    return date.toUTCString()
  })

  eleventyConfig.addFilter('convertHtmlToAbsoluteUrls', (htmlContent, baseUrl) => {
    // Converts relative URLs to absolute URLs in HTML content for RSS feeds
    if (typeof htmlContent !== 'string') return htmlContent

    // Remove trailing slash from baseUrl for consistent URL construction
    const base = baseUrl.replace(/\/$/, '')

    return htmlContent
      // Convert relative src attributes (images, scripts, etc.)
      .replace(/src=["'](?!https?:\/\/)([^"']+)["']/gi, (_, url) => {
        const absoluteUrl = url.startsWith('/') ? base + url : `${base}/${url}`
        return `src="${absoluteUrl}"`
      })
      // Convert relative href attributes (links)
      .replace(/href=["'](?!https?:\/\/)(?!mailto:)(?!#)([^"']+)["']/gi, (_, url) => {
        const absoluteUrl = url.startsWith('/') ? base + url : `${base}/${url}`
        return `href="${absoluteUrl}"`
      })
  })

  eleventyConfig.addPlugin(IdAttributePlugin)

  eleventyConfig.addPlugin(EleventyHtmlBasePlugin, {
    extensions: 'html,md,css',
  })

  eleventyConfig.addPassthroughCopy(`${DIRS.INPUT}/${DIRS.FONTS}`)
  eleventyConfig.addPassthroughCopy(`${DIRS.INPUT}/${DIRS.IMAGES}`)
  eleventyConfig.addPassthroughCopy(`${DIRS.INPUT}/${META.APPLE_TOUCH_ICON}`)
  eleventyConfig.addPassthroughCopy(`${DIRS.INPUT}/${META.FAVICON}`)
  eleventyConfig.addPassthroughCopy(`${DIRS.INPUT}/${META.LOGO}`)
  eleventyConfig.addPassthroughCopy(`${DIRS.INPUT}/robots.txt`)
  eleventyConfig.addPassthroughCopy(`${DIRS.INPUT}/styles/pagefind.css`)

  eleventyConfig.setLiquidOptions({ jsTruthy: true, dynamicPartials: false })

  eleventyConfig.addCollection('discography', () => {
    return discography.map((release) => ({
      ...release,
      slug: getReleaseSlug(release),
      canonical_project_slug: getCanonicalProjectSlug(release.project_slug),
    }))
  })

  // Helper to extract year from Long Now date format (e.g., "02025-11-18" or "02006-??-??")
  const getYearFromDate = (dateStr) => {
    const match = String(dateStr).match(/^0?(\d{4})/)
    return match ? parseInt(match[1], 10) : null
  }

  eleventyConfig.addCollection('projects', () => {
    // Validate all discography projects are accounted for
    const discographyProjectSlugs = [...new Set(discography.map((r) => r.project_slug))]
    const allProjectSlugs = new Set(
      projects.flatMap((p) => (p.slugs ? p.slugs : [p.slug]))
    )
    const missing = discographyProjectSlugs.filter((slug) => !allProjectSlugs.has(slug))
    if (missing.length > 0) {
      console.warn('WARNING: Missing projects in projects.js:', missing.join(', '))
    }

    return projects.map((project) => {
      const matchSlugs = project.slugs || [project.slug]
      const releases = discography
        .filter((r) => matchSlugs.includes(r.project_slug))
        .map((r) => ({ ...r, slug: getReleaseSlug(r) }))
        .sort((a, b) => {
          const dateA = new Date(String(a.released).replace(/^0/, '').replace(/\?\?/g, '01'))
          const dateB = new Date(String(b.released).replace(/^0/, '').replace(/\?\?/g, '01'))
          return dateB - dateA
        })

      const years = releases
        .map((r) => getYearFromDate(r.released))
        .filter((y) => y !== null)
        .sort((a, b) => a - b)

      const earliestYear = years.length > 0 ? String(years[0]).padStart(LONG_NOW_YEAR_DIGITS, '0') : null
      const latestYear = years.length > 0 ? String(years[years.length - 1]).padStart(LONG_NOW_YEAR_DIGITS, '0') : null

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
      const year = String(post.date.getUTCFullYear()).padStart(LONG_NOW_YEAR_DIGITS, '0')
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
      .sort((a, b) => b.year - a.year)
  })

  return {
    markdownTemplateEngine: 'liquid',
    dir: {
      input: DIRS.INPUT,
      data: DIRS.DATA,
      includes: DIRS.INCLUDES,
      layouts: DIRS.LAYOUTS,
      output: DIRS.OUTPUT,
    },
  }
}
