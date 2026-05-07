// ── Menu: Dynamic rendering from DataStore ──

// Slug helper — matches the one in index.js for consistent URL generation
function _menuToSlug(str) {
  return (str || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const abcTitles = document.querySelectorAll(".abc-title");
const menuSearchInput = document.querySelector(".menu-search-input");
const menuFilterIcon = document.querySelector(".filter-icon");
const menuPanels = document.querySelectorAll(".menu-panel");
const menuHome = document.querySelector(".menu-home");
const appPanel = document.getElementById("panel-app");
const bookPanel = document.getElementById("panel-book");
const circlePanel = document.getElementById("panel-circle");

const searchPlaceholders = {
  apps: "Search Apps",
  books: "Search Books",
  circle: "Search Circle",
};

const FILTER_ICON_SRC = menuFilterIcon ? menuFilterIcon.src : "";
const BACK_CIRCLE_SRC = "https://i.postimg.cc/dtNjQWhf/App-Mode-Back-Icon.png";
const DEFAULT_ICON_IMG = "https://i.postimg.cc/VNY8Ymks/image.png";
const DEFAULT_VISUAL_IMG = "https://i.postimg.cc/VNY8Ymks/image.png";

// Expand state tracking
let _expandState = null; // { type: 'apps'|'books'|'circle', key: 'M'|'Romance' }
let _appGroups = {};
let _bookGroups = {};
let _circleGroups = {};

// ── ABC Tab Switching ──
abcTitles.forEach((title) => {
  title.addEventListener("click", () => {
    // Close any expand view first
    if (_expandState) closeExpandView();
    abcTitles.forEach((t) => t.classList.remove("active"));
    title.classList.add("active");
    const category = title.getAttribute("data-category");
    menuSearchInput.placeholder = searchPlaceholders[category];
    menuSearchInput.value = "";
    menuPanels.forEach((panel) => {
      panel.style.display =
        panel.getAttribute("data-panel") === category ? "flex" : "none";
    });
  });
});

// ── Expand View System ──
function openExpandView(type, key) {
  _expandState = { type, key };

  let container, items, sectionLabel, itemCls, gridCls, nameCls, searchPh;

  if (type === "apps") {
    container = document.getElementById("apps-panel");
    items = _appGroups[key] || [];
    sectionLabel = "getInWithgame " + key + " Apps Lists";
    itemCls = "menu-app";
    gridCls = "menu-app-grid";
    nameCls = ".menu-app-name";
    searchPh = "Search " + key + " Apps List";
  } else if (type === "books") {
    container = document.getElementById("books-panel");
    items = _bookGroups[key] || [];
    sectionLabel = key + " Books Lists";
    itemCls = "menu-book";
    gridCls = "menu-book-grid";
    nameCls = ".menu-book-name";
    searchPh = "Search " + key + " Books List";
  } else {
    container = document.getElementById("circle-panel");
    items = _circleGroups[key] || [];
    sectionLabel = key + " Circle Category";
    itemCls = "menu-circle";
    gridCls = "menu-circle-grid";
    nameCls = ".menu-circle-name";
    searchPh = "Search " + key + " Circle Category";
  }

  // Hide normal content
  const pinnedBoard = container.querySelector(".menu-pinned-board");
  const panelScroll = container.querySelector(".menu-panel-scroll");
  if (pinnedBoard) pinnedBoard.style.display = "none";
  if (panelScroll) panelScroll.style.display = "none";

  // Build expand view
  let expandView = container.querySelector(".menu-expand-view");
  if (!expandView) {
    expandView = document.createElement("div");
    expandView.className = "menu-expand-view";
    container.appendChild(expandView);
  }

  const itemsHTML = items
    .map(
      (item) =>
        `<div class="${itemCls}-item" data-id="${item.id}">
          <img src="${item.img || DEFAULT_ICON_IMG}" alt="${item.name}" class="${itemCls}-icon" />
          <div class="${itemCls}-name">${item.name}</div>
        </div>`,
    )
    .join("");

  expandView.innerHTML = `<div class="menu-section-label">${sectionLabel}</div>
       <div class="${gridCls}">${itemsHTML}</div>`;
  expandView.style.display = "flex";

  // Update search bar
  menuSearchInput.placeholder = searchPh;
  menuSearchInput.value = "";

  // Swap filter icon to back icon
  if (menuFilterIcon) {
    menuFilterIcon.src = BACK_CIRCLE_SRC;
    menuFilterIcon.style.cursor = "pointer";
  }

  // Rebind item clicks
  if (type === "apps") bindAppClicks();
  else if (type === "books") bindBookClicks();
  else bindCircleClicks();
}

function closeExpandView() {
  if (!_expandState) return;
  const type = _expandState.type;
  _expandState = null;

  let container;
  if (type === "apps") container = document.getElementById("apps-panel");
  else if (type === "books") container = document.getElementById("books-panel");
  else container = document.getElementById("circle-panel");

  const pinnedBoard = container.querySelector(".menu-pinned-board");
  const panelScroll = container.querySelector(".menu-panel-scroll");
  const expandView = container.querySelector(".menu-expand-view");
  if (pinnedBoard) pinnedBoard.style.display = "";
  if (panelScroll) panelScroll.style.display = "";
  if (expandView) expandView.style.display = "none";

  // Restore search bar
  const activeTab = document.querySelector(".abc-title.active");
  const category = activeTab ? activeTab.getAttribute("data-category") : "apps";
  menuSearchInput.placeholder = searchPlaceholders[category];
  menuSearchInput.value = "";

  // Restore filter icon
  if (menuFilterIcon && FILTER_ICON_SRC) {
    menuFilterIcon.src = FILTER_ICON_SRC;
  }
}

// Filter icon acts as back button when in expand mode
if (menuFilterIcon) {
  menuFilterIcon.addEventListener("click", () => {
    if (_expandState) closeExpandView();
  });
}

// ── Render Apps Panel ──
function renderMenuApps() {
  const container = document.getElementById("apps-panel");
  if (!container) return;
  const apps = DataStore.getAll("apps").filter((a) => !a.draft);

  // Pinned app
  const pinned = apps.find((a) => a.pinned);
  let pinnedHTML = "";
  if (pinned) {
    pinnedHTML = `
      <div class="menu-pinned-board">
        <div class="menu-section-label">Top Recommended App</div>
        <div class="menu-pinned-item menu-app-item" data-id="${pinned.id}">
          <img src="${pinned.img || DEFAULT_ICON_IMG}" alt="${pinned.name}" class="menu-pinned-icon" />
          <div class="menu-pinned-details">
            <div class="menu-pinned-name">${pinned.name}</div>
            <div class="menu-pinned-desc">${pinned.short}</div>
            <div class="menu-pinned-cta">View &gt;&gt;</div>
          </div>
        </div>
      </div>`;
  }

  // Group ALL apps by first letter
  const allApps = apps
    .filter((a) => /^[a-zA-Z]/.test(a.name))
    .sort((a, b) => a.name.localeCompare(b.name));
  _appGroups = {};
  allApps.forEach((a) => {
    const letter = (a.letter || a.name[0]).toUpperCase();
    if (!_appGroups[letter]) _appGroups[letter] = [];
    _appGroups[letter].push(a);
  });

  let gridHTML =
    '<div class="menu-panel-scroll"><div class="menu-section-label">getInWithgame Apps</div>';
  Object.keys(_appGroups)
    .sort()
    .forEach((letter) => {
      const all = _appGroups[letter];
      const visible = all.slice(0, 3);
      gridHTML += `<div class="menu-alpha-group" data-letter="${letter}"><div class="menu-alpha-letter expandable" data-letter="${letter}" data-type="apps">${letter}</div><div class="menu-app-grid">`;
      visible.forEach((a) => {
        gridHTML += `
        <div class="menu-app-item" data-id="${a.id}">
          <img src="${a.img || DEFAULT_ICON_IMG}" alt="${a.name}" class="menu-app-icon" />
          <div class="menu-app-name">${a.name}</div>
        </div>`;
      });
      gridHTML += "</div></div>";
    });
  gridHTML += "</div>";

  container.innerHTML = pinnedHTML + gridHTML;
  bindAppClicks();
  bindAlphaExpand(container, "apps");
}

// ── Render Books Panel ──
function renderMenuBooks() {
  const container = document.getElementById("books-panel");
  if (!container) return;
  const books = DataStore.getAll("books").filter((b) => !b.draft);

  // Pinned book
  const pinned = books.find((b) => b.pinned);
  let pinnedHTML = "";
  if (pinned) {
    pinnedHTML = `
      <div class="menu-pinned-board">
        <div class="menu-section-label">Top Book of the Week</div>
        <div class="menu-pinned-item menu-book-item" data-id="${pinned.id}">
          <img src="${pinned.img || DEFAULT_ICON_IMG}" alt="${pinned.name}" class="menu-pinned-icon" />
          <div class="menu-pinned-details">
            <div class="menu-pinned-name">${pinned.name}</div>
            <div class="menu-pinned-desc">${pinned.merit || pinned.short || ""}</div>
            <div class="menu-pinned-cta">View &gt;&gt;</div>
          </div>
        </div>
      </div>`;
  }

  // Group ALL books by first letter
  const allBooks = books
    .filter((b) => /^[a-zA-Z]/.test(b.name))
    .sort((a, b) => a.name.localeCompare(b.name));
  _bookGroups = {};
  allBooks.forEach((b) => {
    const letter = b.name[0].toUpperCase();
    if (!_bookGroups[letter]) _bookGroups[letter] = [];
    _bookGroups[letter].push(b);
  });

  let gridHTML =
    '<div class="menu-panel-scroll"><div class="menu-section-label">Books</div>';
  Object.keys(_bookGroups)
    .sort()
    .forEach((letter) => {
      const all = _bookGroups[letter];
      const visible = all.slice(0, 3);
      gridHTML += `<div class="menu-alpha-group" data-letter="${letter}"><div class="menu-alpha-letter expandable" data-letter="${letter}" data-type="books">${letter}</div><div class="menu-book-grid">`;
      visible.forEach((b) => {
        gridHTML += `
        <div class="menu-book-item" data-id="${b.id}">
          <img src="${b.img || DEFAULT_ICON_IMG}" alt="${b.name}" class="menu-book-icon" />
          <div class="menu-book-name">${b.name}</div>
        </div>`;
      });
      gridHTML += "</div></div>";
    });
  gridHTML += "</div>";

  container.innerHTML = pinnedHTML + gridHTML;
  bindBookClicks();
  bindAlphaExpand(container, "books");
}

// ── Render Circles Panel ──
function renderMenuCircles() {
  const container = document.getElementById("circle-panel");
  if (!container) return;
  const circles = DataStore.getAll("circles").filter((c) => !c.draft);

  let pinnedHTML = `
    <div class="menu-pinned-board">
      <div class="menu-circle-tagline">Togan's Circle; Find out other top profiles like Master Togan</div>
    </div>`;

  // Group by category
  _circleGroups = {};
  circles.forEach((c) => {
    const cat = c.category || "Other";
    if (!_circleGroups[cat]) _circleGroups[cat] = [];
    _circleGroups[cat].push(c);
  });
  // Sort within each category alphabetically
  Object.values(_circleGroups).forEach((arr) =>
    arr.sort((a, b) => a.name.localeCompare(b.name)),
  );

  let gridHTML = '<div class="menu-panel-scroll">';
  Object.keys(_circleGroups).forEach((cat) => {
    const all = _circleGroups[cat];
    const visible = all.slice(0, 3);
    gridHTML += `<div class="menu-circle-category" data-category="${cat}"><div class="menu-section-label menu-cat-label expandable" data-category="${cat}">${cat}</div><div class="menu-circle-grid">`;
    visible.forEach((c) => {
      gridHTML += `
        <div class="menu-circle-item" data-id="${c.id}">
          <img src="${c.img || DEFAULT_ICON_IMG}" alt="${c.name}" class="menu-circle-icon" />
          <div class="menu-circle-name">${c.name}</div>
        </div>`;
    });
    gridHTML += "</div></div>";
  });
  gridHTML += "</div>";

  container.innerHTML = pinnedHTML + gridHTML;
  bindCircleClicks();
  bindCatExpand(container);
}

// ── Alpha letter expand — full page takeover ──
function bindAlphaExpand(container, type) {
  container.querySelectorAll(".menu-alpha-letter.expandable").forEach((el) => {
    el.addEventListener("click", () => {
      const letter = el.getAttribute("data-letter");
      if (!letter) return;
      openExpandView(type, letter);
    });
  });
}

// ── Circle category expand — full page takeover ──
function bindCatExpand(container) {
  container.querySelectorAll(".menu-cat-label.expandable").forEach((el) => {
    el.addEventListener("click", () => {
      const cat = el.getAttribute("data-category");
      if (!cat) return;
      openExpandView("circle", cat);
    });
  });
}

// ── Bind App Click Handlers ──
function bindAppClicks() {
  document.querySelectorAll(".menu-app-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = item.getAttribute("data-id");
      const a = DataStore.getById("apps", id);
      if (!a) return;

      const visuals = a.visuals || [];

      document.getElementById("app-topbar-label").textContent = "Apps";
      document.getElementById("app-topbar-name").textContent = a.name;
      document.getElementById("app-topbar-img").src = a.img || DEFAULT_ICON_IMG;
      document.getElementById("app-board-img").src = a.img || DEFAULT_ICON_IMG;

      const _abn = document.getElementById("app-board-name");
      _abn.textContent = a.name;
      document.getElementById("app-board-platform").textContent =
        a.platform || "Apps";
      document.getElementById("app-board-version").textContent =
        a.version || "";

      // Visuals — use uploaded images, fallback to default only if missing
      const v1El = document.getElementById("app-visual-1");
      const v2El = document.getElementById("app-visual-2");
      if (v1El) {
        v1El.src = visuals[0] || DEFAULT_VISUAL_IMG;
        v1El.style.display = "";
      }
      if (v2El) {
        v2El.src = visuals[1] || DEFAULT_VISUAL_IMG;
        v2El.style.display = "";
      }

      // About
      const shortEl = document.getElementById("app-short-text");
      const aboutSection = document.getElementById("app-about-section");
      const shortVal = a.short || a.about || "";
      if (shortEl) shortEl.textContent = shortVal;
      if (aboutSection) aboutSection.style.display = shortVal ? "" : "none";

      // App Description
      const descEl = document.getElementById("app-desc-text");
      const descSection = document.getElementById("app-desc-section");
      const descVal = a.desc || "";
      if (descEl) descEl.textContent = descVal;
      if (descSection) descSection.style.display = descVal ? "" : "none";

      // App Note
      const notesEl = document.getElementById("app-notes-text");
      const noteSection = document.getElementById("app-note-section");
      const notesVal = a.notes || "";
      if (notesEl) notesEl.textContent = notesVal;
      if (noteSection) noteSection.style.display = notesVal ? "" : "none";

      // CTA button — open ctaUrl in new tab
      const _appCta = document.getElementById("app-panel-cta");
      if (_appCta) {
        const _newAppCta = _appCta.cloneNode(true);
        _appCta.parentNode.replaceChild(_newAppCta, _appCta);
        const ctaNameEl = _newAppCta.querySelector("#app-cta-name");
        if (ctaNameEl) ctaNameEl.textContent = a.name;
        _newAppCta.addEventListener("click", () => {
          if (a.ctaUrl) {
            const _app = DataStore.getById("apps", a.id);
            if (_app)
              DataStore.update("apps", a.id, {
                ctaClicks: (_app.ctaClicks || 0) + 1,
              });
            window.open(a.ctaUrl, "_blank", "noopener,noreferrer");
          }
        });
      }

      // Heart counter
      const _appHCount = document.getElementById("app-heart-count");
      if (_appHCount) _appHCount.textContent = "+" + (a.likes || 0);
      const _appHeartBtn = document.getElementById("app-heart-btn");
      if (_appHeartBtn) {
        const _likedKey = "mt_liked_app_" + a.id;
        const _isLiked = localStorage.getItem(_likedKey) === "1";
        _appHeartBtn.classList.toggle("liked", _isLiked);
        const _newHeart = _appHeartBtn.cloneNode(true);
        _appHeartBtn.parentNode.replaceChild(_newHeart, _appHeartBtn);
        _newHeart.addEventListener("click", (ev) => {
          ev.stopPropagation();
          const _app = DataStore.getById("apps", a.id);
          if (!_app) return;
          const _wasLiked = localStorage.getItem(_likedKey) === "1";
          const _newLikes = _wasLiked
            ? Math.max(0, (_app.likes || 0) - 1)
            : (_app.likes || 0) + 1;
          if (_wasLiked) {
            localStorage.removeItem(_likedKey);
            _newHeart.classList.remove("liked");
          } else {
            localStorage.setItem(_likedKey, "1");
            _newHeart.classList.add("liked");
          }
          DataStore.update("apps", a.id, { likes: _newLikes });
          const _hc = document.getElementById("app-heart-count");
          if (_hc) _hc.textContent = "+" + _newLikes;
        });
      }

      menuHome.style.display = "none";
      appPanel.classList.add("open");
      const main = document.querySelector(".main");
      if (main) main.scrollTop = 0;
      // Push clean URL (replaceState if already there — avoids duplicate entry on direct load)
      const _aPath = "/app/" + _menuToSlug(a.name);
      if (window.location.pathname === _aPath)
        history.replaceState({ type: "app", id: a.id }, "", _aPath);
      else history.pushState({ type: "app", id: a.id }, "", _aPath);
    });
  });
}

