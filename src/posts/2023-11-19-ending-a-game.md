---
title: Ending a Game
date: 2023-11-19
---

It is with a heavy and clear heart I am announcing the end of [Coral Carrier Incarnadine](https://llllllll.co/t/51866).

I started development of the game in 2022 knowing it was unfathomably large, that by the time it was complete most of the coral reefs could be dead, that it would be an endurance testing multi-media and multi-decade endeavor.

![CCI RIP](/images/cci-rip.jpg)

What I didn't know is that so much of the problem-spaces inherent in game development would hold so little of my interest. It is for this reason alone I am throwing in the towel, raising the white flag, and letting it sink into the abyss of forgetting. To me, this is ultimately an act of energy-protecting selfishness and radical self-kindness.

Said plainly: I'm unwilling to invest the time into solving the problems needed to deliver the vision. (Much more on these problems below.)

I assure you if I were to become magically and unfathomably wealthy overnight, I would likely open a small studio and pay others a livable wage to solve these problems for me. But, as it stands today, I have come to terms with the fact I have aspirations to create what is essentially a "AAA" gaming experience with only my free time and the generously and sporadically donated time of others. I've been burning the midnight and weekend oil for almost two years and the finish line only grows further away. I looked to small indie studios and creators like [Cardboard Computer](http://cardboardcomputer.com/), [XRA](https://xra.itch.io/memory-of-a-broken-dimension), [Hundred Rabbits](https://100r.co), and [ENDESGA](https://www.patreon.com/ENDESGA) as role models and proof I too could do it.

And truth be told, I know I could.

But I'd prefer not to.

## The Problems I Don't Want To Solve

The game started on [norns](https://monome.org/docs/norns/). I was riding high from the success and popularity of some of my other projects on the platform, so it was a natural choice. But norns isn't a gaming platform, it's a music platform. So I went dutifully to work, excavating and building the foundation for all the myriad of things a game needs to tick. But each brick seemed to spawn the need for two more bricks and I began to grow suspicious.

[Soot](https://github.com/northern-information/soot) is a perfect example. One of the first choices you make (consciously or not) with a 2D game is whether to _render_ graphics on the fly or _show_ pre-drawn images. I knew I was going to _show_ images. Thus: Soot! A framework for manipulating pre-drawn images on norns. It was an absolutely necessary building block for the game to work, yes... but building and maintaining a sprite library isn't something that actually excites me. Moreover, animating sprites doesn't even really excite me! The sprites are just medium to convey the concepts and messages of _the story_, the thing that _actually_ excites me.

Soot is just one example of dozens of similar several-layers-removed-from-the-actually-fun dilemmas development of the game presented to me. At some point I realized I was spending all my energy thrashing between frustrating problems. I kept promising myself I'd get to "the good stuff" if I could just figure out one more problem of the day. And when I would finally treat myself to working on the story itself, any feelings of absolute elation were quickly stifled with harsh realization as to how far away sharing "the good stuff" actually was.

Here are some of the other problems I didn't want to solve, but knew I had to:

- Save files and how to prevent save-scumming
- State and how to prevent tampering with in-memory values
- Human-computer interfaces (keyboard, mouse, game controller)
- Accessibility for people visual impairments
- Accessibility for people physical impairments
- Internet connectivity, servers, infrastructure
- Forward compatibility
- Backwards compatibility
- Maintaining usernames and passwords
- Security
- Delivering all the above at with minimal hard costs (the game is free)
- Browser compatibility
- Quality assurance, unit testing, automation, builds
- Marketing & comms
- Competing with other games
- Community events and organizing (ostensibly marketing)

At some point CCI had become a deep-time MMORPG, would be primarily played in the browser, had interconnected norns components, was sorta like crypto-sudoku, and would also be a card game. Last year around this time I made a dependency map:

![CCI Dependency Map](/images/cci-dependency-map.jpg)

If I were to update this for today it would be ten times the size.

Worse, my other artistic practices suffered. It is no coincidence I have released less music during this era than any other in my career. Whenever I would work on non-CCI music, I felt a massive amount of guilt; like my time was being squandered and ought to be spent elsewhere.

## The Things I Do Want to Spend Time On

All I really want to do with CCI is tell the story. And if this is true, why not just write a novel? Or a collection of short stories? Or a novella?

Good questions.

And maybe I will... but certainly not now.

Now, I need some time and space from the project. I have more code, images, reference documentation, architecture diagrams, journal entries, songs, sound effects, notes, plans, maps, and assets than I've ever created for a project. And most of these don't really serve _the story_ of CCI. They serve _the game_ of CCI.

And if I've learned anything from this endeavor, it's this: _I am not a game developer._

## Thank You

The world of CCI continues to captivate me. We built this collaboratively and in a manner not dissimilar from the very best TTRPG experiences. To everyone that has contributed stories, images, music, and art: thank you. It is my sincerest hope the act of creation and sharing brought inherent joy. Know that you are always welcome in this world, for it is yours just as much as it is mine.

To everyone who has a story, song, bit of code, or character in flight: I am sorry. There will be no opportunity to share what you've done. No flaming arrow shot into a burial ship or massive send off with confetti and bunting. No scrapbook of memorabilia and ephemera. No compilation album or documentary or retrospective or anthology. These things all crossed my mind but none of it feels right.

No, it is my wish for _CCI: The Game_ to fade away with as little fanfare as possible.

Perhaps I will return to the world of CCI one day, but now I need to write this post, share it with you all, hit the power switches, let the pumps fail, and watch it all sink into the sea.

![CCI End](/images/cci-end.jpg)

I feel the weight lifting already.
