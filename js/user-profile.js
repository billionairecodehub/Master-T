function _formatUserAgeFromJoin(joinedAt) {
  const joinTime = Number(joinedAt) || Date.now();
  const diffMs = Math.max(0, Date.now() - joinTime);
  const days = Math.max(1, Math.floor(diffMs / 86400000));
  return days + "d ago";
}

function refreshUserProfile() {
  const fallbackAvatar =
    "https://i.postimg.cc/nhdyR4kF/Mt-Profile-Fallback-Img.png";
  const raw = localStorage.getItem("mt_auth_user");
  if (!raw) return;

  let user;
  try {
    user = JSON.parse(raw);
  } catch {
    return;
  }

  const avatarEl = document.getElementById("user-profile-avatar");
  const nameEl = document.getElementById("user-profile-name-value");
  const emailEl = document.getElementById("user-profile-email");
  const genderEl = document.getElementById("user-profile-gender");
  const maritalEl = document.getElementById("user-profile-marital");
  const ageEl = document.getElementById("user-profile-account");

  if (avatarEl) avatarEl.src = user.avatar || fallbackAvatar;
  if (nameEl) nameEl.textContent = user.name || "Justbgoodd";
  if (emailEl) emailEl.textContent = user.email || "getinwithgame@gmail.com";
  if (genderEl) genderEl.textContent = user.gender || "Male";
  if (maritalEl) maritalEl.textContent = user.status || "Single";
  if (ageEl) ageEl.textContent = _formatUserAgeFromJoin(user.joinedAt);

  const metaEl = document.getElementById("user-resources-meta");
  if (metaEl) {
    const uname = user.name || "Justbgoodd";
    metaEl.textContent = "Book Purchased By " + uname;
  }
}

function _getCurrentAuthUser() {
  const raw = localStorage.getItem("mt_auth_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function _buildConsultId(user) {
  const seed = String(user?.id || user?.email || "guest");
  const clean = seed.replace(/[^a-z0-9]/gi, "").toUpperCase();
  return "MT-" + clean.slice(0, 10).padEnd(10, "X");
}

function _isSubscribedUser(user) {
  if (!user || !user.email || typeof DataStore === "undefined") return false;
  const email = String(user.email).trim().toLowerCase();
  const subs = DataStore.getAll("subscribers") || [];
  return subs.some((s) => String(s.email || "").trim().toLowerCase() === email);
}

function _getPurchasedBookIds() {
  const keys = [
    "mt_user_purchased_books",
    "mt_purchased_books",
    "mt_books_purchased",
  ];

  for (const key of keys) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    try {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length) return arr;
    } catch {
      // Ignore invalid test data.
    }
  }
  return [];
}

function _getPurchasedBooks() {
  if (typeof DataStore === "undefined") return [];
  const books = DataStore.getAll("books").filter((b) => !b.draft);
  const ids = _getPurchasedBookIds();
  if (!ids.length) return [];

  const idSet = new Set(ids.map((id) => String(id)));
  return books.filter((b) => idSet.has(String(b.id)));
}

function _renderResourceBars(totalItems) {
  const bars = document.getElementById("user-resources-bars");
  if (!bars) return;
  const perPage = 4;
  const totalPages = Math.ceil(totalItems / perPage);

  if (totalPages <= 1) {
    bars.innerHTML = "";
    return;
  }

  let html = "";
  for (let i = 0; i < totalPages; i++) {
    html += `<span class="user-resource-bar ${i === 0 ? "is-on" : ""}" data-index="${i}"></span>`;
  }
  bars.innerHTML = html;
}

