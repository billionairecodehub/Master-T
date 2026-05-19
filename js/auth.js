// ── Auth Gateway: Get Started → Sign-Up → Verify → Sign-In → Transition → Home ──

const AUTH_STATE_KEY = "mt_auth_state";
const AUTH_USER_KEY = "mt_auth_user";
const AUTH_ACCOUNT_KEY = "mt_auth_account";
const AUTH_SIGNUP_CODE_KEY = "mt_auth_signup_code";
const AUTH_SIGNUP_COOLDOWN_KEY = "mt_auth_signup_cd_until";
const AUTH_FORGOT_CODE_KEY = "mt_auth_forgot_code";
const AUTH_FORGOT_COOLDOWN_KEY = "mt_auth_forgot_cd_until";
const AUTH_FORGOT_EMAIL_KEY = "mt_auth_forgot_email";
const AUTH_POST_LOGIN_TRANSITION_MS = 1000; // refresh  → 1 s
const AUTH_LOGIN_TRANSITION_MS = 3000; // fresh login → 3 s
const AUTH_START_SEEN_KEY = "mt_auth_start_seen";

// ── EmailJS configuration ─────────────────────────────────────────────────────
// To enable real email verification:
//   1. Sign up at https://www.emailjs.com/ (free tier is enough)
//   2. Add an email service (Gmail, Outlook, etc.)
//   3. Create a template using variables: {{to_email}}, {{verification_code}}, {{app_name}}
//   4. Replace the three placeholder strings below with your actual credentials
const EMAILJS_PUBLIC_KEY = "Fqk76Goc02oUIhWSJ"; // matches emailjs.init() in index.html
const EMAILJS_SERVICE_ID = "service_v3anekc"; // replace with your EmailJS Service ID
const EMAILJS_TEMPLATE_ID = "template_cd909qw"; // replace with your EmailJS Template ID
// ──────────────────────────────────────────────────────────────────────────────

const _emailjsEnabled = () =>
  !EMAILJS_PUBLIC_KEY.startsWith("YOUR_") &&
  !EMAILJS_SERVICE_ID.startsWith("YOUR_") &&
  !EMAILJS_TEMPLATE_ID.startsWith("YOUR_");

let _emailjsReady = false;

const _authState = {
  signupStep: 1,
  signupGender: "",
  signupStatus: "",
  pendingSignup: null,
  forgotStep: 1,
  busy: false,
  postLoginTimer: null,
};

function _setGatewayVisible(showAuth) {
  const authPage = document.getElementById("auth-page");
  const main = document.querySelector(".main");
  if (authPage) authPage.style.display = showAuth ? "flex" : "none";
  if (main) main.style.display = showAuth ? "none" : "block";
}

function _hideBootSplash() {
  const splash = document.getElementById("boot-splash");
  if (!splash) return;
  splash.classList.add("is-hidden");
  setTimeout(() => {
    if (splash && splash.parentNode) splash.parentNode.removeChild(splash);
  }, 260);
}

// ── User database (sanitised records synced to Firebase via DataStore) ─────────

function _emailExistsInDb(email) {
  const normalized = _normalizeEmail(email);
  const account = _getAccount();
  if (account && _normalizeEmail(account.email) === normalized) return true;
  if (typeof DataStore !== "undefined") {
    const accounts = DataStore.getAll("accounts");
    if (accounts.some((a) => _normalizeEmail(a.email || "") === normalized))
      return true;
    const users = DataStore.getAll("users");
    if (users.some((u) => _normalizeEmail(u.email || "") === normalized))
      return true;
  }
  return false;
}

function _addUserToDb(account) {
  if (typeof DataStore === "undefined") return;
  DataStore.add("users", {
    userId: account.id,
    fullName: account.fullName,
    email: account.email,
    username: account.username,
    gender: account.gender,
    marital: account.marital,
    joinedAt: account.joinedAt,
    avatar: account.avatar,
    signupAt: new Date().toISOString(),
  });
  // Also store credentials so the user can sign in from any device
  DataStore.add("accounts", {
    userId: account.id,
    email: account.email,
    password: account.password,
    username: account.username,
    fullName: account.fullName,
    gender: account.gender,
    marital: account.marital,
    avatar: account.avatar,
    joinedAt: account.joinedAt,
  });
}

