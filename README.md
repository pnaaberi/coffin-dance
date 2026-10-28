# Coffin Dance

[Play Coffin Dance](https://pnaaberi.github.io/coffin-dance/)

A browser rhythm game. Hit **← ↓ ↑ →** (or tap the arrow buttons on a phone) as the buttons reach the gold
handle to keep the pallbearers in step and the coffin on their shoulders. Every song gets faster; drop the
coffin and it's game over. The published game saves scores to a shared online board.
Forks can clear the URL and publishable key in `js/config.js` to use browser-local scores instead.

Built with [three.js](https://threejs.org) and the Web Audio API. No build step and nothing to install.

**Controls:** arrow keys or on-screen buttons · **P** / **Esc** pause · **M** mute.
The game pauses itself when you switch tabs or apps.

## Project structure

```
index.html                page shell, social-preview tags, import map
css/style.css             HUD, menus, buttons, touch controls
js/game.js                scene, dancers, rhythm engine, audio, physics, UI
js/leaderboard.js         high-score board (Supabase, or localStorage when not configured)
js/config.js              Supabase URL + publishable key + removal contact
js/profanity.js           name filter (generated, see below)
vendor/three/             three.js 0.160 (MIT), so the game doesn't depend on a CDN
assets/og-image.png       picture shown when the link is shared
supabase/schema.sql       scores table + Row Level Security
supabase/name_filter.sql  the name filter, enforced by the database
supabase/protection.sql   rate limits, score sanity check, column permissions
tools/wordlist.py         blocked-word lists (edit these)
tools/gen_filter.py       regenerates js/profanity.js + supabase/name_filter.sql
```

The 3D models are **not** in this repo: they load from Polyfork's CDN (see Credits).

## Run locally

Browsers don't load ES modules from `file://`, so serve the folder:

```sh
python3 -m http.server 8000      # then open http://localhost:8000
```

## Deploy (GitHub Pages)

This repository publishes to **https://pnaaberi.github.io/coffin-dance/** from `main`, folder `/ (root)`.
Pushes to `main` trigger a Pages deployment. Check **Actions → pages build and deployment** for its result.
The `.nojekyll` file keeps this a static site with no build step.

For a fork, enable **Settings → Pages → Deploy from a branch**, select `main` and `/ (root)`, then update
`og:image` and `og:url` in `index.html` to the fork's full Pages addresses.
To roll back a source change, revert its commit and push; to take the site offline, use **Settings → Pages → Unpublish site**.

## Online high scores (Supabase)

Run these in the Supabase **SQL Editor**, in order (each is safe to run again):

1. `supabase/schema.sql`: the table and read/insert rules
2. `supabase/name_filter.sql`: rejects offensive names
3. `supabase/protection.sql`: rate limits, impossible-score check, hides private columns

Then put the **Project URL** and **publishable** key in `js/config.js`, and a `contact` (email or a GitHub
issues link) so players know how to get a name removed.
This repository includes the game's public Supabase URL and publishable browser key. A publishable key
is intended to be public; database policies control access. Forks should configure their own project or
clear both fields for local scores. Never use a service-role or secret key in browser code.
Run all three SQL scripts before enabling the online board; `schema.sql` alone is not the hardened setup.

The current hosted database accepts scoreboard reads but does not yet have the optional `client_hash`
column from `protection.sql`. The extra hardening below requires applying the SQL in the Supabase SQL
Editor; publishing these files to GitHub does not migrate the live database.

After all three scripts are applied, the database enforces these rules even for direct API calls:

- read only `name, score, level, created_at`; insert only `name, score, level`; no update or delete
- names: 1 to 16 characters from letters, numbers, spaces and `. _ - '`, passing the profanity filter
- scores: a coarse upper bound based on the submitted level
- best-effort limits of 3 scores per minute per connection hash and 40 per minute globally
- the time is set by the server; the scores table stores an IP-derived hash instead of the raw address
- maintenance functions cannot be called by public or authenticated API clients

Scores are still reported by the player's browser, so a determined cheater can post a plausible fake.
Remove those in **Table Editor → scores**. `supabase/protection.sql` also includes an optional daily
clean-up job (keeps the top 100 forever and drops other rows after 30 days).
The trigger's count checks are not atomic under concurrent requests, and its IP headers must come from a
trusted proxy. These limits are not a denial-of-service defense. Use a trusted submission endpoint and
atomic rate limiting for an abuse-resistant public leaderboard. The fixed-salt MD5 value is pseudonymous,
not anonymous: it can be guessed for known IP addresses. Hosting providers may also retain request logs.

## Checks

Run the leaderboard regression checks with Node.js 22 or later:

```sh
node --test tests/*.test.mjs
```

They cover local saves, corrupted browser storage, unsafe score fields, invalid submissions, and online
read/save/error handling. The tests use fixtures and do not write to the live leaderboard.
The bundled `vendor/three/` files are from three.js r160; keep its MIT licence with any redistribution.

## Name filter

The same rules run in the game (live while typing; Save stays disabled until the name passes), in the
database, and again before names are displayed (anything that slipped in shows as `***`).

It catches leetspeak (`sh1t`, `$hit`), separators (`f.u.c.k`, `a s s`), stretched letters (`fuuuck`),
accents (`fück`), look-alike and phonetic Cyrillic/Greek letters, full-width letters, invisible
characters, reversed words, camelCase (`BigAss`), hate codes (`1488`), and words in English, Finnish,
Swedish, German, Spanish, Portuguese, Italian, French and Russian. A whitelist keeps names like
Scunthorpe, Dickens or Cocktail working.

To change it, edit `tools/wordlist.py`, then from the `tools` folder run `python3 gen_filter.py`, copy the
generated `profanity.js` into `js/` and `name_filter.sql` into `supabase/`, and re-run that SQL in Supabase.

## Launch checklist

- [ ] All three SQL files run in Supabase; one test score saved from the live site
- [ ] `contact` filled in `js/config.js`
- [ ] `og:image` / `og:url` set to full addresses; link preview checked (paste the link in a chat)
- [ ] Two-factor login on your Supabase and GitHub accounts; Supabase on the Free plan (no surprise bills)
- [ ] Played once on a phone (portrait) and in another browser (Firefox or Safari)
- [ ] 3 to 5 friends played it; difficulty feels fair
- [ ] Free Supabase projects pause after about a week without visits: if the board says it can't reach
      the server, open the Supabase dashboard and restore the project

## Privacy

The game creates no accounts or cookies. On the published site, saved names, scores and levels are sent
to Supabase, timestamped and publicly readable. Volume, mute and the last name typed stay in the player's
browser (localStorage). A fork with online configuration cleared also stores its scores locally.
When `protection.sql` is applied, the scores table keeps an IP-derived hash for rate limiting; this is
pseudonymous data, and provider request logs are separate. Players can ask for an online entry to be
removed via the contact in `js/config.js`.
The browser loads models from Polyfork, which receives the request's network metadata.

## Credits

- 3D models by [Polyfork](https://polyfork.dev), loaded from their CDN: Blackjack Dealer (restyled into
  the pallbearers), Coffin Prop, Termite Mound, Dead Tree, Broad Canopy Shade Tree and Wood Ant.
  Free for use in games with no attribution required, but the files themselves may not be redistributed,
  which is why they're not in this repo ([licence](https://polyfork.dev/licensing)).
- [three.js](https://threejs.org), MIT licence (`vendor/three/LICENSE`).
- Music and sound effects: original, generated live in the browser.
- Inspired by the *Coffin Dance* meme.
