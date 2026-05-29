// admin/js/cs.js — Content Section Pages logic
// Handles all 9 content types + EditProfile + Subscribers

// ── Shared helpers ────────────────────────────────────

// Auto title-case: capitalises first letter of each word
function _csTitleCase(str) {
  return str.replace(/(^\s*\S|\s\S)/g, (c) => c.toUpperCase());
}

function _csBindTitleCase(inputId) {
  const el = document.getElementById(inputId);
  if (!el) return;
  el.addEventListener("input", () => {
    const pos = el.selectionStart;
    el.value = _csTitleCase(el.value);
    el.setSelectionRange(pos, pos);
  });
}

// Bind title-case on all subject / title / question inputs
[
  "cs-feed-subject",
  "cs-quest-subject",
  "cs-stories-subject",
  "cs-updates-subject",
  "cs-noti-title",
  "cs-poll-question",
].forEach(_csBindTitleCase);

// Bind title-case on thread title inputs (feed t1–t10, quest t1–t10)
for (let i = 1; i <= 10; i++) {
  _csBindTitleCase(`cs-feed-t${i}-title`);
  _csBindTitleCase(`cs-quest-t${i}-title`);
}

function _csDateLabel(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
}

function _csRenderList(containerId, items, opts = {}) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!items || !items.length) {
    el.innerHTML = `<div class="cs-empty"><div class="cs-empty-icon">${opts.icon || "📄"}</div><div class="cs-empty-text">Nothing here yet</div></div>`;
    return;
  }
  const sorted = items
    .slice()
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  el.innerHTML = sorted
    .map((item) => {
      // Separate safe actions from danger (delete) actions
      const safeActions = (opts.actions || []).filter(
        (a) => a.cls !== "danger",
      );
      const dangerActions = (opts.actions || []).filter(
        (a) => a.cls === "danger",
      );

      const safeHTML = safeActions
        .map(
          (a) =>
            `<button type="button" class="cs-card-action ${a.cls || ""}" data-item-id="${item.id}" data-action="${a.id}">${a.label}</button>`,
        )
        .join("");
      const dangerHTML = dangerActions
        .map(
          (a) =>
            `<button type="button" class="cs-card-action ${a.cls || ""}" data-item-id="${item.id}" data-action="${a.id}">${a.label}</button>`,
        )
        .join("");

      const hasActions = safeHTML || dangerHTML;
      return `<div class="cs-card" data-item-id="${item.id}">
      <div class="cs-card-top">
        <div class="cs-card-subject">${item.subject || item.question || item.title || item.name || "Untitled"}</div>
        <div class="cs-card-date">${_csDateLabel(item.createdAt)}</div>
      </div>
      ${item.content || item.body ? `<div class="cs-card-meta">${(item.content || item.body || "").replace(/\r/g, "")}</div>` : ""}
      ${
        hasActions
          ? `<div class="cs-card-expand">
        ${safeHTML ? `<div class="cs-card-safe-actions">${safeHTML}</div>` : ""}
        ${dangerHTML ? `<div class="cs-card-danger-actions">${dangerHTML}</div>` : ""}
      </div>`
          : ""
      }
    </div>`;
    })
    .join("");

  el.querySelectorAll("[data-action]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      opts.onAction &&
        opts.onAction(
          btn.getAttribute("data-action"),
          btn.getAttribute("data-item-id"),
        );
    });
  });

  // Card tap → open/close (shows safe actions only)
  // Long-press (600ms) → reveal danger (delete) actions
  el.querySelectorAll(".cs-card").forEach((card) => {
    if (!card.querySelector(".cs-card-expand")) return;

    card.addEventListener("click", () => {
      const wasOpen = card.classList.contains("open");
      el.querySelectorAll(".cs-card.open").forEach((c) => {
        c.classList.remove("open");
        c.classList.remove("long-held");
      });
      if (!wasOpen) card.classList.add("open");
    });

    // Long-press to reveal delete
    let _lpTimer = null;
    const _lpStart = () => {
      _lpTimer = setTimeout(() => {
        _lpTimer = null;
        el.querySelectorAll(".cs-card.open").forEach((c) => {
          c.classList.remove("open");
          c.classList.remove("long-held");
        });
        card.classList.add("open");
        card.classList.add("long-held");
      }, 600);
    };
    const _lpCancel = () => {
      if (_lpTimer) {
        clearTimeout(_lpTimer);
        _lpTimer = null;
      }
    };
    card.addEventListener("touchstart", _lpStart, { passive: true });
    card.addEventListener("touchend", _lpCancel);
    card.addEventListener("touchcancel", _lpCancel);
    card.addEventListener("mousedown", _lpStart);
    card.addEventListener("mouseup", _lpCancel);
    card.addEventListener("mouseleave", _lpCancel);
  });
}

function _csRenderViewList(containerId, items, opts = {}) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!items || !items.length) {
    el.innerHTML = `<div class="cs-empty"><div class="cs-empty-icon">${opts.icon || "📄"}</div><div class="cs-empty-text">No content yet</div></div>`;
    return;
  }
  const sorted = items
    .slice()
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  el.innerHTML = sorted
    .map(
      (item) => `<div class="cs-view-card">
    <div class="cs-view-card-header">
      <div class="cs-view-card-title">${item.subject || item.question || item.title || item.name || "Untitled"}</div>
      <div class="cs-view-card-time">${_csDateLabel(item.createdAt)}</div>
    </div>
    ${item.content || item.body ? `<div class="cs-view-card-body">${(item.content || item.body || "").replace(/\r/g, "")}</div>` : ""}
  </div>`,
    )
    .join("");
}

const _CS_VIEW_OPEN = {
  feed: null,
  quest: null,
  stories: null,
  updates: null,
  poll: null,
  notifications: null,
};

const _CS_BACK_ICON = "https://i.postimg.cc/dtNjQWhf/App-Mode-Back-Icon.png";

