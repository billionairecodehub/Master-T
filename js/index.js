// ── Real unique daily visitor tracking ──────────────────────────────────
// Key stored per-device in localStorage so one device = one visit per day.
// Counter lives in DataStore profile (Firebase-synced) and resets at UTC midnight.
(function _trackDailyVisit() {
  const todayUTC = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD" UTC
  const visitedKey = "mt_visited_" + todayUTC;
  if (localStorage.getItem(visitedKey)) return; // already counted today
  localStorage.setItem(visitedKey, "1");
  const profile = DataStore.getProfile();
  const storedDate = profile.visitDate || "";
  // If the stored date is still today, increment; otherwise reset to 1
  const newCount = storedDate === todayUTC ? (profile.dailyVisits || 0) + 1 : 1;
  DataStore.setProfile({ visitDate: todayUTC, dailyVisits: newCount });
})();

// Fix 100vh issue on mobile browsers
function setViewportHeight() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--vh", `${vh}px`);
}

setViewportHeight();
window.addEventListener("resize", setViewportHeight);
window.addEventListener("orientationchange", setViewportHeight);

let lastScrollTop = 0;
window.addEventListener("scroll", () => {
  setViewportHeight();
  lastScrollTop = window.scrollY;
});

// Page references
const homePage = document.querySelector(".home");
const profilePage = document.querySelector(".profile-page");
const menuPage = document.querySelector(".menu-page");
const feedPage = document.querySelector(".feed-page");
const questPage = document.querySelector(".quest-page");
const notificationsPage = document.querySelector(".notifications-page");
const aboutPage = document.querySelector(".about-page");
const blockPage = document.querySelector(".block-page");
const headerProfile = document.querySelector(".header-profile");
const headerMenu = document.querySelector(".header-menu");
const navItems = document.querySelectorAll(".nav-item");

// Hide all pages function
function hideAllPages() {
  homePage.style.display = "none";
  profilePage.style.display = "none";
  menuPage.style.display = "none";
  if (feedPage) feedPage.style.display = "none";
  if (questPage) questPage.style.display = "none";
  if (notificationsPage) notificationsPage.style.display = "none";
  if (aboutPage) aboutPage.style.display = "none";
  if (blockPage) blockPage.style.display = "none";
  // Close any open profile panels
  if (typeof closeProfileView === "function") closeProfileView();
  document
    .querySelectorAll(".profile-panel")
    .forEach((p) => p.classList.remove("open"));
  // Reset menu to home view if circle/app/book panel was open
  const cp = document.getElementById("panel-circle");
  const ap = document.getElementById("panel-app");
  const bp = document.getElementById("panel-book");
  const mh = document.querySelector(".menu-home");
  if (mh) {
    if (cp) cp.classList.remove("open");
    if (ap) ap.classList.remove("open");
    if (bp) {
      bp.classList.remove("open");
      const bro = document.getElementById("book-ratings-overlay");
      if (bro) bro.classList.remove("open");
    }
    mh.style.display = "flex";
    // Close any menu expand view
    if (typeof closeExpandView === "function") closeExpandView();
  }
  // Reset per-page expanded/detail states so pages are always clean when navigating away
  if (typeof _feedCollapseAll === "function") _feedCollapseAll();
  if (typeof _questCollapseAll === "function") _questCollapseAll();
  if (typeof _bForceClose === "function") _bForceClose();
}

// Show specific page
function showPage(page) {
  hideAllPages();
  page.style.display = "block";
  const main = document.querySelector(".main");
  if (main) main.scrollTop = 0;
}

function _setActiveNav(navType) {
  navItems.forEach((n) => n.classList.remove("active"));
  const target = document.querySelector(`.nav-item[data-nav="${navType}"]`);
  if (target) target.classList.add("active");
}

