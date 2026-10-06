# Verification

Verified on 2026-10-06 in the supplied repository. The game uses only HTML, CSS, native JavaScript, browser storage and Web Speech API. No runtime packages, CDN or external assets are used.

## Data and syntax: PASS

Ran `node scripts/selfcheck.js`:

```text
PASS: 220 unique words; counts 40/52/41/46/41; 220 valid sentences; 440 valid distractors; bundle is self-contained.
```

- All five level keys and counts match the request.
- A SHA-256 fingerprint matches the exact supplied word list, including its order, uppercase `I` and `don't`.
- Every word has one short example sentence.
- Each example has exactly one `___`; replacing it with its answer exactly restores the original sentence.
- Every question has two distinct distractors, each a Dolch word different from the answer.
- `dist/index.html` has no imported modules or external JavaScript, CSS or image references.
- `node --check` passed on all 10 JavaScript files in `js/` and `scripts/`, and on the extracted inline scripts from both HTML entry points.
- `git diff --check` passed.

## Browser gameplay: PASS

Executed real Chromium browser checks with network offline; a local test handler supplied only the repository files, with no server, CDN or internet resources. Both the native-module root entry and the self-contained bundle rendered with zero page exceptions and zero console errors.

- Completed the first eight-word spelling stage, preserving the requested word order and uppercase `I`.
- Wrong tiles shake and repeat speech; the second miss shows the first letter, the third reveals the word and resets the slots for one copy attempt.
- `don't` includes a working apostrophe tile; `little` supports separate repeated-letter tiles.
- Completed an eight-word sentence stage; wrong choices can be retried, correct answers restore and highlight the sentence.
- A missed word appeared first in the following stage's review queue.
- Pausing, reloading and opening the parent page preserve and display progress.
- Mastery is bounded at 0–3. A newly mastered word earns exactly one permanent robot part, even when subsequently relearned.
- Word Hunt uses learned words; wrong taps do not reduce energy or mastery; correct taps add energy.
- Canceling reset preserves progress; confirming reset clears it.
- Completing both modes for every stage in a world unlocks its robot and the next world.
- Simulated elapsed time past 180 seconds produces the friendly rest/results screen without changing mastery.
- With the speech API absent and localStorage throwing, gameplay still works and both fallback notices appear.

## Speech contract: PASS with simulated voice

Chromium in this environment has no usable audible English voice. A mock Web Speech voice and utterance verified the application contract:

- A voice arriving through `voiceschanged` is selected.
- Samantha is preferred when available.
- Utterances use `en-US`, rate `0.8`, and the selected English voice.
- `cancel()` runs before each `speak()`.
- The start tap synchronously speaks an empty utterance before normal speech.
- Full sentences are passed to speech, rather than reading underscores aloud.
- Without an English voice, the large target word and “请家长读” are visible.

Actual sound quality and iOS activation still depend on the real device and installed voice; no audible-device claim is made here.

## Layout: PASS

- Menu checked at 320, 390, 768 and 1280px widths, with no horizontal overflow.
- Spelling with repeated letters and sentence choices with a longer target checked at 320px.
- Visible touch buttons measured at least 56px tall.
- No input, textarea or contenteditable element exists; tapping answers cannot open a text keyboard.
- Main question words and letter slots use at least 28px at the default font setting.
- The 320px menu fits with a 200% root font size.
- Portrait mobile and desktop screenshots were visually inspected.

## Direct-file verification boundary

**Not executed:** actual Chromium navigation to `file://` is blocked by this environment's managed browser URL policy (`ERR_BLOCKED_BY_ADMINISTRATOR`). This restriction is not a game exception, and was not bypassed.

The same complete `dist/index.html` was executed with network offline through local test responses, with zero console errors. Its script is a classic inline script, its CSS and data are inline, and it needs no module import, fetch, server or installation. The root entry explicitly redirects `file://` to the bundled entry. These checks support direct-file compatibility, but a real desktop double-click and real mobile browser test remain manual device checks.

`file://` localStorage behavior and mobile file-preview execution vary by browser; README documents the fallback and opening options.
