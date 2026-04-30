// admin/js/cs.js — Content Section Pages logic
// Handles: Feed, Quest, Stories, Updates, Poll, Notifications, EditProfile, Subscribers

// ── Shared thread builder ────────────────────────────

function _csRenderThreads(containerId, threads) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = threads
    .map(
      (t, i) => `
    <div class="thread-item" data-idx="${i}">
      <div class="thread-item-header">
        <span class="thread-item-label">Thread ${i + 1}</span>
        <div class="thread-item-controls">
          <button class="thread-remove-btn" data-idx="${i}">✕</button>
        </div>
      </div>
      <div class="thread-item-title">${t.title || ""}</div>
      <div class="thread-item-text">${t.text || ""}</div>
    </div>`,
    )
    .join("");
  el.querySelectorAll(".thread-remove-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      threads.splice(parseInt(btn.getAttribute("data-idx")), 1);
      _csRenderThreads(containerId, threads);
    });
  });
}

function _csAddThreadPrompt(containerId, threads) {
  const title = prompt("Thread title:");
  if (!title) return;
  const text = prompt("Thread body text:");
  threads.push({ title: title.trim(), text: (text || "").trim() });
  _csRenderThreads(containerId, threads);
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

// ── Generic card list renderer ───────────────────────

function _csRenderList(containerId, items, opts = {}) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!items || items.length === 0) {
    el.innerHTML = `<div class="cs-empty"><div class="cs-empty-icon">${opts.icon || "📄"}</div><div class="cs-empty-text">Nothing here yet</div></div>`;
    return;
  }
  el.innerHTML = items
    .map((item) => {
      const actions = (opts.actions || [])
        .map(
          (a) =>
            `<button type="button" class="cs-card-action ${a.cls || ""}" data-item-id="${item.id}" data-action="${a.id}">${a.label}</button>`,
        )
        .join("");
      return `
      <div class="cs-card" data-item-id="${item.id}">
        <div class="cs-card-top">
          <div class="cs-card-subject">${item.subject || item.question || item.title || item.name || "Untitled"}</div>
          <div class="cs-card-date">${_csDateLabel(item.createdAt)}</div>
        </div>
        ${item.content || item.body ? `<div class="cs-card-meta">${item.content || item.body || ""}</div>` : ""}
        ${actions ? `<div class="cs-card-expand">${actions}</div>` : ""}
      </div>`;
    })
    .join("");

  el.querySelectorAll("[data-action]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const action = btn.getAttribute("data-action");
      const id = btn.getAttribute("data-item-id");
      opts.onAction && opts.onAction(action, id);
    });
  });
}

// ── Generic view list (read-only) ────────────────────

function _csRenderViewList(containerId, items, opts = {}) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!items || items.length === 0) {
    el.innerHTML = `<div class="cs-empty"><div class="cs-empty-icon">${opts.icon || "📄"}</div><div class="cs-empty-text">No content yet</div></div>`;
    return;
  }
  el.innerHTML = items
    .map(
      (item) => `
    <div class="cs-view-card">
      <div class="cs-view-card-header">
        <div class="cs-view-card-title">${item.subject || item.question || item.title || item.name || "Untitled"}</div>
        <div class="cs-view-card-time">${_csDateLabel(item.createdAt)}</div>
      </div>
      ${item.content || item.body ? `<div class="cs-view-card-body">${item.content || item.body || ""}</div>` : ""}
    </div>`,
    )
    .join("");
}

// ── showContentSubTab ────────────────────────────────
// Called when a tab pill is clicked inside a section area

function showContentSubTab(section, tab) {
  const area = document.getElementById("content-area-" + section);
  if (!area) return;
  const tabKey = tab.toLowerCase();
  // Hide all cs-page divs inside this area
  area.querySelectorAll(".cs-page").forEach((p) => (p.style.display = "none"));
  // Show the right one — skip if no sub-pages exist (apps/books/circle use grid)
  const target = document.getElementById(`cs-${section}-${tabKey}`);
  if (!target) return;
  target.style.display = "flex";

  // Render the content for this tab
  _csRefreshTab(section, tabKey);
}

