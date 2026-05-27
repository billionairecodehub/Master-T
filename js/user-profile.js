// (Toolkit button wiring moved into setupUserProfileInteractions())
// Show Toolkit Section (SPA navigation)
function _showUserProfileToolkitView() {
  const mainView = document.getElementById("user-profile-main-view");
  const settingsView = document.getElementById("user-profile-settings-view");
  const toolkitView = document.getElementById("user-profile-toolkit-view");
  const toolkitBookView = document.getElementById("user-toolkit-book-page");
  const modalView = document.getElementById("user-profile-email-modal");
  const settingsBtn = document.getElementById("user-profile-open-settings");
  // Hide main and settings, show toolkit section (sibling behavior like settings)
  if (mainView) mainView.style.display = "none";
  if (settingsView) settingsView.style.display = "none";
  if (toolkitView) toolkitView.style.display = "flex";
  if (toolkitBookView) toolkitBookView.style.display = "none";
  if (modalView) modalView.style.display = "none";
  if (settingsBtn) settingsBtn.classList.remove("is-active");
}
function _formatUserAgeFromJoin(joinedAt) {
  const joinTime = Number(joinedAt) || Date.now();
  const diffMs = Math.max(0, Date.now() - joinTime);
  const mins = Math.floor(diffMs / 60000);
  const hrs = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return mins + "m ago";
  if (hrs < 24) return hrs + "h ago";
  if (days < 365) return days + "d ago";
  return new Date(joinTime).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
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
  const toolkitView = document.getElementById("user-profile-toolkit-view");
  const toolkitBookView = document.getElementById("user-toolkit-book-page");
  const settingsBtn = document.getElementById("user-profile-open-settings");
  if (mainView) mainView.style.display = "";
  if (settingsView) settingsView.style.display = "none";
  if (modalView) modalView.style.display = "none";
  if (toolkitView) toolkitView.style.display = "none";
  if (toolkitBookView) toolkitBookView.style.display = "none";

  // Ensure profile main children are visible.
  if (mainView) {
    const mainContent = mainView.querySelector(".user-profile-main");
    if (mainContent) {
      Array.from(mainContent.children).forEach((child) => {
        child.style.display = "";
      });
    }
  }
  if (settingsBtn) settingsBtn.classList.remove("is-active");
}

function _showUserProfileSettingsView() {
  const mainView = document.getElementById("user-profile-main-view");
  const settingsView = document.getElementById("user-profile-settings-view");
  const modalView = document.getElementById("user-profile-email-modal");
  const settingsBtn = document.getElementById("user-profile-open-settings");
  if (mainView) mainView.style.display = "none";
  if (settingsView) settingsView.style.display = "flex";
  if (modalView) modalView.style.display = "none";
  if (settingsBtn) settingsBtn.classList.add("is-active");
}

function _showUserProfileEmailModal() {
  const user = _getAuthUser();
  if (!user) return;

  const modal = document.getElementById("user-profile-email-modal");
  const oldEmailInput = document.getElementById("user-email-modal-old");
  const newEmailInput = document.getElementById("user-email-modal-new");
  const verifySection = document.getElementById("email-modal-verify-section");
  const confirmBtn = document.getElementById("user-email-modal-confirm");

  if (modal) modal.style.display = "flex";
  if (oldEmailInput) oldEmailInput.value = user.email || "";
  if (newEmailInput) newEmailInput.value = "";

  // Reset to step 1
  if (verifySection) verifySection.style.display = "none";
  if (confirmBtn) confirmBtn.textContent = "Send Code";

  // Clear passcode inputs and any pending code state
  document.querySelectorAll(".auth-passcode-input").forEach((input) => {
    input.value = "";
  });
  localStorage.removeItem(_EC_CODE_KEY);
  localStorage.removeItem(_EC_CD_KEY);
  _setEmailModalNote("");
}

function _hideUserProfileEmailModal() {
  const modal = document.getElementById("user-profile-email-modal");
  if (modal) modal.style.display = "none";
}

