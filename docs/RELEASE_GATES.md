# Production Release Gates

A green build is necessary, not sufficient. Quran Feham handles sacred source
material, credentials and learner history; release approval therefore requires
evidence at every boundary below.

Use three outcomes:

- **PASS** — current environment evidence satisfies the gate.
- **BLOCKED** — the gate could not be exercised; this is not a pass.
- **FAIL** — observed behavior violates the gate.

Any critical gate that is blocked or failed makes the release **NO-GO**.

## 1. Repository and build

- [ ] Clean install succeeds with the committed lockfile on Node `24.21.0`.
- [ ] Typecheck, tests and production builds succeed from a clean checkout.
- [ ] No secret, `.env`, generated credential, user export or recording is tracked.
- [ ] Dependency/security scan has no unaccepted critical/high finding.
- [ ] Container images are pinned, scanned and run as non-root where supported.
- [ ] V1 Pages deployment cannot overwrite or masquerade as V2 production.

Evidence: CI URL, commit SHA, lockfile hash, build artifact/image digests.

## 2. Canonical Quran and content provenance — critical

- [ ] Arabic text is imported from a named immutable source/version.
- [ ] SHA-256 and structural counts are verified before publication.
- [ ] Exact-text comparison covers every published surah/ayah, not samples only.
- [ ] Translation, recitation, morphology, tafsir and teaching layers each expose
      their actual edition/source attribution.
- [ ] Licence and redistribution permission are recorded per resource.
- [ ] Display normalization cannot modify stored canonical content.
- [ ] Word analysis is keyed by source/surah/ayah/position and counterexample tests
      prevent prefix/alias false matches.
- [ ] Reviewed explanations have source IDs, authority level, reviewer, status,
      timestamp and immutable version lineage.
- [ ] Sensitive-topic routing matches `SCHOLARLY_GOVERNANCE.md`.
- [ ] No generated text is labelled Quran or established translation.

Evidence: signed/reviewed source manifest, import report, checksum output,
full-corpus validation results and reviewer approval.

## 3. Authentication and authorization — critical

- [ ] Passwords use reviewed Argon2id parameters and are never logged.
- [ ] Access JWTs expire in about ten minutes and validate issuer/audience/time.
- [ ] Refresh tokens are random, stored hashed, rotated on use and revocable.
- [ ] Refresh-token reuse revokes the affected family and clears browser cookies.
- [ ] Auth cookies are `HttpOnly`, `Secure` in production, `SameSite=Lax`, tightly
      scoped and use compatible names/paths for clearing.
- [ ] State-changing cookie-authenticated routes validate permitted origins.
- [ ] Registration/login/reset/OTP endpoints have effective attempt limits.
- [ ] OTPs are single-purpose, expiring, hashed and one-time use.
- [ ] Login/reset responses do not expose account existence.
- [ ] Logout and password reset revoke the intended sessions.
- [ ] Authorization is tested against cross-user object access.
- [ ] Production startup refuses memory/test repositories and default secrets.

Evidence: integration tests against PostgreSQL, cookie capture over TLS, negative
authorization tests and secret/config audit.

## 4. Learning correctness

- [ ] Review order prioritizes failed/overdue material correctly.
- [ ] Streaks record qualifying learning events in the user's timezone, not opens.
- [ ] Visual, meaning, context and audio evidence remain distinct.
- [ ] Listening credit requires playable audio and a listening answer.
- [ ] Unknown/unreviewed words do not inflate mastery or its denominator.
- [ ] Every displayed estimate states its scope and cannot exceed its valid range.
- [ ] Scheduling has boundary tests for new, failed, overdue and long-interval cards.
- [ ] User progress migrations are atomic, idempotent and reversible/repairable.

Evidence: unit/property tests, fixture histories and product/content review.

## 5. UX, accessibility and mobile — critical

- [ ] Registration, verification, login, reset, reader, search, audio and review
      complete on representative iOS/Android viewport sizes.
- [ ] Desktop uses its width without making the mobile experience a reduced copy.
- [ ] All primary features/settings/source attribution remain reachable on mobile.
- [ ] Keyboard-only navigation completes every core flow with visible focus.
- [ ] Screen-reader checks cover landmarks, dialogs, errors, Quran/translation
      labels, audio state and mixed language/direction.
- [ ] Touch targets, contrast, reflow at 200% zoom and reduced motion meet WCAG
      2.2 AA expectations.
- [ ] Search lands on and focuses the selected ayah.
- [ ] A long surah does not create an unbounded DOM or freeze a mid-range phone.
- [ ] Loading/error/degraded states are visible and truthful.

Evidence: automated accessibility report plus documented manual device/AT runs.

## 6. Audio, privacy and retention — critical when enabled

- [ ] Reciter, recording edition/source and delivery rights are recorded.
- [ ] The player state always matches the audible surah/ayah/reciter.
- [ ] Microphone permission is requested in context and denial has a usable path.
- [ ] Recitation recordings are not retained by default without explicit policy.
- [ ] Upload, encryption, access, deletion and retention are verified end to end.
- [ ] ASR/alignment claims have versioned corpus metrics and human-reviewed errors.
- [ ] A failed/uncertain recitation score is not presented as religious judgment.

Evidence: rights record, mobile/browser canary, privacy test and model evaluation.

## 7. API, resilience and performance

- [ ] Every request body/query/parameter is schema validated.
- [ ] Public errors follow the contract without stack traces or private details.
- [ ] Superseded reader/search requests cannot replace newer state.
- [ ] Required dependency failure affects readiness; optional Redis failure does not
      disable core login, reading or review.
- [ ] Rate limits behave correctly through the real proxy/IP-trust boundary.
- [ ] API and page latency/load targets are measured under representative data.
- [ ] External-provider timeout/partial failure never silently changes edition.
- [ ] No single request can load an unrestricted full-corpus payload into memory.

Evidence: contract tests, load report, proxy/dependency failure drills and logs.

## 8. Offline and synchronization — critical when claimed

- [ ] “Available offline” is shown only after the exact version is present locally.
- [ ] Cache purge removes the caches the UI names without deleting unrelated origin
      caches.
- [ ] Expiry and source-version upgrades have explicit behavior.
- [ ] Offline mutations use idempotency keys and conflict tests.
- [ ] Audio/font/content availability is tested in actual airplane/offline mode.
- [ ] Account logout removes private local state while preserving allowed public
      immutable assets.

Evidence: install/upgrade/offline test matrix on production artifacts.

## 9. Database and operations — critical

- [ ] Migrations run against a production-like snapshot and are repeatable.
- [ ] Backup creation and restore are rehearsed; restore data is inspected.
- [ ] A rollback or documented forward-fix exists for schema/application mismatch.
- [ ] Health, logs and alerts distinguish liveness, readiness and degraded optional
      dependencies.
- [ ] Logs redact passwords, tokens, cookies, OTPs, private progress and recordings.
- [ ] TLS, security headers, cookie flags and origin routing are checked at the
      deployed edge, not inferred from local tests.
- [ ] A canary account completes registration, verification, login, refresh,
      reading and review in the deployed environment.

Evidence: migration/restore transcript, monitoring links and canary record.

## 10. Deployment decision

The release owner records:

```text
commit:
web artifact/image digest:
api image digest:
database migration:
content release/source-manifest digest:
environment:
critical gates passed:
blocked/failed gates:
known limitations shown to users:
reviewers:
decision: GO | NO-GO
timestamp:
```

Tests passing without deployed TLS/cookie checks, content checksums, database
restore, device/accessibility checks and a live canary is a **NO-GO**.
