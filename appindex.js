// appindex.js — Loads all HTML partials into <main>, then loads page scripts

function _getErrorCodeFromStatus(status) {
  if (status === 404) return 404;
  if (status === 503 || status === 504) return status;
  if (status >= 500) return 500;
  return 500;
}

function _buildErrorUrl(code) {
  const safeCode = Number.isFinite(code) ? String(code) : "500";
  return `error.html?code=${encodeURIComponent(safeCode)}`;
}

function _redirectToError(code) {
  const target = _buildErrorUrl(code);
  window.location.replace(target);
}

async function loadPage(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      const statusCode = _getErrorCodeFromStatus(response.status);
      const err = new Error(`Failed to load ${url} (${response.status})`);
      err.code = statusCode;
      throw err;
    }
    return response.text();
  } catch (error) {
    if (error && error.name === "AbortError") {
      const timeoutError = new Error(`Request timed out for ${url}`);
      timeoutError.code = 504;
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function boot() {
  const main = document.querySelector(".main");

  // Load all page partials in parallel
  const [home, profile, quest, noti, menu, about, polls, updates] =
    await Promise.all([
      loadPage("pages/home.html"),
      loadPage("pages/profile.html"),
      loadPage("pages/quest.html"),
      loadPage("pages/noti.html"),
      loadPage("pages/menu.html"),
      loadPage("pages/about.html"),
      loadPage("pages/polls.html"),
      loadPage("pages/updates.html"),
    ]);

  // Inject all pages into main container
  main.innerHTML =
    home + profile + quest + noti + menu + about + polls + updates;

  // Now load all JS files in order (shared data first, then sync from Firebase, then page scripts)
  const dataLoad = ["shared/data.js"];
  const pageScripts = [
    "js/index.js",
    "js/home.js",
    "js/profile.js",
    "js/quest.js",
    "js/noti.js",
    "js/menu.js",
    "js/about.js",
    "js/polls.js",
    "js/updates.js",
  ];

  // Load data.js first
  for (const src of dataLoad) {
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  // Sync latest content from Firebase before rendering any page
  await DataStore.syncFromRemote();

  // Load page scripts (they read from localStorage which is now up-to-date)
  for (const src of pageScripts) {
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  // Start real-time sync — pushes Firebase changes to all open devices/tabs
  DataStore.startSync();
}

boot().catch((error) => {
  // Single fallback target for all runtime/bootstrap failures.
  if (!navigator.onLine) {
    _redirectToError(0);
    return;
  }

  const code = Number(error && error.code);
  if (code === 404 || code === 500 || code === 503 || code === 504) {
    _redirectToError(code);
    return;
  }

  _redirectToError(500);
});