// ── Email-change verification constants & helpers ──────────────────────────
const _EC_CODE_KEY = "mt_auth_email_change_code";
const _EC_CD_KEY = "mt_auth_email_change_cd_until";

function _setEmailModalNote(msg, isSuccess) {
  const note = document.getElementById("user-email-modal-note");
  if (!note) return;
  note.textContent = msg;
  note.style.color = isSuccess
    ? "rgba(100, 220, 120, 0.9)"
    : "rgba(255, 180, 80, 0.9)";
}

async function _sendEmailChangeCode(toEmail, code) {
  try {
    if (!window.emailjs) return false;
    await window.emailjs.send("service_v3anekc", "template_cd909qw", {
      to_email: toEmail,
      verification_code: code,
      app_name: "Master Togan",
    });
    return true;
  } catch (e) {
    console.error("[EMAIL CHANGE]", e);
    return false;
  }
}

function _normalizeEmailLocal(e) {
  return (e || "").trim().toLowerCase();
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

  // Render toolkit from purchased books
  try {
    if (typeof renderUserToolkit === "function") renderUserToolkit();
  } catch (e) {
    console.error("renderUserToolkit error", e);
  }
}

// Render toolkit tiles from localStorage 'mt_toolkit_books' and DataStore
function renderUserToolkit() {
  const container = document.getElementById("user-toolkit-books-list");
  if (!container) return;
  container.innerHTML = "";
  let ids = [];
  try {
    ids = JSON.parse(localStorage.getItem("mt_toolkit_books") || "[]") || [];
  } catch (e) {
    ids = [];
  }

  if (ids.length === 0) {
    container.innerHTML =
      "<div class='user-toolkit-empty'>No resources yet</div>";
    return;
  }

  ids.forEach((id) => {
    const b =
      typeof DataStore !== "undefined" ? DataStore.getById("books", id) : null;
    if (!b) return;
    const tile = document.createElement("div");
    tile.className = "user-toolkit-book-tile";
    tile.setAttribute("data-book-id", b.id);
    tile.innerHTML = `
      <img src="${b.img || b.ctaCover || "https://i.postimg.cc/3Jw1kQw2/sample-book-cover.png"}" alt="${b.name || "book"}" class="user-toolkit-book-cover" />
      <div class="user-toolkit-book-title">${b.name || ""}</div>
      <div class="user-toolkit-book-username">${b.author || b.username || ""}</div>
    `;
    container.appendChild(tile);
    tile.addEventListener("click", () => openToolkitBookDetail(b.id));
  });
}

function openToolkitBookDetail(bookId) {
  const b =
    typeof DataStore !== "undefined"
      ? DataStore.getById("books", bookId)
      : null;
  if (!b) return;
  const toolkitView = document.getElementById("user-profile-toolkit-view");
  const bookPage = document.getElementById("user-toolkit-book-page");
  if (toolkitView) toolkitView.style.display = "none";
  if (bookPage) bookPage.style.display = "flex";

  const cover =
    b.img ||
    b.ctaCover ||
    "https://i.postimg.cc/3Jw1kQw2/sample-book-cover.png";
  const title = b.name || "";
  const author = b.author || b.username || "";
  const desc = b.desc || b.description || b.summary || "";

  const coverEl = document.querySelector(".user-toolkit-book-cover-lg");
  if (coverEl) coverEl.src = cover;
  const titleEl = document.querySelector(".user-toolkit-book-title-lg");
  if (titleEl) titleEl.textContent = title;
  const userEl = document.querySelector(".user-toolkit-book-username-lg");
  if (userEl) userEl.textContent = author;
  const descEl = document.querySelector(".user-toolkit-book-desc");
  if (descEl) descEl.textContent = desc;
  const downloadBtn = document.getElementById("user-toolkit-download-btn");
  if (downloadBtn) {
    downloadBtn.onclick = () => alert("Download started (demo) for " + title);
  }
  window.scrollTo(0, 0);
}

