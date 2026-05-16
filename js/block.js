// â”€â”€ Block Page: Stories, Recommends, Polls â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const _bHeaderName = document.getElementById("block-header-name");
const _bHeaderIcon = document.getElementById("block-header-icon");
const _bHeaderArea = document.getElementById("block-header-area");
const _bTabs = document.getElementById("block-tabs");
const _bLists = document.getElementById("block-lists");
const _bFullView = document.getElementById("block-full-view");
const _bFullContent = document.getElementById("block-full-content");

const _B_ICON = "https://i.postimg.cc/xTYDWHSN/Mstogan-Block-Icon.png";
const _B_BACK = "https://i.postimg.cc/dtNjQWhf/App-Mode-Back-Icon.png";
const _B_LOGO = "https://i.postimg.cc/pdv2ftPx/Master-Togan-Logo.png";
const _B_STAR = "https://i.postimg.cc/L8f9P1f0/Mtogan-Rating-Icon.png";
const _B_REC_ICON = "https://i.postimg.cc/zG92gDXB/Mt-Recommend-Icon.png";
const _B_POLL_ICON = "https://i.postimg.cc/3x6VFC9y/Mt-Polls-Icon.png";
const _B_STORY_ICON = "https://i.postimg.cc/5NyzWw5P/Mt-Stories-Icon.png";
const _B_FAV_ICON = "https://i.postimg.cc/W45j1Rj6/Mt-Story-Fav-Icon.png";

const _B_TAB_LABELS = {
  stories: "Block | Stories",
  recommends: "Block | Updates",
  polls: "Block | Poll",
};

let _bActiveTab = "stories";
let _bViewType = null; // "story" | "recommend"
let _bViewId = null; // id of open item
let _bScrollPos = 0; // scroll position before opening full view

// ── Filter state (Updates tab) ─────────────────────────────────────────────
const _B_DEFAULT_CATS = ["Dating", "Money", "Frame"];
let _bFilterCat = "All";
let _bPendingCat = "All";
const _bFilterPage = document.getElementById("block-filter-page");

// 1. Tab switching
document.querySelectorAll(".block-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    if (_bViewType) _bCloseView();
    document
      .querySelectorAll(".block-tab")
      .forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    _bActiveTab = tab.getAttribute("data-tab");
    _bHeaderName.textContent = _B_TAB_LABELS[_bActiveTab];
    document.getElementById("block-stories-main").style.display =
      _bActiveTab === "stories" ? "flex" : "none";
    document.getElementById("block-recommends-main").style.display =
      _bActiveTab === "recommends" ? "flex" : "none";
    document.getElementById("block-polls-main").style.display =
      _bActiveTab === "polls" ? "flex" : "none";
  });
});

// 1. Full view open / close
function _bOpenView(type, id) {
  _bViewType = type;
  _bViewId = id;
  // Save scroll position before expanding
  const _bMain = document.querySelector(".main");
  _bScrollPos = _bMain ? _bMain.scrollTop : 0;
  _bTabs.style.display = "none";
  _bLists.style.display = "none";
  _bFullView.style.display = "block";
  _bHeaderIcon.src = _B_BACK;
  if (_bMain) _bMain.scrollTop = 0;
  // Push shareable URL (replaceState if already on that URL — i.e. a direct load, avoids duplicate entry)
  const _bTargetPath =
    type === "story"
      ? "/story/" + id
      : type === "recommend"
        ? "/update/" + id
        : "/poll-why/" + id;
  if (window.location.pathname === _bTargetPath)
    history.replaceState({ type: type, id: id }, "", _bTargetPath);
  else history.pushState({ type: type, id: id }, "", _bTargetPath);
  if (type === "story") _bRenderStory(id);
  else if (type === "recommend") _bRenderRecommend(id);
  else if (type === "poll-why") _bRenderPollWhy(id);
}

