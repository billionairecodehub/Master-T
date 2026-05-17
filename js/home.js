// Home page — Block 2 Store & Library books tabs (5 books + 1 more)
const HOME_BOOK_VISIBLE_MAX = 5;
const HOME_BOOK_FALLBACK_ICON = "https://i.postimg.cc/VNY8Ymks/image.png";

function _getHomeStoreBooks() {
  return DataStore.getAll("books").filter((b) => !b.draft);
}

function _openHomeBookInStore(bookId) {
  if (!bookId) return;

  if (typeof _navigateTo === "function") _navigateTo("/store");

  if (
    typeof showPage === "function" &&
    typeof menuPage !== "undefined" &&
    menuPage
  ) {
    showPage(menuPage);
  }

  if (typeof markStoreSeen === "function") markStoreSeen();
  if (typeof _setActiveNav === "function") _setActiveNav("menu");
  window._menuDetailOrigin = "home";

  const openDetail = () => {
    if (typeof _menuOpenBook === "function") _menuOpenBook(bookId);
  };

  requestAnimationFrame(openDetail);
}

function _openHomeBooksListInStore() {
  if (typeof _navigateTo === "function") _navigateTo("/store");

  if (
    typeof showPage === "function" &&
    typeof menuPage !== "undefined" &&
    menuPage
  ) {
    showPage(menuPage);
  }

  if (typeof markStoreSeen === "function") markStoreSeen();
  if (typeof _setActiveNav === "function") _setActiveNav("menu");

  requestAnimationFrame(() => {
    const booksTab = document.querySelector('.abc-title[data-category="books"]');
    if (booksTab) booksTab.click();
  });
}

function renderHomeBooksGrid() {
  const grid = document.getElementById("home-library-grid");
  if (!grid) return;

  const books = _getHomeStoreBooks();
  const visibleBooks = books.slice(0, HOME_BOOK_VISIBLE_MAX);

  let html = "";
  for (let i = 0; i < HOME_BOOK_VISIBLE_MAX; i++) {
    const book = visibleBooks[i];
    if (book) {
      html += `<button class="block-2-grid-item block-2-book-slot" data-id="${book.id}" aria-label="Open ${book.name}">
        <img src="${book.img || HOME_BOOK_FALLBACK_ICON}" alt="${book.name}" class="block-2-grid-icon" />
      </button>`;
    } else {
      html += `<div class="block-2-grid-item block-2-grid-item-empty" aria-label="Incoming book slot"></div>`;
    }
  }

  // Last (6th) tab: more books → open Store Books list
  html += `<button class="block-2-grid-item block-2-more-slot" id="home-library-more" aria-label="Open more books">
      <div class="block-2-more-icon">+</div>
      <div class="block-2-more-text">More</div>
    </button>`;

  grid.innerHTML = html;

  grid.querySelectorAll(".block-2-book-slot").forEach((slot) => {
    slot.addEventListener("click", () => {
      const bookId = slot.getAttribute("data-id");
      _openHomeBookInStore(bookId);
    });
  });

  const moreBtn = document.getElementById("home-library-more");
  if (moreBtn) {
    moreBtn.addEventListener("click", _openHomeBooksListInStore);
  }
}

window.renderHomeBooksGrid = renderHomeBooksGrid;
renderHomeBooksGrid();

// Home page — Block 3 Apps sequence with permanent More board at the end
const HOME_APP_FALLBACK_ICON = "https://i.postimg.cc/VNY8Ymks/image.png";

function _getHomeStoreApps() {
  return DataStore.getAll("apps").filter((a) => !a.draft);
}

function _openHomeAppInStore(appId) {
  if (!appId) return;

  if (typeof _navigateTo === "function") _navigateTo("/store");

  if (
    typeof showPage === "function" &&
    typeof menuPage !== "undefined" &&
    menuPage
  ) {
    showPage(menuPage);
  }

  if (typeof markStoreSeen === "function") markStoreSeen();
  if (typeof _setActiveNav === "function") _setActiveNav("menu");
  window._menuDetailOrigin = "home";

  const openDetail = () => {
    if (typeof _menuOpenApp === "function") _menuOpenApp(appId);
  };

  requestAnimationFrame(openDetail);
}

function renderHomeAppsSlots() {
  const slotsWrap = document.getElementById("home-app-slots");
  if (!slotsWrap) return;

  const apps = _getHomeStoreApps();

  let html = "";
  apps.forEach((app) => {
    html += `<button class="block-3-icon-item block-3-app-slot" data-id="${app.id}" aria-label="Open ${app.name}">
      <img src="${app.img || HOME_APP_FALLBACK_ICON}" alt="${app.name}" class="block-3-icon-img" />
    </button>`;
  });

  html += `<button class="block-3-icon-item block-3-more-slot" id="home-app-more" aria-label="Open more apps">
    <div class="block-3-more-plus">+</div>
    <div class="block-3-more-text">More</div>
  </button>`;

  slotsWrap.innerHTML = html;

  slotsWrap.querySelectorAll(".block-3-app-slot").forEach((slot) => {
    slot.addEventListener("click", () => {
      const appId = slot.getAttribute("data-id");
      _openHomeAppInStore(appId);
    });
  });

  const moreBtn = document.getElementById("home-app-more");
  if (moreBtn) {
    moreBtn.addEventListener("click", () => {
      if (typeof _navigateTo === "function") _navigateTo("/store");
      if (typeof showPage === "function" && typeof menuPage !== "undefined") {
        showPage(menuPage);
      }
      if (typeof markStoreSeen === "function") markStoreSeen();
      if (typeof _setActiveNav === "function") _setActiveNav("menu");
      requestAnimationFrame(() => {
        const appsTab = document.querySelector('.abc-title[data-category="apps"]');
        if (appsTab) appsTab.click();
      });
    });
  }
}

window.renderHomeAppsSlots = renderHomeAppsSlots;
renderHomeAppsSlots();

window.addEventListener("mt:remote-update", (e) => {
  const changed = e.detail?.changed || null;
  if (!changed || changed === "apps") renderHomeAppsSlots();
  if (!changed || changed === "books") renderHomeBooksGrid();
});

// Home page — Subscribe form
const subBtn = document.querySelector(".block-5-btn");
if (subBtn) {
  subBtn.addEventListener("click", () => {
    const inputs = document.querySelectorAll(".block-5-input");
    const name = inputs[0] ? inputs[0].value.trim() : "";
    const email = inputs[1] ? inputs[1].value.trim() : "";
    if (!name || !email) return;
    DataStore.add("subscribers", { name, email });
    inputs[0].value = "";
    inputs[1].value = "";
    subBtn.textContent = "Subscribed!";
    setTimeout(() => {
      subBtn.textContent = "Enter";
    }, 2000);
  });
}
