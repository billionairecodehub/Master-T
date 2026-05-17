// ── Auth Flow: Get Started → Sign In → Verify → Profile ──

const AUTH_STATE_KEY = "mt_auth_state";
const AUTH_USER_KEY = "mt_auth_user";
const AUTH_POST_LOGIN_TRANSITION_MS = 3000;

function getAuthState() {
  return localStorage.getItem(AUTH_STATE_KEY) || "unauthenticated";
}

function isUserAuthenticated() {
  return (
    getAuthState() === "authenticated" && !!localStorage.getItem(AUTH_USER_KEY)
  );
}

function setAuthState(state) {
  localStorage.setItem(AUTH_STATE_KEY, state);
}

function setAuthUser(user) {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

function getAuthUser() {
  const stored = localStorage.getItem(AUTH_USER_KEY);
  return stored ? JSON.parse(stored) : null;
}

function _setGatewayVisible(showAuth) {
  const authPage = document.getElementById("auth-page");
  const main = document.querySelector(".main");
  if (authPage) authPage.style.display = showAuth ? "flex" : "none";
  if (main) main.style.display = showAuth ? "none" : "block";
}

let _authStepBusy = false;
let _authPostLoginTimer = null;

function _authTransitionTo(screenId) {
  if (_authStepBusy) return;
  _authStepBusy = true;
  showAuthScreen(screenId);
  setTimeout(() => {
    _authStepBusy = false;
  }, 180);
}

// ── Auth Screen Navigation ──
function showAuthScreen(screenId) {
  const screens = document.querySelectorAll(".auth-screen");
  screens.forEach((s) => s.classList.remove("is-active"));
  const screen = document.getElementById(screenId);
  if (screen) screen.classList.add("is-active");
}

function goToSignIn() {
  _authTransitionTo("auth-screen-signin");
}

function goToVerify() {
  _authTransitionTo("auth-screen-verify");
}

function completeAuth() {
  // Mark as authenticated
  setAuthState("authenticated");

  // Simulate user from Google Sign-In
  const mockUser = {
    id: "google_" + Math.random().toString(36).substr(2, 9),
    email: "user@gmail.com",
    name: "User",
    avatar: "https://i.postimg.cc/nhdyR4kF/Mt-Profile-Fallback-Img.png",
    gender: "Male",
    status: "Single",
    joinedAt: Date.now(),
  };
  setAuthUser(mockUser);

  // Show branded transition screen for a polished gateway experience
  showAuthScreen("auth-screen-transition");
  _setGatewayVisible(true);

  if (_authPostLoginTimer) clearTimeout(_authPostLoginTimer);
  _authPostLoginTimer = setTimeout(() => {
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
    _authStepBusy = false;
  }, AUTH_POST_LOGIN_TRANSITION_MS);
}

// ── Setup Auth Event Listeners ──
function setupAuthListeners() {
  const authPage = document.getElementById("auth-page");
  if (!authPage) return;

  // Get Started → Sign In
  const btnStart = document.getElementById("auth-btn-start");
  if (btnStart) {
    btnStart.addEventListener("click", goToSignIn);
  }

  // Google Sign-In (mock)
  const btnGoogle = document.getElementById("auth-btn-google");
  if (btnGoogle) {
    btnGoogle.addEventListener("click", () => {
      btnGoogle.setAttribute("data-selected", "1");
    });
  }

  // Continue → Verify
  const btnContinue = document.getElementById("auth-btn-continue");
  if (btnContinue) {
    btnContinue.addEventListener("click", () => {
      if (_authStepBusy) return;
      goToVerify();
    });
  }

  // Passcode input navigation
  const passcodeInputs = document.querySelectorAll(".auth-passcode-input");
  passcodeInputs.forEach((input, idx) => {
    input.addEventListener("input", (e) => {
      if (e.target.value && idx < passcodeInputs.length - 1) {
        passcodeInputs[idx + 1].focus();
      }
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !e.target.value && idx > 0) {
        passcodeInputs[idx - 1].focus();
      }
    });
  });

  // Resend
  const btnResend = document.getElementById("auth-btn-resend");
  if (btnResend) {
    btnResend.addEventListener("click", () => {
      btnResend.textContent = "Code sent!";
      btnResend.disabled = true;
      setTimeout(() => {
        btnResend.textContent = "Resend";
        btnResend.disabled = false;
      }, 2000);
    });
  }

  // Verify → Complete Auth
  const btnVerify = document.getElementById("auth-btn-verify");
  if (btnVerify) {
    btnVerify.addEventListener("click", () => {
      if (_authStepBusy) return;
      const passcodes = Array.from(passcodeInputs).map((i) => i.value);
      const code = passcodes.join("");
      if (code.length === 4) {
        _authStepBusy = true;
        completeAuth();
      }
    });
  }
}

setupAuthListeners();

// ── Show Auth or App based on State ──
function initAuthFlow() {
  if (isUserAuthenticated()) {
    _setGatewayVisible(false);
    return;
  }

  showAuthScreen("auth-screen-start");
  _setGatewayVisible(true);
}

initAuthFlow();
