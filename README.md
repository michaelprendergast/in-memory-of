# in-memory-of

A memorial site for Zakk Ziegler — his artwork, music, and writing,
kept in one place for family and friends. Built as a static site with
no framework and no build step, based on the same codebase as
[mprendergast.github.io](https://github.com/michaelprendergast/michaelprendergast.github.io).

Presentation is deliberately quiet: a single fixed white/greyscale
theme, no theme switcher, no decorative effects — the content is the
point.

## Architecture

`index.html` is a static shell: a hero (name, dates, a one-line
summary), then empty containers for the filter bar, gallery, and
lightbox. All content lives in `photos.js`, a plain array of objects
assigned to `window.PHOTOS`. `script.js` reads that array on load and
renders everything client-side: grid tiles, tag filter chips, the
lightbox, and inline audio playback. There's no templating and no
build step — editing `photos.js` and pushing is the entire publishing
workflow.

There used to be two parallel homepage layouts here, inherited from
the personal-site template this was built from: a fixed-background
split view, and a plain grid kept at `classic.html`. Both are gone —
just one hero-led page now, since a filter-driven split view is more
of a curator's tool than an onramp for family visiting the site.
Typography is Playfair Display for headings (the hero name, the
obituary heading, archive years) and Inter for everything else,
including body text — deliberately not the Garamond/Plex/Baskerville
mix the personal site uses, so the two don't read as the same site in
different colors. The gallery grid is uniform-tile now too, not the
personal site's asymmetric lg/md/sm masonry — easier to scan at a
glance. All colors and fonts are CSS custom properties at the top of
`styles.css`.

## Structure

```
index.html      the whole site's homepage — hero, then the gallery
about.html      a short note about the site
obituary.html   the obituary
archive.html    a flat chronological list ("Log") of every entry
styles.css      all styling; design tokens (color, type) at the top
photos.js       the content manifest — the only file edited routinely
script.js       renders the hero page + Log from photos.js
archive.js      renders the Log page
book.js         the page-turning viewer for "bound object" entries
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
- **Bound objects** (a sketchbook, a journal — meant to be read as a
  sequence rather than browsed as separate photos): still one `photo`
  entry, plus a `pages` array (cover first). Renders as a single tile
  that opens a page-turning viewer (`book.js`) instead of the usual
  lightbox. See `images/bound-art-journal/` for a worked example, and
  `originals/` below for how its 125 source photos were handled.

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

For a large batch (a whole photographed journal or sketchbook, say),
the target is lower — closer to 300–600 KB each — since it's many
secondary pages rather than a handful of headline pieces. Keep the raw
originals somewhere under `originals/` (gitignored, never committed)
and only commit the compressed copies into `images/`; that's how
`images/bound-art-journal/` was built from its 125 source photos.

## Publishing on GitHub Pages

Deployed from `main`, root folder, via **Settings → Pages → Build and
deployment → Source → Deploy from a branch**. The repo is public
(required for GitHub Pages on the free plan) and served at the custom
domain **zakkziegler.com**, set via the `CNAME` file in the repo root
plus DNS records at the registrar (Namecheap): four `A` records for
the bare domain pointed at GitHub's IPs, and a `CNAME` record for
`www`. GitHub auto-issues the HTTPS certificate once DNS resolves.

Every update is: resize the image (if adding artwork), add its entry
to `photos.js`, commit, push. Deploys typically land within a minute
or two; a hard refresh clears any stale cached copy of the page.

## What still needs filling in

- A short personal note on the About page (`about.html`) — the name
  and obituary text are already in place, but the "who's keeping this
  site" paragraph is still a placeholder.
- The bracketed `[rec center?]` in the obituary (`obituary.html`) —
  left as-is from the draft rather than guessing at the name.
- `favicon.ico` — the original site's favicon wasn't carried over;
  drop a new one in the repo root and it'll pick up automatically.
- Actual artwork, music, and writing in `photos.js` (see "Adding
  content" above).