// Exposed for router — open an app panel directly by ID (e.g. from a shared URL)
function _menuOpenApp(id) {
  const el = document.querySelector(`.menu-app-item[data-id="${id}"]`);
  if (el) {
    el.click();
    return;
  }
  // Panel not rendered yet — render menu first then trigger
  if (typeof renderMenu === "function") renderMenu();
  requestAnimationFrame(() => {
    const el2 = document.querySelector(`.menu-app-item[data-id="${id}"]`);
    if (el2) el2.click();
  });
}

// ── Bind Book Click Handlers ──
function bindBookClicks() {
  document.querySelectorAll(".menu-book-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = item.getAttribute("data-id");
      const b = DataStore.getById("books", id);
      if (!b) return;

      const visuals = b.visuals || [];

      document.getElementById("book-topbar-label").textContent = "Books";
      document.getElementById("book-topbar-name").textContent = b.name;
      document.getElementById("book-topbar-img").src =
        b.img || DEFAULT_ICON_IMG;

      // Book Images
      const bv1 = document.getElementById("book-visual-1");
      const bv2 = document.getElementById("book-visual-2");
      if (bv1) {
        bv1.src = visuals[0] || DEFAULT_VISUAL_IMG;
        bv1.style.display = "";
      }
      if (bv2) {
        bv2.src = visuals[1] || DEFAULT_VISUAL_IMG;
        bv2.style.display = "";
      }

      // Book Title
      const titleEl = document.getElementById("book-content-title");
      if (titleEl) titleEl.textContent = b.name;

      // Book Description
      const descEl = document.getElementById("book-desc-text");
      const descSection = document.getElementById("book-desc-section");
      const descVal = b.desc || b.description || "";
      if (descEl) descEl.textContent = descVal;
      if (descSection) descSection.style.display = descVal ? "" : "none";

      // Book Key Points — list with icon
      const kpList = document.getElementById("book-keypoints-list");
      const kpSection = document.getElementById("book-kp-section");
      const kps = b.keyPoints || [];
      if (kpList) {
        if (kps.length > 0) {
          kpList.innerHTML = kps
            .filter(Boolean)
            .map(
              (kp) =>
                `<div class="book-keypoint-item">
              <img src="https://i.postimg.cc/Wz0jvSc8/Mt-Book-Key-Points-Icon.png" alt="" class="book-keypoint-icon" />
              <span class="book-keypoint-text">${kp}</span>
            </div>`,
            )
            .join("");
          if (kpSection) kpSection.style.display = "";
        } else {
          kpList.innerHTML = "";
          if (kpSection) kpSection.style.display = "none";
        }
      }

      // Book Merit
      const meritEl = document.getElementById("book-merit-text");
      const meritSection = document.getElementById("book-merit-section");
      const meritVal = b.merit || "";
      if (meritEl) meritEl.textContent = meritVal;
      if (meritSection) meritSection.style.display = meritVal ? "" : "none";

      // Book Detail — platform cards with links
      const detailList = document.getElementById("book-detail-list");
      const detailSection = document.getElementById("book-detail-section");
      const details = (b.details || []).filter(Boolean);
      const platformUrls = b.platformUrls || [];
      if (detailList) {
        if (details.length > 0) {
          detailList.innerHTML = details
            .map((d, i) => {
              const url = platformUrls[i] || "";
              return `<div class="book-detail-card${url ? " clickable" : ""}" data-url="${url}">
              <div class="book-detail-info">
                <div class="book-detail-name">${d}</div>
              </div>
              ${url ? '<div class="book-detail-arrow">&#8594;</div>' : ""}
            </div>`;
            })
            .join("");
          // Bind clicks on detail cards
          detailList
            .querySelectorAll(".book-detail-card.clickable")
            .forEach((card) => {
              card.addEventListener("click", () => {
                const url = card.getAttribute("data-url");
                if (url) window.open(url, "_blank", "noopener,noreferrer");
              });
            });
          if (detailSection) detailSection.style.display = "";
        } else {
          detailList.innerHTML = "";
          if (detailSection) detailSection.style.display = "none";
        }
      }

      // Book Notes
      const notesEl = document.getElementById("book-notes-text");
      const notesSection = document.getElementById("book-notes-section");
      const notesVal = b.notes || "";
      if (notesEl) notesEl.textContent = notesVal;
      if (notesSection) notesSection.style.display = notesVal ? "" : "none";

      // CTA cover image (shown above the button)
      const ctaCoverEl = document.getElementById("book-cta-cover");
      if (ctaCoverEl) {
        ctaCoverEl.src = b.ctaCover || DEFAULT_VISUAL_IMG;
        ctaCoverEl.style.display = "";
      }

      // CTA button
      const _bookCta = document.getElementById("book-panel-cta");
      if (_bookCta) {
        const _newBookCta = _bookCta.cloneNode(true);
        _bookCta.parentNode.replaceChild(_newBookCta, _bookCta);
        const ctaNameEl = _newBookCta.querySelector("#book-cta-name");
        if (ctaNameEl) ctaNameEl.textContent = b.name;
        const ctaPriceEl = _newBookCta.querySelector("#book-cta-price");
        const ctaPriceWrap = _newBookCta.querySelector("#book-cta-price-wrap");
        if (ctaPriceEl) ctaPriceEl.textContent = b.price || "";
        if (ctaPriceWrap) ctaPriceWrap.style.display = b.price ? "" : "none";
        _newBookCta.addEventListener("click", () => {
          const _url = (b.platformUrls && b.platformUrls[0]) || b.ctaUrl || "";
          if (_url) {
            const _book = DataStore.getById("books", b.id);
            if (_book)
              DataStore.update("books", b.id, {
                ctaClicks: (_book.ctaClicks || 0) + 1,
              });
            window.open(_url, "_blank", "noopener,noreferrer");
          }
        });
      }

      // Heart counter
      const _bookHCount = document.getElementById("book-heart-count");
      if (_bookHCount) _bookHCount.textContent = "+" + (b.likes || 0);
      const _bookHeartBtn = document.getElementById("book-heart-btn");
      if (_bookHeartBtn) {
        const _likedKey = "mt_liked_book_" + b.id;
        const _isLiked = localStorage.getItem(_likedKey) === "1";
        _bookHeartBtn.classList.toggle("liked", _isLiked);
        const _newHeart = _bookHeartBtn.cloneNode(true);
        _bookHeartBtn.parentNode.replaceChild(_newHeart, _bookHeartBtn);
        _newHeart.addEventListener("click", (ev) => {
          ev.stopPropagation();
          const _book = DataStore.getById("books", b.id);
          if (!_book) return;
          const _wasLiked = localStorage.getItem(_likedKey) === "1";
          const _newLikes = _wasLiked
            ? Math.max(0, (_book.likes || 0) - 1)
            : (_book.likes || 0) + 1;
          if (_wasLiked) {
            localStorage.removeItem(_likedKey);
            _newHeart.classList.remove("liked");
          } else {
            localStorage.setItem(_likedKey, "1");
            _newHeart.classList.add("liked");
          }
          DataStore.update("books", b.id, { likes: _newLikes });
          const _hc = document.getElementById("book-heart-count");
          if (_hc) _hc.textContent = "+" + _newLikes;
        });
      }

      menuHome.style.display = "none";
      bookPanel.classList.add("open");
      const main = document.querySelector(".main");
      if (main) main.scrollTop = 0;
      // Push clean URL (replaceState if already there — avoids duplicate entry on direct load)
      const _bkPath = "/book/" + _menuToSlug(b.name);
      if (window.location.pathname === _bkPath)
        history.replaceState({ type: "book", id: b.id }, "", _bkPath);
      else history.pushState({ type: "book", id: b.id }, "", _bkPath);
    });
  });
}

