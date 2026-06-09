window.MAS0NG_NAV_SCROLL = (function () {
  const NAV_H = 64;
  const HERO_SELECTORS = '.masthead';

  function findHero(root) {
    return (root || document).querySelector(HERO_SELECTORS);
  }

  function heroNavSolid(hero) {
    if (window.scrollY > 1) return true;
    if (!hero) return true;
    return hero.getBoundingClientRect().bottom <= NAV_H + 6;
  }

  function init(options = {}) {
    const hero = options.hero || findHero(options.root);
    let ticking = false;

    const update = () => {
      ticking = false;
      document.documentElement.toggleAttribute('data-nav-solid', heroNavSolid(hero));
      if (typeof options.onUpdate === 'function') {
        options.onUpdate({ hero, navSolid: document.documentElement.hasAttribute('data-nav-solid') });
      }
    };

    if (!hero) {
      document.documentElement.setAttribute('data-nav-solid', '');
      return () => {};
    }

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', update, { passive: true });

    return update;
  }

  return { NAV_H, findHero, heroNavSolid, init };
})();