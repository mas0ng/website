(function themeController() {
  var storageKey = "mas0ng-theme-preference";
  var root = document.documentElement;
  var mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  function readStoredPreference() {
    try {
      var stored = localStorage.getItem(storageKey);
      if (stored === "light" || stored === "dark" || stored === "system") {
        return stored;
      }
    } catch (error) {
      console.warn("Theme preference could not be read.", error);
    }

    return "system";
  }

  function resolveTheme(mode) {
    if (mode === "light" || mode === "dark") {
      return mode;
    }

    return mediaQuery.matches ? "dark" : "light";
  }

  function persistPreference(mode) {
    try {
      if (mode === "system") {
        localStorage.removeItem(storageKey);
      } else {
        localStorage.setItem(storageKey, mode);
      }
    } catch (error) {
      console.warn("Theme preference could not be saved.", error);
    }
  }

  function applyTheme(mode) {
    var selectedMode = mode === "light" || mode === "dark" || mode === "system" ? mode : "system";
    var resolvedTheme = resolveTheme(selectedMode);

    root.setAttribute("data-theme-mode", selectedMode);
    root.setAttribute("data-theme", resolvedTheme);
    root.style.colorScheme = resolvedTheme;

    window.__siteTheme = {
      mode: selectedMode,
      resolved: resolvedTheme
    };

    return window.__siteTheme;
  }

  function setSiteTheme(mode) {
    var normalizedMode = mode === "light" || mode === "dark" || mode === "system" ? mode : "system";
    persistPreference(normalizedMode);
    return applyTheme(normalizedMode);
  }

  function toggleSiteTheme() {
    var currentMode = root.getAttribute("data-theme-mode") || "system";
    var currentResolvedTheme = root.getAttribute("data-theme") || resolveTheme(currentMode);
    var nextMode = currentResolvedTheme === "dark" ? "light" : "dark";
    return setSiteTheme(nextMode);
  }

  var initialMode = readStoredPreference();
  applyTheme(initialMode);

  if (typeof mediaQuery.addEventListener === "function") {
    mediaQuery.addEventListener("change", function () {
      if ((root.getAttribute("data-theme-mode") || "system") === "system") {
        applyTheme("system");
      }
    });
  } else if (typeof mediaQuery.addListener === "function") {
    mediaQuery.addListener(function () {
      if ((root.getAttribute("data-theme-mode") || "system") === "system") {
        applyTheme("system");
      }
    });
  }

  window.setSiteTheme = setSiteTheme;
  window.toggleSiteTheme = toggleSiteTheme;
})();
