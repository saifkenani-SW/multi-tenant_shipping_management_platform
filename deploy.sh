#!/usr/bin/env bash

# نشر إلى الإنتاج.
#
# هذا السكربت لا يمسح قاعدة البيانات ولا يشغّل السييدر. كان يفعل الاثنين،
# وهذا يعني أن أي تشغيل عادي كان يمحو بيانات الإنتاج بالكامل. لتهيئة قاعدة
# بيانات تطوير من الصفر استخدم `npm run db:reset` داخل بيئة التطوير.

set -euo pipefail

COMPOSE_FILE="docker-compose.production.yml"
COMPOSE="docker compose -f $COMPOSE_FILE"
BACKUP_DIR="${BACKUP_DIR:-$HOME/backups}"

echo "🚀 بدء النشر..."

# ---------------------------------------------------------------------------
# 1. نسخة احتياطية قبل أي شيء
#
# المايجريشن قد تحذف أعمدة. النسخة تؤخذ أولاً ويُتحقق من سلامتها، وإن فشلت
# يتوقف النشر — النشر بلا طريق رجوع أسوأ من تأجيله.
# ---------------------------------------------------------------------------
echo "💾 أخذ نسخة احتياطية..."
mkdir -p "$BACKUP_DIR"

# shellcheck disable=SC1091
set -a; [ -f ./backend/.env.production ] && . ./backend/.env.production; set +a
set -a; [ -f ./.env ] && . ./.env; set +a

BACKUP_FILE="$BACKUP_DIR/pre-deploy-$(date +%F-%H%M%S).sql.gz"
$COMPOSE exec -T postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$BACKUP_FILE"

if ! gzip -t "$BACKUP_FILE" 2>/dev/null || [ ! -s "$BACKUP_FILE" ]; then
  echo "❌ النسخة الاحتياطية فاسدة أو فارغة. أُلغي النشر."
  rm -f "$BACKUP_FILE"
  exit 1
fi
echo "   ✔ $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"

# ---------------------------------------------------------------------------
# 2. جلب الكود
# ---------------------------------------------------------------------------
echo "📥 جلب أحدث كود من staging..."
git pull origin staging
git log --oneline -1

# ---------------------------------------------------------------------------
# 3. بناء الصورة وتشغيلها
# ---------------------------------------------------------------------------
echo "🏗️ بناء الحاوية..."
$COMPOSE build --no-cache backend
$COMPOSE up -d backend

echo "⏳ انتظار جاهزية الحاوية..."
for i in $(seq 1 30); do
  if $COMPOSE ps backend | grep -q "healthy"; then
    echo "   ✔ الحاوية جاهزة"
    break
  fi
  [ "$i" -eq 30 ] && { echo "❌ الحاوية لم تصبح جاهزة خلال 60 ثانية."; exit 1; }
  sleep 2
done

# ---------------------------------------------------------------------------
# 4. تطبيق المايجريشنز المعلّقة
#
# `migrate deploy` تطبّق ما لم يُطبَّق بعد ولا تمسح شيئاً. لا تستبدلها بـ
# `migrate reset` — تلك تحذف قاعدة البيانات وتعيد بناءها من السييدر.
# ---------------------------------------------------------------------------
echo "🔄 تطبيق المايجريشنز..."
$COMPOSE exec -T backend npx prisma migrate deploy

# ---------------------------------------------------------------------------
# 5. التحقق
# ---------------------------------------------------------------------------
echo "🔍 التحقق..."
$COMPOSE ps
$COMPOSE exec -T backend npx prisma migrate status | tail -3

echo ""
echo "✅ اكتمل النشر."
echo "   النسخة الاحتياطية: $BACKUP_FILE"
echo "   للتراجع: zcat \"$BACKUP_FILE\" | $COMPOSE exec -T postgres psql -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\""
