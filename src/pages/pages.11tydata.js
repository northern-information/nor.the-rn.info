export default {
  eleventyComputed: {
    permalink: (data) => `/${data.page.fileSlug}/index.html`,
  },
}
