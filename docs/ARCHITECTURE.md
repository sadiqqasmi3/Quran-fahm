# Quran Feham V2 Architecture

## Decision summary

V2 is a preservation-first modular platform. Next.js owns the product UI,
Fastify owns application and authentication rules, and PostgreSQL is the system
of record. Shared Zod contracts define the boundary. The browser reaches the
API through the same public origin at `/api/v1`.

The product model has four first-class pillars—Understand, Read, Recite and
Together. A modular monolith supports the current reading, learning, account and
Khatm workflows without premature network boundaries. Recitation intelligence
is deliberately a separate future Python service because its audio/ML runtime,
scaling and evaluation lifecycle are materially different.

This architecture deliberately keeps canonical Quran retrieval, morphology and
source identity deterministic. AI, vector search, realtime sockets, job queues
and native mobile are activated behind bounded interfaces when the product
phase needs them; they are not dependencies of the core reading and learning
loop.

## Runtime topology

```text
Browser / installable web experience
                 │
                 │ HTTPS, same public origin
                 ▼
       Traefik / platform ingress
          ├─ /api/v1/* and /health ──► Fastify API :4000
          │                                  │
          │                                  ├─ authentication/session service
          │                                  ├─ learner/progress service
          │                                  ├─ Quran/source service
          │                                  ├─ Khatm room/campaign service
          │                                  ├─ bookmarks/history service
          │                                  └─ health/operations boundary
          │                                           │
          │                                           ▼
          │                                    PostgreSQL 18.6
          │
          └─ all other routes /* ─────► Next.js :3000
```

Traefik is the reference self-hosted ingress. A managed host may provide the
same path routing and TLS boundary without running Traefik. TLS terminates at
the edge; direct database and API ports are not publicly exposed.

## Monorepo boundaries

### `apps/web`

- Next.js App Router UI and browser-safe state.
- Server-rendered shell where useful, interactive client islands where needed.
- Mobile-first navigation, reader, practice and account experiences.
- Product feature slices for Home, Quran, Recite, Khatm, Ask, Learn, Explore,
  Salah and Progress.
- Same-origin requests to `/api/v1`; no database access and no provider secret.
- Accessible mixed-direction rendering for Arabic, Urdu and English.

### `apps/api`

- Fastify route composition, authentication and authorization.
- Zod validation at every untrusted boundary.
- Application services and repository interfaces.
- Cookie issuance, token rotation, origin validation and rate-limit hooks.
- No UI rendering and no direct dependency on browser storage.

### `packages/contracts`

- Zod request/response schemas and stable value objects.
- Public API error envelope and versioned contract types.
- No database implementation or framework-specific request objects.

### `packages/database`

- Prisma schema, migrations and generated client.
- PostgreSQL repository implementations.
- Seed/import utilities kept separate from request handling.
- Test repositories may be in memory; production boot must reject them.

### Supporting packages

- `domain` owns deterministic learning rules without framework dependencies.
- `quran-content` owns immutable source/content identity and validation.
- `quran-provider` owns runtime-provider adaptation without becoming canonical.
- `design-tokens` keeps responsive visual primitives consistent across clients.
- `storage` defines the object-storage port; a deployment chooses its adapter.

### `tools`

- `content-pipeline` validates source manifests and content imports outside the
  request path.
- `legacy-import` owns the explicit, schema-checked V1 conversion boundary. It
  never silently scans browser storage or promotes V1 mastery to verified V2
  evidence.

If another package is added, it must own a coherent cross-application contract.
Do not create a package merely to move a few files out of an app.

## Authentication architecture

V2 uses first-party, cookie-based browser sessions.

```text
email + password
      │
      ▼
Argon2id verification
      │
      ├─ short-lived signed access JWT (~10 minutes)
      │     stored only in HttpOnly, Secure, SameSite=Lax cookie
      │
      └─ random opaque refresh token
            browser: HttpOnly, Secure, SameSite=Lax cookie
            database: token hash + session/family/expiry metadata only
```

Refresh tokens rotate on every successful refresh. Reuse of an already rotated
token revokes the affected token family. Logout revokes the server-side session,
not merely the browser cookie.

Email verification and password reset use single-purpose, expiring OTP records.
OTPs and refresh tokens are never stored in plaintext. Authentication routes
apply attempt limits, generic account-discovery-safe responses, origin checks
for state-changing requests, and structured logs that exclude credentials and
tokens.

In production, forgot-password and verification-resend requests return on the
same configured delay and dispatch eligible mail asynchronously, so SMTP and
database latency do not disclose whether an account exists. This first slice is
process-local; a durable database outbox is a release gate before horizontally
scaled delivery.

The access token secret, OTP/mail credentials and database credentials are
deployment secrets. `.env.example` documents names only. A memory repository is
permitted for isolated tests and local preview; production startup must fail if
it is selected.

The API keeps email behind an injected `AuthMailer` port. Its memory mailer is
development/test-only. Production boot requires an SMTP host and sender and
verifies that transport before accepting traffic. Running Mailpit alone does
not satisfy the production delivery gate.

## Data ownership

PostgreSQL owns:

- user identity, verification and account state;
- refresh/session records and revocation state;
- learner preferences and per-dimension progress;
- review events and scheduling state;
- Khatm rooms, members, campaigns, Para assignments and completion events;
- bookmarks, reading history and synced learning settings;
- immutable source manifests and content-version references;
- reviewed teaching material and its approval lineage.

