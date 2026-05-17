// ── Auth Flow: Get Started → Sign In → Verify → Profile ──

const AUTH_STATE_KEY = "mt_auth_state";
const AUTH_USER_KEY = "mt_auth_user";

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

// ── Auth Screen Navigation ──
function showAuthScreen(screenId) {
  document
    .querySelectorAll(".auth-screen")
    .forEach((s) => (s.style.display = "none"));
  const screen = document.getElementById(screenId);
  if (screen) screen.style.display = "flex";
}

function goToSignIn() {
  showAuthScreen("auth-screen-signin");
}

function goToVerify() {
  showAuthScreen("auth-screen-verify");
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

  // Hide auth page and show main app
  const authPage = document.getElementById("auth-page");
  if (authPage) authPage.style.display = "none";

  const main = document.querySelector(".main");
  if (main) main.style.display = "block";

  // Show and navigate to user-own profile
  if (
    typeof showPage === "function" &&
    typeof userProfilePage !== "undefined" &&
    userProfilePage
  ) {
    showPage(userProfilePage);
    if (typeof refreshUserProfile === "function") refreshUserProfile();
    if (typeof _setActiveNav === "function") _setActiveNav("");
  }

  if (typeof _navigateTo === "function") _navigateTo("/user");
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
      btnGoogle.textContent = "Google account selected";
      btnGoogle.disabled = true;
      setTimeout(() => {
        btnGoogle.textContent = "Choose your account";
        btnGoogle.disabled = false;
      }, 1500);
    });
  }

  // Continue → Verify
  const btnContinue = document.getElementById("auth-btn-continue");
  if (btnContinue) {
    btnContinue.addEventListener("click", goToVerify);
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
      const passcodes = Array.from(passcodeInputs).map((i) => i.value);
      const code = passcodes.join("");
      if (code.length === 4) {
        completeAuth();
      }
    });
  }
}

setupAuthListeners();

// ── Show Auth or App based on State ──
function initAuthFlow() {
  const authPage = document.getElementById("auth-page");
  if (!authPage) return;

  // Testing mode: never block the app on boot.
  // Auth can still be opened manually from the top-right user icon.
  authPage.style.display = "none";
  const main = document.querySelector(".main");
  if (main) main.style.display = "block";
}

initAuthFlow();
