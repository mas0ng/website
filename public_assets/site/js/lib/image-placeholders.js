(() => {
  const seen = new WeakSet();
  function scan() {
    document.querySelectorAll('.social-tile__icon-wrap img, .qualification-card__icon img, .bio-profile img').forEach(img => {
      if (seen.has(img)) return;
      seen.add(img);
      const slot = img.parentElement;
      const finish = () => {
        slot.classList.remove('image-pending');
        slot.classList.toggle('image-unavailable', !img.naturalWidth);
      };
      if (img.complete) { finish(); return; }
      slot.classList.add('image-pending');
      img.addEventListener('load', finish, {once:true});
      img.addEventListener('error', finish, {once:true});
    });
  }
  scan();
  new MutationObserver(scan).observe(document.getElementById('site-main') || document.body, {childList:true,subtree:true});
})();
