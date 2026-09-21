# Mobile-First, Wide-Screen UX Contract

## Product principle

Quran Feham should feel like a focused Quran learning companion, not an
administrative dashboard, a reader-only utility, or a crowded “Islamic
super-app.” The smallest screen defines task order and accessibility behavior.
Wider screens use extra width for the current task, Quran and useful context,
not for more competing actions.

The three questions the interface should answer immediately are:

1. What should I do with Quran today?
2. Where did I stop reading, learning or reciting?
3. What does this word or ayah mean, and what is the source?
4. Is a family Khatm waiting for me?

## Navigation

Keep the primary information architecture stable and shallow:

```text
Home        one clear next action and personal Quran continuity
Quran       read and understand Quran
Recite      listening now; Hifz/live correction as validated releases
Khatm       family/community Quran completion
Ask         deterministic, source-grounded Quran tutor
```

- Mobile uses exactly these five bottom destinations with text labels.
- Desktop uses a persistent rail with the same primary destinations and exposes
  Learn, Explore, Salah, Progress, Bookmarks, Downloads, Sources and Settings as
  secondary modules.
- Sources, governance, account security and settings remain reachable on every
  viewport through the account/menu entry.
- Back behavior follows browser/platform expectations. Closing a sheet restores
  focus to the control that opened it.

## Page model

### Home

Home answers: **What should I do with Quran today?** One primary action is
selected from real learner state. Then a short ordered action list may expose
Today’s Learning, Review Due, Continue Recitation, Active Khatm Room and Salah.
It is not an analytics grid. Opening the application does not count as practice.

### Quran

The Quran is the visual centre. Translation and learning annotations support it
but do not compete with it.

- Mobile: one reading column; ayah actions open a bottom sheet.
- Tablet: wide single column with an optional contextual panel.
- Desktop: a wide reading canvas with a bounded secondary inspector. The Arabic
  line never becomes cramped to preserve a sidebar.
- Search opens at and focuses the selected ayah.
- Long surahs use windowed/incremental rendering and stable ayah anchors.
- A sticky, compact player reports the actual reciter, surah and ayah and remains
  consistent between reader and Salah modes.

Word details appear on deliberate tap/keyboard activation. Until exact
position-addressed morphology exists, the UI shows “analysis not reviewed” and
never guesses a lemma or meaning from approximate spelling.

### Learn

One review prompt per screen. Visual, meaning, phrase and audio evidence are
separate modes and separate progress dimensions. A listening question receives
credit only when audio was actually available and played. “Again”, “Hard”,
“Good” and “Easy” actions include screen-reader context and generous touch
targets.

The carried-forward 52-word learner pack remains usable and is labelled with
its exact scope. It must not be hidden merely because the whole-Quran reviewed
dataset is not yet published.

### Recite

The current working listening-comprehension exercise is active. Follow Me,
Gentle Assist, Hifz, Correction and Exam modes may be shown only with an
explicit planned/in-development status until microphone capture, Quran-specific
recognition, forced alignment and the recitation state machine are real.

The everyday end state is quiet assistance: remain silent during correct
recitation, allow self-correction, and give the minimum hint after a genuine
hesitation. Tajweed is a later, separate practice-feedback layer.

### Khatm

A room centres the campaign, Khatm cycle and 30 Para slots. States are Available
→ Claimed → Reading → Completed, with Released returning a slot to Available.
Realtime claiming must be transactionally conflict-safe. A device-only planner
cannot generate a working family invitation or present a Para as reserved.

### Ask

Ask begins from an exact ayah and visibly separates Quran, named translation,
approved tafsir, Hanafi note, Quran Feham teaching explanation and any later AI
personalisation. The live deterministic tutor refuses unsupported scholarly
judgment rather than generating it.

### Profile and account

Authentication is one linear task per screen:

```text
Create account → verify email → choose language/reciter → Home
Sign in       → Home (or the protected destination originally requested)
Forgot        → request OTP → verify → set new password → sign in
```

Error messages sit beside the relevant field, preserve safe input, and do not
reveal whether an account exists. Password-manager/autofill semantics are
mandatory. Session and device management can expand progressively without
cluttering the initial profile screen.

## Responsive layout

Components are built mobile-first and enhanced at content-driven breakpoints:

| Width | Layout behavior |
|---|---|
| `< 640px` | single column, bottom navigation, full-width sheets, 16px page gutter |
| `640–1023px` | wider reading measure, optional two-column summaries, bottom navigation may remain |
| `1024–1439px` | compact navigation rail and wide primary content |
| `≥ 1440px` | centred wide canvas; optional inspector, never an unbounded text line |

The application may use up to roughly `1600px` for the reader workspace, while
prose and forms keep a much narrower readable measure. Do not shrink Arabic to
fit auxiliary panels; collapse the panel first.

## Visual direction

- Light-first warm parchment and paper with restrained Quran green and a small
  gold status accent. Dark mode is an explicit user choice, never an automatic
  operating-system takeover.
- Strong typographic contrast rather than card borders around everything.
- Quran Arabic receives generous line height and an edition-appropriate font.
- Urdu uses a readable Urdu typeface and `dir="rtl"`; English uses `dir="ltr"`.
- Content authority is shown with concise labels: Quran, Translation, Tafsir,
  Reviewed teaching note. Colour alone never carries the distinction.
- One obvious primary action per viewport. Secondary actions move into an
  accessible menu/sheet instead of forming an icon wall.
- Motion is brief and functional and obeys `prefers-reduced-motion`.

## Interaction and accessibility requirements

- WCAG 2.2 AA is the release target.
- All actions are native buttons/links or provide equivalent semantics.
- Minimum touch target: 44 by 44 CSS pixels.
- Visible keyboard focus, logical tab order and no keyboard traps.
- Drawers/sheets use dialog semantics, focus trapping, Escape close and focus
  restoration.
- Status and validation messages use appropriate live regions without excessive
  announcement.
- Mixed Arabic/Urdu/English strings have explicit `lang` and `dir` boundaries.
- Text remains usable at 200% zoom and with dynamic/mobile text scaling.
- Audio has a textual identity and non-audio alternative; autoplay is avoided.
- Loading uses a rendered shell and contextual skeleton/status rather than a
  blank application.

## Honest language

Preferred labels:

- “Reviewed words” rather than “Quran understood.”
- “Learning estimate” with its denominator/scope visible.
- “Audio review” only when the prompt used audio.
- “Teaching note” rather than “tafsir” unless it is an attributed tafsir source.
- “Available offline” only for content verified on the device.

The UI must display degraded states explicitly: translation unavailable, audio
unavailable, analysis not reviewed, offline copy expired, or sign-in required.
Never silently substitute another edition and label it as the user's selection.

## Performance expectations

- Render the navigation/shell without waiting for a remote Quran provider.
- Cancel or identity-check superseded reader/search requests.
- Do not render every word of a long surah into the DOM at once.
- Preserve scroll/ayah position across navigation and responsive transitions.
- Keep primary navigation and current ayah interactive under slow mobile
  conditions; postpone optional analytics and enrichment.

## Explicit UX non-goals

- a dashboard grid full of statistics;
- reducing Quran Feham to a reader-only application;
- separate top-level destinations for every future feature;
- hidden mobile-only settings;
- icon-only primary navigation;
- celebratory mastery claims unsupported by evidence;
- chat as the default way to read Quran sources;
- forced sign-in before a visitor can understand the product and inspect public
  source attribution.
