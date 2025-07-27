# [https://nor.the-rn.info/rm_ation](https://nor.the-rn.info/rm_ation)

## Develop

As of mid-2025 the repo weighs ~350MB. Almost all of this is from `/images`. I've considered a separate CDN solution for these but I consider them "part of the codebase" so it is probably fine as is...

```zsh
git clone git@github.com:tyleretters/nor.the-rn.info.git
npm i
npm run dev
```

## Build

```zsh
npm run build
```

## Deploy

Automatic on push to `main` via Cloudflare integration.

### Files to Remember

```zsh
eleventy.config.js
./src/music/index.liquid
./src/pages/pages.json
./src/posts/posts.json
./src/data/site.js
```
