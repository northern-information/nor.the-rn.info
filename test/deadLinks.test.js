import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatSince, isOwnUrl } from '../lib/deadLinks.js'

test('isOwnUrl: our hosts and GitHub accounts are never marked dead', () => {
  for (const url of [
    'https://nor.the-rn.info/rm_ation/music/',
    'https://dl.the-rn.info/blog/clip.dv',
    'https://assets.the-rn.info/foo.mp3',
    'https://northern-information.github.io/arcologies-docs/',
    'https://tyleretters.github.io/apodcastfornow.com/',
    'https://github.com/tyleretters/discography',
    'https://github.com/Northern-Information/nor.the-rn.info',
  ]) {
    assert.equal(isOwnUrl(url), true, url)
  }
})

test('isOwnUrl: other hosts are not ours', () => {
  for (const url of [
    'https://github.com/monome-community/norns-community',
    'https://notthe-rn.info/',
    'https://norns.community/',
    'not a url',
  ]) {
    assert.equal(isOwnUrl(url), false, url)
  }
})

test('formatSince: Long Now year, UTC', () => {
  assert.equal(formatSince('2026-11-17'), 'November 17, 02026')
  assert.equal(formatSince('2027-01-01'), 'January 01, 02027')
  assert.equal(formatSince('nonsense'), null)
})