function setupUserProfileInteractions() {
  const contactBtn = document.getElementById("user-profile-contact");
  const homeMainBtn = document.getElementById("user-profile-home-main");
  const homeSettingsBtn = document.getElementById("user-profile-home-settings");
  const homeToolkitBtn = document.getElementById("user-profile-home-toolkit");
  const openSettingsBtn = document.getElementById("user-profile-open-settings");
  const toolkitBtn = document.getElementById("user-profile-open-toolkit");
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

  // Email modal close — Cancel in header + overlay (no-op)
  const emailModalCancelBtn = document.getElementById(
    "user-profile-modal-cancel",
  );
  if (emailModalCancelBtn) {
    emailModalCancelBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      _hideUserProfileEmailModal();
      _showUserProfileSettingsView();
    });
  }
  if (emailModalBackBtn) {
    emailModalBackBtn.addEventListener("click", _hideUserProfileEmailModal);
  }

  // Email modal resend button — resend code with 60-second cooldown
  if (emailModalResendBtn) {
    emailModalResendBtn.addEventListener("click", async () => {
      const until = Number(localStorage.getItem(_EC_CD_KEY) || 0);
      const remaining = until - Date.now();
      if (remaining > 0) {
        _setEmailModalNote(
          "Wait " + Math.ceil(remaining / 1000) + "s before resending",
        );
        return;
      }
      const newEmailInput = document.getElementById("user-email-modal-new");
      const toEmail = (newEmailInput ? newEmailInput.value : "").trim();
      if (!toEmail) {
        _setEmailModalNote("Enter your new email first");
        return;
      }
      const code = String(Math.floor(1000 + Math.random() * 9000));
      localStorage.setItem(_EC_CODE_KEY, code);
      localStorage.setItem(_EC_CD_KEY, String(Date.now() + 60000));
      _setEmailModalNote("Resending…");
      const ok = await _sendEmailChangeCode(toEmail, code);
      if (ok) {
        _setEmailModalNote(
          "New code sent! Check your inbox — also check spam/junk folder.",
        );
      } else {
        _setEmailModalNote("Failed to resend. Try again.");
      }
    });
  }

  // Email modal confirm button — Step 1: send code  /  Step 2: verify & update
  if (emailModalConfirmBtn) {
    emailModalConfirmBtn.addEventListener("click", async () => {
      const newEmailInput = document.getElementById("user-email-modal-new");
      const newEmail = (newEmailInput ? newEmailInput.value : "").trim();
      const codeSent = !!localStorage.getItem(_EC_CODE_KEY);

      if (!codeSent) {
        // ── Step 1: validate new email and send code ──
        if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
          _setEmailModalNote("Enter a valid new email address");
          return;
        }
        const currentUser = _getAuthUser();
        if (
          currentUser &&
          _normalizeEmailLocal(currentUser.email) ===
            _normalizeEmailLocal(newEmail)
        ) {
          _setEmailModalNote("That is already your current email");
          return;
        }
        const code = String(Math.floor(1000 + Math.random() * 9000));
        localStorage.setItem(_EC_CODE_KEY, code);
        localStorage.setItem(_EC_CD_KEY, String(Date.now() + 60000));
        _setEmailModalNote("Sending code…");
        const ok = await _sendEmailChangeCode(newEmail, code);
        if (ok) {
          // Step 1 complete — reveal verify section and update button
          const verifySection = document.getElementById(
            "email-modal-verify-section",
          );
          if (verifySection) verifySection.style.display = "";
          if (emailModalConfirmBtn) emailModalConfirmBtn.textContent = "Verify";
          _setEmailModalNote(
            "Code sent! Check your inbox — also check spam/junk folder.",
          );
        } else {
          localStorage.removeItem(_EC_CODE_KEY);
          _setEmailModalNote("Failed to send code. Try again.");
        }
      } else {
        // ── Step 2: validate passcode and update email ──
        const passcodeInputs = document.querySelectorAll(
          ".auth-passcode-input",
        );
        const passcode = Array.from(passcodeInputs)
          .map((i) => i.value)
          .join("");
        const savedCode = localStorage.getItem(_EC_CODE_KEY) || "";

        if (passcode.length !== 4) {
          _setEmailModalNote("Enter all 4 digits of the code");
          return;
        }
        if (passcode !== savedCode) {
          _setEmailModalNote("Invalid code — try again");
          return;
        }

        const user = _getAuthUser();
        if (user) {
          const oldEmail = user.email;
          user.email = newEmail;
          _saveAuthUser(user);

          // Sync to account object
          const acct = JSON.parse(
            localStorage.getItem("mt_auth_account") || "null",
          );
          if (acct) {
            acct.email = newEmail;
            localStorage.setItem("mt_auth_account", JSON.stringify(acct));
          }

          // Sync to DataStore (users + accounts)
          if (typeof DataStore !== "undefined") {
            const allUsers = DataStore.getAll("users");
            const uMatch = allUsers.find(
              (u) =>
                u.userId === user.id ||
                _normalizeEmailLocal(u.email || "") ===
                  _normalizeEmailLocal(oldEmail),
            );
            if (uMatch) {
              DataStore.update("users", uMatch.id, { email: newEmail });
            }
            const allAccounts = DataStore.getAll("accounts");
            const aMatch = allAccounts.find(
              (a) =>
                a.userId === user.id ||
                _normalizeEmailLocal(a.email || "") ===
                  _normalizeEmailLocal(oldEmail),
            );
            if (aMatch) {
              DataStore.update("accounts", aMatch.id, { email: newEmail });
            }
          }
        }

        localStorage.removeItem(_EC_CODE_KEY);
        localStorage.removeItem(_EC_CD_KEY);
        _setEmailModalNote("Email updated successfully!", true);
        // Reset modal back to step 1 state
        const verifySection = document.getElementById(
          "email-modal-verify-section",
        );
        if (verifySection) verifySection.style.display = "none";
        if (emailModalConfirmBtn)
          emailModalConfirmBtn.textContent = "Send Code";
        setTimeout(() => {
          refreshUserProfile();
          _hideUserProfileEmailModal();
          _showUserProfileSettingsView();
        }, 1200);
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
  if (homeToolkitBtn)
    homeToolkitBtn.addEventListener("click", _showUserProfileMainView);

  // Clicking anywhere in the profile header row (not settings icon) navigates home
  const mainHeaderRow = document.querySelector(
    "#user-profile-main-view .user-profile-header-row",
  );
  const settingsHeaderRow = document.querySelector(
    "#user-profile-settings-view .user-profile-header-row",
  );
  const toolkitHeaderRow = document.querySelector(
    "#user-profile-toolkit-view .user-profile-header-row",
  );
  [mainHeaderRow, settingsHeaderRow, toolkitHeaderRow].forEach((row) => {
    if (!row) return;
    row.addEventListener("click", (e) => {
      // Only navigate if the click wasn't on the settings icon button
      // Ignore clicks on settings and toolkit header icons
      if (
        !e.target.closest(".user-profile-header-settings") &&
        !e.target.closest(".user-profile-header-toolkit")
      ) {
        _showUserProfileMainView();
      }
    });
  });

  if (openSettingsBtn)
    openSettingsBtn.addEventListener("click", () => {
      refreshUserProfile();
      _showUserProfileSettingsView();
    });

  if (toolkitBtn)
    toolkitBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      refreshUserProfile();
      _showUserProfileToolkitView();
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

      // Show local preview immediately
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const localPreview = String(ev.target.result || settingsAvatar.src);
        settingsAvatar.src = localPreview;

        // Upload to imgbb; on success, persist URL to localStorage so it survives refresh
        const imgbbUrl = await _uploadToImgbb(file);
        if (imgbbUrl) {
          settingsAvatar.src = imgbbUrl;
          // Immediately persist to auth_user so it survives without pressing Save
          const u = _getAuthUser();
          if (u) {
            u.avatar = imgbbUrl;
            _saveAuthUser(u);
            const acct = JSON.parse(
              localStorage.getItem("mt_auth_account") || "null",
            );
            if (acct) {
              acct.avatar = imgbbUrl;
              localStorage.setItem("mt_auth_account", JSON.stringify(acct));
            }
          }
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

      // Sync to DataStore users so admin panel reflects changes in real time
      if (typeof DataStore !== "undefined") {
        const users = DataStore.getAll("users");
        const match = users.find(
          (u) => u.userId === user.id || u.email === user.email,
        );
        if (match) {
          DataStore.update("users", match.id, {
            username: user.name,
            gender: user.gender,
            marital: user.status,
            avatar: user.avatar,
          });
        }
        // Also sync accounts collection so global sign-in uses new data
        const accounts = DataStore.getAll("accounts");
        const acctMatch = accounts.find(
          (a) => a.userId === user.id || a.email === user.email,
        );
        if (acctMatch) {
          DataStore.update("accounts", acctMatch.id, {
            username: user.name,
            gender: user.gender,
            marital: user.status,
            avatar: user.avatar,
          });
        }
      }

      // Mirror to local account object
      const acct = JSON.parse(
        localStorage.getItem("mt_auth_account") || "null",
      );
      if (acct) {
        acct.username = user.name;
        acct.gender = user.gender;
        acct.marital = user.status;
        acct.avatar = user.avatar;
        localStorage.setItem("mt_auth_account", JSON.stringify(acct));
      }

      refreshUserProfile();
      _showUserProfileMainView();
    });
  }

  if (contactBtn) {
    contactBtn.addEventListener("click", () => {
      const email = "Support@getinwithgame.com";
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(email)
          .then(() => {
            const span = document.getElementById("user-profile-contact-value");
            if (span) {
              span.textContent = "Copied!";
              setTimeout(() => {
                span.textContent = "Copy Email";
              }, 2000);
            }
          })
          .catch(() => {
            const span = document.getElementById("user-profile-contact-value");
            if (span) span.textContent = email;
          });
      } else {
        // Fallback: show the email as text
        const span = document.getElementById("user-profile-contact-value");
        if (span) span.textContent = email;
      }
    });
  }
}

