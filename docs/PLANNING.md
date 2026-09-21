# Quran Feham — Master Planning & AI Agent Handoff Document

> **For AI Agents & Engineers**: This document provides the complete, authoritative state of Quran Feham. It details what has been built, the architectural design, the completed Khatm Rooms module, and exact implementation specifications for all remaining roadmap phases.

---

## 1. Product Vision & Core Purpose

Quran Feham (**قرآن فہم**) is a Quran comprehension, reading, recitation, and family collaboration platform.

### The Problem
Millions of Muslims can read Quranic Arabic script fluently but do not understand what they are reading or reciting in prayer. Existing apps are either generic Islamic portals (cluttered with prayer times, compasses, and wallpapers) or basic text readers without pedagogical progression.

### The Mission
Guide a person from reading Quranic Arabic without understanding to **directly understanding the Quran while reading, listening, reciting, and praying**.
- **Urdu is the first bridge**, not a permanent crutch. The ultimate goal is understanding Arabic directly.
- Success is measured by **growing independent comprehension**, not daily XP or arbitrary streaks.

### The Four Pillars

| Pillar | Focus | Key Capabilities |
|---|---|---|
| **1. Understand** | Build direct Quranic Arabic comprehension | High-frequency vocabulary, phrase patterns, root networks, grammar discovery, listening practice, and spaced repetition review (SRS). |
| **2. Read** | Everyday Quran companion | 114 Surahs, 30 Paras/Juz, verified Urdu translations, named Qari audio streaming, word inspector, reading position sync, bookmarks, and 15-line Indo-Pak Mushaf. |
| **3. Recite** | Intelligent recitation partner | Listens silently, follows Ayah coordinates, detects hesitations and skips, provides gentle voice hints through earbuds, and maps weak points into tomorrow's learning queue. |
| **4. Together** | Family & community Quran completion | Khatm Rooms, 1–10 Khatm campaigns, 30-Para assignment ledger, WhatsApp invitations, race-free Para claiming, and direct reading/PDF handoffs. |

---

## 2. Technical Stack & Repository Structure

The repository is organized as a high-performance TypeScript monorepo powered by **pnpm workspaces** and **Turborepo**.

```text
Quran-fahm/
├── apps/
│   ├── web/                     # Next.js 16 App Router (React 19, TypeScript, Vanilla CSS Tokens, Lucide)
│   └── api/                     # Node.js + Fastify API (TypeScript, Zod, Argon2id, JWT, Cookies)
├── packages/
│   ├── contracts/               # Shared Zod schemas, TypeScript types, and Quran/Juz metadata
│   ├── database/                # Repository layer: MemoryRepository (dev/test) + PrismaRepository (Postgres)
│   ├── domain/                  # Core domain business logic and validation rules
│   ├── design-tokens/           # Design system tokens (warm light-first theme, dark mode)
│   ├── quran-content/           # Checksum verification and manifest management for Quran datasets
│   ├── quran-provider/          # External Quran Cloud provider adapter with fallback caching
│   └── storage/                 # Object storage abstraction (local disk and S3-compatible)
├── docs/                        # Architecture, Governance, Release Gates, and Roadmap docs
└── legacy/                      # Archived V1 static single-page app
```

---

## 3. What Has Been Done So Far (Completed Inventory)

### A. Navigation & Design System
- **Five Core Mobile Destinations**: `Home`, `Quran`, `Recite`, `Khatm`, `Ask`.
- **Desktop Sidebar Navigation**: Unfolds secondary modules: `Learn`, `Explore`, `Salah`, `Progress`, `Bookmarks`, `Downloads`, `Sources`, `Settings`.
- **Aesthetic**: Premium editorial feel with warm parchment background (`--canvas: #f8f6f0`), deep ink typography (`--ink: #1f2d25`), Quranic green action accents (`--accent: #215c3c`), and crisp borders. Default is light; dark mode is fully supported and user-selectable.

### B. Authentication & Session Security (`apps/api`)
- Robust user authentication built with **Argon2id** password hashing.
- Two-factor OTP email verification (signup verification and password reset).
- Secure HTTP-only cookies with rotating JWT access tokens (15m) and refresh tokens (30d).
- Rate limiting and origin verification configured for all auth endpoints.
- Guest mode enabled across reading and preview surfaces with seamless upgrade path.

