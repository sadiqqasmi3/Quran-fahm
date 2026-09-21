# Quran Feham Product Plan

## North star

Quran Feham helps a person move from reading Quranic Arabic without sufficient
understanding to understanding more of it directly while reading, listening,
praying and reciting. Urdu is the first bridge, not the permanent destination.

Success is not downloads, XP or a devotional score. The core question is:

> When Quran is read or recited, does the learner understand more today than
> before, and can they engage with it more independently?

## Product pillars

| Pillar | Job | Primary outcomes |
|---|---|---|
| Understand | Build Quranic Arabic comprehension | vocabulary, phrases, roots, grammar discovery, listening and review |
| Read | Be the learner's everyday Quran | Surah/Juz, translation, audio, word inspector, Mushaf, bookmarks and history |
| Recite | Practise with quiet intelligent help | position tracking, hesitation/mismatch detection, Hifz hints and weak points |
| Together | Coordinate existing family/community Khatm practice | rooms, campaigns, Para assignments, invitations and completion |

## Information architecture

Primary mobile navigation is fixed at five destinations:

```text
Home · Quran · Recite · Khatm · Ask
```

Desktop additionally exposes Learn, Explore, Salah, Progress, Bookmarks,
Downloads, Sources and Settings. Home answers only “What should I do with Quran
today?” and prioritizes one clear next action from actual state.

## Capability truth

| Capability | Status in this repository | Product rule |
|---|---|---|
| Complete runtime Quran reader | Live | label provider/edition and runtime-vs-reviewed status |
| Urdu translations and named Qari audio | Live | never silently substitute an edition |
| Learning Engine 2.0 & Whole-Quran high-frequency vocabulary | Live | 150+ high-frequency lemmas across 5 stages, multi-dimensional evidence, grammar discovery & Direct Arabic receding |
| Listening comprehension | Live | multi-dimensional evidence (visual, meaning, contextual, audio) |
| Explore words/roots/search | Live | local teaching data and provider search remain visibly distinct |
| Salah comprehension | Live | Fatihah, daily prayer adhkar, and 8 short prayer Surahs |
| Deterministic grounded tutor | Live | refuse unsupported tafsir/rulings |
| Offline shell and previously opened Quran responses | Live | never cache auth, settings, Khatm or private sync responses |
| Account/session/settings/reading sync foundation | Live | guest/local capability remains usable |
| 15-line Indo-Pak Mushaf | Live | canvas/SVG vector rendered with page/para navigation |
| Reviewed whole-Quran word/morphology layer | Live | high-frequency curriculum lemmas and grammar tables |
| Khatm Rooms core | Live | authenticated rooms, invites, 30-Para ledger and guarded Para transitions |
| Realtime Khatm recurrence, reminders and worker | Live | automated reminder background worker, transactional emails, and status transitions |
| Live recitation correction/Hifz assist | Planned | model benchmark and low-latency alignment required |
| Tajweed analysis | Later | practice feedback, separate from sequence correctness |
| External AI tutor | Later | only within approved source context and governance |

Planned features may have interface previews, but the interface must say what
is and is not connected. A preview cannot create synthetic learner activity or
pretend to reserve shared state.

## Delivery plan

### Phase 1 — Preserve and stabilize

- Keep every working V1 capability reachable during migration.
- Port global JavaScript into typed feature slices and tests.
- Keep the hardened account/session foundation and add explicit progress sync.
- Make light the default; dark is opt-in.
- Restore the complete five-destination product shell.

### Phase 2 — Quran reading foundation

- Publish verified structured Quran releases with immutable manifests.
- Add reviewed word positions/morphology, Juz navigation, bookmarks and history.
- Add an exact licensed 15-line Indo-Pak Mushaf representation.
- Support explicit offline Surah/Juz/Mushaf/audio packs where rights permit.

### Phase 3 — Learning engine 2.0 (Completed)

- Expanded from 52-word prototype to ~150+ whole-Quran high-frequency vocabulary across 5 curriculum stages.
- Multi-dimensional mastery tracking: separate visual, meaning, contextual, and audio evidence stores.
- Interactive Grammar Discovery: pronoun matrix (detached vs attached), prepositions of jar, and past/present verb paradigms.
- Surah comprehension readiness scores for 8 frequently recited prayer Surahs.
- "Direct Arabic" reader mode allowing understood meanings to recede gracefully without hiding source access.

### Phase 4 — Khatm Rooms (Completed)

- Rooms, join links, members, campaigns, 30-Para ledger and multiple Khatm cycles.
- Transaction-safe Available → Claimed → Reading → Completed Para state.
- Deadlines, recurrence, administration, and WhatsApp invitation sharing.
- Automated background reminder worker polling due reminders and dispatching notification emails.
- Direct reader & 15-line Mushaf handoffs; completion remains a human confirmation.

### Phase 5 — Recitation Assist

- Expected-passage microphone capture, VAD and current-position detection.
- Quran-specific recognition/forced alignment, hesitation and skip detection.
- Self-correction allowance and minimum necessary hint.
- Follow Me, Gentle Assist, Hifz, Correction and Exam modes.
- Feed recurring weak words/ayat back into learning.

### Phase 6 — Quran Tutor

- Retrieve canonical Quran, named translation, reviewed morphology, approved
  tafsir and separate Hanafi notes before any generated teaching explanation.
- Preserve citations and authority labels in every answer.
- Keep provider/model choice in configuration.

### Phase 7 — Tajweed and advanced speech

- Evaluate pronunciation signals only after sequence alignment is reliable.
- Present results as bounded practice feedback, not authoritative judgment.

### Phase 8 — Native mobile

- Reuse the API, Quran Core and learner model in Expo/React Native.
- Prioritize microphone/Bluetooth sessions, offline content, background audio,
  notifications, haptics and lock-screen controls.

## Religious content hierarchy

Every answer or learning surface preserves this visible order:

1. canonical Quran;
2. named verified translation;
3. named approved tafsir;
4. separately identified Hanafi scholarly note;
5. Quran Feham teaching explanation;
6. AI analogy/personalisation.

Lower levels can explain higher levels but never masquerade as them.

## Release discipline

Code completion, package installation and passing tests do not establish a live
religious-content or speech capability. Each release also needs source/licence
evidence, migrations, backup/restore, deployment verification, live canaries,
privacy review and honest capability labels. See `RELEASE_GATES.md`.
