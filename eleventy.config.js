import { DateTime } from 'luxon'

export default async function (eleventyConfig) {
  eleventyConfig.addCollection('posts', function (collectionApi) {
    return collectionApi.getFilteredByGlob('src/_posts/*')
  })

  eleventyConfig.addCollection('pages', function (collectionApi) {
    return collectionApi.getFilteredByGlob('src/_pages/*')
  })

  eleventyConfig.addFilter('dateToUTC', (date, format = 'yyyy/MM/dd') => {
    return DateTime.fromJSDate(new Date(date), { zone: 'utc' }).toFormat(format)
  })

  eleventyConfig.addPassthroughCopy('src/images')

  eleventyConfig.setLiquidOptions({
    jsTruthy: true,
    dynamicPartials: false,
  })

  return {
    dir: {
      input: 'src',
      includes: '_includes',
      layouts: '_layouts',
      output: 'dist',
    },
    markdownTemplateEngine: 'liquid',
    pathPrefix: '/rm_ation/',
  }
}
