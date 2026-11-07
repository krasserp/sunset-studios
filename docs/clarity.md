# Microsoft Clarity integration

Project: `za3re3nddc`. This change is local and ready for review. No deployment, commit or push has been performed.

## Initialization and consent

Clarity is loaded by `assets/js/consent.js`, which already uses Hugo fingerprinting and integrity attributes. No unconditional Microsoft script was added to the HTML head. The existing Analytics switch, production build check, HTTPS check and exact runtime host allowlist apply. Staging and local previews remain blocked.

A fresh visitor or a visitor with only Marketing/Embedded Content consent does not receive the Clarity loader, queue or tracking cookies. A valid saved Analytics choice starts Clarity on page load. Granting Analytics in the current dialog also starts it without a reload. A per-page flag prevents duplicate loads when settings are saved repeatedly or focus returns.

Before appending `https://www.clarity.ms/tag/za3re3nddc`, the loader creates the standard command queue and adds:

```js
window.clarity('consentv2', {
  ad_Storage: 'denied',
  analytics_Storage: 'granted'
});
```

Advertising storage is always denied, including when Marketing is enabled. The existing consent cookie name, three independent categories, 180-day expiry and migration behavior are unchanged. Saved Analytics consent is not renewed merely by starting Clarity.

On Analytics withdrawal, the effective Analytics flag is disabled immediately; Clarity receives Consent V2 with both storage types denied and then `stop`. The site expires `_clck` and `_clsk` at the host-only and applicable production-domain root scopes, then reloads to remove the loaded runtime. This also handles shared-cookie changes noticed when a tab regains focus. Stale accessible Clarity cookies are cleaned up on production visits where Analytics is off. Cookie cleanup is limited to those two first-party names; it preserves the necessary consent cookie, other necessary storage, Meta cookies and the saved Marketing/Embedded Content choices. Cookies belonging to Microsoft domains cannot be deleted by this origin; browser privacy controls manage third-party cookies.

Google Tag Manager initialization, the existing Meta Pixel configuration/events and the successful Formspree handler are preserved. Clarity uses its built-in recordings, click/scroll heatmaps and navigation capture across the site, including `/winter-music-retreat/`. No extra scroll handlers, delegated click listeners, custom Clarity identifiers, tags or events were added.

## Personal information

The shared enquiry form has `data-clarity-mask="true"`. This covers both the Contact and Winter Retreat forms, their inputs/selects, status area and future child fields such as private messages. No `data-clarity-unmask` attributes were added. The only other input controls found are the cookie preferences, which do not contain personal enquiry details.

The form still sends its values to Formspree by POST, never in URL query parameters or tracking commands. The Clarity integration sends only storage-consent commands and the stop command. Keep the project's dashboard masking configuration at Balanced or Strict and do not add overrides that unmask enquiry fields. Dashboard settings were not changed from this checkout; live recording masking still needs verification after manual deployment.

## Validation

Passed:

- `node --test --test-reporter=spec tests/*.test.cjs` (consent, contact and Meta event suites).
- Hugo production build: `/snap/hugo/current/bin/hugo --environment production`.
- Separate staging build: `/snap/hugo/current/bin/hugo --environment staging --destination /tmp/sunset-clarity-staging`.
- Built-output checks on all nine HTML pages in each build: updated consent fingerprint/integrity, correct Analytics/Marketing flags, no unconditional Clarity script, exactly two masked enquiry forms, valid Formspree endpoints and no unmasking attributes.
- Headless Chrome against local production files with all external services mocked: fresh and Marketing-only visitors blocked; one Clarity loader for new and returning Analytics consent; consent queued with advertising denied; no duplicate loader after repeated saves/focus; both forms masked; native validation, failed and accepted Formspree responses; preserved Meta PageView/Lead and Google event; Analytics withdrawal sends denied consent/stop, removes host/domain Clarity cookies, retains necessary and Marketing cookies and reloads without Clarity; zero browser JavaScript exceptions.