// ── EmailJS ───────────────────────────────────────────────────────────────────

async function _loadEmailJs() {
  if (_emailjsReady || window.emailjs) {
    _emailjsReady = true;
    return true;
  }
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";
    s.onload = () => {
      window.emailjs.init(EMAILJS_PUBLIC_KEY);
      _emailjsReady = true;
      resolve(true);
    };
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });
}

async function _sendVerificationEmail(toEmail, code) {
  if (!_emailjsEnabled()) {
    console.log(`[AUTH DEV] Code for ${toEmail}: ${code}`);
    return { ok: true, devCode: code };
  }
  const loaded = await _loadEmailJs();
  if (!loaded) return { ok: false };
  try {
    await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      to_email: toEmail,
      verification_code: code,
      app_name: "Master Togan",
    });
    return { ok: true };
  } catch (e) {
    console.error("[AUTH] Email send failed:", e);
    return { ok: false };
  }
}

function _markStartSeen() {
  localStorage.setItem(AUTH_START_SEEN_KEY, "1");
}

function _hasSeenStart() {
  return localStorage.getItem(AUTH_START_SEEN_KEY) === "1";
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
  _hideBootSplash();
  _clearAllNotes();
}

function _showSignupStep(step) {
  _authState.signupStep = step === 2 ? 2 : 1;
  const step1 = _qs("auth-signup-step-1");
  const step2 = _qs("auth-signup-step-2");
  if (step1) step1.classList.toggle("is-active", _authState.signupStep === 1);
  if (step2) step2.classList.toggle("is-active", _authState.signupStep === 2);
  _setNote("auth-signup-note", "");
}

function _setSignupChoice(group, value) {
  const selector = group === "gender" ? "[data-gender]" : "[data-status]";
  document.querySelectorAll(selector).forEach((btn) => {
    const isSelected =
      (group === "gender" && btn.getAttribute("data-gender") === value) ||
      (group === "status" && btn.getAttribute("data-status") === value);
    btn.classList.toggle("is-selected", isSelected);
  });
  if (group === "gender") _authState.signupGender = value;
  else _authState.signupStatus = value;
  _setNote("auth-signup-note", "");
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
    String(Date.now() + 60 * 1000),
  );
  return code;
}

function _setForgotCode() {
  const code = _generateCode();
  localStorage.setItem(AUTH_FORGOT_CODE_KEY, code);
  localStorage.setItem(
    AUTH_FORGOT_COOLDOWN_KEY,
    String(Date.now() + 60 * 1000),
  );
  return code;
}

function _getForgotCooldownMs() {
  const until = Number(localStorage.getItem(AUTH_FORGOT_COOLDOWN_KEY) || "0");
  return Math.max(0, until - Date.now());
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
  _markStartSeen();
  showAuthScreen("auth-screen-signup");
  _showSignupStep(1);
}

function _openSignin() {
  _markStartSeen();
  showAuthScreen("auth-screen-signin");
}

function _showForgotStep(step) {
  _authState.forgotStep = step === 2 ? 2 : 1;
  const s1 = document.getElementById("auth-forgot-step-1");
  const s2 = document.getElementById("auth-forgot-step-2");
  if (s1) s1.classList.toggle("is-active", _authState.forgotStep === 1);
  if (s2) s2.classList.toggle("is-active", _authState.forgotStep === 2);
}