function _csEscHtml(v) {
  return String(v || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function _csShortText(v, max = 190) {
  const t = String(v || "")
    .replace(/\s+/g, " ")
    .trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1) + "...";
}

function _csSortNewest(items) {
  return (items || [])
    .slice()
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

function _csSetTitleBack(section, onBack) {
  const page = document.getElementById(`cs-${section}-view`);
  const title = page ? page.querySelector(".cs-title") : null;
  if (!title) return;
  let btn = title.querySelector(".cs-title-back");
  if (!btn) {
    btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cs-title-back";
    btn.setAttribute("aria-label", "Back");
    btn.innerHTML = `<img src="${_CS_BACK_ICON}" alt="Back" />`;
    title.appendChild(btn);
  }
  if (typeof onBack === "function") {
    btn.style.display = "inline-flex";
    btn.onclick = onBack;
  } else {
    btn.style.display = "none";
    btn.onclick = null;
  }
}

function _csRenderFeedView() {
  const el = document.getElementById("cs-feed-view-list");
  if (!el) return;
  const posts = _csSortNewest(
    DataStore.getAll("posts").filter((p) => !p.draft),
  );
  const openId = _CS_VIEW_OPEN.feed;
  if (!posts.length) {
    _csSetTitleBack("feed", null);
    el.innerHTML =
      '<div class="cs-empty"><div class="cs-empty-icon">✏️</div><div class="cs-empty-text">No feed posts yet</div></div>';
    return;
  }
  if (!openId) {
    _csSetTitleBack("feed", null);
    el.innerHTML = posts
      .map(
        (p) => `<article class="cs-user-feed-card" data-open-id="${p.id}">
      <div class="cs-user-feed-title">${_csEscHtml(p.subject || "Untitled")}</div>
      <div class="cs-user-feed-preview">${_csEscHtml(_csShortText(p.content || p.body || ""))}</div>
      <div class="cs-user-feed-meta">${_csEscHtml(_csDateLabel(p.createdAt) || "")} · ${p.threads?.length || 0} thread${(p.threads?.length || 0) === 1 ? "" : "s"}</div>
    </article>`,
      )
      .join("");
    el.querySelectorAll("[data-open-id]").forEach((card) => {
      card.addEventListener("click", () => {
        _CS_VIEW_OPEN.feed = card.getAttribute("data-open-id");
        _csRenderFeedView();
      });
    });
    return;
  }
  const p = posts.find((x) => x.id === openId);
  if (!p) {
    _CS_VIEW_OPEN.feed = null;
    _csRenderFeedView();
    return;
  }
  _csSetTitleBack("feed", () => {
    _CS_VIEW_OPEN.feed = null;
    _csRenderFeedView();
  });
  const threads = (p.threads || [])
    .map(
      (t) =>
        `<div class="cs-user-thread-title">${_csEscHtml(t.title || "")}</div><div class="cs-user-thread-text">${_csEscHtml(t.text || "")}</div>`,
    )
    .join("");
  el.innerHTML = `<article class="cs-user-detail-card">
    <div class="cs-user-detail-title">${_csEscHtml(p.subject || "Untitled")}</div>
    <div class="cs-user-detail-body">${_csEscHtml(p.content || p.body || "")}</div>
    ${threads ? `<div class="cs-user-thread-wrap">${threads}</div>` : ""}
  </article>`;
}

function _csRenderQuestView() {
  const el = document.getElementById("cs-quest-view-list");
  if (!el) return;
  const quests = _csSortNewest(
    DataStore.getAll("quests").filter((q) => !q.draft),
  );
  const openId = _CS_VIEW_OPEN.quest;
  if (!quests.length) {
    _csSetTitleBack("quest", null);
    el.innerHTML =
      '<div class="cs-empty"><div class="cs-empty-icon">❓</div><div class="cs-empty-text">No quests yet</div></div>';
    return;
  }
  if (!openId) {
    _csSetTitleBack("quest", null);
    el.innerHTML = quests
      .map(
        (q) => `<article class="cs-user-feed-card" data-open-id="${q.id}">
      <div class="cs-user-feed-title">${_csEscHtml(q.subject || "Untitled")}${
        String(q.subject || "")
          .trim()
          .endsWith("?")
          ? ""
          : "?"
      }</div>
      <div class="cs-user-feed-preview">Open to read solution</div>
      <div class="cs-user-feed-meta">${_csEscHtml(_csDateLabel(q.createdAt) || "")} · ${q.threads?.length || 0} thread${(q.threads?.length || 0) === 1 ? "" : "s"}</div>
    </article>`,
      )
      .join("");
    el.querySelectorAll("[data-open-id]").forEach((card) => {
      card.addEventListener("click", () => {
        _CS_VIEW_OPEN.quest = card.getAttribute("data-open-id");
        _csRenderQuestView();
      });
    });
    return;
  }
  const q = quests.find((x) => x.id === openId);
  if (!q) {
    _CS_VIEW_OPEN.quest = null;
    _csRenderQuestView();
    return;
  }
  _csSetTitleBack("quest", () => {
    _CS_VIEW_OPEN.quest = null;
    _csRenderQuestView();
  });
  const threads = (q.threads || [])
    .map(
      (t) =>
        `<div class="cs-user-thread-title">${_csEscHtml(t.title || "")}</div><div class="cs-user-thread-text">${_csEscHtml(t.text || "")}</div>`,
    )
    .join("");
  el.innerHTML = `<article class="cs-user-detail-card">
    <div class="cs-user-detail-title">${_csEscHtml(q.subject || "Untitled")}${
      String(q.subject || "")
        .trim()
        .endsWith("?")
        ? ""
        : "?"
    }</div>
    ${threads ? `<div class="cs-user-thread-wrap">${threads}</div>` : ""}
    ${q.keyTakeaway ? `<div class="cs-user-takeaway">${_csEscHtml(q.keyTakeaway)}</div>` : ""}
  </article>`;
}

function _csRenderStoriesView() {
  const el = document.getElementById("cs-stories-view-list");
  if (!el) return;
  const stories = _csSortNewest(
    DataStore.getAll("stories").filter((s) => !s.draft),
  );
  const openId = _CS_VIEW_OPEN.stories;
  if (!stories.length) {
    _csSetTitleBack("stories", null);
    el.innerHTML =
      '<div class="cs-empty"><div class="cs-empty-icon">📖</div><div class="cs-empty-text">No stories yet</div></div>';
    return;
  }
  if (!openId) {
    _csSetTitleBack("stories", null);
    el.innerHTML = stories
      .map(
        (s) => `<article class="cs-user-feed-card" data-open-id="${s.id}">
      <div class="cs-user-feed-title">${_csEscHtml(s.subject || s.title || "Untitled")}</div>
      <div class="cs-user-feed-preview">${_csEscHtml(_csShortText(s.body || s.content || ""))}</div>
      <div class="cs-user-feed-meta">${_csEscHtml(_csDateLabel(s.createdAt) || "")} · ${_csEscHtml(s.label || "Story")}</div>
    </article>`,
      )
      .join("");
    el.querySelectorAll("[data-open-id]").forEach((card) => {
      card.addEventListener("click", () => {
        _CS_VIEW_OPEN.stories = card.getAttribute("data-open-id");
        _csRenderStoriesView();
      });
    });
    return;
  }
  const s = stories.find((x) => x.id === openId);
  if (!s) {
    _CS_VIEW_OPEN.stories = null;
    _csRenderStoriesView();
    return;
  }
  _csSetTitleBack("stories", () => {
    _CS_VIEW_OPEN.stories = null;
    _csRenderStoriesView();
  });
  const paras = (s.paragraphs || []).filter(Boolean);
  const paraHtml = paras
    .map((p) => `<div class="cs-user-story-para">${_csEscHtml(p)}</div>`)
    .join("");
  const takes = (s.takeaways || []).filter(Boolean);
  const takeHtml = takes
    .map((t) => `<div class="cs-user-take-chip">${_csEscHtml(t)}</div>`)
    .join("");
  el.innerHTML = `<article class="cs-user-detail-card">
    <div class="cs-user-detail-title">${_csEscHtml(s.subject || s.title || "Untitled")}</div>
    <div class="cs-user-detail-body">${_csEscHtml(s.body || s.content || "")}</div>
    ${paraHtml ? `<div class="cs-user-story-wrap">${paraHtml}</div>` : ""}
    ${takeHtml ? `<div class="cs-user-take-wrap">${takeHtml}</div>` : ""}
  </article>`;
}

function _csRenderUpdatesView() {
  const el = document.getElementById("cs-updates-view-list");
  if (!el) return;
  const updates = _csSortNewest(
    DataStore.getAll("recommends").filter((u) => !u.draft),
  );
  const openId = _CS_VIEW_OPEN.updates;
  if (!updates.length) {
    _csSetTitleBack("updates", null);
    el.innerHTML =
      '<div class="cs-empty"><div class="cs-empty-icon">🔄</div><div class="cs-empty-text">No updates yet</div></div>';
    return;
  }
  if (!openId) {
    _csSetTitleBack("updates", null);
    el.innerHTML = updates
      .map((u) => {
        const items = (u.items || u.contents || []).filter(Boolean);
        const preview = items.length ? items[0] : u.content || "";
        return `<article class="cs-user-feed-card" data-open-id="${u.id}">
      <div class="cs-user-feed-title">${_csEscHtml(u.subject || u.title || "Untitled")}</div>
      <div class="cs-user-feed-preview">${_csEscHtml(_csShortText(preview))}</div>
      <div class="cs-user-feed-meta">${_csEscHtml(_csDateLabel(u.createdAt) || "")}</div>
    </article>`;
      })
      .join("");
    el.querySelectorAll("[data-open-id]").forEach((card) => {
      card.addEventListener("click", () => {
        _CS_VIEW_OPEN.updates = card.getAttribute("data-open-id");
        _csRenderUpdatesView();
      });
    });
    return;
  }
  const u = updates.find((x) => x.id === openId);
  if (!u) {
    _CS_VIEW_OPEN.updates = null;
    _csRenderUpdatesView();
    return;
  }
  _csSetTitleBack("updates", () => {
    _CS_VIEW_OPEN.updates = null;
    _csRenderUpdatesView();
  });
  const items = (u.items || u.contents || []).filter(Boolean);
  const itemsHtml = items
    .map((it) => `<div class="cs-user-update-item">${_csEscHtml(it)}</div>`)
    .join("");
  const ctaHtml = u.ctaLabel
    ? u.ctaUrl
      ? `<a class="cs-user-cta-btn" href="${_csEscHtml(u.ctaUrl)}" target="_blank" rel="noopener noreferrer">${_csEscHtml(u.ctaLabel)}</a>`
      : `<a class="cs-user-cta-btn" style="pointer-events:none;opacity:0.5;">${_csEscHtml(u.ctaLabel)}</a>`
    : "";
  el.innerHTML = `<article class="cs-user-detail-card">
    <div class="cs-user-detail-title">${_csEscHtml(u.subject || u.title || "Untitled")}</div>
    ${itemsHtml ? `<div class="cs-user-update-wrap">${itemsHtml}</div>` : `<div class="cs-user-detail-body">${_csEscHtml(u.content || "")}</div>`}
    ${ctaHtml}
  </article>`;
}

function _csRenderPollView() {
  const el = document.getElementById("cs-poll-view-list");
  if (!el) return;
  const polls = _csSortNewest(
    DataStore.getAll("polls").filter((p) => !p.draft),
  );
  _csSetTitleBack("poll", null);
  if (!polls.length) {
    el.innerHTML =
      '<div class="cs-empty"><div class="cs-empty-icon">📊</div><div class="cs-empty-text">No polls yet</div></div>';
    return;
  }
  el.innerHTML = polls
    .map((p) => {
      const total =
        p.totalVotes ||
        (p.options || []).reduce((s, o) => s + (o.votes || 0), 0);
      const options = (p.options || [])
        .slice(0, 3)
        .map((o) => {
          const pct =
            total > 0 ? Math.round(((o.votes || 0) / total) * 100) : 0;
          return `<div class="cs-user-poll-opt"><span>${_csEscHtml(o.text || "")}</span><span>${pct}%</span></div>`;
        })
        .join("");
      return `<article class="cs-user-feed-card cs-user-poll-card">
        <div class="cs-user-feed-title">${_csEscHtml(p.subject || p.question || "Untitled")}</div>
        <div class="cs-user-poll-wrap">${options}</div>
        <div class="cs-user-feed-meta">${total} vote${total === 1 ? "" : "s"}</div>
      </article>`;
    })
    .join("");
}

function _csRenderNotificationsView() {
  const el = document.getElementById("cs-notifications-view-list");
  if (!el) return;
  const notis = _csSortNewest(
    DataStore.getAll("notifications").filter((n) => !n.draft),
  );
  _csSetTitleBack("notifications", null);
  if (!notis.length) {
    el.innerHTML =
      '<div class="cs-empty"><div class="cs-empty-icon">🔔</div><div class="cs-empty-text">No notifications yet</div></div>';
    return;
  }
  el.innerHTML = notis
    .map(
      (n) => `<article class="cs-user-noti-card" data-toggle-id="${n.id}">
      <div class="cs-user-noti-top">
        <div class="cs-user-noti-title">${_csEscHtml(n.title || "Untitled")}</div>
        <div class="cs-user-noti-time">${_csEscHtml(_csDateLabel(n.createdAt) || "")}</div>
      </div>
      <div class="cs-user-noti-body">${_csEscHtml(n.content || n.body || "")}</div>
    </article>`,
    )
    .join("");
  el.querySelectorAll("[data-toggle-id]").forEach((card) => {
    card.addEventListener("click", () => {
      card.classList.toggle("open");
    });
  });
}

function _csRenderUserSitePreview(containerId, section) {
  if (section === "feed") {
    _csRenderFeedView();
    return;
  }
  if (section === "quest") {
    _csRenderQuestView();
    return;
  }
  if (section === "stories") {
    _csRenderStoriesView();
    return;
  }
  if (section === "updates") {
    _csRenderUpdatesView();
    return;
  }
  if (section === "poll") {
    _csRenderPollView();
    return;
  }
  if (section === "notifications") {
    _csRenderNotificationsView();
    return;
  }
  _csRenderViewList(containerId, [], { icon: "📄" });
}

// ── Tab routing ───────────────────────────────────────

function showContentSubTab(section, tab) {
  const area = document.getElementById("content-area-" + section);
  if (!area) return;
  const tabKey = tab.toLowerCase();
  area.querySelectorAll(".cs-page").forEach((p) => (p.style.display = "none"));
  const target = document.getElementById(`cs-${section}-${tabKey}`);
  if (!target) return;
  target.style.display = "flex";
  _csRefreshTab(section, tabKey);
}

function _csRefreshTab(section, tab) {
  if (section === "feed") _csFeedRefresh(tab);
  else if (section === "quest") _csQuestRefresh(tab);
  else if (section === "stories") _csStoriesRefresh(tab);
  else if (section === "updates") _csUpdatesRefresh(tab);
  else if (section === "poll") _csPollRefresh(tab);
  else if (section === "notifications") _csNotiRefresh(tab);
  else if (section === "apps") _csAppsRefresh(tab);
  else if (section === "books") _csBooksRefresh(tab);
  else if (section === "circle") _csCircleRefresh(tab);
  else if (section === "editprofile") _csProfileRefresh(tab);
  else if (section === "subscribers") _csSubsRefresh(tab);
}

function _csSwitch(section, tab) {
  const tabsEl = document.getElementById("content-section-tabs");
  if (tabsEl) {
    tabsEl.querySelectorAll(".content-section-tab").forEach((b) => {
      b.classList.toggle(
        "active",
        b.getAttribute("data-section-tab").toLowerCase() === tab,
      );
    });
  }
  showContentSubTab(section, tab);
}

// ══════════════════════════════════════════════════════
//  FEED
// ══════════════════════════════════════════════════════

function _csFeedGetThreads() {
  const threads = [];
  for (let i = 1; i <= 10; i++) {
    const title = (
      document.getElementById(`cs-feed-t${i}-title`)?.value || ""
    ).trim();
    const text = (
      document.getElementById(`cs-feed-t${i}-body`)?.value || ""
    ).trim();
    if (title || text) threads.push({ title, text });
  }
  return threads;
}

function _csFeedResetForm() {
  document.getElementById("cs-feed-edit-id").value = "";
  document.getElementById("cs-feed-subject").value = "";
  document.getElementById("cs-feed-body").value = "";
  for (let i = 1; i <= 10; i++) {
    const t = document.getElementById(`cs-feed-t${i}-title`);
    const b = document.getElementById(`cs-feed-t${i}-body`);
    if (t) t.value = "";
    if (b) b.value = "";
  }
  document
    .querySelectorAll("#cs-feed-cta-type-row .cs-cta-type-btn")
    .forEach((b) => b.classList.remove("active"));
  const sel = document.getElementById("cs-feed-cta-select");
  if (sel) {
    sel.innerHTML = "";
    sel.style.display = "none";
  }
  const disp = document.getElementById("cs-feed-cta-display");
  if (disp) disp.value = "";
  const typeVal = document.getElementById("cs-feed-cta-type-val");
  if (typeVal) typeVal.value = "";
  const itemId = document.getElementById("cs-feed-cta-item-id");
  if (itemId) itemId.value = "";
}

function _csFeedPopulateCTASelect(type) {
  const collection =
    type === "apps" ? "apps" : type === "books" ? "books" : "circles";
  const allItems = DataStore.getAll(collection).filter((i) => !i.draft);
  // Only include items that have a valid URL (no broken CTA links)
  const items = allItems.filter((i) => {
    if (type === "apps") return !!(i.ctaUrl || "").trim();
    if (type === "books")
      return !!((i.platformUrls && i.platformUrls[0]) || i.ctaUrl || "").trim();
    return !!(i.url || "").trim();
  });
  const sel = document.getElementById("cs-feed-cta-select");
  if (!sel) return;
  sel.innerHTML =
    `<option value="">Select ${type.charAt(0).toUpperCase() + type.slice(1)}</option>` +
    items
      .map(
        (i) =>
          `<option value="${i.id}">${i.name || i.title || "Untitled"}</option>`,
      )
      .join("");
  sel.style.display = "block";
  const disp = document.getElementById("cs-feed-cta-display");
  if (disp) disp.value = "";
  const iid = document.getElementById("cs-feed-cta-item-id");
  if (iid) iid.value = "";
}

function _csFeedLoadEdit(post) {
  document.getElementById("cs-feed-edit-id").value = post.id;
  document.getElementById("cs-feed-subject").value = post.subject || "";
  document.getElementById("cs-feed-body").value =
    post.content || post.body || "";
  const threads = post.threads || [];
  for (let i = 1; i <= 10; i++) {
    const t = threads[i - 1] || {};
    const titleEl = document.getElementById(`cs-feed-t${i}-title`);
    const bodyEl = document.getElementById(`cs-feed-t${i}-body`);
    if (titleEl) titleEl.value = t.title || "";
    if (bodyEl) bodyEl.value = t.text || "";
  }
  if (post.ctaType) {
    const btn = document.querySelector(
      `#cs-feed-cta-type-row [data-cta-type="${post.ctaType}"]`,
    );
    if (btn) {
      document
        .querySelectorAll("#cs-feed-cta-type-row .cs-cta-type-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const tv = document.getElementById("cs-feed-cta-type-val");
      if (tv) tv.value = post.ctaType;
      _csFeedPopulateCTASelect(post.ctaType);
      if (post.ctaItemId) {
        const sel = document.getElementById("cs-feed-cta-select");
        if (sel) sel.value = post.ctaItemId;
        const iid = document.getElementById("cs-feed-cta-item-id");
        if (iid) iid.value = post.ctaItemId;
      }
      const disp = document.getElementById("cs-feed-cta-display");
      if (disp) disp.value = post.ctaLabel || "";
    }
  }
  _csSwitch("feed", "create");
}

async function _csFeedSave(isDraft) {
  const msg = isDraft ? "Save this feed as draft?" : "Send this feed?";
  if (!(await window.UMessageModal.confirm(msg, "Confirmation"))) return;
  const id = document.getElementById("cs-feed-edit-id").value;
  const data = {
    subject: document.getElementById("cs-feed-subject").value.trim(),
    content: document.getElementById("cs-feed-body").value.trim(),
    threads: _csFeedGetThreads(),
    ctaType: document.getElementById("cs-feed-cta-type-val")?.value || "",
    ctaItemId: document.getElementById("cs-feed-cta-item-id")?.value || "",
    ctaLabel:
      document.getElementById("cs-feed-cta-display")?.value.trim() || "",
    draft: isDraft,
  };
  if (!data.subject) {
    await window.UMessageModal.error("Subject is required", "Validation");
    return;
  }
  if (id) DataStore.update("posts", id, data);
  else DataStore.add("posts", { ...data, createdAt: new Date().toISOString() });
  _csFeedResetForm();
  _csSwitch("feed", isDraft ? "draft" : "manage");
}

function _csFeedRefresh(tab) {
  if (tab === "view") {
    _csRenderUserSitePreview("cs-feed-view-list", "feed");
  } else if (tab === "create") {
    if (!document.getElementById("cs-feed-edit-id").value) _csFeedResetForm();
  } else if (tab === "draft") {
    _csRenderList(
      "cs-feed-draft-list",
      DataStore.getAll("posts").filter((p) => p.draft),
      {
        icon: "📝",
        actions: [
          { id: "edit", label: "Edit Draft" },
          { id: "delete", label: "Delete", cls: "danger" },
        ],
        onAction: async (a, id) => {
          if (a === "delete") {
            if (
              !(await window.UMessageModal.confirm(
                "Delete draft?",
                "Confirm Delete",
              ))
            )
              return;
            DataStore.remove("posts", id);
            _csFeedRefresh("draft");
          } else {
            const p = DataStore.getById("posts", id);
            if (p) _csFeedLoadEdit(p);
          }
        },
      },
    );
  } else if (tab === "manage") {
    _csRenderList(
      "cs-feed-manage-list",
      DataStore.getAll("posts").filter((p) => !p.draft),
      {
        icon: "✏️",
        actions: [
          { id: "edit", label: "Edit" },
          { id: "delete", label: "Delete", cls: "danger" },
        ],
        onAction: async (a, id) => {
          if (a === "delete") {
            if (
              !(await window.UMessageModal.confirm(
                "Delete post?",
                "Confirm Delete",
              ))
            )
              return;
            DataStore.remove("posts", id);
            _csFeedRefresh("manage");
          } else {
            const p = DataStore.getById("posts", id);
            if (p) _csFeedLoadEdit(p);
          }
        },
      },
    );
  } else if (tab === "slots") {
    _csBooksSlotsRefresh();
  }
}

// ── Books Slots (admin upload of per-tile images) ───────────────────
function _csBooksSlotsRefresh() {
  const el = document.getElementById("cs-books-slots-list");
  if (!el) return;
  const books = DataStore.getAll("books").filter((b) => !b.draft);
  if (!books || books.length === 0) {
    el.innerHTML =
      '<div class="admin-empty"><div class="admin-empty-icon">📖</div><div class="admin-empty-text">No books available</div></div>';
    return;
  }

  el.innerHTML = books
    .map(
      (b) => `
      <div class="cs-book-slot-item" data-book-id="${b.id}" style="display:flex;gap:12px;align-items:center;padding:8px;border-bottom:1px solid rgba(255,255,255,0.03)">
        <div style="width:96px;height:96px;flex:0 0 96px;overflow:hidden;border-radius:4px;background:#071025;display:flex;align-items:center;justify-content:center">
          <img src="${b.src_img || b.img || "https://i.postimg.cc/VNY8Ymks/image.png"}" alt="${b.name}" style="width:100%;height:100%;object-fit:cover;display:block" />
        </div>
        <div style="flex:1;display:flex;flex-direction:row;justify-content:space-between;align-items:center">
          <div style="display:flex;flex-direction:column">
            <div style="font-weight:600">${b.name}</div>
            <div style="font-size:12px;color:rgba(200,200,220,0.7);margin-top:6px">ID: ${b.id}</div>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <input type="file" accept="image/*" class="cs-books-slot-input" data-id="${b.id}" style="display:none" />
            <button type="button" class="cs-btn" data-action="upload" data-id="${b.id}">Upload</button>
            <button type="button" class="cs-btn cs-btn-danger" data-action="clear" data-id="${b.id}">Clear</button>
          </div>
        </div>
      </div>`,
    )
    .join("");

  // Wire upload buttons -> trigger hidden input
  el.querySelectorAll(".cs-book-slot-item").forEach((item) => {
    const id = item.getAttribute("data-book-id");
    const fileInput = item.querySelector(".cs-books-slot-input");
    const uploadBtn = item.querySelector('[data-action="upload"]');
    const clearBtn = item.querySelector('[data-action="clear"]');

    if (uploadBtn && fileInput) {
      uploadBtn.addEventListener("click", () => fileInput.click());
      fileInput.addEventListener("change", (ev) => {
        const file = ev.target.files && ev.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (e) {
          const dataUrl = e.target.result;
          try {
            DataStore.update("books", id, { src_img: dataUrl });
          } catch (err) {
            console.error("Failed to save slot image", err);
          }
          // refresh slot list and public home grid
          requestAnimationFrame(() => {
            _csBooksSlotsRefresh();
            if (typeof window.renderHomeBooksGrid === "function")
              window.renderHomeBooksGrid();
          });
        };
        reader.readAsDataURL(file);
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener("click", async () => {
        const ok = await window.UMessageModal.confirm(
          "Clear slot image for this book?",
          "Confirm",
        );
        if (!ok) return;
        DataStore.update("books", id, { src_img: "" });
        requestAnimationFrame(() => {
          _csBooksSlotsRefresh();
          if (typeof window.renderHomeBooksGrid === "function")
            window.renderHomeBooksGrid();
        });
      });
    }
  });
}

// Feed CTA type buttons
document
  .querySelectorAll("#cs-feed-cta-type-row .cs-cta-type-btn")
  .forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll("#cs-feed-cta-type-row .cs-cta-type-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const type = btn.getAttribute("data-cta-type");
      const tv = document.getElementById("cs-feed-cta-type-val");
      if (tv) tv.value = type;
      _csFeedPopulateCTASelect(type);
    });
  });

document
  .getElementById("cs-feed-cta-select")
  ?.addEventListener("change", () => {
    const type = document.getElementById("cs-feed-cta-type-val")?.value || "";
    const sel = document.getElementById("cs-feed-cta-select");
    const selId = sel ? sel.value : "";
    const disp = document.getElementById("cs-feed-cta-display");
    const iid = document.getElementById("cs-feed-cta-item-id");
    if (!selId) {
      if (disp) disp.value = "";
      if (iid) iid.value = "";
      return;
    }
    const collection =
      type === "apps" ? "apps" : type === "books" ? "books" : "circles";
    const item = DataStore.getById(collection, selId);
    if (item) {
      const label =
        type === "apps"
          ? `Visit ${item.name}`
          : type === "books"
            ? `Get ${item.name}${item.price ? " ~ " + item.price : ""}`
            : `Check Out ${item.name} on ${item.platform || "Circle"}`;
      if (disp) disp.value = label;
      if (iid) iid.value = selId;
    }
  });

document
  .getElementById("cs-feed-send")
  .addEventListener("click", () => _csFeedSave(false));
document
  .getElementById("cs-feed-draft-btn")
  .addEventListener("click", () => _csFeedSave(true));
document
  .getElementById("cs-feed-cancel")
  .addEventListener("click", async () => {
    const ok = await window.UMessageModal.confirm(
      "Cancel and clear the feed form?",
      "Confirmation",
    );
    if (!ok) return;
    _csFeedResetForm();
  });

// ══════════════════════════════════════════════════════
//  QUEST
// ══════════════════════════════════════════════════════

function _csQuestGetThreads() {
  const threads = [];
  for (let i = 1; i <= 10; i++) {
    const title = (
      document.getElementById(`cs-quest-t${i}-title`)?.value || ""
    ).trim();
    const text = (
      document.getElementById(`cs-quest-t${i}-body`)?.value || ""
    ).trim();
    if (title || text) threads.push({ title, text });
  }
  return threads;
}

function _csQuestResetForm() {
  document.getElementById("cs-quest-edit-id").value = "";
  document.getElementById("cs-quest-subject").value = "";
  const tk = document.getElementById("cs-quest-takeaway");
  if (tk) tk.value = "";
  const rk = document.getElementById("cs-quest-recommendation");
  if (rk) rk.value = "";
  for (let i = 1; i <= 10; i++) {
    const t = document.getElementById(`cs-quest-t${i}-title`);
    const b = document.getElementById(`cs-quest-t${i}-body`);
    if (t) t.value = "";
    if (b) b.value = "";
  }
  // Header image
  const qImg = document.getElementById("cs-quest-img");
  if (qImg) {
    qImg.value = "";
    const w = qImg.closest(".cs-img-widget");
    if (w) {
      _csSetWidgetPreview(w, "");
      _csSetWidgetState(w, "idle", "");
    }
  }
  // CTA image
  const qCtaImg = document.getElementById("cs-quest-cta-img");
  if (qCtaImg) {
    qCtaImg.value = "";
    const w = qCtaImg.closest(".cs-img-widget");
    if (w) {
      _csSetWidgetPreview(w, "");
      _csSetWidgetState(w, "idle", "");
    }
  }
  // CTA type/select/display
  const qCtaSel = document.getElementById("cs-quest-cta-select");
  if (qCtaSel) {
    qCtaSel.innerHTML = "";
    qCtaSel.style.display = "";
  }
  const qCtaDisp = document.getElementById("cs-quest-cta-display");
  if (qCtaDisp) qCtaDisp.value = "";
  const qCtaType = document.getElementById("cs-quest-cta-type-val");
  if (qCtaType) qCtaType.value = "books";
  const qCtaId = document.getElementById("cs-quest-cta-item-id");
  if (qCtaId) qCtaId.value = "";
  _csQuestPopulateCTASelect();
}

function _csQuestLoadEdit(quest) {
  document.getElementById("cs-quest-edit-id").value = quest.id;
  document.getElementById("cs-quest-subject").value = quest.subject || "";
  const tk = document.getElementById("cs-quest-takeaway");
  if (tk) tk.value = quest.keyTakeaway || "";
  const rk = document.getElementById("cs-quest-recommendation");
  if (rk) rk.value = quest.recommendation || "";
  const threads = quest.threads || [];
  for (let i = 1; i <= 10; i++) {
    const t = threads[i - 1] || {};
    const titleEl = document.getElementById(`cs-quest-t${i}-title`);
    const bodyEl = document.getElementById(`cs-quest-t${i}-body`);
    if (titleEl) titleEl.value = t.title || "";
    if (bodyEl) bodyEl.value = t.text || "";
  }
  // Header image
  const qImg = document.getElementById("cs-quest-img");
  if (qImg) qImg.value = quest.img || "";
  // CTA image
  const qCtaImg = document.getElementById("cs-quest-cta-img");
  if (qCtaImg) qCtaImg.value = quest.ctaImg || "";
  _csSyncImgPreviews(["cs-quest-img", "cs-quest-cta-img"]);
  // CTA select — always books, populate and restore selection
  const tv = document.getElementById("cs-quest-cta-type-val");
  if (tv) tv.value = "books";
  _csQuestPopulateCTASelect();
  if (quest.ctaItemId) {
    const sel = document.getElementById("cs-quest-cta-select");
    if (sel) sel.value = quest.ctaItemId;
    const iid = document.getElementById("cs-quest-cta-item-id");
    if (iid) iid.value = quest.ctaItemId;
  }
  const disp = document.getElementById("cs-quest-cta-display");
  if (disp) disp.value = quest.ctaLabel || "";
  _csSwitch("quest", "create");
}

async function _csQuestSave(isDraft) {
  const msg = isDraft ? "Save this quest as draft?" : "Send this quest?";
  if (!(await window.UMessageModal.confirm(msg, "Confirmation"))) return;
  const id = document.getElementById("cs-quest-edit-id").value;
  const data = {
    subject: document.getElementById("cs-quest-subject").value.trim(),
    threads: _csQuestGetThreads(),
    keyTakeaway: (
      document.getElementById("cs-quest-takeaway")?.value || ""
    ).trim(),
    recommendation: (
      document.getElementById("cs-quest-recommendation")?.value || ""
    ).trim(),
    img: document.getElementById("cs-quest-img")?.value.trim() || "",
    ctaImg: document.getElementById("cs-quest-cta-img")?.value.trim() || "",
    ctaType: document.getElementById("cs-quest-cta-type-val")?.value || "",
    ctaItemId: document.getElementById("cs-quest-cta-item-id")?.value || "",
    ctaLabel:
      document.getElementById("cs-quest-cta-display")?.value.trim() || "",
    draft: isDraft,
  };
  if (!data.subject) {
    await window.UMessageModal.error(
      "Question subject is required",
      "Validation",
    );
    return;
  }
  if (id) DataStore.update("quests", id, data);
  else
    DataStore.add("quests", { ...data, createdAt: new Date().toISOString() });
  _csQuestResetForm();
  _csSwitch("quest", isDraft ? "draft" : "manage");
}

function _csQuestRefresh(tab) {
  if (tab === "view") {
    _csRenderUserSitePreview("cs-quest-view-list", "quest");
  } else if (tab === "create") {
    if (!document.getElementById("cs-quest-edit-id").value) _csQuestResetForm();
  } else if (tab === "draft") {
    _csRenderList(
      "cs-quest-draft-list",
      DataStore.getAll("quests").filter((q) => q.draft),
      {
        icon: "📝",
        actions: [
          { id: "edit", label: "Edit Draft" },
          { id: "delete", label: "Delete", cls: "danger" },
        ],
        onAction: async (a, id) => {
          if (a === "delete") {
            if (
              !(await window.UMessageModal.confirm("Delete?", "Confirm Delete"))
            )
              return;
            DataStore.remove("quests", id);
            _csQuestRefresh("draft");
          } else {
            const q = DataStore.getById("quests", id);
            if (q) _csQuestLoadEdit(q);
          }
        },
      },
    );
  } else if (tab === "manage") {
    _csRenderList(
      "cs-quest-manage-list",
      DataStore.getAll("quests").filter((q) => !q.draft),
      {
        icon: "❓",
        actions: [
          { id: "edit", label: "Edit" },
          { id: "delete", label: "Delete", cls: "danger" },
        ],
        onAction: async (a, id) => {
          if (a === "delete") {
            if (
              !(await window.UMessageModal.confirm(
                "Delete quest?",
                "Confirm Delete",
              ))
            )
              return;
            DataStore.remove("quests", id);
            _csQuestRefresh("manage");
          } else {
            const q = DataStore.getById("quests", id);
            if (q) _csQuestLoadEdit(q);
          }
        },
      },
    );
  }
}

document
  .getElementById("cs-quest-send")
  .addEventListener("click", () => _csQuestSave(false));
document
  .getElementById("cs-quest-draft-btn")
  .addEventListener("click", () => _csQuestSave(true));
document
  .getElementById("cs-quest-cancel")
  .addEventListener("click", async () => {
    const ok = await window.UMessageModal.confirm(
      "Cancel and clear the quest form?",
      "Confirmation",
    );
    if (!ok) return;
    _csQuestResetForm();
  });

// Quest CTA — book-only populate (always visible, no toggle needed)
function _csQuestPopulateCTASelect() {
  const items = DataStore.getAll("books").filter(
    (b) =>
      !b.draft &&
      !!((b.platformUrls && b.platformUrls[0]) || b.ctaUrl || "").trim(),
  );
  const sel = document.getElementById("cs-quest-cta-select");
  if (!sel) return;
  sel.innerHTML =
    `<option value="">Select Book</option>` +
    items
      .map(
        (i) =>
          `<option value="${i.id}">${i.name || i.title || "Untitled"}</option>`,
      )
      .join("");
}

document
  .getElementById("cs-quest-cta-select")
  ?.addEventListener("change", () => {
    const sel = document.getElementById("cs-quest-cta-select");
    const selId = sel ? sel.value : "";
    const disp = document.getElementById("cs-quest-cta-display");
    const iid = document.getElementById("cs-quest-cta-item-id");
    if (!selId) {
      if (disp) disp.value = "";
      if (iid) iid.value = "";
      return;
    }
    const item = DataStore.getById("books", selId);
    if (item) {
      const label = `Get ${item.name}${item.price ? " ~ " + item.price : ""}`;
      if (disp) disp.value = label;
      if (iid) iid.value = selId;
    }
  });

// ══════════════════════════════════════════════════════
//  STORIES
// ══════════════════════════════════════════════════════

function _csStoriesGetParagraphs() {
  const paras = [];
  for (let i = 1; i <= 5; i++) {
    paras.push(
      (document.getElementById(`cs-stories-para-${i}`)?.value || "").trim(),
    );
  }
  return paras;
}

function _csStoriesGetLessons() {
  const lessons = [];
  for (let i = 1; i <= 5; i++) {
    const v = (
      document.getElementById(`cs-stories-lesson-${i}`)?.value || ""
    ).trim();
    if (v) lessons.push(v);
  }
  return lessons;
}

function _csStoriesResetForm() {
  document.getElementById("cs-stories-edit-id").value = "";
  const lbl = document.getElementById("cs-stories-label");
  if (lbl) lbl.value = "";
  document.getElementById("cs-stories-subject").value = "";
  document.getElementById("cs-stories-body").value = "";
  for (let i = 1; i <= 5; i++) {
    const p = document.getElementById(`cs-stories-para-${i}`);
    const l = document.getElementById(`cs-stories-lesson-${i}`);
    if (p) p.value = "";
    if (l) l.value = "";
  }
}

function _csStoriesLoadEdit(story) {
  document.getElementById("cs-stories-edit-id").value = story.id;
  const lbl = document.getElementById("cs-stories-label");
  if (lbl) lbl.value = story.label || "";
  document.getElementById("cs-stories-subject").value =
    story.subject || story.title || "";
  document.getElementById("cs-stories-body").value =
    story.body || story.content || "";
  const paras = story.paragraphs || [];
  for (let i = 1; i <= 5; i++) {
    const p = document.getElementById(`cs-stories-para-${i}`);
    if (p) p.value = paras[i - 1] || "";
  }
  const lessons = story.takeaways || story.lessons || [];
  for (let i = 1; i <= 5; i++) {
    const l = document.getElementById(`cs-stories-lesson-${i}`);
    if (l) l.value = lessons[i - 1] || "";
  }
  _csSwitch("stories", "create");
}

async function _csStoriesSave(isDraft) {
  const msg = isDraft ? "Save this story as draft?" : "Send this story?";
  if (!(await window.UMessageModal.confirm(msg, "Confirmation"))) return;
  const id = document.getElementById("cs-stories-edit-id").value;
  const data = {
    label: (document.getElementById("cs-stories-label")?.value || "").trim(),
    subject: document.getElementById("cs-stories-subject").value.trim(),
    body: document.getElementById("cs-stories-body").value.trim(),
    paragraphs: _csStoriesGetParagraphs(),
    takeaways: _csStoriesGetLessons(),
    draft: isDraft,
  };
  if (!data.subject) {
    await window.UMessageModal.error("Story title is required", "Validation");
    return;
  }
  if (id) DataStore.update("stories", id, data);
  else
    DataStore.add("stories", { ...data, createdAt: new Date().toISOString() });
  _csStoriesResetForm();
  _csSwitch("stories", isDraft ? "draft" : "manage");
}

function _csStoriesRefresh(tab) {
  if (tab === "view") {
    _csRenderUserSitePreview("cs-stories-view-list", "stories");
  } else if (tab === "create") {
    if (!document.getElementById("cs-stories-edit-id").value)
      _csStoriesResetForm();
  } else if (tab === "draft") {
    _csRenderList(
      "cs-stories-draft-list",
      DataStore.getAll("stories").filter((s) => s.draft),
      {
        icon: "📝",
        actions: [
          { id: "edit", label: "Edit Draft" },
          { id: "delete", label: "Delete", cls: "danger" },
        ],
        onAction: async (a, id) => {
          if (a === "delete") {
            if (
              !(await window.UMessageModal.confirm("Delete?", "Confirm Delete"))
            )
              return;
            DataStore.remove("stories", id);
            _csStoriesRefresh("draft");
          } else {
            const s = DataStore.getById("stories", id);
            if (s) _csStoriesLoadEdit(s);
          }
        },
      },
    );
  } else if (tab === "manage") {
    _csRenderList(
      "cs-stories-manage-list",
      DataStore.getAll("stories").filter((s) => !s.draft),
      {
        icon: "📖",
        actions: [
          { id: "edit", label: "Edit" },
          { id: "delete", label: "Delete", cls: "danger" },
        ],
        onAction: async (a, id) => {
          if (a === "delete") {
            if (
              !(await window.UMessageModal.confirm(
                "Delete story?",
                "Confirm Delete",
              ))
            )
              return;
            DataStore.remove("stories", id);
            _csStoriesRefresh("manage");
          } else {
            const s = DataStore.getById("stories", id);
            if (s) _csStoriesLoadEdit(s);
          }
        },
      },
    );
  }
}

document
  .getElementById("cs-stories-send")
  .addEventListener("click", () => _csStoriesSave(false));
document
  .getElementById("cs-stories-draft-btn")
  .addEventListener("click", () => _csStoriesSave(true));
document
  .getElementById("cs-stories-cancel")
  .addEventListener("click", async () => {
    const ok = await window.UMessageModal.confirm(
      "Cancel and clear the story form?",
      "Confirmation",
    );
    if (!ok) return;
    _csStoriesResetForm();
  });

// ══════════════════════════════════════════════════════
//  UPDATES — uses "recommends" collection
// ══════════════════════════════════════════════════════

const _CS_UPDATES_DEFAULT_CATS = ["Dating", "Money", "Frame"];

function _csPopulateUpdateCategorySelect(selected) {
  const display = document.getElementById("cs-updates-cat-display");
  const dropdown = document.getElementById("cs-updates-cat-dropdown");
  const hidden = document.getElementById("cs-updates-category");
  const hint = document.getElementById("cs-updates-cat-del-hint");
  if (!display || !dropdown || !hidden) return;

  const customEntries = DataStore.getAll("updateCategories");
  const customs = customEntries.map((c) => c.name).filter(Boolean);
  const all = [..._CS_UPDATES_DEFAULT_CATS];
  customs.forEach((c) => {
    if (!all.includes(c)) all.push(c);
  });

  hidden.value = selected || "";
  display.textContent = selected || "Select Category";
  if (hint)
    hint.textContent = "Select a category, then tap Delete to remove it";

  const opts = [
    { value: "", label: "Select Category", deletable: false },
    ...[..._CS_UPDATES_DEFAULT_CATS]
      .sort((a, b) => a.localeCompare(b))
      .map((cat) => ({ value: cat, label: cat, deletable: false })),
    ...customs
      .slice()
      .sort((a, b) => a.localeCompare(b))
      .map((cat) => ({ value: cat, label: cat, deletable: true })),
    { value: "__new__", label: "+ New Category...", deletable: false },
  ];

  const seen = new Set();
  dropdown.innerHTML = opts
    .filter((o) => {
      if (seen.has(o.value)) return false;
      seen.add(o.value);
      return true;
    })
    .map(
      (o) =>
        `<div class="cs-cat-select-opt${selected === o.value ? " active" : ""}${o.deletable ? " deletable" : ""}" data-val="${o.value}">${o.label}${o.deletable ? '<span class="cs-cat-del-dot"></span>' : ""}</div>`,
    )
    .join("");

  dropdown.querySelectorAll(".cs-cat-select-opt").forEach((opt) => {
    opt.addEventListener("click", () => {
      const val = opt.getAttribute("data-val");
      hidden.value = val;
      display.textContent =
        val === ""
          ? "Select Category"
          : val === "__new__"
            ? "+ New Category..."
            : val;
      dropdown.style.display = "none";
      const newWrap = document.getElementById("cs-updates-new-cat-wrap");
      const newInput = document.getElementById("cs-updates-new-category");
      if (newWrap) newWrap.style.display = val === "__new__" ? "block" : "none";
      if (newInput && val !== "__new__") newInput.value = "";
    });
  });

  const newWrap = document.getElementById("cs-updates-new-cat-wrap");
  const newInput = document.getElementById("cs-updates-new-category");
  if (newWrap) newWrap.style.display = "none";
  if (newInput) newInput.value = "";
}

async function _csDeleteUpdateCategory() {
  const hint = document.getElementById("cs-updates-cat-del-hint");
  const hidden = document.getElementById("cs-updates-category");
  const cat = hidden?.value || "";
  const flash = (msg) => {
    if (!hint) return;
    hint.textContent = msg;
    hint.style.color = "rgba(255,100,100,0.9)";
    setTimeout(() => {
      hint.style.color = "";
      hint.textContent = "Select a category, then tap Delete to remove it";
    }, 2200);
  };
  if (!cat || cat === "__new__") {
    flash("Select a category first");
    return;
  }
  if (_CS_UPDATES_DEFAULT_CATS.includes(cat)) {
    flash(`"${cat}" is a built-in category — cannot be deleted`);
    return;
  }
  const ok = await window.UMessageModal.confirm(
    `Delete category "${cat}"? Existing updates won't be affected.`,
    "Delete Category",
  );
  if (!ok) return;
  const entry = DataStore.getAll("updateCategories").find(
    (c) => c.name === cat,
  );
  if (entry) DataStore.remove("updateCategories", entry.id);
  _csPopulateUpdateCategorySelect("");
}

function _csGetUpdatesContents() {
  const contents = [];
  for (let i = 1; i <= 5; i++) {
    contents.push(
      (document.getElementById(`cs-updates-content-${i}`)?.value || "").trim(),
    );
  }
  return contents;
}

function _csUpdatesResetForm() {
  document.getElementById("cs-updates-edit-id").value = "";
  document.getElementById("cs-updates-subject").value = "";
  for (let i = 1; i <= 5; i++) {
    const c = document.getElementById(`cs-updates-content-${i}`);
    if (c) c.value = "";
  }
  const ctaTitle = document.getElementById("cs-updates-cta-title");
  const ctaUrl = document.getElementById("cs-updates-cta-url");
  if (ctaTitle) ctaTitle.value = "";
  if (ctaUrl) ctaUrl.value = "";
  _csPopulateUpdateCategorySelect("");
}

function _csUpdatesLoadEdit(item) {
  document.getElementById("cs-updates-edit-id").value = item.id;
  document.getElementById("cs-updates-subject").value = item.subject || "";
  const contents = item.items || item.contents || [item.content || ""];
  for (let i = 1; i <= 5; i++) {
    const c = document.getElementById(`cs-updates-content-${i}`);
    if (c) c.value = contents[i - 1] || "";
  }
  const ctaTitle = document.getElementById("cs-updates-cta-title");
  const ctaUrl = document.getElementById("cs-updates-cta-url");
  if (ctaTitle) ctaTitle.value = item.ctaLabel || item.ctaTitle || "";
  if (ctaUrl) ctaUrl.value = item.ctaUrl || "";
  _csPopulateUpdateCategorySelect(item.category || "");
  _csSwitch("updates", "create");
}

async function _csUpdatesSave(isDraft) {
  const msg = isDraft ? "Save this update as draft?" : "Send this update?";
  if (!(await window.UMessageModal.confirm(msg, "Confirmation"))) return;
  const id = document.getElementById("cs-updates-edit-id").value;
  // Resolve category
  const catSelect = document.getElementById("cs-updates-category");
  let category = catSelect ? catSelect.value : "";
  if (category === "__new__") {
    const newCatInput = document.getElementById("cs-updates-new-category");
    const newCatName = (newCatInput?.value || "").trim();
    if (newCatName) {
      const existing = DataStore.getAll("updateCategories");
      if (
        !existing.some(
          (c) => (c.name || "").toLowerCase() === newCatName.toLowerCase(),
        )
      ) {
        DataStore.add("updateCategories", { name: newCatName });
      }
      category = newCatName;
    } else {
      category = "";
    }
  }
  const data = {
    subject: document.getElementById("cs-updates-subject").value.trim(),
    items: _csUpdatesGetContents(),
    category: category || "",
    ctaLabel:
      document.getElementById("cs-updates-cta-title")?.value.trim() || "",
    ctaUrl: document.getElementById("cs-updates-cta-url")?.value.trim() || "",
    draft: isDraft,
  };
  if (!data.subject) {
    await window.UMessageModal.error("Updates title is required", "Validation");
    return;
  }
  if (!data.category) {
    await window.UMessageModal.error(
      "Please select a category for this update",
      "Validation",
    );
    return;
  }
  if (id) DataStore.update("recommends", id, data);
  else
    DataStore.add("recommends", {
      ...data,
      createdAt: new Date().toISOString(),
    });
  _csUpdatesResetForm();
  _csSwitch("updates", isDraft ? "draft" : "manage");
}

function _csUpdatesRefresh(tab) {
  if (tab === "view") {
    _csRenderUserSitePreview("cs-updates-view-list", "updates");
  } else if (tab === "create") {
    if (!document.getElementById("cs-updates-edit-id").value) {
      _csUpdatesResetForm();
    } else {
      _csPopulateUpdateCategorySelect(
        document.getElementById("cs-updates-category")?.value || "",
      );
    }
  } else if (tab === "draft") {
    _csRenderList(
      "cs-updates-draft-list",
      DataStore.getAll("recommends").filter((r) => r.draft),
      {
        icon: "📝",
        actions: [
          { id: "edit", label: "Edit Draft" },
          { id: "delete", label: "Delete", cls: "danger" },
        ],
        onAction: async (a, id) => {
          if (a === "delete") {
            if (
              !(await window.UMessageModal.confirm("Delete?", "Confirm Delete"))
            )
              return;
            DataStore.remove("recommends", id);
            _csUpdatesRefresh("draft");
          } else {
            const r = DataStore.getById("recommends", id);
            if (r) _csUpdatesLoadEdit(r);
          }
        },
      },
    );
  } else if (tab === "manage") {
    _csRenderList(
      "cs-updates-manage-list",
      DataStore.getAll("recommends").filter((r) => !r.draft),
      {
        icon: "🔄",
        actions: [
          { id: "edit", label: "Edit" },
          { id: "delete", label: "Delete", cls: "danger" },
        ],
        onAction: async (a, id) => {
          if (a === "delete") {
            if (
              !(await window.UMessageModal.confirm(
                "Delete update?",
                "Confirm Delete",
              ))
            )
              return;
            DataStore.remove("recommends", id);
            _csUpdatesRefresh("manage");
          } else {
            const r = DataStore.getById("recommends", id);
            if (r) _csUpdatesLoadEdit(r);
          }
        },
      },
    );
  }
}

document
  .getElementById("cs-updates-send")
  .addEventListener("click", () => _csUpdatesSave(false));
document
  .getElementById("cs-updates-draft-btn")
  .addEventListener("click", () => _csUpdatesSave(true));
document
  .getElementById("cs-updates-cancel")
  .addEventListener("click", async () => {
    const ok = await window.UMessageModal.confirm(
      "Cancel and clear the updates form?",
      "Confirmation",
    );
    if (!ok) return;
    _csUpdatesResetForm();
  });

// Custom category select — toggle panel + close on outside click
(function () {
  const trigger = document.getElementById("cs-updates-cat-trigger");
  const dropdown = document.getElementById("cs-updates-cat-dropdown");
  if (!trigger || !dropdown) return;
  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.style.display =
      dropdown.style.display === "none" ? "block" : "none";
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest("#cs-updates-cat-wrap")) {
      dropdown.style.display = "none";
    }
  });
  document
    .getElementById("cs-updates-cat-del-btn")
    ?.addEventListener("click", _csDeleteUpdateCategory);
})();

