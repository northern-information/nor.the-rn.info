---
title: CCI Update
date: 2022-04-23
tags: ['Coral Carrier Incarnadine']
---

Welcome to a leviathan [Coral Carrier Incarnadine](https://cci.dev) update!

CCI is an [open source](https://github.com/northern-information/cci) game for the [monome norns](https://monome.org) sound computer in which players lead the CC Incarnadine and her crew of climate-punks, nautical drones, and GMO algae on a mission to heal the desiccated coral reefs.

We open the update with a canonical short story written by Coral Carrier Incarnadine contributor, [@pleco](https://llllllll.co/u/pleco). Afterwards, I'll share what I've been up to for the last several months.

## Obibe's Descent

![The Pacific](/rm_ation/images/cci-update-pacific.jpg)

> _This story is sung between the whales, it is one of their oldest songs._
>
> When the number of whales in the sea had grown so few, and the Great Patch had grown to its terrible size beyond comprehension, Obibe, the Lung Mother, led the last pod on what she feared would be its final migration. Together they dove under the Patch, hoping against all odds to find waters far from its reach where the sea was clean, the air was pure, and the krill were not mutated and distorted by the poisons that leached from the refuse. The journey went on and on, at times the struggle of finding some tiny gap in the garbage to breathe led to such exhaustion that many in the pod nearly drowned daily.
>
> On the twenty fifth day of their journey, the Patch became so thick with waste that none in the pod could find a suitable place to reach the air. Obibe watched as one by one the members of her pod writhed and wretched, fighting back the need for breath. When the eldest of their pod suddenly ceased her struggle and became still, Obibe let out a mourning bellow, opened her mouth as wide as the Third Moon's tail across the still ocean and swallowed up mountain after mountain of waste, creating a space for the pod to surface. The pod went gasping to the open air, aiding each other up, and rejoiced when the elder sputtered back into consciousness. Amidst their cries of joy, Obibe let out a piercing tone of pain and sorrow. The waste had poisoned her every part, and the weight of it drew her down into the depths of the ocean. Obibe's four daughters chased after her, singing, and the pod, exhausted and weakened, could only listen to their chorus until it went silent three days later.
>
> _Obibe's whale fall has never been found, and the daughters were never seen again. There has been hearsay among the travelers of the Garbage Patch that some gaps in the patch will appear perfectly circular, and in the waters within them a distant, four voice drone can be heard in all directions. The whales themselves tell differing interpretations of hearing the daughters song, both of it being a guide to safe waters, or it being an omen of impending loss or sacrifice._

## New Paradigms

![Santa Muerta](/rm_ation/images/cci-update-santa-muerta.jpg)

When I started this project in January of 2022, I dove directly into execution mode. This was more or less how my other norns scripts emerged. Something was different this time, though. I kept stalling out. I'd write a few lines of code and have no clue how to progress. Slowly, it dawned on me.

I didn't know what the hell I was building.

In order to write code you need "business logic" &mdash; an industry term for the arbitrary policy or legal rules needed in a feature. "Send invoices on the last day of the month," is a wonderfully dry example of business logic. If it were up to a developer to determine the day, she might decide the 1st or the 15th so that every month could be exactly the same. But, because the company chose the last day, now she needs to write code that has some notion of "last day" and the complexity multiplies...

![Seaspray](/rm_ation/images/cci-update-seaspray.jpg)

Me? I was writing code before I even knew if there _were_ invoices.

I stopped programming immediately.

I didn't even know what the rules of the game were! How do you win? How do you lose? What are the mechanics? I knew CCI was a narrative, roleplaying, abstract-strategy game... but that's about all I knew. There wasn't enough of a game-world developed to start distilling concepts into business logic into features into UI into, ultimately, _fun_. This is a game afterall!

My thinking evolved into several concurrent streams.

## Inspiration

![Manuals](/rm_ation/images/cci-update-manuals.jpg)

CCI contains gene sequences from all the games I've ever played. What are the touchstones the game is anchored in? Who's made similar games? Who's told similar stories? What can I learn from them?

Growing up, Magic: The Gathering, Battlefleet: Gothic, and Warhammer 40,000 were some of my favorite tabletop games. Metal Gear Solid, Starcraft, Doom, Diablo 2, Resident Evil, Armored Core, Abe's Odyssey, Another World, Flashback, Humans, Kings Quest IV, and MechWarrior were some of my favorite video games. I got a GameBoy Color and Pokemon: Blue right when they came out came out and was hooked for years...

![Battlefleet Gothic](/rm_ation/images/cci-update-battlefleet-gothic.jpg)

![Battlefleet Gothic, Inside](/rm_ation/images/cci-update-battlefleet-gothic-inside.jpg)

![Pokemon](/rm_ation/images/cci-update-pokemon.jpg)

![Skaven Under Empire](/rm_ation/images/cci-update-skaven-under-empire.jpg)

![Starcraft](/rm_ation/images/cci-update-starcraft.jpg)

And any of my [Instagram](https://instagram.com/tyleretters) followers know I'm way into Kentucky Route Zero, Elden Ring, and Bloodborne.

![Bloodborne](/rm_ation/images/cci-update-bloodborne.jpg)

It has been an absolute joy to return to my old strategy guides and rulebooks with "developer tools enabled." All these games look so different through this lens. ([Did you know Magic is Turing complete?](https://arxiv.org/abs/1904.09828))

![Prince of Persia](/rm_ation/images/cci-update-prince-of-persia.jpg)

## Community

Creating space for folks like [@pleco](https://llllllll.co/u/pleco) and you to contribute and carving out small chunks of actionable creativity and keeping everyone connected has been a top priority [since day one](https://l.llllllll.co/cci).

![Species](/rm_ation/images/cci-update-species.jpg)

## World-building

Who and what lives in the world of CCI? What are their names? What are their motives? This all takes place in the far future of our own timeline, so what is this world's future history? What recognizable fragments and plastic garbage survived all the eons?

![Story](/rm_ation/images/cci-update-story.jpg)

Presently, around 90% of my CCI energy is spent on world-building. This, too, has been riddled with challenge.

Say you are tasked with writing a small, interactive scene to establish the player and another character. They're out celebrating at a bar. Excellent! This scene will offer plenty of opportunities for characterization, world-building, and serving up a little slice-of-life for people living in the hive-city of Mannheim. You get an idea for a dialog choice. The player will be asked if they want another drink! In a flash, you see three options:

1. A conservative, "No, tomorrow we sail and I need my wits about me."
2. An impartial, "I don't know..."
3. A rowdy, "Eh, you sure you want to keep going after the trouble we got into last time?"

The wheels are turning with allusions and references to a shared history... but suddenly you realize: what _are_ they drinking? Beer? Wine? Rum? If it is wine, where do the grapes come from? Are there cellars out on the nearby region known as Chembayou? Can grapes even grow in a bayou...? Or maybe they aren't drinking alcohol? Maybe folks drink stimulants to relax? Or even narcotics or psychedelics? Or maybe there are "food printers" that can 3D print consumable items?

What people eat and drink are fundamental building blocks of culture. Each decision is an invitation to establish canon and build a cohesive, living world.

The question becomes one of _resolution_ - how deep do you need to go with the details? Some details write themselves. Others, like this one, spur entire new sub-quests of research.

One of CCI's fundamental concepts - like [arcologies](https://northern-information.github.io/arcologies-docs), and many of my other pieces - is emergence. Small, seemingly simple decisions that yield massive ramifications later.

I share this scenario because it reminds me of my favorite bug of all time. It is from [Dwarf Fortress](https://bay12games.com/dwarves/). Players were reporting cats getting drunk. No one could figure out why. Then, one of the creators cracked the case:

> Now, the cats would walk into the taverns, right, and because of the old blood footprint code from, like, eight years ago or something, they would get alcohol on their feet. It was originally so people could pad blood around, but now any liquid, right, so they get alcohol on their feet. And then I wanted to add cleaning stuff so when people were bathing, or I even made eyelids work for no reason, because I do random things sometimes. So cats will lick and clean themselves, and on a lark, when I made them clean themselves I'm like, "Well, it's a cat. When you do lick cleaning, you actually ingest the thing that you're cleaning off, right? They make hairballs, so they must swallow something, right?" And so the cats, when they cleaned the alcohol off their feet, they all got drunk. Because they were drinking.

I aspire to write bugs like this.

## Narrative

What kind of story is this?

Player vs player, player vs computer, me vs god, me vs me, or me vs nature? (hint: "yes")

Who is the story about?

What are the conflicts? Is there only one ending? Or multiple?

![Twenty Year Storm](/rm_ation/images/cci-update-twenty-year-storm.jpg)

## Game Design

Which aspects of the world show up in the game? What are the mechanics? How can I minimize the impact of un-fun random number generators?

![Sepulchre Punk](/rm_ation/images/cci-update-sepulchre-punk.jpg)

I am just now getting into designing how the main "game loop" works. A game loop can be thought of as a "turn cycle" or a sequence of events that repeats. If we're talking in musical terms it could be compared to a measure or bar. The game loop of Chess is: white, black. In basketball: pass, dribble, shoot. In Magic: untap, upkeep, draw, main, combat, main, end.

CCI has several game loops that interconnect and operate on different timescales. Roughly, they are:

### The Mitigation Loop

Locate reef, heal reef, get tangible rewards. Imagine toxic sludge clogging the vessel's engines. Timescale is in days.

### The Resource Loop

Acquire items, use items, run out of items. Imagine running out of fuel or healing items. Timescale is in weeks.

### The Exploration Loop

Chart, depart, passage, arrive. Think about storms and hostile waters. And just because this is a "non-violent, anti-colonial" game doesn't mean there aren't any violent colonists sailing around! Timescale is in months.

## UI/UX Design

How do are the game mechanics communicated to the player? How do they interact with the world?

![Shield](/rm_ation/images/cci-update-shield.jpg)

## Programming & Architecture

How is the software organized? How is data persisted? How do save files work? If they're stored as plain-text, will people [save-scum](https://tropedia.fandom.com/wiki/Save_Scumming) and hack them? Am I OK with that?

Syntax, logic, booleans, and version control.

I've shared many sketches and designs. I'm thinking about this project as something of my thesis in user interface and user experience design. With only 8,192 pixels to work with on a given screen this has proven to be an especially brutal challenge!

![Build](/rm_ation/images/cci-update-build.jpg)

[@ngwese](https://llllllll.co/u/ngwese)'s latest `screen.display_image_region()` feature arrived _just in time_ for this and has enabled me to design with [sprites](<https://en.wikipedia.org/wiki/Sprite_(computer_graphics)>) in mind. (With arcologies and yggdrasil, I programed each glyph pixel-by-pixel.)

Only a few concepts have made it all the way to programming spikes. A "spike" is a small piece of (typically) disposable code used to prove an idea. One spike turned into the (now mythical) unreleased roguelike ASCII game called [HIVERUNNER](https://nor.the-rn.info/2022/03/30/hiverunner/). Other spikes made their way into utility scripts like [u/KEY, u/DCE, & u/REF](https://l.llllllll.co/u).

## Quality Assurance

Once a feature is complete... Does it work? Is it fun?

![Signed](/rm_ation/images/cci-update-signed.jpg)

## The Fragmentum

```
For the moon never beams, without bringing me dreams
    Of the beautiful Annabel Lee;
And the stars never rise, but I feel the bright eyes
    Of the beautiful Annabel Lee: —
And so, all the night-tide, I lie down by the side
Of my darling — my darling — my life and my bride,
   In her sepulchre there by the sea —
   In her tomb by the sounding sea.
```

Though this is a sci-fi tale, it takes place in our own timeline. Fragments of our culture have survived and manifested in surprising ways.

- The "Floating Casino" serves as the central hub for the first act of the game. It is ensconced in protective breakwaters called "The Palisades." Why would a casino be so central?
- Earth, and the rest of the solar system, look quite different in this distant future. What's this talk of a third moon?
- [Necrosis and bleaching](https://en.wikipedia.org/wiki/Environmental_issues_with_coral_reefs) are arguably the primary antagonists. How have reefs adapted over time? What is the ultimate fate of the the [Great Pacific Garbage](https://en.wikipedia.org/wiki/Great_Pacific_garbage_patch)?
- Lunar clocks are the the only time system?
- Main "characters" are actually vessels. And what are vessels but "coral reefs" of people? Here's a list of the main cast:
  - Coral Carrier Incarnadine (CCI)
  - Surf Surveyor Phthalo (SSP)
  - Island Interceptor Lazuli (IIL)
  - Reef Remembrancer Aureolin (RRA)
  - Tidal Tug Calamine (TTC)
  - Bay Beacon Amaranth (BBA)
  - Dive Dreadnought Alabaster (DDA)
- There is a new demographic of human that identifies as coraline. Their births are somehow related to coral reefs.

## Call of the Ocean

<iframe width="560" height="315" src="https://www.youtube.com/embed/Y65rZSCXN4k" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

And now, I must return to my [bathysphere](https://www.youtube.com/watch?v=Y65rZSCXN4k).

The Lung Mother and her pod call.

And time is short,

Tyler
