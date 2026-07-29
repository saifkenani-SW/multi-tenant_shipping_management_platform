#!/usr/bin/env bash

# الخروج فوراً وتوقف السكربت عند حدوث أي خطأ
set -e

echo "🚀 Starting Deployment Process..."

# 1. جلب أحدث كود من Git مع خيار rebase لتفادي تعارض الفروع
echo "📥 Pulling latest code from Git..."
git pull --rebase origin staging

# 2. إعادة بناء الصورة بدون كاش وتغليف الحاوية في الخلفية
echo "🏗️ Rebuilding Docker containers (No Cache)..."
docker compose -f docker-compose.production.yml build --no-cache backend
docker compose -f docker-compose.production.yml up -d backend

# 3. الانتظار كافياً حتى تصبح الحاوية جاهزة تماماً لتلقي الأوامر
echo "⏳ Waiting for backend container to be fully ready..."
sleep 10

# 4. عمل Reset لقاعدة البيانات وتطبيق المايجريشن
echo "🔄 Resetting Database and applying Migrations..."
docker compose -f docker-compose.production.yml exec -T backend npx prisma migrate reset --force

# 5. تشغيل سكربت السييد المترجم بـ Node.js
echo "🌱 Running Database Seeders..."
docker compose -f docker-compose.production.yml exec -T backend node dist/src/infrastructure/database/seeders/seed.js

echo "✅ Deployment completed successfully!"