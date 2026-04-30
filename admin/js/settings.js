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

// ── Export Poll Results ──────────────────────────────

document
  .getElementById("settings-export-polls")
  .addEventListener("click", () => {
    const data = DataStore.getAll("polls");
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      "mastertogan-polls-" + new Date().toISOString().slice(0, 10) + ".json";
    a.click();
    URL.revokeObjectURL(url);
  });

// ── Log Out ──────────────────────────────────────────

document.getElementById("settings-logout").addEventListener("click", () => {
  if (typeof adminLogout === "function") {
    adminLogout();
  }
});