function _buildPendingSignupFromStep1() {
  const fullName = (_qs("su-full-name")?.value || "").trim();
  const email = _normalizeEmail(_qs("su-email")?.value || "");
  const password = (_qs("su-password")?.value || "").trim();
  const confirm = (_qs("su-confirm-password")?.value || "").trim();

  if (!fullName) return { ok: false, msg: "Enter your full name" };
  if (!_isValidEmail(email)) return { ok: false, msg: "Enter a valid email" };
  if (password.length < 4)
    return { ok: false, msg: "Password must be at least 4 characters" };
  if (password !== confirm)
    return { ok: false, msg: "Password and confirm password must match" };
  if (_emailExistsInDb(email))
    return { ok: false, msg: "An account with this email already exists" };

  return {
    ok: true,
    data: { fullName, email, password },
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
  // Reset choice selections so the user always starts step 2 fresh
  _authState.signupGender = "";
  _authState.signupStatus = "";
  document
    .querySelectorAll("[data-gender],[data-status]")
    .forEach((b) => b.classList.remove("is-selected"));
  _showSignupStep(2);
}

async function _submitSignupStep2() {
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
    _setNote("auth-signup-note", "Select your gender");
    return;
  }
  if (!_authState.signupStatus) {
    _setNote("auth-signup-note", "Select your marital status");
    return;
  }

  _authState.pendingSignup = {
    ..._authState.pendingSignup,
    username,
    gender: _authState.signupGender,
    marital: _authState.signupStatus,
  };

  const code = _setSignupCode();
  _clearPasscodeInputs("auth-passcode-inputs");
  showAuthScreen("auth-screen-verify");
  _setNote("auth-verify-note", "Sending verification code…");

  const result = await _sendVerificationEmail(
    _authState.pendingSignup.email,
    code,
  );
  if (result.ok) {
    if (result.devCode) {
      _setNote(
        "auth-verify-note",
        `[Dev] Code: ${result.devCode} — configure EmailJS for real emails`,
        true,
      );
    } else {
      _setNote(
        "auth-verify-note",
        "Code sent! Check inbox — also check spam/junk folder.",
        true,
      );
    }
  } else {
    _setNote(
      "auth-verify-note",
      "Could not send email — check your connection or EmailJS config",
    );
  }
}

function _finalizeSignup() {
  const p = _authState.pendingSignup;
  if (!p) {
    _openSignup();
    _setNote("auth-signup-note", "Session expired — restart sign-up");
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
  _addUserToDb(account); // push sanitised record (no password) to Firebase
  _authState.pendingSignup = null;

  // Pre-fill Sign-In so user can log in immediately
  const siEmail = _qs("si-email");
  const siPass = _qs("si-password");
  if (siEmail) siEmail.value = account.email;
  if (siPass) siPass.value = account.password;

  // Redirect to Sign-In — do NOT auto-login
  _openSignin();
  _setNote("auth-signin-note", "Account created! Log in to continue.", true);
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
    _setNote("auth-verify-note", `Wait ${sec}s before resending`);
    return;
  }
  const code = _setSignupCode();
  if (!_authState.pendingSignup?.email) {
    _setNote("auth-verify-note", "Session expired — please sign up again");
    return;
  }
  _setNote("auth-verify-note", "Resending…");
  _sendVerificationEmail(_authState.pendingSignup.email, code).then(
    (result) => {
      if (result.ok) {
        if (result.devCode) {
          _setNote(
            "auth-verify-note",
            `[Dev] New code: ${result.devCode}`,
            true,
          );
        } else {
          _setNote(
            "auth-verify-note",
            "New code sent! Check inbox — also spam/junk folder.",
            true,
          );
        }
      } else {
        _setNote("auth-verify-note", "Failed to resend — try again");
      }
    },
  );
}

