// ── ImgBB Image Upload Utility ────────────────────────────────────────────────
// Get your free API key at: https://api.imgbb.com/  →  API  →  Add API key
// Paste it below and you're done.
const IMGBB_API_KEY = "7c442b1420231d4d807ff941b31f34cf";

// ── Core upload ───────────────────────────────────────────────────────────────
async function _csUploadToImgBB(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const base64 = e.target.result.split(",")[1];
        const fd = new FormData();
        fd.append("key", IMGBB_API_KEY);
        fd.append("image", base64);
        const res = await fetch("https://api.imgbb.com/1/upload", {
          method: "POST",
          body: fd,
        });
        const json = await res.json();
        if (json.success) {
          resolve(json.data.url);
        } else {
          reject(new Error(json.error?.message || "Upload failed"));
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("File read error"));
    reader.readAsDataURL(file);
  });
}

// ── Widget helpers ────────────────────────────────────────────────────────────
function _csSetWidgetState(widget, state, msg) {
  const status = widget.querySelector(".cs-upload-status");
  const box = widget.querySelector(".cs-image-upload");
  if (!status || !box) return;
  status.textContent = msg || "";
  box.classList.toggle("cs-upload-loading", state === "loading");
  box.classList.toggle("cs-upload-error", state === "error");
  box.classList.toggle("cs-upload-done", state === "done");
}

function _csSetWidgetPreview(widget, url) {
  const preview = widget.querySelector(".cs-image-preview");
  if (!preview) return;
  if (url) {
    preview.innerHTML = `<img src="${url}" alt="Preview" />`;
  } else {
    preview.innerHTML = "&#128444;";
  }
}

// ── Bind all widgets ──────────────────────────────────────────────────────────
function _csBindImageWidgets() {
  document.querySelectorAll(".cs-img-widget").forEach((widget) => {
    const fileInput = widget.querySelector(".cs-img-file-input");
    const hiddenInput = widget.querySelector("input[type='text']");
    const uploadBox = widget.querySelector(".cs-image-upload");
    if (!fileInput || !hiddenInput || !uploadBox) return;

    // Prevent double-binding
    if (widget.dataset.bound === "1") return;
    widget.dataset.bound = "1";

    uploadBox.addEventListener("click", () => fileInput.click());
    uploadBox.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") fileInput.click();
    });

    fileInput.addEventListener("change", async () => {
      const file = fileInput.files[0];
      if (!file) return;

      if (file.size > 3 * 1024 * 1024) {
        await window.UMessageModal.error(
          "Image must be under 3MB. Please choose a smaller file.",
          "File Too Large",
        );
        fileInput.value = "";
        return;
      }

      if (IMGBB_API_KEY === "YOUR_IMGBB_API_KEY") {
        await window.UMessageModal.error(
          "ImgBB API key not configured.\n\nGet a free key at imgbb.com → API, then set IMGBB_API_KEY in admin/js/imgUpload.js",
          "Setup Required",
        );
        fileInput.value = "";
        return;
      }

      _csSetWidgetState(widget, "loading", "Uploading…");
      try {
        const url = await _csUploadToImgBB(file);
        hiddenInput.value = url;
        _csSetWidgetPreview(widget, url);
        _csSetWidgetState(widget, "done", "✓ Uploaded");
      } catch (err) {
        _csSetWidgetState(widget, "error", "✗ " + err.message);
        await window.UMessageModal.error(
          "Image upload failed: " + err.message,
          "Upload Error",
        );
      } finally {
        fileInput.value = "";
      }
    });
  });
}

// ── Sync previews from stored URL values (call after edit-form loads) ─────────
function _csSyncImgPreviews(ids) {
  ids.forEach((id) => {
    const hiddenInput = document.getElementById(id);
    if (!hiddenInput) return;
    const widget = hiddenInput.closest(".cs-img-widget");
    if (!widget) return;
    _csSetWidgetPreview(widget, hiddenInput.value || "");
    _csSetWidgetState(widget, hiddenInput.value ? "done" : "idle", "");
  });
}

// Auto-bind on load (DOM is ready when admin loads scripts dynamically)
_csBindImageWidgets();
