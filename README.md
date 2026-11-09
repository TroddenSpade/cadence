# Cadence

Cadence is a web-based, interactive music theory trainer for **reading** and **listening**. It moves from first principles to advanced analysis through 22 courses and 77 lessons. Every lesson section pairs its explanation with a guided piano and guitar example, and every lesson ends with exercises plus a spaced-recall practice queue that keeps earlier material alive.

The interface is installable as a PWA and is structured so the same build can be wrapped as an Android APK with Capacitor.

## What is included

- **Structured curriculum** across five levels: Foundations, Beginner, Intermediate, Advanced, and Master.
- **Guided instrument examples in every section.** Each concept is explained with exact piano keys and guitar string/fret positions, a short “Hear it” playback, and a caption naming the musical point. There are 198 section-level examples across the 77 lessons.
- **An editorial layer on every lesson.** Each of the 77 lessons opens with **The big idea** — one mental model to hold before the detail — and closes with **Practice & pitfalls**, a four-part routine: *Try this*, *Watch out*, *You have it when*, and *Going further*. The last cue gives experienced players a stretch while the first three keep a beginner moving.
- **Lesson exercises** for staff reading, note finding, heard and written intervals, chord quality and inversion, chord and scale building, key signatures, rhythm counting and dictation, melodic dictation, scale degrees, and chord progressions.
- **Daily practice** driven by per-skill strength, review streaks, and expanding review intervals. Missed skills return sooner.
- **Piano, guitar, or both.** Note-finding, chord-building, and scale-building questions render on the selected instrument surface. Pitch class is what counts, so any octave or fret position works.
- **ABC, Do Re Mi, or both.** Note names appear in the selected system across lessons, exercises, staff examples, and the instrument labels. The default shows the letter with solfège in parentheses, such as `C (Do)`.
- **Synthesized audio** for piano and Karplus–Strong guitar, generated locally with the Web Audio API. No audio files to download.
- **Metronome** with a floating dock that follows you through the app and a full settings page. The page shows a mechanical metronome whose brass weight slides up and down a printed tempo scale as you change tempo, while the rod swings in time. It supports 2/4–7/8 meters, eighth-note and triplet subdivisions, downbeat accents, tap tempo, and independent volume, and it schedules clicks on the AudioContext clock so the pulse does not drift.
- **Tuner** with live microphone pitch detection. Presets cover guitar, bass, ukulele, violin, viola, cello, double bass, mandolin, banjo, and chromatic piano, alongside alternate tunings such as Drop D, DADGAD, open G/D/E, and custom string sets. It shows cents, a needle, a string-by-string target, configurable A4 reference pitch, and playable reference tones.
- **Offline support** through a service worker. Progress, settings, and review history live in `localStorage`, with optional account sync across devices. When a new build is deployed, a banner at the top offers a one-click refresh that clears the old cache and reloads the latest version.
- **Responsive layout** with a desktop sidebar and a mobile bottom navigation bar.
- **English and Persian (فارسی)**, with a full right-to-left layout for Persian that covers the interface, curriculum, exercises, and tool copy.

## How lessons are designed

Every lesson carries the same editorial frame, built from approaches that music educators and open textbooks converge on:

- **Sound before symbol.** Concepts begin with something the ear can hold — a pulse, an octave, a cadence — before notation names it. Rote and aural work first, symbol second, is the long-standing recommendation in beginning-instrument pedagogy.
- **One mental model, then the detail.** “The big idea” supplies a single organising image (a ruler, a hierarchy, a conversation) so the sections that follow have somewhere to attach.
- **Landmarks over mnemonics.** Reading is taught from anchor notes and interval distance rather than a poem for every line; mnemonics are treated as training wheels.
- **Two kinds of ear training.** Intervals are practised both by distance and by scale-degree function inside a key, and every answer is sung back. Recognition without reproduction is treated as a guess.
- **Name the usual mistake.** “Watch out” states the error learners actually make — counting letter names instead of semitones, doubling the leading tone, reading 6/8 as six fast beats — so the correction arrives with the concept.
- **Progressive drills with a success test.** “Try this” gives a concrete exercise; “You have it when” turns it into an observable criterion instead of a vague feeling.
- **A stretch for the advanced player.** “Going further” applies the idea to repertoire, transcription, reharmonization, or a harder constraint, so the same lesson serves a starter and a master.
- **Analysis applied to real music.** Form, harmony, and counterpoint are tied to pieces and recordings rather than to isolated labels.

