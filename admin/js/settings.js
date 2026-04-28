// admin/js/settings.js — Settings page logic

// ── Change PIN ───────────────────────────────────────

document.getElementById("settings-change-pin").addEventListener("click", () => {
  document.getElementById("pin-current").value = "";
  document.getElementById("pin-new").value = "";
  document.getElementById("pin-confirm").value = "";
  document.getElementById("modal-pin").classList.add("open");
});

document.getElementById("modal-pin-close").addEventListener("click", () => {
  document.getElementById("modal-pin").classList.remove("open");
});

document.getElementById("save-pin-btn").addEventListener("click", () => {
  const current = document.getElementById("pin-current").value.trim();
  const newPin = document.getElementById("pin-new").value.trim();
  const confirm = document.getElementById("pin-confirm").value.trim();

  if (!DataStore.checkPin(current)) return alert("Current PIN is incorrect");
  if (newPin.length < 4) return alert("New PIN must be at least 4 characters");
  if (newPin !== confirm) return alert("PINs do not match");

  DataStore.setPin(newPin);
  document.getElementById("modal-pin").classList.remove("open");
  alert("PIN updated successfully");
});

// ── Export Data ──────────────────────────────────────

document.getElementById("settings-export").addEventListener("click", () => {
  const data = {
    apps: DataStore.getAll("apps"),
    books: DataStore.getAll("books"),
    circles: DataStore.getAll("circles"),
    posts: DataStore.getAll("posts"),
    exportedAt: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download =
    "mastertogan-backup-" + new Date().toISOString().slice(0, 10) + ".json";
  a.click();
  URL.revokeObjectURL(url);
});

// ── Export Subscribers ──────────────────────────────

document
  .getElementById("settings-export-subscribers")
  .addEventListener("click", () => {
    const data = DataStore.getAll("subscribers");
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      "mastertogan-subscribers-" +
      new Date().toISOString().slice(0, 10) +
      ".json";
    a.click();
    URL.revokeObjectURL(url);
  });

// ── Import Data ─────────────────────────────────────

const importInput = document.getElementById("import-file-input");

document.getElementById("settings-import").addEventListener("click", () => {
  importInput.click();
});

importInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      if (!data.apps || !data.books || !data.circles || !data.posts) {
        return alert("Invalid backup file — missing data keys");
      }

      if (!window.confirm("This will replace ALL current data. Continue?"))
        return;

      localStorage.setItem("mt_apps", JSON.stringify(data.apps));
      localStorage.setItem("mt_books", JSON.stringify(data.books));
      localStorage.setItem("mt_circles", JSON.stringify(data.circles));
      localStorage.setItem("mt_posts", JSON.stringify(data.posts));

      alert("Data imported! Refreshing...");
      location.reload();
    } catch {
      alert("Failed to parse file. Make sure it's a valid JSON backup.");
    }
  };
  reader.readAsText(file);
  importInput.value = "";
});

// ── Reset All Data ──────────────────────────────────

document.getElementById("settings-reset").addEventListener("click", () => {
  if (
    !window.confirm(
      "This will delete ALL content and reset to defaults. Are you sure?",
    )
  )
    return;
  if (!window.confirm("This cannot be undone. Really reset everything?"))
    return;

  localStorage.removeItem("mt_apps");
  localStorage.removeItem("mt_books");
  localStorage.removeItem("mt_circles");
  localStorage.removeItem("mt_posts");

  // Re-seed
  seedIfEmpty();
  alert("Data reset to defaults! Refreshing...");
  location.reload();
});
