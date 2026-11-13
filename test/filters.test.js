import { test } from 'node:test'
import assert from 'node:assert/strict'
import configure from '../eleventy.config.js'

// Run the real config against a stub that records each filter. Every other
// config call (plugins, collections, passthrough copies) is a no-op.
const filters = {}
const stubConfig = new Proxy(
  {},
  {
    get: (_, key) =>
      key === 'addFilter'
        ? (name, fn) => {
            filters[name] = fn
          }
        : () => {},
  }
)
await configure(stubConfig)

test('date filters use UTC near a year boundary', () => {
  // Frontmatter `date: 2025-12-31` is midnight UTC. A local-time formatter in
  // a timezone west of UTC (see the TZ in the test script) shows December 30.
  const date = new Date('2025-12-31T00:00:00Z')
  assert.equal(filters.dateToUTCFull(date), 'December 31, 02025')
  assert.equal(filters.dateToUTCYear(date), '02025')
  assert.equal(filters.dateToUTCISO(date), '2025-12-31')

  const newYear = new Date('2026-01-01T00:00:00Z')
  assert.equal(filters.dateToUTCYear(newYear), '02026')
})

test('date filters accept Long Now strings', () => {
  assert.equal(filters.dateToUTCFull('02025-11-18'), 'November 18, 02025')
  assert.equal(filters.dateToUTCISO('02025-11-18'), '2025-11-18')
})

test('date filters accept partial dates', () => {
  assert.equal(filters.dateToUTCFull('02006-??-??'), '02006')
  assert.equal(filters.dateToUTCYear('02006-??-??'), '02006')
  assert.equal(filters.dateToUTCISO('02006-??-??'), '2006')
})

test('date filters return an empty string for invalid dates', () => {
  assert.equal(filters.dateToUTCFull('not a date'), '')
  assert.equal(filters.dateToUTCYear(new Date('invalid')), '')
})

test('padIndex and formatTrackLength', () => {
  assert.equal(filters.padIndex(1), '01')
  assert.equal(filters.padIndex(12), '12')
  assert.equal(filters.formatTrackLength('00:03:13'), '03:13')
  assert.equal(filters.formatTrackLength('01:03:13'), '01:03:13')
})

test('linkify wraps bare URLs once and keeps trailing punctuation outside', () => {
  const out = filters.linkify('See https://example.com.')
  assert.match(
    out,
    /<a href="https:\/\/example\.com" [^>]*>https:\/\/example\.com<\/a>\.$/
  )

  const linked = '<a href="https://example.com">https://example.com</a>'
  assert.equal(filters.linkify(linked), linked)
})

test('extractExcerpt strips tags, decodes entities, and truncates on a word', () => {
  assert.equal(
    filters.extractExcerpt('<p>Tom &amp; Jerry&#39;s</p>'),
    "Tom & Jerry's"
  )
  const long = 'word '.repeat(50)
  const excerpt = filters.extractExcerpt(long, 20)
  assert.equal(excerpt, 'word word word word...')
})

test('toAbsoluteUrl and convertHtmlToAbsoluteUrls', () => {
  assert.equal(
    filters.toAbsoluteUrl('/images/x.png', 'https://nor.the-rn.info/rm_ation/'),
    'https://nor.the-rn.info/rm_ation/images/x.png'
  )
  assert.equal(
    filters.toAbsoluteUrl('https://a.b/c', 'https://x.y/'),
    'https://a.b/c'
  )

  const html = filters.convertHtmlToAbsoluteUrls(
    '<img src="/images/x.png" srcset="/a.png 1x, /b.png 2x"><a href="#top">t</a>',
    'https://nor.the-rn.info/rm_ation/blog/'
  )
  assert.match(
    html,
    /src="https:\/\/nor\.the-rn\.info\/rm_ation\/images\/x\.png"/
  )
  assert.match(
    html,
    /srcset="https:\/\/nor\.the-rn\.info\/rm_ation\/a\.png 1x, https:\/\/nor\.the-rn\.info\/rm_ation\/b\.png 2x"/
  )
  assert.match(html, /href="#top"/)
})

test('imageMimeType', () => {
  assert.equal(filters.imageMimeType('/x/y.JPG?v=1'), 'image/jpeg')
  assert.equal(filters.imageMimeType('/x/y.webp'), 'image/webp')
  assert.equal(filters.imageMimeType('/x/y'), 'application/octet-stream')
})

test('jsonLd escapes < so a value cannot close the script element', () => {
  assert.equal(
    filters.jsonLd({ name: '</script><b>' }),
    '{"name":"\\u003c/script>\\u003cb>"}'
  )
  assert.equal(filters.jsonLd(null), '')
})

test('structuredData builds MusicAlbum, MusicGroup and BlogPosting', () => {
  const album = filters.structuredData({
    release: {
      title: 'T',
      project: 'P',
      released: '02006-??-??',
      tracks: [{ title: 'one', length: '01:02:03' }],
    },
    url: 'https://x/',
  })
  assert.equal(album['@type'], 'MusicAlbum')
  assert.equal(album.datePublished, '2006')
  assert.equal(album.track[0].duration, 'PT1H2M3S')

  const group = filters.structuredData({ project: { name: 'P', bio: 'b' } })
  assert.equal(group['@type'], 'MusicGroup')
  assert.equal(group.sameAs, undefined)

  const post = filters.structuredData({
    isPost: true,
    title: 'T',
    date: new Date('2025-12-31T00:00:00Z'),
  })
  assert.equal(post['@type'], 'BlogPosting')
  assert.equal(post.datePublished, '2025-12-31')

  assert.equal(filters.structuredData({}), null)
})

test('securityTxtExpires is under a year away, in whole seconds', () => {
  assert.equal(
    filters.securityTxtExpires('2026-11-13T21:01:40.470Z'),
    '2027-11-12T21:01:40Z'
  )
})

test('replaceLast and removeFirst', () => {
  assert.equal(filters.replaceLast('a/b/c/', '/', ''), 'a/b/c')
  assert.equal(filters.removeFirst('a-b-c', '-'), 'ab-c')
})
