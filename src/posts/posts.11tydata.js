const getMimeType = (url) => {
  const ext = url.split('.').pop().toLowerCase().split('?')[0]
  const types = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
  }
  return types[ext] || 'image/jpeg'
}

export default {
  ogType: 'article',
  eleventyComputed: {
    layout: 'post.liquid',
    permalink: (data) => {
      const date = new Date(data.page.date)
      const y = date.getUTCFullYear()
      const m = String(date.getUTCMonth() + 1).padStart(2, '0')
      const d = String(date.getUTCDate()).padStart(2, '0')
      return `/${y}/${m}/${d}/${data.page.fileSlug}/index.html`
    },
    feedImage: (data) => {
      if (typeof data.content !== 'string') return null
      const imgMatch = data.content.match(/<img[^>]+src=["']([^"']+)["']/i)
      return imgMatch ? imgMatch[1] : null
    },
    enclosure: (data) => {
      if (typeof data.content !== 'string') return null
      const imgMatch = data.content.match(/<img[^>]+src=["']([^"']+)["']/i)
      if (!imgMatch) return null
      const url = imgMatch[1]
      return {
        url,
        type: getMimeType(url),
        length: 0, // Placeholder - RSS readers typically don't require accurate length for images
      }
    },
  },
}
