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

  // A second overlay, layered on top of the roll viewer, for zooming
  // into a single tapped frame -- reuses the main gallery lightbox's
  // own .lightbox/.lightbox-figure classes (styles.css) for the same
  // tap-to-zoom-to-native-resolution behavior, rather than trying to
  // make an individual frame zoomable in place inside the strip: that
  // strip already owns horizontal touch-scrolling for paging between
  // frames, and nesting a second, pannable zoomed scroll area inside a
  // horizontally-scrolling one is exactly the kind of touch-gesture
  // ambiguity that's simplest to just not create.
  const frameLightbox = document.createElement("div");
  frameLightbox.id = "roll-frame-lightbox";
  frameLightbox.className = "lightbox";
  frameLightbox.setAttribute("role", "dialog");
  frameLightbox.setAttribute("aria-modal", "true");
  frameLightbox.setAttribute("aria-label", "Frame view");
  frameLightbox.setAttribute("aria-hidden", "true");
  frameLightbox.innerHTML =
    '<button class="lightbox-close" type="button" aria-label="Close">&#10005;</button>' +
    '<button class="lightbox-nav lightbox-prev" type="button" aria-label="Previous frame">&#8592;</button>' +
    '<button class="lightbox-nav lightbox-next" type="button" aria-label="Next frame">&#8594;</button>' +
    '<figure class="lightbox-figure"><img src="" alt=""></figure>';
  document.body.appendChild(frameLightbox);

  const frameLightboxImg = frameLightbox.querySelector("img");
  const frameLightboxFigure = frameLightbox.querySelector(".lightbox-figure");
  const frameLightboxClose = frameLightbox.querySelector(".lightbox-close");
  const frameLightboxPrev = frameLightbox.querySelector(".lightbox-prev");
  const frameLightboxNext = frameLightbox.querySelector(".lightbox-next");
  let frameZoomed = false;
  let frameIndex = 0;

  // Shows a given frame index inside the already-open lightbox --
  // wraps around at the ends and always resets zoom, same as the main
  // gallery lightbox's own step(), so moving to a new frame doesn't
  // require closing and reopening just to look at the next one.
  function showFrameAt(i) {
    const frames = framesOf(item);
    if (!frames.length) return;
    frameIndex = ((i % frames.length) + frames.length) % frames.length;
    const f = frames[frameIndex];
    frameLightboxImg.src = f.file;
    frameLightboxImg.alt = f.alt || "";
    frameZoomed = false;
    frameLightboxFigure.classList.remove("is-zoomed");
  }
  function openFrameLightbox(i) {
    showFrameAt(i);
    frameLightbox.classList.add("is-open");
    frameLightbox.setAttribute("aria-hidden", "false");
  }
  function closeFrameLightbox() {
    if (!frameLightbox.classList.contains("is-open")) return;
    frameLightbox.classList.remove("is-open");
    frameLightbox.setAttribute("aria-hidden", "true");
    // Keep the strip in sync with whatever frame was last viewed
    // up close, in case the visitor paged around a lot before closing.
    scrollToIndex(frameIndex);
    updateProgress();
  }
  function stepFrame(delta) {
    showFrameAt(frameIndex + delta);
  }
  frameLightboxImg.addEventListener("click", () => {
    frameZoomed = !frameZoomed;
    frameLightboxFigure.classList.toggle("is-zoomed", frameZoomed);
  });
  frameLightboxClose.addEventListener("click", closeFrameLightbox);
  frameLightboxPrev.addEventListener("click", () => stepFrame(-1));
  frameLightboxNext.addEventListener("click", () => stepFrame(1));
  frameLightbox.addEventListener("click", (e) => {
    if (e.target === frameLightbox) closeFrameLightbox();
  });

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
      img.addEventListener("click", () => openFrameLightbox(i));
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
    overlay.hidden = false;
    overlay.setAttribute("aria-hidden", "false");
    // scrollTo(..., { behavior: "instant" }) rather than a plain
    // scrollLeft assignment -- a plain assignment doesn't interrupt an
    // in-flight smooth-scroll animation from step()/scrollToIndex(),
    // so closing mid-animation and opening a new roll could otherwise
    // leave the old animation still running on this same strip
    // element, landing on the same pixel offset (i.e. the same frame
    // index, since every strip uses the same frame width) in the roll
    // that just opened.
    strip.scrollTo({ left: 0, behavior: "instant" });
    document.addEventListener("keydown", onKeydown);
    updateProgress();
    closeBtn.focus();
  }

  function close() {
    if (overlay.hidden) return;
    closeFrameLightbox();
    // Cancel any in-flight smooth-scroll animation from step() so it
    // doesn't keep running in the background while the overlay is
    // hidden (see the comment in open() for why that matters).
    strip.scrollTo({ left: strip.scrollLeft, behavior: "instant" });
    overlay.hidden = true;
    overlay.setAttribute("aria-hidden", "true");
    document.removeEventListener("keydown", onKeydown);
    item = null;
    if (lastFocused) lastFocused.focus();
  }

  function onKeydown(e) {
    if (e.key === "Escape") {
      if (frameLightbox.classList.contains("is-open")) closeFrameLightbox();
      else close();
      return;
    }
    // Arrow keys page between frames -- within the frame lightbox
    // itself when it's open (so a closer look doesn't require
    // closing and reopening for each frame), or the strip otherwise.
    if (frameLightbox.classList.contains("is-open")) {
      if (e.key === "ArrowRight") stepFrame(1);
      if (e.key === "ArrowLeft") stepFrame(-1);
      return;
    }
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