// ══════════════════════════════════════════════════════
//  POLL
// ══════════════════════════════════════════════════════

function _csPollResetForm() {
  [
    "cs-poll-edit-id",
    "cs-poll-question",
    "cs-poll-answer-1",
    "cs-poll-answer-2",
    "cs-poll-answer-3",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  // Reset duration to 24hr default
  const durInput = document.getElementById("cs-poll-ends-at");
  if (durInput) durInput.value = "24";
  document.querySelectorAll(".cs-poll-dur-btn").forEach((b) => {
    b.classList.toggle("active", b.getAttribute("data-dur") === "24");
  });
}

function _csPollLoadEdit(poll) {
  document.getElementById("cs-poll-edit-id").value = poll.id;
  document.getElementById("cs-poll-question").value =
    poll.subject || poll.question || "";
  const endsAtEl = document.getElementById("cs-poll-ends-at");
  if (endsAtEl && poll.endsAt) {
    // Compute remaining hours from stored ISO date
    const msLeft = new Date(poll.endsAt).getTime() - Date.now();
    const hrsLeft = Math.round(msLeft / 3600000);
    const dur = hrsLeft <= 24 ? "24" : hrsLeft <= 48 ? "48" : "72";
    endsAtEl.value = dur;
    document.querySelectorAll(".cs-poll-dur-btn").forEach((b) => {
      b.classList.toggle("active", b.getAttribute("data-dur") === dur);
    });
  }
  const answers = poll.answers ||
    (poll.options || []).map((o) => o.text || "") || [
      poll.optionA || "",
      poll.optionB || "",
      poll.optionC || "",
    ];
  for (let i = 1; i <= 3; i++) {
    const el = document.getElementById(`cs-poll-answer-${i}`);
    if (el) el.value = answers[i - 1] || "";
  }
  _csSwitch("poll", "create");
}

async function _csPollSave(isDraft) {
  const msg = isDraft ? "Save this poll as draft?" : "Create this poll?";
  if (!(await window.UMessageModal.confirm(msg, "Confirmation"))) return;
  const id = document.getElementById("cs-poll-edit-id").value;
  const answers = [];
  for (let i = 1; i <= 3; i++) {
    answers.push(
      (document.getElementById(`cs-poll-answer-${i}`)?.value || "").trim(),
    );
  }
  const subject = document.getElementById("cs-poll-question").value.trim();
  const durHrs = parseInt(
    document.getElementById("cs-poll-ends-at")?.value || "24",
  );
  const endsAt = new Date(Date.now() + durHrs * 3600000).toISOString();

  // Preserve existing vote counts when editing
  let existingOptions = [];
  if (id) {
    const existing = DataStore.getById("polls", id);
    existingOptions = existing?.options || [];
  }
  const options = answers
    .filter(Boolean)
    .map((text, i) => ({ text, votes: existingOptions[i]?.votes || 0 }));

  const data = {
    subject,
    question: subject,
    answers,
    options,
    endsAt,
    draft: isDraft,
  };
  if (!data.subject || options.length < 2) {
    await window.UMessageModal.error(
      "Question and at least 2 answers are required",
      "Validation",
    );
    return;
  }
  if (id) DataStore.update("polls", id, data);
  else
    DataStore.add("polls", {
      ...data,
      createdAt: new Date().toISOString(),
      totalVotes: 0,
    });
  _csPollResetForm();
  _csSwitch("poll", isDraft ? "draft" : "manage");
}

function _csPollRefresh(tab) {
  if (tab === "view") {
    _csRenderUserSitePreview("cs-poll-view-list", "poll");
  } else if (tab === "create") {
    if (!document.getElementById("cs-poll-edit-id").value) _csPollResetForm();
  } else if (tab === "draft") {
    _csRenderList(
      "cs-poll-draft-list",
      DataStore.getAll("polls").filter((p) => p.draft),
      {
        icon: "📝",
        actions: [
          { id: "edit", label: "Edit Draft" },
          { id: "delete", label: "Delete", cls: "danger" },
        ],
        onAction: async (a, id) => {
          if (a === "delete") {
            if (
              !(await window.UMessageModal.confirm("Delete?", "Confirm Delete"))
            )
              return;
            DataStore.remove("polls", id);
            _csPollRefresh("draft");
          } else {
            const p = DataStore.getById("polls", id);
            if (p) _csPollLoadEdit(p);
          }
        },
      },
    );
  } else if (tab === "manage") {
    _csPollRenderManageList();
  }
}

function _csPollRenderManageList() {
  const el = document.getElementById("cs-poll-manage-list");
  if (!el) return;
  const polls = DataStore.getAll("polls")
    .filter((p) => !p.draft)
    .slice()
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  if (!polls.length) {
    el.innerHTML = `<div class="cs-empty"><div class="cs-empty-icon">📊</div><div class="cs-empty-text">Nothing here yet</div></div>`;
    return;
  }

  el.innerHTML = polls
    .map((p) => {
      const isEnded =
        p.status === "ended" || (p.endsAt && new Date(p.endsAt) <= new Date());
      const total = p.totalVotes || 0;
      const fv =
        total >= 1000 ? (total / 1000).toFixed(1) + "k" : String(total);
      const statusLabel = isEnded
        ? `${fv} Votes ~ Ended`
        : `Ongoing ~ ${total} votes`;

      const optionsHTML = (p.options || [])
        .map((opt, i) => {
          const pct =
            total > 0 ? Math.round(((opt.votes || 0) / total) * 100) : 0;
          const isCorrect = p.correctAnswerIdx === i;
          return `<div class="cs-poll-opt-row${isCorrect ? " cs-poll-opt-correct" : ""}">
            <span class="cs-poll-opt-text">${opt.text}</span>
            <span class="cs-poll-opt-pct">${pct}% (${opt.votes || 0})</span>
            ${
              isEnded
                ? `<button type="button"
                    class="cs-poll-answer-btn${isCorrect ? " active" : ""}"
                    data-poll-id="${p.id}"
                    data-opt-idx="${i}">
                    ${isCorrect ? "✓ Correct" : "Mark Correct"}
                  </button>`
                : ""
            }
          </div>`;
        })
        .join("");

      return `<div class="cs-card cs-poll-manage-card" data-item-id="${p.id}">
        <div class="cs-card-top">
          <div class="cs-card-subject">${p.subject || "Untitled"}</div>
          <div class="cs-card-date">${_csDateLabel(p.createdAt)}</div>
        </div>
        <div class="cs-poll-status-label">${statusLabel}</div>
        <div class="cs-poll-opts-list">${optionsHTML}</div>
        <div class="cs-card-expand">
          <div class="cs-card-safe-actions">
            <button type="button" class="cs-card-action" data-item-id="${p.id}" data-action="edit">Edit</button>
            ${isEnded && p.correctAnswerIdx != null ? `<button type="button" class="cs-card-action cs-poll-why-btn" data-item-id="${p.id}" data-action="why">${p.whyPost ? "Edit Why Post" : "Create Why Post"}</button>` : ""}
          </div>
          <div class="cs-card-danger-actions">
            <button type="button" class="cs-card-action danger" data-item-id="${p.id}" data-action="delete">Delete</button>
          </div>
        </div>
      </div>`;
    })
    .join("");

  // Correct-answer toggle buttons
  el.querySelectorAll(".cs-poll-answer-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const pollId = btn.getAttribute("data-poll-id");
      const optIdx = parseInt(btn.getAttribute("data-opt-idx"));
      const poll = DataStore.getById("polls", pollId);
      if (!poll) return;
      // Toggle: clicking already-correct answer unselects it
      const newIdx = poll.correctAnswerIdx === optIdx ? null : optIdx;
      DataStore.update("polls", pollId, { correctAnswerIdx: newIdx });
      _csPollRenderManageList();
    });
  });

  // Edit / Delete actions
  el.querySelectorAll("[data-action]").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const action = btn.getAttribute("data-action");
      const id = btn.getAttribute("data-item-id");
      if (action === "delete") {
        if (
          !(await window.UMessageModal.confirm(
            "Delete poll?",
            "Confirm Delete",
          ))
        )
          return;
        DataStore.remove("polls", id);
        _csPollRenderManageList();
      } else if (action === "edit") {
        const p = DataStore.getById("polls", id);
        if (p) _csPollLoadEdit(p);
      } else if (action === "why") {
        const p = DataStore.getById("polls", id);
        if (p) _csPollOpenWhyForm(p);
      }
    });
  });

  // Card tap to expand/collapse actions
  el.querySelectorAll(".cs-poll-manage-card").forEach((card) => {
    card.addEventListener("click", () => {
      const wasOpen = card.classList.contains("open");
      el.querySelectorAll(".cs-card.open").forEach((c) =>
        c.classList.remove("open"),
      );
      if (!wasOpen) card.classList.add("open");
    });
  });
}

