const ERROR_LABELS = {
  0: "Internet Connection Error",
  404: "Page Not Found",
  500: "Internal Server Error",
  503: "Service Timeout",
  504: "Service Timeout",
};

const PAGES = [
  {
    key: "feed",
    label: "Feed",
    icon: "https://i.postimg.cc/XJRZSDQ0/Mt-Feed-Icon.png",
    go: "index.html?page=feed",
  },
  {
    key: "quest",
    label: "Quest",
    icon: "https://i.postimg.cc/261CZPjm/Mt-Admin-Bar-Icon-Quest.png",
    go: "index.html?page=quest",
  },
  {
    key: "notifications",
    label: "Notifications",
    icon: "https://i.postimg.cc/5tHhvgFc/Mt-Notification-Icon.png",
    go: "index.html?page=notif",
  },
  {
    key: "menu",
    label: "Menu",
    icon: "https://i.postimg.cc/pL6fmqSd/Mtogan-menu-store-Icon.png",
    go: "index.html?page=menu",
  },
  {
    key: "block",
    label: "Block",
    icon: "https://i.postimg.cc/xTYDWHSN/Mstogan-Block-Icon.png",
    go: "index.html?page=block",
  },
];

const errorLabelEl = document.getElementById("error-label");
const searchInputEl = document.getElementById("error-search-input");
const resultTabEl = document.getElementById("result-tab");
const resultNameEl = document.getElementById("result-name");
const resultIconEl = resultTabEl
  ? resultTabEl.querySelector(".result-icon")
  : null;
const fallbackMsgEl = document.getElementById("fallback-msg");
const homeTabEl = document.getElementById("home-tab");

let activeMatch = null;

function getErrorCode() {
  const url = new URL(window.location.href);
  const raw =
    url.searchParams.get("code") ||
    url.searchParams.get("status") ||
    url.searchParams.get("error");

  if (!raw) {
    return navigator.onLine ? 404 : 0;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return navigator.onLine ? 404 : 0;
  }
  return parsed;
}

function setErrorLabel() {
  const code = getErrorCode();
  const label = ERROR_LABELS[code] || "Internal Server Error";
  if (errorLabelEl) errorLabelEl.textContent = label;
}

function setFallbackDefault() {
  if (fallbackMsgEl) fallbackMsgEl.textContent = "Click Tab to Go Back Home";
  document.body.classList.remove("not-found");
}

function setFallbackNotFound() {
  if (fallbackMsgEl)
    fallbackMsgEl.textContent = "Not Found | Click Tab to Go Back Home";
  document.body.classList.add("not-found");
}

function clearResult() {
  activeMatch = null;
  if (resultTabEl) resultTabEl.hidden = true;
  if (resultNameEl) resultNameEl.textContent = "";
}

function renderResult(page) {
  activeMatch = page;
  if (resultNameEl) resultNameEl.textContent = page.label;
  if (resultIconEl) {
    resultIconEl.src = page.icon;
    resultIconEl.alt = page.label;
  }
  if (resultTabEl) resultTabEl.hidden = false;
}

function findPage(query) {
  const clean = query.trim().toLowerCase();
  if (!clean) return null;

  return (
    PAGES.find((p) => p.key.startsWith(clean)) ||
    PAGES.find((p) => p.label.toLowerCase().includes(clean)) ||
    null
  );
}

function handleSearchInput() {
  const query = searchInputEl ? searchInputEl.value : "";
  const match = findPage(query || "");

  if (!query || !query.trim()) {
    clearResult();
    setFallbackDefault();
    return;
  }

  if (match) {
    renderResult(match);
    setFallbackDefault();
    return;
  }

  clearResult();
  setFallbackNotFound();
}

function goHome() {
  window.location.href = "index.html?page=home";
}

function goToMatchedPage() {
  if (!activeMatch) return;
  window.location.href = activeMatch.go;
}

function init() {
  setErrorLabel();
  setFallbackDefault();

  if (searchInputEl) {
    searchInputEl.addEventListener("input", handleSearchInput);
  }

  if (resultTabEl) {
    resultTabEl.addEventListener("click", goToMatchedPage);
  }

  if (homeTabEl) {
    homeTabEl.addEventListener("click", goHome);
  }

  window.addEventListener("online", setErrorLabel);
  window.addEventListener("offline", setErrorLabel);
}

init();
