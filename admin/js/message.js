// admin/js/message.js — Message page logic

// ── EmailJS Config ────────────────────────────────────
// 1. Sign up free at https://emailjs.com
// 2. Create an Email Service (Gmail, Outlook, etc.) → copy Service ID
// 3. Create an Email Template with these variables:
//    {{to_name}}, {{to_email}}, {{subject}}, {{reply}}
//    Set "To Email" field to: {{to_email}}
// 4. Copy Template ID and Public Key (Account → API Keys)
const EMAILJS_SERVICE_ID = "service_m2mepgf"; // e.g. "service_abc123"
const EMAILJS_TEMPLATE_ID = "template_oieyfu5"; // e.g. "template_xyz789"
const EMAILJS_PUBLIC_KEY = "uGXNHp4u77kyRTD6O"; // e.g. "aBcDeFgHiJkLmNoP"

// Initialise once
try {
  emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
} catch (e) {}

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
    titleEl.style.display = msg.title ? "" : "none";
  }

  const replyEl = document.getElementById("msg-response-input");
  if (replyEl) replyEl.value = msg.reply || "";

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

  const toEmail = msg.email || "";
  if (!toEmail) {
    await window.UMessageModal.error(
      "This message has no email address to reply to.",
      "Cannot Send",
    );
    return;
  }

  if (!(await window.UMessageModal.confirm("Send this reply?", "Confirmation")))
    return;

  // Check credentials are configured
  if (
    EMAILJS_SERVICE_ID === "YOUR_SERVICE_ID" ||
    EMAILJS_TEMPLATE_ID === "YOUR_TEMPLATE_ID" ||
    EMAILJS_PUBLIC_KEY === "YOUR_PUBLIC_KEY"
  ) {
    await window.UMessageModal.error(
      "EmailJS is not configured yet. Open admin/js/message.js and fill in your Service ID, Template ID, and Public Key.",
      "Setup Required",
    );
    return;
  }

  const replyBtn = document.getElementById("msg-reply-btn");
  if (replyBtn) {
    replyBtn.disabled = true;
    replyBtn.textContent = "Sending...";
  }

  try {
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      to_name: msg.from || msg.name || "there",
      to_email: toEmail,
      subject: msg.title ? `Re: ${msg.title}` : "Re: Your Message",
      reply: reply,
    });

    DataStore.update("messages", _msgOpenId, { reply, status: "replied" });
    await window.UMessageModal.success("Reply sent to " + toEmail, "Sent");
    _msgCloseDetail();
  } catch (err) {
    console.error("EmailJS error:", err);
    await window.UMessageModal.error(
      "Failed to send email. Check your EmailJS credentials and template.",
      "Send Failed",
    );
  } finally {
    if (replyBtn) {
      replyBtn.disabled = false;
      replyBtn.textContent = "Reply";
    }
  }
});
