// Feed — Render posts from DataStore + Expand/Collapse

const feedPostIcon = document.querySelector(".feed-icon");
const FEED_ICON_DEFAULT = feedPostIcon ? feedPostIcon.getAttribute("src") : "";
const BACK_ICON_SRC = "https://i.postimg.cc/dtNjQWhf/App-Mode-Back-Icon.png";
const LOGO_SRC = "https://i.postimg.cc/nr9srgXk/Master-Togan-Profile-Image.png";

let _feedScrollPos = 0;

// ── Feed unread dot ──────────────────────────────────────
const FEED_SEEN_KEY = "mt_feed_seen";

function getFeedSeenIds() {
  try {
    return JSON.parse(localStorage.getItem(FEED_SEEN_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function updateFeedDot() {
  const posts = DataStore.getAll("posts");
  const seen = getFeedSeenIds();
  const hasUnread = posts.some((p) => !seen.includes(p.id));
  const navDot = document.getElementById("feed-nav-dot");
  const headerDot = document.getElementById("feed-unread-dot");
  if (navDot) navDot.style.display = hasUnread ? "block" : "none";
  if (headerDot) headerDot.style.display = hasUnread ? "block" : "none";
}

function markFeedSeen() {
  const ids = DataStore.getAll("posts").map((p) => p.id);
  localStorage.setItem(FEED_SEEN_KEY, JSON.stringify(ids));
  updateFeedDot();
}

// ── Surgical count-only update (no re-render, preserves expanded state) ──
function syncFeedCounts() {
  const posts = DataStore.getAll("posts");
  posts.forEach((p) => {
    const fmt = (v) => (v >= 1000 ? (v / 1000).toFixed(1) + "k" : String(v));
    const likeEl = document.querySelector(
      `.post-like-btn[data-id="${p.id}"] .post-like-count`,
    );
    if (likeEl) likeEl.textContent = fmt(p.likes || 0);
    const impEl = document.querySelector(
      `.post-impression-stat[data-id="${p.id}"] .post-impression-count`,
    );
    if (impEl) impEl.textContent = fmt(p.impressions || 0);
  });
}
// ────────────────────────────────────────────────────────

// ── Collapse all posts back to list (used by router + back handlers) ──
function _feedCollapseAll() {
  document.querySelectorAll(".feed-post").forEach((p) => {
    p.classList.remove("expanded");
    p.style.display = "flex";
  });
  document
    .querySelectorAll(".post-date-label")
    .forEach((d) => (d.style.display = ""));
  if (feedPostIcon) feedPostIcon.src = FEED_ICON_DEFAULT;
}

// ── Open a specific post by id (called by router on direct URL load) ──
function _feedOpenPost(id) {
  const post = document.querySelector(`.feed-post[data-id="${id}"]`);
  if (!post) return;
  const mainEl = document.querySelector(".main");
  _feedScrollPos = mainEl ? mainEl.scrollTop : 0;
  document.querySelectorAll(".feed-post").forEach((p) => {
    p.classList.remove("expanded");
    p.style.display = "none";
  });
  document
    .querySelectorAll(".post-date-label")
    .forEach((d) => (d.style.display = "none"));
  post.style.display = "flex";
  post.classList.add("expanded");
  if (feedPostIcon) feedPostIcon.src = BACK_ICON_SRC;
  if (mainEl) mainEl.scrollTop = 0;
}
// ────────────────────────────────────────────────────────

// 6 random colors for book CTA tags
const CTA_TAG_COLORS = [
  "#5c3a1e",
  "#1e3a5c",
  "#3a5c1e",
  "#5c1e3a",
  "#1e5c5c",
  "#5c5c1e",
];

// ── Relative time helper ──
function getRelativeTime(dateStr) {
  if (!dateStr) return "";
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  if (isNaN(then)) return "";
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return "~" + diffMin + "min ago";
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return "~" + diffHr + "hr ago";
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return "~" + diffDay + "d ago";
  const diffWeek = Math.floor(diffDay / 7);
  return "~" + diffWeek + "w ago";
}

function renderFeedPosts() {
  const container = document.getElementById("feed-main");
  const _profileImg = DataStore.getProfile().img || LOGO_SRC;
  const posts = DataStore.getAll("posts")
    .slice()
    .sort((a, b) => {
      const da = new Date(a.createdAt || 0).getTime();
      const db = new Date(b.createdAt || 0).getTime();
      return db - da;
    });
  console.log("[FEED] Rendering", posts.length, "posts from DataStore");

  if (posts.length === 0) {
    container.innerHTML =
      '<div style="text-align:center;padding:40px;color:#333">No posts yet</div>';
    return;
  }

  container.innerHTML = posts
    .map((p, idx) => {
      const threadsHTML = (p.threads || [])
        .map(
          (t) =>
            `<div class="post-thread-title">${t.title || ""} :</div>
             <p class="post-thread-text">${(t.text || "").replace(/\r/g, "")}</p>`,
        )
        .join("");

      const tagColor = CTA_TAG_COLORS[idx % CTA_TAG_COLORS.length];
      let ctaUrl = "";
      let ctaLabel = p.ctaLabel || ""; // static fallback if item no longer exists
      if (p.ctaType && p.ctaItemId) {
        const storeKey =
          p.ctaType === "apps"
            ? "apps"
            : p.ctaType === "books"
              ? "books"
              : "circles";
        const items = DataStore.getAll(storeKey);
        const item = items.find((i) => i.id === p.ctaItemId);
        if (item) {
          // Always derive label live from current item data (so price/name changes reflect here)
          if (p.ctaType === "apps") {
            ctaUrl = item.ctaUrl || "";
            ctaLabel = `Visit ${item.name}`;
          } else if (p.ctaType === "books") {
            ctaUrl =
              (item.platformUrls && item.platformUrls[0]) || item.ctaUrl || "";
            ctaLabel = `Get ${item.name}${item.price ? " ~ " + item.price : ""}`;
          } else if (p.ctaType === "circle") {
            ctaUrl = item.url || "";
            ctaLabel = `Check Out ${item.name} on ${item.platform || "Circle"}`;
          }
        }
      }
      const ctaHTML = ctaLabel
        ? ctaUrl
          ? `<a class="post-cta-tag" href="${ctaUrl}" target="_blank" rel="noopener noreferrer" style="background:${tagColor}">${ctaLabel}</a>`
          : `<span class="post-cta-tag" style="background:${tagColor};pointer-events:none;">${ctaLabel}</span>`
        : "";

      const likes = p.likes || 0;
      const impressions = p.impressions || 0;
      const timeDisplay = getRelativeTime(p.createdAt) || p.timeframe || "";

      // Check if user already liked
      const likeKey = "mt_post_like_" + p.id;
      const hasLiked = localStorage.getItem(likeKey);

      return `
        <div class="post-date-label">${p.date || ""}</div>
        <div class="feed-post" data-id="${p.id}">
          <div class="post-top">
            <div class="post-image-wrap">
              <img src="${_profileImg}" alt="Post" class="post-image" />
            </div>
            <div class="post-title-block">
              <div class="post-subject">${p.subject || ""}</div>
              <div class="post-author">${p.author || "Master Togan"}</div>
            </div>
          </div>
          <div class="post-content">${(p.content || "").replace(/\r/g, "")}</div>
          ${threadsHTML ? '<div class="post-read-more">Read More...</div>' : ""}
          <div class="post-expanded-content">${threadsHTML}</div>
          <div class="post-footer">
            <div class="post-footer-left">
              <div class="post-footer-stat post-like-btn${hasLiked ? " voted" : ""}" data-id="${p.id}">
                <img src="https://i.postimg.cc/Bn1VbVYY/Mt-Post-Fav-Icon.png" alt="Like" class="post-footer-icon post-like-icon" />
                <span class="post-footer-count post-like-count">${likes > 0 ? (likes >= 1000 ? (likes / 1000).toFixed(1) + "k" : likes) : "0"}</span>
              </div>
              <div class="post-footer-stat post-impression-stat" data-id="${p.id}">
                <img src="https://i.postimg.cc/GtBqYQW6/Mtogan-Impression-Icon.png" alt="Impressions" class="post-footer-icon post-impression-icon" />
                <span class="post-footer-count post-impression-count">${impressions > 0 ? (impressions >= 1000 ? (impressions / 1000).toFixed(1) + "k" : impressions) : "0"}</span>
              </div>
            </div>
            <div class="post-footer-right">
              <div class="post-timeframe">${timeDisplay}</div>
              ${ctaHTML}
            </div>
          </div>
        </div>`;
    })
    .join("");

  bindFeedExpand();
  updateFeedDot();
}

function bindFeedExpand() {
  const feedPosts = document.querySelectorAll(".feed-post");
  const dateLabels = document.querySelectorAll(".post-date-label");
  feedPosts.forEach((post) => {
    post.addEventListener("click", (e) => {
      // Don't toggle if clicking vote buttons
      if (e.target.closest(".post-like-btn")) return;
      if (e.target.closest(".post-cta-tag")) return;
      if (post.classList.contains("expanded")) return;
      // Save scroll position before expanding
      const _mainEl = document.querySelector(".main");
      _feedScrollPos = _mainEl ? _mainEl.scrollTop : 0;
      // Collapse all and isolate this one
      feedPosts.forEach((p) => {
        p.classList.remove("expanded");
        p.style.display = "none";
      });
      dateLabels.forEach((d) => (d.style.display = "none"));
      post.style.display = "flex";
      post.classList.add("expanded");
      if (feedPostIcon) feedPostIcon.src = BACK_ICON_SRC;
      // Scroll to top of post
      if (_mainEl) _mainEl.scrollTop = 0;
      // Push shareable URL for this post (only if not already there — avoids duplicate entry on direct load)
      const postId = post.getAttribute("data-id");
      const _postPath = "/feed/" + postId;
      if (window.location.pathname !== _postPath)
        history.pushState({ type: "post", id: postId }, "", _postPath);

      // Auto-increment impression on open
      const impKey = "mt_post_imp_" + postId;
      if (!localStorage.getItem(impKey)) {
        const p = DataStore.getById("posts", postId);
        if (p) {
          const newImps = (p.impressions || 0) + 1;
          DataStore.update("posts", postId, { impressions: newImps });
          localStorage.setItem(impKey, "1");
          const countEl = post.querySelector(".post-impression-count");
          if (countEl) {
            countEl.textContent =
              newImps >= 1000 ? (newImps / 1000).toFixed(1) + "k" : newImps;
          }
        }
      }
    });
  });
  bindPostVotes();
}

function bindPostVotes() {
  document.querySelectorAll(".post-like-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const post = btn.closest(".feed-post");
      if (!post || !post.classList.contains("expanded")) return;
      if (btn.dataset.busy) return; // guard against rapid double-tap
      btn.dataset.busy = "1";
      const postId = btn.getAttribute("data-id");
      const cdKey = "mt_post_like_cd_" + postId;
      if (
        Date.now() - parseInt(localStorage.getItem(cdKey) || "0", 10) <
        60000
      ) {
        delete btn.dataset.busy;
        return;
      }
      const voteKey = "mt_post_like_" + postId;
      const p = DataStore.getById("posts", postId);
      if (!p) return;

      if (localStorage.getItem(voteKey)) {
        // Undo like
        const newLikes = Math.max((p.likes || 0) - 1, 0);
        DataStore.update("posts", postId, { likes: newLikes });
        localStorage.removeItem(voteKey);
        localStorage.setItem(cdKey, Date.now().toString());
        btn.classList.remove("voted");
        const countEl = btn.querySelector(".post-like-count");
        countEl.textContent =
          newLikes >= 1000 ? (newLikes / 1000).toFixed(1) + "k" : newLikes;
      } else {
        // Like
        const newLikes = (p.likes || 0) + 1;
        DataStore.update("posts", postId, { likes: newLikes });
        localStorage.setItem(voteKey, "1");
        localStorage.setItem(cdKey, Date.now().toString());
        btn.classList.add("voted");
        const countEl = btn.querySelector(".post-like-count");
        countEl.textContent =
          newLikes >= 1000 ? (newLikes / 1000).toFixed(1) + "k" : newLikes;
      }
      delete btn.dataset.busy;
    });
  });
}

if (feedPostIcon) {
  feedPostIcon.addEventListener("click", (e) => {
    e.stopPropagation();
    _feedCollapseAll();
    const _mainEl = document.querySelector(".main");
    if (_mainEl) _mainEl.scrollTop = _feedScrollPos;
    if (window.location.pathname.startsWith("/feed/"))
      history.replaceState({}, "", "/feed");
  });
}

// Click anywhere on feed-header to close expanded post
const feedHeader = document.querySelector(".feed-header");
if (feedHeader) {
  feedHeader.addEventListener("click", () => {
    _feedCollapseAll();
    const _mainEl = document.querySelector(".main");
    if (_mainEl) _mainEl.scrollTop = _feedScrollPos;
    if (window.location.pathname.startsWith("/feed/"))
      history.replaceState({}, "", "/feed");
  });
}

// Initial render
renderFeedPosts();
// Apply deep link set by router before this script loaded (direct URL open)
// rAF lets the feed list paint first, then opens the post — parent page shows briefly before inner view
if (window._routerDeepLink && window._routerDeepLink.type === "post") {
  const _dl = window._routerDeepLink;
  window._routerDeepLink = null;
  requestAnimationFrame(() => _feedOpenPost(_dl.id));
}
