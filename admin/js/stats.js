// admin/js/stats.js — Stats page logic

function refreshStats() {
  const apps = DataStore.getAll("apps");
  const books = DataStore.getAll("books");
  const circles = DataStore.getAll("circles");
  const posts = DataStore.getAll("posts");

  const total = apps.length + books.length + circles.length + posts.length;
  const pinned =
    apps.filter((a) => a.pinned).length + books.filter((b) => b.pinned).length;
  const threads = posts.reduce(
    (sum, p) => sum + (p.threads ? p.threads.length : 0),
    0,
  );
  const categories = [
    ...new Set(circles.map((c) => c.category).filter(Boolean)),
  ].length;

  document.getElementById("stats-total").textContent = total;
  document.getElementById("stats-pinned").textContent = pinned;
  document.getElementById("stats-threads").textContent = threads;
  document.getElementById("stats-categories").textContent = categories;

  // Bars
  const maxCount = Math.max(
    apps.length,
    books.length,
    circles.length,
    posts.length,
    1,
  );
  const barsData = [
    { name: "Apps", count: apps.length },
    { name: "Books", count: books.length },
    { name: "Circles", count: circles.length },
    { name: "Posts", count: posts.length },
  ];

  document.getElementById("stats-bars").innerHTML = barsData
    .map(
      (b) => `
      <div class="stats-bar-group">
        <div class="stats-bar-label">
          <span class="stats-bar-name">${b.name}</span>
          <span class="stats-bar-value">${b.count}</span>
        </div>
        <div class="stats-bar-track">
          <div class="stats-bar-fill" style="width:${(b.count / maxCount) * 100}%"></div>
        </div>
      </div>`,
    )
    .join("");

  // Top rated (apps + books sorted by rating)
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
