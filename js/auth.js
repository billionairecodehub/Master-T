// ── Auth Gateway: Get Started → Sign-Up/Sign-In → Verify → Transition → Home ──

const AUTH_STATE_KEY = "mt_auth_state";
const AUTH_USER_KEY = "mt_auth_user";
const AUTH_ACCOUNT_KEY = "mt_auth_account";
const AUTH_SIGNUP_CODE_KEY = "mt_auth_signup_code";
const AUTH_SIGNUP_COOLDOWN_KEY = "mt_auth_signup_cd_until";
const AUTH_FORGOT_CODE_KEY = "mt_auth_forgot_code";
const AUTH_POST_LOGIN_TRANSITION_MS = 5000;
const AUTH_LOGIN_FREE_PASS = true;

const _authState = {
  signupStep: 1,
  signupGender: "",
  signupStatus: "",
  pendingSignup: null,
  busy: false,
  postLoginTimer: null,
};

function _setGatewayVisible(showAuth) {
  const authPage = document.getElementById("auth-page");
  const main = document.querySelector(".main");
  if (authPage) authPage.style.display = showAuth ? "flex" : "none";
  if (main) main.style.display = showAuth ? "none" : "block";
}

function getAuthState() {
  return localStorage.getItem(AUTH_STATE_KEY) || "unauthenticated";
}

function setAuthState(state) {
  localStorage.setItem(AUTH_STATE_KEY, state);
}

function isUserAuthenticated() {
  return (
    getAuthState() === "authenticated" && !!localStorage.getItem(AUTH_USER_KEY)
  );
}

