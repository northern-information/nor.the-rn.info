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
  layout: 'post',
  eleventyComputed: {
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
