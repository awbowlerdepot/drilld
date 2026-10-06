#!/usr/bin/env bash
# Tests the migrations against a throwaway PostgreSQL in Docker:
#   1. applies every migration up, then down in reverse, then up again
#   2. runs db/tests/schema_test.sql (row-level security, constraints, triggers)
# The container is removed afterwards. Requires Docker, and node_modules
# (npm ci) for the statement splitter.
set -euo pipefail

cd "$(dirname "$0")"

IMAGE="${PG_IMAGE:-postgres:16}"
CONTAINER="drilld-schema-test-$$"

docker run -d --rm --name "$CONTAINER" -e POSTGRES_HOST_AUTH_METHOD=trust "$IMAGE" >/dev/null
trap 'docker stop "$CONTAINER" >/dev/null' EXIT

# Connect over TCP inside the container: the image's temporary init server only
# listens on the Unix socket, so a TCP connection means the real server is up.
until docker exec "$CONTAINER" pg_isready -h 127.0.0.1 -U postgres -q 2>/dev/null; do sleep 0.5; done

psql_as() {
    local user="$1"; shift
    docker exec -i "$CONTAINER" psql -h 127.0.0.1 -U "$user" -d "${PGDATABASE_NAME:-drilld}" \
        -v ON_ERROR_STOP=1 -q "$@"
}

# Migrations run as a non-superuser owner, like the RDS migration user.
# (Superusers bypass row-level security, which would hide policy bugs.)
PGDATABASE_NAME=postgres psql_as postgres <<'SQL'
create role drilld_owner login createrole;
create database drilld owner drilld_owner;
SQL

section() {  # section <up|down> <file>
    awk -v want="$1" '
        /^-- migrate:up/   { mode = "up";   next }
        /^-- migrate:down/ { mode = "down"; next }
        mode == want
    ' "$2"
}

migrations=(migrations/*.sql)

echo "== up"
for f in "${migrations[@]}"; do echo "   $f"; section up "$f" | psql_as drilld_owner; done

echo "== down"
for ((i = ${#migrations[@]} - 1; i >= 0; i--)); do
    f="${migrations[$i]}"; echo "   $f"; section down "$f" | psql_as drilld_owner
done

# Second pass: one statement per call, split exactly as the deploy-time
# migration runner does for the RDS Data API (amplify/database/sql.ts).
echo "== up again, one statement per call (as the RDS Data API runs them)"
statements_file="$(mktemp)"
trap 'rm -f "$statements_file"; docker stop "$CONTAINER" >/dev/null' EXIT
for f in "${migrations[@]}"; do
    (cd .. && npx --no-install tsx db/tests/split_migration.ts "db/$f" up) > "$statements_file"
    count=0
    while IFS= read -r -d '' statement || [ -n "$statement" ]; do
        printf '%s;\n' "$statement" | psql_as drilld_owner
        count=$((count + 1))
    done < "$statements_file"
    echo "   $f: $count statements"
done

# Login users standing in for the API and the catalog sync job.
psql_as drilld_owner <<'SQL'
create role app_tester login in role drilld_app;
create role sync_tester login in role drilld_catalog_sync;
SQL

echo "== schema tests"
if ! output=$(psql_as drilld_owner < tests/schema_test.sql 2>&1); then
    echo "$output"
    exit 1
fi
echo "$output" | sed -n 's/^.*NOTICE:  /   /p'
echo "== all passed"