function _csRefreshTab(section, tab) {
  if (section === "feed") _csFeedRefresh(tab);
  else if (section === "quest") _csQuestRefresh(tab);
  else if (section === "stories") _csStoriesRefresh(tab);
  else if (section === "updates") _csUpdatesRefresh(tab);
  else if (section === "poll") _csPollRefresh(tab);
  else if (section === "notifications") _csNotiRefresh(tab);
  else if (section === "editprofile") _csProfileRefresh(tab);
  else if (section === "subscribers") _csSubsRefresh(tab);
}

// ══════════════════════════════════════════════════════
//  FEED
// ══════════════════════════════════════════════════════

let _feedThreads = [];

function _csFeedRefresh(tab) {
  if (tab === "view") {
    const posts = DataStore.getAll("posts").filter((p) => !p.draft);
    _csRenderViewList("cs-feed-view-list", posts, { icon: "✏️" });
  } else if (tab === "create") {
    // Reset form if no edit-id
    const editId = document.getElementById("cs-feed-edit-id").value;
    if (!editId) _csFeedResetForm();
  } else if (tab === "draft") {
    const drafts = DataStore.getAll("posts").filter((p) => p.draft);
    _csRenderList("cs-feed-draft-list", drafts, {
      icon: "📝",
      actions: [
        { id: "edit", label: "Edit Draft" },
        { id: "delete", label: "Delete", cls: "danger" },
      ],
      onAction: (action, id) => {
        if (action === "delete") {
          if (!confirm("Delete draft?")) return;
          DataStore.remove("posts", id);
          _csFeedRefresh("draft");
        } else if (action === "edit") {
          const post = DataStore.getById("posts", id);
          if (post) _csFeedLoadEdit(post, "draft");
        }
      },
    });
  } else if (tab === "manage") {
    const live = DataStore.getAll("posts").filter((p) => !p.draft);
    _csRenderList("cs-feed-manage-list", live, {
      icon: "✏️",
      actions: [
        { id: "edit", label: "Edit" },
        { id: "delete", label: "Delete", cls: "danger" },
      ],
      onAction: (action, id) => {
        if (action === "delete") {
          if (!confirm("Delete post?")) return;
          DataStore.remove("posts", id);
          _csFeedRefresh("manage");
        } else if (action === "edit") {
          const post = DataStore.getById("posts", id);
          if (post) _csFeedLoadEdit(post, "create");
        }
      },
    });
  }
}

function _csFeedResetForm() {
  document.getElementById("cs-feed-edit-id").value = "";
  document.getElementById("cs-feed-subject").value = "";
  document.getElementById("cs-feed-author").value = "Master Togan";
  document.getElementById("cs-feed-date").value = "";
  document.getElementById("cs-feed-content").value = "";
  document.getElementById("cs-feed-timeframe").value = "";
  document.getElementById("cs-feed-cta").value = "";
  _feedThreads = [];
  _csRenderThreads("cs-feed-threads", _feedThreads);
}

function _csFeedLoadEdit(post, switchToTab) {
  document.getElementById("cs-feed-edit-id").value = post.id;
  document.getElementById("cs-feed-subject").value = post.subject || "";
  document.getElementById("cs-feed-author").value =
    post.author || "Master Togan";
  document.getElementById("cs-feed-date").value = post.date || "";
  document.getElementById("cs-feed-content").value = post.content || "";
  document.getElementById("cs-feed-timeframe").value = post.timeframe || "";
  document.getElementById("cs-feed-cta").value = post.ctaLabel || "";
  _feedThreads = post.threads ? [...post.threads] : [];
  _csRenderThreads("cs-feed-threads", _feedThreads);
  // Switch to create tab
  const tabsEl = document.getElementById("content-section-tabs");
  tabsEl.querySelectorAll(".content-section-tab").forEach((b) => {
    b.classList.toggle(
      "active",
      b.getAttribute("data-section-tab").toLowerCase() === switchToTab,
    );
  });
  showContentSubTab("feed", switchToTab);
}