// ── URL Router ───────────────────────────────────────────────────────────────
// Generates a URL-safe slug from any string (e.g. "Frame Control" → "frame-control")
function _toSlug(str) {
  return (str || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// Navigate to a clean path, updating browser history
function _navigateTo(path, state = {}) {
  history.pushState(state, "", path);
}

// Core router — reads window.location.pathname and activates the right view.
// Called on boot and on popstate (browser back/forward).
function _router() {
  const raw = window.location.pathname.replace(/\/$/, "") || "/";
  const segments = raw.split("/").filter(Boolean); // e.g. ["app", "frame-control"]
  const type = segments[0] || "";
  const slug = segments[1] || "";

  // ── Store item routes: /app/<slug>  /book/<slug>  /circle/<slug> ──
  if (type === "app" || type === "book" || type === "circle") {
    showPage(menuPage);
    markStoreSeen();
    const collection =
      type === "app" ? "apps" : type === "book" ? "books" : "circles";
    const items = DataStore.getAll(collection);
    const item = items.find((i) => _toSlug(i.name) === slug || i.id === slug);
    if (item) {
      // On popstate: menu.js already loaded, call directly
      if (type === "app" && typeof _menuOpenApp === "function")
        _menuOpenApp(item.id);
      else if (type === "book" && typeof _menuOpenBook === "function")
        _menuOpenBook(item.id);
      else if (type === "circle" && typeof _menuOpenCircle === "function")
        _menuOpenCircle(item.id);
      // On direct URL load: menu.js not loaded yet, set flag for it to pick up
      else window._routerDeepLink = { type: type, id: item.id };
    }
    return true;
  }

  // ── Per-item detail routes ──
  if (type === "post") {
    // Legacy /post/<id> URL — redirect to /feed/<id> so old shared links still work
    history.replaceState({}, "", "/feed" + (slug ? "/" + slug : ""));
    return _router();
  }
  if (type === "story") {
    showPage(blockPage);
    _setActiveNav("Block");
    if (typeof markBlockSeen === "function") markBlockSeen();
    if (slug) {
      // On popstate: block.js loaded, call directly; on direct load: set flag
      if (typeof _bOpenView === "function") _bOpenView("story", slug);
      else window._routerDeepLink = { type: "story", id: slug };
    }
    return true;
  }
  if (type === "update") {
    showPage(blockPage);
    _setActiveNav("Block");
    if (typeof markBlockSeen === "function") markBlockSeen();
    if (slug) {
      if (typeof _bOpenView === "function") _bOpenView("recommend", slug);
      else window._routerDeepLink = { type: "update", id: slug };
    }
    return true;
  }

  // ── Named page routes ──
  if (type === "profile") {
    showPage(profilePage);
    return true;
  }
  if (type === "feed") {
    showPage(feedPage);
    _setActiveNav("feed");
    if (typeof markFeedSeen === "function") markFeedSeen();
    if (slug) {
      // On popstate: feed.js loaded, call directly; on direct load: set flag
      if (typeof _feedOpenPost === "function") _feedOpenPost(slug);
      else window._routerDeepLink = { type: "post", id: slug };
    }
    return true;
  }
  if (type === "quest") {
    showPage(questPage);
    _setActiveNav("Quest");
    if (typeof markQuestSeen === "function") markQuestSeen();
    if (slug) {
      if (typeof _questOpenItem === "function") _questOpenItem(slug);
      else window._routerDeepLink = { type: "quest", id: slug };
    }
    return true;
  }
  if (type === "block") {
    showPage(blockPage);
    _setActiveNav("Block");
    if (typeof markBlockSeen === "function") markBlockSeen();
    return true;
  }
  if (type === "notifications" || type === "notif") {
    showPage(notificationsPage);
    if (typeof markNotiSeen === "function") markNotiSeen();
    return true;
  }
  if (type === "store" || type === "menu") {
    showPage(menuPage);
    markStoreSeen();
    return true;
  }
  if (type === "about") {
    hideAllPages();
    aboutPage.style.display = "flex";
    _setActiveNav("about");
    return true;
  }

  // ── Legacy query-param fallback (?page=feed etc.) ──
  const params = new URLSearchParams(window.location.search);
  const qp = (params.get("page") || "").trim().toLowerCase();
  if (qp) {
    history.replaceState({}, "", "/" + qp);
    return _router();
  }

  // ── Root / home ──
  if (type === "" || type === "home") {
    showPage(homePage);
    _setActiveNav("home");
    return true;
  }

  // ── Unknown path → home (soft 404) ──
  showPage(homePage);
  _setActiveNav("home");
  return false;
}

// Event listeners for header buttons
headerProfile.addEventListener("click", () => {
  _navigateTo("/profile");
  showPage(profilePage);
});

// Header notification button → show notifications page
const headerNotiBtnEl = document.getElementById("header-noti-btn");
if (headerNotiBtnEl) {
  headerNotiBtnEl.addEventListener("click", () => {
    if (notificationsPage) {
      _navigateTo("/notifications");
      showPage(notificationsPage);
      if (typeof markNotiSeen === "function") markNotiSeen();
    }
  });
}

// Header menu icon → show menu page
const headerMenuIconEl = document.getElementById("header-menu-icon");
if (headerMenuIconEl) {
  headerMenuIconEl.addEventListener("click", () => {
    _navigateTo("/store");
    showPage(menuPage);
    markStoreSeen();
  });
}

// Navigation bar clicks
navItems.forEach((navItem) => {
  navItem.addEventListener("click", () => {
    navItems.forEach((n) => n.classList.remove("active"));
    navItem.classList.add("active");

    const navType = navItem.getAttribute("data-nav");
    if (navType === "home") {
      _navigateTo("/");
      showPage(homePage);
    } else if (navType === "profile") {
      _navigateTo("/profile");
      showPage(profilePage);
    } else if (navType === "feed") {
      if (feedPage) {
        _navigateTo("/feed");
        showPage(feedPage);
        if (typeof markFeedSeen === "function") markFeedSeen();
      }
    } else if (navType === "Quest") {
      if (questPage) {
        _navigateTo("/quest");
        showPage(questPage);
        if (typeof markQuestSeen === "function") markQuestSeen();
      }
    } else if (navType === "Block") {
      if (blockPage) {
        _navigateTo("/block");
        showPage(blockPage);
        if (typeof markBlockSeen === "function") markBlockSeen();
      }
    } else if (navType === "Notif") {
      if (notificationsPage) {
        _navigateTo("/notifications");
        showPage(notificationsPage);
      }
    } else if (navType === "about") {
      if (aboutPage) {
        _navigateTo("/about");
        hideAllPages();
        aboutPage.style.display = "flex";
      }
    } else if (navType === "menu") {
      _navigateTo("/store");
      showPage(menuPage);
      markStoreSeen();
    }
  });
});

// Browser back/forward support
window.addEventListener("popstate", () => _router());

// Initialize — run the router on boot
const openedFromQuery = _router();
if (!openedFromQuery) {
  showPage(homePage);
  const homeNav = document.querySelector('.nav-item[data-nav="home"]');
  if (homeNav) homeNav.classList.add("active");
}

// ── Real-time global update handler (Firebase SSE → mt:remote-update) ──
// Also handles cross-tab admin changes via the storage event.
function _applyRemoteChanges(changed) {
  // Posts: smart update — never collapse/interrupt an expanded post
  if (!changed || changed === "posts") {
    const hasExpandedPost = !!document.querySelector(".feed-post.expanded");
    if (hasExpandedPost) {
      if (typeof syncFeedCounts === "function") syncFeedCounts();
    } else {
      if (typeof renderFeedPosts === "function") renderFeedPosts();
    }
    if (typeof updateFeedDot === "function") updateFeedDot();
  }

  // Quests: smart update — never collapse/interrupt an expanded quest board
  if (!changed || changed === "quests") {
    const hasExpandedQuest = !!document.querySelector(".quest-board.expanded");
    if (hasExpandedQuest) {
      if (typeof syncQuestCounts === "function") syncQuestCounts();
    } else {
      if (typeof renderQuests === "function") renderQuests();
    }
    if (typeof updateQuestDot === "function") updateQuestDot();
  }

  // Full re-renders for non-interactive collections
  if (!changed || changed === "notifications") {
    if (typeof renderNotifications === "function") renderNotifications();
    if (typeof updateNotiNavDot === "function") updateNotiNavDot();
  }
  if (!changed || changed === "apps") {
    if (typeof renderMenuApps === "function") renderMenuApps();
    updateStoreDot();
  }
  if (!changed || changed === "books") {
    if (typeof renderMenuBooks === "function") renderMenuBooks();
    updateStoreDot();
  }
  if (!changed || changed === "circles") {
    if (typeof renderMenuCircles === "function") renderMenuCircles();
    updateStoreDot();
  }
  if (!changed || changed === "profile") {
    if (typeof refreshProfileData === "function") refreshProfileData();
  }
  if (!changed || changed === "stories") {
    if (typeof renderBlockStories === "function") renderBlockStories();
    if (typeof updateBlockDot === "function") updateBlockDot();
  }
  if (!changed || changed === "recommends") {
    if (typeof renderBlockRecommends === "function") renderBlockRecommends();
    if (typeof updateBlockDot === "function") updateBlockDot();
  }
  if (!changed || changed === "polls") {
    if (typeof renderBlockPolls === "function") renderBlockPolls();
    if (typeof updateBlockDot === "function") updateBlockDot();
  }
}

// Firebase SSE → real-time push from any device
window.addEventListener("mt:remote-update", (e) => {
  _applyRemoteChanges(e.detail?.changed || null);
});

// Cross-tab admin sync (localStorage storage event, other tabs only)
window.addEventListener("storage", (e) => {
  if (!e.key || !e.key.startsWith("mt_")) return;
  _applyRemoteChanges(null);
});

// ── Store dot: gold alert when new apps/books/circles are added ──
function updateStoreDot() {
  const total =
    DataStore.getAll("apps").filter((a) => !a.draft).length +
    DataStore.getAll("books").filter((b) => !b.draft).length +
    DataStore.getAll("circles").filter((c) => !c.draft).length;
  const seen = parseInt(localStorage.getItem("mt_store_seen") || "0");
  const dot = document.getElementById("store-nav-dot");
  if (dot) dot.style.display = total > seen ? "block" : "none";
}

function markStoreSeen() {
  const total =
    DataStore.getAll("apps").filter((a) => !a.draft).length +
    DataStore.getAll("books").filter((b) => !b.draft).length +
    DataStore.getAll("circles").filter((c) => !c.draft).length;
  localStorage.setItem("mt_store_seen", String(total));
  const dot = document.getElementById("store-nav-dot");
  if (dot) dot.style.display = "none";
}

// ── 3-minute inner refresh ──
setInterval(() => _applyRemoteChanges(null), 3 * 60 * 1000);

// Initialise dot state on load
updateStoreDot();
