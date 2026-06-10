window.MAS0NG_HTML = (function () {
  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }

  function safeHref(href) {
    if (!href || href === '#') return '#';

    if (href.startsWith('/') && !href.startsWith('//')) {
      return escapeAttr(href);
    }

    try {
      const parsed = new URL(href);
      if (['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol)) {
        return escapeAttr(href);
      }
    } catch {
      return '#';
    }

    return '#';
  }

  return { escapeHtml, escapeAttr, safeHref };
})();