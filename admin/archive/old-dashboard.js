// ARCHIVED — Old Dashboard JS
// Moved here from js/dashboard.js
// Keep for future reference. Not loaded or executed.

// ── Old refreshDashboard (stat card population + recently added) ──

function refreshDashboard_OLD() {
  document.getElementById("stat-apps").textContent = DataStore.count("apps");
  document.getElementById("stat-books").textContent = DataStore.count("books");
  document.getElementById("stat-circles").textContent =
    DataStore.count("circles");
  document.getElementById("stat-posts").textContent = DataStore.count("posts");
  document.getElementById("stat-notifications").textContent =
    DataStore.count("notifications");
  document.getElementById("stat-subscribers").textContent =
    DataStore.count("subscribers");

  const all = [];
  DataStore.getAll("apps").forEach((i) =>
    all.push({ type: "App", name: i.name, time: i.createdAt }),
  );
  DataStore.getAll("books").forEach((i) =>
    all.push({ type: "Book", name: i.name, time: i.createdAt }),
  );
  DataStore.getAll("circles").forEach((i) =>
    all.push({ type: "Circle", name: i.name, time: i.createdAt }),
  );
  DataStore.getAll("posts").forEach((i) =>
    all.push({ type: "Post", name: i.subject, time: i.createdAt }),
  );
  DataStore.getAll("notifications").forEach((i) =>
    all.push({ type: "Notification", name: i.title, time: i.createdAt }),
  );

  all.sort((a, b) => new Date(b.time) - new Date(a.time));

  const recentEl = document.getElementById("dashboard-recent");
  recentEl.innerHTML = all
    .slice(0, 5)
    .map(
      (item) => `
      <div class="dashboard-recent-item">
        <div class="dashboard-recent-dot"></div>
        <div class="dashboard-recent-text">${item.type}: ${item.name}</div>
        <div class="dashboard-recent-time">${_timeAgo(item.time)}</div>
      </div>`,
    )
    .join("");
}

// ── Old Quick Action button listeners ──

document.querySelectorAll(".dashboard-action-btn[data-goto]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const goto = btn.getAttribute("data-goto");
    const tab = btn.getAttribute("data-tab");
    const action = btn.getAttribute("data-action");

    showAdminPage(goto);

    if (goto === "content" && tab) {
      setTimeout(() => {
        const tabEl = document.querySelector(`[data-content-tab="${tab}"]`);
        if (tabEl) tabEl.click();
        if (action === "new") {
          setTimeout(() => document.getElementById("fab-content").click(), 100);
        }
      }, 50);
    }

    if (goto === "posts" && action === "new") {
      setTimeout(() => document.getElementById("fab-post").click(), 100);
    }
  });
});

document
  .getElementById("action-new-notification")
  .addEventListener("click", () => {
    renderNotiList();
    openModal("modal-noti-list");
  });

document.getElementById("action-edit-profile").addEventListener("click", () => {
  const p = DataStore.getProfile();
  document.getElementById("profile-price").value = p.mentorshipPrice || "";
  document.getElementById("profile-period").value = p.mentorshipPeriod || "";
  document.getElementById("profile-about").value = p.aboutText || "";
  openModal("modal-profile");
});

document.getElementById("action-manage-subs").addEventListener("click", () => {
  renderSubsList();
  openModal("modal-subscribers");
});
