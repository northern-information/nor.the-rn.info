const PREFIX = '/rm_ation'
const CANONICAL_HOST = 'nor.the-rn.info'

// Hostnames that 301-redirect to the canonical site (with the prefix).
// Folded in from northern-information-sentinel and etters-co-sentinel.
const ALIAS_HOSTS = new Set([
  'the-rn.info',
  'www.the-rn.info',
  'etters.co',
  'www.etters.co',
])

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (ALIAS_HOSTS.has(url.hostname)) {
      const target = new URL(request.url)
      target.hostname = CANONICAL_HOST
      target.pathname = `${PREFIX}${url.pathname}`
      return Response.redirect(target.toString(), 301)
    }

    if (url.pathname === PREFIX || url.pathname.startsWith(`${PREFIX}/`)) {
      url.pathname = url.pathname.slice(PREFIX.length) || '/'
      return env.ASSETS.fetch(new Request(url, request))
    }

    const target = new URL(request.url)
    target.pathname = `${PREFIX}${url.pathname === '/' ? '/' : url.pathname}`
    return Response.redirect(target.toString(), 301)
  },
}
