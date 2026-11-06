# Meta Pixel tracking review

The existing pixel `990608840778572` is still initialized only in `assets/js/consent.js`. Its existing `autoConfig=false`, `init`, and `PageView` calls are preserved in that order. Meta now requires explicit Marketing consent; Google measurement still uses Analytics consent. No Meta tags were added to Google Tag Manager.

## Event triggers

| Event | Type | Trigger | Explicit parameters |
| --- | --- | --- | --- |
| PageView | Standard | Once per page load after Marketing consent | None |
| Lead | Standard | Formspree returns an accepted response on the Contact or Winter Retreat form | `content_name: 'Studio Enquiry'` |
| Contact | Standard | Click on an actual `wa.me` or `api.whatsapp.com` destination | `contact_method: 'whatsapp'` |
| Contact | Standard | Click on a `mailto:` destination | `contact_method: 'email'` |
| CheckAvailability | Custom | Click on an explicitly marked Check Availability / Check Winter Availability CTA | None |
| CheckFlights | Custom | Click on an explicitly marked Google Flights link | None |
| ViewLocation | Custom | Click on an explicitly marked Google Maps directions link | None |

`assets/js/meta-events.js` defines the shared `window.sunsetTrackMeta(action)` helper and registers one delegated click listener. Loading the helper twice does not add a second listener. Nested elements resolve to one closest control. The helper sends only fixed event definitions, never link URLs, contact details, form fields, messages or dates. Tracking exceptions cannot block navigation or enquiry confirmation. No handlers prevent default navigation or submit behavior.

The final Send Enquiry button, ordinary navigation (including the header Contact link and FAQ Find Us link), and invalid, pending or failed submissions do not send conversion events. A successful form is guarded against duplicate submissions. The existing Google `form_submitted` event and its payload are unchanged.

The visible studio email on the Contact page is now a clickable `mailto:` link. Six availability CTAs, two flight links and two Maps links are marked across the built pages; WhatsApp and email links are detected by destination.

## Consent

- Analytics, Marketing and Embedded Content have separate optional checkboxes and saved boolean fields. All default to off.
- Accept All enables all three. Reject Optional disables all three. Custom choices save each independently.
- Older saved cookies or localStorage entries without a `marketing` field retain their valid Analytics/Embedded Content choices but never authorize Meta. Marketing stays off until explicitly granted.
- Marketing-only consent can start Meta without Google. Analytics-only consent can start Google without Meta. The production/HTTPS/exact-host checks still apply.
- Effective Marketing consent is set false immediately when withdrawn. The loaded Pixel receives `consent/revoke`, and the page reloads to stop its runtime. Later helper calls are blocked, including if a form response arrives after withdrawal.
- Returning focus rereads the shared cookie, including withdrawal from another production tab or subdomain. Expired, future-dated or malformed consent is rejected.
- `params.enableAnalytics` and `params.enableMarketing` are independent build switches. Staging disables both. The cookie name remains `sunset-cookie-consent-v1` for compatibility.
- The privacy policy explains the advertising events and their fixed parameters. The separate music-shop repository is outside this change; its shared-consent integration instructions have been updated here.

## Verification

Passed:

- `node --test --test-reporter=spec tests/*.test.cjs`: consent, contact and delegated-event suites.
- Hugo production build and separate staging build.
- Built-output audit across all nine HTML pages in each build: one consent script and event helper, matching fingerprint/integrity values, correct build flags, separate Marketing checkbox, and coverage of all relevant CTAs.
- Headless Chrome checks against local production files with external services mocked: no Meta activity with Analytics-only consent; single initialization and PageView; nested WhatsApp, email, availability, flight and Maps clicks; invalid/rejected/successful forms; successful retry and duplicate prevention; Marketing withdrawal and reload; preserved Google event; zero browser JavaScript exceptions.

