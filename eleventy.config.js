import { EleventyHtmlBasePlugin, IdAttributePlugin } from '@11ty/eleventy'
import { feedPlugin } from '@11ty/eleventy-plugin-rss'
import markdownIt from 'markdown-it'
import { DateTime } from 'luxon'
import { execSync } from 'child_process'

export const PATH_PREFIX = '/rm_ation/'

export const META = {
  APPLE_TOUCH_ICON: 'apple-touch-icon.png',
  AUTHOR: 'Tyler Etters',
  BUILD_TIME: new Date().toISOString(),
  CANONICAL: `https://nor.the-rn.info${PATH_PREFIX}`,
  CREATIVE_COMMONS: 'https://creativecommons.org/licenses/by/4.0/',
  DAUNTLESS_CHOIR_URL:
    'https://gist.github.com/tyleretters/3743b6d5e27ee50d51b7da9f9293c40f',
  DESCRIPTION: 'Midwestern musician holed-up in the mountains by Los Angeles.',
  FAVICON: 'favicon.ico',
  FEED: 'feed.xml',
  GIT_HASH_SHORT: execSync('git rev-parse --short HEAD').toString().trim(),
  GIT_HASH: execSync('git rev-parse HEAD').toString().trim(),
  GITHUB_URL: 'https://github.com/tyleretters/rm_ation',
  INVOCATION: 'cd LOST_DIR && ./DISAPPEAR',
  LOGO: 'applied-sciences-and-phantasms-working-division.png',
  TITLE: 'Northern Information',
  YEAR: new Date().getUTCFullYear(),
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

export default async (eleventyConfig) => {
  eleventyConfig.addShortcode('getTitle', (title) => {
    return `${title} | ${META.TITLE}`
  })

  eleventyConfig.addShortcode('getTimestamp', () => {
    return Math.floor(new Date().getTime() / 1000)
  })

  eleventyConfig.addFilter('dateToUTC', (date, format = 'yyyy/MM/dd') => {
    return DateTime.fromJSDate(new Date(date), { zone: 'utc' }).toFormat(format)
  })

  eleventyConfig.addFilter('toJson', (json) => {
    return JSON.stringify(json, null, 2)
  })

  const markdownLib = markdownIt({
    html: true,
  })

  eleventyConfig.setLibrary('md', markdownLib)

  eleventyConfig.addFilter('markdown', (content) => {
    return markdownLib.render(content)
  })

  eleventyConfig.addPlugin(IdAttributePlugin)

  eleventyConfig.addPlugin(EleventyHtmlBasePlugin, {
    baseHref: PATH_PREFIX,
    extensions: 'html,md',
  })

  eleventyConfig.addPlugin(feedPlugin, {
    type: 'atom',
    outputPath: `/${META.FEED}`,
    collection: {
      name: 'posts',
      limit: 10,
    },
    metadata: {
      language: 'en',
      title: META.TITLE,
      subtitle: META.DESCRIPTION,
      base: META.CANONICAL,
      author: {
        name: META.AUTHOR,
        email: META.EMAIL,
      },
    },
  })

  eleventyConfig.addPassthroughCopy(`${DIRS.INPUT}/${META.FAVICON}`)
  eleventyConfig.addPassthroughCopy(`${DIRS.INPUT}/${META.APPLE_TOUCH_ICON}`)
  eleventyConfig.addPassthroughCopy(`${DIRS.INPUT}/${META.LOGO}`)
  eleventyConfig.addPassthroughCopy(`${DIRS.INPUT}/${DIRS.IMAGES}`)

  eleventyConfig.setLiquidOptions({
    jsTruthy: true,
    dynamicPartials: false,
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

  return {
    markdownTemplateEngine: 'liquid',
    pathPrefix: PATH_PREFIX,
    dir: {
      input: DIRS.INPUT,
      data: DIRS.DATA,
      includes: DIRS.INCLUDES,
      layouts: DIRS.LAYOUTS,
      output: DIRS.OUTPUT,
    },
  }
}
