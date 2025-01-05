import { EleventyHtmlBasePlugin, IdAttributePlugin } from '@11ty/eleventy'
import { feedPlugin } from '@11ty/eleventy-plugin-rss'
import { DateTime } from 'luxon'

export const PATH_PREFIX = '/rm_ation/'

export const META = {
  AUTHOR: 'Tyler Etters',
  EMAIL: 'tyler@etters.co',
  TITLE: 'Northern Information',
  DESCRIPTION: 'Midwestern musician holed-up in the mountains by Los Angeles.',
  CANONICAL: 'https://nor.the-rn.info/rm_ation/',
  LOGO: 'applied-sciences-and-phantasms-working-division.png',
}

export const DIRECTORIES = {
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
    return collectionApi.getFilteredByGlob(
      `${DIRECTORIES.INPUT}/${DIRECTORIES.POSTS}/*`
    )
  })

  eleventyConfig.addCollection('pages', function (collectionApi) {
    return collectionApi.getFilteredByGlob(
      `${DIRECTORIES.INPUT}/${DIRECTORIES.PAGES}/*`
    )
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

  eleventyConfig.addPassthroughCopy(`${DIRECTORIES.INPUT}/favicon.ico`)
  eleventyConfig.addPassthroughCopy(`${DIRECTORIES.INPUT}/apple-touch-icon.png`)
  eleventyConfig.addPassthroughCopy(
    `${DIRECTORIES.INPUT}/${DIRECTORIES.IMAGES}`
  )

  eleventyConfig.setLiquidOptions({
    jsTruthy: true,
    dynamicPartials: false,
  })

  return {
    markdownTemplateEngine: 'liquid',
    pathPrefix: PATH_PREFIX,
    dir: {
      input: DIRECTORIES.INPUT,
      data: DIRECTORIES.DATA,
      includes: DIRECTORIES.INCLUDES,
      layouts: DIRECTORIES.LAYOUTS,
      output: DIRECTORIES.OUTPUT,
    },
  }
}