function _bCloseView() {
  _bViewType = null;
  _bViewId = null;
  _bTabs.style.display = "flex";
  _bLists.style.display = "flex";
  _bFullView.style.display = "none";
  _bFullContent.innerHTML = "";
  _bHeaderIcon.src = _B_ICON;
  _bHeaderName.textContent = _B_TAB_LABELS[_bActiveTab];
  // Restore scroll position from before the item was opened
  const main = document.querySelector(".main");
  if (main) main.scrollTop = _bScrollPos;
  // Update URL back to /block
  if (
    window.location.pathname.startsWith("/story/") ||
    window.location.pathname.startsWith("/update/") ||
    window.location.pathname.startsWith("/poll-why/")
  )
    history.replaceState({}, "", "/block");
}

// Lightweight reset used by hideAllPages (no scroll side-effects)
function _bForceClose() {
  const filterOpen = _bFilterPage && _bFilterPage.style.display !== "none";
  if (!_bViewType && _bFullView.style.display === "none" && !filterOpen) return;
  _bViewType = null;
  _bViewId = null;
  _bTabs.style.display = "flex";
  _bLists.style.display = "flex";
  _bFullView.style.display = "none";
  _bFullContent.innerHTML = "";
  if (_bFilterPage) _bFilterPage.style.display = "none";
  _bHeaderArea.style.display = "";
  _bHeaderIcon.src = _B_ICON;
  _bHeaderName.textContent = _B_TAB_LABELS[_bActiveTab];
}

// â”€â”€ 1. Back: icon click OR header-area click â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
_bHeaderIcon.addEventListener("click", (e) => {
  e.stopPropagation();
  if (_bViewType) _bCloseView();
});

_bHeaderArea.addEventListener("click", () => {
  if (_bViewType) _bCloseView();
});

// Prevent tab clicks from bubbling to header-area
document
  .querySelectorAll(".block-tab")
  .forEach((t) => t.addEventListener("click", (e) => e.stopPropagation()));

// â”€â”€ Shared helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function _bFmtDate(iso) {
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

function _bTimeLeft(endsAt) {
  if (!endsAt) return "";
  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) return "ended";
  const m = Math.floor(ms / 60000);
  if (m < 60) return m + "min";
  const h = Math.floor(m / 60);
  if (h < 24) return h + "hr";
  return Math.floor(h / 24) + "d";
}

function _bStoryRating(s) {
  const count = s.totalRatingCount || 0;
  if (count === 0) return "~0|5";
  return "~" + Math.round((s.totalRatingScore || 0) / count) + "|5";
}

// ── Block unread dot ─────────────────────────────────────
const BLOCK_SEEN_KEY = "mt_block_seen";

