export default {
  ogType: 'article',
  eleventyComputed: {
    layout: 'post.njk',
    permalink: (data) => {
      const date = new Date(data.page.date)
      const y = date.getUTCFullYear()
      const m = String(date.getUTCMonth() + 1).padStart(2, '0')
      const d = String(date.getUTCDate()).padStart(2, '0')
      return `/${y}/${m}/${d}/${data.page.fileSlug}/index.html`
    },
  },
}
