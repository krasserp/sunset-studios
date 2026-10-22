(() => {
  const productionHost = ['sunset-studios.one', 'music.sunset-studios.one']
    .includes(window.location.hostname);
  const analyticsAllowed = productionHost && window.location.protocol === 'https:'
    && document.getElementById('site-consent-script')?.dataset.analyticsEnabled === 'true';
  // Staging must never read or overwrite the production consent choice.
  const key = productionHost ? 'sunset-cookie-consent-v1' : 'sunset-preview-consent-v1';
  const lifetime = 180 * 24 * 60 * 60 * 1000;
  const panel = document.getElementById('cookie-consent');
  const preferences = document.getElementById('cookie-preferences');
  const analytics = document.getElementById('cookie-analytics');
  const embeds = document.getElementById('cookie-embeds');
  const customize = document.getElementById('cookie-customize');
  const launcher = document.querySelector('.cookie-launcher');
  const sharedDomain = productionHost;
  function valid(value) {
    return value && typeof value.analytics === 'boolean' && typeof value.embeds === 'boolean'
      && Number.isFinite(value.at) && value.at <= Date.now() && Date.now() - value.at < lifetime;
  }
  function readChoice() {
    try {
      const entry = document.cookie.split('; ').find(item => item.startsWith(key + '='));
      const value = entry && JSON.parse(decodeURIComponent(entry.slice(key.length + 1)));
      return valid(value) ? value : undefined;
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
      saved = previous;
      storeChoice(saved);
    }
    localStorage.removeItem(key);
  } catch (_) {}
  let gtmLoaded = false;
  let previousFocus;
  function apply(choice) {
    window.sunsetConsent = { analytics: analyticsAllowed && choice.analytics, embeds: choice.embeds };
    analytics.checked = choice.analytics;
    embeds.checked = choice.embeds;
    if (analyticsAllowed && choice.analytics && !gtmLoaded) {
      gtmLoaded = true;
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtm.js?id=GTM-KV9P8PLM';
      document.head.appendChild(script);
    }
    document.querySelectorAll('iframe[data-consent-src]').forEach(frame => {
      if (choice.embeds) frame.src = frame.dataset.consentSrc;
      else frame.removeAttribute('src');
      frame.hidden = !choice.embeds;
    });
    document.querySelectorAll('.embed-consent-note').forEach(note => { note.hidden = choice.embeds; });
  }
  apply(saved || { analytics: false, embeds: false });
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
    const choice = latest || { analytics: false, embeds: false };
    if (gtmLoaded && !choice.analytics) {
      window.location.reload();
      return;
    }
    apply(choice);
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
        embeds: mode === 'all' || (mode === 'custom' && embeds.checked),
        at: Date.now()
      };
      storeChoice(choice);
      // Reload after withdrawal to stop any already-running container tags.
      const reload = gtmLoaded && !choice.analytics;
      apply(choice);
      panel.close();
      if (reload) window.location.reload();
    });
  });
})();
