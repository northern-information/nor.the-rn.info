# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Writing style

- Use sentence case for all prose — commit messages, comments, post frontmatter, chat replies. Capitalize the first word and proper nouns only.
- Wrap code, identifiers, file paths, and commands in backticks. Use triple-backtick code fences for multi-line snippets with a language tag.
- Preserve original casing for identifiers (PascalCase, camelCase, SCREAMING_SNAKE_CASE) and product names (GitHub, Eleventy, Tailwind, Luxon).

## Project Overview

This is **Northern Information**, a personal website/blog built with [Eleventy](https://www.11ty.dev/) (11ty) static site generator. It uses Nunjucks templates, Tailwind CSS, and Luxon for date handling.

**Nunjucks autoescape is disabled** (`setNunjucksEnvironmentOptions({ autoescape: false })` in `eleventy.config.js`). All template inputs come from trusted sources (markdown content, YAML data files, package constants). If you ever introduce user-supplied input into a template, escape it explicitly with the `| escape` filter.

**Local dev includes a `/rm_ation/` middleware** that strips the prefix so links resolve from `dist/` root. See `setServerOptions` in `eleventy.config.js`. On production, the Cloudflare Worker at `worker/index.js` strips the same prefix before forwarding to the `ASSETS` binding — Eleventy continues to emit flat URLs into `dist/`.

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

Do NOT use Nunjucks' built-in `date` filter (if used) or JavaScript's `getFullYear()` for post dates as they use local timezone and will show the wrong date for posts near year boundaries. Use `getUTCFullYear()` in JavaScript or the UTC filters in templates.

### Long Now Year Formatting

Years are displayed in 5-digit Long Now format (e.g., `02025`). The `LONG_NOW_YEAR_DIGITS` constant in `eleventy.config.js` controls padding. Use `padStart(LONG_NOW_YEAR_DIGITS, '0')` in JavaScript.

### Directory Data Files

Use `.11tydata.js` files (not `.json`) for Eleventy directory data. JS files support computed data, static values, and helper functions in one place — no need to split across two files. Current data files:

- `src/posts/posts.11tydata.js` — layout, permalink, ogType, RSS enclosure data
- `src/pages/pages.11tydata.js` — permalink
- `src/index.11tydata.js` — `projectGroups` computed data (featured, activeNotFeatured, inactive) for the homepage

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

Meta tags are rendered via `src/includes/metaTags.njk`:

- Blog posts have `og:type="article"` (set via `ogType` in `src/posts/posts.11tydata.js`); all other pages default to `"website"`
- Blog posts get dynamic descriptions extracted from content via the `extractExcerpt` filter; other pages fall back to `site.META.DESCRIPTION`
- Twitter Card tags are included (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`)
- OG images are resolved via `src/includes/ogImage.njk` with cascading fallbacks (release cover > project image > first image in content > site logo)
- When adding new page types, pass `ogType` through the data cascade and ensure `base.njk` forwards it to metaTags

### Custom Filters

Located in `eleventy.config.js`:

- `toTitleCase` - Title case with exceptions for certain album/song titles
- `padIndex` - Zero-pads a number to 2 digits (e.g., 1 -> "01")
- `formatTrackLength` - Strips leading "00:" from track durations
- `dateToUTC` - Format dates as `yyyy/MM/dd` in UTC (accepts custom Luxon format)
- `dateToUTCFull` - Format dates as `December 24, 2025` in UTC
- `dateToUTCYear` - Year only, zero-padded to 5 digits (Long Now format)
- `dateToUTCISO` - ISO date `2025-12-24` in UTC, handles partial dates like `02006-??-??`
- `extractExcerpt` - Strips HTML and truncates to ~160 chars for meta descriptions
- `extractFirstImage` - Gets first `<img>` src from HTML content
- `markdown` - Renders markdown content
- `linkify` - Converts URLs in text to anchor tags
- `toAbsoluteUrl` - Converts relative URLs to absolute
- `dateToRfc822Utc` - RFC 822 date format for RSS feeds
- `convertHtmlToAbsoluteUrls` - Converts relative URLs in HTML to absolute for RSS
- `replaceLast` - Replaces the last occurrence of a substring (Nunjucks lacks Liquid's `replace_last`)
- `removeFirst` - Removes the first occurrence of a substring (Nunjucks lacks Liquid's `remove_first`)

### Shortcodes

- `getTitle` - Appends `| Northern Information` to a page title (or returns the site title if empty)
- `getTimestamp` - Returns the current Unix timestamp, used for cache-busting query params on CSS and JS

### Collections

- `posts` - All blog posts
- `postsByYear` - Posts grouped by year for archive display
- `projects` - Projects with associated releases from discography
- `discography` - Music releases from `@tyleretters/discography` package

### RSS Feed

Custom RSS 2.0 feed at `/feed.xml` (generated from `src/feed.njk`) with 10 most recent posts, per-item image enclosures, and HTML content in CDATA.

### Image Handling

`@11ty/eleventy-img` runs as an HTML transform plugin (`eleventyImageTransformPlugin`) registered in `eleventy.config.js`. It rewrites every `<img>` tag in rendered HTML into a `<picture>` with AVIF, WebP, and JPEG sources at widths 400/800/1600/auto, plus `loading="lazy"` and `decoding="async"`.

Outputs are written to `src/img-optimized/` (committed to git) and passthrough-copied to `dist/img-optimized/` on every build. The directory MUST be committed so Cloudflare deploys reuse the derivatives instead of regenerating them. After adding a new image to `src/images/`, run `npm run build` before committing so the new entries in `src/img-optimized/` are included.

Two categories of images are deliberately skipped by tagging the markdown-it image renderer with `eleventy:ignore`:

- Remote URLs (`http://`, `https://`) — the 71 CloudFront cover images on release pages. Already optimized on the CDN.
- `/rm_ation/` prefixed URLs — these go through the production Worker's prefix strip (the site root is `/rm_ation/`); the plugin can't resolve the prefix to a local file.

Image references inside templates (e.g., the site logo via `META.LOGO`) are processed the same way as markdown images.

### Search

[Pagefind](https://pagefind.app) generates a static search index from the built `dist/` directory at the end of `npm run build`. The index lives at `dist/pagefind/` and is fetched by the search UI on `/search/` (driven by `src/layouts/search.njk`). Pagefind reads all `<body>` content by default; there's no `data-pagefind-body` attribute scoping in templates.

### Release Post Generation

`scripts/generate-release-posts.js` (run via `npm run generate-release-posts`) scaffolds blog post files in `src/posts/` for new entries in the `@tyleretters/discography` package. Useful after bumping the discography devDep version.

### Deployment

The site deploys to a Cloudflare Worker (Workers Static Assets), not Cloudflare Pages. On push to `main`, `.github/workflows/deploy.yml` runs `npm ci`, `npm run build`, and `wrangler deploy`. The Worker entry point is `worker/index.js`; its only job is to strip the `/rm_ation/` prefix off incoming requests before forwarding to the `ASSETS` binding. Worker config lives in `wrangler.jsonc`. Required GitHub secret: `CLOUDFLARE_API_TOKEN`. Local Worker preview: `npm run build && npm run worker:dev` then open `http://localhost:8787/rm_ation/`.

## Accessibility

The site follows WCAG 2.1 Level AA with several AAA enhancements:

- **Focus styles** - Yellow outline (`outline-yellow-300`) on all interactive elements
- **Skip link** - "Skip to main content" for keyboard/screen reader users
- **Color contrast** - Gray-400 on black (8.3:1 AAA), Red-500 active states (4.5:1 AA), Yellow-300 links on black (AA/AAA)
- **Reduced motion** - `prefers-reduced-motion` disables grain, spectrum, and transition animations
- **Semantic HTML** - Proper landmarks, `<time>` elements, `aria-current="page"`, `aria-hidden` on decorative elements
- **Reusable patterns** - `.link-primary` for links, `.grid-releases`/`.grid-projects` for layouts, component includes for consistent markup
