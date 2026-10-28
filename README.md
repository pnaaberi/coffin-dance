# Coffin Dance

[Play Coffin Dance](https://pnaaberi.github.io/coffin-dance/)

A browser rhythm game. Hit **← ↓ ↑ →** (or tap the arrow buttons on a phone) as the buttons reach the gold
handle to keep the pallbearers in step and the coffin on their shoulders. Every song gets faster; drop the
coffin and it's game over. The published game saves scores to a shared online board.
Forks can clear the URL and publishable key in `js/config.js` to use browser-local scores instead.

Built with [three.js](https://threejs.org) and the Web Audio API. No build step and nothing to install.

**Controls:** arrow keys or on-screen buttons · **P** / **Esc** pause · **M** mute.
The game pauses itself when you switch tabs or apps. Each new level is announced as soon as the
previous song ends; the announcement holds for 2.5 seconds, then fades over half a second.

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

The published game uses the `gameplay` Edge Function. Before playing, it obtains a random chart seed
and a private, expiring run token. Arrow presses are sent in ordered batches; the server replays the same
rules as the browser and calculates the score and level. Pauses stop the server's playable clock.
A run expires after two hours and can create only one score. Identical retries return the prior result.

Direct public inserts, updates and deletes are disabled. The old raw-score submission endpoint returns
an instruction to reload. Only the server role can access run state and commit verified results.
Older scores are retained as **legacy**; verified results sort first. The public board exposes only
name, score, level, time and verification status. Name filtering and the atomic global limit of 40 saved
scores per minute still apply. Starting games has a global limit of 30 per minute.

This rejects invented score numbers, impossible input sequences and runs played faster than server time
(with three seconds of timing tolerance). It does **not** prove a human played: a bot can generate valid
inputs at normal speed. The shared limits can be exhausted by abusive callers; these are not a complete
denial-of-service defense. The publishable key is intentionally public and grants no privileged access.

## Checks

Run the leaderboard regression checks with Node.js 22 or later:

```sh
node --experimental-strip-types --test tests/*.test.mjs
```

They cover local saves, unsafe data, deterministic replay, invalid input, token/expiry checks,
ordered pause/resume, response-loss retries and online error handling. `tests/gameplay-database.sql`
tests private permissions, timing, pauses and exactly-once finalization against an isolated PostgreSQL
database with the migrations installed; it rolls back its test rows. The tests use fixtures and do not write to the live leaderboard.
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
to Supabase, timestamped and publicly readable. During online play, arrow inputs are sent to Supabase
to verify gameplay. The server retains derived run state and a hashed run token for up to two hours;
expired rows are deleted in bounded batches when new games start (so deletion can occur later if idle). Volume, mute and the last name typed stay in the player's
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

## Verified gameplay deployment

After the three base SQL scripts above:

1. Apply `supabase/guarded_submit.sql` and `supabase/lock_direct_writes.sql` if upgrading an older installation.
2. Apply `supabase/gameplay_verification.sql`. It preserves existing scores and adds private run storage.
3. Deploy `supabase/functions/gameplay/index.ts` as `gameplay`, with JWT verification disabled
   (`supabase/config.toml`). It uses platform-provided `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
   Never copy the service-role key into browser code. Set `GAME_ORIGIN` to your site's origin for a fork.
4. Set `verificationUrl` in `js/config.js` to `https://<project>.supabase.co/functions/v1/gameplay`.
   Publish the client and verify a complete run, pause/resume and score saving.
5. Apply `supabase/retire_legacy_submit.sql` and deploy the retiring `submit-score` function.
   Confirm old raw-score submissions fail and the new route still works.

`supabase/functions/_shared/gameplay.js` contains versioned rules shared by browser and server.
`js/run-client.js` records ordered batches and retries an identical failed request. Inputs are buffered
up to 4096 events; exceeding that limit prevents saving instead of silently dropping inputs.
A failed online start offers Retry. Clearing both URL and publishable key still enables local play.

For rollback, redeploy the last working verified client/function together. Keep direct writes disabled
and leave the legacy helper revoked; restoring raw-score writes would remove verification. Database
additions are backward compatible, so there is no need to drop tables or discard scores during rollback.
