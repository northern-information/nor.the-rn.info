import { DateTime } from 'luxon'

export const DIRECTORIES = {
  INPUT: 'src',
  OUTPUT: 'dist',
  INCLUDES: 'includes',
  LAYOUTS: 'layouts',
  PAGES: 'pages',
  POSTS: 'posts',
  IMAGES: 'images',
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