document
  .getElementById("cs-poll-send")
  .addEventListener("click", () => _csPollSave(false));
document
  .getElementById("cs-poll-draft-btn")
  .addEventListener("click", () => _csPollSave(true));
document
  .getElementById("cs-poll-cancel")
  .addEventListener("click", async () => {
    const ok = await window.UMessageModal.confirm(
      "Cancel and clear the poll form?",
      "Confirmation",
    );
    if (!ok) return;
    _csPollResetForm();
  });

// ── Why Post form ─────────────────────────────────────
function _csPollOpenWhyForm(poll) {
  document.getElementById("cs-poll-why-poll-id").value = poll.id;
  const wp = poll.whyPost || {};
  document.getElementById("cs-poll-why-body").value = wp.body || "";
  const threads = wp.threads || [];
  for (let i = 1; i <= 5; i++) {
    const t = threads[i - 1] || {};
    const titleEl = document.getElementById(`cs-poll-why-t${i}-title`);
    const bodyEl = document.getElementById(`cs-poll-why-t${i}-body`);
    if (titleEl) titleEl.value = t.title || "";
    if (bodyEl) bodyEl.value = t.text || "";
  }
  const imgInput = document.getElementById("cs-poll-why-image");
  const imgWidget = imgInput?.closest(".cs-img-widget");
  if (imgInput) imgInput.value = wp.image || "";
  if (imgWidget) {
    _csSetWidgetPreview(imgWidget, wp.image || "");
    _csSetWidgetState(imgWidget, null, "");
  }
  _csSwitch("poll", "why");
}

