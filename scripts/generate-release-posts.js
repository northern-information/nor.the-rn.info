#!/usr/bin/env node

/**
 * Generate blog posts for music releases from @tyleretters/discography
 *
 * Usage:
 *   npm run generate-release-posts           # Generate all missing release posts
 *   npm run generate-release-posts -- --all  # Regenerate ALL release posts (overwrites existing)
 *   npm run generate-release-posts -- --release "RELEASE TITLE"  # Generate specific release
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import discography from '@tyleretters/discography'
import { META, getCanonicalProjectSlug } from '../eleventy.config.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const POSTS_DIR = path.join(__dirname, '../src/posts')

// "02025-11-18" -> "2025-11-18". Unknown month or day ("2006-??-??") becomes 01.
function parseReleaseDate(dateStr) {
  const normalized = dateStr.replace(/^0+/, '').replace(/\?\?/g, '01')

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    console.warn(`  Warning: Could not parse date "${dateStr}", using as-is`)
  }

  return normalized
}

// NFKD turns styled Unicode (Mathematical Script, Fraktur) into base letters.
function normalizeUnicode(text) {
  return text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
}

// "00:03:45" -> "3:45"
function formatDuration(length) {
  if (!length) return ''
  return length.replace(/^00:/, '').replace(/^0/, '')
}

function generatePostContent(release) {
  const lines = []

  lines.push('---')
  const title = normalizeUnicode(release.title)
  lines.push(`title: "${title.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`)
  lines.push(`date: ${parseReleaseDate(release.released)}`)
  lines.push('---')
  lines.push('')

  if (release.cover_url) {
    lines.push(`![${title}](${release.cover_url})`)
    lines.push('')
  }

  const projectUrl = `/project/${getCanonicalProjectSlug(release.project_slug)}/`
  lines.push(`**${release.type}** by **[${release.project}](${projectUrl})**`)
  if (release.label) {
    lines.push([release.label, release.format].filter(Boolean).join(' · '))
  }
  lines.push('')

  const releaseUrl = `${META.CANONICAL}music/${release.project_slug}/${release.release_slug}/`
  lines.push(`[Listen & Download](${releaseUrl})`)
  lines.push('')

  if (release.tracks && release.tracks.length > 0) {
    lines.push('## Tracklist')
    lines.push('')
    for (const track of release.tracks) {
      const duration = formatDuration(track.length)
      const durationStr = duration ? ` (${duration})` : ''
      lines.push(
        `${track.number}. ${normalizeUnicode(track.title)}${durationStr}`
      )
    }
    lines.push('')
  }

  if (release.notes && release.notes.trim()) {
    lines.push('## Notes')
    lines.push('')
    lines.push(release.notes.trim())
    lines.push('')
  }

  if (release.credits && release.credits.trim()) {
    lines.push('## Credits')
    lines.push('')
    lines.push(release.credits.trim())
    lines.push('')
  }

  return lines.join('\n')
}

// release_slug is safe for file names. Titles can hold fancy Unicode and quotes.
function generateFilename(release) {
  const date = parseReleaseDate(release.released)
  return `${date}-${release.release_slug}.md`
}

function writePost(release, overwrite = false) {
  const filename = generateFilename(release)
  const filepath = path.join(POSTS_DIR, filename)

  if (fs.existsSync(filepath) && !overwrite) {
    console.log(`  Skipping "${release.title}" - post already exists`)
    return false
  }

  const content = generatePostContent(release)
  fs.writeFileSync(filepath, content, 'utf-8')
  console.log(`  Created: ${filename}`)
  return true
}

function main() {
  const args = process.argv.slice(2)
  const overwriteAll = args.includes('--all')
  const releaseIndex = args.indexOf('--release')
  const specificRelease = releaseIndex !== -1 ? args[releaseIndex + 1] : null

  console.log('Generate Release Posts')
  console.log('======================')
  console.log(`Found ${discography.length} releases in discography\n`)

  fs.mkdirSync(POSTS_DIR, { recursive: true })

  let created = 0
  let skipped = 0

  if (specificRelease) {
    const release = discography.find(
      (r) =>
        normalizeUnicode(r.title).toLowerCase() ===
        specificRelease.toLowerCase()
    )

    if (!release) {
      console.error(`Error: Release "${specificRelease}" not found.`)
      console.log('\nAvailable releases:')
      discography.forEach((r) => console.log(`  - ${r.title}`))
      process.exit(1)
    }

    console.log(`Generating post for: ${release.title}`)
    if (writePost(release, true)) {
      created++
    }
  } else {
    console.log(
      overwriteAll
        ? 'Regenerating ALL posts...\n'
        : 'Generating missing posts...\n'
    )

    for (const release of discography) {
      if (writePost(release, overwriteAll)) {
        created++
      } else {
        skipped++
      }
    }
  }

  console.log('\n--- Summary ---')
  console.log(`Created: ${created}`)
  if (skipped > 0) {
    console.log(`Skipped: ${skipped} (already exist, use --all to overwrite)`)
  }
}

main()
