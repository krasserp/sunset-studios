# Shared consent with the music shop

The studio site stores `sunset-cookie-consent-v1` as a URL-encoded JSON cookie:

```json
{"analytics":false,"embeds":false,"at":1792400000000}
```

`at` is the time of the visitor's choice in milliseconds. Reject malformed values, future timestamps and choices older than 180 days. Missing/expired consent means optional services stay off. The choice panel opens automatically on the first visit or after consent expires. With a valid saved choice, it opens only when requested.

On HTTPS production hosts the cookie uses `Domain=sunset-studios.one; Path=/; SameSite=Lax; Secure; Max-Age=<remaining seconds>`. Both sites must use these same attributes when saving a choice. Local previews use a host-only cookie. Necessary checkout storage is separate from these optional choices.

The music shop code is not in this checkout. To complete integration there:

- Read this cookie before loading optional analytics or embeds; disable any existing unconditional tracking snippets.
- Apply `analytics` and `embeds` independently. Keep essential payment/cart behaviour independent of optional consent.
- Reuse the banner choices and permanent Cookies button. Write the shared cookie when choices change, including rejection.
- Check the cookie again when the page regains focus, including withdrawal from the other site. Stop already-loaded analytics with a reload when consent is withdrawn.
- Test both directions between the production hosts. A cookie alone does not enforce tracking preferences on the other site.

The studio script migrates its previous localStorage choice once and removes that old entry. The shared cookie wins if both are present. Migration preserves the original expiry.
