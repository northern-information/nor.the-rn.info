---
title: Building "norns community"
date: 2021-04-09
tags: ["Music Technology"]
---

## Overview

![norns community home](/images/norns-community-home.jpg)

This is a visual account of building [https://norns.community](https://norns.community). It is divded into 4 sections:

1. Overview
2. The Design Challenge
3. A Solution
4. Conclusion

Most of the work was done in the month of March. Principal contributors were myself, [Jordan / @eigen](https://norns.community/en/authors/eigen), and [Dan / @dan_derks](https://norns.community/en/authors/dan_derks). (_Meta: dang, that feels good to actually link to it!_) As usual, the project saw plenty of collaboration from dozens of members of the monome community.

I'm really proud of the work we did, how quickly we did it, and how we much fun I had working together.

(Click any image to zoom in.)

---

## The Design Challenge

[llllllll.co](https://llllllll.co) (read: _lines_) is an electronic music forum. Among many other things, lines is the primary destination for [norns](https://monome.org/norns) script authors to share their work and norns owners to find new scripts. The site runs on [Discourse](https://www.discourse.org/about), is very well moderated, and has been a bastion of joy for me during the pandemic. Threads with new comments float to the top of the list and there are plenty of category and tag features built in:

![lines home](/images/norns-community-lines-home.jpg)

![lines tag 1](/images/norns-community-lines-tag-1.jpg)

![lines tag 2](/images/norns-community-lines-tag-2.jpg)

![lines script](/images/norns-community-lines-script.jpg)

The Discourse platform was designed for nurturing communities and having engaging discussions. Scripts, however, are essentially "products" that you have to "shop" for. (Even though all the scripts are open source and free, you still have to find the script, figure out if it is something you're interested in, make the decision to install it, learn how to use it, etc.) This requires a whole new set of features that go beyond what Discourse was designed to do:

- As a norns owner I need a way to explore new scripts.
- As a norns owner I need support using the software.
- As a script author I need a place to document potentially large amounts of technical data.
- As a script author I need to spread awareness (market) my script.

Naturally, people started using Discourse to address these needs. Personally, I was particuarly unhappy with the experience of documenting my scripts. One of my early solutions for the issue was to host my docs out on [GitHub Pages](https://northern-information.github.io/arcologies-docs/). Another solution, like Dan did with Cheat Codes, was to make a downloadable PDF. Both tasks require a relatively high degree of patience, passion, and technical proficiency.

- How might we make it easy for script authors to document their work?
- How might we make an "app store" experience for norns scripts?
- How might we get the community buy-in needed for adoption?

The experiencing of finding new scripts is hit or miss. New scripts that have a lot of activity are typically top of mind since they are surfaced by Discourse. But what about older scripts? With some patience you can get to them, but it requires a lot of searching and reading. Discourse is "text first" - you can't see images while browsing threads. This made "shopping" for scripts something of a guessing game. Click on a thread, maybe get lucky?

Furthermore, while the forum is very well moderated, there is no enforced information architecture (IA). Thread titles can be whatever. Script descriptions might be just a screenshot, or just some text, or a video...

---

## A Solution

_I call this section "A Solution" becuase there are always many ways to solve a challenge!_

[Brian / @tehn](https://nnnnnnnn.co) and Dan identified [wiki.js](https://docs.requarks.io/) as a solution. A wiki fit the open source and community spirit. Moving the content outisde of Discourse would free us up to make new design decisions. While they got to work setting up the server and configuring the platform, I started thinking about what an MVP might look like and getting to work on the IA.

### Information Architecture

My heuristics:

1. Keep it [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself).
2. Keep it [orthagonal](<https://en.wikipedia.org/wiki/Orthogonality_(programming)>).
3. Keep [tags](https://en.wikipedia.org/wiki/Tag_soup) to a minimum.

![norns community sitemap](/images/norns-community-sitemap.jpg)

![norns community tags](/images/norns-community-tags.jpg)

![norns community mobile](/images/norns-community-mobile.jpg)

---

### The Gallery Integration

Jordan had already put in a ton of work on a [custom script gallery](https://github.com/p3r7/norns-gallery) as an evolution of the [awesome monome norns](https://github.com/p3r7/awesome-monome-norns) project. He dove into learning the [wiki.js GraphQL](https://docs.requarks.io/dev/api) and was able to get all the scripts dynamically pulled in. This means authors only have to add thier correctly-tagged script page and the tech will do everything else for them. I applied CSS styling to match the rest of the site for a seamless experience. There was lots of fun technical challenges with this part of the project, but that's a whole separate blog post.

There are four different flavors of gallery.

1. View All Scripts
2. View One Author's Scripts
3. View One Category
4. View Some Number of Random Scripts

We implemented all this with an `iframe` and a GET parameter.

```html
<!-- all -->
<iframe src="https://p3r7.github.io/norns-gallery-render" id="gallery-iframe">
</iframe>

<!-- author -->
<iframe
  src="https://p3r7.github.io/norns-gallery-render/?author=northern-information"
  id="gallery-iframe"
>
</iframe>

<!-- category -->
<iframe
  src="https://p3r7.github.io/norns-gallery-render/?script-category=art"
  id="gallery-iframe"
>
</iframe>

<!-- random -->
<iframe
  src="https://p3r7.github.io/norns-gallery-render/?random=4"
  id="gallery-iframe"
>
</iframe>
```

![pull request](/images/norns-community-pr.jpg)

![norns community artist](/images/norns-community-artist.jpg)

![norns community sequencers](/images/norns-community-sequencers.jpg)

---

### Design

I actually didn't start with a wireframe.

Why?

I needed to learn the limitations of wiki.js first. I didn't want to design a layout that would be technically difficult to execute. Defaults are beautiful and wiki.js's default design sensibilities are quite reasonable.

wiki.js doesn't support custom themes but it does allow you to inject CSS and JS. I tried to keep this as minimal as possible. There's maybe CSS 10 delcarations total. Most of them just changing colors or hiding elements.

I was sure to add some fun stuff in, too. The login page features a technical schematic of the norns and the favicon is an abstracted norns. (Sorry [shield](https://monome.org/docs/norns/shield/) crew.)

![norns community wireframe](/images/norns-community-wireframe.jpg)

![norns community css](/images/norns-community-css.jpg)

![norns community fun](/images/norns-community-fun.jpg)

![logo](/images/norns-community-logo.jpg)

![norns community script](/images/norns-community-script.jpg)

---

### User Experience

There are two main persona's of the site. Script authors needed a detailed set of instructions so we setup a page with plenty of screenshots, explanations, and templates.

For non-authors, however, the key was actulaly _subtraction_. I made sure to keep the navigation as flat as possible. We made the decision to disable comments as Discourse is already great for that.

Dan setup authentication to work with both GitHub and Discord so people didn't have to make yet another account. Authors login with GitHub accounts. We know authors already have these becuase they are a pre-requisite to getting their work published in maiden, the script catalog. Editors need a Discord account and to be in the [norns study group](https://norns.community/study-group). The thinking here is this social proof would afford us some degree of resilience against vandalism.

wiki.js allows you to connect permission levels with the type of authentication. So authors can edit their "author" pages, but editors cannot, etc. It was a beautiful, clean solution.

![norns community instructions](/images/norns-community-instructions.jpg)

![study](/images/norns-community-study.jpg)

---

## Conclusion

This was a really fun project to be a part of. Once we were reasonably certain with the author instructions we started inviting script authors to add their work. For the experience to be a success for non-authors, there needed to be a critical mass of scripts on day one. As of go live we have about 80 which is a resounding success. I've already discovered new scripts!

A special shout out to Jordan - working with him was an absolute joy. He was measured, pragmatic, selfless, and gave me lots of help as I learned how ClojureScript worked.

I hope you enjoy using [norns.community](https://norns.community) as much as I enjoyed making it. My hope is for this community nurtured wiki to become the defacto place to learn about all of the amazing scripts out there.

---

## Update

[Jordan has written a lovely post chroniciling his experience.](https://www.eigenbahn.com/2021/05/10/norns-community)
