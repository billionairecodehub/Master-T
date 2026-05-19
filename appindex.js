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

function _hideBootSplash() {
  const splash = document.getElementById("boot-splash");
  if (!splash) return;
  splash.classList.add("is-hidden");
  setTimeout(() => {
    if (splash && splash.parentNode) splash.parentNode.removeChild(splash);
  }, 260);
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
  const mobileLayout = document.querySelector(".mobile-layout");

  // Load all page partials in parallel
  const [
    auth,
    home,
    profile,
    userProfile,
    quest,
    noti,
    menu,
    about,
    feed,
    block,
  ] = await Promise.all([
    loadPage("pages/auth.html"),
    loadPage("pages/home.html"),
    loadPage("pages/profile.html"),
    loadPage("pages/user-profile.html"),
    loadPage("pages/quest.html"),
    loadPage("pages/noti.html"),
    loadPage("pages/menu.html"),
    loadPage("pages/about.html"),
    loadPage("pages/feed.html"),
    loadPage("pages/block.html"),
  ]);

  // Inject auth page as sibling in mobile-layout (fixed overlay)
  if (mobileLayout) {
    const authDiv = document.createElement("div");
    authDiv.innerHTML = auth;
    mobileLayout.insertBefore(authDiv.firstElementChild, main);
  }

  // Inject all other pages into main container
  main.innerHTML =
    home + profile + userProfile + quest + noti + menu + about + feed + block;

  // Now load all JS files in order (shared data first, then auth, then page scripts)
  const dataLoad = ["shared/data.js", "shared/scroll-reveal.js"];
  const pageScripts = [
    "js/auth.js",
    "js/index.js",
    "js/home.js",
    "js/profile.js",
    "js/user-profile.js",
    "js/quest.js",
    "js/noti.js",
    "js/menu.js",
    "js/about.js",
    "js/feed.js",
    "js/block.js",
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

  // Start Firebase sync in background so auth/transition can render immediately.
  // This removes the blank delay seen on refresh when network is slow.
  const initialSync = DataStore.syncFromRemote().catch(() => null);

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

  // Ensure at least one initial remote sync completes after scripts are ready.
  await initialSync;

  // Start real-time sync — pushes Firebase changes to all open devices/tabs
  DataStore.startSync();

  if (window.ScrollRevealManager) {
    window.ScrollRevealManager.mount({ root: main, mode: "site" });
  }

  // Reveal the layout chrome now that all scripts are loaded and the auth
  // overlay is ready. This prevents the empty header + footer from flashing
  // during the async boot period.
  const headerEl = document.querySelector(".header");
  const footerEl = document.querySelector(".footer");
  if (headerEl) headerEl.style.display = "";
  if (footerEl) footerEl.style.display = "";

  // Fallback hide in case auth script did not remove it yet.
  _hideBootSplash();
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
