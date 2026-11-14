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

// Pages that moved, keyed by the old path without the prefix. A key with `+`
// needs its `%2B` form too, because URL keeps the encoding the client sent.
const MOVED = new Map([
  ['/2022/12/30/sound-+-process/', '/2022/12/30/sound-and-process/'],
  ['/2022/12/30/sound-%2B-process/', '/2022/12/30/sound-and-process/'],
])

// RFC 9116 puts security.txt at the host root, outside the prefix.
const SECURITY_TXT_PATH = '/.well-known/security.txt'

// Enforced. To debug a new embed without breaking pages, change it to
// 'Content-Security-Policy-Report-Only' for one deploy.
const CSP_HEADER = 'Content-Security-Policy'

// Webamp sets inline styles, and Pagefind compiles WebAssembly.
// Cloudflare injects two scripts at the edge: the Web Analytics beacon
// (static.cloudflareinsights.com, reports to cloudflareinsights.com) and an
// inline JavaScript Detections script. Cloudflare reads the nonce from this
// header and adds it to the inline script.
const contentSecurityPolicy = (nonce) =>
  [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'wasm-unsafe-eval' https://static.cloudflareinsights.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://assets.the-rn.info",
    "media-src 'self' blob: https://assets.the-rn.info https://dl.the-rn.info",
    "connect-src 'self' https://assets.the-rn.info https://dl.the-rn.info https://cloudflareinsights.com",
    "font-src 'self' data:",
    'frame-src https://www.youtube.com https://w.soundcloud.com https://open.spotify.com',
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    'upgrade-insecure-requests',
  ].join('; ')

// A new nonce for every response, as the CSP spec requires.
const createNonce = () =>
  btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))))

const SECURITY_HEADERS = {
  'Permissions-Policy': 'camera=(), geolocation=(), microphone=()',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // includeSubDomains: every the-rn.info host serves HTTPS. A browser applies
  // it to assets. and dl. only after it gets this header from the apex.
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
}

const IMMUTABLE = 'public, max-age=31536000, immutable'

// A URL that changes when its content changes can be cached for a year:
// a `ver` query value, or a font (rename it to change it).
function isVersioned(url) {
  return url.searchParams.has('ver') || url.pathname.startsWith('/fonts/')
}

export default {
  async fetch(request, env, ctx) {
    const response = await route(request, env, ctx)
    const headers = new Headers(response.headers)
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
      headers.set(name, value)
    }
    headers.set(CSP_HEADER, contentSecurityPolicy(createNonce()))
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  },
}

async function route(request, env, ctx) {
  const url = new URL(request.url)

  if (ALIAS_HOSTS.has(url.hostname)) {
    const target = new URL(request.url)
    target.protocol = 'https:'
    target.hostname = CANONICAL_HOST
    target.pathname = `${PREFIX}${url.pathname}`
    return Response.redirect(target.toString(), 301)
  }

  // Only the production host: `wrangler dev` serves localhost over HTTP.
  if (url.protocol === 'http:' && url.hostname === CANONICAL_HOST) {
    url.protocol = 'https:'
    return Response.redirect(url.toString(), 301)
  }

  if (url.pathname === SECURITY_TXT_PATH) {
    url.pathname = '/security.txt'
    return env.ASSETS.fetch(new Request(url, request))
  }

  // Bare prefix: redirect to the directory form so relative URLs resolve.
  if (url.pathname === PREFIX) {
    url.pathname = `${PREFIX}/`
    return Response.redirect(url.toString(), 301)
  }

  if (url.pathname.startsWith(`${PREFIX}/`)) {
    url.pathname = url.pathname.slice(PREFIX.length)
    const moved = MOVED.get(url.pathname) ?? MOVED.get(`${url.pathname}/`)
    if (moved) {
      url.pathname = `${PREFIX}${moved}`
      return Response.redirect(url.toString(), 301)
    }
    const imageResponse = await fetchImage(request, url, env, ctx)
    if (imageResponse) return imageResponse
    const response = await env.ASSETS.fetch(new Request(url, request))
    return withCacheControl(withPrefixedLocation(response, url), url)
  }

  const target = new URL(request.url)
  target.pathname = `${PREFIX}${url.pathname}`
  return Response.redirect(target.toString(), 301)
}

// ASSETS sends `max-age=0, must-revalidate` for every file.
function withCacheControl(response, url) {
  if (!response.ok || !isVersioned(url)) return response
  const headers = new Headers(response.headers)
  headers.set('Cache-Control', IMMUTABLE)
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
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
    let name
    try {
      name = decodeURIComponent(url.pathname.slice(pathPrefix.length))
    } catch {
      // A malformed escape such as `%E0` is not an object name.
      return null
    }
    const object = await env.IMAGES.get(R2_PATHS[pathPrefix] + name)
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
