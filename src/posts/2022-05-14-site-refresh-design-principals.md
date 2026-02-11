---
title: Site Refresh Design Principals
date: 2022-05-14
---

The Northern Information site refresh project was originally in a directory called `nobullshit`. Some things I've changed to meet the challenge:

1. Return to brand roots.
   1. Idiosyncratic yet stock.
   2. Anachronistic yet futuristic.
   3. Looks like ten years ago but could only have been created now.
2. Offer "inarguable" solutions to design problems with regards to content/data footprint growth.
   1. Less grid sub-systems.
   2. Less templates.
   3. Leverage organic text flow.
   4. All type units are in `rem`.
3. Semantic & accessible:
   1. `tabindexes` and `:focus` states.
   2. Algorithmically approved contrast for legibility.
   3. Mobile first.
4. Expose metadata when possible.
   1. Introduced "[Edit](https://github.com/tyleretters/nor.the-rn.info/blob/main/_posts/2022-05-14-site-refresh-design-principals)" hyperlinks to GitHub files where practical.
   2. Introduced "Jekyll `site.time` run:" timestamps on all pages.
5. Another scalpel to the information architecture.
   1. Improved menu hierarchy.
   2. Nuanced typographic styles.
   3. The brighter the type, the more important or interactive.
   4. Remove duplicate filenames in different directories. (i.e. `_pages/software.html` and `_includes/software.html` became `_pages/software.html` and `_includes/article-software.html`)
   5. Remove legacy redirects that where probably only used by me.
   6. Reintroduced the [Discography](/discography) page.
6. Remove all content delivery network dependencies.
   1. No more jQuery.
   2. No more Font Awesome.
   3. Bootstrap (CSS only) is now self-hosted.
7. To balance out all this rationality I had to add the [Philosophy](/philosophy) page.
