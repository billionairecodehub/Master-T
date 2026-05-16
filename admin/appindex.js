// admin/appindex.js — Loads admin partials into main, then loads admin scripts

async function loadPage(url) {
  const response = await fetch(url);
  return response.text();
}

async function boot() {
  console.log("[ADMIN] boot() starting...");
  const main = document.querySelector(".admin-main");
  if (!main) {
    console.error("[ADMIN] .admin-main not found! Is the layout visible?");
    return;
  }

  // Load all admin page partials in parallel
  const [dashboard, posts, quests, content, stats, settings, message, sales] =
    await Promise.all([
      loadPage("pages/dashboard.html"),
      loadPage("pages/posts.html"),
      loadPage("pages/quests.html"),
      loadPage("pages/content.html"),
      loadPage("pages/stats.html"),
      loadPage("pages/settings.html"),
      loadPage("pages/message.html"),
      loadPage("pages/sales.html"),
    ]);

  // Inject all pages into admin main container
  main.innerHTML =
    dashboard + posts + quests + content + stats + settings + message + sales;
  console.log("[ADMIN] All partials injected into .admin-main");
  // Load shared data layer first, sync from Firebase, then admin scripts
  const adminScripts = [
    "js/index.js",
    "js/dashboard.js",
    "js/posts.js",
    "js/quests.js",
    "js/content.js",
    "js/imgUpload.js",
    "js/cs.js",
    "js/stats.js",
    "js/settings.js",
    "js/message.js",
    "js/sales.js",
  ];

  const preloadScripts = ["../shared/data.js", "../shared/scroll-reveal.js"];
  // Load shared scripts first
  for (const src of preloadScripts) {
    await new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = resolve;
      document.body.appendChild(script);
    });
  }

  // Sync latest content from Firebase before rendering admin
  await DataStore.syncFromRemote();

  // Load admin scripts
  for (const src of adminScripts) {
    await new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = resolve;
      document.body.appendChild(script);
    });
  }

  // Start real-time sync so admin sees user votes/impressions live
  DataStore.startSync();
}

boot();
