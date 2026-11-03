# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

**Nunjucks autoescape is disabled** (`setNunjucksEnvironmentOptions({ autoescape: false })` in `eleventy.config.js`). All template inputs come from trusted sources (markdown content, JS data files in `src/data/`, package constants). Even trusted text can contain `"` or `&`, so pipe interpolations through `| escape` wherever they land in an HTML attribute (`alt`, `content`, `data-*`) or an XML text node (`feed.xml`). `extractExcerpt` returns plain text for exactly this reason — escape it at the point of use. If you ever introduce user-supplied input into a template, escape it explicitly with the `| escape` filter.

**The site is served from the `/rm_ation/` path prefix.** `PATH_PREFIX` in `eleventy.config.js` is returned as Eleventy's `pathPrefix`, and `EleventyHtmlBasePlugin` rewrites every root-relative `href`/`src`/`srcset` in the HTML output to include it. `dist/` itself stays flat. In production the Cloudflare Worker at `worker/index.js` strips the prefix before forwarding to the `ASSETS` binding. The Eleventy dev server honors `pathPrefix` natively (it redirects `/` to `/rm_ation/`).

Rules that follow from this:

- Write internal links and image paths root-relative and **unprefixed** (`/music/`, `/images/foo.jpg`). A hard-coded `/rm_ation/...` would be prefixed a second time (`/rm_ation/rm_ation/...`).
- Absolute URLs (canonical, `og:*`, sitemap, feeds) are built from `META.CANONICAL` (`https://nor.the-rn.info/rm_ation/`), never `META.DOMAIN` — the Worker 301-redirects unprefixed paths.
- CSS built by the Tailwind CLI is not processed by the base plugin, so `url()` references in `src/styles/tailwind.css` are relative (`../fonts/...`).

## Node version

The Node version is pinned in three places that must stay in sync:

- `.node-version` — read by nodenv
- `.nvmrc` — read by nvm and by CI (`actions/setup-node` `node-version-file`)
- `package.json` `engines.node`

Use the exact patch version (e.g. `24.21.0`), never a range or major-only (`^24`, `24`). When bumping Node, update all three files in the same commit and regenerate `package-lock.json`.

npm 11.19+ (bundled with Node 24.21) blocks dependency install scripts unless they're listed in `allowScripts`. None are currently approved: `esbuild`, `workerd`, `@parcel/watcher` and `fsevents` fall back to their prebuilt binaries, and `npm run build`, `wrangler dev` and `wrangler deploy` all work without them. If a future bump needs one, approve it with `npm install-scripts approve <pkg>`.

## Testing