function _csPollGetWhyThreads() {
  const threads = [];
  for (let i = 1; i <= 5; i++) {
    const title = (
      document.getElementById(`cs-poll-why-t${i}-title`)?.value || ""
    ).trim();
    const text = (
      document.getElementById(`cs-poll-why-t${i}-body`)?.value || ""
    ).trim();
    if (title || text) threads.push({ title, text });
  }
  return threads;
}

async function _csPollSaveWhy(isDraft) {
  const pollId = document.getElementById("cs-poll-why-poll-id").value;
  if (!pollId) return;
  const body = (
    document.getElementById("cs-poll-why-body")?.value || ""
  ).trim();
  const image = (
    document.getElementById("cs-poll-why-image")?.value || ""
  ).trim();
  const threads = _csPollGetWhyThreads();
  const whyPost = { body, threads, draft: isDraft, image };
  DataStore.update("polls", pollId, { whyPost });
  await window.UMessageModal.success(
    isDraft ? "Why Post saved as draft" : "Why Post published",
    "Saved",
  );
  _csSwitch("poll", "manage");
}

document
  .getElementById("cs-poll-why-send")
  .addEventListener("click", () => _csPollSaveWhy(false));
document
  .getElementById("cs-poll-why-draft")
  .addEventListener("click", () => _csPollSaveWhy(true));
