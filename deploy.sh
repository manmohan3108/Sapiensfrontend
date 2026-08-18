#!/usr/bin/env bash
# Pull and build the static frontend served directly by Nginx.

set -euo pipefail

PROJECT_DIR="/srv/apps/Sapiensfrontend"
PNPM_STORE="/srv/pnpm-store"
DEPLOY_BRANCH="main"

cd "$PROJECT_DIR"

echo "Updating $DEPLOY_BRANCH..."
git pull --ff-only origin "$DEPLOY_BRANCH"

echo "Installing locked dependencies..."
pnpm install --frozen-lockfile --store-dir "$PNPM_STORE"

echo "Building the production frontend..."
pnpm build

test -f "$PROJECT_DIR/dist/index.html"
echo "Deployment complete: https://awareai.in"
