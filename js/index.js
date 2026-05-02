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
}

// Show specific page
function showPage(page) {
  hideAllPages();
  page.style.display = "block";
  const main = document.querySelector(".main");
  if (main) main.scrollTop = 0;
}

// Event listeners for header buttons
headerProfile.addEventListener("click", () => {
  showPage(profilePage);
});

// Header notification button → show notifications page
const headerNotiBtnEl = document.getElementById("header-noti-btn");
if (headerNotiBtnEl) {
  headerNotiBtnEl.addEventListener("click", () => {
    if (notificationsPage) {
      showPage(notificationsPage);
      if (typeof markNotiSeen === "function") markNotiSeen();
    }
  });
}

// Header menu icon → show menu page
const headerMenuIconEl = document.getElementById("header-menu-icon");
if (headerMenuIconEl) {
  headerMenuIconEl.addEventListener("click", () => {
    showPage(menuPage);
    markStoreSeen();
  });
}

// Navigation bar clicks
navItems.forEach((navItem) => {
  navItem.addEventListener("click", () => {
    // Update active state
    navItems.forEach((n) => n.classList.remove("active"));
    navItem.classList.add("active");

    const navType = navItem.getAttribute("data-nav");
    if (navType === "home") {
      showPage(homePage);
    } else if (navType === "profile") {
      showPage(profilePage);
    } else if (navType === "feed") {
      if (feedPage) {
        showPage(feedPage);
        // Mark all current posts as seen — clears the unread dot
        if (typeof markFeedSeen === "function") markFeedSeen();
      }
    } else if (navType === "Quest") {
      if (questPage) {
        showPage(questPage);
        // Mark all current quests as seen — clears the unread dot
        if (typeof markQuestSeen === "function") markQuestSeen();
      }
    } else if (navType === "Block") {
      if (blockPage) {
        showPage(blockPage);
        if (typeof markBlockSeen === "function") markBlockSeen();
      }
    } else if (navType === "Notif") {
      if (notificationsPage) showPage(notificationsPage);
    } else if (navType === "about") {
      if (aboutPage) {
        hideAllPages();
        aboutPage.style.display = "flex";
      }
    } else if (navType === "menu") {
      showPage(menuPage);
      markStoreSeen();
    }
  });
});

// Initialize by showing the home page
showPage(homePage);
// Set home nav as active by default
const homeNav = document.querySelector('.nav-item[data-nav="home"]');
if (homeNav) homeNav.classList.add("active");

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
