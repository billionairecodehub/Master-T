// admin/js/message.js — Message page logic

let _msgOpenId = null;
let _msgSaveState = "idle"; // "idle" | "saved"
let _msgReplyState = "idle"; // "idle" | "replied"
let _msgLockedValue = ""; // textarea value at last save/reply

function _msgResetButtons() {
  _msgSaveState = "idle";
  _msgReplyState = "idle";
  const s = document.getElementById("msg-save-btn");
  const r = document.getElementById("msg-reply-btn");
  if (s) {
    s.textContent = "Save";
    s.disabled = false;
  }
  if (r) {
    r.textContent = "Reply";
    r.disabled = false;
  }
}

function _msgLockButtons(reply, includeReply) {
  _msgSaveState = "saved";
  if (includeReply) _msgReplyState = "replied";
  _msgLockedValue = reply;
  const s = document.getElementById("msg-save-btn");
  const r = document.getElementById("msg-reply-btn");
  if (s) {
    s.textContent = "Saved";
    s.disabled = true;
  }
  if (r && includeReply) {
    r.textContent = "Replied";
    r.disabled = true;
  }
}

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

    // Long-press (600ms) to delete a message
    let _lpt = null;
    const _lpStart = () => {
      _lpt = setTimeout(async () => {
        _lpt = null;
        const msgId = card.getAttribute("data-msg-id");
        if (!msgId) return;
        if (
          !(await window.UMessageModal.confirm(
            "Delete this message?",
            "Confirm Delete",
          ))
        )
          return;
        DataStore.remove("messages", msgId);
        _msgRenderList();
        _msgUpdateMeta(document.getElementById("msg-meta"));
      }, 600);
    };
    const _lpCancel = () => {
      if (_lpt) {
        clearTimeout(_lpt);
        _lpt = null;
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

  const titleEl = document.getElementById("msg-body-title");
  if (titleEl) {
    titleEl.textContent = msg.title || "";
    titleEl.style.display = msg.title ? "block" : "none";
  }

  const replyEl = document.getElementById("msg-response-input");
  if (replyEl) replyEl.value = msg.reply || "";

  // Init button states based on message status
  const prevReply = msg.reply || "";
  if (prevReply && msg.status === "replied") {
    _msgSaveState = "saved";
    _msgReplyState = "replied";
    _msgLockedValue = prevReply;
    const s = document.getElementById("msg-save-btn");
    const r = document.getElementById("msg-reply-btn");
    if (s) {
      s.textContent = "Saved";
      s.disabled = true;
    }
    if (r) {
      r.textContent = "Replied";
      r.disabled = true;
    }
  } else {
    _msgResetButtons();
  }

  // Update meta (unread count changed)
  _msgUpdateMeta(document.getElementById("msg-meta"));
  _msgUpdateMeta(document.getElementById("msg-detail-meta"));

  // Long-press the sender card in detail view to delete this message
  if (senderEl) {
    let _dlpt = null;
    const _dlpStart = () => {
      _dlpt = setTimeout(async () => {
        _dlpt = null;
        if (!_msgOpenId) return;
        if (
          !(await window.UMessageModal.confirm(
            "Delete this message?",
            "Confirm Delete",
          ))
        )
          return;
        DataStore.remove("messages", _msgOpenId);
        _msgCloseDetail();
      }, 600);
    };
    const _dlpCancel = () => {
      if (_dlpt) {
        clearTimeout(_dlpt);
        _dlpt = null;
      }
    };
    senderEl.addEventListener("touchstart", _dlpStart, { passive: true });
    senderEl.addEventListener("touchend", _dlpCancel);
    senderEl.addEventListener("touchcancel", _dlpCancel);
    senderEl.addEventListener("mousedown", _dlpStart);
    senderEl.addEventListener("mouseup", _dlpCancel);
    senderEl.addEventListener("mouseleave", _dlpCancel);
  }

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

// Reset buttons when textarea content changes
document.getElementById("msg-response-input").addEventListener("input", () => {
  if (_msgSaveState !== "idle" || _msgReplyState !== "idle") {
    const cur = document.getElementById("msg-response-input")?.value || "";
    if (cur !== _msgLockedValue) _msgResetButtons();
  }
});

// ── Save response ─────────────────────────────────────
document.getElementById("msg-save-btn").addEventListener("click", async () => {
  const reply = (
    document.getElementById("msg-response-input")?.value || ""
  ).trim();
  if (!reply) {
    await window.UMessageModal.error(
      "Please write a response first",
      "Validation",
    );
    return;
  }
  if (!_msgOpenId) return;

  DataStore.update("messages", _msgOpenId, { reply, status: "replied" });

  const senderEl = document.getElementById("msg-detail-sender");
  const msg = DataStore.getById("messages", _msgOpenId);
  if (senderEl && msg) {
    senderEl.innerHTML = `
      <div class="msg-card-subject">${_msgSenderName(msg)} Sent You A Message</div>
      <div class="msg-card-status">${_msgStatusLabel("replied")}</div>
      ${msg.email ? `<div class="msg-card-email">${msg.email}</div>` : ""}`;
  }
  _msgUpdateMeta(document.getElementById("msg-meta"));
  _msgUpdateMeta(document.getElementById("msg-detail-meta"));

  _msgLockButtons(reply, false);
  await window.UMessageModal.success("Response saved", "Saved");
});

// ── Reply via EmailJS ──────────────────────────────────
document.getElementById("msg-reply-btn").addEventListener("click", async () => {
  const reply = (
    document.getElementById("msg-response-input")?.value || ""
  ).trim();
  if (!reply) {
    await window.UMessageModal.error(
      "Please write a response first",
      "Validation",
    );
    return;
  }
  if (!_msgOpenId) return;

  const msg = DataStore.getById("messages", _msgOpenId);
  if (!msg) return;

  const toEmail = (msg.email || "").trim();
  if (!toEmail) {
    await window.UMessageModal.error(
      "This message has no email address to reply to.",
      "Cannot Reply",
    );
    return;
  }

  const profile = DataStore.getProfile();
  const adminName = profile.name || "Master Togan";
  const adminEmail = (profile.email || "").trim();

  try {
    await emailjs.send("service_v3anekc", "template_hq8ojb4", {
      to_email: toEmail,
      name: adminName,
      email: adminEmail,
      subject: msg.title || "Re: Your Message",
      message: reply,
    });

    DataStore.update("messages", _msgOpenId, { reply, status: "replied" });

    _msgUpdateMeta(document.getElementById("msg-meta"));
    _msgUpdateMeta(document.getElementById("msg-detail-meta"));

    const senderEl = document.getElementById("msg-detail-sender");
    const updated = DataStore.getById("messages", _msgOpenId);
    if (senderEl && updated) {
      senderEl.innerHTML = `
        <div class="msg-card-subject">${_msgSenderName(updated)} Sent You A Message</div>
        <div class="msg-card-status">${_msgStatusLabel("replied")}</div>
        ${updated.email ? `<div class="msg-card-email">${updated.email}</div>` : ""}`;
    }

    _msgLockButtons(reply, true);
    await window.UMessageModal.success("Reply sent to " + toEmail, "Sent");
  } catch (err) {
    console.error("[MSG] EmailJS reply failed:", err);
    await window.UMessageModal.error(
      "Failed to send reply. Please try again.",
      "Error",
    );
  }
});
