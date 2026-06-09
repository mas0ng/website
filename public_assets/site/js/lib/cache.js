(function () {
  const memory = new Map();

  function readStore(key) {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function writeStore(key, value) {
    try {
      sessionStorage.setItem(key, value);
    } catch {
      return undefined;
    }
  }

  window.MAS0NG_CACHE = {
    has(key) {
      return readStore(key) === '1' || memory.has(key);
    },

    mark(key) {
      writeStore(key, '1');
      memory.set(key, true);
    },

    preloadImage(src) {
      if (memory.has(`img:${src}`)) {
        return Promise.resolve();
      }

      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          memory.set(`img:${src}`, true);
          resolve();
        };
        img.onerror = () => reject(new Error(`Failed to load ${src}`));
        img.src = src;
      });
    },

    loadFontFace(family, urls) {
      const key = `font:${family}`;
      if (this.has(key) || !window.FontFace) {
        return Promise.resolve();
      }

      const src = urls.map((url, index, list) => {
        const format = url.endsWith('.woff2') ? 'woff2' : 'woff';
        const suffix = index < list.length - 1 ? ',' : '';
        return `url(${url}) format("${format}")${suffix}`;
      }).join(' ');

      const face = new FontFace(family, src, { weight: '400 700', style: 'normal' });
      return face.load().then((loaded) => {
        document.fonts.add(loaded);
        this.mark(key);
      });
    }
  };
})();