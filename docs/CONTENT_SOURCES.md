# Content Sources and Provenance

Quran Feham separates application-code licensing from religious-content licensing. A GitHub repository being open source does not establish that every Quran translation, tafsir, recitation or font inside it may be redistributed.

## Production rules

- Never generate Quran text or established translation with an LLM.
- Never silently alter source Quran text.
- Preserve translator/reciter/source attribution.
- Track every bundled resource by provider, edition/version, license and checksum where practical.
- If the right to redistribute a resource is unclear, consume it only through an allowed provider interface or leave it out.
- Audio from a Qari is not treated as public-domain merely because it is publicly downloadable.
- Hanafi material is a separate scholarly-note layer; it does not alter canonical Quran text or translation identity.

## Current source matrix

| Resource | Current handling | Rights posture | Notes |
|---|---|---|---|
| Arabic Quran runtime | Al Quran Cloud, `quran-uthmani` | Provider/runtime source | Adapter can be replaced without changing learning state |
| Urdu translation | Named Al Quran Cloud editions | Provider terms / edition-specific attribution | Default: Fateh Muhammad Jalandhry |
| Recitation | Al Quran Cloud audio edition URLs | Stream only; reciter rights remain source-specific | No AI TTS for Quran recitation |
| Canonical verification candidate | Tanzil | CC BY 3.0 | Exact Quran text must not be modified; attribution required |
| Translation import candidate | QuranEnc | Reuse under QuranEnc publication conditions | Keep publisher, edition/version and attribution |
| Lemma/POS candidate | QuranMorph | CC BY 4.0 for QuranMorph dataset | Do not accidentally bundle neighboring GPL QAC files under the wrong license |
| Resource-management reference | Tarteel QUL | Application code MIT; resource rights vary | Architecture/reference until each content resource is cleared |
| Licensing-aware pipeline reference | risan/quran-json | Project/frozen tree CC BY-SA; source resources retain conditions | Prefer current provenance catalog, not old frozen translation assumptions |
| Word-by-word architecture reference | QuranWBW | Repository/data redistribution status not sufficiently explicit | Do not copy private CDN content without permission |

## Learner lexicon

`src/data.js` contains a deliberately small reviewed learner glossary. These entries are pedagogical glosses such as “دن” for `يوم`, not verse translations or tafsir. The UI labels them as the **learning layer**.

A whole-Quran Urdu word-by-word pack should be added only after its exact source and redistribution permission are verified. Until then, an unknown tapped word produces an explicit “not reviewed yet” state instead of a guessed meaning.

## Proposed source record

For any future bundled dataset, store at minimum:

```json
{
  "source_id": "provider-resource-edition",
  "content_type": "translation|quran|morphology|audio|tafsir|scholarly_note",
  "provider": "Name",
  "author_or_reciter": "Name",
  "edition": "Edition/version",
  "license": "SPDX or exact terms",
  "source_url": "https://...",
  "retrieved_at": "ISO-8601",
  "redistribution_allowed": true,
  "modification_allowed": false,
  "attribution_required": true,
  "checksum": "sha256:..."
}
```

## Resources explicitly not merged into the core bundle

- Quranic Arabic Corpus morphology: GPL-licensed; useful, but it should not be casually relicensed inside an MIT application bundle.
- QuranWBW private CDN word data: useful technical reference, but redistribution rights need explicit confirmation.
- Tafsir or translations by named contemporary/rightsholder scholars without explicit permission.
- Reciter MP3 collections where the repository/CDN has not granted the required redistribution right.
