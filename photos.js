/*
  PHOTOS is the entire content of the site — artwork, music, and
  writing all live in this one array, newest first. Every entry needs
  a `type`.

  --- Artwork (type: "photo") / Photography (type: "photography") ---
  Same fields either way — "photo" is for the artwork itself (drawings,
  paintings, photographs of pieces), "photography" is for photos he
  took. Each gets its own tab above the gallery.
  Required:
    type      "photo" or "photography" (see above)
    file      path to the image, relative to the site root, e.g.
              "images/art/2020-untitled.jpg"
    title     short caption
    date      "YYYY-MM" or "YYYY-MM-DD"
    alt       plain description, for screen readers — not a caption
  Optional:
    location  e.g. "Philadelphia, PA"
    tags      array of short lowercase strings, e.g. ["painting","1990s"].
              Every unique tag across all entries automatically becomes
              a filter chip — no extra setup.
    camera, lens, aperture, shutter, iso, film
              only relevant if the piece was actually photographed with
              camera metadata worth keeping; shown in the lightbox only.

  --- Bound objects (type: "photo" + a `pages` array) ---
  For something meant to be read as a sequence — a sketchbook, a bound
  journal — rather than browsed as separate photos. One entry still,
  same required fields as any "photo" (file/alt here should be the
  cover), plus:
    pages     ordered array of { file, alt }, cover first. The tile
              shows the cover and opens a dedicated page-turning
              viewer instead of the usual lightbox — click through
              spreads of two pages at a time (one at a time on
              narrow screens), starting from the closed cover.

  --- Music (type: "audio") ---
  Required: type, file (e.g. "audio/music/song.mp3"), title, date
  Optional: duration (e.g. "3:27" — shown next to the title), tags

  --- Writing (type: "text") ---
  Required: type, date, format ("verse" keeps line/stanza breaks,
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
      date: "2020", tags: ["painting"],
      alt: "Describe the piece for screen readers" },

    { type: "audio", file: "audio/music/song.mp3", title: "Song title",
      date: "2020-05", duration: "3:27" },

    { type: "text", date: "2020-05", format: "prose",
      title: "Untitled", body: `Body text goes here.` },
*/