document
  .getElementById("cs-poll-why-cancel")
  .addEventListener("click", async () => {
    const ok = await window.UMessageModal.confirm(
      "Clear Why Post form?",
      "Confirmation",
    );
    if (!ok) return;
    const pollId = document.getElementById("cs-poll-why-poll-id").value;
    document.getElementById("cs-poll-why-body").value = "";
    for (let i = 1; i <= 5; i++) {
      const t = document.getElementById(`cs-poll-why-t${i}-title`);
      const b = document.getElementById(`cs-poll-why-t${i}-body`);
      if (t) t.value = "";
      if (b) b.value = "";
    }
    const imgInput = document.getElementById("cs-poll-why-image");
    const imgWidget = imgInput?.closest(".cs-img-widget");
    if (imgInput) imgInput.value = "";
    if (imgWidget) {
      _csSetWidgetPreview(imgWidget, "");
      _csSetWidgetState(imgWidget, null, "");
    }
    document.getElementById("cs-poll-why-poll-id").value = pollId;
  });

// Duration toggle buttons
document.querySelectorAll(".cs-poll-dur-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".cs-poll-dur-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const durInput = document.getElementById("cs-poll-ends-at");
    if (durInput) durInput.value = btn.getAttribute("data-dur");
  });
});

// ══════════════════════════════════════════════════════
//  NOTIFICATIONS
// ══════════════════════════════════════════════════════