function _csFeedSave(isDraft) {
  const id = document.getElementById("cs-feed-edit-id").value;
  const data = {
    subject: document.getElementById("cs-feed-subject").value.trim(),
    author:
      document.getElementById("cs-feed-author").value.trim() || "Master Togan",
    date: document.getElementById("cs-feed-date").value.trim(),
    content: document.getElementById("cs-feed-content").value.trim(),
    timeframe: document.getElementById("cs-feed-timeframe").value.trim(),
    ctaLabel: document.getElementById("cs-feed-cta").value.trim(),
    threads: [..._feedThreads],
    draft: isDraft,
  };
  if (!data.subject) return alert("Subject is required");
  if (id) DataStore.update("posts", id, data);
  else DataStore.add("posts", data);
  _csFeedResetForm();
  // Switch to draft or manage tab
  const tabsEl = document.getElementById("content-section-tabs");
  const nextTab = isDraft ? "draft" : "manage";
  tabsEl.querySelectorAll(".content-section-tab").forEach((b) => {
    b.classList.toggle(
      "active",
      b.getAttribute("data-section-tab").toLowerCase() === nextTab,
    );
  });
  showContentSubTab("feed", nextTab);
}

document.getElementById("cs-feed-add-thread").addEventListener("click", () => {
  _csAddThreadPrompt("cs-feed-threads", _feedThreads);
});
document
  .getElementById("cs-feed-publish")
  .addEventListener("click", () => _csFeedSave(false));
document
  .getElementById("cs-feed-save-draft")
  .addEventListener("click", () => _csFeedSave(true));

// ══════════════════════════════════════════════════════
//  QUEST
// ══════════════════════════════════════════════════════

let _questCsThreads = [];

function _csQuestRefresh(tab) {
  if (tab === "view") {
    const items = DataStore.getAll("quests").filter((q) => !q.draft);
    _csRenderViewList("cs-quest-view-list", items, { icon: "❓" });
  } else if (tab === "create") {
    if (!document.getElementById("cs-quest-edit-id").value) _csQuestResetForm();
  } else if (tab === "draft") {
    const drafts = DataStore.getAll("quests").filter((q) => q.draft);
    _csRenderList("cs-quest-draft-list", drafts, {
      icon: "📝",
      actions: [
        { id: "edit", label: "Edit Draft" },
        { id: "delete", label: "Delete", cls: "danger" },
      ],
      onAction: (action, id) => {
        if (action === "delete") {
          if (!confirm("Delete?")) return;
          DataStore.remove("quests", id);
          _csQuestRefresh("draft");
        } else if (action === "edit") {
          const q = DataStore.getById("quests", id);
          if (q) _csQuestLoadEdit(q);
        }
      },
    });
  } else if (tab === "manage") {
    const live = DataStore.getAll("quests").filter((q) => !q.draft);
    _csRenderList("cs-quest-manage-list", live, {
      icon: "❓",
      actions: [
        { id: "edit", label: "Edit" },
        { id: "delete", label: "Delete", cls: "danger" },
      ],
      onAction: (action, id) => {
        if (action === "delete") {
          if (!confirm("Delete quest?")) return;
          DataStore.remove("quests", id);
          _csQuestRefresh("manage");
        } else if (action === "edit") {
          const q = DataStore.getById("quests", id);
          if (q) _csQuestLoadEdit(q);
        }
      },
    });
  }
}

function _csQuestResetForm() {
  document.getElementById("cs-quest-edit-id").value = "";
  document.getElementById("cs-quest-subject").value = "";
  document.getElementById("cs-quest-author").value = "Master Togan";
  _questCsThreads = [];
  _csRenderThreads("cs-quest-threads", _questCsThreads);
}

