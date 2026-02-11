---
title: "Rebuilding \"norns community\""
date: 2023-05-27
---

![Always Has Been](/images/community-json.jpg)

About [two years ago](/2021/04/09/building-norns-community) we built [https://norns.community](https://norns.community). It was a massive project, both conceptually and technically. It served us well, but after a needlessly complex server migration earlier this year, we started talking about how to simplify.

A few of the complexities we were wrestling with:

- The contributor experience required too much work and wasn't fun.
- [wiki.js](https://js.wiki/) wasn't quite the right tool for the job.
- Pieces of the tech were cobbled together. (In one case, we decided hacking wiki.js core files was our _least worst_ option to resolve CORS issues.)
- The visual language of the site, while (perhaps) clear, was not on brand for any of us.
- Maintenance was complicated.

With all this in mind, [Brian](https://nnnnnnnn.co) started a thread with [Jordan](https://www.eigenbahn.com/), [Dan](https://dndrks.bandcamp.com/), and I. He had drafted a [small python script](https://github.com/monome-community/norns-community/blob/768d47633000cfa6eaed3289fa4f4e8d817615ab/process.py) that processed the [community.json](https://github.com/monome/norns-community/blob/main/community.json) file directly and wondered if this wasn't a better way to go about things.

We unanimously agreed with the approach and got to work. It is now several months later and I'm happy to share that we've just launched the rebuild.

![norns community v2 home](/images/norns-community-v2.png)

Some of the points I'm most excited about:

- No extra work for contributors. Just follow the normal steps to get your script published and your work magically appears on the site.
- The infrastructure and deployment tooling is exclusively GitHub tech.
- An accessibility-focused [theme-switcher](https://github.com/monome-community/norns-community/commit/af11f3c9047bff7096821638d4a18b1ddc97d169) leveraging OS default values.
- Visual language that matches [https://monome.org](https://monome.org).
- Mobile-first design.
- Maintenance is clearly documented and open.
- [TypeScript](https://github.com/monome-community/norns-community/blob/main/assets/javascript/script.ts) ensures future browsers and community members will have a better chance of understanding the interactive features.

![norns community v2 explore](/images/norns-community-v2-explore.png)

What follows is the [combo-README-about page](https://norns.community/about) as it exists today, copied here for posterity:

# welcome to norns.community

[norns.community](https://norns.community) is a collection of open source software for the monome [norns](https://monome.org/docs/norns) sound computer.

This document serves as both the `README.md` for [this repository](https://github.com/monome-community/norns-community) and the 'about' page for [this website](https://norns.community/about).

---

## How do I get my script on norns.community?

After your pull request is merged to the [community catalog](https://github.com/monome/norns-community) it will _automatically appear_ on [norns.community](https://norns.community), provided the default branch of your script's repository is named `main`. The website refreshes nightly at 00:00 UTC, on every merge to its `main` branch, or on demand by admins. [This GitHub action](https://github.com/monome-community/norns-community/actions/workflows/build.yml) has all the details.

For script authors, this means:

- your script will appear on the [index](https://norns.community) page
- your author name will appear on the [author](https://norns.community/author) page
- all of your community catalog scripts will appear under your author name
- your script will get its own page, [like this](https://norns.community/3d)
  - your script's README will be displayed on the page
  - your script's cover image will be displayed on the page
- your script will be available for discovery via any tags you added to its community catalog entry, like ["grid"](https://norns.community/tag/grid)
- your script and its tags will appear on the [explore](https://norns.community/explore) page
- if you update your README or cover image in your repository, it will automatically refresh on [norns.community](https://norns.community) within 24 hours

---

## How do I get my README and cover image on norns.community?

These conventions were designed to "just work" with how most scripts are structured today.

READMEs are individually cached from each script's repository in the below cascading sequence. Simply add a README to your project at either of the following locations:

```txt
1. ./doc/index.md
2. ./README.md
```

To ensure maximum resilience, please use [absolute URLs](https://en.wikipedia.org/wiki/HTTP_location) in your docs.

Cover images (aka screenshots) are individually cached from each script's repository in the below cascading sequence. Simply add a cover to your project at any of the following locations:

```txt
1. ./doc/cover.png
2. ./doc/<your_script_name>.png
3. ./doc/screenshot.png
4. ./cover.png
5. ./<your_script_name>.png
6. ./screenshot.png
```

If a cover image is not found in any of the above locations, we then try the local archive before finally using a default image:

```txt
7. ./archive/screenshot/<your_script_name>.png
8. ./images/dust.png
```

The local archive cache is from norns.community v1.0. It was archived in February, 2023.

---

## Can I see an example?

[dronecaster](https://github.com/northern-information/dronecaster) is one of many possible examples of what a compatible script structure might look like:

```txt
./doc/dronecaster.png (this cover will be used)
./engine
./lib
./.gitignore
./LICENSE
./README.md (this README will be used)
./dronecaster.lua
```

---

## What if something is wrong?

[Please open an issue on GitHub.](https://github.com/monome-community/norns-community/issues)

---

## How does this site work?

A [curl](https://github.com/monome-community/norns-community/blob/main/01-curl.sh) script fetches our [community catalog](https://github.com/monome/norns-community). A [build](https://github.com/monome-community/norns-community/blob/main/02-build.py) script then uses that data to construct this [Jekyll](https://jekyllrb.com) website. It is hosted with [GitHub pages](https://pages.github.com).

Additionally, these raw resources are available:

- [https://norns.community/community.json](https://norns.community/community.json)
- [https://norns.community/assets/covers/dronecaster.png](https://norns.community/assets/covers/dronecaster.png) (using `dronecaster` as example)
- [https://norns.community/assets/readmes/dronecaster.md](https://norns.community/assets/readmes/dronecaster.md) (using `dronecaster` as example)

---

## How can I help maintain this website?

If you want to help maintain this website, you can run it locally and test your changes before submitting a [pull request](https://github.com/monome-community/norns-community/pulls).

### Jekyll (Ruby) / HTML / CSS

1. clone repository to your computer
2. install [Ruby](https://www.ruby-lang.org/en/) and [bundle](https://bundler.io/)
3. using a shell, navigate to the `norns-community` directory with `cd`
4. pull the latest community data and build with: `./00-nuke.sh && ./01-curl.sh && ./02-build.py`
5. in the directory execute: `bundle install`
6. then execute: `bundle exec jekyll serve --baseurl ''` (save memory/energy and cancel this process while `./02-build.py` is running.)
7. tip: see scripts `package.json` for various shortcuts of the above.
8. you can now visit [http://127.0.0.1:4000](http://127.0.0.1:4000) in your browser

This site was built with `ruby 2.7.2p137 (2020-10-01 revision 5445e04352) [arm64-darwin21]`

### TypeScript / JavaScript

There is a single TypeScript file that is used to enable filtering on the "explore" page.

Install TypeScript and watch the file with:

1. `npm i`
2. `npm run tsc`

The build process assumes the transpiled JavaScript is already there. Perform all the `npm` actions locally.

---

## Philosophy

The architecture and technology of this site was inspired by [permacomputing](https://permacomputing.net/) concepts.

---

## Links

- [monome](https://monome.org)
- [llllllll](https://llllllll.co)

---

## Credits

- [tehn](https://github.com/tehn)
- [tyleretters](https://github.com/tyleretters)
- [p3r7](https://github.com/p3r7)
- [dndrks](https://github.com/dndrks)
