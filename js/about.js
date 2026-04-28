// ══════════════════════════════════════════════════════════════
// ABOUT PAGE: Board Toggle + Search Filter
// ══════════════════════════════════════════════════════════════

// ── 1. Board Toggle (Expand/Collapse) ──────────────────────────
function setupBoardToggle() {
  const boardItems = document.querySelectorAll(".about-board-item");
  const boardTriggers = document.querySelectorAll(".about-board");

  boardTriggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const parentItem = trigger.closest(".about-board-item");
      if (!parentItem) return;

      const isCurrentlyExpanded = parentItem.classList.contains("expanded");

      // Collapse all boards first
      boardItems.forEach((item) => item.classList.remove("expanded"));

      // Expand this board if it wasn't already expanded
      if (!isCurrentlyExpanded) {
        parentItem.classList.add("expanded");
      }
    });
  });
}

// ── 2. Search Filter ───────────────────────────────────────────
function setupSearchFilter() {
  const searchInput = document.getElementById("about-search-input");
  if (!searchInput) return;

  searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();
    const boardItems = document.querySelectorAll(".about-board-item");

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

// ── Initialize on page load ────────────────────────────────────
setupBoardToggle();
setupSearchFilter();
