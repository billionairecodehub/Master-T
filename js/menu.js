// ── Menu: Dynamic rendering from DataStore ──

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
          <img src="https://i.postimg.cc/xdrpDW4z/image.png" alt="${item.name}" class="${itemCls}-icon" />
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
  const apps = DataStore.getAll("apps");

  // Pinned app
  const pinned = apps.find((a) => a.pinned);
  let pinnedHTML = "";
  if (pinned) {
    pinnedHTML = `
      <div class="menu-pinned-board">
        <div class="menu-section-label">Top Recommended For Creators</div>
        <div class="menu-pinned-item menu-app-item" data-id="${pinned.id}">
          <img src="https://i.postimg.cc/xdrpDW4z/image.png" alt="${pinned.name}" class="menu-pinned-icon" />
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
          <img src="https://i.postimg.cc/xdrpDW4z/image.png" alt="${a.name}" class="menu-app-icon" />
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
  const books = DataStore.getAll("books");

  // Pinned book
  const pinned = books.find((b) => b.pinned);
  let pinnedHTML = "";
  if (pinned) {
    pinnedHTML = `
      <div class="menu-pinned-board">
        <div class="menu-section-label">Top Book of the Week</div>
        <div class="menu-pinned-item menu-book-item" data-id="${pinned.id}">
          <img src="https://i.postimg.cc/xdrpDW4z/image.png" alt="${pinned.name}" class="menu-pinned-icon" />
          <div class="menu-pinned-details">
            <div class="menu-pinned-name">${pinned.name}</div>
            <div class="menu-pinned-desc">${pinned.short}</div>
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
          <img src="https://i.postimg.cc/xdrpDW4z/image.png" alt="${b.name}" class="menu-book-icon" />
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
  const circles = DataStore.getAll("circles");

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
          <img src="https://i.postimg.cc/xdrpDW4z/image.png" alt="${c.name}" class="menu-circle-icon" />
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

      document.getElementById("app-topbar-label").textContent = "App";
      document.getElementById("app-topbar-name").textContent = a.name;
      document.getElementById("app-topbar-img").src =
        "https://i.postimg.cc/xdrpDW4z/image.png";
      document.getElementById("app-board-img").src =
        "https://i.postimg.cc/xdrpDW4z/image.png";
      const _abn = document.getElementById("app-board-name");
      const _abnIcon = _abn.querySelector(".app-board-name-icon");
      _abn.textContent = a.name;
      if (_abnIcon) _abn.insertBefore(_abnIcon, _abn.firstChild);
      document.getElementById("app-board-platform").textContent = a.platform;
      document.getElementById("app-board-version").textContent = a.version;
      document.getElementById("app-visual-1").src = a.visual;
      document.getElementById("app-visual-2").src = a.visual;
      document.getElementById("app-short-text").textContent = a.short;
      document.getElementById("app-desc-text").textContent = a.desc;
      const _ars = document.getElementById("app-rating-score");
      if (_ars) _ars.textContent = "~" + a.rating;
      const _arc = document.getElementById("app-rating-count");
      if (_arc) _arc.textContent = a.ratingcount + " >>";
      const _art = document.getElementById("app-rating-text");
      if (_art) _art.textContent = a.ratingtext;
      document.getElementById("app-cta-board").style.backgroundImage =
        "url('" + a.ctaimg + "')";
      document.getElementById("app-cta-name").textContent = a.name;

      menuHome.style.display = "none";
      appPanel.classList.add("open");
    });
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

      document.getElementById("book-topbar-label").textContent = "Book";
      document.getElementById("book-topbar-name").textContent = b.name;
      document.getElementById("book-topbar-img").src =
        "https://i.postimg.cc/xdrpDW4z/image.png";
      document.getElementById("book-visual-1").src = b.visual;
      document.getElementById("book-visual-2").src = b.visual;
      document.getElementById("book-content-title").textContent = b.name;
      document.getElementById("book-desc-text").textContent = b.desc;
      document.getElementById("book-keypoints-text").textContent = b.keypoints;
      document.getElementById("book-short-text").textContent = b.short;
      const _brs = document.getElementById("book-rating-score");
      if (_brs) _brs.textContent = "~" + b.rating;
      const _brc = document.getElementById("book-rating-count");
      if (_brc) _brc.textContent = b.ratingcount + " >>";
      document.querySelectorAll(".book-review-bn").forEach((el) => {
        el.textContent = b.name;
      });
      document.getElementById("book-post-review-text").textContent =
        b.ratingtext;
      document.getElementById("book-cta-board").style.backgroundImage =
        "url('" + b.ctaimg + "')";
      document.getElementById("book-cta-name").textContent = b.name;
      document.getElementById("book-cta-price").textContent = b.price;
      document.getElementById("book-overlay-score").textContent = b.rating;
      document.getElementById("book-overlay-platforms").textContent =
        b.ratingplatforms;
      document.getElementById("book-overlay-count").textContent = (
        b.ratingcount || ""
      ).replace(/,/g, "");
      document.querySelectorAll(".book-overlay-bn").forEach((el) => {
        el.textContent = b.name;
      });

      menuHome.style.display = "none";
      bookPanel.classList.add("open");
    });
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
        c.img || "https://i.postimg.cc/xdrpDW4z/image.png";
      document.getElementById("circle-board-img").src =
        c.img || "https://i.postimg.cc/xdrpDW4z/image.png";
      document.getElementById("circle-board-category").textContent = c.category;
      document.getElementById("circle-board-name").textContent = c.name;
      document.getElementById("circle-board-platform").textContent = c.platform;
      document.getElementById("circle-board-about").textContent = c.about;
      document.getElementById("circle-cta-name").textContent = c.name;
      document.getElementById("circle-cta-platform").textContent = c.platform;

      // CTA link
      const _cta = document.getElementById("circle-panel-cta");
      if (_cta) _cta.href = c.url || "#";

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
    });
  });
}

// ── Back Buttons (static — always in DOM) ──
document.getElementById("app-panel-back").addEventListener("click", (e) => {
  e.stopPropagation();
  appPanel.classList.remove("open");
  menuHome.style.display = "flex";
});

document.getElementById("book-panel-back").addEventListener("click", (e) => {
  e.stopPropagation();
  document.getElementById("book-ratings-overlay").classList.remove("open");
  bookPanel.classList.remove("open");
  menuHome.style.display = "flex";
});

const _bookRatingsOverlayClose = document.getElementById(
  "book-ratings-overlay-close",
);
if (_bookRatingsOverlayClose) {
  _bookRatingsOverlayClose.addEventListener("click", (e) => {
    e.stopPropagation();
    document.getElementById("book-ratings-overlay").classList.remove("open");
  });
}

document.getElementById("circle-panel-back").addEventListener("click", (e) => {
  e.stopPropagation();
  circlePanel.classList.remove("open");
  menuHome.style.display = "flex";
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
