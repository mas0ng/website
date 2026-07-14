(function () {
  const STORAGE_KEY = 'mas0ng_privacy_notice_acknowledged_v1';

  function wasAcknowledged() {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }

  function rememberAcknowledgement() {
    try {
      window.localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // The notice can still be dismissed for this page view if storage is unavailable.
    }
  }

  function init() {
    if (document.body.matches('[data-page="auth"]')) return;
    if (wasAcknowledged() || document.getElementById('privacy-notice')) return;

    const notice = document.createElement('aside');
    notice.className = 'privacy-notice';
    notice.id = 'privacy-notice';
    notice.setAttribute('role', 'dialog');
    notice.setAttribute('aria-labelledby', 'privacy-notice-title');
    notice.setAttribute('aria-describedby', 'privacy-notice-copy');
    notice.innerHTML = `
      <div class="privacy-notice__icon" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v5c0 4.6-2.8 8.1-7 10-4.2-1.9-7-5.4-7-10V6l7-3z"/><rect x="9" y="10.5" width="6" height="5" rx="1"/><path d="M10.5 10.5V9a1.5 1.5 0 013 0v1.5"/></svg>
      </div>
      <div class="privacy-notice__body">
        <h2 class="privacy-notice__title" id="privacy-notice-title">Your privacy on mas0ng.com</h2>
        <p class="privacy-notice__copy" id="privacy-notice-copy">This public site does not use analytics, advertising, or cross-site tracking. Dismissing this informational notice saves one preference on this device. Sign-in and the security-report form use separate, strictly necessary security technologies described in the cookie notice.</p>
        <p class="privacy-notice__links"><a href="/legal/privacy/">Privacy policy</a><span aria-hidden="true">&middot;</span><a href="/legal/cookies.html">Cookie notice</a></p>
      </div>
      <button class="privacy-notice__confirm" type="button">Dismiss notice</button>
    `;

    document.body.append(notice);
    window.requestAnimationFrame(() => notice.classList.add('is-visible'));

    notice.querySelector('.privacy-notice__confirm').addEventListener('click', () => {
      rememberAcknowledgement();
      notice.classList.remove('is-visible');
      notice.addEventListener('transitionend', () => notice.remove(), { once: true });
      window.setTimeout(() => notice.remove(), 300);
    });
  }

  window.MAS0NG_PRIVACY_NOTICE = { init };
})();