// Setup Toolkit interactions (moved from js/user-toolkit.js)
function setupUserToolkitInteractions() {
  const toolkitPage = document.getElementById("user-profile-toolkit-view");
  const toolkitBookPage = document.getElementById("user-toolkit-book-page");
  const toolkitBackBtn = document.getElementById("user-toolkit-back-btn");
  const toolkitBookBackBtn = document.getElementById(
    "user-toolkit-book-back-btn",
  );
  const toolkitBookTiles = document.querySelectorAll(".user-toolkit-book-tile");
  const toolkitDownloadBtn = document.getElementById(
    "user-toolkit-download-btn",
  );

  // Back from toolkit to profile main
  if (toolkitBackBtn) {
    toolkitBackBtn.addEventListener("click", function () {
      _showUserProfileMainView();
    });
  }

  // Book tile click → open book details
  if (toolkitBookTiles && toolkitBookPage) {
    toolkitBookTiles.forEach(function (tile) {
      tile.addEventListener("click", function () {
        if (toolkitPage) toolkitPage.style.display = "none";
        if (toolkitBookPage) toolkitBookPage.style.display = "flex";
        window.scrollTo(0, 0);
      });
    });
  }

  // Back from book details to toolkit
  if (toolkitBookBackBtn && toolkitPage) {
    toolkitBookBackBtn.addEventListener("click", function () {
      if (toolkitBookPage) toolkitBookPage.style.display = "none";
      if (toolkitPage) toolkitPage.style.display = "flex";
      window.scrollTo(0, 0);
    });
  }

  // Download button (demo)
  if (toolkitDownloadBtn) {
    toolkitDownloadBtn.addEventListener("click", function () {
      alert("Download started (demo only)");
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
setupUserToolkitInteractions();
setupUserProfileLogout();
