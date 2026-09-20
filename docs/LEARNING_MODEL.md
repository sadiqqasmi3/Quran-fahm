# Quran Feham Learning Model

The product objective is not “complete lessons.” It is **direct comprehension under recitation**.

## Mastery dimensions

A learner can know the same word at different strengths:

1. **Seen** — recognizes that the word is familiar.
2. **Meaning recall** — can retrieve a learner gloss from Arabic text.
3. **Phrase recognition** — understands the word inside a familiar Quranic phrase.
4. **Audio recognition** — understands it when heard without seeing the Arabic.
5. **Stable/mastered** — succeeds after increasing review intervals and across contexts.

The web MVP stores a unified `strength` score plus review history and listening performance. A later server model should split visual/audio/context scores explicitly.

## Review scheduler

The current scheduler is intentionally transparent:

- **Again**: review again after about 10 minutes; strength decreases.
- **Hard**: short interval.
- **Good**: interval expands substantially.
- **Easy**: interval expands aggressively.

It is inspired by spaced-repetition principles but is not branded as a particular FSRS implementation. When enough real learning telemetry exists, replace the heuristic with a calibrated scheduler.

## Comprehension estimate

The percentage on the Learn dashboard is explicitly a **learning estimate across the reviewed lexicon**, not “percentage of Quran understood.” It should never be marketed as an academically precise comprehension score.

A future whole-Quran estimate should weight:

- token occurrence frequency
- lemma/inflection recognition
- phrase recognition
- audio recognition
- contextual sense ambiguity

## Curriculum order

Recommended progression:

1. Al-Fatihah and Quran heard daily in Salah.
2. High-frequency Quran vocabulary.
3. Recurrent phrases/chunks.
4. Essential grammar by discovery.
5. Juz Amma and short-surah listening.
6. Systematic whole-Quran reading/listening.

Urdu should gradually become optional as direct Arabic recognition improves.
