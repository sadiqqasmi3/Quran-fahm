# Versioned Stack

This file distinguishes the software V2 actually depends on from technology
reserved for later phases. “Latest” is not a dependency policy: exact pins move
only through reviewed upgrade pull requests, with lockfile, test and migration
evidence.

## Active V2 application baseline

| Layer | Exact repository pin | Role |
|---|---:|---|
| Node.js | `24.21.0` LTS | JavaScript runtime; Node 26 Current is not the production target |
| pnpm | `12.5.1` | workspace/package manager via `packageManager` |
| Turborepo | `2.11.2` | task graph and build cache |
| TypeScript | `7.0.2` | shared compiler baseline |
| Next.js | `16.3.5` | web application |
| React / React DOM | `19.3.0` | UI runtime |
| Tailwind CSS | `4.3.3` | design-token and utility CSS layer |
| Fastify | `5.12.5` | HTTP API |
| Zod | `4.6.5` | boundary validation/shared contracts |
| Prisma ORM/client | `7.10.0` | PostgreSQL schema, migrations and persistence |
| PostgreSQL | `18.6` | authoritative application store |
| Traefik | `3.7.13` | reference container ingress; replaceable by managed ingress |

The root `package.json`, `pnpm-workspace.yaml` catalog and lockfile are the
executable source of truth. This table explains those pins; it does not override
them.

## Development and deployment tooling

| Tool | Baseline | Status |
|---|---:|---|
| Docker Engine | `29.8.1` | supported host baseline; not shipped inside the application |
| Docker Compose | `5.5.1` | local/reference deployment orchestration |
| Mailpit | `1.31.1` | optional local-only email inbox |
| Vite | none in core V2 | add only for a genuinely isolated tool; Next.js owns the web app |

Container images should be pinned by patch tag and, in controlled production,
also by verified digest. Renovation is an explicit security/compatibility task.

## Optional but not yet an application dependency

| Technology | Evaluated/pinned line | Activation rule |
|---|---:|---|
| Redis | `8.10.2` target | only for measured cache/rate/coordination needs; optional Compose profile |
| BullMQ | `6.3.x` | only with a PostgreSQL outbox and operational ownership |
| Socket.IO | `4.8.3` | only for a specific realtime user flow that HTTP cannot serve well |
| Object storage | S3-compatible contract | select provider per deployment and content rights; no MinIO core dependency |

The official Redis container registry currently publishes `8.10.1-alpine`, so
the optional Compose service uses that verified official image. Move it to
`8.10.2-alpine` only when that tag is officially available and tested; do not
substitute an unreviewed third-party image merely to match the target patch.

Redis is not the source of truth. Its absence must not prevent core Quran reads,
login, progress retrieval or review submission.

## Deferred AI and Quran-intelligence stack

The following is a candidate service baseline, not part of the first V2 runtime:

| Layer | Candidate line | Decision status |
|---|---:|---|
| Python | `3.14.x` | defer until a Python service is justified |
| FastAPI | `0.141.x` | deferred recitation/ML API candidate |
| Uvicorn | `0.53.x` | deferred ASGI runtime |
| PyTorch | `2.14.x` | defer; hardware/model compatibility must be tested |
| Transformers | `5.17.x` | deferred |
| Sentence Transformers | `6.1.x` | deferred |
| FastEmbed | `0.8.x` | deferred |
| LangChain / LangGraph | `1.4.x` / `1.2.x` | orchestration only where a graph is demonstrably useful |
| OpenAI Node/Python SDK | `7.20.x` / `3.16.x` candidate | add only to the secret-bearing service that uses it |
| Qdrant | `1.19.x` | defer until retrieval evaluation justifies a vector database |

Do not install this table pre-emptively. When activated, re-check compatible
stable patch versions, platform wheels and security notices, then pin exact
versions in that service's own lockfile/container.

LLM model names remain configuration. Quran text, translation, morphology and
source retrieval remain deterministic. A Quran ASR/forced-alignment model is
selected only after benchmarking; its model revision and weights checksum are
release artifacts.

TorchAudio or TorchCodec should be added only if the selected audio pipeline and
benchmark require them; neither is a default platform dependency.

## Deferred native mobile baseline

The intended stable path is Expo SDK `57` with its supported React Native
`0.86.x` and React `19.2.3`, rather than forcing React Native `0.87` through a
pre-release Expo build. Android targets API 36. Revalidate this matrix when the
native project begins; no Expo dependency is installed in the V2 web/API
baseline.

## Quran content versions

Religious content is not versioned like npm packages. Every source is pinned by
identity and evidence:

```text
source_id
provider
edition
upstream_version
upstream_commit (when applicable)
sha256
retrieved_at
license
redistribution_allowed
modification_allowed
attribution
review_status
```

Canonical Arabic, translations, morphology, Mushaf layouts, recitations, tafsir
and Hanafi material each require their own manifest record. “Latest” is never a
valid content version.

## Upgrade policy

1. Change the manifest/catalog and regenerated lockfile together.
2. Read upstream security and migration notes.
3. Run typecheck, tests, production build and relevant migration rehearsal.
4. For database/runtime/container changes, verify backup restore and deployment
   rollback or forward-fix.
5. Update this document if the architectural status changes.
6. Never upgrade a Quran dataset in place; publish a new immutable source version.
