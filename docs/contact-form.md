# Contact form activation

1. Create a Formspree form delivering to the studio email and verify the recipient.
2. Set `params.contactFormEndpoint` in `hugo.toml` to its HTTPS endpoint (for example `https://formspree.io/f/YOUR_FORM_ID`). The endpoint must accept JSON and return a non-2xx response on rejection. Until configured, submission is disabled and the page offers email contact.
3. Rebuild and deploy Hugo through the existing hosting workflow.
4. In GTM container GTM-KV9P8PLM, add a Custom Event trigger named `form_submitted`. Attach a GA4 event tag (for example `generate_lead`) using the existing Google tag. Optionally pass `form_id` and `project_type` as data layer variables. Mark the corresponding GA4 event as a key event. Publish the container.
5. Use GTM Preview to confirm a real accepted enquiry produces one event and arrives in the inbox. Invalid fields, failed requests, and repeat clicks must not produce events. Check GA4 DebugView and acquisition reporting with campaign UTM links.

The site sends no names, email addresses, message text or project dates to the data layer. The form service receives these enquiry details; review the privacy notice when activating the service. No live submission or GTM publication has been performed by this change.
