function initIndexPage() {
  "use strict";

  const gallery = document.getElementById("gallery");
  const emptyState = document.getElementById("empty-state");
  const typeNav = document.getElementById("type-nav");
  const locationNav = document.getElementById("location-nav");
  const filtersNav = document.getElementById("filters");
  const searchInput = document.getElementById("search-input");
  const shuffleBtn = document.getElementById("shuffle-btn");

  // Fixed top-level sections, shown in this order regardless of which
  // ones have entries yet — sections with nothing in them just show
  // the existing empty state rather than being hidden from the nav.
  // "All" is last and never the default — the site opens on Artwork.
  const TYPES = ["photo", "text", "audio", "photography", "all"];
  const TYPE_LABELS = { all: "All", photo: "Artwork", text: "Text", audio: "Audio", photography: "Photography" };
  const DEFAULT_TYPE = "photo";

  const lightbox = document.getElementById("lightbox");
  const lightboxFigure = document.querySelector(".lightbox-figure");
  const lightboxImage = document.getElementById("lightbox-image");
  const lightboxText = document.getElementById("lightbox-text");
  const lightboxTextBody = document.getElementById("lightbox-text-body");
  const plainTextToggle = document.getElementById("plain-text-toggle");
  const lightboxIndex = document.getElementById("lightbox-index");
  const lightboxTitle = document.getElementById("lightbox-title");
  const lightboxMeta = document.getElementById("lightbox-meta");
  const lightboxSpecs = document.getElementById("lightbox-specs");
  const closeBtn = document.getElementById("lightbox-close");
  const prevBtn = document.getElementById("lightbox-prev");
  const nextBtn = document.getElementById("lightbox-next");
  const copyLinkBtn = document.getElementById("lightbox-copy-link");

  const allPhotos = (typeof PHOTOS !== "undefined" && Array.isArray(PHOTOS) ? PHOTOS : []).filter(
    (p) => !p.hidden
  );
  let activeType = DEFAULT_TYPE;
  let activeLocation = "all";
  let activeTag = "all";
  let filtersExpanded = false;
  let searchQuery = "";
  let visiblePhotos = [];
  let currentIndex = 0;
  let lastFocused = null;
  let touchStartX = null;
  let isZoomed = false;
  let isPlainText = false;

  function itemType(p) {
    return p.type || "photo";
  }

  // A "bound object" -- a photo-type entry with an ordered `pages`
  // array (see photos.js's field reference) -- opens book.js's
  // dedicated page-turning viewer instead of the normal lightbox.
  function isBookItem(p) {
    return Array.isArray(p.pages) && p.pages.length > 0;
  }

  // Verse: literal line breaks + blank-line stanza breaks, no special
  // per-poem indentation or effects. Prose: a single justified block,
  // reflowing normally. This is a deliberately simplified, consistent
  // template rather than a faithful per-poem replica of the source PDF.
  function renderTextBody(item, plain) {
    lightboxTextBody.innerHTML = "";
    lightboxTextBody.className = "lightbox-text-body" + (plain ? " is-plain" : "");
    if (!plain && item.title) {
      const heading = document.createElement("p");
      heading.className = "text-title";
      heading.textContent = item.title;
      lightboxTextBody.appendChild(heading);
    }
    const body = item.body || "";
    const stanzas = body.split(/\n\s*\n/);
    stanzas.forEach((stanza) => {
      const p = document.createElement("p");
      if (!plain && item.format === "prose") {
        p.className = "text-prose";
        p.textContent = stanza.replace(/\n/g, " ").trim();
      } else {
        p.className = "text-verse";
        stanza.split("\n").forEach((line, i) => {
          if (i > 0) p.appendChild(document.createElement("br"));
          p.appendChild(document.createTextNode(line));
        });
      }
      lightboxTextBody.appendChild(p);
    });
  }

  function itemsOfActiveType() {
    let items = activeType === "all" ? allPhotos.slice() : allPhotos.filter((p) => itemType(p) === activeType);
    if (activeType === "photo" && activeLocation !== "all") {
      items = items.filter((p) => placeGroup(p) === activeLocation);
    }
    return items;
  }

  // Groups the free-text `location` field into a coarser place for the
  // Photography section's location nav. Most locations map to
  // themselves; multi-city countries (Spain currently has entries
  // tagged with the bare country and three different city names) merge
  // into one bucket so the location nav reads as one trip, not four.
  function placeGroup(photo) {
    const loc = photo.location || "";
    if (/spain/i.test(loc)) return "Spain";
    return loc || "Unspecified";
  }

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  // Search spans every type/location/tag at once — it's a separate mode
  // from the section nav, not a further narrowing of it.
  function matchesSearch(photo, query) {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const haystack = [
      photo.title,
      photo.location,
      photo.date,
      photo.body,
      Array.isArray(photo.tags) ? photo.tags.join(" ") : "",
    ]
      .filter(Boolean)
      .join(" · ")
      .toLowerCase();
    return haystack.includes(q);
  }

  const VOLUME_KEY = "photo-site-audio-volume";
  function getStoredVolume() {
    const v = parseFloat(localStorage.getItem(VOLUME_KEY));
    return isFinite(v) && v >= 0 && v <= 1 ? v : 0.8;
  }

  // Audio plays inline within its own grid tile rather than opening the
  // lightbox — there's nothing to navigate prev/next between, so the
  // modal doesn't apply. The tile itself holds no playback state; it's
  // a thin control surface over window.SitePlayer (player.js), which
  // owns the one persistent <audio> element and keeps playing across
  // page navigation. player.js mirrors its state back onto whichever
  // tile matches the current track, looked up fresh by data-file each
  // time rather than a kept reference.
  function buildAudioTile(photo, indexTag) {
    const container = document.createElement("div");
    container.className = "tile-audio";
    container.dataset.file = photo.file;

    const toggle = document.createElement("button");
    toggle.className = "tile-audio-toggle";
    toggle.type = "button";
    toggle.setAttribute("aria-label", "Play " + (photo.title || "track"));

    const mark = document.createElement("span");
    mark.className = "tile-audio-mark";
    mark.textContent = "▸";
    const previewTitle = document.createElement("span");
    previewTitle.className = "tile-audio-title";
    previewTitle.textContent = photo.title || "Untitled";
    toggle.appendChild(mark);
    toggle.appendChild(previewTitle);
    if (photo.duration) {
      const previewDuration = document.createElement("span");
      previewDuration.className = "tile-audio-duration";
      previewDuration.textContent = photo.duration;
      toggle.appendChild(previewDuration);
    }

    const player = document.createElement("div");
    player.className = "tile-audio-player";
    player.hidden = true;

    const playBtn = document.createElement("button");
    playBtn.className = "audio-play";
    playBtn.type = "button";
    playBtn.setAttribute("aria-label", "Play");
    playBtn.textContent = "▶";

    const progress = document.createElement("div");
    progress.className = "audio-progress";
    const progressFill = document.createElement("div");
    progressFill.className = "audio-progress-fill";
    progress.appendChild(progressFill);

    const time = document.createElement("span");
    time.className = "audio-time";
    time.textContent = "0:00 / 0:00";

    const volume = document.createElement("input");
    volume.className = "audio-volume";
    volume.type = "range";
    volume.min = "0";
    volume.max = "1";
    volume.step = "0.01";
    volume.value = String(getStoredVolume());
    volume.setAttribute("aria-label", "Volume");
    volume.addEventListener("input", () => {
      if (window.SitePlayer) window.SitePlayer.setVolume(parseFloat(volume.value));
    });
    volume.addEventListener("click", (e) => e.stopPropagation());

    player.appendChild(playBtn);
    player.appendChild(progress);
    player.appendChild(time);
    player.appendChild(volume);

    toggle.addEventListener("click", () => {
      if (window.SitePlayer) window.SitePlayer.playOrToggle(photo);
    });
    playBtn.addEventListener("click", () => {
      if (window.SitePlayer) window.SitePlayer.playOrToggle(photo);
    });
    progress.addEventListener("click", (e) => {
      if (!window.SitePlayer) return;
      const rect = progress.getBoundingClientRect();
      window.SitePlayer.seek((e.clientX - rect.left) / rect.width);
    });

    container.appendChild(indexTag);
    container.appendChild(toggle);
    container.appendChild(player);

    // Reflects an already-playing track immediately rather than
    // waiting for the next player tick — matters when this tile is
    // built (gallery re-render, or landing on this page) while a
    // track is already going.
    if (window.SitePlayer) window.SitePlayer.syncTile(container);

    return container;
  }

  function metaLine(photo) {
    const parts = [photo.date, photo.location].filter(Boolean);
    if (isBookItem(photo)) parts.push(photo.pages.length - 1 + " pages");
    return parts.join(" \u00b7 ");
  }

  function specLine(photo) {
    return [photo.camera, photo.lens, photo.aperture, photo.shutter, photo.iso, photo.film]
      .filter(Boolean)
      .join(" \u00b7 ");
  }

  /* ---------------- Tag filter dropdown arrow ----------------
     One arrow ever renders, attached to whichever nav item currently
     "owns" the tag row below it: the active location chip in Artwork
     (since that row already narrows the tag set), or the active type
     chip itself for sections with no location row (Text/Audio/
     Photography). Collapsed by default; picks up an accent tint
     whenever a non-"all" tag is applied, even while collapsed, so an
     active filter is never silently hidden. */
  function makeFiltersToggle() {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "filters-toggle" + (filtersExpanded || activeTag !== "all" ? " is-active" : "");
    btn.setAttribute("aria-label", filtersExpanded ? "Hide tag filters" : "Show tag filters");
    btn.setAttribute("aria-expanded", String(filtersExpanded));
    btn.textContent = "⌄";
    btn.addEventListener("click", () => {
      filtersExpanded = !filtersExpanded;
      renderTypeNav();
      renderLocationNav();
      renderFilters();
    });
    return btn;
  }

  /* ---------------- Type nav (top-level sections) ---------------- */

  function renderTypeNav() {
    typeNav.hidden = false;
    typeNav.innerHTML = "";
    const searching = searchQuery.trim().length > 0;
    TYPES.forEach((t) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "type-chip" + (activeType === t && !searching ? " is-active" : "");
      btn.textContent = TYPE_LABELS[t];
      btn.addEventListener("click", () => setActiveType(t));

      // The arrow lives here instead of on location-nav whenever this
      // is the active type and location-nav won't be the one showing
      // it -- normally that just means "not Photography", but it also
      // covers Photography itself in the edge case where it has no
      // locations to build a location-nav from at all.
      const isActive = activeType === t && !searching && t !== "all";
      const locationNavHandlesIt = t === "photo" && collectLocations().length > 0;
      if (isActive && !locationNavHandlesIt && collectTags().length > 0) {
        const wrap = document.createElement("span");
        wrap.className = "type-chip-group";
        wrap.appendChild(btn);
        wrap.appendChild(makeFiltersToggle());
        typeNav.appendChild(wrap);
      } else {
        typeNav.appendChild(btn);
      }
    });
  }

  function setActiveType(type) {
    activeType = type;
    activeLocation = "all";
    activeTag = "all";
    filtersExpanded = false;
    if (lightbox.classList.contains("is-open")) closeLightbox();
    renderTypeNav();
    renderLocationNav();
    renderFilters();
    applyFilter();
  }

  /* ---------------- Location nav (Photography only) ---------------- */

  function collectLocations() {
    const places = new Set();
    allPhotos.filter((p) => itemType(p) === "photo").forEach((p) => places.add(placeGroup(p)));
    return Array.from(places).sort();
  }

  function renderLocationNav() {
    if (activeType !== "photo" || searchQuery.trim()) {
      locationNav.hidden = true;
      locationNav.innerHTML = "";
      return;
    }
    const places = collectLocations();
    if (places.length === 0) {
      locationNav.hidden = true;
      locationNav.innerHTML = "";
      return;
    }
    locationNav.hidden = false;
    locationNav.innerHTML = "";

    const makeChip = (label, place) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "location-chip" + (activeLocation === place ? " is-active" : "");
      btn.textContent = label;
      btn.addEventListener("click", () => setActiveLocation(place));
      return btn;
    };

    const entries = [["All", "all"]].concat(places.map((place) => [place, place]));
    entries.forEach(([label, place]) => {
      const chip = makeChip(label, place);
      if (place === activeLocation && collectTags().length > 0) {
        const wrap = document.createElement("span");
        wrap.className = "location-chip-group";
        wrap.appendChild(chip);
        wrap.appendChild(makeFiltersToggle());
        locationNav.appendChild(wrap);
      } else {
        locationNav.appendChild(chip);
      }
    });
  }

  function setActiveLocation(place) {
    activeLocation = place;
    activeTag = "all";
    filtersExpanded = false;
    if (lightbox.classList.contains("is-open")) closeLightbox();
    renderLocationNav();
    renderFilters();
    applyFilter();
  }

  /* ---------------- Tag filters (scoped to the active type) ---------------- */

  function collectTags() {
    const tags = new Set();
    itemsOfActiveType().forEach((p) => {
      if (Array.isArray(p.tags)) p.tags.forEach((t) => tags.add(t));
    });
    return Array.from(tags).sort();
  }

  function renderFilters() {
    // "All" is the merged view across every section — no sub-tag row.
    // A specific section only gets a tag row when it actually has tags,
    // and even then only once its dropdown arrow has been opened.
    // Search bypasses type/location/tag entirely, so it hides this too.
    if (activeType === "all" || searchQuery.trim() || !filtersExpanded) {
      filtersNav.hidden = true;
      filtersNav.innerHTML = "";
      return;
    }
    const tags = collectTags();
    if (tags.length === 0) {
      filtersNav.hidden = true;
      filtersNav.innerHTML = "";
      return;
    }
    filtersNav.hidden = false;
    filtersNav.innerHTML = "";

    const makeChip = (label, tag) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "filter-chip" + (activeTag === tag ? " is-active" : "");
      btn.textContent = label;
      btn.addEventListener("click", () => setActiveTag(tag));
      return btn;
    };

    filtersNav.appendChild(makeChip("All", "all"));
    tags.forEach((t) => filtersNav.appendChild(makeChip(t, t)));
  }

  function setActiveTag(tag) {
    activeTag = tag;
    if (lightbox.classList.contains("is-open")) closeLightbox();
    renderLocationNav();
    renderTypeNav();
    renderFilters();
    applyFilter();
  }

  function applyFilter() {
    if (searchQuery.trim()) {
      visiblePhotos = allPhotos.filter((p) => matchesSearch(p, searchQuery));
    } else {
      const base = itemsOfActiveType();
      visiblePhotos =
        activeTag === "all" ? base.slice() : base.filter((p) => Array.isArray(p.tags) && p.tags.includes(activeTag));
    }
    renderGallery();
    syncUrl();
  }

  function setSearchQuery(query) {
    searchQuery = query;
    if (lightbox.classList.contains("is-open")) closeLightbox();
    renderTypeNav();
    renderLocationNav();
    renderFilters();
    applyFilter();
  }

  /* ---------------- Gallery ---------------- */

  function renderGallery() {
    gallery.innerHTML = "";

    if (visiblePhotos.length === 0) {
      emptyState.hidden = false;
      return;
    }
    emptyState.hidden = true;

    const frag = document.createDocumentFragment();

    visiblePhotos.forEach((photo, i) => {
      const isText = itemType(photo) === "text";
      const isAudio = itemType(photo) === "audio";

      const figure = document.createElement("figure");
      figure.className = "tile";

      const indexTag = document.createElement("span");
      indexTag.className = "tile-index";
      indexTag.textContent = "N\u00b0 " + pad(i + 1);

      if (isAudio) {
        figure.appendChild(buildAudioTile(photo, indexTag));
      } else {
        const button = document.createElement("button");
        button.className = "tile-button" + (isText ? " tile-button--text" : "");
        button.type = "button";
        const isBook = isBookItem(photo);
        button.setAttribute(
          "aria-label",
          isBook ? "Open " + (photo.title || "bound journal") : "Open " + (photo.title || "photograph") + " full size"
        );
        button.addEventListener("click", () => {
          if (isBook) {
            if (window.SiteBook) window.SiteBook.open(photo);
          } else {
            openLightbox(i);
          }
        });

        if (isText) {
          const preview = document.createElement("div");
          preview.className = "tile-text-preview";
          if (photo.title) {
            const previewTitle = document.createElement("span");
            previewTitle.className = "tile-text-title";
            previewTitle.textContent = photo.title;
            preview.appendChild(previewTitle);
          }
          const excerpt = document.createElement("p");
          excerpt.className = "tile-text-excerpt";
          excerpt.textContent = photo.body || "";
          preview.appendChild(excerpt);
          button.appendChild(preview);
        } else {
          const img = document.createElement("img");
          img.src = photo.file;
          img.alt = photo.alt || "";
          img.loading = "lazy";
          button.appendChild(img);
          if (isBook) {
            const badge = document.createElement("span");
            badge.className = "tile-book-badge";
            badge.textContent = "Journal";
            button.appendChild(badge);
          }
        }
        button.appendChild(indexTag);
        figure.appendChild(button);
      }

      const caption = document.createElement("figcaption");
      const meta = document.createElement("span");
      meta.className = "tile-meta";
      meta.textContent = metaLine(photo);

      if (isAudio || (isText && photo.title)) {
        // The title already appears above (audio toggle, or the poem's
        // own heading) — showing it again here would just be a duplicate.
        caption.appendChild(document.createElement("span"));
      } else {
        const title = document.createElement("span");
        title.className = "tile-title";
        title.textContent = photo.title || "Untitled";
        caption.appendChild(title);
      }
      caption.appendChild(meta);

      figure.appendChild(caption);
      frag.appendChild(figure);
    });

    gallery.appendChild(frag);

    // The fade-out at the bottom of a text tile (styles.css) only
    // makes sense when the excerpt is actually being cut off by the
    // tile's max-height -- measure that post-layout rather than
    // assuming every poem tile is clamped.
    gallery.querySelectorAll(".tile-button--text").forEach((el) => {
      if (el.scrollHeight > el.clientHeight + 1) el.classList.add("is-clamped");
    });
  }

  /* ---------------- Lightbox ---------------- */

  function openLightbox(i) {
    if (!visiblePhotos.length) return;
    currentIndex = i;
    lastFocused = document.activeElement;
    updateLightbox();
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    closeBtn.focus();
    document.addEventListener("keydown", onKeydown);
    syncUrl();
  }

  function closeLightbox() {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.removeEventListener("keydown", onKeydown);
    setZoomed(false);
    if (lastFocused) lastFocused.focus();
    syncUrl();
  }

  function updateLightbox() {
    const photo = visiblePhotos[currentIndex];
    const isText = itemType(photo) === "text";
    isPlainText = false;

    lightboxImage.hidden = isText;
    lightboxText.hidden = !isText;

    if (isText) {
      plainTextToggle.textContent = "Plain text";
      renderTextBody(photo, false);
    } else {
      lightboxImage.src = photo.file;
      lightboxImage.alt = photo.alt || "";
    }

    lightboxIndex.textContent = "N\u00b0 " + pad(currentIndex + 1) + " / " + pad(visiblePhotos.length);
    lightboxTitle.textContent = photo.title || "Untitled";
    lightboxMeta.textContent = metaLine(photo);
    lightboxSpecs.textContent = specLine(photo);
    lightboxSpecs.hidden = specLine(photo).length === 0;
  }

  function step(delta) {
    setZoomed(false);
    currentIndex = (currentIndex + delta + visiblePhotos.length) % visiblePhotos.length;
    updateLightbox();
    syncUrl();
  }

  function setZoomed(state) {
    isZoomed = state;
    lightboxFigure.classList.toggle("is-zoomed", state);
  }

  function onKeydown(e) {
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowRight") step(1);
    if (e.key === "ArrowLeft") step(-1);
  }

  closeBtn.addEventListener("click", closeLightbox);
  prevBtn.addEventListener("click", () => step(-1));
  nextBtn.addEventListener("click", () => step(1));
  let copyLinkTimer = null;
  copyLinkBtn.addEventListener("click", () => {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => {
        copyLinkBtn.textContent = "Copied";
        copyLinkBtn.classList.add("is-copied");
        clearTimeout(copyLinkTimer);
        copyLinkTimer = setTimeout(() => {
          copyLinkBtn.textContent = "Copy link";
          copyLinkBtn.classList.remove("is-copied");
        }, 1500);
      })
      .catch(() => {});
  });
  plainTextToggle.addEventListener("click", () => {
    isPlainText = !isPlainText;
    plainTextToggle.textContent = isPlainText ? "Styled" : "Plain text";
    renderTextBody(visiblePhotos[currentIndex], isPlainText);
  });
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  // Tap zones: clicking the left/right third of the image steps
  // through the set, same as the arrow buttons — useful on phones
  // where the arrow buttons sit near the screen edge. The center
  // third toggles a zoomed, scrollable full-resolution view instead.
  lightboxImage.addEventListener("click", (e) => {
    if (isZoomed) {
      setZoomed(false);
      return;
    }
    const rect = lightboxImage.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 3) step(-1);
    else if (x > (rect.width * 2) / 3) step(1);
    else setZoomed(true);
  });

  // Swipe navigation for touch devices. A second finger touching down
  // mid-gesture means this is a pinch-to-zoom, not a swipe -- abort
  // tracking so it doesn't get read as a big horizontal drag and step
  // to the next photo out from under the zoom.
  lightbox.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length > 1) {
        touchStartX = null;
        return;
      }
      touchStartX = e.changedTouches[0].clientX;
    },
    { passive: true }
  );
  lightbox.addEventListener(
    "touchend",
    (e) => {
      if (touchStartX === null) return;
      // While the page itself is pinch-zoomed in, a one-finger drag is
      // panning around the zoomed view, not a swipe -- don't read it
      // as one.
      if (window.visualViewport && window.visualViewport.scale > 1.01) {
        touchStartX = null;
        return;
      }
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 50) step(dx > 0 ? -1 : 1);
      touchStartX = null;
    },
    { passive: true }
  );

  searchInput.addEventListener("input", () => setSearchQuery(searchInput.value));

  shuffleBtn.addEventListener("click", () => {
    if (!visiblePhotos.length) return;
    const i = Math.floor(Math.random() * visiblePhotos.length);
    const photo = visiblePhotos[i];
    if (isBookItem(photo)) {
      if (window.SiteBook) window.SiteBook.open(photo);
    } else {
      openLightbox(i);
    }
  });

  /* ---------------- URL state ---------------- */
  // Reflects the current view (search, or type/location/tag, plus
  // whichever item is open) in the URL via replaceState, so the page
  // can be bookmarked or shared. Doesn't push history entries — the
  // browser back button leaves the page as normal, it doesn't step
  // back through individual filter/lightbox changes.

  function syncUrl() {
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.set("q", searchQuery.trim());
    } else {
      if (activeType !== DEFAULT_TYPE) params.set("type", activeType);
      if (activeType === "photo" && activeLocation !== "all") params.set("location", activeLocation);
      if (activeTag !== "all") params.set("tag", activeTag);
    }
    if (lightbox.classList.contains("is-open")) {
      const globalIndex = allPhotos.indexOf(visiblePhotos[currentIndex]);
      if (globalIndex !== -1) params.set("item", String(globalIndex));
    }
    const qs = params.toString();
    history.replaceState(null, "", window.location.pathname + (qs ? "?" + qs : ""));
  }

  // Returns the global index to open once the initial render completes,
  // or null. Also sets whatever type/location/tag/search state is needed
  // to make that item (or the requested filter combo) actually visible.
  function readUrlState() {
    const params = new URLSearchParams(window.location.search);

    const itemParam = params.get("item");
    if (itemParam !== null && /^\d+$/.test(itemParam)) {
      const globalIndex = parseInt(itemParam, 10);
      const item = allPhotos[globalIndex];
      if (item) {
        const type = itemType(item);
        activeType = TYPES.includes(type) ? type : "all";
        activeLocation = type === "photo" ? placeGroup(item) : "all";
        activeTag = "all";
        return globalIndex;
      }
    }

    const q = params.get("q");
    if (q) {
      searchQuery = q;
      searchInput.value = q;
      return null;
    }

    const type = params.get("type");
    if (type && TYPES.includes(type)) activeType = type;
    const place = params.get("location");
    if (place) activeLocation = place;
    const tag = params.get("tag");
    if (tag) {
      activeTag = tag;
      filtersExpanded = true;
    }
    return null;
  }

  const pendingOpenIndex = readUrlState();

  renderTypeNav();
  renderLocationNav();
  renderFilters();
  applyFilter();

  if (pendingOpenIndex !== null) {
    const idx = visiblePhotos.indexOf(allPhotos[pendingOpenIndex]);
    if (idx !== -1) {
      const photo = visiblePhotos[idx];
      if (isBookItem(photo)) {
        if (window.SiteBook) window.SiteBook.open(photo);
      } else {
        openLightbox(idx);
      }
    }
  }
}

window.initIndexPage = initIndexPage;
if (document.getElementById("gallery")) initIndexPage();
