# Scripts

## Release post generation

`scripts/generate-release-posts.js` (run via `npm run generate-release-posts`) scaffolds blog post files in `src/posts/` for new entries in the `@tyleretters/discography` package. Useful after bumping the discography devDep version. Project links go through `getCanonicalProjectSlug` (imported from `eleventy.config.js`) because project pages only exist for the canonical slugs in `src/data/projects.js`.
