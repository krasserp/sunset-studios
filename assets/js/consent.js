(() => {
  const productionHost = ['sunset-studios.one', 'music.sunset-studios.one']
    .includes(window.location.hostname);
  const analyticsAllowed = productionHost && window.location.protocol === 'https:'
    && document.getElementById('site-consent-script')?.dataset.analyticsEnabled === 'true';
  const marketingAllowed = productionHost && window.location.protocol === 'https:'
    && document.getElementById('site-consent-script')?.dataset.marketingEnabled === 'true';
  // Staging must never read or overwrite the production consent choice.
  const key = productionHost ? 'sunset-cookie-consent-v1' : 'sunset-preview-consent-v1';
  const lifetime = 180 * 24 * 60 * 60 * 1000;
  const panel = document.getElementById('cookie-consent');
  const preferences = document.getElementById('cookie-preferences');
  const analytics = document.getElementById('cookie-analytics');
  const marketing = document.getElementById('cookie-marketing');
  const embeds = document.getElementById('cookie-embeds');
  const customize = document.getElementById('cookie-customize');
  const launcher = document.querySelector('.cookie-launcher');
  const sharedDomain = productionHost;
  function valid(value) {
    return value && typeof value.analytics === 'boolean' && typeof value.embeds === 'boolean'
      && (value.marketing === undefined || typeof value.marketing === 'boolean')
      && Number.isFinite(value.at) && value.at <= Date.now() && Date.now() - value.at < lifetime;
  }
  function normalize(value) {
    // Older analytics choices never grant permission for marketing.
    return { analytics: value.analytics, marketing: value.marketing === true,
      embeds: value.embeds, at: value.at };
  }
  function readChoice() {
    try {
      const entry = document.cookie.split('; ').find(item => item.startsWith(key + '='));
      const value = entry && JSON.parse(decodeURIComponent(entry.slice(key.length + 1)));
      return valid(value) ? normalize(value) : undefined;
    } catch (_) { return undefined; }
  }
  function storeChoice(choice) {
    const remaining = Math.max(0, Math.floor((choice.at + lifetime - Date.now()) / 1000));
    try {
      document.cookie = key + '=' + encodeURIComponent(JSON.stringify(choice))
        + '; Path=/; Max-Age=' + remaining + '; SameSite=Lax'
        + (sharedDomain ? '; Domain=sunset-studios.one' : '')
        + (window.location.protocol === 'https:' ? '; Secure' : '');
    } catch (_) { /* Cookies may be blocked; keep this page's choice in memory. */ }
  }
  let saved = readChoice();
  // Migrate the previous host-only storage once; the shared cookie takes precedence.
  try {
    const previous = JSON.parse(localStorage.getItem(key));
    if (!saved && valid(previous)) {
      saved = normalize(previous);
      storeChoice(saved);
    }
    localStorage.removeItem(key);
  } catch (_) {}
  let gtmLoaded = false;
  let clarityLoaded = false;
  let metaLoaded = false;
  const emptyChoice = { analytics: false, marketing: false, embeds: false };
  let previousFocus;
  function clearClarityCookies() {
    if (!productionHost || !document.cookie.split('; ').some(entry => /^_cl(?:ck|sk)=/.test(entry))) return;
    // Only expire Clarity's first-party cookies, at the host and shared domain.
    const domains = new Set(['', window.location.hostname, 'sunset-studios.one']);
    for (const name of ['_clck', '_clsk']) {
      for (const domain of domains) {
        document.cookie = name + '=; Path=/; Max-Age=0; SameSite=Lax'
          + (domain ? '; Domain=' + domain : '')
          + (window.location.protocol === 'https:' ? '; Secure' : '');
      }
    }
  }
  function apply(choice) {
    const reload = ((gtmLoaded || clarityLoaded) && !choice.analytics) || (metaLoaded && !choice.marketing);
    window.sunsetConsent = { analytics: analyticsAllowed && choice.analytics,
      marketing: marketingAllowed && choice.marketing, embeds: choice.embeds };
    analytics.checked = choice.analytics;
    marketing.checked = choice.marketing;
    embeds.checked = choice.embeds;
    if (clarityLoaded && !choice.analytics) {
      try {
        window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'denied' });
      } catch (_) { /* Still stop and reload if a tracking script fails. */ }
      try { window.clarity('stop'); } catch (_) { /* Reload also stops the runtime. */ }
    }
    if (!window.sunsetConsent.analytics) clearClarityCookies();
    if (metaLoaded && !choice.marketing && typeof window.fbq === 'function') {
      try { window.fbq('consent', 'revoke'); } catch (_) { /* Reload also stops the pixel. */ }
    }
    if (!reload && analyticsAllowed && choice.analytics && !gtmLoaded) {
      gtmLoaded = true;
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtm.js?id=GTM-KV9P8PLM';
      document.head.appendChild(script);
    }
    if (!reload && analyticsAllowed && choice.analytics && !clarityLoaded) {
      clarityLoaded = true;
      window.clarity = window.clarity || function () {
        (window.clarity.q = window.clarity.q || []).push(arguments);
      };
      // Queue consent before the remote script can execute; advertising stays off.
      window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'granted' });
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.clarity.ms/tag/za3re3nddc';
      document.head.appendChild(script);
    }
    if (!reload && marketingAllowed && choice.marketing && !metaLoaded) {
      metaLoaded = true;
      if (!window.fbq) {
        const fbq = window.fbq = function () {
          if (fbq.callMethod) fbq.callMethod.apply(fbq, arguments);
          else fbq.queue.push(arguments);
        };
        if (!window._fbq) window._fbq = fbq;
        fbq.push = fbq;
        fbq.loaded = true;
        fbq.version = '2.0';
        fbq.queue = [];
        const pixel = document.createElement('script');
        pixel.async = true;
        pixel.src = 'https://connect.facebook.net/en_US/fbevents.js';
        document.head.appendChild(pixel);
      }
      window.fbq('set', 'autoConfig', false, '990608840778572');
      window.fbq('init', '990608840778572');
      window.fbq('track', 'PageView');
    }
    document.querySelectorAll('iframe[data-consent-src]').forEach(frame => {
      if (choice.embeds) frame.src = frame.dataset.consentSrc;
      else frame.removeAttribute('src');
      frame.hidden = !choice.embeds;
    });
    document.querySelectorAll('.embed-consent-note').forEach(note => { note.hidden = choice.embeds; });
    return reload;
  }
  apply(saved || emptyChoice);
  // Ask on first visit or when the saved choice has expired.
  panel.hidden = Boolean(saved);
  if (!saved) panel.showModal();
  launcher.hidden = false;
  launcher.setAttribute('aria-expanded', String(!panel.hidden));
  document.querySelectorAll('[data-cookie-settings]').forEach(button => {
    button.addEventListener('click', () => {
      previousFocus = button;
      panel.hidden = false;
      panel.showModal();
      launcher.setAttribute('aria-expanded', 'true');
      preferences.hidden = false;
      customize.setAttribute('aria-expanded', 'true');
      panel.querySelector('button').focus();
    });
  });
  panel.addEventListener('close', () => {
    panel.hidden = true;
    launcher.setAttribute('aria-expanded', 'false');
    (previousFocus || launcher).focus();
  });
  // Returning from the shop must honour choices changed on that subdomain.
  window.addEventListener('focus', () => {
    const latest = readChoice();
    const choice = latest || emptyChoice;
    if (apply(choice)) {
      window.location.reload();
      return;
    }
    launcher.setAttribute('aria-expanded', String(!panel.hidden));
  });
  customize.addEventListener('click', () => {
    preferences.hidden = !preferences.hidden;
    customize.setAttribute('aria-expanded', String(!preferences.hidden));
  });
  panel.querySelectorAll('[data-consent-choice]').forEach(button => {
    button.addEventListener('click', () => {
      const mode = button.dataset.consentChoice;
      const choice = {
        analytics: mode === 'all' || (mode === 'custom' && analytics.checked),
        marketing: mode === 'all' || (mode === 'custom' && marketing.checked),
        embeds: mode === 'all' || (mode === 'custom' && embeds.checked),
        at: Date.now()
      };
      storeChoice(choice);
      // Update effective consent immediately, then stop already-loaded trackers.
      const reload = apply(choice);
      panel.close();
      if (reload) window.location.reload();
    });
  });
})();
