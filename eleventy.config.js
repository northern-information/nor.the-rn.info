import { EleventyHtmlBasePlugin } from '@11ty/eleventy'
import { DateTime } from 'luxon'

export const PATH_PREFIX = '/rm_ation/'

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
  eleventyConfig.addPlugin(EleventyHtmlBasePlugin, {
    baseHref: PATH_PREFIX,
    extensions: 'html,md',
  })

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

  eleventyConfig.addFilter('dateToUTC', (date, format = 'yyyy/MM/dd') => {
    return DateTime.fromJSDate(new Date(date), { zone: 'utc' }).toFormat(format)
  })

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
