(function () {
  "use strict";

  // A dedicated page-turning viewer for "bound object" entries -- a
  // photo-type item with a `pages` array (see photos.js's field
  // reference). Built once and appended to <body>, same pattern as
  // player.js's widget, so it survives router.js's PJAX page swaps
  // untouched rather than needing re-initialization on every
  // navigation. window.SiteBook.open(item) is the only entry point;
  // script.js calls it in place of its normal lightbox handling
  // whenever an item has pages.

  const overlay = document.createElement("div");
  overlay.id = "book-viewer";
  overlay.className = "book-viewer";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Bound journal viewer");
  overlay.setAttribute("aria-hidden", "true");
  overlay.hidden = true;
  overlay.innerHTML =
    '<button class="book-close" type="button" aria-label="Close">&#10005;</button>' +
    '<button class="book-nav book-prev" type="button" aria-label="Previous page">&#8592;</button>' +
    '<div class="book-stage">' +
    '<button class="book-cover" type="button" aria-label="Open journal"><img class="book-cover-img" src="" alt=""></button>' +
    '<div class="book-spread" hidden>' +
    '<img class="book-page book-page-left" src="" alt="">' +
    '<img class="book-page book-page-right" src="" alt="">' +
    "</div>" +
    "</div>" +
    '<button class="book-nav book-next" type="button" aria-label="Next page">&#8594;</button>' +
    '<p class="book-progress" aria-live="polite"></p>';
  document.body.appendChild(overlay);

  const stage = overlay.querySelector(".book-stage");
  const coverBtn = overlay.querySelector(".book-cover");
  const coverImg = overlay.querySelector(".book-cover-img");
  const spread = overlay.querySelector(".book-spread");
  const pageLeft = overlay.querySelector(".book-page-left");
  const pageRight = overlay.querySelector(".book-page-right");
  const closeBtn = overlay.querySelector(".book-close");
  const prevBtn = overlay.querySelector(".book-prev");
  const nextBtn = overlay.querySelector(".book-next");
  const progress = overlay.querySelector(".book-progress");

  const MOBILE_QUERY = window.matchMedia("(max-width: 720px)");

  let item = null;
  let pos = 0; // 0 = closed cover; otherwise the page number shown first
  let lastFocused = null;
  let touchStartX = null;

  function pagesOf(it) {
    return it && Array.isArray(it.pages) ? it.pages : [];
  }

  function canStepForward() {
    const pages = pagesOf(item);
    if (pos === 0) return pages.length > 1;
    return pos < pages.length - 1;
  }
  function canStepBackward() {
    return pos > 0;
  }

  function render() {
    const pages = pagesOf(item);
    const isCover = pos === 0;
    coverBtn.hidden = !isCover;
    spread.hidden = isCover;

    if (isCover) {
      const cover = pages[0];
      coverImg.src = cover ? cover.file : "";
      coverImg.alt = cover ? cover.alt || "" : "";
      progress.textContent = (item && item.title) || "";
    } else {
      const mobile = MOBILE_QUERY.matches;
      const left = pages[pos];
      const right = !mobile ? pages[pos + 1] : null;

      pageLeft.src = left ? left.file : "";
      pageLeft.alt = left ? left.alt || "" : "";
      pageRight.hidden = !right;
      pageRight.src = right ? right.file : "";
      pageRight.alt = right ? right.alt || "" : "";

      const total = pages.length - 1;
      progress.textContent = right
        ? "Pages " + pos + "–" + (pos + 1) + " of " + total
        : "Page " + pos + " of " + total;
    }

    prevBtn.disabled = !canStepBackward();
    nextBtn.disabled = !canStepForward();
  }

  function stepForward() {
    if (!canStepForward()) return;
    const pages = pagesOf(item);
    if (pos === 0) {
      pos = 1;
    } else {
      const inc = MOBILE_QUERY.matches ? 1 : 2;
      pos = Math.min(pos + inc, pages.length - 1);
    }
    render();
  }

  function stepBackward() {
    if (!canStepBackward()) return;
    if (pos <= 1) {
      pos = 0;
    } else {
      const dec = MOBILE_QUERY.matches ? 1 : 2;
      pos = Math.max(pos - dec, 1);
    }
    render();
  }

  function open(it) {
    if (!pagesOf(it).length) return;
    item = it;
    pos = 0;
    lastFocused = document.activeElement;
    render();
    overlay.hidden = false;
    overlay.setAttribute("aria-hidden", "false");
    document.addEventListener("keydown", onKeydown);
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
    if (e.key === "ArrowRight") stepForward();
    if (e.key === "ArrowLeft") stepBackward();
  }

  coverBtn.addEventListener("click", stepForward);
  closeBtn.addEventListener("click", close);
  prevBtn.addEventListener("click", stepBackward);
  nextBtn.addEventListener("click", stepForward);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  overlay.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.changedTouches[0].clientX;
    },
    { passive: true }
  );
  overlay.addEventListener(
    "touchend",
    (e) => {
      if (touchStartX === null) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 50) {
        if (dx > 0) stepBackward();
        else stepForward();
      }
      touchStartX = null;
    },
    { passive: true }
  );

  // Re-render on a mobile/desktop breakpoint crossing so a spread mid-
  // book doesn't get stuck showing a hidden second page, or vice versa.
  MOBILE_QUERY.addEventListener("change", () => {
    if (!overlay.hidden) render();
  });

  window.SiteBook = { open: open };
})();
