# Marketing demo videos — hosting

The Product Tour and Instructions pages show short feature-demo clips through
one component: `packages/web/src/components/MarketingVideoPanel.tsx`.

## Two hosting modes

The panel takes both a `youtubeId` and a `videoPath` prop and picks one:

| `youtubeId` set? | Renders |
|---|---|
| **yes** | A privacy-friendly facade — the `poster` image plus a play button. Only on click does it load a `https://www.youtube-nocookie.com/embed/<id>` iframe. No YouTube cookie or tracker fires until the visitor chooses to play. The local MP4 is not used. |
| no (empty) | The self-hosted `<video>` element playing `videoPath` from `packages/web/public/videos/feature-demos/`, with the `poster` as the still. |

Today every entry has `youtubeId: ''`, so the site serves the local MP4s.

## Moving a clip to YouTube

1. Upload the clip to the Vehicle-Vitals YouTube channel. Add a title,
   description, and **captions** (auto-captions are fine to start;
   `LAUNCH_CLAIMS_MATRIX.md` requires captions/transcript before a video is
   "featured").
2. Copy the 11-character video ID from the watch URL
   (`https://www.youtube.com/watch?v=XXXXXXXXXXX` → `XXXXXXXXXXX`).
3. Set it on the corresponding entry:
   - Product Tour: `packages/web/src/pages/ProductTour.tsx` → `demoVideoReady[].youtubeId`
   - Instructions: `packages/web/src/pages/Instructions.tsx` → the inline
     `<MarketingVideoPanel youtubeId="…">`
4. Once a clip is on YouTube, its `packages/web/public/videos/feature-demos/*.mp4`
   file is unreferenced — delete it (and drop its line from the
   `TC-UI-009` list in `packages/web/tests/uat.spec.ts`).

## CSP

`firebase.{prod,staging,dev}.json`'s `Content-Security-Policy` header already
allows `https://www.youtube-nocookie.com` in `frame-src`. No further CSP
change is needed to enable an embed. (Thumbnails come via `img-src https:`,
already allowed.)

## Currently wired clips

| Page | Panel | MP4 |
|---|---|---|
| Product Tour | Getting started video | `onboarding-walkthrough.mp4` |
| Product Tour | Service tracking video | `maintenance-lifecycle-tour.mp4` |
| Product Tour | Web and mobile video | `cross-platform-continuity.mp4` |
| Instructions | Simple setup walkthrough | `getting-started-help.mp4` |

The other six files in `feature-demos/` are not referenced by any page.
