function initBetaPage() {
  "use strict";

  // Controller for the homepage (index.html) — a fixed-background split
  // layout covering every section (photos, text, audio, ceramics).
  // Started as a separate beta.html experiment (hence the file/function
  // names) before being promoted; the original gallery layout it
  // replaced still lives at classic.html, run by script.js's
  // initIndexPage. It's part of the PJAX-swapped set (see router.js's
  // ROUTES), so like initIndexPage and initArchivePage this runs both
  // on a hard page load (guarded call at the bottom of this file) and
  // again on every router-driven navigation into index.html -- all
  // state below is local to a single call and rebuilt fresh each time,
  // same as those two.
  //
  // Left column (.beta-detail): a fixed panel that shows whichever item
  // was last clicked — the enlarged photo/ceramic piece with its
  // caption, or a poem's full text. At 900px+ it sits beside the
  // background image, at the width of that image; below 900px it's a
  // full-width modal instead (see beta.css). Audio never touches it —
  // audio plays inline in its own tile, same as everywhere else on the
  // site, via window.SitePlayer.

  const TYPES = ["photo", "text", "audio", "ceramics", "all"];
  const TYPE_LABELS = { all: "All", photo: "Artwork", text: "Text", audio: "Audio", ceramics: "Ceramics" };
  const DEFAULT_TYPE = "photo";

  const bgImage = document.querySelector(".beta-bg-image");
  const detail = document.getElementById("beta-detail");
  const detailClose = document.getElementById("beta-detail-close");
  const detailImageBtn = document.getElementById("beta-detail-image-btn");
  const detailImage = document.getElementById("beta-detail-image");
  const detailText = document.getElementById("beta-detail-text");
  const detailTextBody = document.getElementById("beta-detail-text-body");
  const detailTitle = document.getElementById("beta-detail-title");
  const detailMeta = document.getElementById("beta-detail-meta");
  const detailSpecs = document.getElementById("beta-detail-specs");
  const typeNav = document.getElementById("beta-type-nav");
  const locationNav = document.getElementById("beta-location-nav");
  const filtersNav = document.getElementById("beta-filters");
  const searchInput = document.getElementById("beta-search-input");
  const randomBtn = document.getElementById("beta-random-btn");
  const gallery = document.getElementById("beta-gallery");
  const emptyState = document.getElementById("beta-empty-state");

  const lightbox = document.getElementById("lightbox");
  const lightboxFigure = document.querySelector(".lightbox-figure");
  const lightboxImage = document.getElementById("lightbox-image");
  const lightboxIndex = document.getElementById("lightbox-index");
  const lightboxTitle = document.getElementById("lightbox-title");
  const lightboxMeta = document.getElementById("lightbox-meta");
  const lightboxSpecs = document.getElementById("lightbox-specs");
  const closeBtn = document.getElementById("lightbox-close");
  const prevBtn = document.getElementById("lightbox-prev");
  const nextBtn = document.getElementById("lightbox-next");

  const allItems = (typeof PHOTOS !== "undefined" && Array.isArray(PHOTOS) ? PHOTOS : []).filter((p) => !p.hidden);

  let activeType = DEFAULT_TYPE;
  let activeLocation = "all";
  let activeTag = "all";
  let filtersExpanded = false;
  let searchQuery = "";
  let visiblePhotos = [];
  let isZoomed = false;
  let touchStartX = null;

  // The left panel is deliberately independent of the current
  // type/location/tag/search selection -- switching sections doesn't
  // touch it, so it keeps showing the last item clicked (in any
  // section) until either the close button or a new item replaces it.
  // detailList/detailListIndex are a snapshot of whichever visiblePhotos
  // the item was clicked from, kept around purely so the lightbox can
  // still step prev/next through that original set even after the
  // active section has since changed to something else.
  let detailItem = null;
  let detailList = [];
  let detailListIndex = 0;

  // The lightbox's own prev/next set — starts out as a copy of
  // whatever list it was opened from (see detailImageBtn below), but
  // is otherwise independent of detailList once open.
  let lightboxList = [];
  let currentIndex = 0;

  function itemType(p) {
    return p.type || "photo";
  }

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function placeGroup(photo) {
    const loc = photo.location || "";
    if (/spain/i.test(loc)) return "Spain";
    return loc || "Unspecified";
  }

  function metaLine(photo) {
    return [photo.date, photo.location].filter(Boolean).join(" · ");
  }

  function specLine(photo) {
    return [photo.camera, photo.lens, photo.aperture, photo.shutter, photo.iso, photo.film]
      .filter(Boolean)
      .join(" · ");
  }

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

  /* ---------------- Type nav ---------------- */

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

  function renderTypeNav() {
    typeNav.innerHTML = "";
    const searching = searchQuery.trim().length > 0;
    TYPES.forEach((t) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "type-chip" + (activeType === t && !searching ? " is-active" : "");
      btn.textContent = TYPE_LABELS[t];
      btn.addEventListener("click", () => setActiveType(t));

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
    renderTypeNav();
    renderLocationNav();
    renderFilters();
    applyFilter();
  }

  /* ---------------- Location nav (Photography only) ---------------- */

  function collectLocations() {
    const places = new Set();
    allItems.filter((p) => itemType(p) === "photo").forEach((p) => places.add(placeGroup(p)));
    return Array.from(places).sort();
  }

  function itemsOfActiveType() {
    let items = activeType === "all" ? allItems.slice() : allItems.filter((p) => itemType(p) === activeType);
    if (activeType === "photo" && activeLocation !== "all") {
      items = items.filter((p) => placeGroup(p) === activeLocation);
    }
    return items;
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
    renderLocationNav();
    renderFilters();
    applyFilter();
  }

  /* ---------------- Tag filters ---------------- */

  function collectTags() {
    const tags = new Set();
    itemsOfActiveType().forEach((p) => {
      if (Array.isArray(p.tags)) p.tags.forEach((t) => tags.add(t));
    });
    return Array.from(tags).sort();
  }

  function renderFilters() {
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
    renderLocationNav();
    renderTypeNav();
    renderFilters();
    applyFilter();
  }

  function setSearchQuery(query) {
    searchQuery = query;
    renderTypeNav();
    renderLocationNav();
    renderFilters();
    applyFilter();
  }

  function applyFilter() {
    if (searchQuery.trim()) {
      visiblePhotos = allItems.filter((p) => matchesSearch(p, searchQuery));
    } else {
      const base = itemsOfActiveType();
      visiblePhotos = activeTag === "all" ? base.slice() : base.filter((p) => Array.isArray(p.tags) && p.tags.includes(activeTag));
    }
    renderGallery();
    syncUrl();
  }

  /* ---------------- URL state — mirrors script.js's syncUrl/readUrlState.
     Reflects the active type/location/tag/search plus whichever item the
     left panel is showing, via replaceState (no history entries pushed).
     ---------------- */

  function syncUrl() {
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.set("q", searchQuery.trim());
    } else {
      if (activeType !== DEFAULT_TYPE) params.set("type", activeType);
      if (activeType === "photo" && activeLocation !== "all") params.set("location", activeLocation);
      if (activeTag !== "all") params.set("tag", activeTag);
    }
    if (detailItem) {
      const globalIndex = allItems.indexOf(detailItem);
      if (globalIndex !== -1) params.set("item", String(globalIndex));
    }
    const qs = params.toString();
    history.replaceState(null, "", window.location.pathname + (qs ? "?" + qs : ""));
  }

  // Returns the item to open in the detail panel once the initial
  // render completes, or null. An `item` link always wins over
  // type/location/tag/search and derives its own section context from
  // the item itself, same as script.js's version.
  function readUrlState() {
    const params = new URLSearchParams(window.location.search);

    const itemParam = params.get("item");
    if (itemParam !== null && /^\d+$/.test(itemParam)) {
      const globalIndex = parseInt(itemParam, 10);
      const item = allItems[globalIndex];
      if (item) {
        const type = itemType(item);
        activeType = TYPES.includes(type) && type !== "all" ? type : DEFAULT_TYPE;
        activeLocation = type === "photo" ? placeGroup(item) : "all";
        activeTag = "all";
        return item;
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

  /* ---------------- Audio tile (mirrors script.js's buildAudioTile) ---------------- */

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

    if (window.SitePlayer) window.SitePlayer.syncTile(container);

    return container;
  }

  /* ---------------- Gallery (right column) ---------------- */

  function renderGallery() {
    gallery.innerHTML = "";
    if (visiblePhotos.length === 0) {
      emptyState.hidden = false;
      return;
    }
    emptyState.hidden = true;

    const frag = document.createDocumentFragment();
    visiblePhotos.forEach((photo, i) => {
      const size = ["lg", "md", "sm"].includes(photo.size) ? photo.size : "md";
      const isText = itemType(photo) === "text";
      const isAudio = itemType(photo) === "audio";

      const figure = document.createElement("figure");
      figure.className = "tile tile--" + size;

      const indexTag = document.createElement("span");
      indexTag.className = "tile-index";
      indexTag.textContent = "N° " + pad(i + 1);

      if (isAudio) {
        figure.appendChild(buildAudioTile(photo, indexTag));
      } else {
        const button = document.createElement("button");
        button.className = "tile-button" + (isText ? " tile-button--text" : "");
        button.type = "button";
        button.setAttribute("aria-label", "View " + (photo.title || (isText ? "text" : "photograph")));
        button.addEventListener("click", () => showDetail(i));

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
        }
        button.appendChild(indexTag);
        // Identity check rather than an index: the left panel can be
        // showing an item from a different section than the one
        // currently rendered, in which case nothing here should
        // highlight at all.
        if (detailItem === photo) figure.classList.add("is-selected");
        figure.appendChild(button);
      }

      const caption = document.createElement("figcaption");
      const meta = document.createElement("span");
      meta.className = "tile-meta";
      meta.textContent = metaLine(photo);

      if (isAudio || (isText && photo.title)) {
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

    gallery.querySelectorAll(".tile-button--text").forEach((el) => {
      if (el.scrollHeight > el.clientHeight + 1) el.classList.add("is-clamped");
    });
  }

  // Re-locates item's tile in the *current* gallery render and focuses
  // its trigger. A plain saved DOM-node reference doesn't survive here
  // -- renderGallery rebuilds every tile from scratch on every call,
  // including the one showDetail() itself triggers right after a click
  // -- so this looks the tile up fresh by identity instead. Returns
  // false (and focuses nothing) if item isn't part of what's currently
  // visible, e.g. the active section has since moved on from it.
  function focusTileFor(item) {
    const idx = visiblePhotos.indexOf(item);
    const figure = idx !== -1 ? gallery.children[idx] : null;
    const target = figure ? figure.querySelector(".tile-button, .tile-audio-toggle") : null;
    if (target) target.focus();
    return !!target;
  }

  /* ---------------- Left column: background <-> detail ---------------- */

  function renderDetailText(item) {
    detailTextBody.innerHTML = "";
    if (item.title) {
      const heading = document.createElement("p");
      heading.className = "text-title";
      heading.textContent = item.title;
      detailTextBody.appendChild(heading);
    }
    const body = item.body || "";
    const stanzas = body.split(/\n\s*\n/);
    stanzas.forEach((stanza) => {
      const p = document.createElement("p");
      if (item.format === "prose") {
        p.className = "text-prose";
        p.textContent = stanza.replace(/\n/g, " ").trim();
      } else {
        p.className = "text-verse";
        stanza.split("\n").forEach((line, idx) => {
          if (idx > 0) p.appendChild(document.createElement("br"));
          p.appendChild(document.createTextNode(line));
        });
      }
      detailTextBody.appendChild(p);
    });
  }

  function onDetailKeydown(e) {
    if (e.key === "Escape") closeDetail();
  }

  function showDetail(i) {
    const photo = visiblePhotos[i];
    // Only attach Escape on the closed -> open transition, not on every
    // subsequent click that just swaps the panel's content while it's
    // already open.
    if (!detailItem) document.addEventListener("keydown", onDetailKeydown);
    detailItem = photo;
    detailList = visiblePhotos.slice();
    detailListIndex = i;
    const isText = itemType(photo) === "text";

    detailImageBtn.hidden = isText;
    detailText.hidden = !isText;

    if (isText) {
      renderDetailText(photo);
      // The heading (if any) already lives inside the text body, styled
      // to match — showing it again in the outer caption would just
      // duplicate it, unlike photos where the caption is its only home.
      detailTitle.hidden = true;
    } else {
      detailImage.src = photo.file;
      detailImage.alt = photo.alt || "";
      detailTitle.hidden = false;
      detailTitle.textContent = photo.title || "Untitled";
    }

    detailMeta.textContent = metaLine(photo);
    const specs = specLine(photo);
    detailSpecs.textContent = specs;
    detailSpecs.hidden = isText || specs.length === 0;

    detail.hidden = false;
    bgImage.classList.add("is-dimmed");
    // Whoever triggered this click is likely still far down the tab
    // order (the panel sits earlier in the DOM than the gallery), so a
    // keyboard user has no forward-Tab path to the close button
    // without this -- move focus in explicitly, same as the lightbox
    // already does for itself.
    detailClose.focus();
    renderGallery();
    syncUrl();
  }

  function closeDetail() {
    if (!detailItem) return;
    const closingItem = detailItem;
    detailItem = null;
    detail.hidden = true;
    bgImage.classList.remove("is-dimmed");
    document.removeEventListener("keydown", onDetailKeydown);
    renderGallery();
    // Only lands somewhere if closingItem is still part of the
    // currently active section/filter -- if the active tab has since
    // moved on to something else there's no sensible tile to return
    // to, so focus is just left wherever the browser puts it.
    focusTileFor(closingItem);
    syncUrl();
  }

  // The single entry point for "activating" a clicked/random item —
  // dispatches per type since audio has no left-column representation
  // (it plays inline in its own tile, same as everywhere on the site)
  // while photos/ceramics/text all use showDetail.
  function activateItem(i) {
    const item = visiblePhotos[i];
    if (itemType(item) === "audio") {
      if (window.SitePlayer) window.SitePlayer.playOrToggle(item);
      const tile = gallery.querySelector('.tile-audio[data-file="' + CSS.escape(item.file) + '"]');
      if (tile) tile.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    showDetail(i);
  }

  detailClose.addEventListener("click", closeDetail);
  detailImageBtn.addEventListener("click", () => {
    if (detailItem) openLightbox(detailList, detailListIndex);
  });

  randomBtn.addEventListener("click", () => {
    if (!visiblePhotos.length) return;
    activateItem(Math.floor(Math.random() * visiblePhotos.length));
  });

  searchInput.addEventListener("input", () => setSearchQuery(searchInput.value));

  /* ---------------- Lightbox (photos/ceramics only — text has no
     zoomed view, it's already fully shown in the detail panel) ---------------- */

  function openLightbox(list, i) {
    if (!list.length) return;
    lightboxList = list;
    currentIndex = i;
    updateLightbox();
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    closeBtn.focus();
    document.addEventListener("keydown", onKeydown);
  }

  function closeLightbox() {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.removeEventListener("keydown", onKeydown);
    setZoomed(false);
  }

  function updateLightbox() {
    const photo = lightboxList[currentIndex];
    lightboxImage.src = photo.file;
    lightboxImage.alt = photo.alt || "";
    lightboxIndex.textContent = "N° " + pad(currentIndex + 1) + " / " + pad(lightboxList.length);
    lightboxTitle.textContent = photo.title || "Untitled";
    lightboxMeta.textContent = metaLine(photo);
    lightboxSpecs.textContent = specLine(photo);
    lightboxSpecs.hidden = specLine(photo).length === 0;
  }

  function step(delta) {
    setZoomed(false);
    currentIndex = (currentIndex + delta + lightboxList.length) % lightboxList.length;
    updateLightbox();
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
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });

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

  lightbox.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.changedTouches[0].clientX;
    },
    { passive: true }
  );
  lightbox.addEventListener(
    "touchend",
    (e) => {
      if (touchStartX === null) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 50) step(dx > 0 ? -1 : 1);
      touchStartX = null;
    },
    { passive: true }
  );

  const pendingItem = readUrlState();

  renderTypeNav();
  renderLocationNav();
  renderFilters();
  applyFilter();

  if (pendingItem) {
    const idx = visiblePhotos.indexOf(pendingItem);
    // Audio has no detail-panel representation (see activateItem) and
    // autoplaying from a link would be blocked by the browser anyway,
    // so a linked audio item just lands on its scrolled-to tile rather
    // than trying to open or play anything.
    if (idx !== -1 && itemType(pendingItem) !== "audio") showDetail(idx);
  }
}

window.initBetaPage = initBetaPage;
if (document.getElementById("beta-gallery")) initBetaPage();
