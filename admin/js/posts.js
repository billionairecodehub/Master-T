// admin/js/posts.js — Posts CRUD

let postThreads = [];

function refreshPosts() {
  const posts = DataStore.getAll("posts");
  const list = document.getElementById("post-list");

  if (posts.length === 0) {
    list.innerHTML =
      '<div class="admin-empty"><div class="admin-empty-icon">✏️</div><div class="admin-empty-text">No posts yet</div></div>';
    return;
  }

  list.innerHTML = posts
    .map(
      (p) => `
      <div class="post-list-card" data-post-id="${p.id}">
        <div class="post-list-top">
          <div class="post-list-subject">${p.subject}</div>
          <div class="post-list-date">${p.date || ""}</div>
        </div>
        <div class="post-list-preview">${p.content}</div>
      </div>`,
    )
    .join("");

  // Click to edit
  list.querySelectorAll(".post-list-card").forEach((card) => {
    card.addEventListener("click", () => {
      const post = DataStore.getById(
        "posts",
        card.getAttribute("data-post-id"),
      );
      if (post) openPostModal(post);
    });
  });
}

function openPostModal(post) {
  const modal = document.getElementById("modal-post");
  const titleEl = document.getElementById("modal-post-title");
  const delBtn = document.getElementById("delete-post-btn");

  if (post) {
    titleEl.textContent = "Edit Post";
    document.getElementById("post-edit-id").value = post.id;
    document.getElementById("post-subject").value = post.subject || "";
    document.getElementById("post-author").value =
      post.author || "Master Togan";
    document.getElementById("post-date").value = post.date || "";
    document.getElementById("post-content").value = post.content || "";
    document.getElementById("post-timeframe").value = post.timeframe || "";
    document.getElementById("post-cta").value = post.ctaLabel || "";
    postThreads = post.threads ? [...post.threads] : [];
    delBtn.style.display = "block";
  } else {
    titleEl.textContent = "New Post";
    document.getElementById("post-edit-id").value = "";
    document.getElementById("post-subject").value = "";
    document.getElementById("post-author").value = "Master Togan";
    document.getElementById("post-date").value = "";
    document.getElementById("post-content").value = "";
    document.getElementById("post-timeframe").value = "";
    document.getElementById("post-cta").value = "";
    postThreads = [];
    delBtn.style.display = "none";
  }

  renderThreadList();
  modal.classList.add("open");
}

function renderThreadList() {
  const container = document.getElementById("thread-list");
  container.innerHTML = postThreads
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
      postThreads.splice(parseInt(btn.getAttribute("data-idx")), 1);
      renderThreadList();
    });
  });
}

// Add thread — inline form instead of prompt()
document.getElementById("add-thread-btn").addEventListener("click", () => {
  document.getElementById("thread-add-form").style.display = "block";
  document.getElementById("thread-title-input").value = "";
  document.getElementById("thread-text-input").value = "";
  document.getElementById("thread-title-input").focus();
});

document.getElementById("thread-confirm-btn").addEventListener("click", () => {
  const title = toTitleCase(
    document.getElementById("thread-title-input").value.trim(),
  );
  const text = document.getElementById("thread-text-input").value.trim();
  if (!title || !text) return;
  postThreads.push({ title, text });
  renderThreadList();
  document.getElementById("thread-add-form").style.display = "none";
});

document.getElementById("thread-cancel-btn").addEventListener("click", () => {
  document.getElementById("thread-add-form").style.display = "none";
});

function toTitleCase(str) {
  return str.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1));
}

// Save
document.getElementById("save-post-btn").addEventListener("click", () => {
  const id = document.getElementById("post-edit-id").value;
  const data = {
    subject: toTitleCase(document.getElementById("post-subject").value.trim()),
    author: document.getElementById("post-author").value.trim(),
    date: document.getElementById("post-date").value.trim(),
    content: document.getElementById("post-content").value.trim(),
    timeframe: document.getElementById("post-timeframe").value.trim(),
    ctaLabel: document.getElementById("post-cta").value.trim(),
    threads: [...postThreads],
  };

  if (!data.subject) return alert("Subject is required");

  console.log("[POSTS] Saving post...", { id, data });

  if (id) {
    const result = DataStore.update("posts", id, data);
    console.log("[POSTS] Update result:", result);
  } else {
    const result = DataStore.add("posts", data);
    console.log("[POSTS] Add result:", result);
  }

  // Verify save
  const allPosts = DataStore.getAll("posts");
  console.log("[POSTS] After save, total posts:", allPosts.length, allPosts);

  document.getElementById("modal-post").classList.remove("open");
  refreshPosts();
});

// Delete
document.getElementById("delete-post-btn").addEventListener("click", () => {
  const id = document.getElementById("post-edit-id").value;
  if (!id) return;
  if (!confirm("Delete this post?")) return;
  DataStore.remove("posts", id);
  document.getElementById("modal-post").classList.remove("open");
  refreshPosts();
});

// Close modal
document.getElementById("modal-post-close").addEventListener("click", () => {
  document.getElementById("modal-post").classList.remove("open");
});

// FAB
document
  .getElementById("fab-post")
  .addEventListener("click", () => openPostModal(null));
