function _formatUserAgeFromJoin(joinedAt) {
  const joinTime = Number(joinedAt) || Date.now();
  const diffMs = Math.max(0, Date.now() - joinTime);
  const days = Math.max(1, Math.floor(diffMs / 86400000));
  return days + "d ago";
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
  const nameEl = document.getElementById("user-profile-name-value");
  const emailEl = document.getElementById("user-profile-email");
  const genderEl = document.getElementById("user-profile-gender");
  const maritalEl = document.getElementById("user-profile-marital");
  const ageEl = document.getElementById("user-profile-account");

  if (avatarEl) avatarEl.src = user.avatar || fallbackAvatar;
  if (nameEl) nameEl.textContent = user.name || "Justbgoodd";
  if (emailEl) emailEl.textContent = user.email || "getinwithgame@gmail.com";
  if (genderEl) genderEl.textContent = user.gender || "Male";
  if (maritalEl) maritalEl.textContent = user.status || "Single";
  if (ageEl) ageEl.textContent = _formatUserAgeFromJoin(user.joinedAt);
}

function setupUserProfileInteractions() {
  const nameEl = document.getElementById("user-profile-name-value");
  const contactBtn = document.getElementById("user-profile-contact");

  if (nameEl) {
    nameEl.addEventListener("dblclick", () => {
      const raw = localStorage.getItem("mt_auth_user");
      if (!raw) return;
      let user;
      try {
        user = JSON.parse(raw);
      } catch {
        return;
      }

      const next = window.prompt("Edit username", user.name || "");
      if (!next) return;
      const clean = next.trim();
      if (!clean) return;
      user.name = clean;
      localStorage.setItem("mt_auth_user", JSON.stringify(user));
      refreshUserProfile();
    });
  }

  if (contactBtn) {
    contactBtn.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href =
        "mailto:Support@getinwithgame.com?subject=Support%20Request";
    });
  }
}

function setupUserProfileLogout() {
  const logoutBtn = document.getElementById("user-profile-logout");
  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("mt_auth_state");
    localStorage.removeItem("mt_auth_user");
    localStorage.setItem("mt_auth_start_seen", "1");

    const authPage = document.getElementById("auth-page");
    const main = document.querySelector(".main");
    if (main) main.style.display = "none";
    if (authPage) authPage.style.display = "flex";
    if (typeof showAuthScreen === "function")
      showAuthScreen("auth-screen-signin");

    if (typeof _setActiveNav === "function") _setActiveNav("");
    if (typeof _navigateTo === "function") _navigateTo("/");
  });
}

window.refreshUserProfile = refreshUserProfile;
refreshUserProfile();
setupUserProfileInteractions();
setupUserProfileLogout();
