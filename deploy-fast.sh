#!/usr/bin/env bash

set -euo pipefail

COMPOSE="docker compose -f docker-compose.production.yml"

echo "📥 جلب أحدث كود من المنصة..."
git pull origin staging

echo "🏗️ بناء وتحديث الباك اند فقط بدون المساس بقاعدة البيانات..."
$COMPOSE build backend
$COMPOSE up -d backend

echo "✅ تم تحديث الباك اند بنجاح!"
