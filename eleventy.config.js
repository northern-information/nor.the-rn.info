import { EleventyHtmlBasePlugin, IdAttributePlugin } from '@11ty/eleventy'
import { feedPlugin } from '@11ty/eleventy-plugin-rss'
import { DateTime } from 'luxon'

export const PATH_PREFIX = '/rm_ation/'

export const META = {
  AUTHOR: 'Tyler Etters',
  EMAIL: 'tyler@etters.co',
  TITLE: 'Northern Information',
  DESCRIPTION: 'Midwestern musician holed-up in the mountains by Los Angeles.',
  CANONICAL: `https://nor.the-rn.info${PATH_PREFIX}`,
  LOGO: 'applied-sciences-and-phantasms-working-division.png',
  FAVICON: 'favicon.ico',
  APPLE_TOUCH_ICON: 'apple-touch-icon.png',
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

export default async function (eleventyConfig) {
  // COLLECTIONS

  eleventyConfig.addCollection('posts', function (collectionApi) {
    return collectionApi.getFilteredByGlob(`${DIRS.INPUT}/${DIRS.POSTS}/*`)
  })

  eleventyConfig.addCollection('pages', function (collectionApi) {
    return collectionApi.getFilteredByGlob(`${DIRS.INPUT}/${DIRS.PAGES}/*`)
  })

  // FILTERS

  eleventyConfig.addFilter('dateToUTC', (date, format = 'yyyy/MM/dd') => {
    return DateTime.fromJSDate(new Date(date), { zone: 'utc' }).toFormat(format)
  })

  // PLUGINS

  eleventyConfig.addPlugin(IdAttributePlugin)

  eleventyConfig.addPlugin(EleventyHtmlBasePlugin, {
    baseHref: PATH_PREFIX,
    extensions: 'html,md',
  })

  eleventyConfig.addPlugin(feedPlugin, {
    type: 'atom',
    outputPath: '/feed.xml',
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

  // MISCELLANEOUS

  eleventyConfig.addPassthroughCopy(`${DIRS.INPUT}/${META.FAVICON}`)
  eleventyConfig.addPassthroughCopy(`${DIRS.INPUT}/${META.APPLE_TOUCH_ICON}`)
  eleventyConfig.addPassthroughCopy(`${DIRS.INPUT}/${META.LOGO}`)
  eleventyConfig.addPassthroughCopy(`${DIRS.INPUT}/${DIRS.IMAGES}`)

  eleventyConfig.setLiquidOptions({
    jsTruthy: true,
    dynamicPartials: false,
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
