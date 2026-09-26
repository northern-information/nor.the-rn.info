const PREFIX = '/rm_ation'
const CANONICAL_HOST = 'nor.the-rn.info'

// Apex and www of the-rn.info redirect to the canonical site (with the prefix).
// etters.co has its own dedicated Worker (tyleretters/etters.co).
const ALIAS_HOSTS = new Set(['the-rn.info', 'www.the-rn.info'])

export default {
  async fetch(request, env) {
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