function _getAccount() {
  const raw = localStorage.getItem(AUTH_ACCOUNT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function _setAccount(account) {
  localStorage.setItem(AUTH_ACCOUNT_KEY, JSON.stringify(account));
}

function _setUserSessionFromAccount(account) {
  const user = {
    id: account.id,
    email: account.email,
    name: account.username || account.fullName || "User",
    avatar:
      account.avatar ||
      "https://i.postimg.cc/nhdyR4kF/Mt-Profile-Fallback-Img.png",
    gender: account.gender || "Male",
    status: account.marital || "Single",
    joinedAt: account.joinedAt || Date.now(),
  };
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

function _qs(id) {
  return document.getElementById(id);
}

function _setNote(noteId, text, ok = false) {
  const el = _qs(noteId);
  if (!el) return;
  el.textContent = text || "";
  if (ok) el.classList.add("success");
  else el.classList.remove("success");
}

function _clearAllNotes() {
  _setNote("auth-signup-note", "");
  _setNote("auth-signin-note", "");
  _setNote("auth-verify-note", "");
  _setNote("auth-forgot-note", "");
}

function showAuthScreen(screenId) {
  const screens = document.querySelectorAll(".auth-screen");
  screens.forEach((s) => s.classList.remove("is-active"));
  const screen = _qs(screenId);
  if (screen) screen.classList.add("is-active");
  _clearAllNotes();
}

function _showSignupStep(step) {
  _authState.signupStep = step === 2 ? 2 : 1;
  const step1 = _qs("auth-signup-step-1");
  const step2 = _qs("auth-signup-step-2");
  if (step1) step1.classList.toggle("is-active", _authState.signupStep === 1);
  if (step2) step2.classList.toggle("is-active", _authState.signupStep === 2);
}

function _setChoice(group, value) {
  const selector = group === "gender" ? "[data-gender]" : "[data-status]";
  document.querySelectorAll(selector).forEach((btn) => {
    const isSelected =
      (group === "gender" && btn.getAttribute("data-gender") === value) ||
      (group === "status" && btn.getAttribute("data-status") === value);
    btn.classList.toggle("is-selected", isSelected);
  });
  if (group === "gender") _authState.signupGender = value;
  else _authState.signupStatus = value;
}

function _normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function _isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function _generateCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function _setSignupCode() {
  const code = _generateCode();
  localStorage.setItem(AUTH_SIGNUP_CODE_KEY, code);
  localStorage.setItem(
    AUTH_SIGNUP_COOLDOWN_KEY,
    String(Date.now() + 120 * 1000),
  );
  return code;
}

function _getSignupCode() {
  return localStorage.getItem(AUTH_SIGNUP_CODE_KEY) || "";
}

function _getSignupCooldownMs() {
  const until = Number(localStorage.getItem(AUTH_SIGNUP_COOLDOWN_KEY) || "0");
  return Math.max(0, until - Date.now());
}

function _getPasscodeFromInputs(containerId) {
  const container = _qs(containerId);
  if (!container) return "";
  const inputs = Array.from(container.querySelectorAll(".auth-passcode-input"));
  return inputs.map((i) => (i.value || "").trim()).join("");
}

function _clearPasscodeInputs(containerId) {
  const container = _qs(containerId);
  if (!container) return;
  container.querySelectorAll(".auth-passcode-input").forEach((i) => {
    i.value = "";
  });
}

function _setupPasscodeNavigation(containerId) {
  const container = _qs(containerId);
  if (!container) return;
  const inputs = Array.from(container.querySelectorAll(".auth-passcode-input"));
  inputs.forEach((input, idx) => {
    input.addEventListener("input", (e) => {
      const val = (e.target.value || "").replace(/\D/g, "");
      e.target.value = val.slice(0, 1);
      if (e.target.value && idx < inputs.length - 1) inputs[idx + 1].focus();
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !e.target.value && idx > 0) {
        inputs[idx - 1].focus();
      }
    });
  });
}

function _openSignup() {
  showAuthScreen("auth-screen-signup");
  _showSignupStep(1);
}

function _openSignin() {
  showAuthScreen("auth-screen-signin");
}

function _buildPendingSignupFromStep1() {
  const fullName = (_qs("su-full-name")?.value || "").trim();
  const email = _normalizeEmail(_qs("su-email")?.value || "");
  const password = (_qs("su-password")?.value || "").trim();
  const confirm = (_qs("su-confirm-password")?.value || "").trim();

  if (!fullName) return { ok: false, msg: "Enter your full name" };
  if (!_isValidEmail(email)) return { ok: false, msg: "Enter a valid email" };
  if (password.length < 4)
    return { ok: false, msg: "Password should be at least 4 characters" };
  if (password !== confirm)
    return { ok: false, msg: "Password and confirm password must match" };

  return {
    ok: true,
    data: {
      fullName,
      email,
      password,
    },
  };
}

function _submitSignupStep1() {
  const result = _buildPendingSignupFromStep1();
  if (!result.ok) {
    _setNote("auth-signup-note", result.msg);
    return;
  }
  _authState.pendingSignup = {
    ...(_authState.pendingSignup || {}),
    ...result.data,
  };
  _showSignupStep(2);
}

function _submitSignupStep2() {
  const username = (_qs("su-username")?.value || "").trim();
  if (!_authState.pendingSignup) {
    _setNote("auth-signup-note", "Complete page 1 first");
    _showSignupStep(1);
    return;
  }
  if (!username) {
    _setNote("auth-signup-note", "Create a username");
    return;
  }
  if (!_authState.signupGender) {
    _setNote("auth-signup-note", "Select gender");
    return;
  }
  if (!_authState.signupStatus) {
    _setNote("auth-signup-note", "Select marital status");
    return;
  }

  _authState.pendingSignup = {
    ..._authState.pendingSignup,
    username,
    gender: _authState.signupGender,
    marital: _authState.signupStatus,
  };

  _setSignupCode();
  _clearPasscodeInputs("auth-passcode-inputs");
  showAuthScreen("auth-screen-verify");
  _setNote(
    "auth-verify-note",
    "Passcode sent. Use Reset after 120s if needed",
    true,
  );
}

function _finalizeSignup() {
  const p = _authState.pendingSignup;
  if (!p) {
    _openSignup();
    _setNote("auth-signup-note", "Restart sign-up process");
    return;
  }

  const account = {
    id: "acc_" + Math.random().toString(36).slice(2, 10),
    fullName: p.fullName,
    email: p.email,
    password: p.password,
    username: p.username,
    gender: p.gender,
    marital: p.marital,
    joinedAt: Date.now(),
    avatar: "https://i.postimg.cc/nhdyR4kF/Mt-Profile-Fallback-Img.png",
  };

  _setAccount(account);
  _setUserSessionFromAccount(account);
  setAuthState("authenticated");
  _authState.pendingSignup = null;

  _showPostLoginTransition();
}

function _verifySignupCode() {
  const code = _getPasscodeFromInputs("auth-passcode-inputs");
  const saved = _getSignupCode();

  if (code.length !== 4) {
    _setNote("auth-verify-note", "Enter full 4-digit passcode");
    return;
  }
  if (!saved || code !== saved) {
    _setNote("auth-verify-note", "Invalid passcode");
    return;
  }

  _finalizeSignup();
}

function _resendSignupCode() {
  const cd = _getSignupCooldownMs();
  if (cd > 0) {
    const sec = Math.ceil(cd / 1000);
    _setNote("auth-verify-note", "Reset available in " + sec + "s");
    return;
  }
  _setSignupCode();
  _setNote("auth-verify-note", "Passcode reset and sent", true);
}

function _signin() {
  const email = _normalizeEmail(_qs("si-email")?.value || "");
  const password = (_qs("si-password")?.value || "").trim();
  const account = _getAccount();

  // Testing mode: allow login without strict credential checks.
  if (AUTH_LOGIN_FREE_PASS) {
    const base = account || {
      id: "acc_" + Math.random().toString(36).slice(2, 10),
      fullName: "Test User",
      email: email || "test@getinwithgame.com",
      password: password || "1234",
      username: "Justbgoodd",
      gender: "Male",
      marital: "Single",
      joinedAt: Date.now(),
      avatar: "https://i.postimg.cc/nhdyR4kF/Mt-Profile-Fallback-Img.png",
    };

    if (email) base.email = email;
    if (password) base.password = password;

    _setAccount(base);
    _setUserSessionFromAccount(base);
    setAuthState("authenticated");
    _showPostLoginTransition();
    return;
  }

  if (!_isValidEmail(email)) {
    _setNote("auth-signin-note", "Enter a valid email");
    return;
  }
  if (!password) {
    _setNote("auth-signin-note", "Enter your password");
    return;
  }
  if (!account) {
    _setNote("auth-signin-note", "No account found. Please sign up first");
    return;
  }
  if (account.email !== email || account.password !== password) {
    _setNote("auth-signin-note", "Incorrect email or password");
    return;
  }

  _setUserSessionFromAccount(account);
  setAuthState("authenticated");
  _showPostLoginTransition();
}

function _openForgotPassword() {
  const account = _getAccount();
  if (!account) {
    _setNote("auth-signin-note", "No account found. Please sign up first");
    return;
  }
  localStorage.setItem(AUTH_FORGOT_CODE_KEY, _generateCode());
  _clearPasscodeInputs("forgot-passcode-inputs");
  showAuthScreen("auth-screen-forgot");
}

function _forgotResend() {
  localStorage.setItem(AUTH_FORGOT_CODE_KEY, _generateCode());
  _setNote("auth-forgot-note", "Passcode re-sent", true);
}

function _forgotReset() {
  const newPass = (_qs("fp-new-password")?.value || "").trim();
  const confirmPass = (_qs("fp-confirm-password")?.value || "").trim();
  const code = _getPasscodeFromInputs("forgot-passcode-inputs");
  const savedCode = localStorage.getItem(AUTH_FORGOT_CODE_KEY) || "";
  const account = _getAccount();

  if (!account) {
    _setNote("auth-forgot-note", "No account found. Please sign up first");
    return;
  }
  if (newPass.length < 4) {
    _setNote(
      "auth-forgot-note",
      "New password should be at least 4 characters",
    );
    return;
  }
  if (newPass !== confirmPass) {
    _setNote("auth-forgot-note", "Passwords do not match");
    return;
  }
  if (code.length !== 4) {
    _setNote("auth-forgot-note", "Enter full 4-digit passcode");
    return;
  }
  if (!savedCode || code !== savedCode) {
    _setNote("auth-forgot-note", "Invalid passcode");
    return;
  }

  account.password = newPass;
  _setAccount(account);
  _setNote("auth-forgot-note", "Password reset complete", true);
  setTimeout(() => {
    _openSignin();
  }, 400);
}

function _showPostLoginTransition() {
  if (_authState.busy) return;
  _authState.busy = true;
  showAuthScreen("auth-screen-transition");
  _setGatewayVisible(true);

  if (_authState.postLoginTimer) clearTimeout(_authState.postLoginTimer);
  _authState.postLoginTimer = setTimeout(() => {
    _setGatewayVisible(false);
    if (
      typeof showPage === "function" &&
      typeof homePage !== "undefined" &&
      homePage
    ) {
      showPage(homePage);
      if (typeof _setActiveNav === "function") _setActiveNav("home");
    }
    if (typeof _navigateTo === "function") _navigateTo("/");
    _authState.busy = false;
  }, AUTH_POST_LOGIN_TRANSITION_MS);
}

function _setupListeners() {
  const btnStart = _qs("auth-btn-start");
  if (btnStart) {
    btnStart.addEventListener("click", () => {
      _openSignup();
    });
  }

  const tabSignup = _qs("auth-tab-signup");
  const tabSignin = _qs("auth-tab-signin");
  const tabSignup2 = _qs("auth-tab-signup-2");
  const tabSignin2 = _qs("auth-tab-signin-2");
  if (tabSignup) tabSignup.addEventListener("click", _openSignup);
  if (tabSignup2) tabSignup2.addEventListener("click", _openSignup);
  if (tabSignin) tabSignin.addEventListener("click", _openSignin);
  if (tabSignin2) tabSignin2.addEventListener("click", _openSignin);

  const suContinue = _qs("auth-signup-continue");
  const suBack = _qs("auth-signup-back");
  const suSubmit = _qs("auth-signup-submit");
  if (suContinue) suContinue.addEventListener("click", _submitSignupStep1);
  if (suBack) suBack.addEventListener("click", () => _showSignupStep(1));
  if (suSubmit) suSubmit.addEventListener("click", _submitSignupStep2);

  document.querySelectorAll("[data-gender]").forEach((btn) => {
    btn.addEventListener("click", () => {
      _setChoice("gender", btn.getAttribute("data-gender") || "");
    });
  });
  document.querySelectorAll("[data-status]").forEach((btn) => {
    btn.addEventListener("click", () => {
      _setChoice("status", btn.getAttribute("data-status") || "");
    });
  });

  const siSubmit = _qs("auth-signin-submit");
  if (siSubmit) siSubmit.addEventListener("click", _signin);

  const forgotOpen = _qs("auth-forgot-open");
  const forgotBack = _qs("auth-forgot-back");
  const forgotResend = _qs("auth-forgot-resend");
  const forgotReset = _qs("auth-forgot-reset");
  const supportBtn = _qs("auth-contact-support");
  if (forgotOpen) forgotOpen.addEventListener("click", _openForgotPassword);
  if (forgotBack) forgotBack.addEventListener("click", _openSignin);
  if (forgotResend) forgotResend.addEventListener("click", _forgotResend);
  if (forgotReset) forgotReset.addEventListener("click", _forgotReset);
  if (supportBtn) {
    supportBtn.addEventListener("click", () => {
      window.location.href =
        "mailto:support@getinwithgame.com?subject=Password%20Reset%20Support";
    });
  }

  const verifyBack = _qs("auth-verify-back");
  const verifyReset = _qs("auth-verify-reset");
  const verifySubmit = _qs("auth-verify-submit");
  if (verifyBack) {
    verifyBack.addEventListener("click", () => {
      _openSignup();
      _showSignupStep(2);
    });
  }
  if (verifyReset) verifyReset.addEventListener("click", _resendSignupCode);
  if (verifySubmit) verifySubmit.addEventListener("click", _verifySignupCode);

  _setupPasscodeNavigation("auth-passcode-inputs");
  _setupPasscodeNavigation("forgot-passcode-inputs");
}

function initAuthFlow() {
  _setupListeners();

  if (isUserAuthenticated()) {
    _setGatewayVisible(false);
    return;
  }

  showAuthScreen("auth-screen-start");
  _setGatewayVisible(true);
}

initAuthFlow();
