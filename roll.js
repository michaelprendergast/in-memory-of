(function () {
  "use strict";

  // A dedicated horizontal filmstrip viewer for "film roll" entries -- a
  // photography-type item with an ordered `frames` array (see
  // photos.js's field reference). Built once and appended to <body>,
  // same pattern as book.js/player.js, so it survives router.js's PJAX
  // page swaps untouched. window.SiteRoll.open(item) is the only entry
  // point; script.js calls it in place of its normal lightbox handling
  // whenever an item has frames.
  //
  // Unlike book.js, navigation rides on the browser's own horizontal
  // scrolling (with scroll-snap) rather than custom touch tracking --
  // a strip of frames is just a scrollable row, so swipe/trackpad/
  // scrollbar all work for free. The prev/next buttons and arrow keys
  // just scroll the stage by one frame.

  const overlay = document.createElement("div");
  overlay.id = "roll-viewer";
  overlay.className = "roll-viewer";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Film roll viewer");
  overlay.setAttribute("aria-hidden", "true");
  overlay.hidden = true;
  overlay.innerHTML =
    '<button class="roll-close" type="button" aria-label="Close">&#10005;</button>' +
    '<div class="roll-header">' +
    '<p class="roll-title"></p>' +
    '<p class="roll-meta"></p>' +
    "</div>" +
    '<div class="roll-stage">' +
    '<button class="roll-nav roll-prev" type="button" aria-label="Previous frame">&#8592;</button>' +
    '<div class="roll-strip"></div>' +
    '<button class="roll-nav roll-next" type="button" aria-label="Next frame">&#8594;</button>' +
    "</div>" +
    '<p class="roll-progress" aria-live="polite"></p>';
  document.body.appendChild(overlay);

  const titleEl = overlay.querySelector(".roll-title");
  const metaEl = overlay.querySelector(".roll-meta");
  const strip = overlay.querySelector(".roll-strip");
  const closeBtn = overlay.querySelector(".roll-close");
  const prevBtn = overlay.querySelector(".roll-prev");
  const nextBtn = overlay.querySelector(".roll-next");
  const progress = overlay.querySelector(".roll-progress");

  let item = null;
  let lastFocused = null;
  let scrollTimer = null;

  function framesOf(it) {
    return it && Array.isArray(it.frames) ? it.frames : [];
  }

  function currentIndex() {
    const frames = strip.children;
    if (!frames.length) return 0;
    const target = strip.scrollLeft;
    let closest = 0;
    let closestDist = Infinity;
    for (let i = 0; i < frames.length; i++) {
      const dist = Math.abs(frames[i].offsetLeft - target);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    }
    return closest;
  }

  function updateProgress() {
    const frames = framesOf(item);
    const i = currentIndex();
    progress.textContent = "Frame " + (i + 1) + " of " + frames.length;
    prevBtn.disabled = i <= 0;
    nextBtn.disabled = i >= frames.length - 1;
  }

  function scrollToIndex(i) {
    const el = strip.children[i];
    if (el) el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }

  function step(delta) {
    const frames = framesOf(item);
    const next = Math.min(Math.max(currentIndex() + delta, 0), frames.length - 1);
    scrollToIndex(next);
  }

  function buildStrip(frames) {
    strip.innerHTML = "";
    frames.forEach((f, i) => {
      const wrap = document.createElement("div");
      wrap.className = "roll-strip-item";
      const img = document.createElement("img");
      img.src = f.file;
      img.alt = f.alt || "";
      img.loading = i === 0 ? "eager" : "lazy";
      wrap.appendChild(img);
      strip.appendChild(wrap);
    });
  }

  function open(it) {
    const frames = framesOf(it);
    if (!frames.length) return;
    item = it;
    lastFocused = document.activeElement;
    buildStrip(frames);
    titleEl.textContent = item.title || "Untitled roll";
    metaEl.textContent = [item.date, item.film, item.note].filter(Boolean).join(" · ");
    strip.scrollLeft = 0;
    overlay.hidden = false;
    overlay.setAttribute("aria-hidden", "false");
    document.addEventListener("keydown", onKeydown);
    updateProgress();
    closeBtn.focus();
  }

  function close() {
    if (overlay.hidden) return;
    overlay.hidden = true;
    overlay.setAttribute("aria-hidden", "true");
    document.removeEventListener("keydown", onKeydown);
    item = null;
    if (lastFocused) lastFocused.focus();
  }

  function onKeydown(e) {
    if (e.key === "Escape") close();
    if (e.key === "ArrowRight") step(1);
    if (e.key === "ArrowLeft") step(-1);
  }

  closeBtn.addEventListener("click", close);
  prevBtn.addEventListener("click", () => step(-1));
  nextBtn.addEventListener("click", () => step(1));
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  // Scroll-snap lands the strip on a frame after native swipe/trackpad/
  // scrollbar scrolling -- debounce so the progress readout and
  // prev/next disabled state update once the gesture settles, rather
  // than on every intermediate scroll tick.
  strip.addEventListener(
    "scroll",
    () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(updateProgress, 100);
    },
    { passive: true }
  );

  window.SiteRoll = { open: open };
})();
