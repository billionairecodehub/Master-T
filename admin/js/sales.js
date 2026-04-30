// admin/js/sales.js — Sales page logic

let _salesPeriod = 7;

// ── Called by showAdminPage("sales") in index.js ────────────────
function refreshSales() {
  _salesRenderStats();
}

// ── Stats calculation ──────────────────────────────────
function _salesRenderStats() {
  const all = DataStore.getAll("sales");
  const now = Date.now();
  const cutoff = new Date(now - _salesPeriod * 86_400_000);
  const inPeriod = all.filter((s) => new Date(s.createdAt) >= cutoff);

  const bookSales = inPeriod.filter((s) => s.type === "book");
  const mentorSales = inPeriod.filter((s) => s.type === "mentorship");

  const bookTotal = bookSales.reduce((acc, s) => acc + (s.amount || 0), 0);
  const mentorTotal = mentorSales.reduce((acc, s) => acc + (s.amount || 0), 0);
  const overall = bookTotal + mentorTotal;

  const fmt = (n) => "$" + n.toLocaleString("en-US");

  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  set("sales-overall-amount", fmt(overall));
  set("sales-books-amount", fmt(bookTotal));
  set("sales-books-count", bookSales.length);
  set("sales-mentorship-amount", fmt(mentorTotal));
  set("sales-mentorship-count", mentorSales.length);
}

// ── Timeframe buttons ─────────────────────────────────
document.querySelectorAll(".sales-timeframe-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".sales-timeframe-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    _salesPeriod = parseInt(btn.getAttribute("data-days"), 10);
    _salesRenderStats();
  });
});

// ── Tab switching ────────────────────────────────────
document.querySelectorAll(".sales-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document
      .querySelectorAll(".sales-tab")
      .forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    const name = tab.getAttribute("data-sales-tab");
    document
      .querySelectorAll(".sales-tab-content")
      .forEach((c) => (c.style.display = "none"));
    const target = document.getElementById("sales-tab-" + name);
    if (target) target.style.display = "flex";
  });
});
