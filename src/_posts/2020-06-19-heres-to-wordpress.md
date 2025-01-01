---
title: Here's to WordPress
date: 2020-06-19
tags: ["Wildcard"]
---

Until last night, I've had WP servers running continuously since 2009. Yes, I destroyed my last server. It was a long time coming. This is an ode to WP, the platform that jump-started my career and welcomed my plunge into web technology.

<!--x-->

Here's to you WP, you and your beautiful community.

Here's to the punk-zine ethos and empowerment I think we all felt in the early days.

Here's to `if ( have_posts() ) : while ( have_posts() ) : the_post()`.

_Thank you. Indeed, I do have_posts()!_

Here's to your egalitarian codex that prioritizes human language preferences front and center. Here's to somehow having ~30% market share _of all websites on the internet_ this many years on.

Here's to that bug where just visiting the permalinks page under settings fixes a bunch of stuff.

Here's to getting pwnd by bots and script kiddies, no matter how many times you harden your server, upgrade, lock down permissions, uninstall old plugins, update themes, and change passwords.

Here's to emergency server rebuilds when things went boom.

Here's to that time I learned what DNS was because I told my client's former developer to delete all the DNS entries before I had all the new ones setup.

Here's to fighting with file permissions and years of SFTP deployments. Here's to still fighting with file permissions after moving to SSH deployments and git. Here's to still not being clear what files should be added to `.gitignore`. Here's to finally realizing (this week) that I could just:

```
% wget https://wordpress.org/latest.tar.gz
% tar -xzf latest.tar.gz
% mv public_html old && mv wordpress public_html
% mv old/.htaccess public_html
% mv old/wp-config.php public_html
% rm -rf public_html/wp-content
% mv old/wp-content public_html
% chown -R www-data. public_html
% service apache2 restart
```

Here's to the hope and promise of every new site, every blank theme, and every empty CSS file.

Here's to all the small businesses I helped get off the ground with their first sites. The Waldorf school, the compost startup, the family chiropractor, the musician in New York City, the hookah lounge. Here's to all the countless band and label sites.

Here's to the financial security and personal confidence that work afforded me. Here's to quitting my soul-sucking as a cashier/photo-tech/cart-boy/credit-card-salesman job at Sam's Club.

Here's to the thousands (millions?) of other developers and designers you did the same for.

Here's to being the gateway to PHP, JavaScript, jQuery. Here's to teaching me that JavaScript and jQuery were different things. Here's to that time I finally groked the client/server relationship as a three dimensional game of tennis on the inside of a sphere. Here's to having a REST API and knowing it as a good thing but still being too green to have experience to understand what it was or how to use it.

Here's to the famous five minute install. Here's to installs that actually took five minutes. Here's to installs that took a week. Here's to being thrown into phpMyAdmin, cPanel, and other domains of system administrators. Here's to never really understanding how to setup MySQL in the early days and all the finger-crossing that went along with that.

Here's to the `.htaccess` hacks and `define( 'WP_DEBUG', true );` and `tail -f error_log.php` and `UPDATE wp_options SET option_value = replace(option_value, 'http://www.oldurl', 'http://www.newurl') WHERE option_name = 'home' OR option_name = 'siteurl';`.

Here's to the WSOD.

Here's to only the homepage working.

Here's to permalinks - pretty and otherwise.

Here's to `/wp-admin`.

Here's to losing your WP admin password and not having email setup on this server just yet (so hard to debug) but still having MySQL access so run a fresh install locally just so you can grab a hashed password from that database and save it to a `.txt` file and then just `INSERT` it directly into the database and **by god it works**.

Here's to the elation that came with seeing the site running after all that was over.

Here's to the months and years that you could diligently, solemnly, reliably run without need of restart nor upgrade nor human attention.

Here's to Aksimet.

Here's to Hello Dolly. [Which] is not just a plugin, it symbolizes the hope and enthusiasm of an entire generation summed up in two words sung most famously by Louis Armstrong: Hello, Dolly. When activated you will randomly see a lyric from Hello, Dolly in the upper right of your admin screen on every page.

Here's to all the feels right now, and not wanting to end this blog post. Here's to only having to lookup one or two things to write this blog post because it so so ingrained and internalized even though I haven't really developed a WP site for years.

Here's to finding a tool that will let you realize your ideas and create.

Here's to that insane post-structuralist experimental art project Theresa and I did called "compost" that ran on WP.

Here's to `View Source...`ing some of your favorite band's website's and `⌘-F`ing for `wp-` and discovering that, yes, yes indeed they, too.

Here's to writing, dammit. Here's to sharing your ideas and helping other share their ideas. That's the whole point of this thing.

Here's to exporting your posts to XML so you can convert them to markdown.

Here's to figuring out that you _really really really_ need a local development environment if you want to do this the right way. Here's to MAMP. And WAMP. And later Vagrant. And later thinking, that, again, maybe I don't need a local development environment after all. And here's to being wrong about that.

Here's to destroying my last droplet with a `wp` prefix.

Thank you WP. You have served me well.

> A man sets out to draw the world. As the years go by, he peoples a space with images of provinces, kingdoms, mountains, bays, ships, islands, fishes, rooms, instruments, stars, horses, and individuals. A short time before he dies, he discovers that the patient labyrinth of lines traces the lineaments of his own face.

― Jorge Luis Borges
