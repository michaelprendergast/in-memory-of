(function () {
  "use strict";

  // A small computed line in the footer -- counts and date span, derived
  // straight from the manifest so it never needs hand-updating. Shared
  // by every page that includes it; no-ops if the footer slot isn't
  // there or PHOTOS hasn't loaded.
  const el = document.getElementById("site-stats");
  if (!el) return;

  const allPhotos = typeof PHOTOS !== "undefined" && Array.isArray(PHOTOS) ? PHOTOS : [];
  const items = allPhotos.filter((p) => !p.hidden);

  const LABELS = {
    photo: ["image", "images"],
    photography: ["photograph", "photographs"],
    sculpture: ["sculpture", "sculptures"],
    text: ["text file", "text files"],
    audio: ["audio file", "audio files"],
  };
  const ORDER = ["photo", "photography", "sculpture", "text", "audio"];

  const counts = {};
  items.forEach((p) => {
    const t = p.type || "photo";
    counts[t] = (counts[t] || 0) + 1;
  });

  const counted = ORDER.filter((t) => counts[t] > 0).map((t) => {
    const n = counts[t];
    const [singular, plural] = LABELS[t];
    return n + " " + (n === 1 ? singular : plural);
  });

  const years = items
    .map((p) => /^(\d{4})/.exec(p.date || ""))
    .filter(Boolean)
    .map((m) => parseInt(m[1], 10));

  let text = counted.join(", ");
  if (years.length) {
    const min = Math.min(...years);
    const max = Math.max(...years);
    text += " · " + (min === max ? String(min) : min + "–" + max);
  }

  el.textContent = text;
})();