function _csNotiResetForm() {
  ["cs-noti-edit-id", "cs-noti-title", "cs-noti-body"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
}

function _csNotiLoadEdit(noti) {
  document.getElementById("cs-noti-edit-id").value = noti.id;
  document.getElementById("cs-noti-title").value = noti.title || "";
  document.getElementById("cs-noti-body").value =
    noti.content || noti.body || "";
  _csSwitch("notifications", "create");
}

async function _csNotiSave(isDraft) {
  const msg = isDraft
    ? "Save this notification as draft?"
    : "Send this notification?";
  if (!(await window.UMessageModal.confirm(msg, "Confirmation"))) return;
  const id = document.getElementById("cs-noti-edit-id").value;
  const data = {
    title: document.getElementById("cs-noti-title").value.trim(),
    content: document.getElementById("cs-noti-body").value.trim(),
    draft: isDraft,
  };
  if (!data.title) {
    await window.UMessageModal.error("Title is required", "Validation");
    return;
  }
  if (id) DataStore.update("notifications", id, data);
  else
    DataStore.add("notifications", {
      ...data,
      createdAt: new Date().toISOString(),
    });
  _csNotiResetForm();
  _csSwitch("notifications", isDraft ? "draft" : "manage");
}

function _csNotiRefresh(tab) {
  if (tab === "view") {
    _csRenderUserSitePreview("cs-notifications-view-list", "notifications");
  } else if (tab === "create") {
    if (!document.getElementById("cs-noti-edit-id").value) _csNotiResetForm();
  } else if (tab === "draft") {
    _csRenderList(
      "cs-notifications-draft-list",
      DataStore.getAll("notifications").filter((n) => n.draft),
      {
        icon: "📝",
        actions: [
          { id: "edit", label: "Edit Draft" },
          { id: "delete", label: "Delete", cls: "danger" },
        ],
        onAction: async (a, id) => {
          if (a === "delete") {
            if (
              !(await window.UMessageModal.confirm("Delete?", "Confirm Delete"))
            )
              return;
            DataStore.remove("notifications", id);
            _csNotiRefresh("draft");
          } else {
            const n = DataStore.getById("notifications", id);
            if (n) _csNotiLoadEdit(n);
          }
        },
      },
    );
  } else if (tab === "manage") {
    _csRenderList(
      "cs-notifications-manage-list",
      DataStore.getAll("notifications").filter((n) => !n.draft),
      {
        icon: "🔔",
        actions: [
          { id: "edit", label: "Edit" },
          { id: "delete", label: "Delete", cls: "danger" },
        ],
        onAction: async (a, id) => {
          if (a === "delete") {
            if (
              !(await window.UMessageModal.confirm(
                "Delete notification?",
                "Confirm Delete",
              ))
            )
              return;
            DataStore.remove("notifications", id);
            _csNotiRefresh("manage");
          } else {
            const n = DataStore.getById("notifications", id);
            if (n) _csNotiLoadEdit(n);
          }
        },
      },
    );
  }
}

document
  .getElementById("cs-noti-send")
  .addEventListener("click", () => _csNotiSave(false));
document
  .getElementById("cs-noti-draft-btn")
  .addEventListener("click", () => _csNotiSave(true));
document
  .getElementById("cs-noti-cancel")
  .addEventListener("click", async () => {
    const ok = await window.UMessageModal.confirm(
      "Cancel and clear the notification form?",
      "Confirmation",
    );
    if (!ok) return;
    _csNotiResetForm();
  });

// ══════════════════════════════════════════════════════
//  APPS — inline Create tab
// ══════════════════════════════════════════════════════

function _csAppsResetForm() {
  [
    "cs-apps-edit-id",
    "cs-apps-name",
    "cs-apps-platform",
    "cs-apps-version",
    "cs-apps-icon",
    "cs-apps-visual1",
    "cs-apps-visual2",
    "cs-apps-about",
    "cs-apps-desc",
    "cs-apps-notes",
    "cs-apps-cta-url",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  _csSyncImgPreviews(["cs-apps-icon", "cs-apps-visual1", "cs-apps-visual2"]);
}

function _csAppsLoadEdit(app) {
  document.getElementById("cs-apps-edit-id").value = app.id;
  document.getElementById("cs-apps-name").value = app.name || "";
  document.getElementById("cs-apps-platform").value = app.platform || "";
  document.getElementById("cs-apps-version").value = app.version || "";
  document.getElementById("cs-apps-icon").value = app.img || "";
  const visuals = app.visuals || [];
  const v1 = document.getElementById("cs-apps-visual1");
  const v2 = document.getElementById("cs-apps-visual2");
  if (v1) v1.value = visuals[0] || app.visual || "";
  if (v2) v2.value = visuals[1] || "";
  document.getElementById("cs-apps-about").value = app.short || app.about || "";
  document.getElementById("cs-apps-desc").value = app.desc || "";
  document.getElementById("cs-apps-notes").value = app.notes || "";
  const ctaUrl = document.getElementById("cs-apps-cta-url");
  if (ctaUrl) ctaUrl.value = app.ctaUrl || "";
  _csSyncImgPreviews(["cs-apps-icon", "cs-apps-visual1", "cs-apps-visual2"]);
  _csSwitch("apps", "create");
}

async function _csAppsSave(isDraft) {
  const msg = isDraft ? "Save this app as draft?" : "Publish this app?";
  if (!(await window.UMessageModal.confirm(msg, "Confirmation"))) return;
  const id = document.getElementById("cs-apps-edit-id").value;
  const v1 = document.getElementById("cs-apps-visual1")?.value.trim() || "";
  const v2 = document.getElementById("cs-apps-visual2")?.value.trim() || "";
  const data = {
    name: document.getElementById("cs-apps-name").value.trim(),
    platform: document.getElementById("cs-apps-platform").value.trim(),
    version: document.getElementById("cs-apps-version").value.trim(),
    img: document.getElementById("cs-apps-icon").value.trim(),
    visual: v1,
    visuals: [v1, v2].filter(Boolean),
    short: document.getElementById("cs-apps-about").value.trim(),
    about: document.getElementById("cs-apps-about").value.trim(),
    desc: document.getElementById("cs-apps-desc").value.trim(),
    notes: document.getElementById("cs-apps-notes").value.trim(),
    ctaUrl: document.getElementById("cs-apps-cta-url")?.value.trim() || "",
    draft: isDraft,
  };
  if (!data.name) {
    await window.UMessageModal.error("App name is required", "Validation");
    return;
  }
  if (id) DataStore.update("apps", id, data);
  else DataStore.add("apps", { ...data, createdAt: new Date().toISOString() });
  _csAppsResetForm();
  if (typeof renderAppsList === "function") renderAppsList();
  _csSwitch("apps", isDraft ? "draft" : "manage");
}

function _csAppsRefresh(tab) {
  if (tab === "view") {
    if (typeof renderAppsList === "function") renderAppsList();
  } else if (tab === "create") {
    if (!document.getElementById("cs-apps-edit-id").value) _csAppsResetForm();
  } else if (tab === "draft") {
    _csRenderList(
      "cs-apps-draft-list",
      DataStore.getAll("apps").filter((a) => a.draft),
      {
        icon: "📱",
        actions: [
          { id: "edit", label: "Edit Draft" },
          { id: "delete", label: "Delete", cls: "danger" },
        ],
        onAction: async (a, id) => {
          if (a === "delete") {
            if (
              !(await window.UMessageModal.confirm(
                "Delete draft?",
                "Confirm Delete",
              ))
            )
              return;
            DataStore.remove("apps", id);
            _csAppsRefresh("draft");
          } else {
            const app = DataStore.getById("apps", id);
            if (app) _csAppsLoadEdit(app);
          }
        },
      },
    );
  } else if (tab === "manage") {
    _csRenderList(
      "cs-apps-manage-list",
      DataStore.getAll("apps").filter((a) => !a.draft),
      {
        icon: "📱",
        actions: [
          { id: "edit", label: "Edit" },
          { id: "pin", label: "Pin" },
          { id: "delete", label: "Delete", cls: "danger" },
        ],
        onAction: async (a, id) => {
          if (a === "delete") {
            if (
              !(await window.UMessageModal.confirm(
                "Delete app?",
                "Confirm Delete",
              ))
            )
              return;
            DataStore.remove("apps", id);
            _csAppsRefresh("manage");
          } else if (a === "pin") {
            const allApps = DataStore.getAll("apps");
            allApps.forEach((ap) =>
              DataStore.update("apps", ap.id, { pinned: ap.id === id }),
            );
            _csAppsRefresh("manage");
          } else {
            const app = DataStore.getById("apps", id);
            if (app) _csAppsLoadEdit(app);
          }
        },
      },
    );
  }
}

document
  .getElementById("cs-apps-send")
  .addEventListener("click", () => _csAppsSave(false));
document
  .getElementById("cs-apps-draft-btn")
  .addEventListener("click", () => _csAppsSave(true));
document
  .getElementById("cs-apps-cancel")
  .addEventListener("click", async () => {
    const ok = await window.UMessageModal.confirm(
      "Cancel and clear the app form?",
      "Confirmation",
    );
    if (!ok) return;
    _csAppsResetForm();
  });

// ══════════════════════════════════════════════════════
//  BOOKS — inline Create tab
// ══════════════════════════════════════════════════════

function _csBooksResetForm() {
  [
    "cs-books-edit-id",
    "cs-books-name",
    "cs-books-desc",
    "cs-books-merit",
    "cs-books-notes",
    "cs-books-price",
    "cs-books-icon",
    "cs-books-visual1",
    "cs-books-visual2",
    "cs-books-ctacover",
    "cs-books-cta-url",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  for (let i = 1; i <= 5; i++) {
    const kp = document.getElementById(`cs-books-kp-${i}`);
    if (kp) kp.value = "";
  }
  for (let i = 1; i <= 3; i++) {
    const d = document.getElementById(`cs-books-detail-${i}`);
    if (d) d.value = "";
    const u = document.getElementById(`cs-books-detail-url-${i}`);
    if (u) u.value = "";
  }
  _csSyncImgPreviews([
    "cs-books-icon",
    "cs-books-visual1",
    "cs-books-visual2",
    "cs-books-ctacover",
  ]);
}

function _csBooksLoadEdit(book) {
  document.getElementById("cs-books-edit-id").value = book.id;
  document.getElementById("cs-books-name").value =
    book.name || book.title || "";
  document.getElementById("cs-books-desc").value =
    book.desc || book.description || "";
  document.getElementById("cs-books-merit").value = book.merit || "";
  document.getElementById("cs-books-notes").value = book.notes || "";
  document.getElementById("cs-books-price").value = book.price || "";
  document.getElementById("cs-books-icon").value = book.img || "";
  const visuals = book.visuals || [];
  const v1 = document.getElementById("cs-books-visual1");
  const v2 = document.getElementById("cs-books-visual2");
  if (v1) v1.value = visuals[0] || "";
  if (v2) v2.value = visuals[1] || "";
  const ctacover = document.getElementById("cs-books-ctacover");
  if (ctacover) ctacover.value = book.ctaCover || "";
  const ctaUrl = document.getElementById("cs-books-cta-url");
  if (ctaUrl) ctaUrl.value = book.ctaUrl || "";
  const kps = book.keyPoints || [];
  for (let i = 1; i <= 5; i++) {
    const el = document.getElementById(`cs-books-kp-${i}`);
    if (el) el.value = kps[i - 1] || "";
  }
  const details = book.details || book.platforms || [];
  const platformUrls = book.platformUrls || [];
  for (let i = 1; i <= 3; i++) {
    const el = document.getElementById(`cs-books-detail-${i}`);
    if (el) el.value = details[i - 1] || "";
    const ul = document.getElementById(`cs-books-detail-url-${i}`);
    if (ul) ul.value = platformUrls[i - 1] || "";
  }
  _csSyncImgPreviews([
    "cs-books-icon",
    "cs-books-visual1",
    "cs-books-visual2",
    "cs-books-ctacover",
  ]);
  _csSwitch("books", "create");
}

async function _csBooksSave(isDraft) {
  const msg = isDraft ? "Save this book as draft?" : "Publish this book?";
  if (!(await window.UMessageModal.confirm(msg, "Confirmation"))) return;
  const id = document.getElementById("cs-books-edit-id").value;
  const keyPoints = [];
  for (let i = 1; i <= 5; i++) {
    const v = (document.getElementById(`cs-books-kp-${i}`)?.value || "").trim();
    if (v) keyPoints.push(v);
  }
  const details = [];
  const platformUrls = [];
  for (let i = 1; i <= 3; i++) {
    details.push(
      (document.getElementById(`cs-books-detail-${i}`)?.value || "").trim(),
    );
    platformUrls.push(
      (document.getElementById(`cs-books-detail-url-${i}`)?.value || "").trim(),
    );
  }
  const v1 = document.getElementById("cs-books-visual1")?.value.trim() || "";
  const v2 = document.getElementById("cs-books-visual2")?.value.trim() || "";
  const data = {
    name: document.getElementById("cs-books-name").value.trim(),
    desc: document.getElementById("cs-books-desc").value.trim(),
    merit: document.getElementById("cs-books-merit").value.trim(),
    notes: document.getElementById("cs-books-notes").value.trim(),
    price: document.getElementById("cs-books-price").value.trim(),
    img: document.getElementById("cs-books-icon").value.trim(),
    visuals: [v1, v2].filter(Boolean),
    ctaCover: document.getElementById("cs-books-ctacover")?.value.trim() || "",
    ctaUrl: document.getElementById("cs-books-cta-url")?.value.trim() || "",
    keyPoints,
    details,
    platformUrls,
    draft: isDraft,
  };
  if (!data.name) {
    await window.UMessageModal.error("Book name is required", "Validation");
    return;
  }
  if (id) DataStore.update("books", id, data);
  else DataStore.add("books", { ...data, createdAt: new Date().toISOString() });
  _csBooksResetForm();
  if (typeof renderBooksList === "function") renderBooksList();
  _csSwitch("books", isDraft ? "draft" : "manage");
}

function _csBooksRefresh(tab) {
  if (tab === "view") {
    if (typeof renderBooksList === "function") renderBooksList();
  } else if (tab === "create") {
    if (!document.getElementById("cs-books-edit-id").value) _csBooksResetForm();
  } else if (tab === "draft") {
    _csRenderList(
      "cs-books-draft-list",
      DataStore.getAll("books").filter((b) => b.draft),
      {
        icon: "📚",
        actions: [
          { id: "edit", label: "Edit Draft" },
          { id: "delete", label: "Delete", cls: "danger" },
        ],
        onAction: async (a, id) => {
          if (a === "delete") {
            if (
              !(await window.UMessageModal.confirm(
                "Delete draft?",
                "Confirm Delete",
              ))
            )
              return;
            DataStore.remove("books", id);
            _csBooksRefresh("draft");
          } else {
            const b = DataStore.getById("books", id);
            if (b) _csBooksLoadEdit(b);
          }
        },
      },
    );
  } else if (tab === "manage") {
    _csRenderList(
      "cs-books-manage-list",
      DataStore.getAll("books").filter((b) => !b.draft),
      {
        icon: "📚",
        actions: [
          { id: "edit", label: "Edit" },
          { id: "pin", label: "Pin" },
          { id: "delete", label: "Delete", cls: "danger" },
        ],
        onAction: async (a, id) => {
          if (a === "delete") {
            if (
              !(await window.UMessageModal.confirm(
                "Delete book?",
                "Confirm Delete",
              ))
            )
              return;
            DataStore.remove("books", id);
            _csBooksRefresh("manage");
          } else if (a === "pin") {
            const allBooks = DataStore.getAll("books");
            allBooks.forEach((b) =>
              DataStore.update("books", b.id, { pinned: b.id === id }),
            );
            _csBooksRefresh("manage");
          } else {
            const b = DataStore.getById("books", id);
            if (b) _csBooksLoadEdit(b);
          }
        },
      },
    );
  }
}

document
  .getElementById("cs-books-send")
  .addEventListener("click", () => _csBooksSave(false));
document
  .getElementById("cs-books-draft-btn")
  .addEventListener("click", () => _csBooksSave(true));
document
  .getElementById("cs-books-cancel")
  .addEventListener("click", async () => {
    const ok = await window.UMessageModal.confirm(
      "Cancel and clear the book form?",
      "Confirmation",
    );
    if (!ok) return;
    _csBooksResetForm();
  });

// ══════════════════════════════════════════════════════
//  CIRCLE — inline Create tab
// ══════════════════════════════════════════════════════

function _csCircleResetForm() {
  [
    "cs-circle-edit-id",
    "cs-circle-name",
    "cs-circle-platform",
    "cs-circle-about",
    "cs-circle-icon",
    "cs-circle-new-cat",
    "cs-circle-url",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  for (let i = 1; i <= 3; i++) {
    const f = document.getElementById(`cs-circle-feat-${i}`);
    if (f) f.value = "";
  }
  const sel = document.getElementById("cs-circle-category");
  if (sel) sel.value = "";
  _csPopulateCircleCategorySelect("");
  _csSyncImgPreviews(["cs-circle-icon"]);
}

const _CS_CIRCLE_DEFAULT_CATS = [
  "Gaming",
  "Sports",
  "Social",
  "Tech",
  "Dating",
  "Money",
];

function _csPopulateCircleCategorySelect(selected) {
  const display = document.getElementById("cs-circle-cat-display");
  const dropdown = document.getElementById("cs-circle-cat-dropdown");
  const hidden = document.getElementById("cs-circle-category");
  const hint = document.getElementById("cs-circle-cat-del-hint");
  if (!display || !dropdown || !hidden) return;

  // Derive categories from existing circle records
  const circles = DataStore.getAll("circles");
  const existing = [...new Set(circles.map((c) => c.category).filter(Boolean))];
  const all = [..._CS_CIRCLE_DEFAULT_CATS];
  existing.forEach((c) => {
    if (!all.includes(c)) all.push(c);
  });

  hidden.value = selected || "";
  display.textContent = selected || "Select A Category";
  if (hint)
    hint.textContent = "Select a category, then tap Delete to remove it";

  const opts = [
    { value: "", label: "Select A Category", deletable: false },
    ...[...all]
      .sort((a, b) => a.localeCompare(b))
      .map((cat) => ({
        value: cat,
        label: cat,
        deletable: !_CS_CIRCLE_DEFAULT_CATS.includes(cat),
      })),
    { value: "__new__", label: "+ New Category...", deletable: false },
  ];

  const seen = new Set();
  dropdown.innerHTML = opts
    .filter((o) => {
      if (seen.has(o.value)) return false;
      seen.add(o.value);
      return true;
    })
    .map(
      (o) =>
        `<div class="cs-cat-select-opt${selected === o.value ? " active" : ""}${o.deletable ? " deletable" : ""}" data-val="${o.value}">${o.label}${o.deletable ? '<span class="cs-cat-del-dot"></span>' : ""}</div>`,
    )
    .join("");

  dropdown.querySelectorAll(".cs-cat-select-opt").forEach((opt) => {
    opt.addEventListener("click", () => {
      const val = opt.getAttribute("data-val");
      hidden.value = val;
      display.textContent =
        val === ""
          ? "Select A Category"
          : val === "__new__"
            ? "+ New Category..."
            : val;
      dropdown.style.display = "none";
      const newCatRow = document.getElementById("cs-circle-new-cat-row");
      const newCatInput = document.getElementById("cs-circle-new-cat");
      if (newCatRow)
        newCatRow.style.display = val === "__new__" ? "block" : "none";
      if (newCatInput && val !== "__new__") newCatInput.value = "";
    });
  });

  // Reset new-cat row
  const newCatRow = document.getElementById("cs-circle-new-cat-row");
  const newCatInput = document.getElementById("cs-circle-new-cat");
  if (newCatRow) newCatRow.style.display = "none";
  if (newCatInput) newCatInput.value = "";
}

async function _csDeleteCircleCategory() {
  const hint = document.getElementById("cs-circle-cat-del-hint");
  const hidden = document.getElementById("cs-circle-category");
  const cat = hidden?.value || "";
  const flash = (msg) => {
    if (!hint) return;
    hint.textContent = msg;
    hint.style.color = "rgba(255,100,100,0.9)";
    setTimeout(() => {
      hint.style.color = "";
      hint.textContent = "Select a category, then tap Delete to remove it";
    }, 2200);
  };
  if (!cat || cat === "__new__") {
    flash("Select a category first");
    return;
  }
  if (_CS_CIRCLE_DEFAULT_CATS.includes(cat)) {
    flash(`"${cat}" is a built-in category — cannot be deleted`);
    return;
  }
  const ok = await window.UMessageModal.confirm(
    `Delete category "${cat}"? Existing circles won\'t be affected.`,
    "Delete Category",
  );
  if (!ok) return;
  _csPopulateCircleCategorySelect("");
}

function _csCircleLoadEdit(circle) {
  document.getElementById("cs-circle-edit-id").value = circle.id;
  document.getElementById("cs-circle-name").value = circle.name || "";
  document.getElementById("cs-circle-platform").value = circle.platform || "";
  document.getElementById("cs-circle-about").value = circle.about || "";
  document.getElementById("cs-circle-icon").value = circle.img || "";
  const circleUrl = document.getElementById("cs-circle-url");
  if (circleUrl) circleUrl.value = circle.url || "";
  const feats = circle.features || [];
  for (let i = 1; i <= 3; i++) {
    const f = document.getElementById(`cs-circle-feat-${i}`);
    if (f) f.value = feats[i - 1] || "";
  }
  _csPopulateCircleCategorySelect(circle.category || "");
  _csSyncImgPreviews(["cs-circle-icon"]);
  _csSwitch("circle", "create");
}

async function _csCircleSave(isDraft) {
  const msg = isDraft ? "Save this circle as draft?" : "Add this circle?";
  if (!(await window.UMessageModal.confirm(msg, "Confirmation"))) return;
  const id = document.getElementById("cs-circle-edit-id").value;
  let category = document.getElementById("cs-circle-category")?.value || "";
  if (category === "__new__") {
    category = (
      document.getElementById("cs-circle-new-cat")?.value || ""
    ).trim();
    if (!category) {
      await window.UMessageModal.error(
        "Please enter a category name",
        "Validation",
      );
      return;
    }
  }
  const features = [];
  for (let i = 1; i <= 3; i++) {
    features.push(
      (document.getElementById(`cs-circle-feat-${i}`)?.value || "").trim(),
    );
  }
  const data = {
    name: document.getElementById("cs-circle-name").value.trim(),
    category,
    platform: document.getElementById("cs-circle-platform").value.trim(),
    about: document.getElementById("cs-circle-about").value.trim(),
    features,
    img: document.getElementById("cs-circle-icon").value.trim(),
    url: document.getElementById("cs-circle-url")?.value.trim() || "",
    draft: isDraft,
  };
  if (!data.name) {
    await window.UMessageModal.error("Circle name is required", "Validation");
    return;
  }
  if (id) DataStore.update("circles", id, data);
  else
    DataStore.add("circles", { ...data, createdAt: new Date().toISOString() });
  _csCircleResetForm();
  if (typeof renderCirclesList === "function") renderCirclesList();
  _csSwitch("circle", isDraft ? "draft" : "manage");
}

function _csCircleRefresh(tab) {
  if (tab === "view") {
    if (typeof renderCirclesList === "function") renderCirclesList();
  } else if (tab === "create") {
    if (!document.getElementById("cs-circle-edit-id").value) {
      _csCircleResetForm();
      _csCirclePopulateCategories();
    }
  } else if (tab === "draft") {
    _csRenderList(
      "cs-circle-draft-list",
      DataStore.getAll("circles").filter((c) => c.draft),
      {
        icon: "🔵",
        actions: [
          { id: "edit", label: "Edit Draft" },
          { id: "delete", label: "Delete", cls: "danger" },
        ],
        onAction: async (a, id) => {
          if (a === "delete") {
            if (
              !(await window.UMessageModal.confirm(
                "Delete draft?",
                "Confirm Delete",
              ))
            )
              return;
            DataStore.remove("circles", id);
            _csCircleRefresh("draft");
          } else {
            const c = DataStore.getById("circles", id);
            if (c) _csCircleLoadEdit(c);
          }
        },
      },
    );
  } else if (tab === "manage") {
    _csRenderList(
      "cs-circle-manage-list",
      DataStore.getAll("circles").filter((c) => !c.draft),
      {
        icon: "🔵",
        actions: [
          { id: "edit", label: "Edit" },
          { id: "delete", label: "Delete", cls: "danger" },
        ],
        onAction: async (a, id) => {
          if (a === "delete") {
            if (
              !(await window.UMessageModal.confirm(
                "Delete circle?",
                "Confirm Delete",
              ))
            )
              return;
            DataStore.remove("circles", id);
            _csCircleRefresh("manage");
          } else {
            const c = DataStore.getById("circles", id);
            if (c) _csCircleLoadEdit(c);
          }
        },
      },
    );
  }
}

// Custom category select — toggle panel + close on outside click
(function () {
  const trigger = document.getElementById("cs-circle-cat-trigger");
  const dropdown = document.getElementById("cs-circle-cat-dropdown");
  if (!trigger || !dropdown) return;
  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    _csPopulateCircleCategorySelect(
      document.getElementById("cs-circle-category")?.value || "",
    );
    dropdown.style.display =
      dropdown.style.display === "none" ? "block" : "none";
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest("#cs-circle-cat-wrap")) {
      dropdown.style.display = "none";
    }
  });
  document
    .getElementById("cs-circle-cat-del-btn")
    ?.addEventListener("click", _csDeleteCircleCategory);
  // Populate on init so the form is ready before any edit
  _csPopulateCircleCategorySelect("");
})();

document
  .getElementById("cs-circle-send")
  .addEventListener("click", () => _csCircleSave(false));
document
  .getElementById("cs-circle-draft-btn")
  .addEventListener("click", () => _csCircleSave(true));
document
  .getElementById("cs-circle-cancel")
  .addEventListener("click", async () => {
    const ok = await window.UMessageModal.confirm(
      "Cancel and clear the circle form?",
      "Confirmation",
    );
    if (!ok) return;
    _csCircleResetForm();
  });

// ══════════════════════════════════════════════════════
//  EDIT PROFILE
// ══════════════════════════════════════════════════════

let _csAboutSections = [];
let _csMsgLimit = 5;
let _csMsgOn = true;
let _csCallOn = true;

const CS_ABOUT_LOCKED = [
  "Master Togan",
  "Description",
  "Mission",
  "Contributors",
];

function _csProfileRefresh(tab) {
  const profile = DataStore.getProfile();
  if (tab === "details") {
    document.getElementById("cs-profile-name").value = profile.name || "";
    document.getElementById("cs-profile-img").value = profile.img || "";
    document.getElementById("cs-profile-price").value = profile.price || "";
    document.getElementById("cs-profile-phone").value = profile.phone || "";
    document.getElementById("cs-profile-email").value = profile.email || "";
    _csCallOn = profile.callOn !== false;
    document
      .getElementById("cs-call-toggle")
      ?.classList.toggle("on", _csCallOn);
    _csSyncImgPreviews(["cs-profile-img"]);
  } else if (tab === "cta") {
    document.getElementById("cs-profile-mentorship-url").value =
      profile.mentorshipUrl || "";
    document.getElementById("cs-profile-x-url").value = profile.xUrl || "";
  } else if (tab === "message") {
    _csMsgLimit = profile.msgLimit || 5;
    _csMsgOn = profile.msgOn !== false;
    document.getElementById("cs-msg-val").textContent = _csMsgLimit;
    document.getElementById("cs-msg-toggle").classList.toggle("on", _csMsgOn);
  } else if (tab === "about") {
    const stored = profile.about || [];
    const locked = CS_ABOUT_LOCKED.map((title) => {
      const found = stored.find((s) => s.title === title && s.locked);
      return found || { title, body: "", locked: true };
    });
    const custom = stored.filter((s) => !s.locked).slice(0, 6);
    _csAboutSections = [...locked, ...custom];
    _csRenderAbout();
  }
}

function _csRenderAbout() {
  const list = document.getElementById("cs-about-list");
  if (!list) return;
  list.innerHTML = _csAboutSections
    .map(
      (s, i) => `
    <div class="cs-about-item ${s.locked ? "locked" : ""}" data-idx="${i}">
      <div class="cs-about-item-header">
        <div class="cs-about-item-title-row">
          <div class="cs-about-item-badge">${s.locked ? "🔒" : "✎"}</div>
          <div class="cs-about-item-title">${s.title}</div>
          ${s.locked ? '<span class="cs-about-item-lock-tag">Core</span>' : ""}
        </div>
        <div class="cs-about-item-controls">
          ${!s.locked ? `<button type="button" class="cs-about-remove" data-idx="${i}">✕</button>` : ""}
        </div>
      </div>
      <div class="cs-about-item-body">
        <textarea class="cs-field-textarea" style="min-height:80px" data-about-idx="${i}" placeholder="Write about ${s.title}...">${s.body || ""}</textarea>
      </div>
    </div>`,
    )
    .join("");

  list.querySelectorAll("[data-about-idx]").forEach((ta) => {
    ta.addEventListener("input", () => {
      _csAboutSections[parseInt(ta.getAttribute("data-about-idx"))].body =
        ta.value;
    });
  });
  list.querySelectorAll(".cs-about-remove").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.getAttribute("data-idx"));
      _csAboutSections.splice(idx, 1);
      _csRenderAbout();
    });
  });
  const addBtn = document.getElementById("cs-about-add");
  if (addBtn)
    addBtn.style.display =
      _csAboutSections.filter((s) => !s.locked).length >= 6 ? "none" : "flex";
}

