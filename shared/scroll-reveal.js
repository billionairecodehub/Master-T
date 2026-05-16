(function () {
  const SITE_SELECTORS = [
    ".home-wrapper > *",
    ".profile-wrapper > *",
    ".profile-view-content > *",
    ".about-wrapper > *",
    ".feed-main > *",
    ".menu-main > *",
    ".quest-main > *",
    ".block-sub-main > *",
    ".notifications-wrapper > *",
    ".notifications-boards > *",
  ];

  const ADMIN_SELECTORS = [
    ".admin-page-title",
    ".admin-page-subtitle",
    ".admin-section-header",
    ".admin-home-block-1-main",
    ".admin-home-quick-board",
    ".admin-stat-card",
    ".stats-breakdown-card",
    ".stats-bar-group",
    ".sales-overall-board",
    ".sales-board",
    ".msg-card",
    ".msg-body-card",
    ".msg-response-card",
    ".msg-action-row",
    ".content-sections-group",
    ".content-section-tab",
    ".content-section-board",
    ".admin-list-item",
    ".cs-view-card",
    ".cs-card",
    ".cs-about-item",
    ".cs-sub-stat-card",
    ".quest-list-card",
    ".post-list-card",
    ".thread-item",
    ".admin-empty",
  ];

  const ENGINE_MAP = new WeakMap();

  function buildThresholds(steps) {
    const thresholds = [];
    for (let index = 0; index <= steps; index += 1) {
      thresholds.push(index / steps);
    }
    return thresholds;
  }

  function smoothStep(value) {
    return value * value * (3 - 2 * value);
  }

  function getInitialRatio(root, element) {
    const rootRect = root.getBoundingClientRect();
    const rect = element.getBoundingClientRect();

    if (!rect.height || !rootRect.height) return 1;

    const visibleHeight = Math.max(
      0,
      Math.min(rect.bottom, rootRect.bottom) - Math.max(rect.top, rootRect.top),
    );

    return Math.max(
      0,
      Math.min(1, visibleHeight / Math.min(rect.height, rootRect.height)),
    );
  }

  function shouldSkipElement(element) {
    if (!(element instanceof HTMLElement)) return true;
    if (element.dataset.scrollRevealBound === "true") return true;
    if (element.closest(".header, .footer, .admin-header, .admin-footer")) {
      return true;
    }
    if (element.matches("img, button, input, textarea, select, option, span")) {
      return true;
    }
    if (element.getClientRects().length === 0) return true;

    const rect = element.getBoundingClientRect();
    if (rect.height < 42 && rect.width < 120) return true;

    return false;
  }

  function updateElementVisual(element, ratio) {
    const clampedRatio = Math.max(0, Math.min(1, ratio));
    const eased = smoothStep(clampedRatio);
    const opacity = 0.84 + eased * 0.16;
    const translate = (1 - eased) * 8;
    const scale = 0.998 + eased * 0.002;

    element.style.setProperty("--scroll-reveal-opacity", opacity.toFixed(3));
    element.style.setProperty(
      "--scroll-reveal-offset",
      translate.toFixed(1) + "px",
    );
    element.style.setProperty("--scroll-reveal-scale", scale.toFixed(3));
    element.classList.toggle("scroll-reveal-visible", clampedRatio > 0.01);
  }

  function createEngine(root, mode) {
    const selector = (mode === "admin" ? ADMIN_SELECTORS : SITE_SELECTORS).join(
      ", ",
    );

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          updateElementVisual(
            entry.target,
            entry.isIntersecting ? entry.intersectionRatio : 0,
          );
        });
      },
      {
        root,
        rootMargin: "10% 0px -6% 0px",
        threshold: buildThresholds(8),
      },
    );

    let scanFrame = 0;

    function bindElement(element) {
      element.dataset.scrollRevealBound = "true";
      element.classList.add("scroll-reveal-item");
      updateElementVisual(element, getInitialRatio(root, element));
      observer.observe(element);
    }

    function scan() {
      root.querySelectorAll(selector).forEach((element) => {
        if (shouldSkipElement(element)) return;
        bindElement(element);
      });
    }

    function scheduleScan() {
      if (scanFrame) return;
      scanFrame = window.requestAnimationFrame(() => {
        scanFrame = 0;
        scan();
      });
    }

    const mutationObserver = new MutationObserver(scheduleScan);
    mutationObserver.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style"],
    });

    scan();

    return {
      refresh: scheduleScan,
      destroy() {
        mutationObserver.disconnect();
        observer.disconnect();
        if (scanFrame) {
          window.cancelAnimationFrame(scanFrame);
          scanFrame = 0;
        }
      },
    };
  }

  function mount(options) {
    const root = options && options.root;
    const mode = (options && options.mode) || "site";

    if (!(root instanceof HTMLElement)) return null;

    if (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return null;
    }

    const existing = ENGINE_MAP.get(root);
    if (existing) {
      existing.refresh();
      return existing;
    }

    const engine = createEngine(root, mode);
    ENGINE_MAP.set(root, engine);
    return engine;
  }

  window.ScrollRevealManager = {
    mount,
  };
})();
