#!/usr/bin/env bash
set -euo pipefail

REMOTE_HOST="deploy@169.58.189.165"
REMOTE_DIR="/opt/apps/quran-feham"
LOCAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> Deploying Quran Feham to ${REMOTE_HOST}:${REMOTE_DIR}..."

# Ensure remote directory exists
ssh "${REMOTE_HOST}" "mkdir -p ${REMOTE_DIR}"

# Rsync files to remote host
echo "==> Syncing files to remote host..."
rsync -av --delete \
  --exclude='.git' \
  --exclude='.github' \
  --exclude='node_modules' \
  --exclude='**/node_modules' \
  --exclude='.turbo' \
  --exclude='**/.turbo' \
  --exclude='.next' \
  --exclude='**/.next' \
  --exclude='dist' \
  --exclude='**/dist' \
  --exclude='legacy' \
  --exclude='.DS_Store' \
  --exclude='._*' \
  --exclude='docs/*.pdf' \
  --exclude='*.log' \
  -e "ssh -o ServerAliveInterval=15 -o ServerAliveCountMax=4" \
  "${LOCAL_DIR}/" "${REMOTE_HOST}:${REMOTE_DIR}/"

echo "==> Building and launching Docker containers on VPS..."
ssh "${REMOTE_HOST}" "cd ${REMOTE_DIR} && docker compose -f docker-compose.prod.yml up -d --build --remove-orphans"

echo "==> Waiting for services to be healthy..."
sleep 5
ssh "${REMOTE_HOST}" "cd ${REMOTE_DIR} && docker compose -f docker-compose.prod.yml ps"

echo "==> Quran Feham deployed successfully to https://fehmequran.org!"
