(function () {
  function mountIcons() {
    window.lucide?.createIcons?.({ attrs: { "stroke-width": 1.8 } });
  }

  document.getElementById("error-back-action")?.addEventListener("click", () => {
    if (window.history.length > 1) window.history.back();
    else window.location.assign("/");
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountIcons, { once: true });
  } else {
    mountIcons();
  }
  window.addEventListener("load", mountIcons, { once: true });
})();
