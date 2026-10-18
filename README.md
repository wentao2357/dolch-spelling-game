# Little Sky · Word Flight

A gentle, voice-guided 3D Dolch word game for ages 6–8. Original pastel Three.js clouds, floating islands, balloons, and a little airplane. Static HTML/CSS/JavaScript; no accounts, paid services, build secrets, or application server.

## Play

- **Listen & Fly (default):** hear an English word, then steer through its matching word gate. Three different choices; wrong picks wobble with encouragement. Missed gates return, with no penalty.
- **Spell Flight:** hear a word and fly through its letters in order, including the apostrophe in `don't`. Repeated letters are offered again at the correct step.
- **Phrase Flight:** hear a 2–4 word phrase, then catch its words in order. The word trail fills and the combo counts consecutive catches. A wrong word gently restarts the phrase and combo, preserving earned stars. Only a complete unbroken phrase earns stars: its word count plus one bonus per five consecutive catches. Ten phrases complete a round; Parents counts completed phrases by level.
- Arrow keys or WASD move up/down/left/right. On phones/tablets use the big directional pad or drag the sky to steer. “Hear again” repeats the full target, including the whole phrase. Hold **Space** or the on-screen **🚀** button for an optional smooth 2× forward boost; release to ease back. The final gate approach slows smoothly to normal speed, keeping catches manageable. Space does not scroll the page during flight.
- The living sky completes an **80-second** continuous day → warm sunset → starry night → soft dawn cycle. A separate **113-second** clear/partly cloudy/soft cloudy cycle changes cloud coverage, drift and tint. Sun and moon arc, stars fade and twinkle, and clouds, fog, islands and lighting follow daylight. The icon at the top shows the sky; cream gate backings and a night glow preserve word contrast. Pause freezes sky time. No storms or weather sounds.
- Each completed word earns one star and a spoken word/letter recap. Ten words complete a round with a celebration. Earn 20 stars in a level to unlock the next. Repeating words earns practice stars.
- Pause freezes gates and movement. Parents shows progress in each level, learned words, pick accuracy (including letter picks), and confirmed reset.
- Progress/settings live only in this browser’s localStorage under `little-sky-v1`; Classic progress is separate. If storage is blocked, play continues for the session.
- Generated WebAudio music starts after a user action, with master gain 0.06; speech is volume 1, en-US, rate 0.85. Music ducks to zero during speech. Independent music/voice switches are saved. Available English voices depend on the device; when speech fails, a grown-up reading prompt shows the target.

## Word source

`js/words.js` embeds **all canonical Dolch 220 sight words**, grouped as Pre-Primer **40**, Primer **52**, First Grade **41**, Second Grade **46**, Third Grade **41**. The requested [WeChat article](https://mp.weixin.qq.com/s/eYIxof9DD49TFYNAHqte3g) could not be fetched, so this uses the canonical list already present in the repository. The existing self-check verifies counts, uniqueness, spelling/order fingerprint, and sentences. It also checks all **50 per-level phrases** in `js/words.js`: each contains 2–4 words from the cumulative Dolch vocabulary through that level. “the best” comes from the title of the traditional Dolch practice story *The Best Thing in the World* (available from [DolchWord.net](https://www.dolchword.net/)). Other phrases are original practice combinations. **“thing” and “world” are not Dolch 220 words**, so “the best thing” and “in the world” are excluded to preserve the Dolch-only requirement; “the best” becomes available at Second Grade.

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

You can select an existing installation with `PLAYWRIGHT_MODULE=/path/to/playwright` and `CHROMIUM_PATH=/path/to/chromium`. The suite starts its own temporary HTTP server and requires access to jsDelivr. It verifies scene startup, actual gate collision, wrong-pick retry, scoring, ordered spelling, pause, round completion, storage, unlocking, mobile layout/control, reset, Classic loading, and console errors. It additionally checks day/night/weather and icon state, phrase completion-only scoring, wrong-catch resets, streak bonuses, phrase replay and speech settings, phrase persistence/reset, held Space and touch boost, smooth release, and collision while boosted. For environments without CDN connectivity, `THREE_MODULE_PATH=/path/to/official-three-r170-module.js` supplies an exact-version local test fixture to the browser (not shipped). Test state hooks are injected only by the test server and never appear in the shipped app.

See `VERIFY.md` for results and device checks that still need human ears/hands.