async function _signin() {
  const email = _normalizeEmail(_qs("si-email")?.value || "");
  const password = (_qs("si-password")?.value || "").trim();

  if (!_isValidEmail(email)) {
    _setNote("auth-signin-note", "Enter a valid email");
    return;
  }
  if (!password) {
    _setNote("auth-signin-note", "Enter your password");
    return;
  }

  // Validate against the Firebase-synced accounts collection only.
  // Local-only (legacy) mt_auth_account entries are intentionally ignored.
  _setNote("auth-signin-note", "Signing in…");
  let remoteAcct = null;
  if (typeof DataStore !== "undefined") {
    const all = DataStore.getAll("accounts");
    remoteAcct =
      all.find(
        (a) =>
          _normalizeEmail(a.email || "") === email && a.password === password,
      ) || null;
  }

  if (!remoteAcct) {
    _setNote("auth-signin-note", "Incorrect email or password");
    return;
  }

  // Hydrate local session from the remote record so the app works offline
  const restored = {
    id: remoteAcct.userId || remoteAcct.id,
    email: remoteAcct.email,
    password: remoteAcct.password,
    username: remoteAcct.username || "",
    fullName: remoteAcct.fullName || "",
    gender: remoteAcct.gender || "",
    marital: remoteAcct.marital || "",
    joinedAt: remoteAcct.joinedAt || Date.now(),
    avatar:
      remoteAcct.avatar ||
      "https://i.postimg.cc/nhdyR4kF/Mt-Profile-Fallback-Img.png",
  };
  _setAccount(restored);
  localStorage.setItem(
    "mt_auth_user",
    JSON.stringify({
      id: restored.id,
      email: restored.email,
      name: restored.username || restored.fullName,
      gender: restored.gender,
      status: restored.marital,
      avatar: restored.avatar,
      joinedAt: restored.joinedAt,
    }),
  );

  _setUserSessionFromAccount(restored);
  setAuthState("authenticated");
  _showPostLoginTransition(true); // fresh login → 3 s splash
}

function _openForgotPassword() {
  _authState.forgotStep = 1;
  showAuthScreen("auth-screen-forgot");
  _showForgotStep(1);
  _clearPasscodeInputs("forgot-passcode-inputs");
}

async function _forgotSendCode() {
  const email = _normalizeEmail(_qs("fp-email")?.value || "");
  if (!_isValidEmail(email)) {
    _setNote("auth-forgot-note", "Enter a valid email");
    return;
  }
  if (!_emailExistsInDb(email)) {
    _setNote("auth-forgot-note", "No account found with this email");
    return;
  }
  const cd = _getForgotCooldownMs();
  if (cd > 0) {
    _setNote(
      "auth-forgot-note",
      `Wait ${Math.ceil(cd / 1000)}s before resending`,
    );
    return;
  }

  localStorage.setItem(AUTH_FORGOT_EMAIL_KEY, email);
  const code = _setForgotCode();
  _clearPasscodeInputs("forgot-passcode-inputs");
  _setNote("auth-forgot-note", "Sending code…");

  const result = await _sendVerificationEmail(email, code);
  if (result.ok) {
    if (result.devCode) {
      _setNote("auth-forgot-note", `[Dev] Code: ${result.devCode}`, true);
    } else {
      _setNote(
        "auth-forgot-note",
        "Code sent! Check inbox — also check spam/junk folder.",
        true,
      );
    }
    _showForgotStep(2);
  } else {
    _setNote(
      "auth-forgot-note",
      "Failed to send code — check your email and try again",
    );
  }
}

function _forgotResend() {
  const cd = _getForgotCooldownMs();
  if (cd > 0) {
    _setNote(
      "auth-forgot-note",
      `Wait ${Math.ceil(cd / 1000)}s before resending`,
    );
    return;
  }
  const email = localStorage.getItem(AUTH_FORGOT_EMAIL_KEY) || "";
  if (!email) {
    _setNote("auth-forgot-note", "Session expired — start over");
    _showForgotStep(1);
    return;
  }
  const code = _setForgotCode();
  _setNote("auth-forgot-note", "Resending…");
  _sendVerificationEmail(email, code).then((result) => {
    if (result.ok) {
      if (result.devCode) {
        _setNote("auth-forgot-note", `[Dev] New code: ${result.devCode}`, true);
      } else {
        _setNote(
          "auth-forgot-note",
          "New code sent! Check spam/junk if not in inbox.",
          true,
        );
      }
    } else {
      _setNote("auth-forgot-note", "Failed to resend — try again");
    }
  });
}

