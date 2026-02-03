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

## Accessibility Features

The site follows WCAG 2.1 Level AA standards with several AAA enhancements:

### Keyboard Navigation

- **Focus-visible styles** - Yellow outline (`outline-yellow-300`) on all interactive elements
- **Skip link** - "Skip to main content" link (hidden until focused) for keyboard/screen reader users
- Focus styles apply to: links, buttons, inputs, textareas, selects, and details elements
- Group focus-within for card components

### Color Contrast

- **Gray-400 text on black**: 8.3:1 contrast ratio (passes WCAG AAA)
- **Red-500 active states**: 4.5:1 contrast ratio (passes WCAG AA)
- Yellow links (`text-yellow-300`) on black meet AA/AAA standards

### Motion Preferences

- `prefers-reduced-motion` media query disables all animations for users who prefer reduced motion
- Affects grain animation, spectrum animation, and all transitions

### Semantic HTML

- Proper landmark elements: `<nav>`, `<main>`, `<footer>`
- `<time>` elements with `datetime` attributes for dates
- `aria-current="page"` on active navigation items
- `aria-hidden="true"` on decorative icons
- All images have descriptive alt text

### Reusable Patterns

- `.link-primary` utility class for consistent link styling
- `.grid-releases` and `.grid-projects` for consistent layouts
- Component-based architecture (releaseCard.liquid) ensures consistent markup

### Testing Notes

- Test focus styles by tabbing through the site
- Test skip link by pressing Tab on page load
- Test reduced motion in browser/OS settings

## Dependencies

- `@11ty/eleventy` - Static site generator
- `luxon` - Date/time handling (prefer over native Date for timezone safety)
- `markdown-it` - Markdown parser
- `@tyleretters/discography` - Personal discography data package
- Tailwind CSS for styling
