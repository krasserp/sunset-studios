# Winter landing page

Path: `/winter-music-retreat/` (Hugo adds the trailing slash). Content and FAQ live in `content/winter-music-retreat.md`; layout and scoped styles live in `layouts/_default/winter-retreat.html` and `assets/scss/main.scss`.

The winter hero uses `layouts/partials/retreat-pricing.html`, with prices stored in `data/retreat_pricing.yaml`. Cards lead with the per-person 7-day price: solo €890, duo €600 (€1,200 total), trio approximately €497 (€1,490 total). Duo and trio show savings against the solo rate; trio is marked Best value. Every package includes private accommodation and 24/7 private studio access. The duration appears above the winter cards rather than repeating in each card. The homepage hero does not display the pricing cards.

The landing page uses the existing Formspree endpoint and consent-gated `form_submitted` event. Its enquiry form preselects Retreat booking and sends `enquiry_source=winter_music_retreat` to Formspree. The general contact page uses the same form partial without a preselected booking type. No live enquiry was sent during validation.

Local media in `static/videos/` are H.264 MP4 files with fast-start metadata. The page uses the following web versions (updated 26 October 2026):

| Page video | Source retained | Served file | Original → web size |
| --- | --- | --- | --- |
| Apartment tour | `studio-apartment-tour.01.mp4` | `studio-apartment-tour.01.web.mp4` | 24.60 MB → 6.74 MB |
| Studio footage | `winter-studio-session.01.mp4` | `winter-studio-session.01.web.mp4` | 5.35 MB → 1.68 MB |
| Mobile hero | `studio-apartment-tour.01.mp4` | `winter-hero-sunlight.mp4` | 16-second portrait edit, 1.35 MB |
| Desktop hero | Original coastal, studio, session and apartment footage | `winter-hero-desktop-intro.mp4` | 18-second landscape edit, 30.15 MB |

The two full-length web videos retain the source video duration, 540 × 960 portrait resolution and 24 fps. Their source AAC tracks contained only silence, so the web versions omit audio. Compression uses libx264, preset slow, CRF 30, maximum bitrate 500 kbps, buffer 1000 kbps, 48-frame GOP, yuv420p and `+faststart`. Source files remain unchanged; the page references only the optimized versions. Originals in `static/videos/` are still copied by Hugo, but are not downloaded by the page.

The mobile hero uses four 4-second cuts from the edited apartment tour: 0–4 seconds (sunny garden), 93–97 (control room), 53–57 (bright apartment facing the garden), and 7–11 (garden). It uses CRF 29, maximum bitrate 650 kbps and buffer 1300 kbps; other encoding settings match the web versions. The previous `winter-hero.mp4` is retained as an alternative.

The winter hero now shares `layouts/partials/hero-slideshow.html` with the homepage. Both use the same four images (`hero1.webp` through `hero4.webp`), mobile alternatives (`hero1-m.webp` through `hero4-m.webp`) at the shared 640px breakpoint, fade timing, image positioning and readability overlay. Winter copy and pricing remain in the winter layout. The former hero video files and script are retained but are no longer referenced by the winter page. The studio and apartment videos still load on demand.

The flight list was checked against Aena’s destination page on 22 October 2026: https://www.aena.es/en/gran-canaria/airlines-and-destinations/destinations-from-gran-canaria-airport.html . Routes are seasonal and the page prompts visitors to check their dates. Testimonials reuse the existing homepage entries; equipment and airport transfer details come from the existing studio/retreat content.

Build staging with `hugo --environment staging` and production with `hugo`. The existing staging noindex and analytics restrictions apply to this page too. Verify and publish the GTM/GA4 conversion tag separately if it has not yet been configured in the container.
