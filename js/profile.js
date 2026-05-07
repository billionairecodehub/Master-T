// ── Profile Page: Full-page views + Like counter + Sub board toggle ──

const profileHome = document.getElementById("profile-home");
const profileXLink = document.getElementById("profile-x-link");
const profileXIcon = document.getElementById("profile-x-icon");
const profileViews = {
  mentorship: document.getElementById("profile-mentorship"),
  message: document.getElementById("profile-message"),
  about: document.getElementById("profile-about"),
};

// ── Contact buttons: call and email ──
const profileCallBtn = document.getElementById("profile-call-btn");
const profileEmailBtn = document.getElementById("profile-email-btn");

if (profileCallBtn) {
  profileCallBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const contact = profileCallBtn.getAttribute("data-contact");
    profileCallBtn.blur();
    // Delay to allow blur to complete before navigation
    setTimeout(() => {
      window.location.href = contact;
    }, 50);
  });
}

if (profileEmailBtn) {
  profileEmailBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const contact = profileEmailBtn.getAttribute("data-contact");
    const email = (contact || "").replace(/^mailto:/i, "");
    profileEmailBtn.blur();

    if (!email) {
      if (window.UMessageModal) {
        await window.UMessageModal.error("Email is not available", "Error");
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(email);
      if (window.UMessageModal) {
        await window.UMessageModal.success(
          "Email copied to clipboard.",
          "Notification",
        );
      }
    } catch {
      if (window.UMessageModal) {
        await window.UMessageModal.error(
          "Unable to copy email. Please try again.",
          "Error",
        );
      }
    }
  });
}

// ── Open board view ──
function openProfileView(name) {
  if (!profileHome || !profileViews[name]) return;
  profileHome.style.display = "none";
  Object.values(profileViews).forEach((v) => (v.style.display = "none"));
  profileViews[name].style.display = "flex";
  // Scroll to top
  const main = document.querySelector(".main");
  if (main) main.scrollTop = 0;
}

// ── Close board view (back to profile home) ──
function closeProfileView() {
  Object.values(profileViews).forEach((v) => (v.style.display = "none"));
  if (profileHome) profileHome.style.display = "flex";
  const main = document.querySelector(".main");
  if (main) main.scrollTop = 0;
}

// Board click → open view
document.querySelectorAll(".profile-board[data-board]").forEach((board) => {
  const name = board.getAttribute("data-board");
  board.addEventListener("click", () => {
    board.blur();
    openProfileView(name);
  });
});

// Back buttons
document.querySelectorAll(".profile-view-back").forEach((btn) => {
  btn.addEventListener("click", () => {
    btn.blur();
    closeProfileView();
  });
});

// Click anywhere in header to go back
document.querySelectorAll(".profile-view-header").forEach((header) => {
  header.addEventListener("click", () => {
    closeProfileView();
  });
});

// ── Sub board toggle-open ──
document.querySelectorAll(".profile-sub-board[data-sub]").forEach((sub) => {
  sub.addEventListener("click", () => {
    sub.blur();
    sub.classList.toggle("expanded");
  });
});

// ── About page search filter ──
const aboutSearchInput = document.getElementById("profile-about-search");
if (aboutSearchInput) {
  aboutSearchInput.addEventListener("input", () => {
    const q = aboutSearchInput.value.trim().toLowerCase();
    document.querySelectorAll(".profile-about-board").forEach((board) => {
      const title = board.querySelector(".profile-sub-board-title");
      const text = board.querySelector(".profile-sub-text");
      const haystack =
        (title ? title.textContent : "") + " " + (text ? text.textContent : "");
      board.style.display =
        !q || haystack.toLowerCase().includes(q) ? "" : "none";
    });
  });
}

// Count is stored in DataStore profile so it syncs globally via Firebase.
// Per-device voted flag stays in localStorage (one like per device).
const PROFILE_LIKED_KEY = "mt_profile_liked";

function getProfileLikes() {
  const p = DataStore.getProfile();
  return parseInt(p.totalLikes) || 0;
}

