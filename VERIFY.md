# Word Flight verification

Verified 2026-10-18 against main at `e975a5e` (PR #3 merged).

## Automated checks

- Word self-check: PASS — all 220 unique Dolch words, unchanged canonical fingerprint, level counts 40/52/41/46/41, 220 sentences, 440 valid distractors, self-contained Classic bundle. Also validates all 50 phrases: 2–4 words, each in the cumulative vocabulary through its assigned level.
- JavaScript syntax and whitespace checks: PASS.
- Full Chromium browser smoke suite: PASS against the real shipped jsDelivr import, and PASS with the official r170 local fixture. **No console errors or page exceptions.** Covers original listen collision/retry/scoring, pause, ten-word celebration, persistence, unlock, spelling/repeated letters/apostrophe, Classic, mobile layout/controls and parent reset; plus day/sunset/night/dawn state and indicator, weather changes, cycle boundary continuity, phrase completion-only scoring, wrong resets/no lost stars, trail/combo and streak bonuses, whole-phrase speech/replay at en-US 0.85, per-level phrase persistence/reset, Space boost/eased release, touch hold/cancel, and actual boosted collision.
- Visual review: desktop day/night and phrase trail, plus 390×844 mobile controls and layout.

The sandbox initially prevented networking and local HTTP binding. The suite was run with permitted local server/Chromium access, first using an official Three.js **r170** module retrieved from `mrdoob/three.js` through GitHub as a test-only CDN fixture, then using the **real shipped CDN import**. Both full runs passed. The pinned jsDelivr import is unchanged. CDN-failure fallback is tested separately by blocking that request. No fixture, browser hooks, or runtime dependencies are shipped.

Reproduce with normal network access:

```sh
node scripts/selfcheck.js
node scripts/flight-smoke.cjs
```

With an existing Chromium and exact-version official module fixture:

```sh
THREE_MODULE_PATH=/path/to/three-r170-module.js CHROMIUM_PATH=/usr/bin/chromium node scripts/flight-smoke.cjs
```

## Behavior and manual device checks

1. Watch the **80-second** day/sunset/night/dawn cycle and independent **113-second** clear/partly cloudy/soft cloudy weather cycle. Check gradual sky, fog, cloud/island tint and lighting, sun/moon arcs and softly twinkling stars. Pause freezes sky time. Labels retain opaque cream backing with a night glow. No weather audio is added.
2. On Chrome/Edge/Safari, start flight and verify the English target is clear above quiet music. Replay it. Music ducks during speech, including phrase replay, retry and completion; toggles persist. Real device voices and loudness need human ears.
3. Phrase Flight: catch each word in order; only a whole unbroken phrase earns stars. Wrong catches reset the trail and combo, retaining earned stars. Complete phrases earn their word count plus one bonus per five consecutive words; ten phrases end a round. Check phrase counts in Parents and after reload. “the best” is the story-title excerpt; “thing”/“world” are not in Dolch 220 and are excluded.
4. Hold Space or 🚀: speed eases toward 2×, gauge fills and FOV widens slightly (FOV stays fixed with reduced motion). Release eases back. Gates smoothly return to normal approach speed near the plane. Catch while boosted and without boost. Space must not scroll. Touch release/cancel, lost pointer capture, blur and pause clear held inputs.
5. Check WASD/arrows, held directional pad and drag on desktop and actual iPad/iPhone/Android hardware. Verify portrait/landscape, night label readability, no horizontal overflow and comfortable touch controls. Pausing/switching apps should preserve progress.
6. Listen & Fly, ordered Spell Flight (`little`, `don't`), wrong retries, 10-word celebration, storage, 20-star unlock, and confirmed/canceled parent reset must still work. Classic at `classic/` and offline bundle at `dist/index.html` remain available.
7. Disable WebGL/CDN to check Classic fallback. With no English voice, a grown-up reading prompt remains available. With storage blocked, session play continues.

Safari/iOS/Android hardware and audible speech quality have not been tested here. Chromium smoke uses real WebGL via SwiftShader, and a simulated English voice for phrase speech contracts; it cannot establish real device voice quality.
