function _formatUserAgeFromJoin(joinedAt) {
  const joinTime = Number(joinedAt) || Date.now();
  const diffMs = Math.max(0, Date.now() - joinTime);
  const days = Math.max(1, Math.floor(diffMs / 86400000));
  return days === 1 ? "1 day old" : days + " days old";
}

function refreshUserProfile() {
  const fallbackAvatar =
    "https://i.postimg.cc/nhdyR4kF/Mt-Profile-Fallback-Img.png";
  const raw = localStorage.getItem("mt_auth_user");
  if (!raw) return;

  let user;
  try {
    user = JSON.parse(raw);
  } catch {
    return;
  }

  const avatarEl = document.getElementById("user-profile-avatar");
  const nameEl = document.getElementById("user-profile-name");
  const genderEl = document.getElementById("user-profile-gender");
  const statusEl = document.getElementById("user-profile-status");
  const ageEl = document.getElementById("user-profile-age");

  if (avatarEl) avatarEl.src = user.avatar || fallbackAvatar;
  if (nameEl) nameEl.textContent = user.name || "User";
  if (genderEl) genderEl.textContent = user.gender || "Male";
  if (statusEl) statusEl.textContent = user.status || "Single";
  if (ageEl) ageEl.textContent = _formatUserAgeFromJoin(user.joinedAt);
}

function setupUserProfileLogout() {
  const logoutBtn = document.getElementById("user-profile-logout");
  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("mt_auth_state");
    localStorage.removeItem("mt_auth_user");

    const authPage = document.getElementById("auth-page");
    const main = document.querySelector(".main");
    if (authPage) authPage.style.display = "none";
    if (main) main.style.display = "block";

    if (typeof _navigateTo === "function") _navigateTo("/");
    if (
      typeof showPage === "function" &&
      typeof homePage !== "undefined" &&
      homePage
    ) {
      showPage(homePage);
    }
    if (typeof _setActiveNav === "function") _setActiveNav("home");
  });
}

window.refreshUserProfile = refreshUserProfile;
refreshUserProfile();
setupUserProfileLogout();
