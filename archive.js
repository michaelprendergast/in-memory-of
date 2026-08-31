function initArchivePage() {
  "use strict";

  const container = document.getElementById("archive-container");
  // Same filter, same source array, same order as script.js's allPhotos —
  // the index into this array is exactly what index.html?item=N expects.
  const allPhotos = (typeof PHOTOS !== "undefined" && Array.isArray(PHOTOS) ? PHOTOS : []).filter(
    (p) => !p.hidden
  );

  const TYPE_LABELS = { photo: "Photo", text: "Text", audio: "Audio", photography: "Photography" };

  function yearOf(item) {
    const m = /^(\d{4})/.exec(item.date || "");
    return m ? m[1] : "Undated";
  }

  // Missing month/day sort first within their year (least precise date).
  function dateSortKey(dateStr) {
    const parts = (dateStr || "").split("-");
    return (parts[0] || "0000") + "-" + (parts[1] || "00") + "-" + (parts[2] || "00");
  }

  const byYear = new Map();
  allPhotos.forEach((item, index) => {
    const year = yearOf(item);
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year).push({ item, index });
  });

  const years = Array.from(byYear.keys()).sort((a, b) => b.localeCompare(a));

  if (years.length === 0) {
    const empty = document.createElement("p");
    empty.className = "archive-empty";
    empty.textContent = "Nothing indexed yet.";
    container.appendChild(empty);
    return;
  }

  years.forEach((year) => {
    const heading = document.createElement("h2");
    heading.className = "archive-year";
    heading.textContent = year;
    container.appendChild(heading);

    const entries = byYear.get(year).sort((a, b) => dateSortKey(b.item.date).localeCompare(dateSortKey(a.item.date)));

    const list = document.createElement("ul");
    list.className = "archive-entries";
    entries.forEach(({ item, index }) => {
      const li = document.createElement("li");
      li.className = "archive-entry";

      const link = document.createElement("a");
      link.href = "index.html?item=" + index;

      const type = document.createElement("span");
      type.className = "archive-type";
      type.textContent = TYPE_LABELS[item.type || "photo"] || item.type;

      const title = document.createElement("span");
      title.className = "archive-title";
      title.textContent = item.title || "Untitled";

      const date = document.createElement("span");
      date.className = "archive-date";
      date.textContent = item.date || "";

      link.appendChild(type);
      link.appendChild(title);
      link.appendChild(date);
      li.appendChild(link);
      list.appendChild(li);
    });
    container.appendChild(list);
  });
}

window.initArchivePage = initArchivePage;
if (document.getElementById("archive-container")) initArchivePage();