- `npm test` — unit tests in `test/` (Node's built-in test runner, no framework). `test/filters.test.js` runs the real `eleventy.config.js` against a stub config to get the filters. The script sets `TZ=America/Los_Angeles` so a filter that formats in local time fails.
- `npm run check:dist` — run after `npm run build`. `scripts/check-dist.js` fails on image or asset URLs that do not resolve in `dist/`, `src` values that point into `src/`, a doubled `/rm_ation/` prefix, and pages built from `CLAUDE.md` or `AGENTS.md`.
- `.github/workflows/check.yml` runs both on every PR. `deploy.yml` runs them before `wrangler deploy`.
- `dist/` is not cleaned between builds. Delete it before `check:dist` locally, or stale pages can fail the check.

## Key Patterns

### Date Handling

Dates in frontmatter (e.g., `date: 2025-12-24`) are parsed as midnight UTC. To display dates correctly regardless of local timezone, use the UTC date filters defined in `eleventy.config.js` (`dateToUTCYear`, `dateToUTCFull`, `dateToUTCISO`).

All of them go through `parseDate` in `eleventy.config.js`, which accepts JS `Date` objects, ISO strings, 5-digit Long Now years (`02025-11-18`) and partial dates (`02006-??-??`). Reuse it (or `getReleaseTimestamp` for sorting) rather than re-parsing dates by hand.

Do NOT use Nunjucks' built-in `date` filter (if used) or JavaScript's `getFullYear()` for post dates as they use local timezone and will show the wrong date for posts near year boundaries. Use `getUTCFullYear()` in JavaScript or the UTC filters in templates.

### Long Now Year Formatting

Years are displayed in 5-digit Long Now format (e.g., `02025`). The `LONG_NOW_YEAR_DIGITS` constant in `eleventy.config.js` controls padding. Use `padStart(LONG_NOW_YEAR_DIGITS, '0')` in JavaScript.

### Directory Data Files

Use `.11tydata.js` files (not `.json`) for Eleventy directory data. JS files support computed data, static values, and helper functions in one place — no need to split across two files.

### Blog Posts

Posts are Markdown files in `src/posts/` named `YYYY-MM-DD-slug.md`, with `title` and `date` frontmatter. `layout` is set by `src/posts/posts.11tydata.js` — do not add it to individual posts.

Every `.md` file in `src/posts/` is published as a post, so keep non-post Markdown (including agent instructions) out of that directory.

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

- Blog posts get dynamic descriptions from `page.rawInput | markdown | extractExcerpt` — the post body itself, not `content`, which by the time `base.njk` renders is already wrapped in `post.njk`'s date/Edit/title chrome. Other pages fall back to `site.META.DESCRIPTION`
- When adding new page types, pass `ogType` through the data cascade and ensure `base.njk` forwards it to metaTags

### Image Handling

`@11ty/eleventy-img` outputs are written to `src/img-optimized/` (committed to git) and passthrough-copied to `dist/img-optimized/` on every build. The directory MUST be committed so Cloudflare deploys reuse the derivatives instead of regenerating them. After adding a new image to `src/images/`, run `npm run build` before committing so the new entries in `src/img-optimized/` are included.

Remote URLs (`http://`, `https://`) are deliberately skipped by tagging them `eleventy:ignore` in the markdown-it image renderer (and directly in `release.njk` / `releaseCard.njk`) — release covers on the R2 asset buckets are already optimized.

An `<img>` that overrides `loading` (e.g. `loading="eager"` for an above-the-fold hero) MUST also set `sizes` (e.g. `sizes="100vw"`). The default `loading="lazy"` is what supplies `sizes="auto"`; without either, eleventy-img throws "Missing `sizes` attribute", and because the plugin runs with `failOnError: false` the build still succeeds but the tag ships unoptimized with a broken `src` (`src/images/...`). After touching image markup, grep `dist/` for the `<picture>` output rather than trusting a clean build.

### Search

`src/styles/pagefind.css` is a customized copy of Pagefind's default UI stylesheet and targets its Svelte hash classes (`.svelte-e9gkc3` etc.). Re-check it after bumping `pagefind`.

### Release Post Generation

See `scripts/CLAUDE.md` for the release-post scaffolding workflow (run after bumping the discography devDep).

### Deployment

The site deploys to a Cloudflare Worker (Workers Static Assets), not Cloudflare Pages.

The Worker entry point (`worker/index.js`) strips `/rm_ation` from prefixed requests and forwards them to the `ASSETS` binding, re-prefixing the `Location` of any redirect ASSETS returns (e.g. `html_handling`'s `/about` → `/about/`) so clients take one hop, not two.

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
- **Color contrast** - Gray-400 on black (8.3:1 AAA), Red-500 active states (4.5:1 AA), Yellow-300 links on black (AA/AAA)
- **Reduced motion** - `prefers-reduced-motion` disables grain, spectrum, and transition animations (including on pseudo-elements)
- **Semantic HTML** - Proper landmarks, `<time datetime>` only for machine-readable dates, `aria-current="page"`, `aria-hidden` on decorative elements (`rule.njk`, `spectrum.njk`)
- **One `<h1>` per page** - The masthead is not a heading. Every layout renders the page's own `<h1>`; layouts without a visible title use `<h1 class="sr-only">{{ title }}</h1>`. Headings don't skip levels (garden items are `<h3>` under section `<h2>`s)
