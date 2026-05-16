// ── Updates Page ──────────────────────────────────────────────────────────────

const _uHeaderName = document.getElementById("updates-header-name");
const _uHeaderIcon = document.getElementById("updates-header-icon");
const _uHeaderArea = document.getElementById("updates-header-area");
const _uLists = document.getElementById("updates-lists");
const _uFullView = document.getElementById("updates-full-view");
const _uFullContent = document.getElementById("updates-full-content");

const _U_ICON = "https://i.postimg.cc/zG92gDXB/Mt-Recommend-Icon.png";
const _U_BACK = "https://i.postimg.cc/dtNjQWhf/App-Mode-Back-Icon.png";

// ── Filter state ─────────────────────────────────────────────────────────────
const _U_DEFAULT_CATS = ["Dating", "Money", "Frame"];
let _uFilterCat = "All";
let _uPendingCat = "All";
// These DOM refs are resolved lazily after page scripts load
let _uFilterPage, _uFilterBtn, _uFilterDot;

let _uViewId = null;
let _uScrollPos = 0;

// ── Helpers ───────────────────────────────────────────────────────────────────
function _uFmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  const mo = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${d.getDate()} ${mo[d.getMonth()]} ~ ${String(d.getFullYear()).slice(2)}`;
}

// ── Updates unread dot ────────────────────────────────────────────────────────
const UPDATES_SEEN_KEY = "mt_updates_seen";

function getUpdatesSeenIds() {
  try {
    return JSON.parse(localStorage.getItem(UPDATES_SEEN_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function updateUpdatesDot() {
  const updates = DataStore.getAll("recommends").filter((i) => !i.draft);
  const seen = getUpdatesSeenIds();
  const hasUnread = updates.some((i) => !seen.includes(i.id));
  const navDot = document.getElementById("updates-nav-dot");
  if (navDot) navDot.style.display = hasUnread ? "block" : "none";
}

function markUpdatesSeen() {
  const allIds = DataStore.getAll("recommends")
    .filter((i) => !i.draft)
    .map((i) => i.id);
  localStorage.setItem(UPDATES_SEEN_KEY, JSON.stringify(allIds));
  updateUpdatesDot();
}

// ── Open / close full view ────────────────────────────────────────────────────
function _uOpenView(id) {
  _uViewId = id;
  const main = document.querySelector(".main");
  _uScrollPos = main ? main.scrollTop : 0;
  _uLists.style.display = "none";
  _uFullView.style.display = "block";
  _uHeaderIcon.src = _U_BACK;
  if (main) main.scrollTop = 0;
  const targetPath = "/update/" + id;
  if (window.location.pathname === targetPath)
    history.replaceState({ type: "update", id: id }, "", targetPath);
  else history.pushState({ type: "update", id: id }, "", targetPath);
  _uRenderUpdate(id);
}

function _uCloseView() {
  _uViewId = null;
  _uLists.style.display = "flex";
  _uFullView.style.display = "none";
  _uFullContent.innerHTML = "";
  _uHeaderIcon.src = _U_ICON;
  _uHeaderName.textContent = "Updates";
  const main = document.querySelector(".main");
  if (main) main.scrollTop = _uScrollPos;
  if (window.location.pathname.startsWith("/update/"))
    history.replaceState({}, "", "/updates");
}

// Lightweight reset used by hideAllPages (no scroll side-effects)
function _uForceClose() {
  if (
    !_uViewId &&
    _uFullView.style.display === "none" &&
    (!_uFilterPage || _uFilterPage.style.display === "none")
  )
    return;
  _uViewId = null;
  _uLists.style.display = "flex";
  _uFullView.style.display = "none";
  _uFullContent.innerHTML = "";
  _uHeaderArea.style.display = "";
  if (_uFilterPage) _uFilterPage.style.display = "none";
  _uHeaderIcon.src = _U_ICON;
  _uHeaderName.textContent = "Updates";
}

// ── Back button ───────────────────────────────────────────────────────────────
_uHeaderIcon.addEventListener("click", (e) => {
  e.stopPropagation();
  if (_uViewId) _uCloseView();
});

_uHeaderArea.addEventListener("click", () => {
  if (_uViewId) _uCloseView();
});

// ── Render list ───────────────────────────────────────────────────────────────
function renderUpdates() {
  const container = document.getElementById("updates-main");
  if (!container) return;
  const allList = DataStore.getAll("recommends")
    .slice()
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  const list =
    _uFilterCat === "All"
      ? allList
      : allList.filter(
          (r) => (r.category || "").toLowerCase() === _uFilterCat.toLowerCase(),
        );

  const countLabel =
    _uFilterCat === "All"
      ? `All ~ ${allList.length}`
      : `${_uFilterCat} ~ ${list.length}`;

  const hdr = `<div class="block-recommend-header-row">
    <div class="block-recommend-header-label">Master Togan ~ Recommendations</div>
    <div class="block-recommend-header-count">${countLabel}</div>
  </div>`;

  if (list.length === 0) {
    container.innerHTML = hdr + '<div class="block-empty">No updates yet</div>';
    return;
  }

  container.innerHTML =
    hdr +
    list
      .map((r) => {
        const cta = r.ctaLabel
          ? `<a class="block-recommend-cta-faded"${r.ctaUrl ? ` href="${r.ctaUrl}" target="_blank" rel="noopener noreferrer"` : ""} style="${r.ctaUrl ? "" : "pointer-events:none;opacity:0.45;"}">` +
            r.ctaLabel +
            `</a>`
          : "";
        return `<div class="block-recommend-card" data-id="${r.id}">
          <div class="block-recommend-card-inner">
            <img src="${_U_ICON}" alt="" class="block-recommend-icon" />
            ${r.category ? `<div class="block-recommend-cat-label">${r.category}</div>` : ""}
            <div class="block-recommend-subject">${r.subject || ""}</div>
            <div class="block-recommend-card-footer">
              <div class="block-recommend-readmore">Read More...</div>
              <div class="block-recommend-date">${_uFmtDate(r.createdAt)}</div>
            </div>
          </div>
          ${cta}
        </div>`;
      })
      .join("");

  container.querySelectorAll(".block-recommend-card").forEach((card) => {
    // CTA anchor: let its href fire, do not expand the post
    card.querySelectorAll(".block-recommend-cta-faded").forEach((cta) => {
      cta.addEventListener("click", (e) => e.stopPropagation());
    });
    // Post body: expand full view
    const inner = card.querySelector(".block-recommend-card-inner");
    if (inner) {
      inner.addEventListener("click", () =>
        _uOpenView(card.getAttribute("data-id")),
      );
    }
  });
}

// ── Render full view ──────────────────────────────────────────────────────────
function _uRenderUpdate(id) {
  const r = DataStore.getById("recommends", id);
  if (!r) {
    _uCloseView();
    return;
  }

  _uHeaderName.textContent = "Updates";

  const items = (r.items || []).slice(0, 5).filter((text) => text.trim());
  const itemsHTML = items
    .map(
      (text) =>
        `<div class="block-recommend-item">${text.replace(/\n/g, "<br>")}</div>`,
    )
    .join("");

  const ctaHTML = r.ctaLabel
    ? `<a class="block-recommend-full-cta"${r.ctaUrl ? ` href="${r.ctaUrl}" target="_blank" rel="noopener noreferrer"` : ""} style="${r.ctaUrl ? "" : "pointer-events:none;opacity:0.45;"}">` +
      r.ctaLabel +
      `</a>`
    : "";

  _uFullContent.innerHTML = `
    <div class="block-recommend-full-card-header">
      <img src="${_U_ICON}" alt="" class="block-recommend-full-header-icon" />
      <div class="block-recommend-full-header-subject">${r.subject || ""}</div>
    </div>
    <div class="block-recommend-full-body">
      ${itemsHTML}
      <div class="block-recommend-full-footer">
        <div class="block-recommend-full-author">${r.author || "Master Togan"}</div>
        <div class="block-recommend-full-date">${_uFmtDate(r.createdAt)}</div>
      </div>
      ${ctaHTML}
    </div>`;
}

// ── Initial render ────────────────────────────────────────────────────────────
renderUpdates();
updateUpdatesDot();

// Apply deep link set by router before this script loaded (direct URL open)
if (window._routerDeepLink) {
  const _dl = window._routerDeepLink;
  if (_dl.type === "update") {
    window._routerDeepLink = null;
    requestAnimationFrame(() => _uOpenView(_dl.id));
  }
}

// ── Filter page ───────────────────────────────────────────────────────────────

_uFilterPage = document.getElementById("updates-filter-page");
_uFilterBtn = document.getElementById("updates-filter-btn");
_uFilterDot = document.getElementById("updates-filter-active-dot");

function _uGetAllCats() {
  const customs = DataStore.getAll("updateCategories")
    .map((c) => c.name)
    .filter(Boolean);
  const merged = [..._U_DEFAULT_CATS];
  customs.forEach((c) => {
    if (!merged.includes(c)) merged.push(c);
  });
  return merged.sort((a, b) => a.localeCompare(b));
}

function _uRenderFilterCats(search) {
  const catsEl = document.getElementById("updates-filter-cats");
  if (!catsEl) return;
  const q = (search || "").toLowerCase().trim();
  const allUpdates = DataStore.getAll("recommends");
  const allCats = _uGetAllCats();

  const subtitleEl = document.getElementById("updates-filter-subtitle");
  if (subtitleEl)
    subtitleEl.textContent = `All ~ ${allCats.length + 1} Categories`;

  const items = [
    { name: "All", count: allUpdates.length },
    ...allCats.map((cat) => ({
      name: cat,
      count: allUpdates.filter(
        (u) => (u.category || "").toLowerCase() === cat.toLowerCase(),
      ).length,
    })),
  ].filter((item) => !q || item.name.toLowerCase().includes(q));

  if (!items.length) {
    catsEl.innerHTML =
      '<div class="updates-filter-empty">No categories found</div>';
    return;
  }

  catsEl.innerHTML = `<div class="updates-filter-cats-grid">${items
    .map(
      (item) =>
        `<div class="updates-filter-cat-card${
          _uPendingCat === item.name ? " selected" : ""
        }" data-cat="${item.name}"><div class="updates-filter-cat-count">${item.count}</div><div class="updates-filter-cat-name">${item.name}</div></div>`,
    )
    .join("")}</div>`;

  catsEl.querySelectorAll(".updates-filter-cat-card").forEach((card) => {
    card.addEventListener("click", () => {
      _uPendingCat = card.getAttribute("data-cat");
      _uRenderFilterCats(search);
    });
  });
}

function _uUpdateFilterDot() {
  if (_uFilterDot)
    _uFilterDot.style.display = _uFilterCat !== "All" ? "block" : "none";
}

function _uOpenFilter() {
  if (_uViewId) return;
  _uPendingCat = _uFilterCat;
  _uLists.style.display = "none";
  _uHeaderArea.style.display = "none";
  _uFilterPage.style.display = "flex";
  document.getElementById("updates-filter-search").value = "";
  _uRenderFilterCats("");
}

function _uCloseFilter(apply) {
  if (apply) {
    _uFilterCat = _uPendingCat;
    _uUpdateFilterDot();
    renderUpdates();
  }
  _uFilterPage.style.display = "none";
  _uHeaderArea.style.display = "";
  _uLists.style.display = "flex";
}

_uFilterBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  _uOpenFilter();
});

document.getElementById("updates-filter-back").addEventListener("click", () => {
  _uCloseFilter(false);
});

document
  .getElementById("updates-filter-apply")
  .addEventListener("click", () => {
    const btn = document.getElementById("updates-filter-apply");
    btn.textContent = "Applied";
    btn.disabled = true;
    setTimeout(() => {
      _uCloseFilter(true);
      btn.textContent = "Apply";
      btn.disabled = false;
    }, 900);
  });

document
  .getElementById("updates-filter-search")
  .addEventListener("input", (e) => {
    _uRenderFilterCats(e.target.value);
  });