### C. Quran Reader (`apps/web/src/components/reader-workspace.tsx`)
- Complete 114 Surah runtime loaded via Al Quran Cloud provider.
- Named Urdu translation editions (e.g. Fateh Muhammad Jalandhari, Tahir-ul-Qadri).
- High-quality audio recitation streaming with Ayah-level synchronization.
- Word Inspector: tap any word to view Arabic, Urdu lemma, and root coordinates.
- Reading Position synchronization: remembers last read Surah, Ayah, and mode.

### D. Learning Engine & SRS (`apps/web/src/lib/learning-store.ts`)
- Spaced Repetition Engine implementing multi-dimensional mastery:
  - Visual recognition
  - Meaning recall
  - Contextual comprehension
  - Audio recognition
- Vocabulary progression: `New` → `Seen` → `Recognized` → `Understood` → `Audio Recognized` → `Mastered`.

### E. Salah Mode (`apps/web/src/components/salah-comprehension.tsx`)
- Word-by-word comprehension for daily Salah: Al-Fatihah, short Surahs, Ruku, Sajdah, Tashahhud, and Durood.

### F. Khatm Rooms — Complete & Polished (`apps/web/src/components/khatm-*`)
The Khatm Rooms module is fully finished, end-to-end tested, and verified:
1. **Room Creation & Setup**:
   - Room name, intention/Isal-e-Sawab (e.g. *"For our late grandmother"*), target Khatms (1–10), optional deadline, recurrence (none, weekly, monthly), and max active Paras per person.
2. **Dual Invitation Credentials**:
   - **32-character secure token** for one-click private URLs (`/join/[code]`).
   - **8-character human room code** (e.g. `QF7K2M9P`) using unambiguous alphanumeric characters (excluding `0, 1, I, O`).
3. **Sharing & WhatsApp Integration**:
   - Native Web Share API integration with automatic clipboard copy fallback.
   - Pre-filled WhatsApp distribution button with Salam, intention, private link, room code, and reading instructions.
   - Three-step visual onboarding guide explaining how family members join and select Paras.
4. **30-Para Ledger**:
   - Standard 30 Paras listed in order with:
     - Traditional Arabic names in Quran font (e.g. `الم`, `سَيَقُولُ`, `تِلْكَ الرُّسُلُ`).
     - Familiar Latin transliterations (e.g. `Alif Lam Mim`, `Sayaqool`, `Tilkar Rusul`).
     - Exact Ayah reference boundaries (e.g. `1:1 – 2:141`).
     - Live status badges: `Available`, `Chosen`, `Reading`, `Completed`.
5. **State Machine & Race-Condition Safety**:
   - Managed transitions: `Available` → `Claimed` → `Reading` → `Completed` (plus `Release` and `Admin Reassign`).
   - Atomic database transactions with optimistic locking: concurrent claims by two users result in a `409 Conflict` (`KHATM_SLOT_UNAVAILABLE`) with instant ledger re-sync.
6. **Direct Reading & PDF Integration**:
   - When a Para is claimed or in-progress, the member is presented with:
     - **"Start in Quran Feham"**: Opens interactive web reader directly at the starting Ayah of that Para with Urdu translations and audio.
     - **"Open 15-Line Mushaf PDF"**: Opens the complete 15-line Pakistani/Indo-Pak style Mushaf PDF in a new tab, automatically marking the assignment as `reading`.
     - **"Open on Quran.com"**: Direct external Juz link.
   - **"Your assigned Paras"** quick-access banner prominently positioned at the top of the room for 1-click continuation.