function _csQuestLoadEdit(quest) {
  document.getElementById("cs-quest-edit-id").value = quest.id;
  document.getElementById("cs-quest-subject").value = quest.subject || "";
  document.getElementById("cs-quest-author").value =
    quest.author || "Master Togan";
  _questCsThreads = quest.threads ? [...quest.threads] : [];
  _csRenderThreads("cs-quest-threads", _questCsThreads);
  _csSwitch("quest", "create");
}

function _csQuestSave(isDraft) {
  const id = document.getElementById("cs-quest-edit-id").value;
  const data = {
    subject: document.getElementById("cs-quest-subject").value.trim(),
    author:
      document.getElementById("cs-quest-author").value.trim() || "Master Togan",
    threads: [..._questCsThreads],
    draft: isDraft,
  };
  if (!data.subject) return alert("Question is required");
  if (id) DataStore.update("quests", id, data);
  else DataStore.add("quests", data);
  _csQuestResetForm();
  _csSwitch("quest", isDraft ? "draft" : "manage");
}

document
  .getElementById("cs-quest-add-thread")
  .addEventListener("click", () =>
    _csAddThreadPrompt("cs-quest-threads", _questCsThreads),
  );
document
  .getElementById("cs-quest-publish")
  .addEventListener("click", () => _csQuestSave(false));
document
  .getElementById("cs-quest-save-draft")
  .addEventListener("click", () => _csQuestSave(true));

// ══════════════════════════════════════════════════════
//  STORIES
// ══════════════════════════════════════════════════════

let _storiesCsThreads = [];

