# in-memory-of

A memorial site for [Cousin's Name] — his artwork, music, and writing,
kept in one place for family and friends. Built as a static site with
no framework and no build step, based on the same codebase as
[mprendergast.github.io](https://github.com/michaelprendergast/michaelprendergast.github.io).

Presentation is deliberately quiet: a single fixed white/greyscale
theme, no theme switcher, no decorative effects — the content is the
point.

## Architecture

`index.html` is a static shell with empty containers for the filter
bar, gallery, and lightbox. All content lives in `photos.js`, a plain
array of objects assigned to `window.PHOTOS`. `script.js` (and
`beta.js` for the homepage's split layout) read that array on load and
render everything client-side: grid tiles, tag filter chips, the
lightbox, and inline audio playback. There's no templating and no
build step — editing `photos.js` and pushing is the entire publishing
workflow.

Visual design is Swiss/International Typographic Style: an asymmetric
12-column grid, a restrained type system (EB Garamond for display,
IBM Plex Sans for body, a serif for long-form text), and a single
neutral accent used for one deliberate flourish — a bracket frame that
tightens around a tile on hover, styled after a viewfinder. All colors
and fonts are CSS custom properties at the top of `styles.css`, so the
whole palette is one token block, not scattered through selectors.

## Structure

```
index.html      homepage — split fixed-background layout
classic.html    the original full-width grid layout, kept at its own URL
about.html      a short note about the site
obituary.html   the obituary
archive.html    a flat chronological list ("Log") of every entry
styles.css      all styling; design tokens (color, type) at the top
beta.css        styling specific to the homepage's split layout
photos.js       the content manifest — the only file edited routinely
script.js       renders the classic grid + lightbox from photos.js
beta.js         renders the homepage's split layout from photos.js
archive.js      renders the Log page
player.js       the persistent corner audio player
router.js       lightweight client-side navigation between pages
stats.js        the computed count/date-range line in the footer
images/         artwork, organized however makes sense (e.g. images/art/)
audio/          music, e.g. audio/music/
text/           reserved for any text-file assets; written pieces
                themselves live directly in photos.js, not as files here
```

## Adding content

Everything — artwork, music, and writing — is one entry in the
`PHOTOS` array in `photos.js`. Full field reference and copy-paste
examples for each type are in the comment at the top of that file.
Broad strokes:

- **Artwork** (`type: "photo"` for anything image-based, `"ceramics"`
  for physical/sculptural work): resize and compress the image first
  (see below), save it into `images/`, and add an entry pointing at it.
- **Music** (`type: "audio"`): save the file into `audio/music/` and
  add an entry with its `duration`.
- **Writing** (`type: "text"`): no file needed — the text itself is
  the `body` field, written directly in the manifest.

`tags` is optional and free-form on every type — every unique tag used
anywhere automatically becomes a filter chip, so tagging consistently
(`"painting"`, not sometimes `"paintings"`) is the only thing that
matters. Commit and push; GitHub Pages rebuilds automatically, usually
within a minute or two.

## Resizing and compressing images — do this before every commit

A modern phone photo can be 8–20 MB; a browser doesn't need that
resolution, and git doesn't handle large binaries gracefully — every
version of every image ever committed stays in the repo's history
forever, even after it's deleted or replaced.

Target: **keep the original resolution where practical, JPEG quality
~85–90, aiming for 1–1.5 MB per image.** The lightbox has a
click-to-zoom view meant to show real detail, so resolution is the
thing to protect — compress toward the size target with quality
first, and only downscale resolution as a last resort.

With ImageMagick installed, this compresses a whole folder of
originals at once without touching resolution:

```bash
mkdir -p resized
for f in originals/*.jpg; do
  magick "$f" -quality 88 -strip "resized/$(basename "$f")"
done
```

`-strip` drops EXIF/location metadata from the copy. Without
ImageMagick, [squoosh.app](https://squoosh.app) does the same thing in
the browser, one image at a time, with a size-vs-quality slider.

## Publishing on GitHub Pages

Deployed from `main`, root folder, via **Settings → Pages → Build and
deployment → Source → Deploy from a branch**. Since this repo's name
doesn't match the account name, it's served at:

```
https://<your-github-username>.github.io/in-memory-of
```

(rename the repo before or after publishing — GitHub Pages picks up
the new path automatically once the repo is renamed and re-pushed).

Every update is: resize the image (if adding artwork), add its entry
to `photos.js`, commit, push. Deploys typically land within a minute
or two; a hard refresh clears any stale cached copy of the page.

## What still needs filling in

- The cousin's name and dates, in place of every `[Cousin's Name]` /
  `[Cousin's Full Name]` placeholder — in `index.html`, `about.html`,
  `obituary.html`, `archive.html`, and `classic.html`.
- The obituary text itself, in `obituary.html`.
- A short personal note on the About page (`about.html`).
- `favicon.ico` — the original site's favicon wasn't carried over;
  drop a new one in the repo root and it'll pick up automatically.
- A background image for the homepage's split layout, saved to
  `images/bg/background.jpg` — until one's added, that half of the
  homepage just shows the page background.
- Actual artwork, music, and writing in `photos.js` (see "Adding
  content" above).
