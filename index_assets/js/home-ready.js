(() => {
  if (document.body?.dataset.page !== 'home') return;

  // This deferred script runs after the ASCII renderer's first draw and after
  // the document's stylesheets have loaded. Images and API calls are optional.
  let revealed = false;
  const reveal = () => {
    if (revealed) return;
    revealed = true;
    clearTimeout(fallback);
    window.MAS0NG_LOADER?.hide();
    // Do not tie the wordmark to window.load, which includes image downloads.
    window.requestAnimationFrame(() => {
      document.getElementById('hero-title')?.removeAttribute('data-animation-pending');
    });
  };
  // A failed/slow font must not hold the page indefinitely; CSS supplies fallback text.
  const fallback = window.setTimeout(reveal, 2000);
  Promise.resolve(document.fonts?.load('16px ABeeZee')).catch(() => {}).then(() => {
    window.requestAnimationFrame(reveal);
  });
})();
