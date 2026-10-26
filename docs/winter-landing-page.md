# Winter landing page

Path: `/winter-music-retreat/` (Hugo adds the trailing slash). Content and FAQ live in `content/winter-music-retreat.md`; layout and scoped styles live in `layouts/_default/winter-retreat.html` and `assets/scss/main.scss`.

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

Desktop now uses an 18-second intro assembled from five high-resolution source clips, with half-second crossfades:

| Shot | Source | Source in/out | Portrait crop y |
| --- | --- | --- | --- |
| Blue ocean | `../videos/Photos-3-001/PXL_20260508_144421756.TS.mp4` | 0.5–4.5 s | 650 |
| Studio session on screen | `../videos/Photos-3-001/PXL_20260406_163243804.TS.mp4` | 8–12 s | 300 |
| Bassist playing | `PXL_20260115_165510277.TS.mp4` from `../videos/PEOPLEINsTUDIO/Photos-3-001 (1).zip` | 0.5–4.5 s | 300 |
| Private apartment | `../videos/StudioTour_001.mp4` | 50.5–54.5 s | 550 |
| Sunset over the ocean | `../videos/Photos-3-001/PXL_20260505_191401283.TS.mp4` | 0.5–4.5 s | 600 |

Each original is reframed from a 1080 × 1920 portrait master to a 1080 × 608 crop at x=0, then scaled with Lanczos to a 1920 × 1080 square-pixel export. These are landscape reframings of portrait footage, not native widescreen sources. The output uses H.264 preset slow, CRF 16, no bitrate cap, 24 fps, 48-frame GOP, yuv420p, no audio and fast-start metadata. Quality is prioritised over download size. The former garden-only desktop video `winter-hero-desktop.mp4` is retained as an alternative. Mobile media, styling and playback controls were not changed for this edit.

The two hero files are selected at a 760px viewport breakpoint; initial load requests only the selected asset. Crossing the breakpoint switches to the appropriate version, retaining a paused state and the reduced-motion/data-saving safeguards. The mobile overlay is 52% dark instead of 80%, with a text shadow for legibility.

The hero has a pause control and a poster fallback; automatic playback is skipped for reduced-motion and data-saving preferences. Longer videos load on demand.

The flight list was checked against Aena’s destination page on 22 October 2026: https://www.aena.es/en/gran-canaria/airlines-and-destinations/destinations-from-gran-canaria-airport.html . Routes are seasonal and the page prompts visitors to check their dates. Testimonials reuse the existing homepage entries; equipment and airport transfer details come from the existing studio/retreat content.

Build staging with `hugo --environment staging` and production with `hugo`. The existing staging noindex and analytics restrictions apply to this page too. Verify and publish the GTM/GA4 conversion tag separately if it has not yet been configured in the container.
