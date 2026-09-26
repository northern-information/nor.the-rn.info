# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Writing style

- Use sentence case for all prose — commit messages, comments, post frontmatter, chat replies. Capitalize the first word and proper nouns only.
- Wrap code, identifiers, file paths, and commands in backticks. Use triple-backtick code fences for multi-line snippets with a language tag.
- Preserve original casing for identifiers (PascalCase, camelCase, SCREAMING_SNAKE_CASE) and product names (GitHub, Eleventy, Tailwind, Luxon).

## Project Overview

This is **Northern Information**, a personal website/blog built with [Eleventy](https://www.11ty.dev/) (11ty) static site generator. It uses Nunjucks templates, Tailwind CSS, and Luxon for date handling.

**Nunjucks autoescape is disabled** (`setNunjucksEnvironmentOptions({ autoescape: false })` in `eleventy.config.js`). All template inputs come from trusted sources (markdown content, JS data files in `src/data/`, package constants). Even trusted text can contain `"` or `&`, so pipe interpolations through `| escape` wherever they land in an HTML attribute (`alt`, `content`, `data-*`) or an XML text node (`feed.xml`). `extractExcerpt` returns plain text for exactly this reason — escape it at the point of use. If you ever introduce user-supplied input into a template, escape it explicitly with the `| escape` filter.

**The site is served from the `/rm_ation/` path prefix.** `PATH_PREFIX` in `eleventy.config.js` is returned as Eleventy's `pathPrefix`, and `EleventyHtmlBasePlugin` rewrites every root-relative `href`/`src`/`srcset` in the HTML output to include it. `dist/` itself stays flat. In production the Cloudflare Worker at `worker/index.js` strips the prefix before forwarding to the `ASSETS` binding. The Eleventy dev server honors `pathPrefix` natively (it redirects `/` to `/rm_ation/`).

Rules that follow from this:

- Write internal links and image paths root-relative and **unprefixed** (`/music/`, `/images/foo.jpg`). A hard-coded `/rm_ation/...` would be prefixed a second time (`/rm_ation/rm_ation/...`).
- Absolute URLs (canonical, `og:*`, sitemap, feeds) are built from `META.CANONICAL` (`https://nor.the-rn.info/rm_ation/`), never `META.DOMAIN` — the Worker 301-redirects unprefixed paths.
- CSS built by the Tailwind CLI is not processed by the base plugin, so `url()` references in `src/styles/tailwind.css` are relative (`../fonts/...`).

## Build Commands

```bash
npm run dev                     # Eleventy dev server + Tailwind watch
npm run build                   # Production build (CSS, Eleventy, Pagefind)
npm run pretty                  # Prettier across the repo
npm run clean                   # Remove node_modules, package-lock.json, dist
npm run css                     # One-off Tailwind build (css:build minifies, css:watch watches)
npm run pagefind                # Rebuild the search index from dist/
npm run generate-release-posts  # Scaffold posts for new discography releases
npm run worker:dev              # Local Worker preview against dist/
npm run worker:deploy           # Manual deploy (CI normally does this)
```

## Node version

The Node version is pinned in three places that must stay in sync:

- `.node-version` — read by nodenv
- `.nvmrc` — read by nvm and by CI (`actions/setup-node` `node-version-file`)
- `package.json` `engines.node`

Use the exact patch version (e.g. `24.21.0`), never a range or major-only (`^24`, `24`). When bumping Node, update all three files in the same commit and regenerate `package-lock.json`.

npm 11.19+ (bundled with Node 24.21) blocks dependency install scripts unless they're listed in `allowScripts`. None are currently approved: `esbuild`, `workerd`, `@parcel/watcher` and `fsevents` fall back to their prebuilt binaries, and `npm run build`, `wrangler dev` and `wrangler deploy` all work without them. If a future bump needs one, approve it with `npm install-scripts approve <pkg>`.

## Key Patterns

### Date Handling

Dates in frontmatter (e.g., `date: 2025-12-24`) are parsed as midnight UTC. To display dates correctly regardless of local timezone, use the UTC date filters defined in `eleventy.config.js`:

- `dateToUTCYear` - Format: `02025` (year only, Long Now)
- `dateToUTCFull` - Format: `December 24, 02025`
- `dateToUTCISO` - Format: `2025-12-24`

All of them go through `parseDate` in `eleventy.config.js`, which accepts JS `Date` objects, ISO strings, 5-digit Long Now years (`02025-11-18`) and partial dates (`02006-??-??`). Reuse it (or `getReleaseTimestamp` for sorting) rather than re-parsing dates by hand.

Do NOT use Nunjucks' built-in `date` filter (if used) or JavaScript's `getFullYear()` for post dates as they use local timezone and will show the wrong date for posts near year boundaries. Use `getUTCFullYear()` in JavaScript or the UTC filters in templates.

### Long Now Year Formatting

Years are displayed in 5-digit Long Now format (e.g., `02025`). The `LONG_NOW_YEAR_DIGITS` constant in `eleventy.config.js` controls padding. Use `padStart(LONG_NOW_YEAR_DIGITS, '0')` in JavaScript.

### Directory Data Files

Use `.11tydata.js` files (not `.json`) for Eleventy directory data. JS files support computed data, static values, and helper functions in one place — no need to split across two files. Current data files:

- `src/posts/posts.11tydata.js` — layout, permalink, ogType
- `src/pages/pages.11tydata.js` — permalink
- `src/index.11tydata.js` — `projectGroups` computed data (featured, activeNotFeatured, inactive) for the homepage

### Global Data Files

`src/data/*.js` are global data (available in every template under the file name): `about`, `links`, `navigation`, `photography`, `playlists`, `projects`, `resources`, `site` (re-exports `META` from `eleventy.config.js` plus `ACCOUNTS`), and `subsidiaries`. `projects.js` is also imported by `eleventy.config.js` to build the `projects` collection and the release → canonical project slug mapping (`getCanonicalProjectSlug`).

### Blog Posts

Posts are Markdown files in `src/posts/` with naming convention `YYYY-MM-DD-slug.md`. Frontmatter:

```yaml
---
title: "Post Title"
date: 2025-12-24
---
```

Note: `layout` is set automatically via `src/posts/posts.11tydata.js` — do not add it to individual post frontmatter.

#### Title casing and quoting

These conventions apply to **prose blog posts only**. Music release posts are machine-generated by `scripts/generate-release-posts.js` from `@tyleretters/discography` and preserve the release's own styling — do not normalize them.

**Casing — Chicago-style Title Case:**

- Capitalize the first and last word always, plus all nouns, verbs (including `is`, `was`, `be`), adjectives, adverbs (including `so`), pronouns (including `it`, `its`, `that`), and subordinating conjunctions (`as`, `than`, `that`, `because`).
- Lowercase only when _not_ the first or last word: articles (`a`, `an`, `the`), coordinating conjunctions (`and`, `but`, `or`, `nor`, `for`, `so`/`yet` _as conjunctions_), and prepositions regardless of length (`of`, `to`, `in`, `from`, `with`, `upon`, `into`, etc.).
- Capitalize the first word of a subtitle after a colon (`P(l)ay: The Merry…`).

**Preserve, don't normalize:**

- Intentionally stylized titles — all-caps (`DISSOLUTION`), all-lowercase (`midwest sad, part 1`), mixed/Unicode (`eXistenZ`, fancy script). Leave casing untouched. Known intentional examples: `Everything is everywhere now`, `That was closer to then` (lowercase mid-phrase), `arcologies Covered by CDM` (lowercase `arcologies`), and `norns community` (always lowercase, e.g. `Building "norns community"`).
- Proper nouns, acronyms, and product/domain names (`COVID-19`, `CDM`, `pi-hole.net`). Preserve original casing.
- The title of a referenced work that the author lowercases deliberately (`waking by Matt Lowery`).

**Quoting:**

- Always quote titles. Use double quotes: `title: "Post Title"`.
- If the title contains a literal `"`, use single quotes instead so the inner quotes don't need escaping: `title: 'Building "norns community"'`.

### Meta Tags and Social Sharing

Meta tags are rendered via `src/includes/metaTags.njk`:

- Blog posts have `og:type="article"` (set via `ogType` in `src/posts/posts.11tydata.js`); all other pages default to `"website"`
- Blog posts get dynamic descriptions from `page.rawInput | markdown | extractExcerpt` — the post body itself, not `content`, which by the time `base.njk` renders is already wrapped in `post.njk`'s date/Edit/title chrome. Other pages fall back to `site.META.DESCRIPTION`
- Twitter Card tags are included (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`)
- OG images are resolved via `src/includes/ogImage.njk` with cascading fallbacks (release cover > project image > first image in the post body / page content > site logo), made absolute against `META.CANONICAL`
- Canonical and `og:url` are `META.CANONICAL` + `page.url` (prefixed)
- `<link rel="alternate">` discovery tags advertise `/feed.xml` and `/feed.json`
- When adding new page types, pass `ogType` through the data cascade and ensure `base.njk` forwards it to metaTags

### Custom Filters

Located in `eleventy.config.js`:

- `padIndex` - Zero-pads a number to 2 digits (e.g., 1 -> "01")
- `formatTrackLength` - Strips leading "00:" from track durations
- `dateToUTCFull` - Format dates as `December 24, 02025` in UTC
- `dateToUTCYear` - Year only, zero-padded to 5 digits (Long Now format)
- `dateToUTCISO` - ISO date `2025-12-24` in UTC, handles partial dates like `02006-??-??`
- `extractExcerpt` - Strips HTML, decodes entities, and truncates to ~160 chars. Returns plain text; escape at the point of use
- `extractFirstImage` - Gets first `<img>` src from HTML content
- `markdown` - Renders markdown content
- `linkify` - Converts bare URLs in text to anchor tags (skips existing `<a>` elements and attribute values)
- `toAbsoluteUrl` - Converts relative URLs to absolute against a base (pass `META.CANONICAL`)
- `imageMimeType` - MIME type from an image URL's extension, for RSS `<enclosure>`
- `dateToRfc822Utc` - RFC 822 date format for RSS feeds
- `convertHtmlToAbsoluteUrls` - Converts relative `src`/`href`/`srcset` URLs in HTML to absolute for feeds. Root-relative URLs resolve against `META.CANONICAL`, document-relative ones against the page URL passed in
- `replaceLast` - Replaces the last occurrence of a substring (Nunjucks lacks Liquid's `replace_last`)
- `removeFirst` - Removes the first occurrence of a substring (Nunjucks lacks Liquid's `remove_first`)
- `sitemapUrls` - Absolute, prefixed page URLs for `sitemap.xml` (pass `META.CANONICAL`)
- `sitemapTree` - Nested directory tree of page URLs for the human-readable `/sitemap/` page

### Shortcodes

- `getTitle` - Appends `| Northern Information` to a page title (or returns the site title if empty or already the site title)
- `getTimestamp` - Returns the build's start time as a Unix timestamp (one value per build), used for cache-busting query params on CSS and JS

### Collections

- `posts` - All blog posts
- `postsByYear` - Posts grouped by year for archive display
- `projects` - Projects with associated releases from discography
- `discography` - Music releases from `@tyleretters/discography` package

### Feeds

- **RSS 2.0** at `/feed.xml` (`src/feed.njk`): 10 most recent posts, per-item image enclosures (MIME type from `imageMimeType`), and HTML content in CDATA. Text nodes are `| escape`d — post titles contain `&`.
- **JSON Feed 1.1** at `/feed.json` (`src/feed.json.njk`): every post, discography release and project, with a `_nor.type` extension field. Values go through `| dump` for JSON escaping.

Both use `META.CANONICAL` for every absolute URL.

### Sitemaps

- `/sitemap.xml` (`src/sitemap.njk`) — XML sitemap, referenced from `src/robots.txt`.
- `/sitemap/` (`src/pages/sitemap.njk`) — human-readable directory tree, linked from the footer.

Both are built from `collectSitemapUrls(collections.all)` in `eleventy.config.js`, which keeps `/`- and `.html`-terminated URLs. Pages that shouldn't be listed (e.g. `src/404.njk`) set `eleventyExcludeFromCollections: true`.

### Image Handling

`@11ty/eleventy-img` runs as an HTML transform plugin (`eleventyImageTransformPlugin`) registered in `eleventy.config.js`. It rewrites every `<img>` tag in rendered HTML into a `<picture>` with AVIF, WebP, and original-format (`auto`) sources at widths 400/800/1600/auto, plus `loading="lazy"` and `decoding="async"`.

Outputs are written to `src/img-optimized/` (committed to git) and passthrough-copied to `dist/img-optimized/` on every build. The directory MUST be committed so Cloudflare deploys reuse the derivatives instead of regenerating them. After adding a new image to `src/images/`, run `npm run build` before committing so the new entries in `src/img-optimized/` are included.

Remote URLs (`http://`, `https://`) are deliberately skipped by tagging them `eleventy:ignore` in the markdown-it image renderer (and directly in `release.njk` / `releaseCard.njk`) — release covers on the R2 asset buckets are already optimized.

Image references inside templates (e.g., the site logo via `META.LOGO`) are processed the same way as markdown images.

### Search

[Pagefind](https://pagefind.app) generates a static search index from the built `dist/` directory at the end of `npm run build`. The index lives at `dist/pagefind/` and is fetched by the search UI on `/search/` (driven by `src/layouts/search.njk`, which chains to `base.njk` and loads the Pagefind UI script and `src/styles/pagefind.css` in the body). Pagefind reads all `<body>` content by default; there's no `data-pagefind-body` attribute scoping in templates.

`src/styles/pagefind.css` is a customized copy of Pagefind's default UI stylesheet and targets its Svelte hash classes (`.svelte-e9gkc3` etc.). Re-check it after bumping `pagefind`.

### Release Post Generation

`scripts/generate-release-posts.js` (run via `npm run generate-release-posts`) scaffolds blog post files in `src/posts/` for new entries in the `@tyleretters/discography` package. Useful after bumping the discography devDep version. Project links go through `getCanonicalProjectSlug` (imported from `eleventy.config.js`) because project pages only exist for the canonical slugs in `src/data/projects.js`.

### Deployment

The site deploys to a Cloudflare Worker (Workers Static Assets), not Cloudflare Pages. On push to `main`, `.github/workflows/deploy.yml` runs `npm ci`, `npm run build`, and `wrangler deploy` (via `cloudflare/wrangler-action`). Worker config lives in `wrangler.jsonc`, including the `routes` block that binds the Worker to `nor.the-rn.info/*`, `the-rn.info/*` and `www.the-rn.info/*` on the `the-rn.info` zone. Required GitHub secret: `CLOUDFLARE_API_TOKEN`. Local Worker preview: `npm run build && npm run worker:dev` then open `http://localhost:8787/rm_ation/`.

The Worker entry point is `worker/index.js`. It:

- 301-redirects `the-rn.info` and `www.the-rn.info` to `nor.the-rn.info/rm_ation/...`
- 301-redirects bare `/rm_ation` to `/rm_ation/`, and any unprefixed path to its prefixed form
- strips `/rm_ation` from prefixed requests and forwards them to the `ASSETS` binding, re-prefixing the `Location` of any redirect ASSETS returns (e.g. `html_handling`'s `/about` → `/about/`) so clients take one hop, not two

### R2 asset buckets

Release media (cover art, MP3/WAV, zip downloads) is served from two Cloudflare R2 buckets with custom domains:

- `assets.the-rn.info` → `intertext` bucket
- `dl.the-rn.info` → `northerninformation` bucket

CORS is owned **only** by each bucket's own CORS Policy (Cloudflare dashboard → R2 → bucket → Settings → CORS Policy). Do not add zone-level Transform Rules or Page Rules that set `Access-Control-*` headers for these hostnames — during the AWS → R2 migration there was a temporary Transform Rule on the `the-rn.info` zone (`R2 assets — force CORS allow-origin`) that layered headers on top of R2's, producing duplicate `Access-Control-Allow-Origin` response headers and browser CORS errors (Webamp's Web Audio fetch was the canary). The rule was removed once R2 CORS was configured; don't reintroduce it.

Each bucket must keep a **single rule with `AllowedOrigins: ["*"]`** (the assets are public, unauthenticated media). Two overlapping rules on the same bucket would re-create the duplicate-header problem.

Verify with:

```bash
curl -sI -H "Origin: https://nor.the-rn.info" <asset-url> | grep -i '^access-control'
```

Expect exactly one of each `access-control-*` header. Edge cache (`cf-cache-status: HIT`) can mask policy changes — purge the affected URLs after editing.

R2 only sends `Access-Control-Allow-Origin` (and `Vary: Origin`) when the request carries an `Origin` header. A plain `<audio src>` makes a non-CORS request, the browser caches that header-less response, and Webamp's later CORS fetch of the same URL is then blocked. That's why the `<audio>` elements in `release.njk` set `crossorigin="anonymous"` — keep it on any element that loads R2 media Webamp also reads.

## Accessibility

The site follows WCAG 2.1 Level AA with several AAA enhancements:

- **Focus styles** - Yellow outline (`outline-yellow-300`) on all interactive elements, including the Pagefind search input (`src/styles/pagefind.css`)
- **Skip link** - "Skip to main content" for keyboard/screen reader users
- **Color contrast** - Gray-400 on black (8.3:1 AAA), Red-500 active states (4.5:1 AA), Yellow-300 links on black (AA/AAA)
- **Reduced motion** - `prefers-reduced-motion` disables grain, spectrum, and transition animations (including on pseudo-elements)
- **Semantic HTML** - Proper landmarks, `<time datetime>` only for machine-readable dates, `aria-current="page"`, `aria-hidden` on decorative elements (`rule.njk`, `spectrum.njk`)
- **One `<h1>` per page** - The masthead is not a heading. Every layout renders the page's own `<h1>`; layouts without a visible title use `<h1 class="sr-only">{{ title }}</h1>`. Headings don't skip levels (garden items are `<h3>` under section `<h2>`s)
- **Reusable patterns** - `.link-primary` for links, `.grid-releases`/`.grid-projects` for layouts, component includes for consistent markup
