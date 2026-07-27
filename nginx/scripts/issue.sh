#!/usr/bin/env sh

set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"

cd "$ROOT_DIR"

DOMAIN="saifkenani.me"
EMAIL="saifaldin.kenani@gmail.com"

docker compose run --rm certbot certonly \
    --webroot \
    --preferred-challenges http \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN" \
    -d "www.$DOMAIN" \
    -d "api.$DOMAIN"

./scripts/enable-https.sh

echo "Certificate issued successfully."