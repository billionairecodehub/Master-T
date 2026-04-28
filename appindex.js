// appindex.js — Loads all HTML partials into <main>, then loads page scripts

async function loadPage(url) {
  const response = await fetch(url);
  return response.text();
}

async function boot() {
  const main = document.querySelector(".main");

  // Load all 6 page partials in parallel
  const [home, profile, feed, quest, noti, menu, about, block] =
    await Promise.all([
      loadPage("pages/home.html"),
      loadPage("pages/profile.html"),
      loadPage("pages/feed.html"),
      loadPage("pages/quest.html"),
      loadPage("pages/noti.html"),
      loadPage("pages/menu.html"),
      loadPage("pages/about.html"),
      loadPage("pages/block.html"),
    ]);

  // Inject all pages into main container
  main.innerHTML = home + profile + feed + quest + noti + menu + about + block;

  // Now load all JS files in order (shared data first, then sync from Firebase, then page scripts)
  const dataLoad = ["shared/data.js"];
  const pageScripts = [
    "js/index.js",
    "js/home.js",
    "js/profile.js",
    "js/feed.js",
    "js/quest.js",
    "js/noti.js",
    "js/menu.js",
    "js/about.js",
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

boot();
