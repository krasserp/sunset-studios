# Contact form activation

1. Create a Formspree form delivering to the studio email and verify the recipient.
2. Set `params.contactFormEndpoint` in `hugo.toml` to its HTTPS endpoint (for example `https://formspree.io/f/YOUR_FORM_ID`). The endpoint must accept JSON and return a non-2xx response on rejection. Until configured, submission is disabled and the page offers email contact.
3. Rebuild and deploy Hugo through the existing hosting workflow.
4. In GTM container GTM-KV9P8PLM, add a Custom Event trigger named `form_submitted`. Attach a GA4 event tag (for example `generate_lead`) using the existing Google tag. Optionally pass `form_id` and `project_type` as data layer variables. Mark the corresponding GA4 event as a key event. Publish the container.
5. Use GTM Preview to confirm a real accepted enquiry produces one event and arrives in the inbox. Invalid fields, failed requests, and repeat clicks must not produce events. Check GA4 DebugView and acquisition reporting with campaign UTM links.

The site sends no names, email addresses, message text or project dates to the data layer. The form service receives these enquiry details; review the privacy notice when activating the service. No live submission or GTM publication has been performed by this change.

After Formspree accepts an enquiry, the shared Contact/Winter Retreat handler calls `window.sunsetTrackMeta('lead')`. The shared helper sends one Meta `Lead` event with `content_name: 'Studio Enquiry'` only when `window.sunsetConsent.marketing` is true and `window.fbq` is available. Invalid forms, failed or pending requests, and repeat submissions do not count. The existing Google `form_submitted` event still depends only on Analytics consent and is unchanged.

The handler lives in `assets/js/contact.js` and both enquiry pages load it through Hugo's fingerprint pipeline. Deploy the rebuilt HTML together with its hashed scripts from `public/` so browsers use the updated handlers. After manual deployment, save Marketing consent, submit a clearly labelled test enquiry, and check Meta Events Manager for `Lead`. No live enquiry has been sent during local validation.

Run `node --test tests/*.test.cjs` to check submission tracking, click events and cookie consent without sending a live enquiry. See [Meta tracking and browser checklist](meta-pixel.md).
