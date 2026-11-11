#!/usr/bin/env bash
# Runs the same commands as the Jenkinsfile stages, in the same order, on your own machine.
# Useful to reproduce a failing Jenkins build without Jenkins.
#
#   source ~/.meridian/test-db.env        # or export TEST_DB_USER / TEST_DB_PASSWORD yourself
#   scripts/ci/run-local.sh
#
# Optional: JAVA_HOME_21, PG_BIN, TEST_DB_HOST, TEST_DB_PORT, TEST_DB_NAME, SKIP_INTEGRATION=true
set -euo pipefail
cd "$(dirname "$0")/../.."
ROOT="$PWD"

export JAVA_HOME="${JAVA_HOME_21:-/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home}"
export PATH="$JAVA_HOME/bin:/opt/homebrew/bin:${PG_BIN:-/opt/homebrew/opt/postgresql@15/bin}:$PATH"
export CI=true
export TEST_DB_HOST="${TEST_DB_HOST:-localhost}" TEST_DB_PORT="${TEST_DB_PORT:-5432}" TEST_DB_NAME="${TEST_DB_NAME:-meridian_test}"
export TEST_DB_URL="jdbc:postgresql://$TEST_DB_HOST:$TEST_DB_PORT/$TEST_DB_NAME"
: "${TEST_DB_USER:?export TEST_DB_USER}" "${TEST_DB_PASSWORD:?export TEST_DB_PASSWORD}"

stage() { printf '\n\033[1;34m=== %s ===\033[0m\n' "$1"; }

rm -rf ci-reports
stage "Environment Validation";        scripts/ci/validate-environment.sh
stage "Install Dependencies";           (cd backend && mvn -B -ntp clean dependency:resolve dependency:resolve-plugins)
                                        (cd frontend && rm -rf coverage reports && npm ci --no-audit --no-fund)
stage "Backend Unit Tests";             (cd backend && mvn -B -ntp test)
mkdir -p ci-reports/backend && cp -R backend/target/surefire-reports ci-reports/backend/surefire-reports
if [[ "${SKIP_INTEGRATION:-false}" != "true" ]]; then
  stage "Backend Integration Tests";    (cd backend && mvn -B -ntp verify -Dskip.unit.tests=true)
fi
mkdir -p ci-reports/frontend
[[ -d backend/target/failsafe-reports ]] && cp -R backend/target/failsafe-reports ci-reports/backend/failsafe-reports || true
[[ -d backend/target/site/jacoco ]] && cp -R backend/target/site/jacoco ci-reports/backend/jacoco || true
stage "Frontend Tests";                 (cd frontend && npm run test:demo && npm run test:coverage)
[[ -d frontend/coverage ]] && cp -R frontend/coverage ci-reports/frontend/coverage || true
stage "TypeScript Validation";          (cd frontend && npm run typecheck)
stage "Frontend Build";                 (cd frontend && npm run build)
stage "Backend Build"
(cd backend && mvn -B -ntp clean package -Dskip.unit.tests=true -Dskip.integration.tests=true -Dskip.coverage.check=true)
JAR=backend/target/banking-api-1.0.0.jar
test -s "$JAR" || { echo "Missing $JAR" >&2; exit 1; }
LISTING=$(unzip -l "$JAR")
grep -q 'BOOT-INF/classes/com/meridian/banking/BankingApplication.class' <<<"$LISTING" || { echo "$JAR is not an executable Spring Boot jar" >&2; exit 1; }
ls -l "$JAR"
stage "Publish Reports"; echo "Reports copied to $ROOT/ci-reports (JUnit XML: backend/target/{surefire,failsafe}-reports, frontend/reports/junit.xml)"
printf '\n\033[1;32mCI run succeeded. Nothing was deployed.\033[0m\n'
