# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

This is **Northern Information**, a personal website/blog built with [Eleventy](https://www.11ty.dev/) (11ty) static site generator. It uses Liquid templates, Tailwind CSS, and Luxon for date handling.

## Build Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
```

## Project Structure

- `src/` - Source files
  - `posts/` - Blog posts in Markdown with YAML frontmatter
  - `pages/` - Static pages
  - `layouts/` - Liquid templates (base.liquid, post.liquid, blog.liquid, etc.)
  - `includes/` - Partial templates
  - `data/` - Global data files (site.js, navigation.js, etc.)
  - `images/` - Static images
  - `fonts/` - Web fonts
- `dist/` - Build output (gitignored)
- `eleventy.config.js` - Eleventy configuration with custom filters and shortcodes

## Key Patterns

### Date Handling

Dates in frontmatter (e.g., `date: 2025-12-24`) are parsed as midnight UTC. To display dates correctly regardless of local timezone, use the UTC date filters defined in `eleventy.config.js`:

- `dateToUTC` - Format: `yyyy/MM/dd` (accepts custom Luxon format string, but memoization may interfere with custom formats)
- `dateToUTCYear` - Format: `2025` (year only)
- `dateToUTCFull` - Format: `December 24, 2025`
- `dateToUTCISO` - Format: `2025-12-24`

Do NOT use Liquid's built-in `date` filter or JavaScript's `getFullYear()` for post dates as they use local timezone and will show the wrong date for posts near year boundaries. Use `getUTCFullYear()` in JavaScript or the UTC filters in templates.

### Blog Posts

Posts are Markdown files in `src/posts/` with naming convention `YYYY-MM-DD-slug.md`. Frontmatter:

```yaml
---
layout: post
title: Post Title
date: 2025-12-24
tags: ["TagName"]
---
```

### Custom Filters

Located in `eleventy.config.js`:

- `toTitleCase` - Title case with exceptions for certain album/song titles
- `stripLeadingZero` - Removes leading zeros from strings
- `markdown` - Renders markdown content
- `toJson` - JSON stringify with formatting

### Collections

- `posts` - All blog posts
- `postsByYear` - Posts grouped by year for archive display
- `discography` - Music releases from `@tyleretters/discography` package

### RSS Feed

The site uses a **custom RSS 2.0 feed** at `/feed.xml` (generated from `src/feed.liquid`):

**Features:**

- 10 most recent posts (newest first)
- Per-item image enclosures (extracted from first `<img>` in post content)
- Feed-level `<image>` tag with site logo
- HTML content wrapped in CDATA for proper XML parsing
- UTC/GMT timestamps via custom `dateToRfc822Utc` filter
- `<lastBuildDate>` tracks feed generation time

**Implementation:**

- `extractFirstImage` filter (eleventy.config.js) - Extracts first image URL from HTML content
- `dateToRfc822Utc` filter (eleventy.config.js) - Formats dates as RFC 822 with GMT timezone
- `convertHtmlToAbsoluteUrls` filter (eleventy.config.js) - Converts relative URLs to absolute for RSS feeds

**OG Images:**

The site also uses dynamic Open Graph images via `src/includes/ogImage.liquid`:

- Releases → album covers
- Projects → project images
- Posts/Photography/About → first image from content
- Fallback → site logo

## Dependencies

- `@11ty/eleventy` - Static site generator
- `luxon` - Date/time handling (prefer over native Date for timezone safety)
- `markdown-it` - Markdown parser
- `@tyleretters/discography` - Personal discography data package
- Tailwind CSS for styling
