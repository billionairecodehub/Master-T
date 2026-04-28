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
  profileCallBtn.addEventListener("click", () => {
    const contact = profileCallBtn.getAttribute("data-contact");
    window.location.href = contact;
  });
}

if (profileEmailBtn) {
  profileEmailBtn.addEventListener("click", () => {
    const contact = profileEmailBtn.getAttribute("data-contact");
    window.location.href = contact;
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
  board.addEventListener("click", () => openProfileView(name));
});

// Back buttons
document.querySelectorAll(".profile-view-back").forEach((btn) => {
  btn.addEventListener("click", () => {
    closeProfileView();
  });
});

// ── Sub board toggle-open ──
document.querySelectorAll(".profile-sub-board[data-sub]").forEach((sub) => {
  sub.addEventListener("click", () => {
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
  const priceEl = document.getElementById("mentorship-price");
  const periodEl = document.getElementById("mentorship-period");
  if (priceEl && p.mentorshipPrice) priceEl.textContent = p.mentorshipPrice;
  if (periodEl && p.mentorshipPeriod) periodEl.textContent = p.mentorshipPeriod;
  if (profileXLink && p.xUrl) profileXLink.href = p.xUrl;
  if (profileXIcon && p.xIcon) profileXIcon.src = p.xIcon;
  // Re-render like count so all devices see the latest global count
  renderProfileLikes();
}
refreshProfileData();