// Exposed for router — open a book panel directly by ID
function _menuOpenBook(id) {
  const el = document.querySelector(`.menu-book-item[data-id="${id}"]`);
  if (el) {
    el.click();
    return;
  }
  if (typeof renderMenu === "function") renderMenu();
  requestAnimationFrame(() => {
    const el2 = document.querySelector(`.menu-book-item[data-id="${id}"]`);
    if (el2) el2.click();
  });
}

// ── Bind Circle Click Handlers ──
function bindCircleClicks() {
  document.querySelectorAll(".menu-circle-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = item.getAttribute("data-id");
      const c = DataStore.getById("circles", id);
      if (!c) return;

      document.getElementById("circle-topbar-label").textContent = "Circle";
      document.getElementById("circle-topbar-name").textContent = c.name;
      document.getElementById("circle-topbar-img").src =
        c.img || DEFAULT_ICON_IMG;
      document.getElementById("circle-board-img").src =
        c.img || DEFAULT_ICON_IMG;
      document.getElementById("circle-board-category").textContent = c.category;
      document.getElementById("circle-board-name").textContent = c.name;
      document.getElementById("circle-board-platform").textContent = c.platform;
      document.getElementById("circle-board-about").textContent = c.about;
      document.getElementById("circle-cta-name").textContent = c.name;
      document.getElementById("circle-cta-platform").textContent = c.platform;

      // Dynamic features list — override hardcoded items
      const _descList = document.querySelector(".circle-desc-list");
      if (_descList) {
        const _features = c.features || [];
        if (_features.length > 0) {
          _descList.innerHTML = _features
            .filter(Boolean)
            .map(
              (f) =>
                `<div class="circle-desc-item">
              <img src="https://i.postimg.cc/HW9jSh6N/Mt-Menu-Circle-List-Icon.png" alt="" class="circle-desc-icon" />
              <span>${f}</span>
            </div>`,
            )
            .join("");
        }
      }

      // CTA link
      const _cta = document.getElementById("circle-panel-cta");
      if (_cta) {
        if (c.url) {
          _cta.href = c.url;
          _cta.style.pointerEvents = "";
          _cta.style.opacity = "";
        } else {
          _cta.removeAttribute("href");
          _cta.style.pointerEvents = "none";
          _cta.style.opacity = "0.45";
        }
        const _newCta = _cta.cloneNode(true);
        _cta.parentNode.replaceChild(_newCta, _cta);
        _newCta.addEventListener("click", () => {
          const _circle = DataStore.getById("circles", c.id);
          if (_circle)
            DataStore.update("circles", c.id, {
              ctaClicks: (_circle.ctaClicks || 0) + 1,
            });
        });
      }

      // Heart counter
      const _hCount = document.getElementById("circle-heart-count");
      if (_hCount) _hCount.textContent = "+" + (c.likes || 0);

      const _heartBtn = document.getElementById("circle-heart-btn");
      if (_heartBtn) {
        const _likedKey = "mt_liked_circle_" + c.id;
        const _isLiked = localStorage.getItem(_likedKey) === "1";
        _heartBtn.classList.toggle("liked", _isLiked);
        // Replace button to clear old listeners
        const _newHeart = _heartBtn.cloneNode(true);
        _heartBtn.parentNode.replaceChild(_newHeart, _heartBtn);
        _newHeart.addEventListener("click", (ev) => {
          ev.stopPropagation();
          const _circle = DataStore.getById("circles", c.id);
          if (!_circle) return;
          const _wasLiked = localStorage.getItem(_likedKey) === "1";
          const _newLikes = _wasLiked
            ? Math.max(0, (_circle.likes || 0) - 1)
            : (_circle.likes || 0) + 1;
          if (_wasLiked) {
            localStorage.removeItem(_likedKey);
            _newHeart.classList.remove("liked");
          } else {
            localStorage.setItem(_likedKey, "1");
            _newHeart.classList.add("liked");
          }
          DataStore.update("circles", c.id, { likes: _newLikes });
          const _hc = document.getElementById("circle-heart-count");
          if (_hc) _hc.textContent = "+" + _newLikes;
        });
      }

      menuHome.style.display = "none";
      circlePanel.classList.add("open");
      const main = document.querySelector(".main");
      if (main) main.scrollTop = 0;
      // Push clean URL (replaceState if already there — avoids duplicate entry on direct load)
      const _ciPath = "/circle/" + _menuToSlug(c.name);
      if (window.location.pathname === _ciPath)
        history.replaceState({ type: "circle", id: c.id }, "", _ciPath);
      else history.pushState({ type: "circle", id: c.id }, "", _ciPath);
    });
  });
}

