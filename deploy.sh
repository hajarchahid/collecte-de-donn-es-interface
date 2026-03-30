#!/bin/bash
set -e

APP_DIR="/var/www/speechai"
BRANCH="main"

echo "Go to project directory..."
cd "$APP_DIR"

echo "Reset local changes..."
git reset --hard
git clean -fd

echo "Pull latest code..."
git pull origin "$BRANCH"

echo "Check .env file..."
if [ ! -f .env ]; then
  echo "ERROR: .env file not found in $APP_DIR"
  exit 1
fi

# 🔍 Detect changes
echo "Detecting changes..."
CHANGED_FILES=$(git diff --name-only HEAD@{1} HEAD || true)

echo "Changed files:"
echo "$CHANGED_FILES"

# 🚀 Decide strategy
if echo "$CHANGED_FILES" | grep -E "Dockerfile|requirements.txt|package.json|docker-compose.yml" > /dev/null; then
    echo "⚠️ Important files changed → rebuild required"

    docker compose down
    docker compose up -d --build

else
    echo "✅ Only code changed → fast restart"

    docker compose restart
fi

echo "Show running containers..."
docker compose ps

echo "Deployment finished successfully."