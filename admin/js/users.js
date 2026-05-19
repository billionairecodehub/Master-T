/* global DataStore */
"use strict";

// ─── State ────────────────────────────────────────────────────────────────────
let _usersSearchQuery = "";
let _usersCurrentId = null;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function _usersQS(id) {
  return document.getElementById(id);
}

function _fmt(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function _fmtFull(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function _startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function _startOfWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d.getTime();
}

// ─── Stats ────────────────────────────────────────────────────────────────────
function _renderUsersStats(users) {
  const now = Date.now();
  const todayStart = _startOfDay(now);
  const weekStart = _startOfWeek(now);

  const total = users.length;
  const today = users.filter(
    (u) => (u.signupAt || u.joinedAt || 0) >= todayStart,
  ).length;
  const week = users.filter(
    (u) => (u.signupAt || u.joinedAt || 0) >= weekStart,
  ).length;
  const male = users.filter(
    (u) => (u.gender || "").toLowerCase() === "male",
  ).length;
  const female = users.filter(
    (u) => (u.gender || "").toLowerCase() === "female",
  ).length;

  const set = (id, val) => {
    const el = _usersQS(id);
    if (el) el.textContent = val;
  };

  set("users-stat-total", total);
  set("users-stat-today", today);
  set("users-stat-week", week);
  set("users-stat-male", male);
  set("users-stat-female", female);

  const meta = _usersQS("users-meta");
  if (meta) {
    meta.textContent = `${total} registered user${total !== 1 ? "s" : ""} · last updated ${_fmtFull(now)}`;
  }
}

// ─── Board ────────────────────────────────────────────────────────────────────
function _renderUsersBoard(users) {
  const board = _usersQS("users-board");
  if (!board) return;

  const q = _usersSearchQuery.toLowerCase().trim();
  const filtered = q
    ? users.filter(
        (u) =>
          (u.fullName || "").toLowerCase().includes(q) ||
          (u.email || "").toLowerCase().includes(q) ||
          (u.username || "").toLowerCase().includes(q),
      )
    : users;

  if (!filtered.length) {
    board.innerHTML = `<div class="users-empty">${
      q ? "No users match your search" : "No registered users yet"
    }</div>`;
    return;
  }

  // Newest first
  const sorted = [...filtered].sort(
    (a, b) => (b.signupAt || b.joinedAt || 0) - (a.signupAt || a.joinedAt || 0),
  );

  board.innerHTML = sorted
    .map((u) => {
      const fallback =
        "https://i.postimg.cc/nhdyR4kF/Mt-Profile-Fallback-Img.png";
      const avatar = u.avatar || fallback;
      const gender = u.gender || "—";
      const joined = _fmt(u.signupAt || u.joinedAt);

      return `
      <div class="users-row-card" data-user-id="${u.userId || u.id || ""}">
        <img
          class="users-row-avatar"
          src="${avatar}"
          alt="${u.fullName || "User"}"
          onerror="this.src='${fallback}'"
        />
        <div class="users-row-info">
          <div class="users-row-name">${u.fullName || "(no name)"}</div>
          <div class="users-row-email">${u.email || "—"}</div>
        </div>
        <div class="users-row-meta">
          <div class="users-row-badge">${gender}</div>
          <div class="users-row-date">${joined}</div>
        </div>
      </div>
    `;
    })
    .join("");

  // Row click → open detail drawer
  board.querySelectorAll(".users-row-card").forEach((card) => {
    card.addEventListener("click", () => {
      const uid = card.getAttribute("data-user-id");
      _openUserDetail(uid, users);
    });
  });
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────
function _openUserDetail(userId, users) {
  const user = users.find((u) => (u.userId || u.id) === userId);
  if (!user) return;

  _usersCurrentId = userId;

  const fallback = "https://i.postimg.cc/nhdyR4kF/Mt-Profile-Fallback-Img.png";
  const avatar = user.avatar || fallback;

  const body = _usersQS("users-drawer-body");
  if (body) {
    body.innerHTML = `
      <div class="users-detail-avatar-row">
        <img
          class="users-detail-avatar"
          src="${avatar}"
          alt="${user.fullName || "User"}"
          onerror="this.src='${fallback}'"
        />
        <div class="users-detail-name-block">
          <div class="users-detail-display-name">${user.fullName || "—"}</div>
          <div class="users-detail-username">@${user.username || "—"}</div>
        </div>
      </div>

      <div class="users-detail-field">
        <div class="users-detail-label">Email</div>
        <div class="users-detail-value">${user.email || "—"}</div>
      </div>

      <div class="users-detail-field">
        <div class="users-detail-label">Gender</div>
        <div class="users-detail-value">${user.gender || "—"}</div>
      </div>

      <div class="users-detail-field">
        <div class="users-detail-label">Marital Status</div>
        <div class="users-detail-value">${user.marital || "—"}</div>
      </div>

      <div class="users-detail-field">
        <div class="users-detail-label">Joined</div>
        <div class="users-detail-value">${_fmtFull(user.signupAt || user.joinedAt)}</div>
      </div>

      <div class="users-detail-field">
        <div class="users-detail-label">User ID</div>
        <div class="users-detail-value">${user.userId || user.id || "—"}</div>
      </div>
    `;
  }

  const drawer = _usersQS("users-drawer");
  if (drawer) drawer.style.display = "flex";
}

function _closeUserDetail() {
  const drawer = _usersQS("users-drawer");
  if (drawer) drawer.style.display = "none";
  _usersCurrentId = null;
}

function _deleteCurrentUser() {
  if (!_usersCurrentId) return;
  if (!confirm("Delete this user record? This cannot be undone.")) return;

  if (typeof DataStore !== "undefined" && DataStore.remove) {
    DataStore.remove("users", _usersCurrentId);
  }

  _closeUserDetail();
  refreshUsers();
}

// ─── Setup listeners (called once after HTML injection) ───────────────────────
let _usersListenersReady = false;
function _setupUsersListeners() {
  if (_usersListenersReady) return;
  _usersListenersReady = true;

  const back = _usersQS("users-drawer-back");
  if (back) back.addEventListener("click", _closeUserDetail);

  const del = _usersQS("users-drawer-delete");
  if (del) del.addEventListener("click", _deleteCurrentUser);

  const refreshBtn = _usersQS("users-refresh-btn");
  if (refreshBtn) refreshBtn.addEventListener("click", refreshUsers);

  const search = _usersQS("users-search");
  if (search) {
    search.addEventListener("input", () => {
      _usersSearchQuery = search.value;
      const users =
        typeof DataStore !== "undefined" ? DataStore.getAll("users") : [];
      _renderUsersBoard(users);
    });
  }
}

// ─── Public entry point (called by admin appindex.js) ────────────────────────
function refreshUsers() {
  _setupUsersListeners();
  const users =
    typeof DataStore !== "undefined" ? DataStore.getAll("users") : [];
  _renderUsersStats(users);
  _renderUsersBoard(users);
}