const PHOTOS = [
  { type: "photo", file: "images/bound-art-journal/page-001.jpg", title: "Bound Art Journal",
    tags: ["journal", "sketchbook"],
    alt: "Weathered brown leather journal cover with brass grommets and a knotted leather tie closure",
    pages: [
    { file: "images/bound-art-journal/page-001.jpg", alt: "Cover" },
    { file: "images/bound-art-journal/page-002.jpg", alt: "Page 1" },
    { file: "images/bound-art-journal/page-003.jpg", alt: "Page 2" },
    { file: "images/bound-art-journal/page-004.jpg", alt: "Page 3" },
    { file: "images/bound-art-journal/page-005.jpg", alt: "Page 4" },
    { file: "images/bound-art-journal/page-006.jpg", alt: "Page 5" },
    { file: "images/bound-art-journal/page-007.jpg", alt: "Page 6" },
    { file: "images/bound-art-journal/page-008.jpg", alt: "Page 7" },
    { file: "images/bound-art-journal/page-009.jpg", alt: "Page 8" },
    { file: "images/bound-art-journal/page-010.jpg", alt: "Page 9" },
    { file: "images/bound-art-journal/page-011.jpg", alt: "Page 10" },
    { file: "images/bound-art-journal/page-012.jpg", alt: "Page 11" },
    { file: "images/bound-art-journal/page-013.jpg", alt: "Page 12" },
    { file: "images/bound-art-journal/page-014.jpg", alt: "Page 13" },
    { file: "images/bound-art-journal/page-015.jpg", alt: "Page 14" },
    { file: "images/bound-art-journal/page-016.jpg", alt: "Page 15" },
    { file: "images/bound-art-journal/page-017.jpg", alt: "Page 16" },
    { file: "images/bound-art-journal/page-018.jpg", alt: "Page 17" },
    { file: "images/bound-art-journal/page-019.jpg", alt: "Page 18" },
    { file: "images/bound-art-journal/page-020.jpg", alt: "Page 19" },
    { file: "images/bound-art-journal/page-021.jpg", alt: "Page 20" },
    { file: "images/bound-art-journal/page-022.jpg", alt: "Page 21" },
    { file: "images/bound-art-journal/page-023.jpg", alt: "Page 22" },
    { file: "images/bound-art-journal/page-024.jpg", alt: "Page 23" },
    { file: "images/bound-art-journal/page-025.jpg", alt: "Page 24" },
    { file: "images/bound-art-journal/page-026.jpg", alt: "Page 25" },
    { file: "images/bound-art-journal/page-027.jpg", alt: "Page 26" },
    { file: "images/bound-art-journal/page-028.jpg", alt: "Page 27" },
    { file: "images/bound-art-journal/page-029.jpg", alt: "Page 28" },
    { file: "images/bound-art-journal/page-030.jpg", alt: "Page 29" },
    { file: "images/bound-art-journal/page-031.jpg", alt: "Page 30" },
    { file: "images/bound-art-journal/page-032.jpg", alt: "Page 31" },
    { file: "images/bound-art-journal/page-033.jpg", alt: "Page 32" },
    { file: "images/bound-art-journal/page-034.jpg", alt: "Page 33" },
    { file: "images/bound-art-journal/page-035.jpg", alt: "Page 34" },
    { file: "images/bound-art-journal/page-036.jpg", alt: "Page 35" },
    { file: "images/bound-art-journal/page-037.jpg", alt: "Page 36" },
    { file: "images/bound-art-journal/page-038.jpg", alt: "Page 37" },
    { file: "images/bound-art-journal/page-039.jpg", alt: "Page 38" },
    { file: "images/bound-art-journal/page-040.jpg", alt: "Page 39" },
    { file: "images/bound-art-journal/page-041.jpg", alt: "Page 40" },
    { file: "images/bound-art-journal/page-042.jpg", alt: "Page 41" },
    { file: "images/bound-art-journal/page-043.jpg", alt: "Page 42" },
    { file: "images/bound-art-journal/page-044.jpg", alt: "Page 43" },
    { file: "images/bound-art-journal/page-045.jpg", alt: "Page 44" },
    { file: "images/bound-art-journal/page-046.jpg", alt: "Page 45" },
    { file: "images/bound-art-journal/page-047.jpg", alt: "Page 46" },
    { file: "images/bound-art-journal/page-048.jpg", alt: "Page 47" },
    { file: "images/bound-art-journal/page-049.jpg", alt: "Page 48" },
    { file: "images/bound-art-journal/page-050.jpg", alt: "Page 49" },
    { file: "images/bound-art-journal/page-051.jpg", alt: "Page 50" },
    { file: "images/bound-art-journal/page-052.jpg", alt: "Page 51" },
    { file: "images/bound-art-journal/page-053.jpg", alt: "Page 52" },
    { file: "images/bound-art-journal/page-054.jpg", alt: "Page 53" },
    { file: "images/bound-art-journal/page-055.jpg", alt: "Page 54" },
    { file: "images/bound-art-journal/page-056.jpg", alt: "Page 55" },
    { file: "images/bound-art-journal/page-057.jpg", alt: "Page 56" },
    { file: "images/bound-art-journal/page-058.jpg", alt: "Page 57" },
    { file: "images/bound-art-journal/page-059.jpg", alt: "Page 58" },
    { file: "images/bound-art-journal/page-060.jpg", alt: "Page 59" },
    { file: "images/bound-art-journal/page-061.jpg", alt: "Page 60" },
    { file: "images/bound-art-journal/page-062.jpg", alt: "Page 61" },
    { file: "images/bound-art-journal/page-063.jpg", alt: "Page 62" },
    { file: "images/bound-art-journal/page-064.jpg", alt: "Page 63" },
    { file: "images/bound-art-journal/page-065.jpg", alt: "Page 64" },
    { file: "images/bound-art-journal/page-066.jpg", alt: "Page 65" },
    { file: "images/bound-art-journal/page-067.jpg", alt: "Page 66" },
    { file: "images/bound-art-journal/page-068.jpg", alt: "Page 67" },
    { file: "images/bound-art-journal/page-069.jpg", alt: "Page 68" },
    { file: "images/bound-art-journal/page-070.jpg", alt: "Page 69" },
    { file: "images/bound-art-journal/page-071.jpg", alt: "Page 70" },
    { file: "images/bound-art-journal/page-072.jpg", alt: "Page 71" },
    { file: "images/bound-art-journal/page-073.jpg", alt: "Page 72" },
    { file: "images/bound-art-journal/page-074.jpg", alt: "Page 73" },
    { file: "images/bound-art-journal/page-075.jpg", alt: "Page 74" },
    { file: "images/bound-art-journal/page-076.jpg", alt: "Page 75" },
    { file: "images/bound-art-journal/page-077.jpg", alt: "Page 76" },
    { file: "images/bound-art-journal/page-078.jpg", alt: "Page 77" },
    { file: "images/bound-art-journal/page-079.jpg", alt: "Page 78" },
    { file: "images/bound-art-journal/page-080.jpg", alt: "Page 79" },
    { file: "images/bound-art-journal/page-081.jpg", alt: "Page 80" },
    { file: "images/bound-art-journal/page-082.jpg", alt: "Page 81" },
    { file: "images/bound-art-journal/page-083.jpg", alt: "Page 82" },
    { file: "images/bound-art-journal/page-084.jpg", alt: "Page 83" },
    { file: "images/bound-art-journal/page-085.jpg", alt: "Page 84" },
    { file: "images/bound-art-journal/page-086.jpg", alt: "Page 85" },
    { file: "images/bound-art-journal/page-087.jpg", alt: "Page 86" },
    { file: "images/bound-art-journal/page-088.jpg", alt: "Page 87" },
    { file: "images/bound-art-journal/page-089.jpg", alt: "Page 88" },
    { file: "images/bound-art-journal/page-090.jpg", alt: "Page 89" },
    { file: "images/bound-art-journal/page-091.jpg", alt: "Page 90" },
    { file: "images/bound-art-journal/page-092.jpg", alt: "Page 91" },
    { file: "images/bound-art-journal/page-093.jpg", alt: "Page 92" },
    { file: "images/bound-art-journal/page-094.jpg", alt: "Page 93" },
    { file: "images/bound-art-journal/page-095.jpg", alt: "Page 94" },
    { file: "images/bound-art-journal/page-096.jpg", alt: "Page 95" },
    { file: "images/bound-art-journal/page-097.jpg", alt: "Page 96" },
    { file: "images/bound-art-journal/page-098.jpg", alt: "Page 97" },
    { file: "images/bound-art-journal/page-099.jpg", alt: "Page 98" },
    { file: "images/bound-art-journal/page-100.jpg", alt: "Page 99" },
    { file: "images/bound-art-journal/page-101.jpg", alt: "Page 100" },
    { file: "images/bound-art-journal/page-102.jpg", alt: "Page 101" },
    { file: "images/bound-art-journal/page-103.jpg", alt: "Page 102" },
    { file: "images/bound-art-journal/page-104.jpg", alt: "Page 103" },
    { file: "images/bound-art-journal/page-105.jpg", alt: "Page 104" },
    { file: "images/bound-art-journal/page-106.jpg", alt: "Page 105" },
    { file: "images/bound-art-journal/page-107.jpg", alt: "Page 106" },
    { file: "images/bound-art-journal/page-108.jpg", alt: "Page 107" },
    { file: "images/bound-art-journal/page-109.jpg", alt: "Page 108" },
    { file: "images/bound-art-journal/page-110.jpg", alt: "Page 109" },
    { file: "images/bound-art-journal/page-111.jpg", alt: "Page 110" },
    { file: "images/bound-art-journal/page-112.jpg", alt: "Page 111" },
    { file: "images/bound-art-journal/page-113.jpg", alt: "Page 112" },
    { file: "images/bound-art-journal/page-114.jpg", alt: "Page 113" },
    { file: "images/bound-art-journal/page-115.jpg", alt: "Page 114" },
    { file: "images/bound-art-journal/page-116.jpg", alt: "Page 115" },
    { file: "images/bound-art-journal/page-117.jpg", alt: "Page 116" },
    { file: "images/bound-art-journal/page-118.jpg", alt: "Page 117" },
    { file: "images/bound-art-journal/page-119.jpg", alt: "Page 118" },
    { file: "images/bound-art-journal/page-120.jpg", alt: "Page 119" },
    { file: "images/bound-art-journal/page-121.jpg", alt: "Page 120" },
    { file: "images/bound-art-journal/page-122.jpg", alt: "Page 121" },
    { file: "images/bound-art-journal/page-123.jpg", alt: "Page 122" },
    { file: "images/bound-art-journal/page-124.jpg", alt: "Page 123" },
    { file: "images/bound-art-journal/page-125.jpg", alt: "Page 124" },
    ] },
];
