# Architecture

## Current web MVP

Quran Feham is a static PWA by design. It has no secret-bearing backend and therefore cannot safely expose paid AI provider keys.

```text
Browser
├─ UI/router                  src/app.js
├─ Learning/SRS               src/core.js
├─ Reviewed learning pack     src/data.js
├─ Quran provider adapter     src/api.js
├─ localStorage               mastery/settings/cache
└─ Service Worker             offline app shell
        │
        └── Runtime Quran provider (Arabic/Urdu/Qari audio)
```

## Why the provider adapter matters

UI code never needs to know the external provider URL shape. `src/api.js` normalizes source results into:

```js
{
  number,
  name,
  englishName,
  revelationType,
  translationEdition,
  audioEdition,
  ayahs: [{ numberInSurah, text, translation, audio, juz, page }]
}
```

A later backend, Quran Foundation integration, self-hosted canonical dataset or mobile offline pack can replace the adapter while preserving the product layer.

## Recommended server phase

Only add a backend when required for:

- accounts/sync across devices
- scholar-review workflow
- licensed content that must not be publicly bundled
- source-grounded AI tutor with secret provider credentials
- analytics/experimentation

Suggested future stack: Postgres + small TypeScript API, object storage for explicitly licensed assets, and a source manifest/checksum pipeline. Keep Quran canonical data immutable and versioned.
