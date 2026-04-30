// ARCHIVED — Old Settings JS (Import Data + Reset All Data)
// Moved here from js/settings.js
// Keep for future reference. Not loaded or executed.

// ── Old Import Data handler ──

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

// ── Old Reset All Data handler ──

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

  seedIfEmpty();
  alert("Data reset to defaults! Refreshing...");
  location.reload();
});
