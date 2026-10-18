# Little Sky · Word Flight

A gentle, voice-guided 3D Dolch word game for ages 6–8. Original pastel Three.js clouds, floating islands, balloons, and a little airplane. Static HTML/CSS/JavaScript; no accounts, paid services, build secrets, or application server.

## Play

- **Listen & Fly (default):** hear an English word, then steer through its matching word gate. Three different choices; wrong picks wobble with encouragement. Missed gates return, with no penalty.
- **Spell Flight:** hear a word and fly through its letters in order, including the apostrophe in `don't`. Repeated letters are offered again at the correct step.
- Arrow keys or WASD move up/down/left/right. On phones/tablets use the big directional pad or drag the sky to steer. “Hear again” repeats the target.
- Each completed word earns one star and a spoken word/letter recap. Ten words complete a round with a celebration. Earn 20 stars in a level to unlock the next. Repeating words earns practice stars.
- Pause freezes gates and movement. Parents shows progress in each level, learned words, pick accuracy (including letter picks), and confirmed reset.
- Progress/settings live only in this browser’s localStorage under `little-sky-v1`; Classic progress is separate. If storage is blocked, play continues for the session.
- Generated WebAudio music starts after a user action, with master gain 0.06; speech is volume 1, en-US, rate 0.85. Music ducks to zero during speech. Independent music/voice switches are saved. Available English voices depend on the device; when speech fails, a grown-up reading prompt shows the target.

## Word source

`js/words.js` embeds **all canonical Dolch 220 sight words**, grouped as Pre-Primer **40**, Primer **52**, First Grade **41**, Second Grade **46**, Third Grade **41**. The requested [WeChat article](https://mp.weixin.qq.com/s/eYIxof9DD49TFYNAHqte3g) could not be fetched, so this uses the canonical list already present in the repository. The existing self-check verifies counts, uniqueness, spelling/order fingerprint, and sentences.

## Run locally

From this repository:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000`. No install or build is required. The 3D game needs WebGL and internet access to the pinned Three.js 0.170.0 ES module on jsDelivr. Serve over HTTP/HTTPS; `file://` is not supported for the 3D module entry. CDN/WebGL failure offers a Classic link.

The original listen/spell, sentence, and word-hunt modes remain at **`/classic/`**. The original fully bundled offline game remains at **`/dist/index.html`**. Rebuild that optional Classic bundle with `node scripts/bundle.js`.

## Deploy as a static site

**Vercel:** import the repository, choose Framework Preset **Other**, leave the build command empty, and use the repository root (`.`) as the output directory. Deploy the PR branch for a preview. No environment variables are needed.

**GitHub Pages:** Settings → Pages → Deploy from a branch → choose the desired published branch and **`/ (root)`**, then Save. The root `index.html` is the 3D home page; relative assets also work under `/dolch-spelling-game/`. Only select `main` after the PR has been reviewed/merged. No deployment was performed by this change.

## Checks

```sh
node scripts/selfcheck.js
find js scripts -name '*.js' -exec node --check '{}' \;
```

Optional browser smoke suite (Playwright is a development tool only):

```sh
npm install --no-save playwright
npx playwright install chromium
node scripts/flight-smoke.cjs
```

You can select an existing installation with `PLAYWRIGHT_MODULE=/path/to/playwright` and `CHROMIUM_PATH=/path/to/chromium`. The suite starts its own temporary HTTP server and requires access to jsDelivr. It verifies scene startup, actual gate collision, wrong-pick retry, scoring, ordered spelling, pause, round completion, storage, unlocking, mobile layout/control, reset, Classic loading, and console errors. Test state hooks are injected only by the test server and never appear in the shipped app.

See `VERIFY.md` for results and device checks that still need human ears/hands.