No live Clarity sessions, Meta/Google events or Formspree enquiries were sent during validation. Live dashboard receipt and Microsoft's actual recording output remain unverified until manual deployment. Existing Hugo warnings about `languageCode`, LibSass and `.Site.Data` remain unrelated.

## Chrome DevTools verification after deployment

1. Deploy the rebuilt HTML and fingerprinted JavaScript together. Use a fresh browser profile with tracking allowed for testing. Open `/winter-music-retreat/` and DevTools Network with Preserve log enabled; filter by `clarity.ms`.
2. Without consent, expect no Clarity requests or `_clck`/`_clsk` cookies. Enable only Marketing: Clarity must still stay off. Meta can load according to its independent Marketing preference.
3. Enable Analytics: expect exactly one `https://www.clarity.ms/tag/za3re3nddc` request for that page. In Sources, open the fingerprinted `consent.*.js` and inspect the `consentv2` call: Analytics is granted and advertising denied. Interact and scroll; check for Clarity `collect` POST requests. Repeated saves should not request a second tag.
4. Reload or navigate to Contact with valid Analytics consent: expect one loader on the new page. In Elements inspect `#availability-form` on Contact and Winter Retreat; both must have `data-clarity-mask="true"`. Use fictitious test values when checking recordings, and confirm those values are unreadable in the actual recording.
5. Withdraw Analytics while keeping Marketing if desired. The page reloads; no Clarity tag or further collection should occur on the new page. In Application > Cookies, confirm any accessible `_clck`/`_clsk` cookies have gone while the consent cookie and other category choices remain. Clear the Network log after reload to distinguish earlier permitted requests from new ones.
6. Confirm the normal Formspree success/error UI, Google measurement under Analytics and Meta events under Marketing still behave as before. Check Console for errors.

## Microsoft Clarity dashboard verification

Open project `za3re3nddc`. Review Settings > Masking (Balanced or Strict), then use Recordings/live recordings and filter by `/winter-music-retreat/`. Confirm the visit, navigation and interactions appear, and inspect the enquiry area for masking using fictitious test values. In Heatmaps, filter by the landing-page URL and review click and scroll activity around CTAs, packages and pricing once sufficient data is available. Check the Contact page journey as well. Do not enable Microsoft advertising storage or add a second Clarity installation through GTM or the dashboard.

## Official references

- [Consent V2 API](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-consent-api-v2)
- [Masking content](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-masking)
- [Clarity cookies](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-cookies)
- [Microsoft's stop implementation](https://github.com/microsoft/clarity/blob/master/packages/clarity-js/src/clarity.ts)
- [Installation verification](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-setup#verify-your-installation)
- [Microsoft Privacy Statement](https://www.microsoft.com/en-us/privacy/privacystatement)

## Changed files

- `assets/js/consent.js` — modified
- `content/privacy.md` — modified
- `docs/shared-cookie-consent.md` — modified
- `docs/staging.md` — modified
- `layouts/partials/availability-form.html` — modified
- `layouts/partials/cookie-consent.html` — modified
- `public/categories/index.html` — modified
- `public/categories/index.xml` — modified
- `public/contact/index.html` — modified
- `public/explore/index.html` — modified
- `public/explore/index.xml` — modified
- `public/index.html` — modified
- `public/index.xml` — modified
- `public/privacy/index.html` — modified
- `public/sitemap.xml` — modified
- `public/studio-services/index.html` — modified
- `public/tags/index.html` — modified
- `public/tags/index.xml` — modified
- `public/terms/index.html` — modified
- `public/winter-music-retreat/index.html` — modified
- `tests/consent.test.cjs` — modified
- `docs/clarity.md` — added
- `public/js/consent.e44dcece9c5f43ac74a1dc040ca3b8172e64b3d56e20177031d50ec8aa313c62.js` — added