function formatLikeCount(n) {
  if (n >= 1000000)
    return "+" + (n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1) + "M";
  if (n >= 1000) return "+" + (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + "k";
  return "+" + n;
}

function renderProfileLikes() {
  const el = document.getElementById("profile-like-count");
  if (el) el.textContent = formatLikeCount(getProfileLikes());
  const btn = document.getElementById("profile-like-btn");
  if (btn) {
    const hasLiked = !!localStorage.getItem(PROFILE_LIKED_KEY);
    btn.classList.toggle("voted", hasLiked);
  }
}

const profileLikeBtn = document.getElementById("profile-like-btn");
if (profileLikeBtn) {
  profileLikeBtn.addEventListener("click", (e) => {
    e.preventDefault();
    profileLikeBtn.blur();
    const current = getProfileLikes();
    const hasLiked = !!localStorage.getItem(PROFILE_LIKED_KEY);
    if (hasLiked) {
      // undo like — decrement global count
      localStorage.removeItem(PROFILE_LIKED_KEY);
      DataStore.setProfile({ totalLikes: Math.max(current - 1, 0) });
    } else {
      // add like — one per device, increments global count for everyone
      localStorage.setItem(PROFILE_LIKED_KEY, "1");
      DataStore.setProfile({ totalLikes: current + 1 });
    }
    renderProfileLikes();
  });
}

renderProfileLikes();

// ── Load profile data from DataStore ──
function refreshProfileData() {
  const p = DataStore.getProfile();
  const _DEFAULT_PROFILE_IMG =
    "https://i.postimg.cc/nhdyR4kF/Mt-Profile-Fallback-Img.png";
  // Profile hero image
  const heroImg = document.getElementById("profile-hero-img");
  if (heroImg) heroImg.src = p.img || _DEFAULT_PROFILE_IMG;
  // Sync header avatar to match profile image
  const headerImg = document.getElementById("header-profile-img");
  if (headerImg) headerImg.src = p.img || _DEFAULT_PROFILE_IMG;
  // Mentorship price
  const priceEl = document.getElementById("mentorship-price");
  const periodEl = document.getElementById("mentorship-period");
  if (priceEl && p.price) priceEl.textContent = p.price;
  if (periodEl && p.mentorshipPeriod) periodEl.textContent = p.mentorshipPeriod;
  // X link
  if (profileXLink && p.xUrl) profileXLink.href = p.xUrl;
  if (profileXIcon && p.xIcon) profileXIcon.src = p.xIcon;
  // Contact buttons
  if (profileCallBtn && p.phone)
    profileCallBtn.setAttribute("data-contact", "tel:" + p.phone);
  if (profileEmailBtn && p.email)
    profileEmailBtn.setAttribute("data-contact", "mailto:" + p.email);
  // Mentorship CTA button
  const mentorshipCta = document.querySelector(".mentorship-cta");
  if (mentorshipCta) {
    if (p.mentorshipUrl) {
      mentorshipCta.setAttribute("data-url", p.mentorshipUrl);
      mentorshipCta.style.opacity = "";
      mentorshipCta.style.pointerEvents = "";
    } else {
      mentorshipCta.removeAttribute("data-url");
    }
  }
  // Re-render like count so all devices see the latest global count
  renderProfileLikes();
}
refreshProfileData();

// ── Mentorship CTA button ──
const mentorshipCtaBtn = document.querySelector(".mentorship-cta");
if (mentorshipCtaBtn) {
  mentorshipCtaBtn.addEventListener("click", () => {
    const url = mentorshipCtaBtn.getAttribute("data-url");
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  });
}

// ── Send message → DataStore.messages ──────────────────────────────────────

const msgSendBtn = document.getElementById("msg-send-btn");
const msgSendNote = document.getElementById("msg-send-note");

// ── Daily message limit helpers ──
const MSG_DAY_KEY = "mt_msg_day";

function _getTodayKey() {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function _getMsgTodayCount() {
  try {
    const stored = JSON.parse(localStorage.getItem(MSG_DAY_KEY) || "{}");
    if (stored.day !== _getTodayKey()) return 0;
    return stored.count || 0;
  } catch (e) {
    return 0;
  }
}

function _incrementMsgCount() {
  const today = _getTodayKey();
  const count = _getMsgTodayCount() + 1;
  localStorage.setItem(MSG_DAY_KEY, JSON.stringify({ day: today, count }));
}

// ── Apply message gate (called on load and can be re-checked) ──
function _applyMsgGate() {
  if (!msgSendBtn) return;
  const p = DataStore.getProfile();
  const msgOn = p.msgOn !== false; // default on if not set
  const msgLimit = p.msgLimit || 5;

  if (!msgOn) {
    msgSendBtn.disabled = true;
    msgSendBtn.textContent = "Message Not Yet Available";
    msgSendBtn.style.opacity = "0.55";
    msgSendBtn.style.cursor = "not-allowed";
    _profileMsgSetNote(
      "Messaging is currently disabled",
      "rgba(200,120,60,0.85)",
    );
    return;
  }

  const todayCount = _getMsgTodayCount();
  if (todayCount >= msgLimit) {
    msgSendBtn.disabled = true;
    msgSendBtn.textContent = "Daily Limit Reached";
    msgSendBtn.style.opacity = "0.55";
    msgSendBtn.style.cursor = "not-allowed";
    _profileMsgSetNote(
      "You've reached today's message limit. Try again tomorrow.",
      "rgba(200,120,60,0.85)",
    );
    return;
  }

  // Available — reset any gate state
  msgSendBtn.disabled = false;
  msgSendBtn.textContent = "Send a Message";
  msgSendBtn.style.opacity = "";
  msgSendBtn.style.cursor = "";
}

function _profileMsgReset() {
  const n = document.getElementById("msg-sender-name");
  const t = document.getElementById("msg-sender-title");
  const b = document.getElementById("msg-sender-body");
  const e = document.getElementById("msg-sender-email");
  if (n) n.value = "";
  if (t) t.value = "";
  if (b) b.value = "";
  if (e) e.value = "";
}

function _profileMsgSetNote(text, color) {
  if (!msgSendNote) return;
  msgSendNote.textContent = text;
  msgSendNote.style.color = color || "";
}

if (msgSendBtn) {
  msgSendBtn.addEventListener("click", () => {
    // Re-check gate before each send
    const p = DataStore.getProfile();
    const msgOn = p.msgOn !== false;
    const msgLimit = p.msgLimit || 5;
    if (!msgOn) {
      _profileMsgSetNote(
        "Messaging is currently disabled",
        "rgba(200,120,60,0.85)",
      );
      return;
    }
    if (_getMsgTodayCount() >= msgLimit) {
      _profileMsgSetNote(
        "You've reached today's message limit. Try again tomorrow.",
        "rgba(200,120,60,0.85)",
      );
      return;
    }

    const name = (
      document.getElementById("msg-sender-name")?.value || ""
    ).trim();
    const title = (
      document.getElementById("msg-sender-title")?.value || ""
    ).trim();
    const body = (
      document.getElementById("msg-sender-body")?.value || ""
    ).trim();
    const email = (
      document.getElementById("msg-sender-email")?.value || ""
    ).trim();

    if (!name) {
      _profileMsgSetNote("Please enter your name", "rgba(231,76,60,0.9)");
      return;
    }
    if (!body) {
      _profileMsgSetNote("Please write your message", "rgba(231,76,60,0.9)");
      return;
    }
    if (!email || !email.includes("@")) {
      _profileMsgSetNote("Please enter a valid email", "rgba(231,76,60,0.9)");
      return;
    }

    msgSendBtn.disabled = true;
    msgSendBtn.textContent = "Sending...";

    DataStore.add("messages", {
      from: name,
      title,
      email,
      body,
      status: "unopened",
      reply: "",
    });

    _incrementMsgCount();

    _profileMsgSetNote(
      "Message sent! Response may take a while",
      "rgba(107,200,107,0.9)",
    );
    _profileMsgReset();

    // Re-evaluate gate (may hit limit after this send)
    _applyMsgGate();

    // Reset note after 4 s (only if still available)
    setTimeout(() => {
      const p2 = DataStore.getProfile();
      if (p2.msgOn !== false) {
        _profileMsgSetNote("Response may take a while");
      }
    }, 4000);
  });
}

// Apply gate on load
_applyMsgGate();
