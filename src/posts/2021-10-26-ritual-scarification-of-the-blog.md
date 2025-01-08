---
title: Ritual Scarification of the Blog
date: 2021-10-26
tags: ["Wildcard"]
---

I recently removed the "[IBM Plex](https://fonts.google.com/specimen/IBM+Plex+Sans)" font and reverted to the [Digital Ocean Sans-Serif CSS Font Stack](https://www.digitalocean.com/community/tutorials/css-system-font-stack). I'd paraphrase for you but this is all gold:

> Fonts on a website can easily become a large part of the total bundle size that browsers have to download before being able to display a page in its final look and form. Plus, we need to worry about all kinds of things like the infamous Flash of Unstyled Text (FOUT). Arguably, though, part of this whole issue has been resolved, thanks to the font-display property.
>
> Added to that is the fact that the text found on a website is almost always the most important part, so we don't want text that doesn't look right or that's hard to read. What's a savvy web designer to do to satisfy both performance as well as look and feel?
>
> One solution is to actually resort to using a font that's already installed on the device of the user. In the past that was not a very elegant solution because some popular systems didn't come with beautiful font faces baked-in. Things are different now however, and every major operating systems ships with a sans serif system font that looks and reads nice.
>
> So the trick just becomes to provide all those default system font names as the value for the font-family property for the element(s) that should use a system font. The browser will then use the first one that it can find on the current system. Keep in mind that this will also mean that the text will look different based on what system it is being read on. That's not necessarily a bad thing however, as the text will feel native to the OS its being read on.

The balancing of art, science, engineering, and design.

It is a absolutely stunning piece of scientific/aesthetic functional-art:

`body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
}`

Anyways, funny thing about IBM Plex: [its got a history](https://www.ibm.com/plex/). Not unrelated, I also removed Google Analytics this week. And a funny thing about GA: not once have I leveraged its auspices for [https://nor.the-rn.info](https://nor.the-rn.info).

Why?

Because it doesn't measure what matters.
