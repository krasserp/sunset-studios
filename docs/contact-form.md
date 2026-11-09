# Contact form activation

1. Create a Formspree form delivering to the studio email and verify the recipient.
2. Set `params.contactFormEndpoint` in `hugo.toml` to its HTTPS endpoint (for example `https://formspree.io/f/YOUR_FORM_ID`). The endpoint must accept JSON and return a non-2xx response on rejection. Until configured, submission is disabled and the page offers email contact.
3. Rebuild and deploy Hugo through the existing hosting workflow.
4. Keep the existing GTM container, Google tag and imported Google Ads conversion unchanged. The handler sends `conversion_event_submit_lead_form` through the existing Google tag command queue; no additional trigger, tag or Analytics initialization is required.
5. Use GTM Preview to confirm a real accepted enquiry produces one event and arrives in the inbox. Invalid fields, failed requests, and repeat clicks must not produce events. Check GA4 DebugView and acquisition reporting with campaign UTM links.

The site sends no names, email addresses, message text or project dates to the data layer. The form service receives these enquiry details; review the privacy notice when activating the service. No live submission or GTM publication has been performed by this change.

After Formspree accepts an enquiry, the shared Contact/Winter Retreat handler calls `window.sunsetTrackMeta('lead')`. The shared helper sends one Meta `Lead` event with `content_name: 'Studio Enquiry'` only when `window.sunsetConsent.marketing` is true and `window.fbq` is available. Invalid forms, failed or pending requests, and repeat submissions do not count. The existing Google `form_submitted` event still depends only on Analytics consent and is unchanged.

The handler lives in `assets/js/contact.js` and both enquiry pages load it through Hugo's fingerprint pipeline. Deploy the rebuilt HTML together with its hashed scripts from `public/` so browsers use the updated handlers. After manual deployment, save Marketing consent, submit a clearly labelled test enquiry, and check Meta Events Manager for `Lead`. No live enquiry has been sent during local validation.

Run `node --test tests/*.test.cjs` to check submission tracking, click events and cookie consent without sending a live enquiry. See [Meta tracking and browser checklist](meta-pixel.md).

## GA4 accepted-enquiry conversion

In `assets/js/contact.js`, immediately after the preserved `form_submitted` push, the AJAX success handler queues the Arguments command equivalent to `gtag('event', 'conversion_event_submit_lead_form')`. This uses the existing `dataLayer` and configured Google tag destinations, with no new initialization or personal data. See [Google's command queue documentation](https://developers.google.com/tag-platform/devguides/datalayer).

Both Google events require `window.sunsetConsent?.analytics` at response time. That effective flag already includes production hostname, HTTPS, build configuration and visitor consent checks from `consent.js`. A denied or missing consent choice queues no conversion and is never replayed after consent changes. The existing `submitting` guard blocks concurrent requests and remains set after success; retries after failure remain possible. A new enquiry after reloading the form can count separately. Rendering a success message cannot dispatch the event.

Local verification: `node --test tests/*.test.cjs` covers accepted/rejected/failed/timed-out requests, invalid forms, pending and repeat submissions, consent combinations, withdrawal during a request, no delayed replay, later enquiries, and preserved Meta events. Build into a temporary directory to check fingerprinted assets without changing reviewed production artifacts: `hugo --destination /tmp/sunset-ga4-build --cacheDir /tmp/sunset-ga4-cache`.

After a separately authorized deployment, use Tag Assistant on the HTTPS production site and grant Analytics consent. Submit a clearly labelled test enquiry (this sends a real enquiry). Confirm exactly one `conversion_event_submit_lead_form` Google event command after the accepted response, alongside the unchanged `form_submitted` event. Check that the outgoing GA4 request targets the existing Sunset Studios measurement ID, then open that property's Realtime event list or DebugView with Tag Assistant debug mode enabled. Repeat a submit click to confirm no duplicate. With Analytics denied, a successful enquiry must produce neither Google event; granting consent afterward must not replay it. No GA4 dashboard receipt or live GTM destination configuration is verified by local tests.
