# Scholarly Governance

Quran Feham is a learning product, not an autonomous mufti or tafsir authority.

## Content authority levels

### Level 0 — Canonical Quran
Immutable source content. No generative system may rewrite, paraphrase or “correct” it.

### Level 1 — Established translation
A named translation edition. It must remain attributable and visually distinct from the Arabic Quran.

### Level 2 — Approved tafsir
Only content from a known edition/rightsholder with permission appropriate to the product. Every excerpt/summary must retain a source pointer.

### Level 3 — School-specific scholarly note
For example, Hanafi fiqh implications. These notes must be explicitly labelled as a school-specific scholarly layer and reviewed by an appropriately qualified reviewer. They never create a “Hanafi Quran.”

### Level 4 — Teaching explanation
Simplified Urdu whose purpose is comprehension. It may explain vocabulary, grammar and a cited source, but must not present itself as Quran or authoritative tafsir.

### Level 5 — Analogy/personalization
Examples, analogies and learning mnemonics. These should be easy to distinguish from religious source material.

## Mandatory human-review categories

Before a public AI tutor is allowed to answer interpretively, create stricter review/routing for subjects including:

- halal/haram rulings
- aqeedah/theological disputes
- marriage, divorce and family law
- inheritance
- punishment/legal verses
- jihad/war
- Islamic finance rulings
- sectarian disagreement

The archived static tutor attempted a limited keyword refusal, but it did not
fully implement this list and is not governance evidence. V2 must route these
categories through a tested policy layer and fail closed when an approved,
citable source/reviewer path is unavailable.

## Review object

Every published reviewed explanation must have:

```text
explanation_id
ayah_key
source_ids[]
text_urdu
content_level
school (nullable)
review_status
reviewer_id
reviewed_at
version
supersedes_version
```

No published explanation should lose its source/version lineage when edited.