function _forgotReset() {
  const newPass = (_qs("fp-new-password")?.value || "").trim();
  const confirmPass = (_qs("fp-confirm-password")?.value || "").trim();
  const code = _getPasscodeFromInputs("forgot-passcode-inputs");
  const savedCode = localStorage.getItem(AUTH_FORGOT_CODE_KEY) || "";
  const resetEmail = localStorage.getItem(AUTH_FORGOT_EMAIL_KEY) || "";
  const localAccount = _getAccount();

  if (!resetEmail) {
    _setNote("auth-forgot-note", "Session expired — start over");
    _showForgotStep(1);
    return;
  }
  if (newPass.length < 4) {
    _setNote("auth-forgot-note", "Password must be at least 4 characters");
    return;
  }
  if (newPass !== confirmPass) {
    _setNote("auth-forgot-note", "Passwords do not match");
    return;
  }
  if (code.length !== 4) {
    _setNote("auth-forgot-note", "Enter the full 4-digit passcode");
    return;
  }
  if (!savedCode || code !== savedCode) {
    _setNote("auth-forgot-note", "Invalid passcode");
    return;
  }

  // DB-first password reset: update existing account by email, or create one
  // after successful email verification if legacy data has no accounts record.
  let resolvedAccount = null;
  if (typeof DataStore !== "undefined") {
    const allAccounts = DataStore.getAll("accounts");
    const dbAcct = allAccounts.find(
      (a) => _normalizeEmail(a.email || "") === _normalizeEmail(resetEmail),
    );

    if (dbAcct) {
      DataStore.update("accounts", dbAcct.id, { password: newPass });
      resolvedAccount = { ...dbAcct, password: newPass };
    } else {
      const allUsers = DataStore.getAll("users");
      const dbUser = allUsers.find(
        (u) => _normalizeEmail(u.email || "") === _normalizeEmail(resetEmail),
      );
      const newDbAccount = {
        userId:
          (dbUser && (dbUser.userId || dbUser.id)) ||
          (localAccount && localAccount.id) ||
          "acc_" + Math.random().toString(36).slice(2, 10),
        email: resetEmail,
        password: newPass,
        username:
          (dbUser && (dbUser.username || dbUser.fullName)) ||
          (localAccount && (localAccount.username || localAccount.fullName)) ||
          "",
        fullName:
          (dbUser && dbUser.fullName) ||
          (localAccount && localAccount.fullName) ||
          "",
        gender:
          (dbUser && dbUser.gender) ||
          (localAccount && localAccount.gender) ||
          "",
        marital:
          (dbUser && dbUser.marital) ||
          (localAccount && localAccount.marital) ||
          "",
        avatar:
          (dbUser && dbUser.avatar) ||
          (localAccount && localAccount.avatar) ||
          "https://i.postimg.cc/nhdyR4kF/Mt-Profile-Fallback-Img.png",
        joinedAt:
          (dbUser && dbUser.joinedAt) ||
          (localAccount && localAccount.joinedAt) ||
          Date.now(),
      };
      DataStore.add("accounts", newDbAccount);
      resolvedAccount = newDbAccount;
    }
  }

  // Keep local cache aligned with DB credential source.
  if (resolvedAccount) {
    const nextLocal = {
      id: resolvedAccount.userId || resolvedAccount.id,
      email: resolvedAccount.email,
      password: resolvedAccount.password,
      username: resolvedAccount.username || "",
      fullName: resolvedAccount.fullName || "",
      gender: resolvedAccount.gender || "",
      marital: resolvedAccount.marital || "",
      joinedAt: resolvedAccount.joinedAt || Date.now(),
      avatar:
        resolvedAccount.avatar ||
        "https://i.postimg.cc/nhdyR4kF/Mt-Profile-Fallback-Img.png",
    };
    _setAccount(nextLocal);
  }

  localStorage.removeItem(AUTH_FORGOT_CODE_KEY);
  localStorage.removeItem(AUTH_FORGOT_COOLDOWN_KEY);
  localStorage.removeItem(AUTH_FORGOT_EMAIL_KEY);

  const siEmail = _qs("si-email");
  if (siEmail) siEmail.value = resetEmail;

  _setNote(
    "auth-forgot-note",
    "Password reset! Log in with your new password.",
    true,
  );
  setTimeout(() => {
    _openSignin();
    _setNote(
      "auth-signin-note",
      "Password updated — enter your new password.",
      true,
    );
  }, 600);
}

