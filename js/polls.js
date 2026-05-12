// ── Polls Page ────────────────────────────────────────────────────────────────

const _pHeaderArea = document.getElementById("polls-header-area");
const _pHeaderIcon = document.getElementById("polls-header-icon");
const _pLists = document.getElementById("polls-lists");
const _pWhyDetail = document.getElementById("polls-why-detail");
let _pWhyPollId = null;
let _pWhyScrollPos = 0;

const _P_POLL_ICON = "https://i.postimg.cc/3x6VFC9y/Mt-Polls-Icon.png";

// ── Helpers ───────────────────────────────────────────────────────────────────
function _pTimeLeft(endsAt) {
  if (!endsAt) return "";
  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) return "ended";
  const m = Math.floor(ms / 60000);
  if (m < 60) return m + "min";
  const h = Math.floor(m / 60);
  if (h < 24) return h + "hr";
  return Math.floor(h / 24) + "d";
}

// ── Polls unread dot ──────────────────────────────────────────────────────────
const POLLS_SEEN_KEY = "mt_polls_seen";

function getPollsSeenIds() {
  try {
    return JSON.parse(localStorage.getItem(POLLS_SEEN_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function updatePollsDot() {
  const polls = DataStore.getAll("polls").filter((i) => !i.draft);
  const seen = getPollsSeenIds();
  const hasUnread = polls.some((i) => !seen.includes(i.id));
  const navDot = document.getElementById("polls-nav-dot");
  if (navDot) navDot.style.display = hasUnread ? "block" : "none";
}

function markPollsSeen() {
  const allIds = DataStore.getAll("polls")
    .filter((i) => !i.draft)
    .map((i) => i.id);
  localStorage.setItem(POLLS_SEEN_KEY, JSON.stringify(allIds));
  updatePollsDot();
}

const _P_BACK_ICON = "https://i.postimg.cc/dtNjQWhf/App-Mode-Back-Icon.png";
const _P_THUMB_UP = "https://i.postimg.cc/8C7LB7fM/Mt-Quest-Thumbs-Up-Icon.png";
const _P_THUMB_DOWN =
  "https://i.postimg.cc/fb1mHMY1/Mt-Quest-Thumbs-Down-Icon.png";

// ── Build poll card ───────────────────────────────────────────────────────────
function _pBuildPollCard(p) {
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
    statusText = `Ongoing ~ Ends in ${_pTimeLeft(p.endsAt)}`;
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
            : ""
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

  return `<div class="block-poll-card" data-id="${p.id}">
    <div class="block-poll-top">
      <div class="block-poll-label">Poll</div>
      <img src="${_P_POLL_ICON}" alt="" class="block-poll-icon" />
    </div>
    <div class="block-poll-subject">${p.subject || ""}</div>
    <div class="block-poll-options">${optsHTML}</div>
    <div class="block-poll-footer">
      <span class="block-poll-status">${statusText}</span>
      ${whyHintHTML}
    </div>
  </div>`;
}

function _pBindPollVotes(container) {
  // Regular vote buttons (unopened polls)
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
        renderPolls();
      });
    });

  // Why hint click → open isolated why page
  container.querySelectorAll(".poll-why-hint.has-why").forEach((hint) => {
    hint.addEventListener("click", () => {
      _pWhyOpen(hint.getAttribute("data-poll-id"));
    });
  });
}

// ── Why Post isolated page ────────────────────────────────────────────────────
function _pWhyBuildContent(pollId) {
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
      <img src="${_P_POLL_ICON}" alt="" class="poll-why-full-icon" />
      <div class="poll-why-full-subject">${poll.subject || ""}</div>
    </div>
    <div class="poll-why-options">${optionsHTML}</div>
    ${wp.image ? `<img src="${wp.image}" class="poll-why-image" alt="" />` : ""}
    <div class="poll-why-title-row"><span class="poll-why-title">Why?</span></div>
    ${wp.body ? `<div class="poll-why-body">${wp.body.replace(/\r/g, "")}</div>` : ""}
    ${threadsHTML}
    <div class="poll-why-thumbs">
      <div class="poll-why-thumb poll-why-agree${agreeVote === "agree" ? " voted" : ""}" data-poll-id="${pollId}">
        <img src="${_P_THUMB_UP}" alt="Agree" class="quest-thumb-icon" />
        <span class="quest-thumb-count">${fmt(poll.whyAgree || 0)}</span>
      </div>
      <div class="poll-why-thumb poll-why-disagree${agreeVote === "disagree" ? " voted" : ""}" data-poll-id="${pollId}">
        <img src="${_P_THUMB_DOWN}" alt="Disagree" class="quest-thumb-icon" />
        <span class="quest-thumb-count">${fmt(poll.whyDisagree || 0)}</span>
      </div>
    </div>
  </div>`;
}

function _pWhyOpen(pollId) {
  _pWhyPollId = pollId;
  const main = document.querySelector(".main");
  _pWhyScrollPos = main ? main.scrollTop : 0;
  _pLists.style.display = "none";
  _pWhyDetail.style.display = "flex";
  _pWhyDetail.innerHTML = _pWhyBuildContent(pollId);
  if (_pHeaderIcon) _pHeaderIcon.src = _P_BACK_ICON;
  if (main) main.scrollTop = 0;
  _pBindWhyThumbs(pollId);
}

function _pBindWhyThumbs(pollId) {
  _pWhyDetail
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
        _pWhyDetail.innerHTML = _pWhyBuildContent(pollId);
        _pBindWhyThumbs(pollId);
      });
    });
}

function _pWhyClose() {
  _pWhyPollId = null;
  _pLists.style.display = "flex";
  _pWhyDetail.style.display = "none";
  _pWhyDetail.innerHTML = "";
  if (_pHeaderIcon) _pHeaderIcon.src = _P_POLL_ICON;
  const main = document.querySelector(".main");
  if (main) main.scrollTop = _pWhyScrollPos;
}

// Header icon / area click closes why view
if (_pHeaderIcon) {
  _pHeaderIcon.addEventListener("click", (e) => {
    e.stopPropagation();
    if (_pWhyPollId) _pWhyClose();
  });
}
_pHeaderArea.addEventListener("click", () => {
  if (_pWhyPollId) _pWhyClose();
});

// ── Render ────────────────────────────────────────────────────────────────────
function renderPolls() {
  const container = document.getElementById("polls-main");
  if (!container) return;
  const polls = DataStore.getAll("polls")
    .slice()
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  if (polls.length === 0) {
    container.innerHTML = '<div class="block-empty">No polls yet</div>';
    return;
  }

  container.innerHTML = polls.map(_pBuildPollCard).join("");
  _pBindPollVotes(container);
}

// ── Initial render ────────────────────────────────────────────────────────────
renderPolls();
updatePollsDot();
