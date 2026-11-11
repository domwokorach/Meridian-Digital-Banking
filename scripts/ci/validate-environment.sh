#!/usr/bin/env bash
# Verifies the build machine has the tools CI needs. Read-only: changes nothing.
# Reads (all optional): TEST_DB_HOST, TEST_DB_PORT, TEST_DB_NAME, TEST_DB_USER, TEST_DB_PASSWORD
set -uo pipefail
fail=0
need() { echo "ERROR: $1" >&2; fail=1; }

echo "== Java ==";   java -version 2>&1 | head -1
java -version 2>&1 | head -1 | grep -q '"21\.' || need "Java 21 is required (set JAVA_HOME_21 / install: brew install openjdk@21)"
echo "== Maven ==";  mvn -v 2>&1 | head -1 || need "Maven not found (brew install maven)"
echo "== Node ==";   node -v || need "Node.js not found (brew install node)"
node -e 'process.exit(+process.versions.node.split(".")[0] >= 20 ? 0 : 1)' || need "Node.js 20 or newer is required"
echo "== npm ==";    npm -v || need "npm not found"

HOST="${TEST_DB_HOST:-localhost}"; PORT="${TEST_DB_PORT:-5432}"; DB="${TEST_DB_NAME:-meridian_test}"
echo "== PostgreSQL =="
psql --version || need "psql not found (brew install postgresql@15 and add its bin directory to PATH)"
pg_isready -h "$HOST" -p "$PORT" || need "PostgreSQL is not accepting connections on $HOST:$PORT (brew services start postgresql@15)"

# Safety: CI may only ever use a database whose name ends in _test.
case "$DB" in *_test) ;; *) need "Refusing to continue: test database '$DB' must end with _test"; ;; esac

if [[ -n "${TEST_DB_USER:-}" && -n "${TEST_DB_PASSWORD:-}" ]]; then
  # PGPASSWORD is passed via the environment only, so it never appears in a command line or in the log.
  PGPASSWORD="$TEST_DB_PASSWORD" psql -h "$HOST" -p "$PORT" -U "$TEST_DB_USER" -d "$DB" -w -tAc "select 'connected to ' || current_database() || ' as ' || current_user" \
    || need "Cannot log in to $DB as the CI test user. Create it once with scripts/ci/create-test-db.sh and store the credentials in Jenkins (see docs/JENKINS.md)."
else
  need "TEST_DB_USER / TEST_DB_PASSWORD are not set (Jenkins credentials 'meridian-test-db')"
fi
exit $fail
