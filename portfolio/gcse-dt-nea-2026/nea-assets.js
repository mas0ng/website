(() => {
  "use strict";

  const pdfButton = document.querySelector("[data-nea-pdf]");
  const unavailableDialog = document.querySelector("[data-nea-unavailable]");
  const closeButton = document.querySelector("[data-nea-unavailable-close]");

  if (!pdfButton || !unavailableDialog) return;

  const openDialog = () => {
    if (typeof unavailableDialog.showModal === "function") {
      unavailableDialog.showModal();
    } else {
      unavailableDialog.setAttribute("open", "");
    }
  };

  const closeDialog = () => {
    if (typeof unavailableDialog.close === "function") {
      unavailableDialog.close();
    } else {
      unavailableDialog.removeAttribute("open");
      pdfButton.focus();
    }
  };

  pdfButton.addEventListener("click", openDialog);
  closeButton?.addEventListener("click", closeDialog);

  unavailableDialog.addEventListener("click", (event) => {
    if (event.target === unavailableDialog) closeDialog();
  });

  unavailableDialog.addEventListener("close", () => pdfButton.focus());
})();
