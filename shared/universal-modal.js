(function () {
  const STATE = {
    initialized: false,
    activeResolver: null,
    previousActive: null,
    options: null,
  };

  const UI = {
    overlay: null,
    card: null,
    title: null,
    label: null,
    inputWrap: null,
    input: null,
    secondaryBtn: null,
    primaryBtn: null,
  };

  function getFocusableElements(container) {
    if (!container) return [];
    const selector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    return Array.from(container.querySelectorAll(selector)).filter(
      (el) => !el.disabled && el.offsetParent !== null,
    );
  }

  function trapFocus(event) {
    if (!UI.overlay || !UI.overlay.classList.contains("is-open")) return;
    if (event.key !== "Tab") return;

    const focusables = getFocusableElements(UI.card);
    if (!focusables.length) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function closeModal(payload) {
    if (!UI.overlay || !STATE.activeResolver) return;

    const resolver = STATE.activeResolver;
    STATE.activeResolver = null;

    UI.overlay.classList.remove("is-open");
    UI.overlay.classList.add("is-closing");

    window.setTimeout(() => {
      UI.overlay.classList.remove("is-closing");
      UI.overlay.style.display = "none";
      if (
        STATE.previousActive &&
        typeof STATE.previousActive.focus === "function"
      ) {
        STATE.previousActive.focus();
      }
      STATE.previousActive = null;
      resolver(payload);
    }, 170);
  }

  function onKeydown(event) {
    trapFocus(event);

    if (event.key === "Escape") {
      if (STATE.options && STATE.options.allowEscape === false) return;
      event.preventDefault();
      closeModal({ action: "dismiss", value: null });
      return;
    }

    if (
      event.key === "Enter" &&
      STATE.options &&
      STATE.options.showInput &&
      document.activeElement === UI.input
    ) {
      event.preventDefault();
      closeModal({ action: "primary", value: UI.input.value });
    }
  }

  function ensureUI() {
    if (STATE.initialized) return;

    const overlay = document.createElement("div");
    overlay.className = "umodal-overlay";
    overlay.setAttribute("role", "presentation");

    overlay.innerHTML = [
      '<div class="umodal-card" role="dialog" aria-modal="true" aria-live="polite" aria-labelledby="umodal-title" aria-describedby="umodal-label">',
      '  <header class="umodal-header">',
      '    <h2 class="umodal-title" id="umodal-title">Message</h2>',
      "  </header>",
      '  <section class="umodal-body">',
      '    <p class="umodal-label" id="umodal-label"></p>',
      '    <div class="umodal-input-wrap" hidden>',
      '      <input class="umodal-input" type="text" autocomplete="off" />',
      "    </div>",
      "  </section>",
      '  <footer class="umodal-footer">',
      '    <button type="button" class="umodal-btn" data-role="secondary" data-intent="neutral">Cancel</button>',
      '    <button type="button" class="umodal-btn" data-role="primary" data-intent="confirm">Proceed</button>',
      "  </footer>",
      "</div>",
    ].join("");

    document.body.appendChild(overlay);

    UI.overlay = overlay;
    UI.card = overlay.querySelector(".umodal-card");
    UI.title = overlay.querySelector(".umodal-title");
    UI.label = overlay.querySelector(".umodal-label");
    UI.inputWrap = overlay.querySelector(".umodal-input-wrap");
    UI.input = overlay.querySelector(".umodal-input");
    UI.secondaryBtn = overlay.querySelector('[data-role="secondary"]');
    UI.primaryBtn = overlay.querySelector('[data-role="primary"]');

    UI.overlay.addEventListener("click", (event) => {
      if (event.target !== UI.overlay) return;
      if (STATE.options && STATE.options.closeOnOverlay === false) return;
      closeModal({ action: "dismiss", value: null });
    });

    UI.primaryBtn.addEventListener("click", () => {
      const value =
        STATE.options && STATE.options.showInput ? UI.input.value : null;
      closeModal({ action: "primary", value });
    });

    UI.secondaryBtn.addEventListener("click", () => {
      closeModal({ action: "secondary", value: null });
    });

    document.addEventListener("keydown", onKeydown, true);
    STATE.initialized = true;
  }

  function normalizeIntent(intent) {
    if (intent === "danger") return "danger";
    if (intent === "neutral") return "neutral";
    return "confirm";
  }

  function open(options) {
    ensureUI();

    if (STATE.activeResolver) {
      closeModal({ action: "dismiss", value: null });
    }

    const merged = {
      title: "Message",
      label: "",
      showInput: false,
      inputType: "text",
      inputPlaceholder: "",
      inputValue: "",
      primaryText: "Proceed",
      secondaryText: "Cancel",
      showSecondary: true,
      primaryIntent: "confirm",
      secondaryIntent: "neutral",
      allowEscape: true,
      closeOnOverlay: true,
      ...options,
    };

    STATE.options = merged;

    UI.title.textContent = String(merged.title || "Message");
    UI.label.textContent = String(merged.label || "");

    UI.primaryBtn.textContent = String(merged.primaryText || "Proceed");
    UI.primaryBtn.setAttribute(
      "data-intent",
      normalizeIntent(merged.primaryIntent),
    );

    UI.secondaryBtn.textContent = String(merged.secondaryText || "Cancel");
    UI.secondaryBtn.setAttribute(
      "data-intent",
      normalizeIntent(merged.secondaryIntent),
    );
    UI.secondaryBtn.style.display = merged.showSecondary
      ? "inline-flex"
      : "none";

    UI.inputWrap.hidden = !merged.showInput;
    UI.input.type = merged.inputType || "text";
    UI.input.placeholder = String(merged.inputPlaceholder || "");
    UI.input.value = String(merged.inputValue || "");

    UI.overlay.style.display = "flex";
    requestAnimationFrame(() => UI.overlay.classList.add("is-open"));

    STATE.previousActive = document.activeElement;

    window.setTimeout(() => {
      if (merged.showInput) {
        UI.input.focus();
        UI.input.select();
      } else {
        UI.primaryBtn.focus();
      }
    }, 20);

    return new Promise((resolve) => {
      STATE.activeResolver = resolve;
    });
  }

  const api = {
    open,
    info(label, title = "Message") {
      return open({
        title,
        label,
        primaryText: "Got It",
        showSecondary: false,
        primaryIntent: "neutral",
      });
    },
    success(label, title = "Success") {
      return open({
        title,
        label,
        primaryText: "Great",
        showSecondary: false,
        primaryIntent: "confirm",
      });
    },
    error(label, title = "Error") {
      return open({
        title,
        label,
        primaryText: "Close",
        showSecondary: false,
        primaryIntent: "danger",
      });
    },
    confirm(label, title = "Confirmation") {
      return open({
        title,
        label,
        primaryText: "Proceed",
        secondaryText: "Cancel",
        showSecondary: true,
        primaryIntent: "confirm",
        secondaryIntent: "danger",
      }).then((result) => result.action === "primary");
    },
    prompt(options) {
      const merged = {
        title: "Input",
        label: "",
        placeholder: "Enter value",
        value: "",
        primaryText: "Proceed",
        secondaryText: "Cancel",
        ...options,
      };

      return open({
        title: merged.title,
        label: merged.label,
        showInput: true,
        inputPlaceholder: merged.placeholder,
        inputValue: merged.value,
        primaryText: merged.primaryText,
        secondaryText: merged.secondaryText,
        showSecondary: true,
        primaryIntent: "confirm",
        secondaryIntent: "danger",
      }).then((result) => (result.action === "primary" ? result.value : null));
    },
    notify(label, title = "Notification") {
      return open({
        title,
        label,
        primaryText: "Got It",
        showSecondary: false,
        primaryIntent: "neutral",
      });
    },
  };

  window.UMessageModal = api;

  // Optional event-driven opening support.
  window.addEventListener("umodal:open", (event) => {
    const config = (event && event.detail) || {};
    api.open(config);
  });
})();
