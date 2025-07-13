import { EleventyHtmlBasePlugin, IdAttributePlugin } from '@11ty/eleventy'
import { feedPlugin } from '@11ty/eleventy-plugin-rss'
import markdownIt from 'markdown-it'
import { DateTime } from 'luxon'
import { execSync } from 'child_process'
import implicitFigures from 'markdown-it-implicit-figures'
import slugify from 'slugify'
import discography from '@tyleretters/discography'
import memoize from 'memoize'

export const META = {
  APPLE_TOUCH_ICON: 'apple-touch-icon.png',
  AUTHOR: 'Tyler Etters',
  BUILD_TIME: new Date().toISOString(),
  CANONICAL: 'https://nor.the-rn.info/rm_ation/',
  CREATIVE_COMMONS: 'https://creativecommons.org/licenses/by/4.0/',
  DESCRIPTION: 'LONG LIVE THE LOST ONES',
  FAVICON: 'favicon.ico',
  FEED: 'feed.xml',
  GIT_HASH_SHORT: execSync('git rev-parse --short HEAD').toString().trim(),
  GIT_HASH: execSync('git rev-parse HEAD').toString().trim(),
  GITHUB_URL: 'https://github.com/tyleretters/nor.the-rn.info',
  INVOCATION: 'cd LOST_DIR && ./DISAPPEAR',
  LOGO: 'applied-sciences-and-phantasms-working-division.png',
  DISCOGRAPHY_URL: 'http://npmjs.com/package/@tyleretters/discography',
  TITLE: 'Northern Information',
  YEAR: new Date().getUTCFullYear(),
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
  const project = slugify(release.project, { lower: true, strict: true })
  const title = slugify(release.title, { lower: true, strict: true })
  return `${project}/${title}/`
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

  eleventyConfig.addShortcode(
    'getTimestamp',
    memoize(() => {
      return Math.floor(new Date().getTime() / 1000)
    })
  )

  eleventyConfig.addFilter(
    'toTitleCase',
    memoize((input) => {
      // prettier-ignore
      const ignoreList = [
        'A report on our findings',
        'EP1', 'EP2', 'EP3', 'E.P.', 'FCIV',
        'the geometrie of our lost cause',
        'blue, the most celestial color', 'senescence',
        'the phantoms of our lost cause', 'zulu',
        'and though the soft apocalypse may yet overtake',
        'the legacy of our lost cause',
        'dispatches from the prime meridian', 'reverence',
      ]
      if (ignoreList.includes(input)) {
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
    'dateToUTC',
    memoize((date, format = 'yyyy/MM/dd') => {
      return DateTime.fromJSDate(new Date(date), { zone: 'utc' }).toFormat(
        format
      )
    })
  )

  eleventyConfig.addFilter(
    'toJson',
    memoize((json) => {
      return JSON.stringify(json, null, 2)
    })
  )

  const markdownLib = markdownIt({ html: true }).use(implicitFigures, {
    figcaption: false,
  })

  eleventyConfig.setLibrary('md', markdownLib)

  eleventyConfig.addFilter(
    'markdown',
    memoize((content) => {
      return markdownLib.render(content)
    })
  )

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
  eleventyConfig.addPassthroughCopy(
    `${DIRS.INPUT}/styles/pagefind-ui-custom.css`
  )

  eleventyConfig.setLiquidOptions({ jsTruthy: true, dynamicPartials: false })

  eleventyConfig.addCollection('discography', () => {
    return discography.map((release) => ({
      ...release,
      slug: getReleaseSlug(release),
    }))
  })

  eleventyConfig.addCollection('posts', (collectionApi) => {
    return collectionApi.getFilteredByGlob(`${DIRS.INPUT}/${DIRS.POSTS}/*`)
  })

  eleventyConfig.addCollection('postsByYear', (collectionApi) => {
    const posts = collectionApi.getFilteredByGlob(
      `${DIRS.INPUT}/${DIRS.POSTS}/*`
    )
    const grouped = posts.reduce((acc, post) => {
      const year = post.date.getFullYear()
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

  eleventyConfig.addPlugin(feedPlugin, {
    type: 'atom',
    outputPath: `/${META.FEED}`,
    collection: { name: 'posts', limit: 10 },
    metadata: {
      language: 'en',
      title: META.TITLE,
      subtitle: META.DESCRIPTION,
      base: META.CANONICAL,
      author: { name: META.AUTHOR, email: META.EMAIL },
    },
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
