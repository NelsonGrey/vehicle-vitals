# Feature Demo Videos

Place finalized marketing demo clips in this folder to enable in-page playback.
If a file is missing, the site automatically falls back to a poster preview.
When a file is added with one of the expected names below, playback activates automatically with no code changes.

Expected filenames used by the web marketing pages:

- onboarding-walkthrough.mp4
- maintenance-lifecycle-tour.mp4
- cross-platform-continuity.mp4
- vin-lookup-demo.mp4
- maintenance-planning-demo.mp4
- cross-platform-access-demo.mp4
- ownership-history-demo.mp4
- generic-feature-demo.mp4
- getting-started-help.mp4
- help-center-overview.mp4

Notes:

- Recommended codec: H.264 in MP4 for broad browser compatibility.
- Recommended resolution: 1280x720 or 1920x1080.
- Keep clips concise (30-90 seconds) for faster loading.
- Include product captions in the video when possible.

Current repository state:

- The demo and help filenames above are now populated with narrated multi-scene walkthrough clips based on current product screenshots.
- Narrated clips can be regenerated with: `npm run videos:generate:narrated`
- Narration defaults to macOS voice `Samantha` at rate `170`; override with `VV_NARRATION_VOICE` and `VV_NARRATION_RATE`.
- Source visuals are read from `docs/screenshots/`; refresh screenshots first when product UI changes.

Interactive generation:

- Generate all interactive marketing/demo clips with real clicks, route changes, and typed fields:
  `npm run videos:generate:interactive`
- Generate only the VIN interactive pilot clip:
  `npm run videos:generate:interactive:vin`
- The all-video interactive script supports scoped generation with `VV_INTERACTIVE_ONLY`:
  `VV_INTERACTIVE_ONLY=vin-lookup-demo,help-center-overview npm run videos:generate:interactive`
- For neural narration, set `VV_TTS_PROVIDER=openai` and `OPENAI_API_KEY`.
- Optional OpenAI voice settings: `VV_OPENAI_TTS_MODEL` (default `gpt-4o-mini-tts`) and `VV_OPENAI_TTS_VOICE` (default `alloy`).
- Optional OpenAI style and reliability settings:
  `VV_OPENAI_TTS_INSTRUCTIONS`, `VV_OPENAI_TTS_TIMEOUT_MS`, and `VV_OPENAI_TTS_MAX_RETRIES`.
- OpenAI speech outputs are cached in `output/openai-tts-cache/` by model, voice, instructions, and narration text.
- Disable the cache for a run with `VV_OPENAI_TTS_DISABLE_CACHE=1`.
- Validate the OpenAI TTS path without regenerating videos:
  `npm run openai:tts:validate`
- Without OpenAI settings, narration falls back to macOS `say`.
- The recorder retains compatibility with older deployments that show a
  password gate through `VV_MARKETING_GATE_PASSWORD`. The current client has no
  such environment gate; see `docs/SECURE_ENVIRONMENTS.md`.
