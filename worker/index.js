const PREFIX = '/rm_ation'

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (url.pathname === PREFIX || url.pathname.startsWith(`${PREFIX}/`)) {
      url.pathname = url.pathname.slice(PREFIX.length) || '/'
      return env.ASSETS.fetch(new Request(url, request))
    }

    const target = new URL(request.url)
    target.pathname = `${PREFIX}${url.pathname === '/' ? '/' : url.pathname}`
    return Response.redirect(target.toString(), 301)
  },
}
