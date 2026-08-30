(function () {
  document.getElementById("error-back-action")?.addEventListener("click", () => {
    if (window.history.length > 1) window.history.back();
    else window.location.assign("/");
  });
})();
