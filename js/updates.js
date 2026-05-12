// ── Updates Page ──────────────────────────────────────────────────────────────

const _uHeaderName = document.getElementById("updates-header-name");
const _uHeaderIcon = document.getElementById("updates-header-icon");
const _uHeaderArea = document.getElementById("updates-header-area");
const _uLists = document.getElementById("updates-lists");
const _uFullView = document.getElementById("updates-full-view");
const _uFullContent = document.getElementById("updates-full-content");

const _U_ICON = "https://i.postimg.cc/zG92gDXB/Mt-Recommend-Icon.png";
const _U_BACK = "https://i.postimg.cc/dtNjQWhf/App-Mode-Back-Icon.png";

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
  if (!_uViewId && _uFullView.style.display === "none") return;
  _uViewId = null;
  _uLists.style.display = "flex";
  _uFullView.style.display = "none";
  _uFullContent.innerHTML = "";
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
  const list = DataStore.getAll("recommends")
    .slice()
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  const hdr = `<div class="block-recommend-header-row">
    <div class="block-recommend-header-label">Master Togan ~ Recommendations</div>
    <div class="block-recommend-header-count">All ~ ${list.length}</div>
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

  const items = (r.items || []).slice(0, 5);
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
