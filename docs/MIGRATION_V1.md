# V1 to V2 Migration

## Why V2 is an in-place product migration

V1 proved the visual direction and basic reading loop, but its static/browser-
only architecture cannot provide secure accounts, server-side source governance
or reliable multi-device progress. Several V1 measures and Arabic word matches
also have semantics that must not be promoted into authoritative V2 records.

V2 therefore replaces the implementation architecture without replacing the
working product. V1 is the acceptance baseline for Learn/SRS, phrase practice,
listening, Explore, Salah, deterministic Ask, progress, import/export, offline
resilience and the reader. A V2 feature cannot be called a replacement while
the corresponding working behavior has disappeared.

The migration does not iframe or indefinitely wrap the old global application.
It ports each behavior into typed feature slices while keeping the prior route
usable until parity is verified.

## Preserved snapshots

- `legacy/v1-static/` contains the preserved Urdu-oriented GitHub branch snapshot
  and executable acceptance reference.
- Git tag `v1-remote-urdu` identifies that remote V1 state.
- Git tag `v1-local-english` identifies the divergent local English/continuous-
  reader prototype.

The two V1 branches were siblings, not a linear “old then new” sequence. V2
selects useful behavior intentionally, but may not discard the remote branch's
working product flows under the label of “foundation.”

## What carries forward

- the focused read/hear → recognize → review product loop;
- the responsive visual direction and readable Arabic emphasis;
- working edition/reciter options after attribution and licence revalidation;
- real reader audio and functional search-to-ayah behavior;
- phrase-oriented learning concepts;
- local-first resilience as a product requirement;
- the content-authority hierarchy and refusal/escalation principle.

## What does not carry forward as trusted truth

- prefix-stripped/alias-based morphology, roots or word meanings;
- the unified “comprehension” percentage;
- opening the app as proof of practice;
- listening scores recorded without actual audio evidence;
- V1 “mastered” flags without reviewed token/context identity;
- runtime-provider responses presented as a verified canonical corpus;
- unsafe imported HTML/state or V1 cached provider payloads;
- service-worker claims that were not verified on the device.

## Source-code migration map

| V1 responsibility | V2 destination |
|---|---|
| `src/app.js` routing/rendering | typed routes/components in `apps/web` |
| `src/api.js` provider calls | API content service and deterministic adapters |
| `src/core.js` SRS/progress | tested learning service plus PostgreSQL repository |
| `src/data.js` glossary | versioned reviewed content import with provenance |
| localStorage mastery/settings | authenticated server records plus bounded client cache |
| static service worker | generated, version-aware offline policy after offline gates |
| Pages workflow | CI plus an environment-appropriate web/API deployment |

## User-data migration policy

V1 uses these browser keys:

```text
qf_mastery_v1
qf_settings_v1
qf_activity_v1
qf_listen_v1
qf_cache_*
```

V2 must never scan or upload them silently. A future migration is an explicit,
user-initiated import with the following flow:

1. Export from V1 as `quran-feham-progress`, version 1.
2. Select the file in V2 and show exactly which categories are recognized.
3. Validate size, JSON shape and every nested value before any database write.
4. Map only safe preferences and historical review events whose semantics are
   known. Do not import cached Quran/provider content.
5. Treat old mastery/listening values as unverified history, not current mastery.
6. Write the migration atomically with an idempotency key and audit record.
7. Show accepted, skipped and reset fields; let the user confirm.

`tools/legacy-import` implements the schema-checked conversion boundary and
deliberately emits unverified placement hints rather than mastery. The first V2
slice does not yet expose an end-user upload/persistence flow; that flow remains
disabled until its atomic database write, consent summary and adversarial tests
meet the release gates above.

## Delivery stages

### Stage 0 — preserve and inventory

- Preserve the remote Urdu prototype under `legacy/v1-static/`.
- Tag both divergent V1 heads.
- Build an automated parity inventory for every working route and local data key.
- Keep every working behavior reachable until its V2 replacement passes parity.

### Stage 1 — foundation

- Establish the pinned monorepo, shared contracts, database and CI.
- Implement production-rejecting memory/test adapters.
- Establish same-origin web/API routing and health contracts.
- Add the full Home/Quran/Recite/Khatm/Ask shell with light as the default.

### Stage 2 — identity

- Register, verify email, login, refresh rotation, logout and password reset.
- Add authorization and account/session tests before progress synchronization.

### Stage 3 — content and reader

- Import one verified canonical source version and named translation edition.
- Ship source attribution and exact ayah navigation.
- Add audio only with exact reciter/source identity and allowed delivery terms.
- Retain the working runtime reader and word-learning overlay while immutable
  releases are introduced; show their different trust statuses explicitly.

### Stage 4 — learning

- Port the functioning V1 learner pack, SRS, phrase quiz, listening, Explore,
  Salah, deterministic tutor, progress and import/export first.
- Add position-addressed reviewed morphology/learning entries.
- Store distinct visual, meaning, context and audio evidence.
- Calibrate review scheduling before making outcome claims.

### Stage 5 — Khatm Rooms and offline sync

- Add rooms, membership, invitation tokens, campaigns, multiple Khatms,
  transaction-safe Para claims, deadlines, reminders and completion.
- Integrate each claimed Para with the selected reader/Mushaf position.
- Introduce realtime updates only as a view of committed PostgreSQL state.

- Introduce explicit downloadable/versioned offline packs.
- Add conflict-tested synchronization.

### Stage 6 — recitation assist and tutor

- Benchmark recitation models on the product corpus.
- Ship expected-passage alignment, hesitation detection and self-correction
  handling before any Tajweed claim.
- Add a cited AI tutor only after governance, privacy and evaluation gates pass;
  retain deterministic exact lookup beneath it.

### Stage 7 — native mobile

- Begin Expo after API, learning, Khatm and recitation contracts stabilize.
- Prioritize microphone/Bluetooth routing, offline Mushaf/audio, notifications,
  haptics and lock-screen controls.

Each stage must meet `RELEASE_GATES.md`; later-stage infrastructure is not added
merely because it appears in the long-term architecture.
