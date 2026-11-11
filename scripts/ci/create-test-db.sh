#!/usr/bin/env bash
# One-time, idempotent setup of the isolated CI test database on Homebrew PostgreSQL.
# CREATE-ONLY: it never drops or alters any existing role or database.
#
# Usage:  TEST_DB_PASSWORD='choose-a-password' scripts/ci/create-test-db.sh
# Optional: PGHOST (localhost) PGPORT (5432) PG_ADMIN_USER (current user) TEST_DB_NAME (meridian_test) TEST_DB_USER (meridian_test)
set -euo pipefail

: "${TEST_DB_PASSWORD:?Set TEST_DB_PASSWORD (it is not stored in the repository)}"
HOST="${PGHOST:-localhost}"; PORT="${PGPORT:-5432}"
ADMIN="${PG_ADMIN_USER:-$(whoami)}"
DB="${TEST_DB_NAME:-meridian_test}"; ROLE="${TEST_DB_USER:-meridian_test}"

case "$DB" in *_test) ;; *) echo "Refusing: test database name must end with _test (got '$DB')" >&2; exit 1;; esac
[[ "$DB" == "meridian" ]] && { echo "Refusing to touch the development database" >&2; exit 1; }

psql_admin() { psql -h "$HOST" -p "$PORT" -U "$ADMIN" -d postgres -v ON_ERROR_STOP=1 -qtA "$@"; }

if [[ -z "$(psql_admin -c "SELECT 1 FROM pg_roles WHERE rolname = '$ROLE'")" ]]; then
  psql_admin -v role="$ROLE" -v pw="$TEST_DB_PASSWORD" <<'SQL'
CREATE ROLE :"role" LOGIN PASSWORD :'pw' NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION;
SQL
  echo "Created role $ROLE"
else
  echo "Role $ROLE already exists (left unchanged)"
fi

if [[ -z "$(psql_admin -c "SELECT 1 FROM pg_database WHERE datname = '$DB'")" ]]; then
  psql_admin -v db="$DB" -v role="$ROLE" <<'SQL'
CREATE DATABASE :"db" OWNER :"role";
SQL
  psql_admin -c "REVOKE ALL ON DATABASE \"$DB\" FROM PUBLIC"
  echo "Created database $DB"
else
  echo "Database $DB already exists (left unchanged)"
fi
