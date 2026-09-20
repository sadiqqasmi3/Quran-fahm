# Quran Feham | قرآن فہم

**Understand what you recite.**

Quran Feham is a mobile-first Quran comprehension web app for Urdu-speaking Muslims who can already read Arabic but want to understand Quranic Arabic when reading or listening.

The app is intentionally not a generic Islamic super-app. Its product loop is:

**hear/read Arabic → recognize words and phrases → connect them to meaning → review at the right time → gradually rely less on Urdu**.

## Current web app

The repository contains a deployable static PWA with no server secrets and no build step required.

- Full 114-surah reader through a runtime Quran API
- Multiple named Urdu translation editions
- Real-Qari recitation streaming
- Tap-to-inspect learner vocabulary
- Adaptive spaced repetition and review queue
- Listening-comprehension quizzes
- Root and word explorer
- Quran search using the active edition
- Salah comprehension mode
- Source-grounded deterministic tutor
- Local-first progress, streaks and listening statistics
- Export/import of learning progress
- Offline application shell and cached previously loaded Quran JSON
- Source/licensing registry and scholarly governance model
- Responsive desktop sidebar and mobile bottom navigation

## Run locally

This project intentionally uses browser-native JavaScript modules so a clean checkout can run without installing a dependency tree.

```bash
python3 -m http.server 4173
# open http://localhost:4173
```

Or use any static file server.

## Architecture

```text
index.html
├── src/app.js       UI, routing, screens and interaction
├── src/api.js       Quran provider adapter + source-bound caching
├── src/core.js      Arabic normalization, SRS, progress, import/export
├── src/data.js      reviewed learner lexicon + source registry
└── src/styles.css   responsive visual system

sw.js                offline app-shell service worker
manifest.webmanifest installable PWA metadata
docs/                 content, learning and scholarly governance
```

The runtime Quran provider is isolated behind `src/api.js`. A later native/mobile client can reuse the data contracts and learning rules without inheriting the web UI.

## Sacred-content boundaries

Quran Feham treats content authority as a data-model concern, not a prompt instruction:

1. **Canonical Quran** — immutable source text.
2. **Established translation** — named edition/provider.
3. **Approved tafsir** — explicit source, permission and review required.
4. **School-specific scholarly note** — e.g. Hanafi fiqh, separately labelled and reviewed.
5. **Teaching explanation** — simplified learning layer.
6. **Analogy/personalization** — lowest authority.

**Quran text and established translation are never AI-generated.**

There is no separate “Hanafi Quran.” Hanafi relevance belongs in a separately sourced scholarly/fiqh layer.

## Data approach

The web app currently uses Al Quran Cloud / Islamic Network as a runtime provider for Arabic text, selected Urdu translations and recitation URLs. Recitation files are streamed rather than bundled.

The repository deliberately does **not** copy unclear-rights QuranWBW/QUL/private-CDN datasets into the app. Candidate morphology and translation sources are documented in `docs/CONTENT_SOURCES.md` and must pass per-resource provenance checks before bundling.

The learner word glosses in `src/data.js` are short teaching aids, not an authoritative verse translation or tafsir. The UI labels that distinction.

## GitHub Pages

The included workflow deploys the repository as a static site from `main` using GitHub Pages actions. In repository settings, set **Pages → Source → GitHub Actions** if it is not already enabled.

## Roadmap to mobile

Web is the validation layer. A native/mobile version should follow after the learning loop is proven.

- Replace localStorage with synced accounts while preserving offline-first behavior.
- Add a reviewed/licensed whole-Quran Urdu word-by-word data pack.
- Add attributed QuranMorph lemma/POS import as an optional build artifact.
- Add scholar-reviewed Urdu teaching explanations and a licensed Hanafi notes layer.
- Add server-grounded AI tutor constrained to approved sources.
- Add word/ayah audio timing and live listening recognition only after audio rights and accuracy are validated.
- Reuse the learning engine in React Native / native clients.

## Code license

Application code in this repository is MIT licensed. **That license does not re-license Quran text, translations, recitations, fonts, morphology datasets or any external content.** External resources retain their own licenses and attribution requirements.