function getBlockSeenIds() {
  try {
    return JSON.parse(localStorage.getItem(BLOCK_SEEN_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function updateBlockDot() {
  const allItems = [
    ...DataStore.getAll("stories"),
    ...DataStore.getAll("recommends"),
    ...DataStore.getAll("polls"),
  ].filter((i) => !i.draft);
  const seen = getBlockSeenIds();
  const hasUnread = allItems.some((i) => !seen.includes(i.id));
  const navDot = document.getElementById("block-nav-dot");
  if (navDot) navDot.style.display = hasUnread ? "block" : "none";
}

function markBlockSeen() {
  const allIds = [
    ...DataStore.getAll("stories"),
    ...DataStore.getAll("recommends"),
    ...DataStore.getAll("polls"),
  ]
    .filter((i) => !i.draft)
    .map((i) => i.id);
  localStorage.setItem(BLOCK_SEEN_KEY, JSON.stringify(allIds));
  updateBlockDot();
}

//
// STORIES
//

function renderBlockStories() {
  const container = document.getElementById("block-stories-main");
  if (!container) return;
  const stories = DataStore.getAll("stories")
    .slice()
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  if (stories.length === 0) {
    container.innerHTML = '<div class="block-empty">No stories yet</div>';
    return;
  }

  // â”€â”€ 2. Story icon replaces avatar; img heart replaces span â”€â”€
  container.innerHTML = stories
    .map((s) => {
      const preview =
        (s.body || "").slice(0, 244) +
        ((s.body || "").length > 244 ? "..." : "");
      const hasLiked = !!localStorage.getItem("mt_story_like_" + s.id);
      return `<div class="block-story-card" data-id="${s.id}">
        <div class="block-story-top">
          <div class="block-story-label">${s.label || ""}</div>
          <img src="${_B_FAV_ICON}" alt="fav" class="block-story-heart-img${hasLiked ? " liked" : ""}" data-id="${s.id}" />
        </div>
        <div class="block-story-profile">
          <img src="${_B_STORY_ICON}" alt="" class="block-story-avatar" />
          <div class="block-story-meta">
            <div class="block-story-subject">${s.subject || ""}</div>
            <div class="block-story-author">${s.author || "Master Togan"}</div>
          </div>
        </div>
        <div class="block-story-preview">${preview}</div>
        <div class="block-story-footer">
          <div class="block-story-readmore">Read Full Story...</div>
          <div class="block-story-rating">
            <span class="block-story-rating-val">${_bStoryRating(s)}</span>
            <img src="${_B_STAR}" alt="â˜…" class="block-story-star-icon" />
          </div>
        </div>
      </div>`;
    })
    .join("");

  // Card click â†’ full view
  container.querySelectorAll(".block-story-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.classList.contains("block-story-heart-img")) return;
      _bOpenView("story", card.getAttribute("data-id"));
    });
  });

  //
  _bBindStoryHearts(container);
}

function _bBindStoryHearts(root) {
  root.querySelectorAll(".block-story-heart-img").forEach((heart) => {
    heart.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = heart.getAttribute("data-id");
      const cdKey = "mt_story_like_cd_" + id;
      if (Date.now() - parseInt(localStorage.getItem(cdKey) || "0", 10) < 60000)
        return;
      const s = DataStore.getById("stories", id);
      if (!s) return;
      const key = "mt_story_like_" + id;
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        localStorage.setItem(cdKey, Date.now().toString());
        DataStore.update("stories", id, {
          likes: Math.max((s.likes || 0) - 1, 0),
        });
        heart.classList.remove("liked");
      } else {
        localStorage.setItem(key, "1");
        localStorage.setItem(cdKey, Date.now().toString());
        DataStore.update("stories", id, { likes: (s.likes || 0) + 1 });
        heart.classList.add("liked");
      }
    });
  });
}

