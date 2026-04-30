// admin/js/cs.js — Content Section Pages logic
// Handles all 9 content types + EditProfile + Subscribers

// ── Shared helpers ────────────────────────────────────

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
  el.innerHTML = items
    .map((item) => {
      const actions = (opts.actions || [])
        .map(
          (a) =>
            `<button type="button" class="cs-card-action ${a.cls || ""}" data-item-id="${item.id}" data-action="${a.id}">${a.label}</button>`,
        )
        .join("");
      return `<div class="cs-card" data-item-id="${item.id}">
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
      opts.onAction &&
        opts.onAction(
          btn.getAttribute("data-action"),
          btn.getAttribute("data-item-id"),
        );
    });
  });
}

function _csRenderViewList(containerId, items, opts = {}) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!items || !items.length) {
    el.innerHTML = `<div class="cs-empty"><div class="cs-empty-icon">${opts.icon || "📄"}</div><div class="cs-empty-text">No content yet</div></div>`;
    return;
  }
  el.innerHTML = items
    .map(
      (item) => `<div class="cs-view-card">
    <div class="cs-view-card-header">
      <div class="cs-view-card-title">${item.subject || item.question || item.title || item.name || "Untitled"}</div>
      <div class="cs-view-card-time">${_csDateLabel(item.createdAt)}</div>
    </div>
    ${item.content || item.body ? `<div class="cs-view-card-body">${item.content || item.body || ""}</div>` : ""}
  </div>`,
    )
    .join("");
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
    const body = (
      document.getElementById(`cs-feed-t${i}-body`)?.value || ""
    ).trim();
    if (title || body) threads.push({ title, body });
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
  const items = DataStore.getAll(collection).filter((i) => !i.draft);
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
    post.body || post.content || "";
  const threads = post.threads || [];
  for (let i = 1; i <= 10; i++) {
    const t = threads[i - 1] || {};
    const titleEl = document.getElementById(`cs-feed-t${i}-title`);
    const bodyEl = document.getElementById(`cs-feed-t${i}-body`);
    if (titleEl) titleEl.value = t.title || "";
    if (bodyEl) bodyEl.value = t.body || "";
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

function _csFeedSave(isDraft) {
  const msg = isDraft
    ? "Save this feed as draft?"
    : "Send this feed to all subscribers?";
  if (!confirm(msg)) return;
  const id = document.getElementById("cs-feed-edit-id").value;
  const data = {
    subject: document.getElementById("cs-feed-subject").value.trim(),
    body: document.getElementById("cs-feed-body").value.trim(),
    threads: _csFeedGetThreads(),
    ctaType: document.getElementById("cs-feed-cta-type-val")?.value || "",
    ctaItemId: document.getElementById("cs-feed-cta-item-id")?.value || "",
    ctaLabel:
      document.getElementById("cs-feed-cta-display")?.value.trim() || "",
    draft: isDraft,
  };
  if (!data.subject) {
    alert("Subject is required");
    return;
  }
  if (id) DataStore.update("posts", id, data);
  else DataStore.add("posts", { ...data, createdAt: new Date().toISOString() });
  _csFeedResetForm();
  _csSwitch("feed", isDraft ? "draft" : "manage");
}

function _csFeedRefresh(tab) {
  if (tab === "view") {
    _csRenderViewList(
      "cs-feed-view-list",
      DataStore.getAll("posts").filter((p) => !p.draft),
      { icon: "✏️" },
    );
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
        onAction: (a, id) => {
          if (a === "delete") {
            if (!confirm("Delete draft?")) return;
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
        onAction: (a, id) => {
          if (a === "delete") {
            if (!confirm("Delete post?")) return;
            DataStore.remove("posts", id);
            _csFeedRefresh("manage");
          } else {
            const p = DataStore.getById("posts", id);
            if (p) _csFeedLoadEdit(p);
          }
        },
      },
    );
  }
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
document.getElementById("cs-feed-cancel").addEventListener("click", () => {
  if (!confirm("Cancel and clear the feed form?")) return;
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
    const body = (
      document.getElementById(`cs-quest-t${i}-body`)?.value || ""
    ).trim();
    if (title || body) threads.push({ title, body });
  }
  return threads;
}

function _csQuestResetForm() {
  document.getElementById("cs-quest-edit-id").value = "";
  document.getElementById("cs-quest-subject").value = "";
  for (let i = 1; i <= 10; i++) {
    const t = document.getElementById(`cs-quest-t${i}-title`);
    const b = document.getElementById(`cs-quest-t${i}-body`);
    if (t) t.value = "";
    if (b) b.value = "";
  }
}

function _csQuestLoadEdit(quest) {
  document.getElementById("cs-quest-edit-id").value = quest.id;
  document.getElementById("cs-quest-subject").value = quest.subject || "";
  const threads = quest.threads || [];
  for (let i = 1; i <= 10; i++) {
    const t = threads[i - 1] || {};
    const titleEl = document.getElementById(`cs-quest-t${i}-title`);
    const bodyEl = document.getElementById(`cs-quest-t${i}-body`);
    if (titleEl) titleEl.value = t.title || "";
    if (bodyEl) bodyEl.value = t.body || "";
  }
  _csSwitch("quest", "create");
}

function _csQuestSave(isDraft) {
  const msg = isDraft ? "Save this quest as draft?" : "Send this quest?";
  if (!confirm(msg)) return;
  const id = document.getElementById("cs-quest-edit-id").value;
  const data = {
    subject: document.getElementById("cs-quest-subject").value.trim(),
    threads: _csQuestGetThreads(),
    draft: isDraft,
  };
  if (!data.subject) {
    alert("Question subject is required");
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
    _csRenderViewList(
      "cs-quest-view-list",
      DataStore.getAll("quests").filter((q) => !q.draft),
      { icon: "❓" },
    );
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
        onAction: (a, id) => {
          if (a === "delete") {
            if (!confirm("Delete?")) return;
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
        onAction: (a, id) => {
          if (a === "delete") {
            if (!confirm("Delete quest?")) return;
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
document.getElementById("cs-quest-cancel").addEventListener("click", () => {
  if (!confirm("Cancel and clear the quest form?")) return;
  _csQuestResetForm();
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
  document.getElementById("cs-stories-subject").value =
    story.subject || story.title || "";
  document.getElementById("cs-stories-body").value =
    story.body || story.content || "";
  const paras = story.paragraphs || [];
  for (let i = 1; i <= 5; i++) {
    const p = document.getElementById(`cs-stories-para-${i}`);
    if (p) p.value = paras[i - 1] || "";
  }
  const lessons = story.lessons || [];
  for (let i = 1; i <= 5; i++) {
    const l = document.getElementById(`cs-stories-lesson-${i}`);
    if (l) l.value = lessons[i - 1] || "";
  }
  _csSwitch("stories", "create");
}

function _csStoriesSave(isDraft) {
  const msg = isDraft ? "Save this story as draft?" : "Send this story?";
  if (!confirm(msg)) return;
  const id = document.getElementById("cs-stories-edit-id").value;
  const data = {
    subject: document.getElementById("cs-stories-subject").value.trim(),
    body: document.getElementById("cs-stories-body").value.trim(),
    paragraphs: _csStoriesGetParagraphs(),
    lessons: _csStoriesGetLessons(),
    draft: isDraft,
  };
  if (!data.subject) {
    alert("Story title is required");
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

document
  .getElementById("cs-stories-send")
  .addEventListener("click", () => _csStoriesSave(false));
document
  .getElementById("cs-stories-draft-btn")
  .addEventListener("click", () => _csStoriesSave(true));
document.getElementById("cs-stories-cancel").addEventListener("click", () => {
  if (!confirm("Cancel and clear the story form?")) return;
  _csStoriesResetForm();
});

// ══════════════════════════════════════════════════════
//  UPDATES — uses "recommends" collection
// ══════════════════════════════════════════════════════

function _csUpdatesGetContents() {
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
}

function _csUpdatesLoadEdit(item) {
  document.getElementById("cs-updates-edit-id").value = item.id;
  document.getElementById("cs-updates-subject").value = item.subject || "";
  const contents = item.contents || [item.content || ""];
  for (let i = 1; i <= 5; i++) {
    const c = document.getElementById(`cs-updates-content-${i}`);
    if (c) c.value = contents[i - 1] || "";
  }
  const ctaTitle = document.getElementById("cs-updates-cta-title");
  const ctaUrl = document.getElementById("cs-updates-cta-url");
  if (ctaTitle) ctaTitle.value = item.ctaTitle || "";
  if (ctaUrl) ctaUrl.value = item.ctaUrl || "";
  _csSwitch("updates", "create");
}

function _csUpdatesSave(isDraft) {
  const msg = isDraft ? "Save this update as draft?" : "Send this update?";
  if (!confirm(msg)) return;
  const id = document.getElementById("cs-updates-edit-id").value;
  const data = {
    subject: document.getElementById("cs-updates-subject").value.trim(),
    contents: _csUpdatesGetContents(),
    ctaTitle:
      document.getElementById("cs-updates-cta-title")?.value.trim() || "",
    ctaUrl: document.getElementById("cs-updates-cta-url")?.value.trim() || "",
    draft: isDraft,
  };
  if (!data.subject) {
    alert("Updates title is required");
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

document
  .getElementById("cs-updates-send")
  .addEventListener("click", () => _csUpdatesSave(false));
document
  .getElementById("cs-updates-draft-btn")
  .addEventListener("click", () => _csUpdatesSave(true));
document.getElementById("cs-updates-cancel").addEventListener("click", () => {
  if (!confirm("Cancel and clear the updates form?")) return;
  _csUpdatesResetForm();
});

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
}

function _csPollLoadEdit(poll) {
  document.getElementById("cs-poll-edit-id").value = poll.id;
  document.getElementById("cs-poll-question").value = poll.question || "";
  const answers = poll.answers || [
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

function _csPollSave(isDraft) {
  const msg = isDraft ? "Save this poll as draft?" : "Create this poll?";
  if (!confirm(msg)) return;
  const id = document.getElementById("cs-poll-edit-id").value;
  const answers = [];
  for (let i = 1; i <= 3; i++) {
    answers.push(
      (document.getElementById(`cs-poll-answer-${i}`)?.value || "").trim(),
    );
  }
  const data = {
    question: document.getElementById("cs-poll-question").value.trim(),
    answers,
    optionA: answers[0],
    optionB: answers[1],
    optionC: answers[2],
    draft: isDraft,
  };
  if (!data.question || !data.optionA || !data.optionB) {
    alert("Question and at least 2 answers are required");
    return;
  }
  if (id) DataStore.update("polls", id, data);
  else DataStore.add("polls", { ...data, createdAt: new Date().toISOString() });
  _csPollResetForm();
  _csSwitch("poll", isDraft ? "draft" : "manage");
}

function _csPollRefresh(tab) {
  if (tab === "view") {
    const polls = DataStore.getAll("polls").filter((p) => !p.draft);
    const el = document.getElementById("cs-poll-view-list");
    if (!el) return;
    if (!polls.length) {
      el.innerHTML =
        '<div class="cs-empty"><div class="cs-empty-icon">📊</div><div class="cs-empty-text">No polls yet</div></div>';
      return;
    }
    el.innerHTML = polls
      .map(
        (p) => `<div class="cs-view-card">
      <div class="cs-view-card-header"><div class="cs-view-card-title">${p.question || "Untitled"}</div><div class="cs-view-card-time">${_csDateLabel(p.createdAt)}</div></div>
      <div class="cs-view-card-body">${(p.answers || [p.optionA, p.optionB, p.optionC]).filter(Boolean).join(" · ")}</div>
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

document
  .getElementById("cs-poll-send")
  .addEventListener("click", () => _csPollSave(false));
document
  .getElementById("cs-poll-draft-btn")
  .addEventListener("click", () => _csPollSave(true));
document.getElementById("cs-poll-cancel").addEventListener("click", () => {
  if (!confirm("Cancel and clear the poll form?")) return;
  _csPollResetForm();
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
  document.getElementById("cs-noti-body").value = noti.body || "";
  _csSwitch("notifications", "create");
}

function _csNotiSave(isDraft) {
  const msg = isDraft
    ? "Save this notification as draft?"
    : "Send this notification?";
  if (!confirm(msg)) return;
  const id = document.getElementById("cs-noti-edit-id").value;
  const data = {
    title: document.getElementById("cs-noti-title").value.trim(),
    body: document.getElementById("cs-noti-body").value.trim(),
    draft: isDraft,
  };
  if (!data.title) {
    alert("Title is required");
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

document
  .getElementById("cs-noti-send")
  .addEventListener("click", () => _csNotiSave(false));
document
  .getElementById("cs-noti-draft-btn")
  .addEventListener("click", () => _csNotiSave(true));
document.getElementById("cs-noti-cancel").addEventListener("click", () => {
  if (!confirm("Cancel and clear the notification form?")) return;
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
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
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
  _csSwitch("apps", "create");
}

function _csAppsSave(isDraft) {
  const msg = isDraft ? "Save this app as draft?" : "Publish this app?";
  if (!confirm(msg)) return;
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
    draft: isDraft,
  };
  if (!data.name) {
    alert("App name is required");
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
        onAction: (a, id) => {
          if (a === "delete") {
            if (!confirm("Delete draft?")) return;
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
          { id: "delete", label: "Delete", cls: "danger" },
        ],
        onAction: (a, id) => {
          if (a === "delete") {
            if (!confirm("Delete app?")) return;
            DataStore.remove("apps", id);
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
document.getElementById("cs-apps-cancel").addEventListener("click", () => {
  if (!confirm("Cancel and clear the app form?")) return;
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
  }
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
  const kps = book.keyPoints || [];
  for (let i = 1; i <= 5; i++) {
    const el = document.getElementById(`cs-books-kp-${i}`);
    if (el) el.value = kps[i - 1] || "";
  }
  const details = book.details || book.platforms || [];
  for (let i = 1; i <= 3; i++) {
    const el = document.getElementById(`cs-books-detail-${i}`);
    if (el) el.value = details[i - 1] || "";
  }
  _csSwitch("books", "create");
}

function _csBooksSave(isDraft) {
  const msg = isDraft ? "Save this book as draft?" : "Publish this book?";
  if (!confirm(msg)) return;
  const id = document.getElementById("cs-books-edit-id").value;
  const keyPoints = [];
  for (let i = 1; i <= 5; i++) {
    const v = (document.getElementById(`cs-books-kp-${i}`)?.value || "").trim();
    if (v) keyPoints.push(v);
  }
  const details = [];
  for (let i = 1; i <= 3; i++) {
    details.push(
      (document.getElementById(`cs-books-detail-${i}`)?.value || "").trim(),
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
    keyPoints,
    details,
    draft: isDraft,
  };
  if (!data.name) {
    alert("Book name is required");
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
        onAction: (a, id) => {
          if (a === "delete") {
            if (!confirm("Delete draft?")) return;
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
          { id: "delete", label: "Delete", cls: "danger" },
        ],
        onAction: (a, id) => {
          if (a === "delete") {
            if (!confirm("Delete book?")) return;
            DataStore.remove("books", id);
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
document.getElementById("cs-books-cancel").addEventListener("click", () => {
  if (!confirm("Cancel and clear the book form?")) return;
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
  const newCatRow = document.getElementById("cs-circle-new-cat-row");
  if (newCatRow) newCatRow.style.display = "none";
}

function _csCirclePopulateCategories() {
  const sel = document.getElementById("cs-circle-category");
  if (!sel) return;
  const circles = DataStore.getAll("circles");
  const cats = [...new Set(circles.map((c) => c.category).filter(Boolean))];
  sel.innerHTML =
    '<option value="">Select A Category</option>' +
    cats.map((c) => `<option value="${c}">${c}</option>`).join("") +
    '<option value="__new__">+ Create A New Category</option>';
}

function _csCircleLoadEdit(circle) {
  document.getElementById("cs-circle-edit-id").value = circle.id;
  document.getElementById("cs-circle-name").value = circle.name || "";
  document.getElementById("cs-circle-platform").value = circle.platform || "";
  document.getElementById("cs-circle-about").value = circle.about || "";
  document.getElementById("cs-circle-icon").value = circle.img || "";
  const feats = circle.features || [];
  for (let i = 1; i <= 3; i++) {
    const f = document.getElementById(`cs-circle-feat-${i}`);
    if (f) f.value = feats[i - 1] || "";
  }
  _csCirclePopulateCategories();
  const sel = document.getElementById("cs-circle-category");
  if (sel && circle.category) sel.value = circle.category;
  _csSwitch("circle", "create");
}

function _csCircleSave(isDraft) {
  const msg = isDraft ? "Save this circle as draft?" : "Add this circle?";
  if (!confirm(msg)) return;
  const id = document.getElementById("cs-circle-edit-id").value;
  let category = document.getElementById("cs-circle-category")?.value || "";
  if (category === "__new__") {
    category = (
      document.getElementById("cs-circle-new-cat")?.value || ""
    ).trim();
    if (!category) {
      alert("Please enter a category name");
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
    draft: isDraft,
  };
  if (!data.name) {
    alert("Circle name is required");
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
        onAction: (a, id) => {
          if (a === "delete") {
            if (!confirm("Delete draft?")) return;
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
        onAction: (a, id) => {
          if (a === "delete") {
            if (!confirm("Delete circle?")) return;
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

document
  .getElementById("cs-circle-category")
  ?.addEventListener("change", () => {
    const val = document.getElementById("cs-circle-category")?.value;
    const newCatRow = document.getElementById("cs-circle-new-cat-row");
    if (newCatRow)
      newCatRow.style.display = val === "__new__" ? "block" : "none";
  });

document
  .getElementById("cs-circle-send")
  .addEventListener("click", () => _csCircleSave(false));
document
  .getElementById("cs-circle-draft-btn")
  .addEventListener("click", () => _csCircleSave(true));
document.getElementById("cs-circle-cancel").addEventListener("click", () => {
  if (!confirm("Cancel and clear the circle form?")) return;
  _csCircleResetForm();
});

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
  const addBtn = document.getElementById("cs-about-add");
  if (addBtn)
    addBtn.style.display =
      _csAboutSections.filter((s) => !s.locked).length >= 6 ? "none" : "flex";
}

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
document.getElementById("cs-about-add").addEventListener("click", () => {
  if (_csAboutSections.filter((s) => !s.locked).length >= 6) return;
  const title = prompt("Section title:");
  if (!title) return;
  _csAboutSections.push({ title: title.trim(), body: "", locked: false });
  _csRenderAbout();
});

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
