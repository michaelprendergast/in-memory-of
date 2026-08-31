(function () {
  "use strict";

  // Lightweight PJAX-style navigation: intercepts clicks on internal
  // links between the site's pages, fetches the target HTML,
  // and swaps just the #view region instead of doing a full page load.
  // The header, footer, and the persistent audio player (player.js)
  // all live outside #view, so they're untouched by a route change --
  // that's what lets audio keep playing across pages.
  //
  // This is progressive enhancement on top of pages that already work
  // as plain static HTML: if fetch fails, or a page doesn't have a
  // #view region for some reason, it just falls back to a real
  // navigation rather than breaking.

  const ROUTES = new Set(["", "index.html", "about.html", "obituary.html", "archive.html", "classic.html"]);

  function pageName(pathname) {
    return pathname.split("/").pop() || "index.html";
  }

  function updateActiveNav(pathname) {
    const page = pageName(pathname);
    document.querySelectorAll(".site-nav a").forEach((a) => {
      if (a.getAttribute("href") === page) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }

  function runPageInit(pathname) {
    const page = pageName(pathname);
    if (page === "archive.html") {
      if (window.initArchivePage) window.initArchivePage();
    } else if (page === "about.html" || page === "obituary.html") {
      // static content, nothing to initialize
    } else if (page === "classic.html") {
      // the original gallery layout, kept around at its own URL
      if (window.initIndexPage) window.initIndexPage();
    } else {
      // "" and "index.html" -- the fixed-background split layout
      // (formerly beta.html) is the homepage now
      if (window.initBetaPage) window.initBetaPage();
    }
  }

  // Guards against out-of-order fetches: if two navigations are ever
  // in flight at once (e.g. a fast double-click on two different nav
  // links), only the most recently requested one is allowed to apply
  // when it resolves -- a stale response landing after a newer
  // navigation started is just dropped.
  let navToken = 0;

  function navigate(href, push) {
    const url = new URL(href, window.location.href);
    const token = ++navToken;
    fetch(url.href, { credentials: "same-origin" })
      .then((res) => {
        if (!res.ok) throw new Error("navigation fetch failed: " + res.status);
        return res.text();
      })
      .then((html) => {
        if (token !== navToken) return;
        const doc = new DOMParser().parseFromString(html, "text/html");
        const newView = doc.getElementById("view");
        const oldView = document.getElementById("view");
        if (!newView || !oldView) {
          window.location.href = url.href;
          return;
        }
        document.title = doc.title;
        oldView.innerHTML = newView.innerHTML;
        updateActiveNav(url.pathname);
        if (push) history.pushState(null, "", url.href);
        window.scrollTo(0, 0);
        runPageInit(url.pathname);
      })
      .catch(() => {
        if (token === navToken) window.location.href = url.href;
      });
  }

  document.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const link = e.target.closest("a");
    if (!link || !link.href) return;
    if (link.target && link.target !== "_self") return;
    if (link.hasAttribute("download")) return;

    let url;
    try {
      url = new URL(link.href, window.location.href);
    } catch (err) {
      return;
    }
    if (url.origin !== window.location.origin) return;
    if (!ROUTES.has(pageName(url.pathname))) return;
    if (url.href === window.location.href) {
      e.preventDefault();
      return;
    }

    e.preventDefault();
    navigate(url.href, true);
  });

  window.addEventListener("popstate", () => {
    navigate(window.location.href, false);
  });
})();
