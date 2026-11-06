import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'

// Eleventy publishes every Markdown file in src/posts/ as a post, so a stray
// file (for example agent instructions) becomes a public page and feed item.
// .DS_Store is skipped: Finder writes it on macOS, git ignores it and
// Eleventy does not publish it.
test('src/posts/ holds only dated posts and the directory data file', () => {
  const postsDir = new URL('../src/posts/', import.meta.url)
  const unexpected = fs
    .readdirSync(postsDir)
    .filter(
      (file) =>
        file !== '.DS_Store' &&
        file !== 'posts.11tydata.js' &&
        !/^\d{4}-\d{2}-\d{2}-.+\.md$/.test(file)
    )
  assert.deepEqual(unexpected, [])
})
