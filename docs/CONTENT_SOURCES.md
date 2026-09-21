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

The manifest `releaseSha256` is the SHA-256 of the normalized manifest with
that self-referential field omitted. Object keys are sorted recursively and
array order remains significant. The content pipeline verifies this release
digest as well as each asset's byte length and checksum before accepting a
release.

## Source matrix

| Resource | V2 handling/status | Rights posture | Notes |
|---|---|---|---|
| Arabic Quran runtime | Provider adapter exists; not accepted as the immutable canonical release | Provider/runtime source | V2 production requires a separately verified import and checksum |
| Urdu translation | Named edition contract; production edition release still requires manifest/review | Edition-specific terms and attribution | Do not silently substitute an edition |
| Recitation | Exact reciter/recording source required before enablement | Reciter and recording rights remain source-specific | No AI TTS for Quran recitation |
| Canonical verification candidate | Tanzil | CC BY 3.0 | Exact Quran text must not be modified; attribution required |
| Translation import candidate | QuranEnc | Reuse under QuranEnc publication conditions | Keep publisher, edition/version and attribution |
| Lemma/POS candidate | QuranMorph | CC BY 4.0 for QuranMorph dataset | Do not accidentally bundle neighboring GPL QAC files under the wrong license |
| Resource-management reference | Tarteel QUL | Application code MIT; resource rights vary | Architecture/reference until each content resource is cleared |
| Licensing-aware pipeline reference | risan/quran-json | Project/frozen tree CC BY-SA; source resources retain conditions | Prefer current provenance catalog, not old frozen translation assumptions |
| Word-by-word architecture reference | QuranWBW | Repository/data redistribution status not sufficiently explicit | Do not copy private CDN content without permission |

## Learner lexicon

The archived `legacy/v1-static/src/data.js` contains a deliberately small
pedagogical glossary. Its entries and spelling aliases were not position-
addressed morphology and are **not** imported as reviewed V2 truth. A V2 learner
entry must point to a source version, surah, ayah and word position and must carry
the review lineage defined in `SCHOLARLY_GOVERNANCE.md`.

A whole-Quran Urdu word-by-word pack should be added only after its exact source
and redistribution permission are verified. Until then, an unknown tapped word
produces an explicit “analysis not reviewed” state instead of a guessed meaning.

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
