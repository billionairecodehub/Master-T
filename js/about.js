// ══════════════════════════════════════════════════════════════
// ABOUT PAGE: Board Toggle + Search Filter
// ══════════════════════════════════════════════════════════════

// ── 1. Board Toggle (Expand/Collapse) ──────────────────────────
function setupBoardToggle() {
  const aboutPageEl = document.querySelector(".about-page");
  if (!aboutPageEl) return;

  const boardItems = aboutPageEl.querySelectorAll(".about-board-item");
  const boardTriggers = aboutPageEl.querySelectorAll(".about-board");

  boardTriggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const parentItem = trigger.closest(".about-board-item");
      if (!parentItem) return;

      const isCurrentlyExpanded = parentItem.classList.contains("expanded");

      // Collapse all boards first
      boardItems.forEach((item) => item.classList.remove("expanded"));

      // Expand this board if it wasn't already open
      if (!isCurrentlyExpanded) {
        parentItem.classList.add("expanded");
      }
    });
  });
}

// ── 2. Search Filter ───────────────────────────────────────────
function setupSearchFilter() {
  const aboutPageEl = document.querySelector(".about-page");
  if (!aboutPageEl) return;

  const searchInput = aboutPageEl.querySelector("#about-search-input");
  if (!searchInput) return;

  searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();
    const boardItems = aboutPageEl.querySelectorAll(".about-board-item");

    boardItems.forEach((item) => {
      const label = (item.getAttribute("data-label") || "").toLowerCase();
      const text = item.textContent.toLowerCase();

      // Hide if search query exists and doesn't match
      const shouldHide =
        query !== "" && !label.includes(query) && !text.includes(query);
      item.classList.toggle("hidden", shouldHide);
    });
  });
}

// ── 3. About Header Back ───────────────────────────────────────
function setupAboutBackButton() {
  const header = document.querySelector(".about-page .profile-view-header");
  const backBtn = document.querySelector(".about-page .profile-view-back");
  if (!header && !backBtn) return;

  function goBackFromAbout() {
    const goProfile =
      window._aboutBackTarget === "profile" &&
      typeof showPage === "function" &&
      typeof profilePage !== "undefined" &&
      profilePage;

    if (goProfile) {
      window._aboutBackTarget = "";
      history.pushState({}, "", "/profile");
      showPage(profilePage);
      return;
    }

    history.pushState({}, "", "/");
    if (
      typeof showPage === "function" &&
      typeof homePage !== "undefined" &&
      homePage
    ) {
      showPage(homePage);
      if (typeof _setActiveNav === "function") _setActiveNav("home");
    }
  }

  if (backBtn) {
    backBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      backBtn.blur();
      goBackFromAbout();
    });
  }

  if (header) {
    header.addEventListener("click", () => {
      goBackFromAbout();
    });
  }
}

// ── Initialize on page load ────────────────────────────────────
setupBoardToggle();
setupSearchFilter();
setupAboutBackButton();
