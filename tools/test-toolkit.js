const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

(async () => {
  try {
    const profileHtml = fs.readFileSync(
      path.join(__dirname, "..", "pages", "user-profile.html"),
      "utf8",
    );

    const dom = new JSDOM(
      `<!doctype html><html><body><div class="main"></div></body></html>`,
      {
        runScripts: "dangerously",
        resources: "usable",
      },
    );

    const { window } = dom;
    const { document } = window;

    // Minimal stubs used by the scripts
    window.DataStore = {
      syncFromRemote: () => Promise.resolve(),
      startSync: () => {},
      getAll: () => [],
      update: () => {},
    };
    window.emailjs = { send: async () => true };

    // Inject the profile HTML into the .main container
    document.querySelector(".main").innerHTML = profileHtml;

    // Load the user-profile.js script into the JSDOM environment
    const userProfileJs = fs.readFileSync(
      path.join(__dirname, "..", "js", "user-profile.js"),
      "utf8",
    );
    const scriptEl = document.createElement("script");
    scriptEl.textContent = userProfileJs;
    document.body.appendChild(scriptEl);

    // Give the script a moment to run initialization
    await new Promise((r) => setTimeout(r, 200));

    const toolkitBtn = document.getElementById("user-profile-open-toolkit");
    const settingsBtn = document.getElementById("user-profile-open-settings");
    const toolkitSection = document.getElementById("user-profile-toolkit-view");
    const settingsSection = document.getElementById(
      "user-profile-settings-view",
    );
    const mainSection = document.getElementById("user-profile-main-view");

    console.log("Initial visibility:", {
      main: mainSection ? mainSection.style.display : null,
      toolkit: toolkitSection ? toolkitSection.style.display : null,
      settings: settingsSection ? settingsSection.style.display : null,
    });

    if (!toolkitBtn) {
      console.error("Toolkit button not found");
      process.exit(2);
    }

    // Click toolkit
    toolkitBtn.click();
    await new Promise((r) => setTimeout(r, 100));

    console.log("After toolkit click visibility:", {
      main: mainSection ? mainSection.style.display : null,
      toolkit: toolkitSection ? toolkitSection.style.display : null,
      settings: settingsSection ? settingsSection.style.display : null,
    });

    // Click settings
    if (settingsBtn) settingsBtn.click();
    await new Promise((r) => setTimeout(r, 100));

    console.log("After settings click visibility:", {
      main: mainSection ? mainSection.style.display : null,
      toolkit: toolkitSection ? toolkitSection.style.display : null,
      settings: settingsSection ? settingsSection.style.display : null,
    });

    process.exit(0);
  } catch (err) {
    console.error("Test error:", err);
    process.exit(1);
  }
})();