function _showPostLoginTransition(isLogin) {
  if (_authState.busy) return;
  _authState.busy = true;
  showAuthScreen("auth-screen-transition");
  _setGatewayVisible(true);

  const ms = isLogin ? AUTH_LOGIN_TRANSITION_MS : AUTH_POST_LOGIN_TRANSITION_MS;
  if (_authState.postLoginTimer) clearTimeout(_authState.postLoginTimer);
  _authState.postLoginTimer = setTimeout(() => {
    _setGatewayVisible(false);
    if (typeof _router === "function") {
      _router();
    } else if (
      typeof showPage === "function" &&
      typeof homePage !== "undefined" &&
      homePage
    ) {
      showPage(homePage);
      if (typeof _setActiveNav === "function") _setActiveNav("home");
      if (typeof _navigateTo === "function") _navigateTo("/");
    }
    _authState.busy = false;
  }, ms);
}

function _setupListeners() {
  const btnStart = _qs("auth-btn-start");
  if (btnStart) {
    btnStart.addEventListener("click", () => {
      _markStartSeen();
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

  // Event delegation for choice buttons — more reliable on mobile than direct binding
  const authPageEl = document.getElementById("auth-page");
  if (authPageEl) {
    authPageEl.addEventListener("click", (e) => {
      const gBtn = e.target.closest("[data-gender]");
      const sBtn = e.target.closest("[data-status]");
      if (gBtn)
        _setSignupChoice("gender", gBtn.getAttribute("data-gender") || "");
      else if (sBtn)
        _setSignupChoice("status", sBtn.getAttribute("data-status") || "");
    });
  }

  const siSubmit = _qs("auth-signin-submit");
  if (siSubmit) siSubmit.addEventListener("click", _signin);

  // Forgot Password
  const forgotOpen = _qs("auth-forgot-open");
  if (forgotOpen) forgotOpen.addEventListener("click", _openForgotPassword);

  // Forgot step 1
  const forgotSend = _qs("auth-forgot-send");
  if (forgotSend) forgotSend.addEventListener("click", _forgotSendCode);

  const forgotBack = _qs("auth-forgot-back");
  if (forgotBack) forgotBack.addEventListener("click", _openSignin);

  // Forgot step 2
  const forgotBack2 = _qs("auth-forgot-back-2");
  if (forgotBack2)
    forgotBack2.addEventListener("click", () => _showForgotStep(1));

  const forgotResend = _qs("auth-forgot-resend");
  if (forgotResend) forgotResend.addEventListener("click", _forgotResend);

  const forgotReset = _qs("auth-forgot-reset");
  if (forgotReset) forgotReset.addEventListener("click", _forgotReset);

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

// ── Inactivity tracking ──────────────────────────────────────────────────────
const AUTH_LAST_ACTIVE_KEY = "mt_last_active";
const AUTH_INACTIVITY_MS = 2 * 24 * 60 * 60 * 1000; // 2 days

function _recordActivity() {
  localStorage.setItem(AUTH_LAST_ACTIVE_KEY, String(Date.now()));
}

function _isInactiveFor2Days() {
  const last = Number(localStorage.getItem(AUTH_LAST_ACTIVE_KEY) || 0);
  return last > 0 && Date.now() - last > AUTH_INACTIVITY_MS;
}

function initAuthFlow() {
  _setupListeners();
  _recordActivity();

  if (isUserAuthenticated()) {
    _showPostLoginTransition(false); // refresh → 1 s splash
    return;
  }

  // After 2 days of inactivity, reset onboarding so user sees Get Started again
  if (_isInactiveFor2Days()) {
    localStorage.removeItem(AUTH_START_SEEN_KEY);
  }

  if (_hasSeenStart()) {
    showAuthScreen("auth-screen-signin");
  } else {
    showAuthScreen("auth-screen-start");
  }
  _setGatewayVisible(true);
}

initAuthFlow();
