---
title: Building an Interactive Discography
date: 2024-01-04
tags: ["Wildcard"]
---

[![Final Result](/images/discography-00-final.png)](/images/discography-00-final.png)

Over winter break, I decided to get certified in [React](https://react.dev/), setup an S3 bucket, and build an interactive discography for myself.

With the turbulence and layoffs at Bandcamp, I no longer trust the platform to be the canonical source of information about my music.

I built it with these values in mind:

- Maintainability
- [Grok](https://en.wikipedia.org/wiki/Grok)-ability
- Resilience
- Efficiency
- Accessibility
- Pragmatism
- Aesthetic Minimalism

This project was heavily inspired by<!--x--> [my experience building norns.community](/2023/05/27/rebuilding-norns-community/).

The source code for the [React frontend is here](https://github.com/tyleretters/discography-frontend) and the [@tyleretters/discography NPM package is here](https://github.com/tyleretters/discography).

The final result can be explored at: [discography.tyleretters.com](https://discography.tyleretters.com)

## Step 1: Start with the Data

[![YML to Json](/images/discography-01-yml-to-json.png)](/images/discography-01-yml-to-json.png)

The domain of "discographies" is rich. Individuals are can be part of many different projects/bands/orchestras/etc. Each project can release multiple albums, singles, and remixes. Each release has album art, notes, credits, and multiple tracks. Each track has a title, a duration, and an audio file. It is a domain I know intimately well.

My discography dates back to 2005 and I knew I'd be entering a lot of data by hand. I didn't want to manage a database for a number of reasons. First, it adds cost, overhead, and a bigger attack surface. Second, I have less than 50 releases, so a text file of some sort seemed just fine from a scale standpoint.

I chose YML because it is nice to work with. I spent a day or two enriching the [discography data](https://github.com/tyleretters/nor.the-rn.info/blob/main/_data/discography.yml) I had already built for [the discography page](https://nor.the-rn.info/discography).

I then wrote a [YML to JSON converter in Python](https://github.com/tyleretters/discography/blob/main/src/convert.py). Publishing my discography as JSON means that multiple applications can consume it in an open format.

## Step 2: Publish to NPM

[![Publishing to NPM](/images/discography-02-npm.png)](/images/discography-02-npm.png)

I then published the package to NPM. Now, anytime I want to work with my discography I can simply run:

```
npm init
npm install @tyleretters/discography
```

... and I'll have everything I need! (I also love the idea of having this package available whenever I need an arbitrary data source to test something out.)

The package is [publicly available on npm](https://www.npmjs.com/package/@tyleretters/discography).

## Step 3: React and a Basic Layout

[![Consuming from NPM](/images/discography-03-consume.png)](/images/discography-03-consume.png)

I created a new React app and installed my `@tyleretters/discography` package. Since the package is written in TypeScript, I made sure to export the `Release` and `Track` interfaces. Ensuring my React components adhered to these interfaces made development fun because everything seemed to "just work." Here's what the interfaces look like as of writing:

```typescript
export interface Release {
  title: string
  project: string
  released: string
  type: string
  format: string
  role: string
  label: string
  mp3: boolean
  wav: boolean
  tracks: Array<Track>
  notes: string
  credits: string
  release_slug: string
  project_slug: string
  cover_url: string
  id: string
}

export interface Track {
  number: number
  title: string
  length: string
  mp3_url?: string
  wav_url?: string
  id: string
}
```

From there it was really quick work setup a basic layout:

[![Basic Styles](/images/discography-04-basic-styles.png)](/images/discography-04-basic-styles.png)

I configured GitHub Pages to serve my application so I could test it out on my phone. I always like setting up CI/CD as early as possible in a project so that I have plenty of time to work out the nuances as I go. There is nothing worse than scrambling to do your "first deployment" when you're ready to be done with the project.

Alright, I have my data, a React app, a URL serving the app... but what about images and music?

## Step 4: S3 Bucket & Better Styles

[![Images and s3cmd](/images/discography-05-images-s3cmd.png)](/images/discography-05-images-s3cmd.png)

I wanted all images and music to be hosted in a public S3 bucket. I named the bucket "Intertext" because that is my [one-man, non-label](https://intertext.bandcamp.com). After configuring permissions I was able to create a simple workflow to easily sync assets with the `s3cmd` utility:

```shell
cd ~/projects/intertext
s3cmd sync . s3://intertext --exclude ".DS_Store"
```

[![Better Styles](/images/discography-06-better-styles.png)](/images/discography-06-better-styles.png)

I spent another half-day harvesting images, updating the NPM package accordingly, and was able to readily consume the assets in my React app.

## Step 7: Declare MVP

[![Release Details](/images/discography-08-mvp.png)](/images/discography-08-mvp.png)

It quickly became clear this was going to be one of those "lifetime projects" I'll curate for many years to come. In these cases, it is important for me to declare a MVP (minimum viable product) and give it the old `v1.0.0` release number sooner than later.

As of today, I only have MP3's from my latest release [IN DARKNESS RADIANT](https://stuxnet.bandcamp.com/album/in-darkness-radiant) available, but in the coming days and weeks I plan on adding:

- MP3s for each release.
- WAVs for each release, if I can find them.
- Links to streaming platforms like I have on [stuxnet.me](https://stuxnet.me).
- Zipped downloads in addition to individual tracks.
- An audio player.
- Routing/deep links.

I look forward to enhancing the application and backfilling more music from my catalog in the days to come.

Until then, [check it out!](https://discography.tyleretters.com)
