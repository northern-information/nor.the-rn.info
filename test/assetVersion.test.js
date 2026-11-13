import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { assetVersion } from '../lib/assetVersion.js'

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'asset-version-'))
const write = (name, content, mtime) => {
  const file = path.join(dir, name)
  fs.writeFileSync(file, content)
  if (mtime) fs.utimesSync(file, mtime, mtime)
  return file
}

test('assetVersion depends on content, not on the build', () => {
  const a = write('a.css', 'body{}')
  const b = write('b.css', 'body{}')
  assert.match(assetVersion(a), /^[0-9a-f]{10}$/)
  assert.equal(assetVersion(a), assetVersion(b))
})

test('assetVersion changes when a file changes', () => {
  const file = write('c.css', 'one', new Date('2026-01-01'))
  const before = assetVersion(file)
  write('c.css', 'two', new Date('2026-01-02'))
  assert.notEqual(assetVersion(file), before)
})

test('assetVersion of several files changes when any one changes', () => {
  const init = write('init.js', 'init')
  const bundle = write('bundle.mjs', 'v1', new Date('2026-01-01'))
  const before = assetVersion(init, bundle)
  write('bundle.mjs', 'v2', new Date('2026-01-02'))
  assert.notEqual(assetVersion(init, bundle), before)
})

test('assetVersion throws for a missing file', () => {
  assert.throws(() => assetVersion(path.join(dir, 'missing.css')))
})
