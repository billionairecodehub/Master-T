// admin/js/content.js — Apps / Books / Circles CRUD

let activeContentTab = "apps";
let activeContentSection = "apps";

// ── Section tabs config ──────────────────────────────

const CONTENT_SECTION_TABS = {
  feed: ["View", "Create", "Draft", "Manage"],
  quest: ["View", "Create", "Draft", "Manage"],
  stories: ["View", "Create", "Draft", "Manage"],
  updates: ["View", "Create", "Draft", "Manage"],
  poll: ["View", "Create", "Draft", "Manage"],
  apps: ["View", "Create", "Draft", "Manage"],
  books: ["View", "Create", "Draft", "Manage"],
  circle: ["View", "Create", "Draft", "Manage"],
  notifications: ["View", "Create", "Draft", "Manage"],
  editprofile: ["Details", "CTA", "Message", "About"],
  subscribers: ["All", "Stats"],
};

// Section to old content-tab mapping (for grids)
const SECTION_TO_TAB = { apps: "apps", books: "books", circle: "circles" };

function showContentSection(section) {
  activeContentSection = section;

  // Hide all section areas
  document.querySelectorAll(".content-section-area").forEach((el) => {
    el.style.display = "none";
  });

  // Show target area
  const area = document.getElementById("content-area-" + section);
  if (area) area.style.display = "block";

  // For grids that use the old list, trigger a render
  const tab = SECTION_TO_TAB[section];
  if (tab) {
    activeContentTab = tab;
    document.getElementById("content-apps").style.display =
      tab === "apps" ? "flex" : "none";
    document.getElementById("content-books").style.display =
      tab === "books" ? "flex" : "none";
    document.getElementById("content-circles").style.display =
      tab === "circles" ? "flex" : "none";
    refreshContent();
  }

  // Build section tabs row
  const tabs = CONTENT_SECTION_TABS[section] || ["View"];
  const tabsEl = document.getElementById("content-section-tabs");
  tabsEl.innerHTML = tabs
    .map(
      (t, i) =>
        `<div class="content-section-tab${i === 0 ? " active" : ""}" data-section-tab="${t}">${t}</div>`,
    )
    .join("");

  tabsEl.querySelectorAll(".content-section-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      tabsEl
        .querySelectorAll(".content-section-tab")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });
}

// ── Refresh lists ────────────────────────────────────

function refreshContent() {
  renderAppsList();
  renderBooksList();
  renderCirclesList();
}

function renderAppsList() {
  const apps = DataStore.getAll("apps");
  const container = document.getElementById("content-apps");
  if (apps.length === 0) {
    container.innerHTML =
      '<div class="admin-empty"><div class="admin-empty-icon">📱</div><div class="admin-empty-text">No apps yet</div></div>';
    return;
  }
  container.innerHTML = apps
    .map(
      (a) => `
      <div class="admin-list-item" data-app-id="${a.id}">
        <img src="${a.img || ""}" alt="${a.name}" class="admin-list-icon" />
        <div class="admin-list-info">
          <div class="admin-list-name">${a.name}${a.pinned ? '<span class="pinned-badge">PINNED</span>' : ""}</div>
          <div class="admin-list-meta">${a.platform || ""} · ${a.version || ""}</div>
        </div>
        <div class="admin-list-action">›</div>
      </div>`,
    )
    .join("");

  container.querySelectorAll("[data-app-id]").forEach((el) => {
    el.addEventListener("click", () => {
      openAppModal(DataStore.getById("apps", el.getAttribute("data-app-id")));
    });
  });
}

function renderBooksList() {
  const books = DataStore.getAll("books");
  const container = document.getElementById("content-books");
  if (books.length === 0) {
    container.innerHTML =
      '<div class="admin-empty"><div class="admin-empty-icon">📖</div><div class="admin-empty-text">No books yet</div></div>';
    return;
  }
  container.innerHTML = books
    .map(
      (b) => `
      <div class="admin-list-item" data-book-id="${b.id}">
        <img src="${b.img || ""}" alt="${b.name}" class="admin-list-icon" />
        <div class="admin-list-info">
          <div class="admin-list-name">${b.name}${b.pinned ? '<span class="pinned-badge">PINNED</span>' : ""}</div>
          <div class="admin-list-meta"><span class="content-list-price">${b.price || ""}</span> · ★ ${b.rating || "—"}</div>
        </div>
        <div class="admin-list-action">›</div>
      </div>`,
    )
    .join("");

  container.querySelectorAll("[data-book-id]").forEach((el) => {
    el.addEventListener("click", () => {
      openBookModal(
        DataStore.getById("books", el.getAttribute("data-book-id")),
      );
    });
  });
}

