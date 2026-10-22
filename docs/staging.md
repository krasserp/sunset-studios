# Staging builds

Build staging into its own empty output directory:

```sh
hugo --environment staging --destination public-staging
```

This uses `https://staging.sunset-studios.one/`, emits `noindex,nofollow` on every HTML page, disables GTM and suppresses the sitemap. Deploy only that output to staging. Use `hugo` for production. Avoid sharing an output directory: stale production files could otherwise survive a staging build.

`params.enableAnalytics` is the master analytics switch in `hugo.toml`. GTM also requires a production build, HTTPS, visitor analytics consent, and an exact runtime hostname of `sunset-studios.one` or `music.sunset-studios.one`. Any other host is denied, even if a production build is copied there. Substring matches and arbitrary subdomains are not accepted. Enquiry conversion events follow the same effective consent flag.

`params.allowIndexing` is the indexing switch. HTML on nonproduction base URLs, staging builds, and Hugo server previews always gets `noindex,nofollow`. Build-time metadata depends on the selected environment/baseURL; do not serve an unchanged production artifact as staging. Runtime JavaScript alone cannot reliably prevent indexing.

For stronger staging protection, enable password protection/access control at your host. An `X-Robots-Tag: noindex, nofollow` response header on the staging host also covers non-HTML files. Those hosting settings are not configured by this repository. Do not rely on `robots.txt Disallow: /` to prevent indexing: it can stop Google from seeing the noindex instruction.

Staging uses a separate host-only `sunset-preview-consent-v1` cookie, so tests do not overwrite the shared production choice. Production keeps `sunset-cookie-consent-v1` across the two production hosts. Optional map/video embeds can still be tested after consent; no GTM container or Google analytics conversion events are loaded on staging.

The music shop is a separate repository. Apply equivalent hostname/build checks there; this checkout cannot disable scripts installed by that shop.

Run domain/consent regression checks with `node --test tests/consent.test.cjs`.