The content lives in `src/data/guides/`, one file per level. Each entry stores the English and Persian texts together in `GuideContent`, and `LESSON_GUIDES` / `GUIDE_FA` are derived from that single list, so a translation key cannot drift away from its lesson. Guides render as accent panels around the existing sections — above the prose and before the exercises — rather than as new `LessonSection` entries, which keeps section indexes, `afterSection` demo placement, and the table of contents stable.

Research and teaching references that informed the explanations and drills:

- [Open Music Theory, 2nd ed.](https://viva.pressbooks.pub/openmusictheory/) — fundamentals, harmonic function, species counterpoint, chromatic harmony.
- [Integrated Music Theory — Part-writing errors](https://intmus.github.io/inttheory19-20/10-intro-part-writing/a1-part-writing-errors.html) — doubling and tendency-tone mistakes.
- [How to Read Music Using Intervals and Landmark Notes vs. Mnemonics](https://www.musicandtheory.com/how-to-read-music-using-intervals-and-landmark-notes-vs-mnemonics/) — landmark reading.
- [Berklee Take Note — Circle of Fifths](https://online.berklee.edu/takenote/circle-of-fifths-the-key-to-unlocking-harmonic-understanding/) and [Music Modes](https://online.berklee.edu/takenote/music-modes-major-and-minor/) — key relations and characteristic modal notes.
- [Musical U — The Ultimate Guide to Interval Ear Training](https://www.musical-u.com/learn/ultimate-guide-to-interval-ear-training/) and [functional vs. interval ear training](https://music.stackexchange.com/questions/125958/functional-ear-training-vs-interval-ear-training-for-singers) — combined distance and function practice.
- [Open Music Theory — Species Counterpoint](https://viva.pressbooks.pub/openmusictheory/chapter/species-counterpoint/) and [First Species Counterpoint, University of Puget Sound](https://musictheory.pugetsound.edu/mt21c/FirstSpecies.html) — the constraint ladder.
- [Sight or Sound? A Review of the Literature](https://scholarworks.uni.edu/cgi/viewcontent.cgi?article=5679&context=grp) — sound-before-symbol and rote learning.

## Run it

```bash
npm install
npm run dev
```

Vite prints the local URL. To use the port used during development:

```bash
npm run dev -- --port 5199
```

Type-check and production build:

```bash
npm run typecheck
npm run build
npm run preview
```

The production output is written to `dist/`.

## Install as a PWA

1. Open the production site (or the dev server) in Chrome, Edge, or a Chromium-based browser.
2. Use the install icon in the address bar, or the browser menu's **Install Cadence** action.
3. On Android, Chrome's menu also offers **Add to Home screen**.

The app precaches the shell, icons, and the bundled Noto Music font. Once loaded, lessons, exercises, and the instrument surfaces work without a network connection.

Cadence also offers an in-app install reminder. Chromium browsers get an **Install app** button backed by the native install flow when the browser exposes it, and the browser-menu route otherwise; iOS gets the Share → **Add to Home Screen** steps. Choosing **Not now** or closing the card snoozes it for one day, and it never appears when the app is already installed. **Settings → Install app** always shows the current install route and can bring the reminder back.

## Deploy to GitHub Pages

The repository includes `.github/workflows/deploy.yml`, which builds the app and publishes `dist/` whenever `main` is pushed.

1. Create a GitHub repository and push this project to its `main` branch.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Push to `main` (or run **Deploy to GitHub Pages** from the Actions tab).

The workflow detects the deployment path automatically:

- A project repository such as `cadence` is served from `https://<user>.github.io/cadence/` and is built with `BASE_PATH=/cadence/`.
- A user site repository named `<user>.github.io` is served from the domain root and is built with `BASE_PATH=/`.

For a custom domain configured in **Settings → Pages**, the project site still lives under `/<repo>/`, so leave the automatic base path alone. The workflow only switches to `/` when a `public/CNAME` file exists, which is appropriate when the site is genuinely served from the domain root.

To reproduce a Pages build locally:

```bash
BASE_PATH=/cadence/ npm run build
BASE_PATH=/cadence/ npm run preview
```

If you only want to serve it from a plain GitHub repository without Actions, you can build with `BASE_PATH=/<repo>/` and publish the contents of `dist/` to a `gh-pages` branch, but the included workflow is the simpler path.

## Clean URLs, SEO, and sharing

Routes are real URLs (`/courses/staff-pitch`, `/lesson/treble-clef-reading`) rather than hash fragments. The build copies `dist/index.html` to `dist/404.html`, which GitHub Pages serves for unknown paths so the client router can render deep links. Old `#/...` bookmarks redirect to the equivalent clean URL on startup.

Each route updates its own `<title>`, description, canonical link, and Open Graph/Twitter tags while the app runs. `index.html` carries static defaults (including the social card at `public/og-card.png`) for crawlers that do not execute JavaScript.

The `cadence-seo` Vite plugin emits two files at build time:

- `sitemap.xml` lists every public page, course, and lesson from the curriculum data.
- `robots.txt` allows crawling and points at the sitemap.

Both use `SITE_URL` (default `https://cadence.parsasam.ir`) plus `BASE_PATH`. Override it when the site lives elsewhere:

```bash
SITE_URL=https://example.com BASE_PATH=/cadence/ npm run build
```

If the canonical domain changes, update `SITE_URL` and the expectations in `e2e/seo.spec.ts`; the static defaults in `index.html` are rewritten to match at build time.

## Accounts and cross-device sync

Progress is local-first: the app works fully offline and keeps writing to `localStorage`. Signing in adds an optional copy in Supabase so lessons, skills, XP, streaks, and settings follow you between phone and computer. A build without Supabase credentials keeps working normally and shows a short setup note in Settings instead.

Enable it once:

1. Create a free project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run [`supabase/schema.sql`](supabase/schema.sql). It creates the `progress` table and row-level security policies so each user can only read and write their own row.
3. In **Authentication → URL Configuration**, set **Site URL** to the deployed address (for example `https://parsasam.ir/Cadance/`), and add that address plus `http://localhost:5173/` to **Redirect URLs**. The email link returns to the app root, where Supabase's PKCE flow completes.
4. In **Authentication → Email Templates → Magic Link**, include `{{ .Token }}` so the email shows a six-digit code. Keep `{{ .ConfirmationURL }}` too if you want to offer both routes:

   ```html
   <p>Your Cadence sign-in code:</p>
   <p><strong>{{ .Token }}</strong></p>
   <p><a href="{{ .ConfirmationURL }}">Or sign in with a link</a></p>
   ```

5. Copy the project URL and the **anon public** key from **Project Settings → API** into `.env.local`. The URL is the project root only — `https://<project-ref>.supabase.co`, **not** the `/rest/v1/` endpoint:

   ```bash
   cp .env.example .env.local
   ```

6. For GitHub Pages, add both names as repository **variables** under **Settings → Secrets and variables → Actions → Variables**: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. The workflow passes them into the build.

Then open **Settings → Account**, enter an email, and enter the six-digit code from the message (or follow the link). There is no password to store. The anon key is safe to ship in the bundle because row-level security restricts every request to the signed-in user.

**Email template note:** projects using Supabase's built-in free email provider created after June 2026 may not be able to edit templates. Configure custom SMTP under **Authentication → Emails** (or use a project that allows template editing) before relying on email codes.

How merging works:

- XP and daily question counts are tracked **per device**. Merging takes the maximum per device and then sums, so syncing the same two devices repeatedly never double counts.
- Lesson records keep the earliest completion, the best score, and the highest attempt count.
- Skills keep the most recently reviewed record.
- Settings follow the most recent change; a fresh device adopts the account's settings instead of overwriting them with defaults.
- Resetting progress records a reset timestamp, so the next sync clears the other devices instead of restoring old data.
- Practice is never blocked on the network. Changes are pushed shortly after activity and pulled when the app regains focus.

Supabase's built-in email sender is rate-limited and intended for testing. For real sign-ups, configure SMTP under **Authentication → Emails** with any transactional provider.

**Android note:** the native shell cannot open the `https://` email link directly, so enter the six-digit code from the email in the app. The link still works in a browser or installed PWA. A direct link flow in the APK would need a custom scheme (for example `com.cadence.musictheory://auth`) plus `@capacitor/browser` and `@capacitor/app` listeners.

**Backups:** **Settings → Data → Export backup** downloads a JSON snapshot. **Import** restores one and treats it as a reset, so it replaces older copies on other devices.

## Wrap as an Android APK

The repository includes `capacitor.config.json` with `webDir: "dist"`. Capacitor's Android project is generated locally and is not committed.

```bash
npm install
npm install @capacitor/core @capacitor/android
npm install -D @capacitor/cli

npm run build
npx cap add android
npx cap sync android
```

Open the native project:

```bash
npx cap open android
```

Or build a debug APK from the command line:

```bash
cd android
./gradlew assembleDebug
```

The APK is written to `android/app/build/outputs/apk/debug/app-debug.apk`. For a release build, configure signing in Android Studio and run `./gradlew assembleRelease`.

After changing web code, rebuild and sync again:

```bash
npm run build
npx cap sync android
```

### Notes for the native wrap

- Routing uses `BrowserRouter` with clean URLs such as `/lesson/treble-clef-reading`. In the browser, the build writes `dist/404.html` as an SPA fallback so static hosts serve deep links; Capacitor loads `index.html` and client-side navigation stays inside the document. Old `#/...` links redirect to the matching clean URL on startup.
- Audio starts after the first user gesture, as required by mobile browsers. The instrument and **Listen** controls provide that gesture.
- The PWA manifest and service worker are not used by the native shell, but they remain useful for the browser version.
- If you publish the web build under a sub-path, adjust `base` in `vite.config.ts` and the manifest `start_url`/`scope` accordingly.

## Project structure

```text
src/
  App.tsx                 app shell, navigation, routes
  components/             staff, piano, fretboard, rhythm, session engine, metronome dock and figure, prompts
  data/curriculum.ts      core courses, levels, skill blueprints
  data/expansion/         advanced courses and their instrument examples
  data/guides/            per-lesson "big idea" and "practice & pitfalls" editorial layer, English + Persian
  data/i18n.ts            localized curriculum and instrument-demo lookups
  locales/fa/             Persian UI dictionaries and translated curriculum content
  lib/
    audio.ts              Web Audio piano, guitar, metronome, and reference tones
    exercises.ts          question generators, grading, topic presets
    i18n.tsx              language state, t(), direction, dates, document metadata
    metronome.tsx         shared metronome clock, settings, and persistence
    music.ts              pitch, intervals, chords, scales, key signatures
    progress.tsx          React state, auth, sync, XP, spaced repetition
    progressState.ts      document shape, per-device counters, merge rules
    pwa.ts                service worker update checks, cache clearing, refresh
    supabase.ts           optional Supabase client (env-driven)
    courseStats.ts        lesson/course progress helpers
    tuner.ts              YIN pitch detection, cents maths, target selection
    tunings.ts            instrument presets, alternate and custom tunings
  pages/                  dashboard, courses, lesson, practice, trainer, tools, metronome, tuner, settings
  styles.css              design system and responsive rules
supabase/
  schema.sql              progress table, RLS policies, updated_at trigger
public/
  fonts/NotoMusic-Regular.ttf
  icons/
```

## How practice scheduling works

Each exercise answer updates every skill attached to that question:

- A wrong answer resets the skill's streak and schedules it again in about six hours.
- Correct answers advance through review intervals of roughly 6 hours, 1 day, 2 days, 4 days, 7 days, 14 days, 30 days, and 60 days.
- Strength rises with correct answers and falls with misses. The daily queue combines due reviews with the weakest skills, and falls back to a foundation mix when no history exists.
- Repeated questions on the same skill within a ten-minute sitting do not advance the interval. The skill is scheduled once, so a lesson cannot inflate a review streak.

The scheduler is intentionally local-first: all state is in `localStorage` under `cadence.progress.v1`. Clearing site data resets the local copy. An account only adds a synced copy; offline practice still works and merges when the connection returns.

## Settings

- **Instrument:** piano, guitar, or both.
- **Timbre:** synthesized piano or guitar.
- **Note names:** **ABC** (C, D, E), **Do Re Mi** (fixed do: C is always Do), or **Both** (C (Do), D (Re)). Both is the default and applies to lessons, exercise prompts and choices, staff examples, and the piano and guitar labels.
- **Note labels:** show or hide note names on the instrument surfaces.
- **Autoplay:** play listening questions automatically.
- **Sound:** globally mute or enable audio.
- **Daily goal:** target number of answered questions per day.
- **Language:** English or فارسی. The choice applies immediately and is remembered on the device.

## Languages and right-to-left layout

The interface ships in English (default) and Persian. On the first visit, a language dialog asks which language to use; the choice is stored and the dialog does not appear again. A language switch then sits in the sidebar footer on desktop and in the mobile header on smaller screens, so it is reachable from every page; **Settings → Language & direction** offers the full picker. The selection is stored under `cadence.language` in `localStorage`, and an inline script in `index.html` applies the saved `lang` and `dir` before the first paint so there is no flash of the wrong direction.

- UI copy lives in `src/locales/fa/`, keyed by the exact English string, so a missing Persian entry falls back to English instead of showing a blank.
- Curriculum content — levels, courses, lessons, section bodies, instrument demo captions, exercise metadata, and skill names — is translated in `src/locales/fa/content/` and exposed through `useCurriculum()` in `src/data/i18n.ts`.
- Generated exercise prompts, explanations, hints, and choices are translated at question-build time, so they follow the active language even mid-session.
- Vazirmatn (400/500/700) is bundled in `public/fonts/` and applied only to Persian glyphs, so Latin note names and notation keep the original design fonts. The weight and line-height scale follows synup.ir.
- Musical content stays unchanged: note names and octaves, chord symbols, Roman numerals, figured bass, meters, and audio terminology remain in Latin notation regardless of language. Note names may still appear alongside their solfège form when the naming setting asks for it.
- The sidebar moves to the right, content margins mirror, the metronome dock moves to the left, and staff/keyboard/fretboard surfaces keep a left-to-right orientation so the notation is not reversed.
- `src/locales/fa/coverage.test.ts`, `uiCoverage.test.ts`, and `dictionary.test.ts` fail the test suite if a curriculum string or a literal `t()` key is missing a Persian translation, or if two modules translate the same key differently.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check, build the production bundle, generate `sitemap.xml`/`robots.txt`, and write the `404.html` fallback |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run the note-naming, progress merge, migration, and curriculum tests |
| `npm run test:e2e` | Run the full Playwright suite against the production build |
| `npm run test:e2e:ui` | Open Playwright's interactive UI runner |
| `npm run typecheck` | Run TypeScript without emitting files |

## Testing

The automated checks cover the pure logic with Vitest and the shipped app with Playwright.

- **Unit tests** (`npm test`) run 84 checks across note naming, exercise generation, progress merging and migration, guide coverage and pairing, curriculum/Persian coverage, and the metronome/tuner helpers.
- **End-to-end tests** (`npm run test:e2e`) build the production bundle and serve it with `vite preview` on `127.0.0.1:4173`, including the service worker. They cover first-visit language choice and persistence, all main routes, clean URLs and the legacy hash redirect, per-page metadata, sitemap/robots, the sidebar and mobile navigation, lessons and daily practice, the trainer, metronome, tuner, settings/backup/reset, accessibility structure, PWA installation metadata and offline reloads, and the mobile layout.
- The suite runs in two Playwright projects: `desktop-chromium` for the desktop flows and `mobile-chromium` (Pixel 7) for `mobile.spec.ts`. Install the browser once with `npx playwright install chromium`.
- Failed runs keep traces, screenshots, and video in `test-results/`; open the HTML report with `npx playwright show-report`.

A typical full verification run is:

```bash
npm run typecheck
npm test
npm run test:e2e
npm run build
```