7. **Room Administration (Owner Controls)**:
   - Edit room settings (name, deadline, recurrence, max Paras).
   - Rotate invitation link and room code with one click.
   - Member roster management with auto-release of unfinished Paras.
   - Multi-campaign rollover (e.g. Campaign #1 → Campaign #2) with full historical completion tracking.
   - Reminder scheduling and cancellation.

---

## 4. What Remains (Roadmap for Next AI Agents)

Future AI agents should proceed in the following prioritized order:

```mermaid
graph TD
    A[Current State: Fully Verified Dev/Beta] --> B[Phase 1: Production Postgres & Cloud Deployment]
    B --> C[Phase 2: Native 15-Line Digital Mushaf (Completed)]
    C --> D[Phase 3: Learning Engine 2.0 (Completed)]
    D --> E[Phase 4: Khatm Reminder Worker (Completed)]
    E --> F[Phase 5: Live Recitation AI & Speech Assist]
    F --> G[Phase 6: Governed LLM AI Tutor]
```

### Phase 1: Production PostgreSQL & Cloud Deployment
- **Goal**: Transition from in-memory fallback to durable cloud persistence.
- **Database**:
  - Connect a hosted PostgreSQL instance (e.g. Supabase, Neon, AWS RDS, or Docker).
  - Run migrations: `pnpm --filter @quran-feham/database prisma migrate deploy`.
  - Validate concurrency tests with `pnpm --filter @quran-feham/database test`.
- **Environment Configuration**:
  - Set production secrets in `.env`: `DATABASE_URL`, `JWT_SECRET`, `REFRESH_TOKEN_PEPPER`, `OTP_PEPPER`, `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `NEXT_PUBLIC_APP_ORIGIN`.
- **Hosting**:
  - Deploy `apps/api` on Fastify-friendly hosting (Render, Fly.io, Railway, or AWS ECS).
  - Deploy `apps/web` on Vercel or Next.js container.

### Phase 2: Native 15-Line Indo-Pak Digital Mushaf (Completed)
- **Status**: Implemented & verified.
- Pre-packaged local vector WebP page assets (all 610 pages) with zero-latency preloading.
- Page jumping dialog, Para synchronization, bi-directional reader handoffs, and reading history integration.

### Phase 3: Learning Engine 2.0 & Whole-Quran Vocabulary (Completed)
- **Status**: Implemented & verified.
- ~150+ high-frequency lemmas across 5 stages with formulaic phrases.
- Multi-dimensional mastery tracking (visual, meaning, contextual, audio) with `isUnderstood` and `isMastered`.
- Interactive Grammar Discovery (pronouns, prepositions of jar, verb paradigms) and 8 prayer Surah readiness scores.
- "Direct Arabic" reader mode with receding translations.

### Phase 4: Background Notification & Reminder Worker (Completed)
- **Status**: Implemented & verified.
- Automated polling background worker querying due `KhatmReminder` entries.
- Transactional notification emails dispatched via Fastify server integration with clean shutdown lifecycle.
- Status atomically transitioned from `PENDING` to `SENT`.

### Phase 5: Live Recitation AI & Gentle Assist
- **Goal**: Intelligent recitation partner that listens and assists during Hifz/practice.
- **Architecture**:
  1. **Audio Capture**: Browser `navigator.mediaDevices.getUserMedia()` with low-latency Web Audio worklet.
  2. **VAD (Voice Activity Detection)**: WebAssembly Silero VAD to detect pauses and genuine hesitation.
  3. **ASR / Forced Alignment**:
     - Python FastAPI microservice running Whisper / wav2vec2 fine-tuned on Quranic phonetics.
     - Constrained alignment: because the expected Ayah is known in advance, speech recognition uses grammar-constrained decoding (not open-ended dictation).
  4. **Modes**:
     - *Gentle Assist*: Stays completely silent unless hesitation exceeds threshold (e.g. 2.5s), then whispers the next word through headphones/AirPods.
     - *Hifz Mode*: Quran text hidden; reveals words as user recites.
     - *Correction Mode*: Flags skipped or substituted words.
  5. **Weak-Point Map**: Hesitation coordinates automatically feed into the user's daily review queue (`ReviewEventInput`).

### Phase 6: Governed LLM AI Tutor (`/ask`)
- **Goal**: An AI tutor that explains linguistic nuances without hallucinating religious rulings.
- **Strict Content Hierarchy**:
  1. Canonical Arabic text
  2. Verified translation edition
  3. Approved Tafsir (e.g. Ibn Kathir, Ma'arif-ul-Quran)
  4. Explicitly identified Hanafi scholarly notes
  5. Quran Feham simplified teaching explanation
- **Guardrails**: RAG pipeline must refuse fiqh rulings or ungrounded theological assertions.

---

## 5. Development, Testing & Verification Commands

All agents and developers can verify repository health with these commands:

```bash
# 1. Run all unit and contract tests across the monorepo
pnpm test

# 2. Run web application unit tests specifically
pnpm --filter @quran-feham/web test

# 3. Run API integration and Khatm routes tests
pnpm --filter @quran-feham/api test

# 4. Build all packages and the Next.js production web app
pnpm --filter @quran-feham/web run build

# 5. Start the local development servers
pnpm dev
```

### Verified Passing State (as of current commit)
- `@quran-feham/web`: 9 test files, 34 tests passed.
- `@quran-feham/api`: 3 test files, 21 tests passed.
- `@quran-feham/contracts`, `@quran-feham/domain`, `@quran-feham/quran-provider`: 100% tests passing.
- Next.js 16 production build: 26/26 static & dynamic routes compiled with zero errors.
