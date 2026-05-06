// admin/js/stats.js — Stats page logic

function refreshStats() {
  const apps = DataStore.getAll("apps");
  const books = DataStore.getAll("books");
  const circles = DataStore.getAll("circles");
  const posts = DataStore.getAll("posts");
  const quests = DataStore.getAll("quests");
  const stories = DataStore.getAll("stories");
  const updates = DataStore.getAll("recommends");
  const polls = DataStore.getAll("polls");
  const notis = DataStore.getAll("notifications");
  const subs = DataStore.getAll("subscribers");

  // ── Dashboard overview counts (moved from Home) ──
  document.getElementById("stats-stat-apps").textContent = apps.length;
  document.getElementById("stats-stat-books").textContent = books.length;
  document.getElementById("stats-stat-circles").textContent = circles.length;
  document.getElementById("stats-stat-posts").textContent = posts.length;
  document.getElementById("stats-stat-notis").textContent = notis.length;
  document.getElementById("stats-stat-subs").textContent = subs.length;
  document.getElementById("stats-stat-polls").textContent = polls.length;
  document.getElementById("stats-stat-stories").textContent = stories.length;
  document.getElementById("stats-stat-updates").textContent = updates.length;

  // ── App Analytics ──
  // Real unique daily visitor count: tracked per-device, Firebase-synced, resets at UTC midnight
  const profile = DataStore.getProfile();
  const todayUTC = new Date().toISOString().slice(0, 10);
  const visitors24h =
    profile.visitDate === todayUTC ? profile.dailyVisits || 0 : 0;

  const postLikes = posts.reduce((sum, p) => sum + (p.likes || 0), 0);
  const outboundClicks =
    apps.reduce((sum, a) => sum + (a.ctaClicks || 0), 0) +
    books.reduce((sum, b) => sum + (b.ctaClicks || 0), 0) +
    circles.reduce((sum, c) => sum + (c.ctaClicks || 0), 0) +
    posts.reduce((sum, p) => sum + (p.ctaClicks || 0), 0) +
    updates.reduce((sum, u) => sum + (u.ctaClicks || 0), 0);

  const engagementPct =
    visitors24h > 0 ? Math.min(999, (postLikes / visitors24h) * 100) : 0;

  document.getElementById("stats-visitors").textContent = visitors24h;
  document.getElementById("stats-engagement").textContent =
    engagementPct.toFixed(1) + "%";
  document.getElementById("stats-conversion").textContent = outboundClicks;
  document.getElementById("stats-likes").textContent = postLikes;

  // ── Distribution Bars ──
  const barsData = [
    { name: "Apps", count: apps.length },
    { name: "Books", count: books.length },
    { name: "Circles", count: circles.length },
    { name: "Posts", count: posts.length },
    { name: "Poll", count: polls.length },
    { name: "Stories", count: stories.length },
    { name: "Notification", count: notis.length },
    { name: "Subscribers", count: subs.length },
    { name: "Updates", count: updates.length },
    { name: "Quests", count: quests.length },
  ];
  barsData.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.name.localeCompare(b.name);
  });
  const maxCount = Math.max(...barsData.map((b) => b.count), 1);

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
  quests.forEach((i) =>
    all.push({ type: "Quest", name: i.subject, time: i.createdAt }),
  );
  stories.forEach((i) =>
    all.push({ type: "Story", name: i.title, time: i.createdAt }),
  );
  polls.forEach((i) =>
    all.push({ type: "Poll", name: i.question, time: i.createdAt }),
  );
  updates.forEach((i) =>
    all.push({ type: "Update", name: i.title, time: i.createdAt }),
  );
  notis.forEach((i) =>
    all.push({ type: "Notification", name: i.title, time: i.createdAt }),
  );
  subs.forEach((i) =>
    all.push({
      type: "Subscriber",
      name: i.name || i.email,
      time: i.createdAt,
    }),
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
