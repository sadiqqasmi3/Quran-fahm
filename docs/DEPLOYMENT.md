# Production Deployment Guide: fehmequran.org

## Overview
**Quran Feham** is deployed on the production VPS (`169.58.189.165`) under the domain **`https://fehmequran.org`**. The production stack is fully containerized with Docker Compose and integrated with the host's existing Traefik reverse proxy for automated Let's Encrypt SSL.

---

## Server & Infrastructure Architecture

```
Internet (HTTPS / Port 443, HTTP / Port 80)
                │
                ▼
  ┌───────────────────────────────┐
  │   Traefik (support-traefik-1) │
  │   - Automated Let's Encrypt   │
  │   - Docker network: proxy     │
  └───────────────┬───────────────┘
                  │
        ┌─────────┴──────────────────────┐
        │                                │
Host(`fehmequran.org`) &&       Host(`fehmequran.org`)
PathPrefix(`/api/v1`)           (Default / Priority 10)
(Priority 100)                           │
        ▼                                ▼
┌───────────────────────┐       ┌───────────────────────┐
│   quran-feham-api     │◄──────│   quran-feham-web     │
│   Fastify (Port 4000) │ (SSR) │   Next.js (Port 3000) │
└───────────┬───────────┘       └───────────────────────┘
            │
            │ Internal Docker Network (`backend`)
            ▼
┌───────────────────────┐
│   quran-feham-db      │
│   Postgres 16 Alpine  │
│   Volume: pgdata      │
└───────────────────────┘
```

### VPS Host Specifications
- **IP Address**: `169.58.189.165`
- **SSH User**: `deploy`
- **Production Directory**: `/opt/apps/quran-feham`
- **Reverse Proxy**: Traefik v3 (`support-traefik-1`)
- **Docker Network for Ingress**: `proxy` (external bridge)
- **Host Mail Relay**: Postfix on `host.docker.internal:25`

---

## Containers & Services

| Service Name | Container Name | Image | Port | Description |
| :--- | :--- | :--- | :--- | :--- |
| **`postgres`** | `quran-feham-db` | `postgres:16-alpine` | `5432` (internal) | Isolated PostgreSQL database with persistent volume `quran_feham_pgdata` |
| **`migrate`** | `quran-feham-migrate` | `quran-feham-api:latest` | N/A | One-shot Prisma migration runner (`pnpm db:migrate:deploy`) |
| **`api`** | `quran-feham-api` | `quran-feham-api:latest` | `4000` | Fastify backend handling auth, sessions, and Khatm rooms |
| **`web`** | `quran-feham-web` | `quran-feham-web:latest` | `3000` | Next.js 15 frontend, 15-line Mushaf reader, and offline assets |

---

## Traefik Ingress Rules

### Web Frontend
```yaml
traefik.enable=true
traefik.docker.network=proxy
traefik.http.routers.quran-feham-web.rule=Host(`fehmequran.org`)
traefik.http.routers.quran-feham-web.entrypoints=websecure
traefik.http.routers.quran-feham-web.tls.certresolver=letsencrypt
traefik.http.routers.quran-feham-web.priority=10
traefik.http.services.quran-feham-web.loadbalancer.server.port=3000
```

### Fastify API & Health Check
```yaml
traefik.enable=true
traefik.docker.network=proxy
traefik.http.routers.quran-feham-api.rule=Host(`fehmequran.org`) && (PathPrefix(`/api/v1`) || Path(`/health`) || Path(`/ready`))
traefik.http.routers.quran-feham-api.entrypoints=websecure
traefik.http.routers.quran-feham-api.tls.certresolver=letsencrypt
traefik.http.routers.quran-feham-api.priority=100
traefik.http.services.quran-feham-api.loadbalancer.server.port=4000
```

---

## Environment Variables (`.env`)

Located on the remote host at `/opt/apps/quran-feham/.env`:

```bash
NODE_ENV=production
POSTGRES_DB=quran_feham
POSTGRES_USER=quran_feham
POSTGRES_PASSWORD=<generated_secure_password>
JWT_SECRET=<generated_64char_secret>
JWT_ISSUER=quran-feham-api
JWT_AUDIENCE=quran-feham-web
REFRESH_TOKEN_PEPPER=<generated_64char_pepper>
OTP_PEPPER=<generated_64char_pepper>
ALLOWED_ORIGINS=https://fehmequran.org,http://fehmequran.org
SECURE_COOKIES=true
REQUIRE_ORIGIN=true
EXPOSE_DEVELOPMENT_CODES=false
GENERIC_AUTH_RESPONSE_MS=750
TRUST_PROXY=linklocal,uniquelocal,10.0.0.0/8,172.16.0.0/12,192.168.0.0/16
SMTP_HOST=host.docker.internal
SMTP_PORT=25
SMTP_SECURE=false
AUTH_EMAIL_FROM=Quran Feham <no-reply@fehmequran.org>
QURAN_FEHAM_API_ORIGIN=http://api:4000
```

---

## Deployment & Operations Runbook

### 1. One-Command Automated Deployment
From your local machine:
```bash
./tools/deploy.sh
```
This script:
1. Syncs all code and assets via `rsync` over SSH to `/opt/apps/quran-feham/`.
2. Automatically excludes `.git`, `node_modules`, `.next`, and cache files.
3. Builds the Docker containers on the remote host.
4. Performs a zero-downtime rolling update via `docker compose up -d --build`.

### 2. Manual Commands on the VPS
Connect to the server:
```bash
ssh deploy@169.58.189.165
cd /opt/apps/quran-feham
```

#### Check Service Status
```bash
docker compose -f docker-compose.prod.yml ps
```

#### View Application Logs
```bash
# Web frontend logs
docker compose -f docker-compose.prod.yml logs -f web

# API backend logs
docker compose -f docker-compose.prod.yml logs -f api

# Database logs
docker compose -f docker-compose.prod.yml logs -f postgres
```

#### Restart Services
```bash
docker compose -f docker-compose.prod.yml restart
```

---

## Database Management & Backups

### Automated Database Backup
Run this command on the server to create a timestamped, gzip-compressed SQL dump:
```bash
docker exec -t quran-feham-db pg_dump -U quran_feham quran_feham | gzip > /opt/apps/quran-feham/backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Database Restore
To restore from a backup file:
```bash
gunzip < backup_YYYYMMDD_HHMMSS.sql.gz | docker exec -i quran-feham-db psql -U quran_feham -d quran_feham
```

### Run Pending Database Migrations
Prisma migrations run automatically when starting the stack via the `migrate` service. To run migrations manually:
```bash
docker compose -f docker-compose.prod.yml run --rm migrate
```

---

## Health Verification Endpoints

- **Frontend Homepage**: `https://fehmequran.org/`
- **15-Line Mushaf Reader**: `https://fehmequran.org/mushaf`
- **Offline Para PDF**: `https://fehmequran.org/mushaf-15-lines/pdf/para-01.pdf`
- **API Liveness Probe**: `https://fehmequran.org/health` → `{"status":"ok"}`
- **API Database Readiness Probe**: `https://fehmequran.org/ready` → `{"status":"ready"}`

---

## Next Steps for Future Improvements

1. **GitHub Actions Deployment Pipeline**:
   - Set up automatic deployment on push to `main` using SSH secrets.
2. **Scheduled Backups (Cron)**:
   - Add a nightly cron job on the VPS to dump the PostgreSQL database and retain the last 30 days of backups.
3. **PWA Offline Service Worker**:
   - Cache the 30 Para PDFs in browser IndexedDB/CacheStorage for instant offline access without cellular data.