// Exposed for router — open a circle panel directly by ID
function _menuOpenCircle(id) {
  const el = document.querySelector(`.menu-circle-item[data-id="${id}"]`);
  if (el) {
    el.click();
    return;
  }
  if (typeof renderMenu === "function") renderMenu();
  requestAnimationFrame(() => {
    const el2 = document.querySelector(`.menu-circle-item[data-id="${id}"]`);
    if (el2) el2.click();
  });
}

// ── Back Buttons — use history.back() so the browser URL reverts cleanly ──
document.getElementById("app-panel-back").addEventListener("click", (e) => {
  e.stopPropagation();
  appPanel.classList.remove("open");
  menuHome.style.display = "flex";
  history.back();
});

document.getElementById("book-panel-back").addEventListener("click", (e) => {
  e.stopPropagation();
  bookPanel.classList.remove("open");
  menuHome.style.display = "flex";
  history.back();
});

document.getElementById("circle-panel-back").addEventListener("click", (e) => {
  e.stopPropagation();
  circlePanel.classList.remove("open");
  menuHome.style.display = "flex";
  history.back();
});

// ── Main Search Bar ──
if (menuSearchInput) {
  menuSearchInput.addEventListener("input", () => {
    const query = menuSearchInput.value.toLowerCase();

    // If in expand mode, filter within expand view
    if (_expandState) {
      const type = _expandState.type;
      let container;
      if (type === "apps") container = document.getElementById("apps-panel");
      else if (type === "books")
        container = document.getElementById("books-panel");
      else container = document.getElementById("circle-panel");

      const expandView = container.querySelector(".menu-expand-view");
      if (!expandView) return;

      const itemCls =
        type === "apps"
          ? ".menu-app-item"
          : type === "books"
            ? ".menu-book-item"
            : ".menu-circle-item";
      const nameCls =
        type === "apps"
          ? ".menu-app-name"
          : type === "books"
            ? ".menu-book-name"
            : ".menu-circle-name";
      expandView.querySelectorAll(itemCls).forEach((item) => {
        const name = (item.querySelector(nameCls) || {}).textContent || "";
        item.style.display = name.toLowerCase().includes(query) ? "" : "none";
      });
      return;
    }

    // Normal search behavior
    const activeTab = document.querySelector(".abc-title.active");
    const category = activeTab
      ? activeTab.getAttribute("data-category")
      : "apps";

    if (category === "apps") {
      const container = document.getElementById("apps-panel");
      if (container) {
        container.querySelectorAll(".menu-app-item").forEach((item) => {
          const name =
            (item.querySelector(".menu-app-name, .menu-pinned-name") || {})
              .textContent || "";
          item.style.display = name.toLowerCase().includes(query) ? "" : "none";
        });
        container.querySelectorAll(".menu-alpha-group").forEach((group) => {
          const visible = group.querySelectorAll(
            '.menu-app-item:not([style*="display: none"])',
          );
          group.style.display = visible.length > 0 ? "" : "none";
        });
        const pinnedBoard = container.querySelector(".menu-pinned-board");
        if (pinnedBoard) {
          const pinnedItem = pinnedBoard.querySelector(".menu-app-item");
          pinnedBoard.style.display =
            pinnedItem && pinnedItem.style.display !== "none" ? "" : "none";
        }
      }
    } else if (category === "books") {
      const container = document.getElementById("books-panel");
      if (container) {
        container.querySelectorAll(".menu-book-item").forEach((item) => {
          const name =
            (item.querySelector(".menu-book-name, .menu-pinned-name") || {})
              .textContent || "";
          item.style.display = name.toLowerCase().includes(query) ? "" : "none";
        });
        container.querySelectorAll(".menu-alpha-group").forEach((group) => {
          const visible = group.querySelectorAll(
            '.menu-book-item:not([style*="display: none"])',
          );
          group.style.display = visible.length > 0 ? "" : "none";
        });
        const pinnedBoard = container.querySelector(".menu-pinned-board");
        if (pinnedBoard) {
          const pinnedItem = pinnedBoard.querySelector(".menu-book-item");
          pinnedBoard.style.display =
            pinnedItem && pinnedItem.style.display !== "none" ? "" : "none";
        }
      }
    } else if (category === "circle") {
      const container = document.getElementById("circle-panel");
      if (container) {
        container.querySelectorAll(".menu-circle-item").forEach((item) => {
          const name =
            (item.querySelector(".menu-circle-name") || {}).textContent || "";
          item.style.display = name.toLowerCase().includes(query) ? "" : "none";
        });
        container.querySelectorAll(".menu-circle-category").forEach((group) => {
          const visible = group.querySelectorAll(
            '.menu-circle-item:not([style*="display: none"])',
          );
          group.style.display = visible.length > 0 ? "" : "none";
        });
      }
    }
  });
}

// ── Initial render ──
renderMenuApps();
renderMenuBooks();
renderMenuCircles();
// Apply deep link set by router before this script loaded (direct URL open)
if (window._routerDeepLink) {
  const _dl = window._routerDeepLink;
  if (_dl.type === "app" && typeof _menuOpenApp === "function") {
    window._routerDeepLink = null;
    _menuOpenApp(_dl.id);
  } else if (_dl.type === "book" && typeof _menuOpenBook === "function") {
    window._routerDeepLink = null;
    _menuOpenBook(_dl.id);
  } else if (_dl.type === "circle" && typeof _menuOpenCircle === "function") {
    window._routerDeepLink = null;
    _menuOpenCircle(_dl.id);
  }
}
