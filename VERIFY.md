# Word Flight verification

- Existing self-check: PASS — 220 unique words, level counts 40/52/41/46/41, canonical fingerprint, 220 sentences and 440 valid distractors; Classic bundle remains self-contained.
- JavaScript syntax checks: PASS.
- Chromium desktop 1280×900 and mobile viewport 390×844: scene rendered via pinned Three.js CDN; Listen & Fly and Spell Flight started; no page exceptions in the initial browser check; Classic menu loaded.
- Browser gameplay suite: PASS — scene startup, actual gate collision, wrong-pick retry/scoring, pause, ten-word celebration, persistence, level unlock, ordered spelling (including repeated letters and apostrophe), mobile layout/controls, reset cancel/confirm, Classic loading, CDN-failure fallback, and no console errors.

## Manual device checks

1. On desktop Chrome/Edge/Safari, tap Let’s fly. Verify an English target at gentle speed, audible above the very quiet music. Replay it. Check music goes quiet during the spoken recap and returns afterward. Toggle each audio switch and refresh to confirm settings persist.
2. Steer using WASD/arrows, including after Hear again. Fly into a wrong gate: gentle wobble, no lost stars, retry voice. Fly into the correct one: star, word and each letter spoken. Let a gate pass: it returns. Complete 10 words for the celebration.
3. Spell Flight: collect letters in order; wrong letters leave the spelling unchanged. Check a repeated-letter word and `don't` at Second Grade.
4. On an actual iPad/iPhone/Android device, test held directional buttons, drag steering, portrait/landscape resize and readable labels. Pause, switch apps, return, resume. Check there are no sudden jumps.
5. Earn 20 stars to unlock Primer. Refresh to confirm learned words and accuracy persist. Parents → Reset → Cancel preserves progress; confirming resets only Flight progress.
6. Disable WebGL or block the CDN: the fallback Classic link should be available. With no English voice, ask a grown-up to read the displayed target. With storage blocked, play still works and Parents reports saving unavailable.

Headless Chromium has no usable English voice in this environment: the reading fallback was verified. Actual speech clarity, relative loudness and touch feel require the device checks above; Safari/iOS and Android have not been exercised here.