function renderCirclesList() {
  const circles = DataStore.getAll("circles");
  const container = document.getElementById("content-circles");
  if (circles.length === 0) {
    container.innerHTML =
      '<div class="admin-empty"><div class="admin-empty-icon">👥</div><div class="admin-empty-text">No circles yet</div></div>';
    return;
  }
  container.innerHTML = circles
    .map(
      (c) => `
      <div class="admin-list-item" data-circle-id="${c.id}">
        <img src="${c.img || ""}" alt="${c.name}" class="admin-list-icon" />
        <div class="admin-list-info">
          <div class="admin-list-name">${c.name}</div>
          <div class="admin-list-meta">${c.category || ""} · ${c.platform || ""}</div>
        </div>
        <div class="admin-list-action">›</div>
      </div>`,
    )
    .join("");

  container.querySelectorAll("[data-circle-id]").forEach((el) => {
    el.addEventListener("click", () => {
      openCircleModal(
        DataStore.getById("circles", el.getAttribute("data-circle-id")),
      );
    });
  });
}

// ── App Modal ────────────────────────────────────────

function openAppModal(app) {
  const modal = document.getElementById("modal-app");
  const delBtn = document.getElementById("delete-app-btn");

  if (app) {
    document.getElementById("modal-app-title").textContent = "Edit App";
    document.getElementById("app-edit-id").value = app.id;
    document.getElementById("app-name").value = app.name || "";
    document.getElementById("app-platform").value = app.platform || "";
    document.getElementById("app-version").value = app.version || "";
    document.getElementById("app-letter").value = app.letter || "";
    document.getElementById("app-img").value = app.img || "";
    document.getElementById("app-visual").value = app.visual || "";
    document.getElementById("app-ctaimg").value = app.ctaimg || "";
    document.getElementById("app-short").value = app.short || "";
    document.getElementById("app-desc").value = app.desc || "";
    document.getElementById("app-rating").value = app.rating || "";
    document.getElementById("app-ratingcount").value = app.ratingcount || "";
    document.getElementById("app-ratingtext").value = app.ratingtext || "";
    document.getElementById("app-pinned").checked = !!app.pinned;
    delBtn.style.display = "block";
  } else {
    document.getElementById("modal-app-title").textContent = "New App";
    document.getElementById("app-edit-id").value = "";
    document
      .querySelectorAll(
        "#modal-app .admin-field-input, #modal-app .admin-field-textarea",
      )
      .forEach((f) => (f.value = ""));
    document.getElementById("app-pinned").checked = false;
    delBtn.style.display = "none";
  }

  modal.classList.add("open");
}

document.getElementById("save-app-btn").addEventListener("click", () => {
  const id = document.getElementById("app-edit-id").value;
  const data = {
    name: document.getElementById("app-name").value.trim(),
    platform: document.getElementById("app-platform").value.trim(),
    version: document.getElementById("app-version").value.trim(),
    letter: document.getElementById("app-letter").value.trim().toUpperCase(),
    img: document.getElementById("app-img").value.trim(),
    visual: document.getElementById("app-visual").value.trim(),
    ctaimg: document.getElementById("app-ctaimg").value.trim(),
    short: document.getElementById("app-short").value.trim(),
    desc: document.getElementById("app-desc").value.trim(),
    rating: document.getElementById("app-rating").value.trim(),
    ratingcount: document.getElementById("app-ratingcount").value.trim(),
    ratingtext: document.getElementById("app-ratingtext").value.trim(),
    pinned: document.getElementById("app-pinned").checked,
  };

  if (!data.name) return alert("Name is required");

  if (data.pinned) {
    DataStore.getAll("apps").forEach((a) => {
      if (a.id !== id && a.pinned)
        DataStore.update("apps", a.id, { pinned: false });
    });
  }

  if (id) DataStore.update("apps", id, data);
  else DataStore.add("apps", data);

  document.getElementById("modal-app").classList.remove("open");
  refreshContent();
});

document.getElementById("delete-app-btn").addEventListener("click", () => {
  const id = document.getElementById("app-edit-id").value;
  if (!id || !confirm("Delete this app?")) return;
  DataStore.remove("apps", id);
  document.getElementById("modal-app").classList.remove("open");
  refreshContent();
});

document.getElementById("modal-app-close").addEventListener("click", () => {
  document.getElementById("modal-app").classList.remove("open");
});

// ── Book Modal ───────────────────────────────────────

function openBookModal(book) {
  const modal = document.getElementById("modal-book");
  const delBtn = document.getElementById("delete-book-btn");

  if (book) {
    document.getElementById("modal-book-title").textContent = "Edit Book";
    document.getElementById("book-edit-id").value = book.id;
    document.getElementById("book-name").value = book.name || "";
    document.getElementById("book-price").value = book.price || "";
    document.getElementById("book-img").value = book.img || "";
    document.getElementById("book-visual").value = book.visual || "";
    document.getElementById("book-ctaimg").value = book.ctaimg || "";
    document.getElementById("book-short").value = book.short || "";
    document.getElementById("book-desc").value = book.desc || "";
    document.getElementById("book-keypoints").value = book.keypoints || "";
    document.getElementById("book-rating").value = book.rating || "";
    document.getElementById("book-ratingcount").value = book.ratingcount || "";
    document.getElementById("book-ratingplatforms").value =
      book.ratingplatforms || "";
    document.getElementById("book-ratingtext").value = book.ratingtext || "";
    document.getElementById("book-pinned").checked = !!book.pinned;
    delBtn.style.display = "block";
  } else {
    document.getElementById("modal-book-title").textContent = "New Book";
    document.getElementById("book-edit-id").value = "";
    document
      .querySelectorAll(
        "#modal-book .admin-field-input, #modal-book .admin-field-textarea",
      )
      .forEach((f) => (f.value = ""));
    document.getElementById("book-pinned").checked = false;
    delBtn.style.display = "none";
  }

  modal.classList.add("open");
}

