// Quest — Render quests from DataStore + Expand/Collapse + Voting

const questIcon = document.querySelector(".quest-icon");
const QUEST_ICON_DEFAULT = questIcon ? questIcon.getAttribute("src") : "";
const QUEST_BACK_ICON = "https://i.postimg.cc/dtNjQWhf/App-Mode-Back-Icon.png";
const QUEST_LOGO = "https://i.postimg.cc/pdv2ftPx/Master-Togan-Logo.png";

let _questScrollPos = 0;

// ── Quest unread dot ─────────────────────────────────────
const QUEST_SEEN_KEY = "mt_quest_seen";

function getQuestSeenIds() {
  try {
    return JSON.parse(localStorage.getItem(QUEST_SEEN_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function updateQuestDot() {
  const quests = DataStore.getAll("quests");
  const seen = getQuestSeenIds();
  const hasUnread = quests.some((q) => !seen.includes(q.id));
  const navDot = document.getElementById("quest-nav-dot");
  const headerDot = document.getElementById("quest-unread-dot");
  if (navDot) navDot.style.display = hasUnread ? "block" : "none";
  if (headerDot) headerDot.style.display = hasUnread ? "block" : "none";
}

function markQuestSeen() {
  const ids = DataStore.getAll("quests").map((q) => q.id);
  localStorage.setItem(QUEST_SEEN_KEY, JSON.stringify(ids));
  updateQuestDot();
}

// ── Surgical count-only update (no re-render, preserves expanded state) ──
function syncQuestCounts() {
  const quests = DataStore.getAll("quests");
  quests.forEach((q) => {
    const fmt = (v) => (v >= 1000 ? (v / 1000).toFixed(1) + "k" : String(v));
    const upEl = document.querySelector(
      `.quest-thumb-up[data-id="${q.id}"] .quest-thumb-count`,
    );
    if (upEl) upEl.textContent = fmt(q.thumbsUp || 0);
    const downEl = document.querySelector(
      `.quest-thumb-down[data-id="${q.id}"] .quest-thumb-count`,
    );
    if (downEl) downEl.textContent = fmt(q.thumbsDown || 0);
  });
}
// ────────────────────────────────────────────────────────

// ── Collapse all quests back to list (used by router + back handlers) ──
function _questCollapseAll() {
  document.querySelectorAll(".quest-board").forEach((b) => {
    b.classList.remove("expanded");
    b.style.display = "flex";
  });
  if (questIcon) questIcon.src = QUEST_ICON_DEFAULT;
}

// ── Open a specific quest by id (called by router on direct URL load) ──
function _questOpenItem(id) {
  const board = document.querySelector(`.quest-board[data-id="${id}"]`);
  if (!board) return;
  const mainEl = document.querySelector(".main");
  _questScrollPos = mainEl ? mainEl.scrollTop : 0;
  document.querySelectorAll(".quest-board").forEach((b) => {
    b.classList.remove("expanded");
    b.style.display = "none";
  });
  board.style.display = "flex";
  board.classList.add("expanded");
  if (questIcon) questIcon.src = QUEST_BACK_ICON;
  if (mainEl) mainEl.scrollTop = 0;
}
// ────────────────────────────────────────────────────────

function renderQuests() {
  const container = document.getElementById("quest-main");
  if (!container) return;
  const quests = DataStore.getAll("quests")
    .slice()
    .sort((a, b) => {
      const da = new Date(a.createdAt || 0).getTime();
      const db = new Date(b.createdAt || 0).getTime();
      return db - da;
    });

  if (quests.length === 0) {
    container.innerHTML =
      '<div style="text-align:center;padding:40px;color:#333">No quests yet</div>';
    return;
  }

  container.innerHTML = quests
    .map((p) => {
      const solutionHTML = (p.threads || [])
        .map(
          (t) =>
            `<div class="quest-solution-block"><span class="quest-solution-title">${t.title || ""}</span></div>
             <p class="quest-solution-text">${(t.text || "").replace(/\r/g, "")}</p>`,
        )
        .join("");

      const hasThreads = p.threads && p.threads.length > 0;
      const thumbsUp = p.thumbsUp || 0;
      const thumbsDown = p.thumbsDown || 0;

      // Key Takeaway block (hardcoded title, content from admin)
      const takeawayHTML = p.keyTakeaway
        ? `<div class="quest-takeaway-block">
             <div class="quest-takeaway-title">Key Takeaway</div>
             <div class="quest-takeaway-text">${p.keyTakeaway.replace(/\r/g, "")}</div>
           </div>`
        : "";

      // Recommendation block (hardcoded title, content from admin)
      const recommendationHTML = p.recommendation
        ? `<div class="quest-recommendation-block">
             <div class="quest-recommendation-title">Recommendation</div>
             <div class="quest-recommendation-text">${p.recommendation.replace(/\r/g, "")}</div>
           </div>`
        : "";

      // Header image (shown when expanded, at the start of content)
      const headerImgHTML = p.img
        ? `<div class="quest-header-img-wrap"><img src="${p.img}" alt="" class="quest-header-img" /></div>`
        : "";

      // CTA board (shown after key takeaway)
      const ctaHTML =
        p.ctaImg || p.ctaLabel
          ? `<div class="quest-cta-board" data-cta-id="${p.ctaItemId || ""}" data-cta-type="${p.ctaType || ""}">
               ${p.ctaImg ? `<div class="quest-cta-img-wrap"><img src="${p.ctaImg}" alt="" class="quest-cta-img" /></div>` : ""}
               ${p.ctaLabel ? `<div class="quest-cta-label">${p.ctaLabel}</div>` : ""}
             </div>`
          : "";

      // Check existing vote
      const voteKey = "mt_quest_vote_" + p.id;
      const existingVote = localStorage.getItem(voteKey);

      const subject = p.subject || "";

      return `
        <div class="quest-board" data-id="${p.id}">
          <div class="quest-top">
            <div class="quest-question">${subject}</div>
            <img src="https://i.postimg.cc/261CZPjm/Mt-Admin-Bar-Icon-Quest.png" alt="" class="quest-question-icon" />
          </div>
          ${hasThreads ? '<div class="quest-read-label">Open to Read Solution</div>' : ""}
          <div class="quest-thumbs">
            <div class="quest-thumb quest-thumb-up${existingVote === "up" ? " voted" : ""}" data-id="${p.id}" data-vote="up">
              <img src="https://i.postimg.cc/8C7LB7fM/Mt-Quest-Thumbs-Up-Icon.png" alt="Up" class="quest-thumb-icon" />
              <span class="quest-thumb-count">${thumbsUp > 0 ? (thumbsUp >= 1000 ? (thumbsUp / 1000).toFixed(1) + "k" : thumbsUp) : "0"}</span>
            </div>
            <div class="quest-thumb quest-thumb-down${existingVote === "down" ? " voted" : ""}" data-id="${p.id}" data-vote="down">
              <img src="https://i.postimg.cc/fb1mHMY1/Mt-Quest-Thumbs-Down-Icon.png" alt="Down" class="quest-thumb-icon" />
              <span class="quest-thumb-count">${thumbsDown > 0 ? (thumbsDown >= 1000 ? (thumbsDown / 1000).toFixed(1) + "k" : thumbsDown) : "0"}</span>
            </div>
          </div>
          ${headerImgHTML}
          ${hasThreads ? `<div class="quest-solution">${solutionHTML}</div>` : ""}
          ${takeawayHTML}
          ${recommendationHTML}
          ${ctaHTML}
        </div>`;
    })
    .join("");

  bindQuestExpand();
  bindQuestVotes();
  bindQuestCTA();
  updateQuestDot();
}

function bindQuestExpand() {
  const boards = document.querySelectorAll(".quest-board");
  boards.forEach((board) => {
    board.addEventListener("click", (e) => {
      // Don't toggle if clicking a vote button
      if (e.target.closest(".quest-thumb")) return;
      if (board.classList.contains("expanded")) return;
      // Save scroll position before expanding
      const _questMain = document.querySelector(".main");
      _questScrollPos = _questMain ? _questMain.scrollTop : 0;
      // Isolate: hide all boards, show only this one (mirror feed pattern)
      boards.forEach((b) => {
        b.classList.remove("expanded");
        b.style.display = "none";
      });
      board.style.display = "flex";
      board.classList.add("expanded");
      if (questIcon) questIcon.src = QUEST_BACK_ICON;
      // Scroll to top of expanded board
      if (_questMain) _questMain.scrollTop = 0;
      // Push shareable URL for this quest (only if not already there)
      const _qPath = "/quest/" + board.getAttribute("data-id");
      if (window.location.pathname !== _qPath)
        history.pushState(
          { type: "quest", id: board.getAttribute("data-id") },
          "",
          _qPath,
        );
    });
  });
}

function bindQuestVotes() {
  document.querySelectorAll(".quest-thumb").forEach((thumb) => {
    thumb.addEventListener("click", (e) => {
      e.stopPropagation();
      const board = thumb.closest(".quest-board");
      // Only allow voting when expanded
      if (!board || !board.classList.contains("expanded")) return;

      // Guard: ignore rapid repeated clicks
      if (board.dataset.voting) return;
      board.dataset.voting = "1";
      setTimeout(() => delete board.dataset.voting, 400);

      const questId = thumb.getAttribute("data-id");
      const voteType = thumb.getAttribute("data-vote");
      const quest = DataStore.getById("quests", questId);
      if (!quest) return;

      // 1-minute cooldown per quest
      const cdKey = "mt_quest_vote_cd_" + questId;
      if (Date.now() - parseInt(localStorage.getItem(cdKey) || "0", 10) < 60000)
        return;

      const voteKey = "mt_quest_vote_" + questId;
      const existingVote = localStorage.getItem(voteKey);

      if (existingVote === voteType) {
        // Undo vote (same button clicked again)
        if (voteType === "up") {
          DataStore.update("quests", questId, {
            thumbsUp: Math.max((quest.thumbsUp || 0) - 1, 0),
          });
        } else {
          DataStore.update("quests", questId, {
            thumbsDown: Math.max((quest.thumbsDown || 0) - 1, 0),
          });
        }
        localStorage.removeItem(voteKey);
        localStorage.setItem(cdKey, Date.now().toString());
        thumb.classList.remove("voted");
        // Update count
        const updated = DataStore.getById("quests", questId);
        const countEl = thumb.querySelector(".quest-thumb-count");
        const newCount =
          voteType === "up" ? updated.thumbsUp || 0 : updated.thumbsDown || 0;
        countEl.textContent =
          newCount >= 1000
            ? (newCount / 1000).toFixed(1) + "k"
            : newCount.toString();
      } else if (existingVote) {
        // Switch vote (different button clicked)
        if (existingVote === "up") {
          DataStore.update("quests", questId, {
            thumbsUp: Math.max((quest.thumbsUp || 0) - 1, 0),
            thumbsDown: (quest.thumbsDown || 0) + 1,
          });
        } else {
          DataStore.update("quests", questId, {
            thumbsUp: (quest.thumbsUp || 0) + 1,
            thumbsDown: Math.max((quest.thumbsDown || 0) - 1, 0),
          });
        }
        localStorage.setItem(voteKey, voteType);
        localStorage.setItem(cdKey, Date.now().toString());
        // Update both thumbs visually
        const allThumbs = board.querySelectorAll(".quest-thumb");
        allThumbs.forEach((t) => t.classList.remove("voted"));
        thumb.classList.add("voted");
        const updated = DataStore.getById("quests", questId);
        board.querySelector(".quest-thumb-up .quest-thumb-count").textContent =
          (updated.thumbsUp || 0) >= 1000
            ? ((updated.thumbsUp || 0) / 1000).toFixed(1) + "k"
            : (updated.thumbsUp || 0).toString();
        board.querySelector(
          ".quest-thumb-down .quest-thumb-count",
        ).textContent =
          (updated.thumbsDown || 0) >= 1000
            ? ((updated.thumbsDown || 0) / 1000).toFixed(1) + "k"
            : (updated.thumbsDown || 0).toString();
      } else {
        // New vote
        if (voteType === "up") {
          DataStore.update("quests", questId, {
            thumbsUp: (quest.thumbsUp || 0) + 1,
          });
        } else {
          DataStore.update("quests", questId, {
            thumbsDown: (quest.thumbsDown || 0) + 1,
          });
        }
        localStorage.setItem(voteKey, voteType);
        localStorage.setItem(cdKey, Date.now().toString());
        thumb.classList.add("voted");
        const updated = DataStore.getById("quests", questId);
        const countEl = thumb.querySelector(".quest-thumb-count");
        const newCount =
          voteType === "up" ? updated.thumbsUp || 0 : updated.thumbsDown || 0;
        countEl.textContent =
          newCount >= 1000
            ? (newCount / 1000).toFixed(1) + "k"
            : newCount.toString();
      }
    });
  });
}

function bindQuestCTA() {
  document.querySelectorAll(".quest-cta-board").forEach((cta) => {
    cta.addEventListener("click", (e) => {
      e.stopPropagation();
      const itemId = cta.getAttribute("data-cta-id");
      if (!itemId) return;
      const book = DataStore.getById("books", itemId);
      if (!book) return;
      const url =
        (book.platformUrls && book.platformUrls[0]) || book.ctaUrl || "";
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    });
  });
}

// Close quest via header icon
if (questIcon) {
  questIcon.addEventListener("click", (e) => {
    e.stopPropagation();
    _questCollapseAll();
    const _qm = document.querySelector(".main");
    if (_qm) _qm.scrollTop = _questScrollPos;
    if (window.location.pathname.startsWith("/quest/"))
      history.replaceState({}, "", "/quest");
  });
}

// Click anywhere on quest-header to close expanded quest
const questHeader = document.querySelector(".quest-header");
if (questHeader) {
  questHeader.addEventListener("click", () => {
    _questCollapseAll();
    const _qm = document.querySelector(".main");
    if (_qm) _qm.scrollTop = _questScrollPos;
    if (window.location.pathname.startsWith("/quest/"))
      history.replaceState({}, "", "/quest");
  });
}

// Initial render
renderQuests();
// Apply deep link set by router before this script loaded (direct URL open)
if (window._routerDeepLink && window._routerDeepLink.type === "quest") {
  const _dl = window._routerDeepLink;
  window._routerDeepLink = null;
  requestAnimationFrame(() => _questOpenItem(_dl.id));
}