// â”€â”€ 3. Story full view: persists label + icon + heart + title + author â”€â”€
function _bRenderStory(id) {
  const s = DataStore.getById("stories", id);
  if (!s) {
    _bCloseView();
    return;
  }

  // Update header name
  _bHeaderName.textContent = "Block | Stories";

  const hasLiked = !!localStorage.getItem("mt_story_like_" + id);
  // Combine body (split by double newlines) + extra paragraphs array
  const bodyParas = (s.body || "").split(/\n\n+/).filter(Boolean);
  const extraParas = (s.paragraphs || []).filter(Boolean);
  const allParas = [...bodyParas, ...extraParas];
  const parasHTML = allParas
    .map(
      (p) => `<p class="block-story-full-para">${p.replace(/\n/g, "<br>")}</p>`,
    )
    .join("");

  const tks = (s.takeaways || []).slice(0, 5);
  const tksHTML = tks.length
    ? `<div class="block-story-takeaways-label">Lessons &amp; Takeaways :</div>
       ${tks.map((t) => `<div class="block-story-takeaway-card">${t}</div>`).join("")}`
    : "";

  const userStar = parseInt(localStorage.getItem("mt_story_rated_" + id)) || 0;
  const starsHTML = [1, 2, 3, 4, 5]
    .map(
      (n) =>
        `<button class="block-star-btn${userStar >= n ? " active" : ""}" data-star="${n}" data-sid="${id}">
          <img src="${_B_STAR}" alt="${n}" />
        </button>`,
    )
    .join("");

  // â”€â”€ 3. Card header re-rendered inside full view
  _bFullContent.innerHTML = `
    <div class="block-story-full-card-header">
      <div class="block-story-top">
        <div class="block-story-label">${s.label || ""}</div>
        <img src="${_B_FAV_ICON}" alt="fav"
          class="block-story-heart-img${hasLiked ? " liked" : ""}" data-id="${id}" />
      </div>
      <div class="block-story-profile">
        <img src="${_B_STORY_ICON}" alt="" class="block-story-avatar" />
        <div class="block-story-meta">
          <div class="block-story-subject">${s.subject || ""}</div>
          <div class="block-story-author">${s.author || "Master Togan"}</div>
        </div>
      </div>
    </div>
    <div class="block-story-body">
      ${parasHTML}
      ${tksHTML}
      <div class="block-story-end">~ End</div>
      <div class="block-story-rate-section">
        <div class="block-story-rate-title">${s.subject || ""}</div>
        <div class="block-story-rate-label">Give Your Ratings</div>
        <div class="block-story-stars" id="block-stars-${id}">${starsHTML}</div>
      </div>
    </div>`;

  // Heart interactive in full view
  _bBindStoryHearts(_bFullContent);

  // â”€â”€ 4. Star rating per-card, correct undo
  _bFullContent.querySelectorAll(".block-star-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const star = parseInt(btn.getAttribute("data-star"));
      const sid = btn.getAttribute("data-sid");
      const story = DataStore.getById("stories", sid);
      if (!story) return;
      const rKey = "mt_story_rated_" + sid;
      const prev = parseInt(localStorage.getItem(rKey)) || 0;
      if (prev === star) {
        // Undo same star
        localStorage.removeItem(rKey);
        DataStore.update("stories", sid, {
          totalRatingScore: Math.max((story.totalRatingScore || 0) - star, 0),
          totalRatingCount: Math.max((story.totalRatingCount || 0) - 1, 0),
        });
        _bUpdateStars(sid, 0);
      } else {
        // New or switched star
        const newScore = (story.totalRatingScore || 0) - prev + star;
        const newCount =
          prev > 0
            ? story.totalRatingCount || 0
            : (story.totalRatingCount || 0) + 1;
        localStorage.setItem(rKey, String(star));
        DataStore.update("stories", sid, {
          totalRatingScore: newScore,
          totalRatingCount: newCount,
        });
        _bUpdateStars(sid, star);
      }
      // Sync rating badge on list card
      const rEl = document.querySelector(
        `.block-story-card[data-id="${sid}"] .block-story-rating-val`,
      );
      if (rEl) {
        const updated = DataStore.getById("stories", sid);
        if (updated) rEl.textContent = _bStoryRating(updated);
      }
    });
  });
}

