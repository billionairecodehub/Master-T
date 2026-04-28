// Home page — Library grid (25 icons)
const libraryGrid = document.getElementById("home-library-grid");
if (libraryGrid) {
  const LIBRARY_ICON = "https://i.postimg.cc/508MnvsH/image.png";
  libraryGrid.innerHTML = Array.from({ length: 25 })
    .map(
      () =>
        `<div class="block-2-grid-item"><img src="${LIBRARY_ICON}" alt="" class="block-2-grid-icon" /></div>`,
    )
    .join("");
}

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
