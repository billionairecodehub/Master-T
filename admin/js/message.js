// admin/js/message.js — Message page logic

let _msgOpenId = null;

// ── Called by showAdminPage("message") in index.js ───────────────
function refreshMessage() {
  _msgUpdateMeta(document.getElementById("msg-meta"));
  _msgUpdateMeta(document.getElementById("msg-detail-meta"));
  _msgRenderList();
}

// ── Helpers ──────────────────────────────────────────
function _msgUpdateMeta(el) {
  if (!el) return;
  const msgs = DataStore.getAll("messages");
  const unread = msgs.filter((m) => m.status === "unopened").length;
  el.textContent = `${msgs.length} Message${msgs.length !== 1 ? "s" : ""} ~ ${unread} Unread`;
}

function _msgDateLabel(iso) {
  const d = new Date(iso);
  const day = d.getDate().toString().padStart(2, "0");
  const month = d.toLocaleString("en-US", { month: "short" });
  const yr = d.getFullYear().toString().slice(-2);
  return `${day} ${month} ~ ${yr}`;
}

function _msgStatusLabel(status) {
  if (status === "replied") return "Opened ~ Replied";
  if (status === "opened") return "Opened ~ No Replies Yet";
  return "Not yet Open ~ No Replies Yet";
}

function _msgGroupByDate(msgs) {
  const groups = {};
  msgs.forEach((m) => {
    const label = _msgDateLabel(m.createdAt);
    if (!groups[label]) groups[label] = [];
    groups[label].push(m);
  });
  return groups;
}

// ── List rendering ─────────────────────────────────────
function _msgRenderList() {
  const board = document.getElementById("msg-board");
  if (!board) return;

  const msgs = DataStore.getAll("messages").sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );

  if (!msgs.length) {
    board.innerHTML = `
      <div class="msg-empty">
        <div class="msg-empty-icon">💬</div>
        <div class="msg-empty-text">No messages yet</div>
      </div>`;
    return;
  }

  const groups = _msgGroupByDate(msgs);
  board.innerHTML = Object.entries(groups)
    .map(
      ([date, items]) => `
      <div class="msg-group">
        <div class="msg-date-header">${date}</div>
        <div class="msg-group-cards">
          ${items
            .map(
              (m) => `
            <div class="msg-card ${m.status === "unopened" ? "unread" : ""}" data-msg-id="${m.id}">
              <div class="msg-card-subject">${_msgSenderName(m)} Sent You A Message</div>
              <div class="msg-card-status">${_msgStatusLabel(m.status)}</div>
            </div>`,
            )
            .join("")}
        </div>
      </div>`,
    )
    .join("");

  board.querySelectorAll(".msg-card").forEach((card) => {
    card.addEventListener("click", () =>
      _msgOpenMessage(card.getAttribute("data-msg-id")),
    );
  });
}

function _msgSenderName(m) {
  return m.from || m.name || m.sender || "Someone";
}

// ── Open detail ────────────────────────────────────────
function _msgOpenMessage(id) {
  const msg = DataStore.getById("messages", id);
  if (!msg) return;
  _msgOpenId = id;

  // Mark opened
  if (msg.status === "unopened") {
    DataStore.update("messages", id, { status: "opened" });
  }

  // Re-fetch after update
  const updated = DataStore.getById("messages", id);

  document.getElementById("msg-detail-date").textContent = _msgDateLabel(
    msg.createdAt,
  );

  const senderEl = document.getElementById("msg-detail-sender");
  if (senderEl) {
    senderEl.innerHTML = `
      <div class="msg-card-subject">${_msgSenderName(msg)} Sent You A Message</div>
      <div class="msg-card-status">${_msgStatusLabel(updated.status)}</div>
      ${msg.email ? `<div class="msg-card-email">${msg.email}</div>` : ""}`;
  }

  const bodyEl = document.getElementById("msg-body-text");
  if (bodyEl) bodyEl.textContent = msg.body || msg.message || "";

  const replyEl = document.getElementById("msg-response-input");
  if (replyEl) replyEl.value = msg.reply || "";

  // Update meta (unread count changed)
  _msgUpdateMeta(document.getElementById("msg-meta"));
  _msgUpdateMeta(document.getElementById("msg-detail-meta"));

  // Switch views
  document.getElementById("msg-list-view").style.display = "none";
  document.getElementById("msg-detail-view").style.display = "flex";
}

// ── Close detail ──────────────────────────────────────
function _msgCloseDetail() {
  _msgOpenId = null;
  document.getElementById("msg-detail-view").style.display = "none";
  document.getElementById("msg-list-view").style.display = "flex";
  _msgRenderList();
}

// ── Event listeners ────────────────────────────────────

document
  .getElementById("msg-back-btn")
  .addEventListener("click", _msgCloseDetail);

document.getElementById("msg-reply-btn").addEventListener("click", () => {
  const reply = (
    document.getElementById("msg-response-input")?.value || ""
  ).trim();
  if (!reply) {
    alert("Please write a response first");
    return;
  }
  if (!_msgOpenId) return;
  if (!confirm("Send this reply?")) return;

  DataStore.update("messages", _msgOpenId, { reply, status: "replied" });
  alert("Reply sent");
  _msgCloseDetail();
});
