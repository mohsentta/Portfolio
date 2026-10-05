# Portfolio — Mohsen Tarassoli

Game-styled portfolio site. Plain HTML / CSS / JS — no build step, no dependencies,
no image files (the pixel art is drawn at runtime as inline SVG).

```
index.html    page content (hero, inventory, game library, quest log, education, contact)
projects/     one page per project, linked from the cards on the index
styles.css    arcade/CRT styling, pixel buttons, 16:9 video boxes, scroll-runner bar
script.js     pixel-art sprite renderer + YouTube thumbnail links + scroll runner
1-4.png       four frames of the running character (see "Scroll runner")
.github/      Pages deployment workflow
```

`Resume.pdf` and `preview.png` are listed in `.gitignore`: they stay on disk but are not
published. An earlier version of the contact section carried a phone number and street
address; both were removed before the first push.

## Scroll runner

A fixed progress bar sits at the bottom of the viewport. The character on it cycles
through its frames while you scroll and returns to frame 1 (the idle pose) once
scrolling stops. Travel is scroll progress, left to right.

Frames live in `data-frames` on `#runner`, so adding, removing or reordering them needs
no code change:

```html
<div class="runbar-runner" id="runner" data-frames="1.png,2.png,3.png,4.png"></div>
```

Tuning knobs at the top of `initRunner()` in `script.js`:

| Constant | Default | Meaning |
|---|---|---|
| `FRAME_MS` | `90` | ms per frame while scrolling |
| `IDLE_MS` | `140` | quiet time before settling back to the idle pose |
| `FLIP_ON_SCROLL_UP` | `true` | mirrors the sprite while scrolling up so he faces his direction of travel |

Bar sizing comes from `--runner-h` (sprite height), `--track-h` (progress track) and
`--label-h` (the readout row above his head) in `:root`; `--runbar-h` adds them up and
drives both the bar height and the page's bottom padding. All four shrink under 760px.

If you make the sprite taller, widen `.runbar-runner` too — the frames are contained by
height, so a box that is too narrow would scale him down instead of up. The widest frame
(309×429) needs about `runner-h × 0.72` px of width.

**Note on the frames:** `1.png` and `3.png` are byte-identical, so the cycle currently
plays pose A, B, A, D — a repeated pose. If that reads as a hitch, either export a
distinct third pose or drop the duplicate:

```html
data-frames="1.png,2.png,4.png"   <!-- 3-frame cycle, no repeat -->
```

`SpriteSheet.png` is not used by the page (the three figures in it are the same poses as
`1/4/2.png`), so it can be deleted if you don't need the source.

## What he says

He talks in a speech bubble that follows him along the bar. Every line is in the
`MESSAGES` object at the top of the runner section in `script.js` — plain text, no markup,
so edit or add freely.

| Trigger | Line |
|---|---|
| on arrival (after 1.5 s) | Scroll down — I'll race you. |
| scrolling fast (repeatable, 3.2 s cooldown) | Wheee! · Wheeee! Faster! · I am speed! · My legs! My beautiful legs! |
| pressing **Ctrl/Cmd+F** | Speedrun strats! |
| an instant jump — find-in-page, an anchor link, Home/End | I am Flash! · Teleportation! · Over here! · Missed me! |
| passing 25% / 50% going down | Warming up. · Halfway. This is my cardio. |
| reaching the bottom (once) | Am I hired? |
| left sitting at the bottom | I can start Monday. |
| first scroll back up after the bottom | Ooh, we missed something… |
| then scrolling down again | Pretty impressive, right? :) |
| back at the very top after a real trip down | Back to the top? Bold choice. |
| idle for ~7 s (repeatable) | You still there? · My legs are fine. Totally fine. · Take your time — I bill by the pixel. · I can do this all day. (I cannot.) |

Lines carry a priority — **3** story beats, **2** one-offs, **1** repeatable chatter — and a
lower-priority line never cuts off a better one. So a fast flick will not interrupt
"Am I hired?", but a milestone will replace "Wheee!".

Milestones are marked as seen even when you scroll past too fast to speak, so they can't
arrive late and out of order. "Too fast" is `speed > 2.2` px/ms (or a single jump over
260 px); the milestone only speaks under `1.4` px/ms.

**The end of the page is measured in pixels, not percent.** `END_PX` (≈220 px, or 30% of
the viewport, whichever is larger) is "arrived at the bottom". A percentage threshold
looked reasonable but missed the usual stopping point: the runner bar's own bottom padding
(81 px) plus the footer (89 px) put the "footer on screen" position at ~98% of the scroll
range, so a `p >= 0.99` check only fired if you scrolled to the very last pixel.

The end lines also **replay on each new arrival** — he re-arms once you have moved
`END_ARM_PX` (≈900 px) back up the page, so arriving again says "Am I hired?" again instead
of only ever once. Small jitter inside the zone does not re-trigger it.

### How Ctrl+F and jumps are detected

The browser's find bar isn't exposed to the page, so Ctrl/Cmd+F is caught as a `keydown`
(capture phase, so it works wherever focus is). That arms a find session for
`FIND_WINDOW` (8 s); any following jump keeps it armed, so stepping through matches with
Enter gives a new line each time.

A jump is measured by **distance, not speed**: `|dy| > 900` px in a single scroll event.
Velocity would miss it, because after you have been typing in the find bar the previous
scroll event can be seconds old. Jumps over 1600 px count even with no Ctrl+F (menu Find,
an anchor link, Home/End) — wheel and trackpad scrolling deliver many small events and
never trip it. A jump also marks the milestones it flew past as seen.

The bubble is `aria-hidden`, since announcing a joke on every scroll would be noise for
screen-reader users.

## Project pages

