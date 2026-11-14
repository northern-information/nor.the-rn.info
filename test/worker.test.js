import { test } from 'node:test'
import assert from 'node:assert/strict'
import worker from '../worker/index.js'

// ASSETS echoes the path it got, so a test can see what the Worker forwarded.
const env = {
  ASSETS: {
    fetch: async (request) =>
      new Response(new URL(request.url).pathname, { status: 200 }),
  },
}

const get = (url) => worker.fetch(new Request(url), env, {})

const redirect = async (url) => {
  const response = await get(url)
  return [response.status, response.headers.get('Location')]
}

test('plain HTTP on the canonical host redirects to HTTPS in one hop', async () => {
  assert.deepEqual(await redirect('http://nor.the-rn.info/rm_ation/music/'), [
    301,
    'https://nor.the-rn.info/rm_ation/music/',
  ])
  assert.deepEqual(
    await redirect('http://nor.the-rn.info/.well-known/security.txt'),
    [301, 'https://nor.the-rn.info/.well-known/security.txt'],
  )
})

test('alias hosts redirect to HTTPS on the canonical host', async () => {
  for (const host of ['the-rn.info', 'www.the-rn.info']) {
    for (const scheme of ['http', 'https']) {
      assert.deepEqual(await redirect(`${scheme}://${host}/about/`), [
        301,
        'https://nor.the-rn.info/rm_ation/about/',
      ])
    }
  }
})

test('HTTPS on the canonical host serves the page', async () => {
  const response = await get('https://nor.the-rn.info/rm_ation/music/')
  assert.equal(response.status, 200)
  assert.equal(await response.text(), '/music/')
})

test('localhost keeps plain HTTP for wrangler dev', async () => {
  const response = await get('http://localhost:8787/rm_ation/music/')
  assert.equal(response.status, 200)
})

test('every response sends HSTS for subdomains and a CSP', async () => {
  const response = await get('http://the-rn.info/')
  assert.equal(
    response.headers.get('Strict-Transport-Security'),
    'max-age=31536000; includeSubDomains',
  )
  assert.match(
    response.headers.get('Content-Security-Policy'),
    /'nonce-[A-Za-z0-9+/]+=*'.*upgrade-insecure-requests/,
  )
})

test('the old Sound + Process URL redirects to the new one', async () => {
  for (const path of ['sound-+-process/', 'sound-%2B-process/']) {
    assert.deepEqual(
      await redirect(`https://nor.the-rn.info/rm_ation/2022/12/30/${path}`),
      [301, 'https://nor.the-rn.info/rm_ation/2022/12/30/sound-and-process/'],
    )
  }
})