document.getElementById("cs-call-toggle")?.addEventListener("click", () => {
  _csCallOn = !_csCallOn;
  document.getElementById("cs-call-toggle")?.classList.toggle("on", _csCallOn);
});
document.getElementById("cs-msg-dec").addEventListener("click", () => {
  _csMsgLimit = Math.max(5, _csMsgLimit - 1);
  document.getElementById("cs-msg-val").textContent = _csMsgLimit;
});
document.getElementById("cs-msg-inc").addEventListener("click", () => {
  _csMsgLimit = Math.min(15, _csMsgLimit + 1);
  document.getElementById("cs-msg-val").textContent = _csMsgLimit;
});
document.getElementById("cs-msg-toggle").addEventListener("click", () => {
  _csMsgOn = !_csMsgOn;
  document.getElementById("cs-msg-toggle").classList.toggle("on", _csMsgOn);
});
document.getElementById("cs-about-add").addEventListener("click", async () => {
  if (_csAboutSections.filter((s) => !s.locked).length >= 6) return;
  let title = null;
  title = await window.UMessageModal.prompt({
    title: "Create Section",
    label: "Enter a title for this about section.",
    placeholder: "Section title",
    primaryText: "Proceed",
    secondaryText: "Cancel",
  });

  if (!title) return;
  _csAboutSections.push({ title: title.trim(), body: "", locked: false });
  _csRenderAbout();
});

document
  .getElementById("cs-profile-details-save")
  .addEventListener("click", async () => {
    DataStore.setProfile({
      name: document.getElementById("cs-profile-name").value.trim(),
      img: document.getElementById("cs-profile-img").value.trim(),
      price: document.getElementById("cs-profile-price").value.trim(),
      phone: document.getElementById("cs-profile-phone").value.trim(),
      email: document.getElementById("cs-profile-email").value.trim(),
      callOn: _csCallOn,
    });
    await window.UMessageModal.notify("Details saved", "Notification");
  });
document
  .getElementById("cs-profile-cta-save")
  .addEventListener("click", async () => {
    DataStore.setProfile({
      mentorshipUrl: document
        .getElementById("cs-profile-mentorship-url")
        .value.trim(),
      xUrl: document.getElementById("cs-profile-x-url").value.trim(),
    });
    await window.UMessageModal.notify("CTA saved", "Notification");
  });
document
  .getElementById("cs-profile-msg-save")
  .addEventListener("click", async () => {
    DataStore.setProfile({ msgLimit: _csMsgLimit, msgOn: _csMsgOn });
    await window.UMessageModal.notify("Message settings saved", "Notification");
  });
document
  .getElementById("cs-profile-about-save")
  .addEventListener("click", async () => {
    DataStore.setProfile({ about: _csAboutSections });
    await window.UMessageModal.notify("About saved", "Notification");
  });

// ══════════════════════════════════════════════════════
//  SUBSCRIBERS
// ══════════════════════════════════════════════════════

function _csSubsRefresh(tab) {
  const subs = DataStore.getAll("subscribers");
  if (tab === "all") {
    document.getElementById("cs-subs-count").textContent = subs.length;
    const el = document.getElementById("cs-subs-all-list");
    if (!subs.length) {
      el.innerHTML =
        '<div class="cs-empty"><div class="cs-empty-icon">👤</div><div class="cs-empty-text">No subscribers yet</div></div>';
      return;
    }
    const sorted = [...subs].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );
    el.innerHTML = sorted
      .map(
        (s) => `
      <div class="cs-sub-item">
        <div class="cs-sub-avatar">${(s.name || s.email || "?")[0].toUpperCase()}</div>
        <div class="cs-sub-info">
          <div class="cs-sub-name">${s.name || "Unknown"}</div>
          <div class="cs-sub-email">${s.email || ""}</div>
          <div class="cs-sub-date">${_csDateLabel(s.createdAt)}</div>
        </div>
      </div>`,
      )
      .join("");
  } else if (tab === "stats") {
    const today = new Date().toDateString();
    document.getElementById("cs-subs-total").textContent = subs.length;
    document.getElementById("cs-subs-today").textContent = subs.filter(
      (s) => new Date(s.createdAt).toDateString() === today,
    ).length;
    const alphaEl = document.getElementById("cs-subs-alpha");
    const groups = {};
    subs.forEach((s) => {
      const char = (s.email || s.name || "?")[0].toUpperCase();
      const key = /[A-Z]/.test(char) ? char : "#";
      groups[key] = (groups[key] || 0) + 1;
    });
    const maxVal = Math.max(...Object.values(groups), 1);
    const keys = Object.keys(groups).sort();
    alphaEl.innerHTML = keys
      .map(
        (k) => `
      <div class="cs-sub-alpha-row">
        <div class="cs-sub-alpha-letter">${k}</div>
        <div class="cs-sub-alpha-bar"><div class="cs-sub-alpha-fill" style="width:${Math.round((groups[k] / maxVal) * 100)}%"></div></div>
        <div class="cs-sub-alpha-count">${groups[k]}</div>
      </div>`,
      )
      .join("");
  }
}

// ── Image Upload from Device ──────────────────────────
// Converts each .cs-upload-icon span into a file-picker button.
// When a file is selected, reads it as a data URL and sets
// the sibling text input value so it flows into save as normal.
(function _initImageUploads() {
  document.querySelectorAll(".cs-upload-row").forEach((row) => {
    const iconSpan = row.querySelector(".cs-upload-icon");
    const textInput = row.querySelector(".cs-field-input");
    if (!iconSpan || !textInput) return;

    // Create hidden file input
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.style.display = "none";
    row.appendChild(fileInput);

    // Cloud icon click → trigger file picker
    iconSpan.style.cursor = "pointer";
    iconSpan.addEventListener("click", (e) => {
      e.preventDefault();
      fileInput.value = "";
      fileInput.click();
    });

    // File selected → read as data URL → set text input
    fileInput.addEventListener("change", () => {
      const file = fileInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        textInput.value = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
  });
})();
