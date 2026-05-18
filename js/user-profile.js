function _formatUserAgeFromJoin(joinedAt) {
  const joinTime = Number(joinedAt) || Date.now();
  const diffMs = Math.max(0, Date.now() - joinTime);
  const days = Math.max(1, Math.floor(diffMs / 86400000));
  return days + "d ago";
}

function _getAuthUser() {
  const raw = localStorage.getItem("mt_auth_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function _saveAuthUser(user) {
  localStorage.setItem("mt_auth_user", JSON.stringify(user));
}

function _setChoice(group, value) {
  document
    .querySelectorAll(`.user-settings-choice[data-group="${group}"]`)
    .forEach((btn) => {
      const on = btn.getAttribute("data-value") === value;
      btn.classList.toggle("is-selected", on);
    });
}

function _getSelectedChoice(group, fallback) {
  const on = document.querySelector(
    `.user-settings-choice[data-group="${group}"].is-selected`,
  );
  return on ? on.getAttribute("data-value") : fallback;
}

function _showUserProfileMainView() {
  const mainView = document.getElementById("user-profile-main-view");
  const settingsView = document.getElementById("user-profile-settings-view");
  if (mainView) mainView.style.display = "flex";
  if (settingsView) settingsView.style.display = "none";
}

function _showUserProfileSettingsView() {
  const mainView = document.getElementById("user-profile-main-view");
  const settingsView = document.getElementById("user-profile-settings-view");
  if (mainView) mainView.style.display = "none";
  if (settingsView) settingsView.style.display = "flex";
}

function refreshUserProfile() {
  const fallbackAvatar =
    "https://i.postimg.cc/nhdyR4kF/Mt-Profile-Fallback-Img.png";
  const user = _getAuthUser();
  if (!user) return;

  const avatarEl = document.getElementById("user-profile-avatar");
  const nameEl = document.getElementById("user-profile-name-value");
  const emailEl = document.getElementById("user-profile-email");
  const genderEl = document.getElementById("user-profile-gender");
  const maritalEl = document.getElementById("user-profile-marital");
  const ageEl = document.getElementById("user-profile-account");
  const settingsAvatarEl = document.getElementById("user-settings-avatar");
  const settingsNameEl = document.getElementById("user-settings-name");
  const settingsEmailEl = document.getElementById("user-settings-email");

  if (avatarEl) avatarEl.src = user.avatar || fallbackAvatar;
  if (nameEl) nameEl.textContent = user.name || "Justbgoodd";
  if (emailEl) emailEl.textContent = user.email || "getinwithgame@gmail.com";
  if (genderEl) genderEl.textContent = user.gender || "Male";
  if (maritalEl) maritalEl.textContent = user.status || "Single";
  if (ageEl) ageEl.textContent = _formatUserAgeFromJoin(user.joinedAt);

  if (settingsAvatarEl) settingsAvatarEl.src = user.avatar || fallbackAvatar;
  if (settingsNameEl) settingsNameEl.value = user.name || "Justbgoodd";
  if (settingsEmailEl)
    settingsEmailEl.value = user.email || "getinwithgame@gmail.com";

  _setChoice("gender", user.gender || "Male");
  _setChoice("marital", user.status || "Single");
}

function setupUserProfileInteractions() {
  const nameEl = document.getElementById("user-profile-name-value");
  const contactBtn = document.getElementById("user-profile-contact");
  const homeMainBtn = document.getElementById("user-profile-home-main");
  const homeSettingsBtn = document.getElementById("user-profile-home-settings");
  const openSettingsBtn = document.getElementById("user-profile-open-settings");
  const avatarUploadBtn = document.getElementById(
    "user-settings-avatar-upload",
  );
  const avatarInput = document.getElementById("user-settings-avatar-input");
  const saveBtn = document.getElementById("user-settings-save");
  const settingsName = document.getElementById("user-settings-name");
  const settingsEmail = document.getElementById("user-settings-email");
  const settingsAvatar = document.getElementById("user-settings-avatar");

  _showUserProfileMainView();

  if (nameEl) {
    nameEl.addEventListener("dblclick", () => {
      const user = _getAuthUser();
      if (!user) return;

      const next = window.prompt("Edit username", user.name || "");
      if (!next) return;
      const clean = next.trim();
      if (!clean) return;
      user.name = clean;
      _saveAuthUser(user);
      refreshUserProfile();
    });
  }

  if (homeMainBtn)
    homeMainBtn.addEventListener("click", _showUserProfileMainView);
  if (homeSettingsBtn)
    homeSettingsBtn.addEventListener("click", _showUserProfileMainView);
  if (openSettingsBtn)
    openSettingsBtn.addEventListener("click", () => {
      refreshUserProfile();
      _showUserProfileSettingsView();
    });

  document.querySelectorAll(".user-settings-choice").forEach((btn) => {
    btn.addEventListener("click", () => {
      const group = btn.getAttribute("data-group");
      const value = btn.getAttribute("data-value");
      if (!group || !value) return;
      _setChoice(group, value);
    });
  });

  if (avatarUploadBtn && avatarInput) {
    avatarUploadBtn.addEventListener("click", () => avatarInput.click());
    avatarInput.addEventListener("change", () => {
      const file = avatarInput.files && avatarInput.files[0];
      if (!file || !settingsAvatar) return;
      const reader = new FileReader();
      reader.onload = () => {
        settingsAvatar.src = String(reader.result || settingsAvatar.src);
      };
      reader.readAsDataURL(file);
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      const user = _getAuthUser() || { joinedAt: Date.now() };
      const nextName = settingsName ? settingsName.value.trim() : "";
      const nextEmail = settingsEmail ? settingsEmail.value.trim() : "";

      if (nextName) user.name = nextName;
      if (nextEmail) user.email = nextEmail;
      user.gender = _getSelectedChoice("gender", user.gender || "Male");
      user.status = _getSelectedChoice("marital", user.status || "Single");
      if (settingsAvatar && settingsAvatar.src)
        user.avatar = settingsAvatar.src;

      _saveAuthUser(user);
      refreshUserProfile();
      _showUserProfileMainView();
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
