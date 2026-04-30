// admin/js/index.js — Admin page switching + login gate

const adminLogin = document.querySelector(".admin-login");
const adminLayout = document.querySelector(".admin-layout");
const adminPages = document.querySelectorAll(".admin-page");
const adminNavItems = document.querySelectorAll(".admin-nav-item");

console.log("[INDEX] Found", adminPages.length, "admin pages");
console.log("[INDEX] Found", adminNavItems.length, "nav items");
console.log("[INDEX] adminLogin:", !!adminLogin, "adminLayout:", !!adminLayout);

let currentAdminPage = "dashboard";

// ── Login ────────────────────────────────────────────

const loginBtn = document.getElementById("login-btn");
const loginInput = document.getElementById("login-pin");
const loginError = document.getElementById("login-error");

function attemptLogin() {
  const pin = loginInput.value.trim();
  if (DataStore.checkPin(pin)) {
    adminLogin.style.display = "none";
    adminLayout.style.display = "flex";
    showAdminPage("dashboard");
  } else {
    loginError.textContent = "Incorrect PIN";
    loginInput.value = "";
    loginInput.focus();
  }
}

loginBtn.addEventListener("click", attemptLogin);
loginInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") attemptLogin();
  loginError.textContent = "";
});

// Logout helper (called from settings page too)
function adminLogout() {
  adminLayout.style.display = "none";
  adminLogin.style.display = "flex";
  loginInput.value = "";
  loginError.textContent = "";
}

// Hidden fallback logout in header (preserved for compatibility)
const legacyLogoutBtn = document.getElementById("admin-logout");
if (legacyLogoutBtn) legacyLogoutBtn.addEventListener("click", adminLogout);

// ── Page Switching ───────────────────────────────────

function hideAllAdminPages() {
  adminPages.forEach((p) => (p.style.display = "none"));
  // close all modals
  document
    .querySelectorAll(".admin-modal")
    .forEach((m) => m.classList.remove("open"));
}

function showAdminPage(name) {
  hideAllAdminPages();
  currentAdminPage = name;

  const page = document.querySelector(`[data-admin-page="${name}"]`);
  if (page) page.style.display = "flex";

  // Update active nav
  adminNavItems.forEach((n) => {
    n.classList.toggle("active", n.getAttribute("data-admin-nav") === name);
  });

  // Refresh page data
  if (name === "dashboard" && typeof refreshDashboard === "function")
    refreshDashboard();
  if (name === "posts" && typeof refreshPosts === "function") refreshPosts();
  if (name === "quests" && typeof refreshQuests === "function") refreshQuests();
  if (name === "content" && typeof refreshContent === "function")
    refreshContent();
  if (name === "stats" && typeof refreshStats === "function") refreshStats();
  if (name === "message" && typeof refreshMessage === "function")
    refreshMessage();
  if (name === "sales" && typeof refreshSales === "function") refreshSales();
}

// Nav clicks
adminNavItems.forEach((nav) => {
  nav.addEventListener("click", () => {
    const target = nav.getAttribute("data-admin-nav");
    showAdminPage(target);
  });
});
