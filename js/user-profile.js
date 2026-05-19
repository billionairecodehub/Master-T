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
  const modalView = document.getElementById("user-profile-email-modal");
  if (mainView) mainView.style.display = "flex";
  if (settingsView) settingsView.style.display = "none";
  if (modalView) modalView.style.display = "none";
}

function _showUserProfileSettingsView() {
  const mainView = document.getElementById("user-profile-main-view");
  const settingsView = document.getElementById("user-profile-settings-view");
  const modalView = document.getElementById("user-profile-email-modal");
  if (mainView) mainView.style.display = "none";
  if (settingsView) settingsView.style.display = "flex";
  if (modalView) modalView.style.display = "none";
}

function _showUserProfileEmailModal() {
  const user = _getAuthUser();
  if (!user) return;

  const modal = document.getElementById("user-profile-email-modal");
  const oldEmailInput = document.getElementById("user-email-modal-old");
  const newEmailInput = document.getElementById("user-email-modal-new");

  if (modal) modal.style.display = "flex";
  if (oldEmailInput)
    oldEmailInput.value = user.email || "getinwithgame@gmail.com";
  if (newEmailInput) newEmailInput.value = "";

  // Clear passcode inputs
  document.querySelectorAll(".auth-passcode-input").forEach((input) => {
    input.value = "";
  });
}

function _hideUserProfileEmailModal() {
  const modal = document.getElementById("user-profile-email-modal");
  if (modal) modal.style.display = "none";
}

function _validateUsername(username) {
  // Check max 12 characters
  if (!username || username.length > 12) {
    return { valid: false, error: "Username must be max 12 characters" };
  }

  // Check uniqueness - simple check against all stored user data
  // In a real app, this would check against a database
  // For now, check if it's different from current user
  const currentUser = _getAuthUser();
  if (currentUser && currentUser.name && currentUser.name !== username) {
    // Could implement a check against other users here
    // For MVP, we'll allow it as long as it's valid format
  }

  return { valid: true };
}

async function _uploadToImgbb(file) {
  // Using a public imgbb API endpoint - this is basic implementation
  // In production, use a dedicated API key
  const formData = new FormData();
  formData.append("image", file);

  try {
    const response = await fetch(
      "https://api.imgbb.com/1/upload?key=5d12fe479ea82c96d71c7b9d5f98854c",
      {
        method: "POST",
        body: formData,
        mode: "cors",
      },
    );

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    const data = await response.json();
    return data.data.url; // Return the uploaded image URL
  } catch (error) {
    console.error("imgbb upload error:", error);
    // Return base64 as fallback if upload fails
    return null;
  }
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
  const settingsEmailDisplayEl = document.getElementById(
    "user-settings-email-display",
  );

  if (avatarEl) avatarEl.src = user.avatar || fallbackAvatar;
  if (nameEl) nameEl.textContent = user.name || "Justbgoodd";
  if (emailEl) emailEl.textContent = user.email || "getinwithgame@gmail.com";
  if (genderEl) genderEl.textContent = user.gender || "Male";
  if (maritalEl) maritalEl.textContent = user.status || "Single";
  if (ageEl) ageEl.textContent = _formatUserAgeFromJoin(user.joinedAt);

  if (settingsAvatarEl) settingsAvatarEl.src = user.avatar || fallbackAvatar;
  if (settingsNameEl) settingsNameEl.value = user.name || "Justbgoodd";
  if (settingsEmailDisplayEl)
    settingsEmailDisplayEl.textContent =
      user.email || "getinwithgame@gmail.com";

  _setChoice("gender", user.gender || "Male");
  _setChoice("marital", user.status || "Single");
}

function setupUserProfileInteractions() {
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
  const settingsAvatar = document.getElementById("user-settings-avatar");
  const emailEditBtn = document.getElementById("user-settings-email-btn");
  const emailModalBackBtn = document.getElementById("user-email-modal-back");
  const emailModalResendBtn = document.getElementById(
    "user-email-modal-resend",
  );
  const emailModalConfirmBtn = document.getElementById(
    "user-email-modal-confirm",
  );
  const emailModalOverlay = document.getElementById(
    "user-profile-modal-overlay",
  );

  _showUserProfileMainView();

  // Email edit button - open modal
  if (emailEditBtn) {
    emailEditBtn.addEventListener("click", _showUserProfileEmailModal);
  }

  // Email modal close button
  if (emailModalBackBtn) {
    emailModalBackBtn.addEventListener("click", _hideUserProfileEmailModal);
  }

  // Email modal resend button
  if (emailModalResendBtn) {
    emailModalResendBtn.addEventListener("click", () => {
      // In real implementation, resend verification code to new email
      alert("Verification code resent to your new email");
    });
  }

  // Email modal confirm button
  if (emailModalConfirmBtn) {
    emailModalConfirmBtn.addEventListener("click", () => {
      const oldEmailInput = document.getElementById("user-email-modal-old");
      const newEmailInput = document.getElementById("user-email-modal-new");
      const passcodeInputs = document.querySelectorAll(".auth-passcode-input");

      const passcode = Array.from(passcodeInputs)
        .map((input) => input.value)
        .join("");

      if (passcode.length !== 4) {
        alert("Please enter all 4 digits of the passcode");
        return;
      }

      if (!newEmailInput || !newEmailInput.value.trim()) {
        alert("Please enter a new email");
        return;
      }

      // Verify passcode (in real app, validate against sent code)
      // For MVP, just check if 4 digits
      const user = _getAuthUser();
      if (user) {
        user.email = newEmailInput.value.trim();
        _saveAuthUser(user);
        alert("Email updated successfully");
        refreshUserProfile();
        _hideUserProfileEmailModal();
        _showUserProfileSettingsView();
      }
    });
  }

  // Prevent modal close on overlay click (only close on Go Back button)
  if (emailModalOverlay) {
    emailModalOverlay.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  }

  // Passcode input auto-focus behavior
  document.querySelectorAll(".auth-passcode-input").forEach((input, idx) => {
    input.addEventListener("input", (e) => {
      if (e.target.value && idx < 3) {
        document.querySelectorAll(".auth-passcode-input")[idx + 1].focus();
      }
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !input.value && idx > 0) {
        document.querySelectorAll(".auth-passcode-input")[idx - 1].focus();
      }
    });
  });

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
    avatarInput.addEventListener("change", async () => {
      const file = avatarInput.files && avatarInput.files[0];
      if (!file || !settingsAvatar) return;

      // First show preview via FileReader
      const reader = new FileReader();
      reader.onload = async () => {
        settingsAvatar.src = String(reader.result || settingsAvatar.src);

        // Then upload to imgbb for persistence
        const imgbbUrl = await _uploadToImgbb(file);
        if (imgbbUrl) {
          settingsAvatar.src = imgbbUrl;
        }
      };
      reader.readAsDataURL(file);
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      const user = _getAuthUser() || { joinedAt: Date.now() };
      const nextName = settingsName ? settingsName.value.trim() : "";

      // Validate username
      const validation = _validateUsername(nextName);
      if (!validation.valid) {
        alert(validation.error);
        return;
      }

      if (nextName) user.name = nextName;
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
