# [https://nor.the-rn.info/rm_ation](https://nor.the-rn.info/rm_ation)

See `./CLAUDE.md` for more.

## Develop

Site images live in Cloudflare R2, not in git. See "Image workflow" below.

```zsh
git clone git@github.com:northern-information/nor.the-rn.info.git
npm i
npm run images:download   # optional: local copies of the R2 images
npm run dev
```

`npm run images:download` fetches every file in `images.manifest.json` from `https://assets.the-rn.info/site/` that is not local yet. No Cloudflare login is necessary. Add `-- --originals` to fetch only the originals (about a third of the size); the dev server redirects missing derivatives to R2.

### Node version

Pinned to an exact patch in `.node-version`, `.nvmrc`, and `package.json` `engines.node` — all three must stay in sync. CI reads `.nvmrc`. See `CLAUDE.md` for details.

## Build

```zsh
npm run build
```

The build reads image metadata from `images.manifest.json` and does not process images.

## Image workflow

1. Add the original to `src/images/foo.jpg` (gitignored)
2. Reference it root-relative and without the prefix: `![alt](/images/foo.jpg)`
3. Run `npm run images` — processes `src/images/` with eleventy-img, uploads new files to R2, and updates `images.manifest.json` (needs `wrangler login`)
4. Commit the page and `images.manifest.json`

The Worker serves `/images/*` and `/img-optimized/*` from R2. A build fails when a page references an image that is not in the manifest. `npm run dev` serves local files from `src/images/` and `src/img-optimized/` and redirects missing ones to `https://assets.the-rn.info/site/`.

Remote images (release covers on the R2 asset buckets) are skipped by the transform — they pass through unchanged.

## Generating release posts

```zsh
npm run generate-release-posts
```

Scaffolds blog posts from new entries in `@tyleretters/discography`. See `scripts/generate-release-posts.js`.

## Search

[Pagefind](https://pagefind.app) builds a static search index during `npm run build` and powers the UI on `/search/`. No server required.

## Deploy

Automatic on push to `main` via GitHub Actions (`.github/workflows/deploy.yml`). The workflow runs `npm ci`, then `npm run build`, then `wrangler deploy` (via `cloudflare/wrangler-action`) to push `dist/` to a Cloudflare Worker (`northern-information`) using Workers Static Assets.

The Worker code is a thin shim at `worker/index.js`: it strips the `/rm_ation/` prefix from incoming requests and forwards to the `ASSETS` binding, and 301-redirects unprefixed paths and the `the-rn.info` / `www.the-rn.info` aliases to the prefixed canonical URL. Config is in `wrangler.jsonc`, which also pins the hostname bindings (`nor.the-rn.info/*`, `the-rn.info/*`, `www.the-rn.info/*`) via Workers Routes on the `the-rn.info` zone.

Required GitHub Actions secret: `CLOUDFLARE_API_TOKEN`. Create it in the Cloudflare dashboard under Manage Account → Account API Tokens → Create Token, using the **Edit Cloudflare Workers** template. Scope the account and zone resources down to this site.

To preview the Worker locally against a built `dist/`:

```zsh
npm run build
npm run worker:dev
# open http://localhost:8787/rm_ation/
```

For day-to-day editing, keep using `npm run dev` (Eleventy + Tailwind). The dev server serves the site under the `/rm_ation/` `pathPrefix` and redirects `/` there.

### Files to Remember

```zsh
eleventy.config.js
./src/data/projects.js
./src/data/site.js
./src/music/index.njk
./src/pages/pages.11tydata.js
./src/posts/posts.11tydata.js
./scripts/generate-release-posts.js
```
