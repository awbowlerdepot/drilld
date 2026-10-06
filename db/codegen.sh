#!/usr/bin/env bash
# Generates amplify/api/db/schema.ts (Kysely table types) from db/migrations:
# applies the migrations to a throwaway Postgres in Docker and introspects it.
# Run after adding a migration, and commit the result. Requires Docker and
# node_modules.
set -euo pipefail

cd "$(dirname "$0")/.."

IMAGE="${PG_IMAGE:-postgres:16}"
CONTAINER="drilld-codegen-$$"
OUT="amplify/api/db/schema.ts"

docker run -d --rm --name "$CONTAINER" -e POSTGRES_HOST_AUTH_METHOD=trust -p 127.0.0.1::5432 "$IMAGE" >/dev/null
trap 'docker stop "$CONTAINER" >/dev/null' EXIT
until docker exec "$CONTAINER" pg_isready -h 127.0.0.1 -U postgres -q 2>/dev/null; do sleep 0.5; done
PORT="$(docker port "$CONTAINER" 5432/tcp | head -1 | sed 's/.*://')"

psql_owner() { docker exec -i "$CONTAINER" psql -h 127.0.0.1 -U drilld_owner -d drilld -v ON_ERROR_STOP=1 -q; }
docker exec -i "$CONTAINER" psql -h 127.0.0.1 -U postgres -d postgres -v ON_ERROR_STOP=1 -q <<'SQL'
create role drilld_owner login createrole;
create database drilld owner drilld_owner;
SQL

for f in db/migrations/*.sql; do
    awk '/^-- migrate:up/{m=1;next} /^-- migrate:down/{m=0} m' "$f" | psql_owner
done

mkdir -p "$(dirname "$OUT")"
npx --no-install kysely-codegen \
    --dialect postgres \
    --url "postgres://drilld_owner@127.0.0.1:${PORT}/drilld" \
    --exclude-pattern "schema_migrations" \
    --out-file "$OUT"
echo "Wrote $OUT"
