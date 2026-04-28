// Notifications — render from DataStore

// ── Relative time helper ──
function getNotiRelativeTime(dateStr) {
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

function formatNotiDateGroup(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "Unknown";
  const months = [
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
  return (
    d.getDate() +
    " " +
    months[d.getMonth()] +
    " ~ " +
    String(d.getFullYear()).slice(2)
  );
}

function getReadNotifications() {
  try {
    return JSON.parse(localStorage.getItem("mt_noti_read")) || [];
  } catch (e) {
    return [];
  }
}

function markNotificationRead(id) {
  const read = getReadNotifications();
  if (!read.includes(id)) {
    read.push(id);
    localStorage.setItem("mt_noti_read", JSON.stringify(read));
  }
  updateNotiNavDot();
}

function updateNotiNavDot() {
  const notis = DataStore.getAll("notifications");
  const read = getReadNotifications();
  const unreadCount = notis.filter((n) => !read.includes(n.id)).length;
  const navDot = document.getElementById("noti-nav-dot");
  if (navDot) {
    navDot.style.display = unreadCount > 0 ? "block" : "none";
  }
  // Update count text
  const countEl = document.getElementById("noti-count");
  if (countEl) {
    const total = notis.length;
    const label = total + " Notification" + (total !== 1 ? "s" : "");
    countEl.textContent =
      unreadCount > 0 ? label + " ~ " + unreadCount + " Unread" : label;
  }
}

function renderNotifications() {
  const notis = DataStore.getAll("notifications");
  const container = document.getElementById("notifications-boards");
  const dateEl = document.getElementById("noti-date");
  const countEl = document.getElementById("noti-count");
  if (!container) return;

  const read = getReadNotifications();

  // Remove top date — per-group dates are shown below
  if (dateEl) dateEl.textContent = "";

  const unreadCount = notis.filter((n) => !read.includes(n.id)).length;
  const total = notis.length;
  const label = total + " Notification" + (total !== 1 ? "s" : "");
  countEl.textContent =
    unreadCount > 0 ? label + " ~ " + unreadCount + " Unread" : label;

  if (notis.length === 0) {
    container.innerHTML =
      '<div style="text-align:center;color:#444;padding:40px 0;font-size:13px;">No notifications yet</div>';
    updateNotiNavDot();
    return;
  }

  container.innerHTML = "";

  // Sort notifications newest first
  const sorted = notis.slice().sort((a, b) => {
    const da = new Date(a.createdAt || 0).getTime();
    const db = new Date(b.createdAt || 0).getTime();
    return db - da;
  });

  // Group notifications by creation date
  const groups = {};
  const groupOrder = [];
  sorted.forEach((n) => {
    const groupKey = n.createdAt ? formatNotiDateGroup(n.createdAt) : "Unknown";
    if (!groups[groupKey]) {
      groups[groupKey] = [];
      groupOrder.push(groupKey);
    }
    groups[groupKey].push(n);
  });

  // Render grouped (in insertion order = newest first)
  groupOrder.forEach((dateLabel) => {
    const groupHTML = `<div class="noti-date-group-label">${dateLabel}</div>`;
    const itemsHTML = groups[dateLabel]
      .map((n) => {
        const isUnread = !read.includes(n.id);
        const timeDisplay =
          getNotiRelativeTime(n.createdAt) || n.timeframe || "";
        return `
    <div class="notification-board${isUnread ? "" : " read"}" data-noti-id="${n.id}">
      <div class="notification-board-header">
        <div class="notification-board-icon-wrap">
          <img src="https://i.postimg.cc/5tHhvgFc/Mt-Notification-Icon.png" alt="Icon" class="notification-board-icon" />
          ${isUnread ? '<div class="noti-dot"></div>' : ""}
        </div>
        <div class="notification-board-info">
          <div class="notification-board-title">${n.title}</div>
          <div class="notification-board-author">${n.author || "Master Togan"}</div>
        </div>
        <div class="notification-board-timeframe">${timeDisplay}</div>
      </div>
      <div class="notification-board-content">${n.content}</div>
    </div>`;
      })
      .join("");
    container.innerHTML += groupHTML + itemsHTML;
  });

  // Re-bind toggle
  container.querySelectorAll(".notification-board").forEach((board) => {
    board.addEventListener("click", () => {
      board.classList.toggle("open");
      const notiId = board.getAttribute("data-noti-id");
      if (notiId) {
        markNotificationRead(notiId);
        board.classList.add("read");
        // Remove dot from this board
        const dot = board.querySelector(".noti-dot");
        if (dot) dot.remove();
      }
    });
  });

  updateNotiNavDot();
}

renderNotifications();

// ── Search filter ──────────────────────────────────────────
const notiSearchInput = document.getElementById("noti-search-input");
if (notiSearchInput) {
  notiSearchInput.addEventListener("input", () => {
    const q = notiSearchInput.value.trim().toLowerCase();
    const container = document.getElementById("notifications-boards");
    if (!container) return;
    const cards = container.querySelectorAll(".notification-board");
    const groups = container.querySelectorAll(".noti-date-group-label");
    // Filter cards
    cards.forEach((card) => {
      const text = card.textContent.toLowerCase();
      card.classList.toggle("noti-hidden", q !== "" && !text.includes(q));
    });
    // Hide group label if all its cards are hidden
    groups.forEach((label) => {
      let next = label.nextElementSibling;
      let allHidden = true;
      while (next && !next.classList.contains("noti-date-group-label")) {
        if (
          next.classList.contains("notification-board") &&
          !next.classList.contains("noti-hidden")
        ) {
          allHidden = false;
        }
        next = next.nextElementSibling;
      }
      label.classList.toggle("noti-hidden", q !== "" && allHidden);
    });
  });
}