function _renderResourcesBoard() {
  const wrap = document.getElementById("user-resources-scroll");
  if (!wrap) return;

  const books = _getPurchasedBooks();
  if (!books.length) {
    wrap.innerHTML = '<div class="user-resource-empty">No purchased books yet</div>';
    _renderResourceBars(0);
    return;
  }

  const fallback = "https://i.postimg.cc/VNY8Ymks/image.png";
  wrap.innerHTML = books
    .map(
      (b) => `<button class="user-resource-item" data-id="${b.id}" type="button" aria-label="Open ${b.name}">
      <img class="user-resource-thumb" src="${b.img || fallback}" alt="${b.name}" />
      <div class="user-resource-title">${b.name}</div>
    </button>`,
    )
    .join("");

  _renderResourceBars(books.length);

  wrap.querySelectorAll(".user-resource-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      if (typeof _openHomeBookInStore === "function") _openHomeBookInStore(id);
    });
  });

  wrap.addEventListener("scroll", () => {
    const bars = Array.from(document.querySelectorAll(".user-resource-bar"));
    if (!bars.length) return;
    const idx = Math.min(
      bars.length - 1,
      Math.max(0, Math.round(wrap.scrollLeft / Math.max(1, wrap.clientWidth))),
    );
    bars.forEach((b, i) => b.classList.toggle("is-on", i === idx));
  });
}

function setupUserProfileInteractions() {
  const nameEl = document.getElementById("user-profile-name-value");
  const detailsBtn = document.getElementById("user-profile-details");
  const detailsView = document.getElementById("user-profile-details-view");
  const mainView = document.getElementById("user-profile-main-view");
  const detailsBackBtn = document.getElementById("user-profile-details-back");
  const copyBtn = document.getElementById("user-consult-copy-btn");
  const supportMailBtn = document.getElementById("user-support-email-btn");

  if (nameEl) {
    nameEl.addEventListener("dblclick", () => {
      const raw = localStorage.getItem("mt_auth_user");
      if (!raw) return;
      let user;
      try {
        user = JSON.parse(raw);
      } catch {
        return;
      }

      const next = window.prompt("Edit username", user.name || "");
      if (!next) return;
      const clean = next.trim();
      if (!clean) return;
      user.name = clean;
      localStorage.setItem("mt_auth_user", JSON.stringify(user));
      refreshUserProfile();
    });
  }

  const openDetails = () => {
    if (mainView) mainView.style.display = "none";
    if (detailsView) detailsView.style.display = "flex";
    _renderResourcesBoard();
  };

  const closeDetails = () => {
    if (detailsView) detailsView.style.display = "none";
    if (mainView) mainView.style.display = "flex";
  };

  if (detailsBtn) {
    detailsBtn.addEventListener("click", openDetails);
  }
  if (detailsBackBtn) {
    detailsBackBtn.addEventListener("click", closeDetails);
  }

  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      const note = document.getElementById("user-consult-note");
      const user = _getCurrentAuthUser();
      if (!_isSubscribedUser(user)) {
        if (note) note.textContent = "Available for subscribed users only";
        return;
      }

      const consultId = _buildConsultId(user);
      try {
        await navigator.clipboard.writeText(consultId);
        if (note) note.textContent = "Consult ID copied";
      } catch {
        if (note) note.textContent = "Unable to copy now";
      }
    });
  }

  const openSupport = () => {
    window.location.href =
      "mailto:Support@getinwithgame.com?subject=Support%20Request";
  };
  if (supportMailBtn) supportMailBtn.addEventListener("click", openSupport);

  window.addEventListener("mt:remote-update", (e) => {
    const changed = e.detail?.changed || null;
    if (!changed || changed === "books") _renderResourcesBoard();
  });

  window.addEventListener("storage", (e) => {
    if (!e.key) return;
    if (
      e.key === "mt_user_purchased_books" ||
      e.key === "mt_purchased_books" ||
      e.key === "mt_books_purchased"
    ) {
      _renderResourcesBoard();
    }
  });
}

function setupUserProfileLogout() {
  const logoutBtn = document.getElementById("user-profile-logout");
  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("mt_auth_state");
    localStorage.removeItem("mt_auth_user");
    localStorage.setItem("mt_auth_start_seen", "1");

    const authPage = document.getElementById("auth-page");
    const main = document.querySelector(".main");
    if (main) main.style.display = "none";
    if (authPage) authPage.style.display = "flex";
    if (typeof showAuthScreen === "function")
      showAuthScreen("auth-screen-signin");

    if (typeof _setActiveNav === "function") _setActiveNav("");
    if (typeof _navigateTo === "function") _navigateTo("/");
  });
}

window.refreshUserProfile = refreshUserProfile;
refreshUserProfile();
setupUserProfileInteractions();
setupUserProfileLogout();
