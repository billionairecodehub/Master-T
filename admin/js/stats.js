// admin/js/stats.js — Stats page logic

function refreshStats() {
  const apps = DataStore.getAll("apps");
  const books = DataStore.getAll("books");
  const circles = DataStore.getAll("circles");
  const posts = DataStore.getAll("posts");
  const notis = DataStore.getAll("notifications");
  const subs = DataStore.getAll("subscribers");

  // ── Dashboard overview counts (moved from Home) ──
  document.getElementById("stats-stat-apps").textContent = apps.length;
  document.getElementById("stats-stat-books").textContent = books.length;
  document.getElementById("stats-stat-circles").textContent = circles.length;
  document.getElementById("stats-stat-posts").textContent = posts.length;
  document.getElementById("stats-stat-notis").textContent = notis.length;
  document.getElementById("stats-stat-subs").textContent = subs.length;

  // ── Content Analytics ──
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

  // ── Distribution Bars ──
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

  // ── Recently Added (last 5, moved from Home) ──
  const all = [];
  apps.forEach((i) =>
    all.push({ type: "App", name: i.name, time: i.createdAt }),
  );
  books.forEach((i) =>
    all.push({ type: "Book", name: i.name, time: i.createdAt }),
  );
  circles.forEach((i) =>
    all.push({ type: "Circle", name: i.name, time: i.createdAt }),
  );
  posts.forEach((i) =>
    all.push({ type: "Post", name: i.subject, time: i.createdAt }),
  );
  notis.forEach((i) =>
    all.push({ type: "Notification", name: i.title, time: i.createdAt }),
  );
  all.sort((a, b) => new Date(b.time) - new Date(a.time));

  const recentEl = document.getElementById("stats-recent");
  if (recentEl) {
    recentEl.innerHTML =
      all
        .slice(0, 5)
        .map(
          (item) => `
        <div class="dashboard-recent-item">
          <div class="dashboard-recent-dot"></div>
          <div class="dashboard-recent-text">${item.type}: ${item.name}</div>
          <div class="dashboard-recent-time">${_statsTimeAgo(item.time)}</div>
        </div>`,
        )
        .join("") ||
      '<div class="admin-empty"><div class="admin-empty-text">Nothing added yet</div></div>';
  }
}

function _statsTimeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return mins + "m ago";
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + "h ago";
  const days = Math.floor(hrs / 24);
  return days + "d ago";
}
