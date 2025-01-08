---
title: "Learning Max: My Voynich Manuscript"
date: 2020-04-28
tags: ["Music Technology"]
---

If you want to skip a head to the end of this post, you can see the path I took to learn Max. If you want to hear about my experience, start here.

I think learning [Max](https://cycling74.com) was especially difficult for me because I approached the task simultaneously as both an electronic musician and as a programmer.

It felt like at every step of my learning I would be met with an obstacle.

"_I can't do that!_ That's not a good programming practice!"

"Ahh, how do I make a simple ADSR?"

"...I just want to loop a bloody 808 kick."

Paradoxically, my degree of comfort over both electronic music and programming made learning Max more difficult than it should have been. It was only when I was able to release my old mental models and habits that I was able to start groking Max. And only now, about two years later, do I feel like I have a grasp of the fundamentals of Max.

Like the indecipherable Voynich Manuscript, Max was impenetrable and without reference points. But unlike the Voynich Manuscript, there were lots of people and resources out there ready to help me.

![Voynich Manuscript]/rm*ation/images/voynich-manuscript.jpg)
\_Voynich Manuscript, circa 15th century.*

![Early Max Patch]/rm*ation/images/nsequencer.png)
\_One of my early patches, circa 2018.*

## The Electronic Musician Angle

I've been creating electronic music for over half my life. I started with cracked programs like Hammerhead. These were downloaded from [Limewire](https://en.wikipedia.org/wiki/LimeWire) and installed off CD-Rs of questionable provenance from Russia in the early 2000s. Over time I moved through DAWs, hardware, and different rigs for performances.

![Hammerhead]/rm*ation/images/hammerhead.jpg)
\_Hammerhead. You never forget your first love.*

I adopted Ableton Live as my primary DAW in 2009. The learning curve was frustrating and steep. It wasn't until about 2011 that I actually felt somewhat comfortable with the program. Now, in 2020, I'm still reluctant to call myself an expert, but I've certainly put in my 10,000 hours towards mastery.

My comfort with the program is to point where the interface is entirely transparent. When I work in Live, there are no translations between thinking and doing. I stay on top of the latest releases and learn the new features as they come out. I would estimate I use 90% of the features. I've written hundreds of hours of music in Live and I love working with it.

This mastery does not come without drawbacks. My mind was very much locked into the paradigms of Live and modern age DAWs. Time along the X axis, tracks and amplitude along the Y axis, sends and returns, the MIDI format itself, 12 tone scales... All this is unquestioned and indeed fundamentally a part of DAWs today. You can't change it even if you wanted to.

Similarly, I've been performing with (and often without) a laptop since the mid 2000s. My live rig has gone through more iterations than I can count. At one extreme end of the spectrum was the maximalist shenanigans of the Northern Information Movement. At the other end I would go all the way down to a single delay pedal for of a solo ambient DJ set.

![Northern Information Movement]/rm*ation/images/tyler-etters-adam-moore-paul-petrosyan-rakes-end.jpg)
\_Northern Information Movement, 2013*

![Solo Set at The Hideout]/rm*ation/images/solo-set-at-the-hideout.jpg)
\_Setting up for a show at [The Hideout](https://www.hideoutchicago.com/), 2014*

Because I've used so many different types of electronic music software and hardware that all follow similar paradigms for so many years, Max was utterly alien to me.

## The Programmer Angle

I've been programming professionally since the late 2000s. I cut my teeth hacking MySpace pages for bands, graduated to WordPress, and eventually moved on to web application development. I mostly work with JavaScript and PHP. These languages trace their lineage to C. They support functional as well as object oriented paradigms.

Code is written with letters and numbers and saved to text files. These files sit in a directory structure and interact with one another, flinging bits of data around and calling functions from one another.

Indeed, Max works similarly to this, but the presentation is utterly different. Max is a visual programming language, whereas JavaScript is textual programming language.

Just compare these two [hello world](https://en.wikipedia.org/wiki/%22Hello,_World!%22_program) programs:

### JavaScript

This code would be saved to a file such as `scripts.js` and then referenced via an HTML page and viewed in a browser.

```js
console.log("Hello, World!")
```

### Max

This code runs in the Max environment. I've included a screenshot because, if you expand the actual "code" below, you cannot make sense of it.

```max
----------begin_max5_patcher----------
308.3ociRErSCCCC8bxWQvmKSscqiAeA7GvA1DJq0Zjo1jpjzQQS6emFmVsA
CA6Rh7KO6me14HmAaM8nCDOIdUvXG4LFAE.XiwLnQ1WVKcDMnAcN4NDRhu4w
dOguFdFqqMIhWL15p6VCSLZk9x2U5cuYwReTorhGmklHxdXQ3ZUQ3LOeVpXy
XN5tFktF8jj4mAMc9IzrQTUEIuY696KljLRy+YKF0C.wlvKm37vQxMZUM9wP
YuxosVk1++tKOeY3Zd9e6tre0coW6tL3BKP0BpU5et7n9If+ce4Lc1xoow3r
RbtipPmWokdkQeAmrHmqjU11d.stQxjDCCt8FaHbUBEpzwPxdfEOnl3OmPj1
gwleXl0Yo1B5Wt.hoZpPqtSQYyCqqAIokhVN74qUF8As63m3ekIgl9N
-----------end_max5_patcher-----------
```

![Hello, World!](/images/hello-world.png)

I had a lot of ideas about how to structure programs, orthogonal design, inheritance, abstractions... Many of these principals apply in Max, but you have to dance differently. The formalism of my programming skills got in the way of allowing me to embrace the inherit "messiness" of Max patching. Sure, you can make beautiful and architecturally-sound patches, but the experience of doing so feels really different than methodically writing unit tests and committing your source code to version control.

### My Curriculum

1. First and foremost, you need to make a commitment to yourself to not give up. I almost gave up several times. Don't! Keep going!
2. Get comfortable with the built in documentation in Max. ⌥ + click everything!
3. My biggest shoutout goes to [dearjohnreed](https://www.youtube.com/user/dearjohnreed) and [his fantastic Max 8 Tutorial series on YouTube](https://www.youtube.com/watch?v=TO8cRfKT624&list=PLVIa8UkRzErsL95NoKH0QFaoLVMFqxbnA). I voraciously gobbled all of these. These videos took me from rolling around in the cradle to crawling. (And if I didn't have my electronic musician and programmer bias blinders on, I probably could have gotten up to a light jog.)
4. After finishing dearjohnreed's tutorial I hit a bit of a plateau. I was able to get some of my ideas off the ground, but would still struggle with fundamentals. That's when I found out about Kadenze. [Programming Max: Structuring Interactive Software for Digital Arts](Programming Max: Structuring Interactive Software for Digital Arts) by Matt Wright helped me so much. It is incredibly challenging, informative, and fun. I sunk dozens of hours into my assignments and was able to consistently push myself further and further with each assignment. (I signed up for a paid membership, but I believe you can also access them for free.)

The journey was difficult but rewarding. There were many days where I almost gave up and threw in the towel. I kept going because I wanted to challenge myself and I saw the incredible potential Max offers. It is a medium unlike any other out there. I hope you found this post inspiring and encouraging.

If you get stuck on anything in your journey, get in touch and I'll do whatever I can to help.