Each card in the game library opens its own page under `projects/`. The whole card is one
link — an overlay anchor is laid over the card so the entire surface is clickable while
staying a real link (keyboard focusable, right-click → open in new tab):

```html
<article class="card project reveal">
  <a class="project-link" href="projects/mahbanoo.html" aria-label="Open Mahbanoo"></a>
  ...
  <p class="project-cta">VIEW PROJECT <span class="cursor">&#9654;</span></p>
</article>
```

The card carries `data-poster`, which renders the thumbnail only — no link and no play
button — so the card's overlay link stays on top and clicking the video opens the project
page, exactly like the rest of the card. The playable version lives on the project page via
`data-youtube`.

Project pages use one level of nesting, so their asset paths are prefixed (`../styles.css`,
`../script.js`, `../1.png`) and their nav links point back with `../index.html#section`.
Relative URLs inside `styles.css` need no prefix — CSS resolves them against the stylesheet,
not the document.

To add a project: copy any file in `projects/`, change the title, `data-title`, facts,
bullets and chips, then add a matching card to the index with its own `project-link`, and
update the `PREV`/`NEXT` links of its two neighbours.

## Theme

Navy base with flat bright accents, matched to `Mock up.jpg`: deep navy surfaces
(`#14294f` page, `#1c3968` cards), off-white ink, and three accents — green `#85cd69`,
coral `#fb7e44` and amber `#fbb546` — plus a bright blue `#5db2f0` for the live status.
No neon, no glow, no CRT scanline or vignette layers; the arcade character comes from the
pixel typeface, the chunky 2px borders, the hard offset shadows and the runtime pixel
sprites.

Every colour is a token on `:root`; nothing in the stylesheet hardcodes one, so matching a
different mockup means editing that one block.

| Token family | Use |
|---|---|
| `--accent` (green), `--accent-2` (coral), `--accent-3` (amber), `--accent-4` (blue) | bright **text** and borders on navy |
| `--tint`, `--tint-2`, `--tint-4` | deep **fills** that always carry the matching accent as text |
| `--on-accent` | dark text on the bright green fills (tags, buttons, the WATCH badge) |

The accent split exists because the two jobs conflict: a link needs a *bright* green to be
readable on navy, while a chip fill needs to be *deep* so its bright text still reads.
Status chips therefore pair a deep tint with its bright accent rather than a saturated fill.

All 13 text pairs were checked for WCAG AA; the worst case is 5.22:1.

The video panel is the one deliberately darker surface (`--video-bg-*`), because a video
still reads as a screen.

## Preview locally

Any static file server works. From this folder:

```powershell
python -m http.server 8099
```

Then open <http://localhost:8099/>.

While the page is served from localhost, each empty video box shows a small
`add data-poster to embed` hint. That hint is hidden automatically on any
non-local host, so visitors never see it.

## Adding a project video

Each project page has a video box (cards on the index are the same markup with
`data-poster` instead of `data-youtube`):

```html
<figure class="video" data-youtube="" data-title="Mahbanoo — hidden object adventure">
  <div class="video-frame">
    <div class="video-placeholder">…</div>
  </div>
</figure>
```

Put a YouTube ID **or any YouTube URL** in `data-youtube` on a project page and the
thumbnail + pixel play button appear by themselves. All of these work:

```html
data-youtube="dQw4w9WgXcQ"
data-youtube="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
data-youtube="https://youtu.be/dQw4w9WgXcQ"
data-youtube="https://www.youtube.com/embed/dQw4w9WgXcQ"
```

On the index, cards use `data-poster` instead, which is the thumbnail only.

Leave either empty to keep the "TRAILER — COMING SOON" placeholder. `data-title` is used for
the link's accessible name.

The project-page video is a **link out to YouTube**, not an embedded player: `mountThumb()`
in `script.js` builds an `<a href="https://www.youtube.com/watch?v=<id>" target="_blank"
rel="noopener">` around the thumbnail, the pixel play button and a `WATCH ON YOUTUBE` badge.

That is deliberate. An embedded player is refused with *"Sign in to confirm you're not a
bot"* on VPN/proxied connections, and with *error 153* on pages opened from `file://` (a
`file://` page has no origin, so no `Referer` is sent and YouTube rejects the embed). A plain
link has neither problem — it works from disk, over any network, and for signed-out visitors.
Once no video is missing you can delete the
`video-placeholder` div; it is replaced on load anyway.

## Publish with GitHub Pages

Publishing is automated by `.github/workflows/pages.yml`: every push to `main` uploads the
repo root to GitHub Pages. The workflow uses `actions/configure-pages` with
`enablement: true`, which turns Pages on through the API, so there is no manual
**Settings → Pages** step.

```powershell
git add .
git commit -m "Update the site"
git push
```

The site goes live at **<https://mohsentta.github.io/Portfolio/>** about a minute after the
Actions run finishes. Watch it under the repo's **Actions** tab.

If you would rather deploy from a branch instead of Actions, delete the workflow and set
**Settings → Pages → Source = Deploy from a branch**, branch `main`, folder `/ (root)`.

## Notes

- The headings use the Google font **Press Start 2P**; if it can't load, the page falls
  back to a monospace stack. Body copy always uses system fonts, so it stays readable.
- Only the email address and GitHub profile are public. To publish more (a phone number,
  a downloadable résumé), remove the relevant line from `.gitignore` and re-add the
  contact rows in `index.html`.
- The files under `1-4.png` had their Adobe XMP metadata stripped (pixel-identical), so
  they no longer disclose the tooling that produced them.
- Sprites live in `SPRITES` at the top of `script.js` as 8×8 character maps: `.` is
  transparent, other letters index the shared `PALETTE`. Add a new one by drawing an
  8×8 map and using `data-sprite="yourname"` in the HTML.
