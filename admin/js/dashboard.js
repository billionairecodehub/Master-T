// admin/js/dashboard.js — Dashboard page logic

function refreshDashboard() {
  // Stats overview moved to Stats page
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

// ── Home Board Click Handlers ──

document.querySelectorAll(".home-board").forEach((board) => {
  board.addEventListener("click", () => {
    const section = board.getAttribute("data-section");
    showAdminPage("content");
    // Unlock content: hide lock screen, restore tabs
    const lock = document.getElementById("content-lock-screen");
    if (lock) lock.classList.remove("visible");
    const tabs = document.getElementById("content-section-tabs");
    if (tabs) tabs.style.display = "";
    if (typeof showContentSection === "function") {
      setTimeout(() => showContentSection(section), 50);
    }
  });
});

// ══════════════════════════════════════════════════════
// NOTIFICATIONS CRUD
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

document.getElementById("noti-add-new").addEventListener("click", () => {
  closeModal("modal-noti-list");
  openNotiNew();
});

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
});

// ══════════════════════════════════════════════════════
// EDIT PROFILE
// ══════════════════════════════════════════════════════

document.getElementById("profile-save").addEventListener("click", () => {
  DataStore.setProfile({
    mentorshipPrice: document.getElementById("profile-price").value.trim(),
    mentorshipPeriod: document.getElementById("profile-period").value.trim(),
    aboutText: document.getElementById("profile-about").value.trim(),
  });
  closeModal("modal-profile");
});

// ══════════════════════════════════════════════════════
// MANAGE SUBSCRIBERS
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
    });
  });
}