The browser checks intercepted all external requests. No real Meta events or Formspree enquiries were sent. Production files in `public/` are ready for manual deployment. No deployment, commit or push was performed. Live arrival in Meta Events Manager is not yet verified. Existing Hugo deprecation warnings about `languageCode`, LibSass and `.Site.Data` remain unrelated to this change.

## Short live browser checklist

1. After manually deploying the rebuilt HTML and fingerprinted scripts together, open Meta Events Manager's Test Events for pixel `990608840778572` and a fresh production browser session. Use a browser where tracking is not blocked for this test.
2. Before consent, and then with Analytics only, load pages and click tracked links: expect no Meta requests or events. An older Analytics-only saved choice must also leave Marketing off.
3. Enable Marketing (Analytics may stay off). Expect one PageView, with automatic configuration disabled. Reload: expect one additional PageView for the new page load, with no duplicate initialization within either load.
4. Click one WhatsApp and one email link: expect one Contact each with the corresponding contact method. Click availability, flights and Maps links: expect one CheckAvailability, CheckFlights and ViewLocation respectively. Ordinary navigation and merely clicking Send Enquiry must not count as Lead.
5. Submit one clearly labelled test enquiry and confirm delivery: expect exactly one Lead with `content_name: 'Studio Enquiry'`. Invalid fields or a blocked/failed Formspree request must send no Lead; repeat clicks while sending or after success must not add one.
6. Withdraw Marketing while keeping Analytics enabled. After the automatic reload, expect no Meta activity; Google measurement should still follow Analytics consent. Verify map/video controls still follow Embedded Content independently.
7. Confirm there are no automatic events such as SubscribedButtonClick and no personal form values or contact destinations in the explicit event parameters.

## Current review file inventory

This inventory includes the pending Lead integration already present at the start of this request. Generated HTML and fingerprinted JavaScript are included because this repository tracks production output. Existing historical hashed scripts can remain for cached HTML; current pages reference only the new hashes.

- `assets/js/consent.js` — modified
- `config/staging/hugo.toml` — modified
- `content/contact.md` — modified
- `content/privacy.md` — modified
- `docs/contact-form.md` — modified
- `docs/shared-cookie-consent.md` — modified
- `docs/staging.md` — modified
- `hugo.toml` — modified
- `layouts/_default/studio-services.html` — modified
- `layouts/_default/winter-retreat.html` — modified
- `layouts/contact/single.html` — modified
- `layouts/partials/cookie-consent.html` — modified
- `layouts/partials/cta.html` — modified
- `layouts/partials/find-us.html` — modified
- `layouts/partials/flight-guide.html` — modified
- `layouts/partials/head.html` — modified
- `layouts/partials/hero.html` — modified
- `public/categories/index.html` — modified
- `public/contact/index.html` — modified
- `public/explore/index.html` — modified
- `public/index.html` — modified
- `public/js/contact.js` — removed
- `public/privacy/index.html` — modified
- `public/studio-services/index.html` — modified
- `public/tags/index.html` — modified
- `public/terms/index.html` — modified
- `public/winter-music-retreat/index.html` — modified
- `static/js/contact.js` — removed
- `tests/consent.test.cjs` — modified
- `assets/js/contact.js` — added
- `assets/js/meta-events.js` — added
- `docs/meta-pixel.md` — added
- `public/js/consent.8def6c8ddbacf9823ba617a6be08ea8095a30ef626c01d814ed35aaae620e711.js` — added
- `public/js/contact.8aeaece69ee256231a93f4747833fc878bf6da664c73b25cef395730050ed678.js` — added
- `public/js/contact.f17175c69f7e3cf427c6f384073b57f0c8b8bc615f1209a3568a9dfc23b1edcf.js` — added
- `public/js/meta-events.06bbc653ab59e87d61b9f541283ce6aa286eb1d436d1744e90447afb9bd11dfc.js` — added
- `tests/contact.test.cjs` — added
- `tests/meta-events.test.cjs` — added