function _bUpdateStars(id, active) {
  const el = document.getElementById("block-stars-" + id);
  if (!el) return;
  el.querySelectorAll(".block-star-btn").forEach((btn) => {
    btn.classList.toggle(
      "active",
      parseInt(btn.getAttribute("data-star")) <= active,
    );
  });
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// RECOMMENDS (Updates)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function renderBlockRecommends() {
  const container = document.getElementById("block-recommends-main");
  if (!container) return;
  const allList = DataStore.getAll("recommends")
    .slice()
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  const list =
    _bFilterCat === "All"
      ? allList
      : allList.filter(
          (r) => (r.category || "").toLowerCase() === _bFilterCat.toLowerCase(),
        );

  const countLabel =
    _bFilterCat === "All"
      ? `All ~ ${allList.length}`
      : `${_bFilterCat} ~ ${list.length}`;

  const hdr = `<div class="block-recommend-header-row">
    <div class="block-recommend-header-label">Master Togan ~ Recommendations</div>
    <div class="block-recommend-header-right">
      <div class="updates-filter-icon-wrap" id="block-filter-wrap">
        <img src="https://i.postimg.cc/W4rPYMSj/Mtogan-Filter-Icon.png" alt="Filter" class="block-recommend-filter-icon" id="block-filter-btn" />
        <span class="updates-filter-active-dot" id="block-filter-active-dot"${_bFilterCat !== "All" ? "" : ' style="display:none"'}></span>
      </div>
      <div class="block-recommend-header-count">${countLabel}</div>
    </div>
  </div>`;

  if (list.length === 0) {
    container.innerHTML = hdr + '<div class="block-empty">No updates yet</div>';
    return;
  }

  // ── 5. Collapsed card: CTA (now clickable anchor) ──
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
            <img src="${_B_REC_ICON}" alt="" class="block-recommend-icon" />
            ${r.category ? `<div class="block-recommend-cat-label">${r.category}</div>` : ""}
            <div class="block-recommend-subject">${r.subject || ""}</div>
            <div class="block-recommend-card-footer">
              <div class="block-recommend-readmore">Read More...</div>
              <div class="block-recommend-date">${_bFmtDate(r.createdAt)}</div>
            </div>
          </div>
          ${cta}
        </div>`;
      })
      .join("");

  // Bind filter button (re-rendered on each call)
  const _bFilterBtnEl = container.querySelector("#block-filter-btn");
  if (_bFilterBtnEl)
    _bFilterBtnEl.addEventListener("click", (e) => {
      e.stopPropagation();
      _bOpenFilter();
    });

  container.querySelectorAll(".block-recommend-card").forEach((card) => {
    // CTA anchor: let its href fire, do not expand the post
    card.querySelectorAll(".block-recommend-cta-faded").forEach((cta) => {
      cta.addEventListener("click", (e) => e.stopPropagation());
    });
    // Post body: expand full view
    const inner = card.querySelector(".block-recommend-card-inner");
    if (inner) {
      inner.addEventListener("click", () =>
        _bOpenView("recommend", card.getAttribute("data-id")),
      );
    }
  });
}

// â”€â”€ 3. Recommend full view: persists icon + subject header â”€â”€
function _bRenderRecommend(id) {
  const r = DataStore.getById("recommends", id);
  if (!r) {
    _bCloseView();
    return;
  }

  _bHeaderName.textContent = "Block | Updates";

  const items = (r.items || []).slice(0, 5).filter((text) => text.trim());
  const itemsHTML = items
    .map(
      (text) =>
        `<div class="block-recommend-item">${text.replace(/\n/g, "<br>")}</div>`,
    )
    .join("");

  // â”€â”€ 5. Expanded: active styled CTA button (not full width) â”€â”€
  const ctaHTML = r.ctaLabel
    ? `<a class="block-recommend-full-cta"${r.ctaUrl ? ` href="${r.ctaUrl}" target="_blank" rel="noopener noreferrer"` : ""} style="${r.ctaUrl ? "" : "pointer-events:none;opacity:0.45;"}">` +
      r.ctaLabel +
      `</a>`
    : "";

  // â”€â”€ 3. Card header at top of full view â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  _bFullContent.innerHTML = `
    <div class="block-recommend-full-card-header">
      <img src="${_B_REC_ICON}" alt="" class="block-recommend-full-header-icon" />
      <div class="block-recommend-full-header-subject">${r.subject || ""}</div>
    </div>
    <div class="block-recommend-full-body">
      ${itemsHTML}
      <div class="block-recommend-full-footer">
        <div class="block-recommend-full-author">${r.author || "Master Togan"}</div>
        <div class="block-recommend-full-date">${_bFmtDate(r.createdAt)}</div>
      </div>
      ${ctaHTML}
    </div>`;
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// POLLS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function renderBlockPolls() {
  const container = document.getElementById("block-polls-main");
  if (!container) return;
  const polls = DataStore.getAll("polls")
    .slice()
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  if (polls.length === 0) {
    container.innerHTML = '<div class="block-empty">No polls yet</div>';
    return;
  }

  container.innerHTML = polls.map(_bBuildPollCard).join("");
  _bBindPollVotes(container);
}

function _bBuildPollCard(p) {
  const total = p.totalVotes || 0;
  const isEnded =
    p.status === "ended" || (p.endsAt && new Date(p.endsAt) <= new Date());
  const vKey = "mt_poll_voted_" + p.id;
  const userVote = localStorage.getItem(vKey);
  const hasVoted = userVote !== null;

  let statusText;
  if (isEnded) {
    const fv = total >= 1000 ? (total / 1000).toFixed(1) + "k" : String(total);
    statusText = `${fv} Votes ~ Final Result`;
  } else {
    statusText = `Ongoing ~ Ends in ${_bTimeLeft(p.endsAt)}`;
  }

  const hasAnswer = isEnded && p.correctAnswerIdx != null;
  const hasWhyPost =
    hasAnswer &&
    p.whyPost &&
    (p.whyPost.body || (p.whyPost.threads || []).length > 0) &&
    !p.whyPost.draft;

  const optsHTML = (p.options || [])
    .slice(0, 3)
    .map((opt, i) => {
      const pct = total > 0 ? Math.round(((opt.votes || 0) / total) * 100) : 0;
      const isVoted = userVote === String(i);
      const inactive = isEnded || hasVoted;
      const isCorrect = hasAnswer && i === p.correctAnswerIdx;
      const isWrong = hasAnswer && isVoted && !isCorrect;
      let cls = "";
      if (isVoted) cls += " voted";
      if (inactive) cls += " no-vote";
      if (isCorrect) cls += " correct";
      if (isWrong) cls += " wrong";
      const marker = hasAnswer
        ? isCorrect
          ? `<span class="block-poll-answer-marker correct-marker">✓ Correct</span>`
          : isVoted
            ? `<span class="block-poll-answer-marker wrong-marker">✗ Wrong</span>`
            : `<span class="block-poll-answer-marker empty-marker">Hidden</span>`
        : "";
      return `<div class="block-poll-option${cls}"
        data-poll-id="${p.id}" data-opt-idx="${i}">
        <span class="block-poll-option-text">${opt.text}</span>
        ${marker}
        <span class="block-poll-option-pct">${pct}%</span>
      </div>`;
    })
    .join("");

  const whyHintHTML = hasAnswer
    ? `<span class="poll-why-hint${hasWhyPost ? " has-why" : ""}" data-poll-id="${p.id}">${hasWhyPost ? "Check Out Why >" : "No Details Yet!"}</span>`
    : "";

  return `<div class="block-poll-card${hasAnswer ? " has-answer" : ""}" data-id="${p.id}">
    <div class="block-poll-top">
      <div class="block-poll-label">Poll</div>
      <img src="${_B_POLL_ICON}" alt="" class="block-poll-icon" />
    </div>
    <div class="block-poll-subject">${p.subject || ""}</div>
    <div class="block-poll-options">${optsHTML}</div>
    <div class="block-poll-footer">
      <span class="block-poll-status">${statusText}</span>
      ${whyHintHTML}
    </div>
  </div>`;
}

function _bBindPollVotes(container) {
  container
    .querySelectorAll(".block-poll-option:not(.no-vote)")
    .forEach((opt) => {
      opt.addEventListener("click", () => {
        const pollId = opt.getAttribute("data-poll-id");
        const optIdx = parseInt(opt.getAttribute("data-opt-idx"));
        const poll = DataStore.getById("polls", pollId);
        if (!poll || poll.status === "ended") return;
        const vKey = "mt_poll_voted_" + pollId;
        if (localStorage.getItem(vKey) !== null) return;
        localStorage.setItem(vKey, String(optIdx));
        const newOptions = (poll.options || []).map((o, i) => ({
          ...o,
          votes: i === optIdx ? (o.votes || 0) + 1 : o.votes || 0,
        }));
        DataStore.update("polls", pollId, {
          options: newOptions,
          totalVotes: (poll.totalVotes || 0) + 1,
        });
        renderBlockPolls();
      });
    });

  // Why hint click → open isolated why page
  container.querySelectorAll(".poll-why-hint.has-why").forEach((hint) => {
    hint.addEventListener("click", () => {
      _bOpenView("poll-why", hint.getAttribute("data-poll-id"));
    });
  });
}

// ── Why Post full page renderer (for block-full-view) ─────────────────────────
function _bWhyBuildContent(pollId) {
  const poll = DataStore.getById("polls", pollId);
  if (!poll || !poll.whyPost) return "";
  const wp = poll.whyPost;
  const fmt = (v) => (v >= 1000 ? (v / 1000).toFixed(1) + "k" : String(v));
  const agreeKey = "mt_poll_why_vote_" + pollId;
  const agreeVote = localStorage.getItem(agreeKey);
  const threadsHTML = (wp.threads || [])
    .map(
      (t) => `<div class="poll-why-thread">
        <div class="poll-why-thread-title">${t.title || ""}</div>
        <div class="poll-why-thread-text">${(t.text || "").replace(/\r/g, "")}</div>
      </div>`,
    )
    .join("");
  const optionsHTML = (poll.options || [])
    .slice(0, 3)
    .map((opt, i) => {
      const isCorrect = i === poll.correctAnswerIdx;
      return `<div class="poll-why-opt${isCorrect ? " poll-why-opt-correct" : ""}">
      ${isCorrect ? `<span class="poll-why-opt-marker">✓</span>` : `<span class="poll-why-opt-marker poll-why-opt-marker-empty"></span>`}
      <span class="poll-why-opt-text">${opt.text}</span>
    </div>`;
    })
    .join("");
  return `<div class="poll-why-full">
    <div class="poll-why-full-header">
      <img src="${_B_POLL_ICON}" alt="" class="poll-why-full-icon" />
      <div class="poll-why-full-subject">${poll.subject || ""}</div>
    </div>
    <div class="poll-why-options">${optionsHTML}</div>
    ${wp.image ? `<img src="${wp.image}" class="poll-why-image" alt="" />` : ""}
    <div class="poll-why-title-row"><span class="poll-why-title">Why?</span></div>
    ${wp.body ? `<div class="poll-why-body">${wp.body.replace(/\r/g, "")}</div>` : ""}
    ${threadsHTML}
    <div class="poll-why-thumbs">
      <div class="poll-why-thumb poll-why-agree${agreeVote === "agree" ? " voted" : ""}" data-poll-id="${pollId}">
        <img src="https://i.postimg.cc/8C7LB7fM/Mt-Quest-Thumbs-Up-Icon.png" alt="Agree" class="quest-thumb-icon" />
        <span class="quest-thumb-count">${fmt(poll.whyAgree || 0)}</span>
      </div>
      <div class="poll-why-thumb poll-why-disagree${agreeVote === "disagree" ? " voted" : ""}" data-poll-id="${pollId}">
        <img src="https://i.postimg.cc/fb1mHMY1/Mt-Quest-Thumbs-Down-Icon.png" alt="Disagree" class="quest-thumb-icon" />
        <span class="quest-thumb-count">${fmt(poll.whyDisagree || 0)}</span>
      </div>
    </div>
  </div>`;
}

function _bRenderPollWhy(pollId) {
  _bFullContent.innerHTML = _bWhyBuildContent(pollId);
  _bBindWhyThumbs(pollId);
}

function _bBindWhyThumbs(pollId) {
  _bFullContent
    .querySelectorAll(".poll-why-agree, .poll-why-disagree")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        const poll = DataStore.getById("polls", pollId);
        if (!poll) return;
        const aKey = "mt_poll_why_vote_" + pollId;
        const prevVote = localStorage.getItem(aKey);
        const isAgree = btn.classList.contains("poll-why-agree");
        const clicked = isAgree ? "agree" : "disagree";
        if (prevVote === clicked) {
          localStorage.removeItem(aKey);
          DataStore.update("polls", pollId, {
            whyAgree: Math.max(0, (poll.whyAgree || 0) - (isAgree ? 1 : 0)),
            whyDisagree: Math.max(
              0,
              (poll.whyDisagree || 0) - (isAgree ? 0 : 1),
            ),
          });
        } else if (prevVote) {
          localStorage.setItem(aKey, clicked);
          DataStore.update("polls", pollId, {
            whyAgree: Math.max(0, (poll.whyAgree || 0) + (isAgree ? 1 : -1)),
            whyDisagree: Math.max(
              0,
              (poll.whyDisagree || 0) + (isAgree ? -1 : 1),
            ),
          });
        } else {
          localStorage.setItem(aKey, clicked);
          DataStore.update("polls", pollId, {
            whyAgree: (poll.whyAgree || 0) + (isAgree ? 1 : 0),
            whyDisagree: (poll.whyDisagree || 0) + (isAgree ? 0 : 1),
          });
        }
        _bFullContent.innerHTML = _bWhyBuildContent(pollId);
        _bBindWhyThumbs(pollId);
      });
    });
}

// ── Filter (Updates tab) ──────────────────────────────────────────────────────

function _bGetAllCats() {
  const customs = DataStore.getAll("updateCategories")
    .map((c) => c.name)
    .filter(Boolean);
  const merged = [..._B_DEFAULT_CATS];
  customs.forEach((c) => {
    if (!merged.includes(c)) merged.push(c);
  });
  return merged.sort((a, b) => a.localeCompare(b));
}

function _bRenderFilterCats(search) {
  const catsEl = document.getElementById("block-filter-cats");
  if (!catsEl) return;
  const q = (search || "").toLowerCase().trim();
  const allUpdates = DataStore.getAll("recommends");
  const allCats = _bGetAllCats();

  const subtitleEl = document.getElementById("block-filter-subtitle");
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
          _bPendingCat === item.name ? " selected" : ""
        }" data-cat="${item.name}"><div class="updates-filter-cat-count">${item.count}</div><div class="updates-filter-cat-name">${item.name}</div></div>`,
    )
    .join("")}</div>`;

  catsEl.querySelectorAll(".updates-filter-cat-card").forEach((card) => {
    card.addEventListener("click", () => {
      _bPendingCat = card.getAttribute("data-cat");
      _bRenderFilterCats(search);
    });
  });
}

function _bUpdateFilterDot() {
  const dot = document.getElementById("block-filter-active-dot");
  if (dot) dot.style.display = _bFilterCat !== "All" ? "block" : "none";
}

function _bOpenFilter() {
  if (_bViewType) return;
  _bPendingCat = _bFilterCat;
  _bLists.style.display = "none";
  _bTabs.style.display = "none";
  _bHeaderArea.style.display = "none";
  _bFilterPage.style.display = "flex";
  document.getElementById("block-filter-search").value = "";
  _bRenderFilterCats("");
}

function _bCloseFilter(apply) {
  if (apply) {
    _bFilterCat = _bPendingCat;
    _bUpdateFilterDot();
    renderBlockRecommends();
  }
  _bFilterPage.style.display = "none";
  _bHeaderArea.style.display = "";
  _bTabs.style.display = "flex";
  _bLists.style.display = "flex";
}

document.getElementById("block-filter-back").addEventListener("click", () => {
  _bCloseFilter(false);
});

document.getElementById("block-filter-apply").addEventListener("click", () => {
  const btn = document.getElementById("block-filter-apply");
  btn.textContent = "Applied";
  btn.disabled = true;
  setTimeout(() => {
    _bCloseFilter(true);
    btn.textContent = "Apply";
    btn.disabled = false;
  }, 900);
});

document
  .getElementById("block-filter-search")
  .addEventListener("input", (e) => {
    _bRenderFilterCats(e.target.value);
  });

// ── Initial render ────────────────────────────────────────────────────────────
_bHeaderName.textContent = _B_TAB_LABELS[_bActiveTab];
renderBlockStories();
renderBlockRecommends();
renderBlockPolls();
updateBlockDot();
// Apply deep link set by router before this script loaded (direct URL open)
// rAF lets the block list paint first, then opens the inner view
if (window._routerDeepLink) {
  const _dl = window._routerDeepLink;
  if (_dl.type === "story" || _dl.type === "update") {
    window._routerDeepLink = null;
    requestAnimationFrame(() =>
      _bOpenView(_dl.type === "update" ? "recommend" : "story", _dl.id),
    );
  }
}