function _csStoriesRefresh(tab) {
  if (tab === "view") {
    _csRenderViewList(
      "cs-stories-view-list",
      DataStore.getAll("stories").filter((s) => !s.draft),
      { icon: "📖" },
    );
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
        onAction: (a, id) => {
          if (a === "delete") {
            if (!confirm("Delete?")) return;
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
        onAction: (a, id) => {
          if (a === "delete") {
            if (!confirm("Delete story?")) return;
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

function _csStoriesResetForm() {
  [
    "cs-stories-edit-id",
    "cs-stories-subject",
    "cs-stories-date",
    "cs-stories-content",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  document.getElementById("cs-stories-author").value = "Master Togan";
  _storiesCsThreads = [];
  _csRenderThreads("cs-stories-threads", _storiesCsThreads);
}

function _csStoriesLoadEdit(story) {
  document.getElementById("cs-stories-edit-id").value = story.id;
  document.getElementById("cs-stories-subject").value = story.subject || "";
  document.getElementById("cs-stories-author").value =
    story.author || "Master Togan";
  document.getElementById("cs-stories-date").value = story.date || "";
  document.getElementById("cs-stories-content").value = story.content || "";
  _storiesCsThreads = story.threads ? [...story.threads] : [];
  _csRenderThreads("cs-stories-threads", _storiesCsThreads);
  _csSwitch("stories", "create");
}

function _csStoriesSave(isDraft) {
  const id = document.getElementById("cs-stories-edit-id").value;
  const data = {
    subject: document.getElementById("cs-stories-subject").value.trim(),
    author:
      document.getElementById("cs-stories-author").value.trim() ||
      "Master Togan",
    date: document.getElementById("cs-stories-date").value.trim(),
    content: document.getElementById("cs-stories-content").value.trim(),
    threads: [..._storiesCsThreads],
    draft: isDraft,
  };
  if (!data.subject) return alert("Subject is required");
  if (id) DataStore.update("stories", id, data);
  else DataStore.add("stories", data);
  _csStoriesResetForm();
  _csSwitch("stories", isDraft ? "draft" : "manage");
}

document
  .getElementById("cs-stories-add-thread")
  .addEventListener("click", () =>
    _csAddThreadPrompt("cs-stories-threads", _storiesCsThreads),
  );
document
  .getElementById("cs-stories-publish")
  .addEventListener("click", () => _csStoriesSave(false));
document
  .getElementById("cs-stories-save-draft")
  .addEventListener("click", () => _csStoriesSave(true));

// ══════════════════════════════════════════════════════
//  UPDATES — uses "recommends" collection
// ══════════════════════════════════════════════════════

let _updatesCsThreads = [];

function _csUpdatesRefresh(tab) {
  if (tab === "view") {
    _csRenderViewList(
      "cs-updates-view-list",
      DataStore.getAll("recommends").filter((r) => !r.draft),
      { icon: "🔄" },
    );
  } else if (tab === "create") {
    if (!document.getElementById("cs-updates-edit-id").value)
      _csUpdatesResetForm();
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
        onAction: (a, id) => {
          if (a === "delete") {
            if (!confirm("Delete?")) return;
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
        onAction: (a, id) => {
          if (a === "delete") {
            if (!confirm("Delete update?")) return;
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

function _csUpdatesResetForm() {
  [
    "cs-updates-edit-id",
    "cs-updates-subject",
    "cs-updates-date",
    "cs-updates-content",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  document.getElementById("cs-updates-author").value = "Master Togan";
  _updatesCsThreads = [];
  _csRenderThreads("cs-updates-threads", _updatesCsThreads);
}

function _csUpdatesLoadEdit(item) {
  document.getElementById("cs-updates-edit-id").value = item.id;
  document.getElementById("cs-updates-subject").value = item.subject || "";
  document.getElementById("cs-updates-author").value =
    item.author || "Master Togan";
  document.getElementById("cs-updates-date").value = item.date || "";
  document.getElementById("cs-updates-content").value = item.content || "";
  _updatesCsThreads = item.threads ? [...item.threads] : [];
  _csRenderThreads("cs-updates-threads", _updatesCsThreads);
  _csSwitch("updates", "create");
}

function _csUpdatesSave(isDraft) {
  const id = document.getElementById("cs-updates-edit-id").value;
  const data = {
    subject: document.getElementById("cs-updates-subject").value.trim(),
    author:
      document.getElementById("cs-updates-author").value.trim() ||
      "Master Togan",
    date: document.getElementById("cs-updates-date").value.trim(),
    content: document.getElementById("cs-updates-content").value.trim(),
    threads: [..._updatesCsThreads],
    draft: isDraft,
  };
  if (!data.subject) return alert("Subject is required");
  if (id) DataStore.update("recommends", id, data);
  else DataStore.add("recommends", data);
  _csUpdatesResetForm();
  _csSwitch("updates", isDraft ? "draft" : "manage");
}

document
  .getElementById("cs-updates-add-thread")
  .addEventListener("click", () =>
    _csAddThreadPrompt("cs-updates-threads", _updatesCsThreads),
  );
document
  .getElementById("cs-updates-publish")
  .addEventListener("click", () => _csUpdatesSave(false));
document
  .getElementById("cs-updates-save-draft")
  .addEventListener("click", () => _csUpdatesSave(true));

// ══════════════════════════════════════════════════════
//  POLL
// ══════════════════════════════════════════════════════

function _csPollRefresh(tab) {
  if (tab === "view") {
    const polls = DataStore.getAll("polls").filter((p) => !p.draft);
    const el = document.getElementById("cs-poll-view-list");
    if (!polls.length) {
      el.innerHTML =
        '<div class="cs-empty"><div class="cs-empty-icon">📊</div><div class="cs-empty-text">No polls yet</div></div>';
      return;
    }
    el.innerHTML = polls
      .map(
        (p) => `
      <div class="cs-view-card">
        <div class="cs-view-card-header"><div class="cs-view-card-title">${p.question || "Untitled"}</div><div class="cs-view-card-time">${_csDateLabel(p.createdAt)}</div></div>
        <div class="cs-view-card-body">${[p.optionA, p.optionB, p.optionC, p.optionD].filter(Boolean).join(" · ")}</div>
      </div>`,
      )
      .join("");
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
        onAction: (a, id) => {
          if (a === "delete") {
            if (!confirm("Delete?")) return;
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
    _csRenderList(
      "cs-poll-manage-list",
      DataStore.getAll("polls").filter((p) => !p.draft),
      {
        icon: "📊",
        actions: [
          { id: "edit", label: "Edit" },
          { id: "delete", label: "Delete", cls: "danger" },
        ],
        onAction: (a, id) => {
          if (a === "delete") {
            if (!confirm("Delete poll?")) return;
            DataStore.remove("polls", id);
            _csPollRefresh("manage");
          } else {
            const p = DataStore.getById("polls", id);
            if (p) _csPollLoadEdit(p);
          }
        },
      },
    );
  }
}

function _csPollResetForm() {
  [
    "cs-poll-edit-id",
    "cs-poll-question",
    "cs-poll-a",
    "cs-poll-b",
    "cs-poll-c",
    "cs-poll-d",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
}

function _csPollLoadEdit(poll) {
  document.getElementById("cs-poll-edit-id").value = poll.id;
  document.getElementById("cs-poll-question").value = poll.question || "";
  document.getElementById("cs-poll-a").value = poll.optionA || "";
  document.getElementById("cs-poll-b").value = poll.optionB || "";
  document.getElementById("cs-poll-c").value = poll.optionC || "";
  document.getElementById("cs-poll-d").value = poll.optionD || "";
  _csSwitch("poll", "create");
}

function _csPollSave(isDraft) {
  const id = document.getElementById("cs-poll-edit-id").value;
  const data = {
    question: document.getElementById("cs-poll-question").value.trim(),
    optionA: document.getElementById("cs-poll-a").value.trim(),
    optionB: document.getElementById("cs-poll-b").value.trim(),
    optionC: document.getElementById("cs-poll-c").value.trim(),
    optionD: document.getElementById("cs-poll-d").value.trim(),
    draft: isDraft,
  };
  if (!data.question || !data.optionA || !data.optionB)
    return alert("Question and at least 2 options are required");
  if (id) DataStore.update("polls", id, data);
  else DataStore.add("polls", data);
  _csPollResetForm();
  _csSwitch("poll", isDraft ? "draft" : "manage");
}

document
  .getElementById("cs-poll-publish")
  .addEventListener("click", () => _csPollSave(false));
document
  .getElementById("cs-poll-save-draft")
  .addEventListener("click", () => _csPollSave(true));

// ══════════════════════════════════════════════════════
//  NOTIFICATIONS
// ══════════════════════════════════════════════════════

function _csNotiRefresh(tab) {
  if (tab === "view") {
    _csRenderViewList(
      "cs-notifications-view-list",
      DataStore.getAll("notifications").filter((n) => !n.draft),
      { icon: "🔔" },
    );
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
        onAction: (a, id) => {
          if (a === "delete") {
            if (!confirm("Delete?")) return;
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
        onAction: (a, id) => {
          if (a === "delete") {
            if (!confirm("Delete notification?")) return;
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

function _csNotiResetForm() {
  ["cs-noti-edit-id", "cs-noti-title", "cs-noti-body", "cs-noti-link"].forEach(
    (id) => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    },
  );
}

function _csNotiLoadEdit(noti) {
  document.getElementById("cs-noti-edit-id").value = noti.id;
  document.getElementById("cs-noti-title").value = noti.title || "";
  document.getElementById("cs-noti-body").value = noti.body || "";
  document.getElementById("cs-noti-link").value = noti.link || "";
  _csSwitch("notifications", "create");
}

function _csNotiSave(isDraft) {
  const id = document.getElementById("cs-noti-edit-id").value;
  const data = {
    title: document.getElementById("cs-noti-title").value.trim(),
    body: document.getElementById("cs-noti-body").value.trim(),
    link: document.getElementById("cs-noti-link").value.trim(),
    draft: isDraft,
  };
  if (!data.title) return alert("Title is required");
  if (id) DataStore.update("notifications", id, data);
  else DataStore.add("notifications", data);
  _csNotiResetForm();
  _csSwitch("notifications", isDraft ? "draft" : "manage");
}

document
  .getElementById("cs-noti-publish")
  .addEventListener("click", () => _csNotiSave(false));
document
  .getElementById("cs-noti-save-draft")
  .addEventListener("click", () => _csNotiSave(true));

// ══════════════════════════════════════════════════════
//  EDIT PROFILE
// ══════════════════════════════════════════════════════

let _csAboutSections = [];
let _csMsgLimit = 5;
let _csMsgOn = true;

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
    // Ensure 4 locked sections exist
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
        <div class="cs-about-item-title">${s.title}</div>
        <div class="cs-about-item-controls">
          ${!s.locked ? `<button type="button" class="cs-about-remove" data-idx="${i}">✕</button>` : ""}
        </div>
      </div>
      <div class="cs-about-item-body">
        <textarea class="cs-field-textarea" style="min-height:70px" data-about-idx="${i}" placeholder="Write about ${s.title}...">${s.body || ""}</textarea>
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

  // Show/hide add button based on custom count
  const addBtn = document.getElementById("cs-about-add");
  if (addBtn)
    addBtn.style.display =
      _csAboutSections.filter((s) => !s.locked).length >= 6 ? "none" : "flex";
}

// Stepper
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

// About add section
document.getElementById("cs-about-add").addEventListener("click", () => {
  if (_csAboutSections.filter((s) => !s.locked).length >= 6) return;
  const title = prompt("Section title:");
  if (!title) return;
  _csAboutSections.push({ title: title.trim(), body: "", locked: false });
  _csRenderAbout();
});

// Save buttons
document
  .getElementById("cs-profile-details-save")
  .addEventListener("click", () => {
    DataStore.setProfile({
      name: document.getElementById("cs-profile-name").value.trim(),
      img: document.getElementById("cs-profile-img").value.trim(),
      price: document.getElementById("cs-profile-price").value.trim(),
      phone: document.getElementById("cs-profile-phone").value.trim(),
      email: document.getElementById("cs-profile-email").value.trim(),
    });
    alert("Details saved");
  });

document.getElementById("cs-profile-cta-save").addEventListener("click", () => {
  DataStore.setProfile({
    mentorshipUrl: document
      .getElementById("cs-profile-mentorship-url")
      .value.trim(),
    xUrl: document.getElementById("cs-profile-x-url").value.trim(),
  });
  alert("CTA saved");
});

document.getElementById("cs-profile-msg-save").addEventListener("click", () => {
  DataStore.setProfile({ msgLimit: _csMsgLimit, msgOn: _csMsgOn });
  alert("Message settings saved");
});

document
  .getElementById("cs-profile-about-save")
  .addEventListener("click", () => {
    DataStore.setProfile({ about: _csAboutSections });
    alert("About saved");
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
    // Sort by date desc
    const sorted = [...subs].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );
    el.innerHTML = sorted
      .map(
        (s) => `
      <div class="cs-sub-item">
        <div class="cs-sub-avatar">${(s.email || s.name || "?")[0].toUpperCase()}</div>
        <div class="cs-sub-info">
          <div class="cs-sub-name">${s.email || s.name || "Unknown"}</div>
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
    // A–Z breakdown
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
        <div class="cs-sub-alpha-count">${groups[k]}</div>
        <div class="cs-sub-alpha-bar"><div class="cs-sub-alpha-fill" style="width:${Math.round((groups[k] / maxVal) * 100)}%"></div></div>
      </div>`,
      )
      .join("");
  }
}

// ══════════════════════════════════════════════════════
//  HELPER: switch tab programmatically
// ══════════════════════════════════════════════════════

function _csSwitch(section, tab) {
  const tabsEl = document.getElementById("content-section-tabs");
  tabsEl.querySelectorAll(".content-section-tab").forEach((b) => {
    b.classList.toggle(
      "active",
      b.getAttribute("data-section-tab").toLowerCase() === tab,
    );
  });
  showContentSubTab(section, tab);
}
