/*
  PHOTOS is the entire content of the site — artwork, music, and
  writing all live in this one array, newest first. Every entry needs
  a `type`.

  --- Artwork (type: "photo" or "ceramics") ---
  Required:
    type      "photo" for anything image-based (drawings, paintings,
              photographs of pieces), "ceramics" for physical/sculptural
              work — each gets its own tab above the gallery.
    file      path to the image, relative to the site root, e.g.
              "images/art/2020-untitled.jpg"
    title     short caption
    date      "YYYY-MM" or "YYYY-MM-DD"
    size      "lg" | "md" | "sm" — controls the grid module width.
              Mix these so the grid doesn't fall into a flat repeating
              pattern; roughly lg = wide feature, md = standard, sm = compact.
    alt       plain description, for screen readers — not a caption
  Optional:
    location  e.g. "Philadelphia, PA"
    tags      array of short lowercase strings, e.g. ["painting","1990s"].
              Every unique tag across all entries automatically becomes
              a filter chip — no extra setup.
    camera, lens, aperture, shutter, iso, film
              only relevant if the piece was actually photographed with
              camera metadata worth keeping; shown in the lightbox only.

  --- Music (type: "audio") ---
  Required: type, file (e.g. "audio/music/song.mp3"), title, date, size
  Optional: duration (e.g. "3:27" — shown next to the title), tags

  --- Writing (type: "text") ---
  Required: type, date, size, format ("verse" keeps line/stanza breaks,
  "prose" reflows as one justified block), body (a template string —
  use backticks so line breaks are preserved for verse)
  Optional: title, tags

  --- Every type ---
    hidden    true — pulls the entry from the site entirely (every
              section, every tag) without touching the file or
              deleting the entry. Set it back to false (or remove the
              line) to bring it back.

  Example entries (one of each type) — delete these once you're adding
  real ones, they're just here as a copy-paste reference:

    { type: "photo", file: "images/art/2020-untitled.jpg", title: "Untitled",
      date: "2020", size: "md", tags: ["painting"],
      alt: "Describe the piece for screen readers" },

    { type: "audio", file: "audio/music/song.mp3", title: "Song title",
      date: "2020-05", size: "sm", duration: "3:27" },

    { type: "text", date: "2020-05", size: "md", format: "prose",
      title: "Untitled", body: `Body text goes here.` },
*/

const PHOTOS = [
  // Empty for now — add artwork, music, and writing entries here as
  // they're ready. See the field reference and examples above.
];
