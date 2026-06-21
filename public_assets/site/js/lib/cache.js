(function () {
  const MANIFEST_KEY = 'mas0ng:cache-versions';
  const CACHE_PREFIX = 'mas0ng:asset:';
  const LEGACY_PREFIXES = ['font:', 'img:'];
  const VERSIONS_URL = '/public_assets/configs/cache-versions.json';
  const memory = new Map();
  const storageFreePage = new Set(['home', 'legal', 'error', 'bio'])
    .has(document.body?.dataset?.page || 'page');

  function readStore(key, persistent = false) {
    if (storageFreePage) return null;
    try {
      return (persistent ? localStorage : sessionStorage).getItem(key);
    } catch {
      return null;
    }
  }

  function writeStore(key, value, persistent = false) {
    if (storageFreePage) return undefined;
    try {
      (persistent ? localStorage : sessionStorage).setItem(key, value);
    } catch {
      return undefined;
    }
  }

  function removeStore(key, persistent = false) {
    if (storageFreePage) return undefined;
    try {
      (persistent ? localStorage : sessionStorage).removeItem(key);
    } catch {
      return undefined;
    }
  }

  function storageKey(key) {
    return `${CACHE_PREFIX}${key}`;
  }

  function readManifest() {
    const raw = readStore(MANIFEST_KEY, true);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      return null;
    }
  }

  function writeManifest(manifest) {
    writeStore(MANIFEST_KEY, JSON.stringify(manifest), true);
  }

  function manifestChanged(previous, next) {
    const keys = new Set([
      ...Object.keys(previous || {}),
      ...Object.keys(next || {})
    ]);

    for (const key of keys) {
      if (key.startsWith('_')) continue;
      if ((previous || {})[key] !== (next || {})[key]) {
        return true;
      }
    }

    return false;
  }

  function destroyCache() {
    memory.clear();

    [sessionStorage, localStorage].forEach((store) => {
      for (let index = store.length - 1; index >= 0; index -= 1) {
        const key = store.key(index);
        if (!key || key === MANIFEST_KEY) continue;

        const isManaged = key.startsWith(CACHE_PREFIX)
          || LEGACY_PREFIXES.some((prefix) => key.startsWith(prefix));

        if (isManaged) {
          store.removeItem(key);
        }
      }
    });
  }

  function resolvePageVersionKey() {
    const page = document.body?.dataset?.page || 'page';
    const path = window.location.pathname.replace(/\/index\.html$/, '/');

    if (page === 'home' || path === '/') return 'home_page';
    if (page === 'bio') return 'bio_page';
    if (page === 'legal' || path.startsWith('/legal')) return 'legal_pages';
    if (page === 'apps' || path === '/public/apps/') return 'public_apps_index';
    if (path.startsWith('/public/apps/a/mosaic')) return 'apps_mosaic';
    if (path.startsWith('/public/apps/a/qr')) return 'apps_qr_generator';
    if (path.startsWith('/public/apps/a/dice')) return 'apps_dice_roll';
    if (path.startsWith('/public/apps/a/html-viewer')) return 'apps_html_viewer';
    if (path.startsWith('/public/apps/a/timer')) return 'apps_timer';
    if (page === 'app') return 'site_shell';
    if (page === 'error') return 'site_shell';
    return 'site_shell';
  }

  async function syncVersions() {
    let manifest = null;

    try {
      const response = await fetch(VERSIONS_URL, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      manifest = await response.json();
    } catch (error) {
      console.warn('Cache version config could not be loaded:', error);
      return readManifest();
    }

    const cleaned = Object.fromEntries(
      Object.entries(manifest || {}).filter(([key]) => !key.startsWith('_'))
    );

    if (storageFreePage) return cleaned;

    const previous = readManifest();
    if (!previous || manifestChanged(previous, cleaned)) {
      destroyCache();
      writeManifest(cleaned);
    }

    return cleaned;
  }

  function isMarked(key) {
    const id = storageKey(key);
    return readStore(id) === '1' || memory.has(id);
  }

  function markKey(key) {
    const id = storageKey(key);
    writeStore(id, '1');
    memory.set(id, true);
  }

  const ready = syncVersions();

  window.MAS0NG_CACHE = {
    ready,

    getVersions() {
      return readManifest();
    },

    getPageVersionKey() {
      return resolvePageVersionKey();
    },

    has(key) {
      return isMarked(key);
    },

    mark(key) {
      markKey(key);
    },

    destroyAll() {
      destroyCache();
      removeStore(MANIFEST_KEY, true);
    },

    preloadImage(src) {
      const key = `img:${src}`;
      if (isMarked(key)) {
        return Promise.resolve();
      }

      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          markKey(key);
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
