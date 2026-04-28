// admin/js/dashboard.js — Dashboard page logic

function refreshDashboard() {
  document.getElementById("stat-apps").textContent = DataStore.count("apps");
  document.getElementById("stat-books").textContent = DataStore.count("books");
  document.getElementById("stat-circles").textContent =
    DataStore.count("circles");
  document.getElementById("stat-posts").textContent = DataStore.count("posts");
  document.getElementById("stat-notifications").textContent =
    DataStore.count("notifications");
  document.getElementById("stat-subscribers").textContent =
    DataStore.count("subscribers");

  // Recent items (last 5 across all types)
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

function _timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return mins + "m ago";
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + "h ago";
  const days = Math.floor(hrs / 24);
  return days + "d ago";
}

// ── Modal helpers ──
function openModal(id) {
  document.getElementById(id).style.display = "flex";
}
function closeModal(id) {
  document.getElementById(id).style.display = "none";
}

document.querySelectorAll("[data-close]").forEach((btn) => {
  btn.addEventListener("click", () =>
    closeModal(btn.getAttribute("data-close")),
  );
});

// ── Quick action buttons (existing: posts/content) ──
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

// ══════════════════════════════════════════════════════
// ── NOTIFICATIONS CRUD ──
// ══════════════════════════════════════════════════════

function renderNotiList() {
  const notis = DataStore.getAll("notifications");
  const body = document.getElementById("noti-list-body");
  if (notis.length === 0) {
    body.innerHTML = '<div class="dash-empty">No notifications yet</div>';
    return;
  }
  body.innerHTML = notis
    .map(
      (n) => `
    <div class="dash-list-item">
      <div class="dash-list-info">
        <div class="dash-list-name">${n.title}</div>
        <div class="dash-list-sub">${_timeAgo(n.createdAt)}</div>
      </div>
      <div class="dash-list-actions">
        <button class="dash-btn-sm" data-noti-edit="${n.id}">Edit</button>
        <button class="dash-btn-sm dash-btn-danger" data-noti-del="${n.id}">Del</button>
      </div>
    </div>`,
    )
    .join("");

  body.querySelectorAll("[data-noti-edit]").forEach((btn) => {
    btn.addEventListener("click", () =>
      openNotiEdit(btn.getAttribute("data-noti-edit")),
    );
  });
  body.querySelectorAll("[data-noti-del]").forEach((btn) => {
    btn.addEventListener("click", () => {
      DataStore.remove("notifications", btn.getAttribute("data-noti-del"));
      renderNotiList();
      refreshDashboard();
    });
  });
}

function openNotiEdit(id) {
  const n = DataStore.getById("notifications", id);
  if (!n) return;
  document.getElementById("noti-edit-id").value = id;
  document.getElementById("noti-title").value = n.title;
  document.getElementById("noti-content").value = n.content;
  document.getElementById("noti-modal-title").textContent = "Edit Notification";
  closeModal("modal-noti-list");
  openModal("modal-notification");
}

function openNotiNew() {
  document.getElementById("noti-edit-id").value = "";
  document.getElementById("noti-title").value = "";
  document.getElementById("noti-content").value = "";
  document.getElementById("noti-modal-title").textContent =
    "Create Notification";
  openModal("modal-notification");
}

// Create Notification quick action → show list first
document
  .getElementById("action-new-notification")
  .addEventListener("click", () => {
    renderNotiList();
    openModal("modal-noti-list");
  });

// "+ New" inside list modal
document.getElementById("noti-add-new").addEventListener("click", () => {
  closeModal("modal-noti-list");
  openNotiNew();
});

// Save notification
document.getElementById("noti-save").addEventListener("click", () => {
  const id = document.getElementById("noti-edit-id").value;
  const title = document.getElementById("noti-title").value.trim();
  const content = document.getElementById("noti-content").value.trim();
  if (!title) return;

  if (id) {
    DataStore.update("notifications", id, { title, content });
  } else {
    DataStore.add("notifications", {
      title,
      content,
      author: "Master Togan",
      timeframe: "just now",
    });
  }
  closeModal("modal-notification");
  refreshDashboard();
});

// ══════════════════════════════════════════════════════
// ── EDIT PROFILE ──
// ══════════════════════════════════════════════════════

document.getElementById("action-edit-profile").addEventListener("click", () => {
  const p = DataStore.getProfile();
  document.getElementById("profile-price").value = p.mentorshipPrice || "";
  document.getElementById("profile-period").value = p.mentorshipPeriod || "";
  document.getElementById("profile-about").value = p.aboutText || "";
  openModal("modal-profile");
});

document.getElementById("profile-save").addEventListener("click", () => {
  DataStore.setProfile({
    mentorshipPrice: document.getElementById("profile-price").value.trim(),
    mentorshipPeriod: document.getElementById("profile-period").value.trim(),
    aboutText: document.getElementById("profile-about").value.trim(),
  });
  closeModal("modal-profile");
});

// ══════════════════════════════════════════════════════
// ── MANAGE SUBSCRIBERS ──
// ══════════════════════════════════════════════════════

function renderSubsList() {
  const subs = DataStore.getAll("subscribers");
  const body = document.getElementById("subs-list-body");
  if (subs.length === 0) {
    body.innerHTML = '<div class="dash-empty">No subscribers yet</div>';
    return;
  }
  body.innerHTML = subs
    .map(
      (s) => `
    <div class="dash-list-item">
      <div class="dash-list-info">
        <div class="dash-list-name">${s.name}</div>
        <div class="dash-list-sub">${s.email} · ${_timeAgo(s.createdAt)}</div>
      </div>
      <div class="dash-list-actions">
        <button class="dash-btn-sm dash-btn-danger" data-sub-del="${s.id}">Remove</button>
      </div>
    </div>`,
    )
    .join("");

  body.querySelectorAll("[data-sub-del]").forEach((btn) => {
    btn.addEventListener("click", () => {
      DataStore.remove("subscribers", btn.getAttribute("data-sub-del"));
      renderSubsList();
      refreshDashboard();
    });
  });
}

document.getElementById("action-manage-subs").addEventListener("click", () => {
  renderSubsList();
  openModal("modal-subscribers");
});