document.getElementById("save-book-btn").addEventListener("click", () => {
  const id = document.getElementById("book-edit-id").value;
  const data = {
    name: document.getElementById("book-name").value.trim(),
    price: document.getElementById("book-price").value.trim(),
    img: document.getElementById("book-img").value.trim(),
    visual: document.getElementById("book-visual").value.trim(),
    ctaimg: document.getElementById("book-ctaimg").value.trim(),
    short: document.getElementById("book-short").value.trim(),
    desc: document.getElementById("book-desc").value.trim(),
    keypoints: document.getElementById("book-keypoints").value.trim(),
    rating: document.getElementById("book-rating").value.trim(),
    ratingcount: document.getElementById("book-ratingcount").value.trim(),
    ratingplatforms: document
      .getElementById("book-ratingplatforms")
      .value.trim(),
    ratingtext: document.getElementById("book-ratingtext").value.trim(),
    pinned: document.getElementById("book-pinned").checked,
  };

  if (!data.name) return alert("Title is required");

  if (data.pinned) {
    DataStore.getAll("books").forEach((b) => {
      if (b.id !== id && b.pinned)
        DataStore.update("books", b.id, { pinned: false });
    });
  }

  if (id) DataStore.update("books", id, data);
  else DataStore.add("books", data);

  document.getElementById("modal-book").classList.remove("open");
  refreshContent();
});

document.getElementById("delete-book-btn").addEventListener("click", () => {
  const id = document.getElementById("book-edit-id").value;
  if (!id || !confirm("Delete this book?")) return;
  DataStore.remove("books", id);
  document.getElementById("modal-book").classList.remove("open");
  refreshContent();
});

document.getElementById("modal-book-close").addEventListener("click", () => {
  document.getElementById("modal-book").classList.remove("open");
});

// ── Circle Modal ─────────────────────────────────────

function openCircleModal(circle) {
  const modal = document.getElementById("modal-circle");
  const delBtn = document.getElementById("delete-circle-btn");

  if (circle) {
    document.getElementById("modal-circle-title").textContent = "Edit Circle";
    document.getElementById("circle-edit-id").value = circle.id;
    document.getElementById("circle-name").value = circle.name || "";
    document.getElementById("circle-category").value = circle.category || "";
    document.getElementById("circle-platform").value = circle.platform || "";
    document.getElementById("circle-about").value = circle.about || "";
    document.getElementById("circle-img").value = circle.img || "";
    delBtn.style.display = "block";
  } else {
    document.getElementById("modal-circle-title").textContent = "New Circle";
    document.getElementById("circle-edit-id").value = "";
    document
      .querySelectorAll(
        "#modal-circle .admin-field-input, #modal-circle .admin-field-textarea",
      )
      .forEach((f) => (f.value = ""));
    delBtn.style.display = "none";
  }

  modal.classList.add("open");
}

document.getElementById("save-circle-btn").addEventListener("click", () => {
  const id = document.getElementById("circle-edit-id").value;
  const data = {
    name: document.getElementById("circle-name").value.trim(),
    category: document.getElementById("circle-category").value.trim(),
    platform: document.getElementById("circle-platform").value.trim(),
    about: document.getElementById("circle-about").value.trim(),
    img: document.getElementById("circle-img").value.trim(),
  };

  if (!data.name) return alert("Name is required");

  if (id) DataStore.update("circles", id, data);
  else DataStore.add("circles", data);

  document.getElementById("modal-circle").classList.remove("open");
  refreshContent();
});

document.getElementById("delete-circle-btn").addEventListener("click", () => {
  const id = document.getElementById("circle-edit-id").value;
  if (!id || !confirm("Delete this circle?")) return;
  DataStore.remove("circles", id);
  document.getElementById("modal-circle").classList.remove("open");
  refreshContent();
});

document.getElementById("modal-circle-close").addEventListener("click", () => {
  document.getElementById("modal-circle").classList.remove("open");
});

// ── FAB routes to correct modal ──────────────────────

document.getElementById("fab-content").addEventListener("click", () => {
  if (activeContentTab === "apps") openAppModal(null);
  else if (activeContentTab === "books") openBookModal(null);
  else if (activeContentTab === "circles") openCircleModal(null);
});
