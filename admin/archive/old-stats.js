// ARCHIVED — Old Stats JS (Top Rated section)
// Moved here from js/stats.js
// Keep for future reference. Not loaded or executed.

// ── Old Top Rated rendering ──

function renderTopRated_OLD(apps, books) {
  const rated = [...apps, ...books]
    .filter((i) => i.rating)
    .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating))
    .slice(0, 5);

  document.getElementById("stats-top-rated").innerHTML = rated.length
    ? rated
        .map(
          (item) => `
        <div class="admin-list-item" style="cursor:default">
          <img src="${item.img || ""}" alt="${item.name}" class="admin-list-icon" />
          <div class="admin-list-info">
            <div class="admin-list-name">${item.name}</div>
            <div class="admin-list-meta">★ ${item.rating} · ${item.ratingcount || "—"} ratings</div>
          </div>
        </div>`,
        )
        .join("")
    : '<div class="admin-empty"><div class="admin-empty-text">No rated content</div></div>';
}
