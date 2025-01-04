import { DateTime } from 'luxon'

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
    dir: {
      input: DIRECTORIES.INPUT,
      includes: DIRECTORIES.INCLUDES,
      layouts: DIRECTORIES.LAYOUTS,
      output: DIRECTORIES.OUTPUT,
    },
    markdownTemplateEngine: 'liquid',
    pathPrefix: '/rm_ation/',
  }
}
