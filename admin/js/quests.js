// admin/js/quests.js — Quests CRUD

let questThreads = [];

function refreshQuests() {
  const quests = DataStore.getAll("quests");
  const list = document.getElementById("quest-list");

  if (quests.length === 0) {
    list.innerHTML =
      '<div class="admin-empty"><div class="admin-empty-icon">❓</div><div class="admin-empty-text">No quests yet</div></div>';
    return;
  }

  list.innerHTML = quests
    .map(
      (q) => `
      <div class="quest-list-card" data-quest-id="${q.id}">
        <div class="quest-list-top">
          <div class="quest-list-subject">${q.subject}${q.subject && !q.subject.endsWith("?") ? "?" : ""}</div>
        </div>
        <div class="quest-list-preview">${(q.threads || []).length} solution thread${(q.threads || []).length !== 1 ? "s" : ""}</div>
      </div>`,
    )
    .join("");

  list.querySelectorAll(".quest-list-card").forEach((card) => {
    card.addEventListener("click", () => {
      const quest = DataStore.getById(
        "quests",
        card.getAttribute("data-quest-id"),
      );
      if (quest) openQuestModal(quest);
    });
  });
}

function openQuestModal(quest) {
  const modal = document.getElementById("modal-quest");
  const titleEl = document.getElementById("modal-quest-title");
  const delBtn = document.getElementById("delete-quest-btn");

  if (quest) {
    titleEl.textContent = "Edit Quest";
    document.getElementById("quest-edit-id").value = quest.id;
    document.getElementById("quest-subject").value = quest.subject || "";
    document.getElementById("quest-author").value =
      quest.author || "Master Togan";
    questThreads = quest.threads ? [...quest.threads] : [];
    delBtn.style.display = "block";
  } else {
    titleEl.textContent = "New Quest";
    document.getElementById("quest-edit-id").value = "";
    document.getElementById("quest-subject").value = "";
    document.getElementById("quest-author").value = "Master Togan";
    questThreads = [];
    delBtn.style.display = "none";
  }

  renderQuestThreadList();
  modal.classList.add("open");
}

function renderQuestThreadList() {
  const container = document.getElementById("quest-thread-list");
  container.innerHTML = questThreads
    .map(
      (t, i) => `
      <div class="thread-item">
        <button class="thread-remove-btn" data-idx="${i}">✕</button>
        <div class="thread-item-title">${t.title}</div>
        <div class="thread-item-text">${t.text}</div>
      </div>`,
    )
    .join("");

  container.querySelectorAll(".thread-remove-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      questThreads.splice(parseInt(btn.getAttribute("data-idx")), 1);
      renderQuestThreadList();
    });
  });
}

function questToTitleCase(str) {
  return str.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1));
}

// Add thread
document
  .getElementById("add-quest-thread-btn")
  .addEventListener("click", () => {
    document.getElementById("quest-thread-add-form").style.display = "block";
    document.getElementById("quest-thread-title-input").value = "";
    document.getElementById("quest-thread-text-input").value = "";
    document.getElementById("quest-thread-title-input").focus();
  });

document
  .getElementById("quest-thread-confirm-btn")
  .addEventListener("click", () => {
    const title = questToTitleCase(
      document.getElementById("quest-thread-title-input").value.trim(),
    );
    const text = document
      .getElementById("quest-thread-text-input")
      .value.trim();
    if (!title || !text) return;
    questThreads.push({ title, text });
    renderQuestThreadList();
    document.getElementById("quest-thread-add-form").style.display = "none";
  });

document
  .getElementById("quest-thread-cancel-btn")
  .addEventListener("click", () => {
    document.getElementById("quest-thread-add-form").style.display = "none";
  });

// Save quest
document
  .getElementById("save-quest-btn")
  .addEventListener("click", async () => {
    const id = document.getElementById("quest-edit-id").value;
    let subject = questToTitleCase(
      document.getElementById("quest-subject").value.trim(),
    );

    // Auto append question mark
    if (subject && !subject.endsWith("?")) subject += "?";

    const data = {
      subject: subject,
      author: document.getElementById("quest-author").value.trim(),
      threads: [...questThreads],
    };

    if (!data.subject) {
      await window.UMessageModal.error("Subject is required", "Validation");
      return;
    }

    if (id) {
      DataStore.update("quests", id, data);
    } else {
      DataStore.add("quests", data);
    }

    document.getElementById("modal-quest").classList.remove("open");
    refreshQuests();
  });

// Delete quest
document
  .getElementById("delete-quest-btn")
  .addEventListener("click", async () => {
    const id = document.getElementById("quest-edit-id").value;
    if (!id) return;
    if (
      !(await window.UMessageModal.confirm(
        "Delete this quest?",
        "Confirm Delete",
      ))
    )
      return;
    DataStore.remove("quests", id);
    document.getElementById("modal-quest").classList.remove("open");
    refreshQuests();
  });

// Close modal
document.getElementById("modal-quest-close").addEventListener("click", () => {
  document.getElementById("modal-quest").classList.remove("open");
});

// FAB
document
  .getElementById("fab-quest")
  .addEventListener("click", () => openQuestModal(null));
