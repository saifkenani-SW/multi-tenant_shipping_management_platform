#!/usr/bin/env sh

set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"

cd "$ROOT_DIR"

docker compose run --rm certbot renew --quiet

docker compose exec nginx nginx -t

docker compose exec nginx nginx -s reload

echo "Certificates renewed."