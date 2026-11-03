const PREFIX = '/rm_ation'
const CANONICAL_HOST = 'nor.the-rn.info'

// Apex and www of the-rn.info redirect to the canonical site (with the prefix).
// etters.co has its own dedicated Worker (tyleretters/etters.co).
const ALIAS_HOSTS = new Set(['the-rn.info', 'www.the-rn.info'])

// Site images are not in the static assets. They live in the IMAGES R2
// bucket under these keys (see lib/images.js).
const R2_PATHS = {
  '/images/': 'site/images/',
  '/img-optimized/': 'site/img-optimized/',
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)

    if (ALIAS_HOSTS.has(url.hostname)) {
      const target = new URL(request.url)
      target.hostname = CANONICAL_HOST
      target.pathname = `${PREFIX}${url.pathname}`
      return Response.redirect(target.toString(), 301)
    }

    // Bare prefix: redirect to the directory form so relative URLs resolve.
    if (url.pathname === PREFIX) {
      url.pathname = `${PREFIX}/`
      return Response.redirect(url.toString(), 301)
    }

    if (url.pathname.startsWith(`${PREFIX}/`)) {
      url.pathname = url.pathname.slice(PREFIX.length)
      const imageResponse = await fetchImage(request, url, env, ctx)
      if (imageResponse) return imageResponse
      const response = await env.ASSETS.fetch(new Request(url, request))
      return withPrefixedLocation(response, url)
    }

    const target = new URL(request.url)
    target.pathname = `${PREFIX}${url.pathname}`
    return Response.redirect(target.toString(), 301)
  },
}

// ASSETS issues its own redirects (e.g. `/about` -> `/about/` via
// html_handling). Its Location is unprefixed, which would cost the client a
// second hop through the catch-all redirect above, so prefix it here.
function withPrefixedLocation(response, requestUrl) {
  const location = response.headers.get('Location')
  if (!location) return response

  const target = new URL(location, requestUrl)
  if (
    target.origin !== requestUrl.origin ||
    target.pathname.startsWith(`${PREFIX}/`)
  ) {
    return response
  }
  target.pathname = `${PREFIX}${target.pathname}`

  const headers = new Headers(response.headers)
  headers.set('Location', target.toString())
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

// Serve a site image from R2 through the edge cache. Returns null when the
// path is not an image path or the object does not exist, so the request
// goes on to ASSETS (which answers a missing file with the 404 page).
async function fetchImage(request, url, env, ctx) {
  const pathPrefix = Object.keys(R2_PATHS).find((path) =>
    url.pathname.startsWith(path)
  )
  if (!pathPrefix) return null

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } })
  }

  // The cache key is the GET form of the request, so HEAD reuses it.
  const cacheKey = new Request(request.url, { method: 'GET' })
  const cache = caches.default
  let response = await cache.match(cacheKey)

  if (!response) {
    const key =
      R2_PATHS[pathPrefix] +
      decodeURIComponent(url.pathname.slice(pathPrefix.length))
    const object = await env.IMAGES.get(key)
    if (!object) return null

    const headers = new Headers()
    object.writeHttpMetadata(headers)
    headers.set('ETag', object.httpEtag)
    if (!headers.has('Cache-Control')) {
      headers.set('Cache-Control', 'public, max-age=86400')
    }
    response = new Response(object.body, { headers })
    ctx.waitUntil(cache.put(cacheKey, response.clone()))
  }

  if (request.headers.get('If-None-Match') === response.headers.get('ETag')) {
    return new Response(null, { status: 304, headers: response.headers })
  }
  if (request.method === 'HEAD') {
    return new Response(null, { headers: response.headers })
  }
  return response
}
