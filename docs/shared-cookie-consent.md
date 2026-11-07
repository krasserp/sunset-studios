# Shared consent with the music shop

The studio site stores `sunset-cookie-consent-v1` as a URL-encoded JSON cookie:

```json
{"analytics":false,"marketing":false,"embeds":false,"at":1792400000000}
```

`at` is the time of the visitor's choice in milliseconds. Reject malformed values, future timestamps and choices older than 180 days. Missing/expired consent means optional services stay off. A missing `marketing` field in an older valid choice means Marketing off; Analytics consent must never be used as Marketing consent. A non-boolean Marketing value is invalid. The choice panel opens automatically on the first visit or after consent expires. With a valid saved choice, it opens only when requested.

On HTTPS production hosts the cookie uses `Domain=sunset-studios.one; Path=/; SameSite=Lax; Secure; Max-Age=<remaining seconds>`. Both sites must use these same attributes when saving a choice. Only the two exact production hosts share this cookie. Staging and local previews use a separate host-only `sunset-preview-consent-v1` cookie. Necessary checkout storage is separate from these optional choices.

The music shop code is not in this checkout. To complete integration there:

- Read this cookie before loading optional analytics or embeds; disable any existing unconditional tracking snippets.
- Apply `analytics`, `marketing` and `embeds` independently. Google measurement and Clarity require Analytics; Meta Pixel requires Marketing. Preserve all three fields when saving choices. Keep essential payment/cart behaviour independent of optional consent.
- Reuse the banner choices and permanent Cookies button. Write the shared cookie when choices change, including rejection.
- Check the cookie again when the page regains focus, including withdrawal from the other site. Update effective consent immediately and stop already-loaded Analytics or Marketing trackers with a reload when that category is withdrawn.
- Test both directions between the production hosts. A cookie alone does not enforce tracking preferences on the other site.

The studio script migrates its previous localStorage choice once and removes that old entry. The shared cookie wins if both are present. Migration preserves the original expiry and defaults Marketing to false. The cookie name remains unchanged so existing Analytics and Embedded Content preferences continue to work. The studio integration now implements the separate Marketing field; updating the music shop requires changes in that separate repository.

Clarity uses the existing Analytics field without adding storage or changing expiry. Its advertising storage is always denied, independently of Marketing. The studio script stops Clarity, clears only its accessible `_clck` and `_clsk` first-party cookies, and reloads on Analytics withdrawal. Cookie cleanup preserves the shared consent cookie, necessary storage and other categories.