Browser storage remains a valid local-first store for the currently shipped V1
learning loop and may cache public content and pending offline actions. Login
adds backup and cross-device sync; it must not remove basic learning or reading
when the API is temporarily unavailable. Synced mutations require
client-generated idempotency keys and explicit conflict handling. Legacy
aggregate strength values remain compatibility history, not verified mastery.

## Quran content architecture

Content is imported, reviewed and published as immutable versions:

```text
Upstream resource
      │
      ▼
download/import ──► checksum + licence + attribution verification
      │
      ▼
staging tables/artifact ──► exact-text and structural validation
      │
      ▼
human approval ──► immutable source version ──► published release manifest
```

The stable Quran token identity is:

```text
source_version + surah_number + ayah_number + word_position
```

Display normalization is never used as identity. A learner word may point to a
reviewed token analysis; the application must not infer lemma, root or meaning
by stripping arbitrary Arabic prefixes. Translation, morphology, tafsir,
teaching explanations and school-specific notes retain distinct source records
and authority levels.

Every bundled source record includes at least provider, edition, upstream
version or commit, SHA-256, retrieval date, licence, redistribution status and
required attribution. See `CONTENT_SOURCES.md`.

## API shape

The public prefix is `/api/v1`. New compatible fields may be added within V1;
breaking semantics require a new API version or an explicit migration.

Recommended route groups:

```text
/api/v1/auth/*             register, verify, login, refresh, logout, reset
/api/v1/me                 account and preferences
/api/v1/quran/*            deterministic published Quran/source reads
/api/v1/learning/*         review queue, answers and mastery dimensions
/api/v1/khatm/*            rooms, membership, campaigns and Para claims
/api/v1/bookmarks/*        private bookmarks and reading history
/api/v1/tutor/*            source-bounded deterministic/approved tutor reads
/api/v1/sources/*          public provenance/attribution
/health                    liveness/readiness contract
```

All mutations accept validated payloads, enforce authorization in the service
layer and return one documented error envelope. Database models are never
serialized directly as the public API.

## Learning model boundary

V2 stores distinct evidence rather than one universal comprehension number:

- visual recognition;
- meaning recall;
- phrase/context recognition;
- audio recognition;
- stability across time.

Scheduling is deterministic and testable. Listening credit requires actual
audio playback and a listening-specific answer. App opens do not create practice
streaks. Dates are evaluated in the user's declared/local timezone.

## Optional and deferred capabilities

### Redis and BullMQ

Redis is available only through the optional Compose profile. It becomes part
of the application after a concrete need such as distributed rate coordination
or background work. Durable jobs must be initiated through a PostgreSQL outbox;
request handlers must not rely on an uncommitted database write plus a separate
best-effort queue publish.

### Object storage

Use an `ObjectStorage` interface for licensed audio, Mushaf assets, temporary
recitation recordings and offline packs. S3, R2, a compatible self-hosted store
or a local development filesystem are adapters. MinIO is not a core dependency.

### AI tutor and Qdrant

An AI tutor is a separate source-grounded capability. Provider/model identifiers
are configuration, not architectural constants. Exact Quran lookup and content
authority filtering happen before generation. Every answer must retain citations
and follow the escalation rules in `SCHOLARLY_GOVERNANCE.md`. Qdrant is justified
only after retrieval evaluation demonstrates a need beyond PostgreSQL search.

### Recitation/Hifz service

A future Python service may own VAD, Quran-specialized ASR, forced alignment and
the recitation state machine. No model is selected until it wins a versioned
evaluation on the product's own corpus. Model name, revision, weights checksum,
training/evaluation dataset version and metrics become part of the release.

The browser/native client sends an expected passage and consented audio stream.
The service returns timed alignment evidence and event candidates; product
policy decides when a hesitation or mismatch merits a hint. Tajweed feedback is
a separate later model/release and must not be conflated with textual sequence
correctness.

### Realtime Khatm collaboration

Khatm data remains authoritative in PostgreSQL. A Para claim is a transaction
against a unique active `(campaign_id, khatm_number, juz_number)` slot, never a
client-only optimistic assertion. Realtime transport may broadcast committed
changes, but it is not the source of truth. WhatsApp is an invitation channel;
the signed/unguessable join token resolves to the room membership workflow.

### Expo mobile

Expo is a later client of the same `/api/v1` contracts. The web application must
first validate the reader, listening and review loops. Shared domain schemas may
be reused; Next.js components and browser storage assumptions may not.

## Failure and operations model

- `/health` is process liveness. `/ready` reaches the configured repository, so
  production readiness fails when PostgreSQL is unavailable or migrations have
  not been applied.
- Optional Redis failure cannot take down core reading, authentication or review.
- External content/provider failure never changes published canonical content.
- Health endpoints distinguish process liveness from dependency readiness.
- Logs use request/correlation IDs and redact cookies, tokens, passwords, OTPs,
  Quran recitation recordings and private learner data.
- Database backup/restore and schema rollback/forward-fix are release procedures,
  not assumptions inferred from passing migrations.

## Architectural non-goals

- microservices for each feature;
- multi-provider LLM orchestration;
- vector search by default;
- realtime sockets outside demonstrated workflows such as committed Khatm-room updates;
- server-side storage of recitation audio before consent/retention is designed;
- automatic migration of unvalidated V1 mastery claims;
- claims of Quran comprehension derived from a small vocabulary average.
