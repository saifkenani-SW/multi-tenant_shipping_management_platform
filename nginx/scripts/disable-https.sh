#!/usr/bin/env sh

set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"

cp \
    "$ROOT_DIR/conf.d/available/multi-tenancy.http.conf" \
    "$ROOT_DIR/conf.d/enabled/multi-tenancy.conf"

cd "$ROOT_DIR"

docker compose exec nginx nginx -t

docker compose exec nginx nginx -s reload

echo "HTTP configuration enabled."