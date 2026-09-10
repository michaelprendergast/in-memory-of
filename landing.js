(function () {
  "use strict";

  // A minimal standalone lightbox for the two self-portraits on the
  // landing page only. Reuses the main gallery's .lightbox styling
  // (styles.css) for a consistent look, but is otherwise independent
  // of script.js's lightbox -- that one only initializes on
  // gallery.html (it needs the #gallery grid to build a navigable set
  // from). Bound once via delegation on document rather than on the
  // images directly, so it keeps working across router.js's PJAX
  // swaps of #view without needing its own re-init hook.

  const TRIGGER_SELECTOR = ".hero-portrait, .landing-closing-portrait";

  function open(img) {
    const lightbox = document.getElementById("portrait-lightbox");
    const lightboxImage = document.getElementById("portrait-lightbox-image");
    if (!lightbox || !lightboxImage) return;
    lightboxImage.src = img.src;
    lightboxImage.alt = img.alt;
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
  }

  function close() {
    const lightbox = document.getElementById("portrait-lightbox");
    if (!lightbox) return;
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
  }

  document.addEventListener("click", (e) => {
    const trigger = e.target.closest(TRIGGER_SELECTOR);
    if (trigger) {
      open(trigger);
      return;
    }
    // Clicking anywhere inside the open lightbox -- backdrop, image,
    // or the close button -- dismisses it; there's no zoom toggle
    // here to conflict with, unlike the main gallery lightbox.
    if (e.target.closest("#portrait-lightbox")) close();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      close();
      return;
    }
    if (e.key !== "Enter" && e.key !== " ") return;
    const trigger = e.target.closest && e.target.closest(TRIGGER_SELECTOR);
    if (trigger) {
      e.preventDefault();
      open(trigger);
    }
  });
})();
