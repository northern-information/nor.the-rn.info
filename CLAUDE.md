# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

This is **Northern Information**, a personal website/blog built with [Eleventy](https://www.11ty.dev/) (11ty) static site generator. It uses Liquid templates, Tailwind CSS, and Luxon for date handling.

## Build Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
```

## Key Patterns

### Date Handling

Dates in frontmatter (e.g., `date: 2025-12-24`) are parsed as midnight UTC. To display dates correctly regardless of local timezone, use the UTC date filters defined in `eleventy.config.js`:

- `dateToUTC` - Format: `yyyy/MM/dd` (accepts custom Luxon format string, but memoization may interfere with custom formats)
- `dateToUTCYear` - Format: `2025` (year only)
- `dateToUTCFull` - Format: `December 24, 2025`
- `dateToUTCISO` - Format: `2025-12-24`

Do NOT use Liquid's built-in `date` filter or JavaScript's `getFullYear()` for post dates as they use local timezone and will show the wrong date for posts near year boundaries. Use `getUTCFullYear()` in JavaScript or the UTC filters in templates.

### Long Now Year Formatting

Years are displayed in 5-digit Long Now format (e.g., `02025`). The `LONG_NOW_YEAR_DIGITS` constant in `eleventy.config.js` controls padding. Use `padStart(LONG_NOW_YEAR_DIGITS, '0')` in JavaScript.

### Directory Data Files

Use `.11tydata.js` files (not `.json`) for Eleventy directory data. JS files support computed data, static values, and helper functions in one place — no need to split across two files. Current data files:

- `src/posts/posts.11tydata.js` — layout, permalink, ogType, RSS enclosure data
- `src/pages/pages.11tydata.js` — permalink

### Blog Posts

Posts are Markdown files in `src/posts/` with naming convention `YYYY-MM-DD-slug.md`. Frontmatter:

```yaml
---
title: "Post Title"
date: 2025-12-24
---
```

Note: `layout` is set automatically via `src/posts/posts.11tydata.js` — do not add it to individual post frontmatter. Titles should always be quoted.

### Meta Tags and Social Sharing

Meta tags are rendered via `src/includes/metaTags.liquid`:

- Blog posts have `og:type="article"` (set via `ogType` in `src/posts/posts.11tydata.js`); all other pages default to `"website"`
- Blog posts get dynamic descriptions extracted from content via the `extractExcerpt` filter; other pages fall back to `site.META.DESCRIPTION`
- Twitter Card tags are included (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`)
- OG images are resolved via `src/includes/ogImage.liquid` with cascading fallbacks (release cover > project image > first image in content > site logo)
- When adding new page types, pass `ogType` through the data cascade and ensure `base.liquid` forwards it to metaTags

### Custom Filters

Located in `eleventy.config.js`:

- `toTitleCase` - Title case with exceptions for certain album/song titles
- `padIndex` - Zero-pads a number to 2 digits (e.g., 1 -> "01")
- `formatTrackLength` - Strips leading "00:" from track durations
- `extractExcerpt` - Strips HTML and truncates to ~160 chars for meta descriptions
- `extractFirstImage` - Gets first `<img>` src from HTML content
- `markdown` - Renders markdown content
- `linkify` - Converts URLs in text to anchor tags
- `toAbsoluteUrl` - Converts relative URLs to absolute
- `dateToRfc822Utc` - RFC 822 date format for RSS feeds
- `convertHtmlToAbsoluteUrls` - Converts relative URLs in HTML to absolute for RSS

### Collections

- `posts` - All blog posts
- `postsByYear` - Posts grouped by year for archive display
- `projects` - Projects with associated releases from discography
- `discography` - Music releases from `@tyleretters/discography` package

### RSS Feed

Custom RSS 2.0 feed at `/feed.xml` (generated from `src/feed.liquid`) with 10 most recent posts, per-item image enclosures, and HTML content in CDATA.

## Accessibility

The site follows WCAG 2.1 Level AA with several AAA enhancements:

- **Focus styles** - Yellow outline (`outline-yellow-300`) on all interactive elements
- **Skip link** - "Skip to main content" for keyboard/screen reader users
- **Color contrast** - Gray-400 on black (8.3:1 AAA), Red-500 active states (4.5:1 AA), Yellow-300 links on black (AA/AAA)
- **Reduced motion** - `prefers-reduced-motion` disables grain, spectrum, and transition animations
- **Semantic HTML** - Proper landmarks, `<time>` elements, `aria-current="page"`, `aria-hidden` on decorative elements
- **Reusable patterns** - `.link-primary` for links, `.grid-releases`/`.grid-projects` for layouts, component includes for consistent markup
