/**
 * MasterTogan – client-side security hardening (Feature #7)
 * Adds basic deterrents against casual code inspection.
 * Note: true server-side logic must never live in plain JS files.
 */
(function () {
  "use strict";

  // ── 1. Disable right-click context menu ─────────────────────────────────
  document.addEventListener("contextmenu", function (e) {
    e.preventDefault();
  });

  // ── 2. Block common DevTools keyboard shortcuts ──────────────────────────
  document.addEventListener("keydown", function (e) {
    const k = e.key;
    // F12
    if (k === "F12") {
      e.preventDefault();
      return;
    }
    // Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C (inspect, console, pick)
    if (e.ctrlKey && e.shiftKey && ["I", "J", "C", "i", "j", "c"].includes(k)) {
      e.preventDefault();
      return;
    }
    // Ctrl+U (view source)
    if (e.ctrlKey && (k === "u" || k === "U")) {
      e.preventDefault();
      return;
    }
    // Ctrl+S (save page)
    if (e.ctrlKey && (k === "s" || k === "S")) {
      e.preventDefault();
      return;
    }
  });

  // ── 3. Console deterrent banner ──────────────────────────────────────────
  const _warn = [
    "%c⚠ STOP – Developer Notice",
    "color:#ff4d4d;font-size:18px;font-weight:bold;",
  ];
  const _info = [
    "%cThis is a browser feature. Do not paste or run code here unless you\n" +
      "know exactly what you are doing. Doing so may compromise your account.",
    "color:#ffa040;font-size:13px;",
  ];
  try {
    console.log(..._warn);
    console.log(..._info);
  } catch (_) {}

  // ── 4. Suppress further console output to reduce code leakage ───────────
  // Override after the deterrent messages are shown.
  const _noop = function () {};
  if (typeof console !== "undefined") {
    [
      "log",
      "warn",
      "info",
      "debug",
      "table",
      "dir",
      "group",
      "groupCollapsed",
    ].forEach(function (m) {
      try {
        console[m] = _noop;
      } catch (_) {}
    });
  }

  // ── 5. Devtools size-detection trip-wire ────────────────────────────────
  // When devtools is docked/open the window inner size shrinks noticeably.
  var _dtOpen = false;
  function _checkDevtools() {
    var threshold = 160;
    var widthDiff = window.outerWidth - window.innerWidth;
    var heightDiff = window.outerHeight - window.innerHeight;
    var open = widthDiff > threshold || heightDiff > threshold;
    if (open && !_dtOpen) {
      _dtOpen = true;
      // Optionally redirect to a warning page — or just do nothing (silent).
    }
    if (!open) _dtOpen = false;
  }
  setInterval(_checkDevtools, 1500);
})();
