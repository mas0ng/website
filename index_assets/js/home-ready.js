(() => {
  if (document.body?.dataset.page !== 'home') return;

  // This deferred script runs after the ASCII renderer's first draw and after
  // the document's stylesheets have loaded. Images and API calls are optional.
  const seen = new WeakSet();
  function watchImages() {
    document.querySelectorAll('#site-main .qualification-card__icon img, #site-main .social-tile__icon-wrap img').forEach((img) => {
      if (seen.has(img)) return;
      seen.add(img);
      const slot = img.parentElement;
      const done = () => slot.classList.remove('home-image-pending');
      if (img.complete) return;
      slot.classList.add('home-image-pending');
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
      if (img.complete) done();
    });
  }
  watchImages();
  new MutationObserver(watchImages).observe(document.getElementById('site-main'), { childList: true, subtree: true });

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
