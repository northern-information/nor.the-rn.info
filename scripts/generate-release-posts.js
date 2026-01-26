#!/usr/bin/env node

/**
 * Generate blog posts for music releases from @tyleretters/discography
 *
 * Usage:
 *   npm run generate-release-posts           # Generate all missing release posts
 *   npm run generate-release-posts -- --all  # Regenerate ALL release posts (overwrites existing)
 *   npm run generate-release-posts -- --release "RELEASE TITLE"  # Generate specific release
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import discography from '@tyleretters/discography';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const POSTS_DIR = path.join(__dirname, '../src/posts');

/**
 * Convert discography date to blog-friendly date
 * Handles: "02025-11-18", "2006-??-??", "2006-05-??"
 */
function parseReleaseDate(dateStr) {
  // Remove leading zero for Long Now format (02025 -> 2025)
  let normalized = dateStr.replace(/^0+/, '');

  // Replace unknown parts with defaults (01 for month/day)
  normalized = normalized.replace(/\?\?/g, (match, offset) => '01');

  // Validate we have a proper date
  const parts = normalized.split('-');
  if (parts.length !== 3) {
    console.warn(`  Warning: Could not parse date "${dateStr}", using as-is`);
    return normalized;
  }

  return normalized;
}

/**
 * Generate a slug from release title
 */
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Format track duration (handles various formats)
 */
function formatDuration(length) {
  if (!length) return '';
  // Remove leading zeros from hours if present (00:03:45 -> 3:45)
  return length.replace(/^00:/, '').replace(/^0/, '');
}

/**
 * Generate markdown content for a release
 */
function generatePostContent(release) {
  const lines = [];

  // Frontmatter
  lines.push('---');
  lines.push(`title: "${release.title.replace(/"/g, '\\"')}"`);
  lines.push(`date: ${parseReleaseDate(release.released)}`);
  lines.push(`tags: ["Music", "${release.project}"]`);
  lines.push('---');
  lines.push('');

  // Artwork
  if (release.cover_url) {
    lines.push(`![${release.title}](${release.cover_url})`);
    lines.push('');
  }

  // Release info
  const projectUrl = `/project/${release.project_slug}/`;
  lines.push(`**${release.type}** by **[${release.project}](${projectUrl})**`);
  if (release.label) {
    lines.push(`${release.label} · ${release.format}`);
  }
  lines.push('');

  // Listen & Download link
  const releaseUrl = `/music/${release.project_slug}/${release.release_slug}/`;
  lines.push(`[Listen & Download](${releaseUrl})`);
  lines.push('');

  // Track list
  if (release.tracks && release.tracks.length > 0) {
    lines.push('## Tracklist');
    lines.push('');
    for (const track of release.tracks) {
      const duration = formatDuration(track.length);
      const durationStr = duration ? ` (${duration})` : '';
      lines.push(`${track.number}. ${track.title}${durationStr}`);
    }
    lines.push('');
  }

  // Notes
  if (release.notes && release.notes.trim()) {
    lines.push('## Notes');
    lines.push('');
    lines.push(release.notes.trim());
    lines.push('');
  }

  // Credits
  if (release.credits && release.credits.trim()) {
    lines.push('## Credits');
    lines.push('');
    lines.push(release.credits.trim());
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Generate filename for a release post
 */
function generateFilename(release) {
  const date = parseReleaseDate(release.released);
  const slug = slugify(release.title);
  return `${date}-${slug}.md`;
}

/**
 * Check if a post already exists for a release
 */
function postExists(release) {
  const filename = generateFilename(release);
  return fs.existsSync(path.join(POSTS_DIR, filename));
}

/**
 * Write a post for a release
 */
function writePost(release, overwrite = false) {
  const filename = generateFilename(release);
  const filepath = path.join(POSTS_DIR, filename);

  if (fs.existsSync(filepath) && !overwrite) {
    console.log(`  Skipping "${release.title}" - post already exists`);
    return false;
  }

  const content = generatePostContent(release);
  fs.writeFileSync(filepath, content, 'utf-8');
  console.log(`  Created: ${filename}`);
  return true;
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const overwriteAll = args.includes('--all');
  const releaseIndex = args.indexOf('--release');
  const specificRelease = releaseIndex !== -1 ? args[releaseIndex + 1] : null;

  console.log('Generate Release Posts');
  console.log('======================');
  console.log(`Found ${discography.length} releases in discography\n`);

  // Ensure posts directory exists
  if (!fs.existsSync(POSTS_DIR)) {
    fs.mkdirSync(POSTS_DIR, { recursive: true });
  }

  let created = 0;
  let skipped = 0;

  if (specificRelease) {
    // Find and generate specific release
    const release = discography.find(
      (r) => r.title.toLowerCase() === specificRelease.toLowerCase()
    );

    if (!release) {
      console.error(`Error: Release "${specificRelease}" not found.`);
      console.log('\nAvailable releases:');
      discography.forEach((r) => console.log(`  - ${r.title}`));
      process.exit(1);
    }

    console.log(`Generating post for: ${release.title}`);
    if (writePost(release, true)) {
      created++;
    }
  } else {
    // Generate all releases
    console.log(overwriteAll ? 'Regenerating ALL posts...\n' : 'Generating missing posts...\n');

    for (const release of discography) {
      if (writePost(release, overwriteAll)) {
        created++;
      } else {
        skipped++;
      }
    }
  }

  console.log('\n--- Summary ---');
  console.log(`Created: ${created}`);
  if (skipped > 0) {
    console.log(`Skipped: ${skipped} (already exist, use --all to overwrite)`);
  }
}

main();
