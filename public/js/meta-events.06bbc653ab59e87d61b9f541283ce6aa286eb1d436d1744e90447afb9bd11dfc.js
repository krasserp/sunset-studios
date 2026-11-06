(() => {
  if (typeof window.sunsetTrackMeta === 'function') return;

  // Fixed payloads only: never pass link URLs, contact details or form fields to Meta.
  const events = new Map([
    ['lead', ['track', 'Lead', { content_name: 'Studio Enquiry' }]],
    ['whatsapp', ['track', 'Contact', { contact_method: 'whatsapp' }]],
    ['email', ['track', 'Contact', { contact_method: 'email' }]],
    ['availability', ['trackCustom', 'CheckAvailability']],
    ['flights', ['trackCustom', 'CheckFlights']],
    ['location', ['trackCustom', 'ViewLocation']]
  ]);
  window.sunsetTrackMeta = action => {
    if (!window.sunsetConsent?.marketing || typeof window.fbq !== 'function') return;
    const event = events.get(action);
    if (!event) return;
    try { window.fbq(...event); } catch (_) { /* Tracking must not interrupt enquiries or navigation. */ }
  };

  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0) return;
    const link = event.target?.closest?.('a[href], button[data-meta-event]');
    if (!link || link.disabled) return;
    if (link.tagName === 'A') {
      let url;
      try { url = new URL(link.href, window.location.href); } catch (_) { return; }
      if (url.protocol === 'mailto:') {
        window.sunsetTrackMeta('email');
        return;
      }
      if (!['http:', 'https:'].includes(url.protocol)) return;
      if (['wa.me', 'api.whatsapp.com'].includes(url.hostname)) {
        window.sunsetTrackMeta('whatsapp');
        return;
      }
    }
    // Only explicitly marked CTAs count; ordinary navigation and submit buttons do not.
    if (['availability', 'flights', 'location'].includes(link.dataset.metaEvent)) {
      window.sunsetTrackMeta(link.dataset.metaEvent);
    }
  });
})();
