# Quran Feham V1 static archive

This directory preserves the Urdu-oriented static V1 snapshot for product and
migration reference. It is not the current application, is not deployed by the
V2 CI workflow and receives no production or security support.

Important boundaries:

- The archive uses browser JavaScript, runtime provider calls and localStorage.
- Its vocabulary matching, listening scores, comprehension estimate and offline
  claims must not be treated as validated learning evidence.
- Do not restore the archived Pages workflow as the V2 deployment workflow.
- Do not copy cached/provider content or user localStorage into V2 automatically.
- External Quran, translation and recitation resources retain their own licences.

Historical references:

- `v1-remote-urdu` — this Urdu-oriented remote snapshot.
- `v1-local-english` — the divergent English/continuous-reader prototype.

For a deliberate comparison run only:

```bash
cd legacy/v1-static
python3 -m http.server 4173
```

Then open `http://localhost:4173`. See `../../docs/MIGRATION_V1.md` for what may
and may not be carried into V2.
