# Jenkins CI for Meridian

This guide covers installing Jenkins on macOS with Homebrew, connecting it to GitHub, and understanding the pipeline defined in [`Jenkinsfile`](../Jenkinsfile). The pipeline **tests and builds only**. It never deploys anything and needs no Docker.

- Repository: <https://github.com/domwokorach/Meridian-Digital-Banking>
- Related: [README.md](../README.md) · [Design.md](../Design.md#16-continuous-integration-jenkins) · [RULE.md](../RULE.md#12-continuous-integration-and-testing)

> **What has and has not been verified.** Every command the Jenkinsfile runs was executed end to end on macOS using [`scripts/ci/run-local.sh`](../scripts/ci/run-local.sh), which runs the same stage commands in the same order (all green, plus deliberate-failure checks, see [Verification status](#verification-status)). The Jenkinsfile itself, the Jenkins UI configuration, the GitHub webhook and GitHub commit statuses have **not** been run inside a live Jenkins server. Expect to fix small, environment-specific details on first use, and use the [troubleshooting](#troubleshooting) table.

---

## 1. Prerequisites

```bash
brew install openjdk@21 maven node postgresql@15 jenkins-lts
brew services start postgresql@15      # or however you already run Homebrew PostgreSQL
pg_isready -h localhost -p 5432        # accepting connections
```

Jenkins runs as your macOS user, so it finds Homebrew tools through the `PATH` set in the Jenkinsfile (`/opt/homebrew/bin`, the Java 21 `bin`, and the PostgreSQL `bin` directory). The paths are pipeline parameters (`JAVA_HOME_21`, `PG_BIN`), so change them if your Homebrew prefix or PostgreSQL version differs (Intel Macs use `/usr/local`).

## 2. Create the isolated test database (one time)

CI uses its own database, **`meridian_test`**, with its own least-privilege role. It never touches the development `meridian` database.

```bash
# Choose a password. It is not stored in the repository.
TEST_DB_PASSWORD='choose-a-strong-password' scripts/ci/create-test-db.sh
```

The script is **create-only and idempotent**:

- creates role `meridian_test` as `LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION`;
- creates database `meridian_test` owned by that role (needed so Flyway can create tables) and revokes access from `PUBLIC`;
- refuses names that do not end in `_test` and refuses `meridian`;
- if the role or database already exists it leaves it unchanged. It never runs `DROP` or `ALTER`.

Check it:

```bash
PGPASSWORD='choose-a-strong-password' psql -h localhost -U meridian_test -d meridian_test -c 'select current_user, current_database()'
```

Flyway builds the schema inside `meridian_test` the first time the integration tests run. Demo seeding is disabled in the `test` profile.

## 3. Start Jenkins

Jenkins defaults to port **8080**, the same port as the Spring Boot API. The CI tests do **not** start a server (they use MockMvc), so there is no clash during a build, but you cannot run the dev API and Jenkins on 8080 at once. Run Jenkins on 8081:

```bash
jenkins-lts --httpPort=8081
```

(`brew services start jenkins-lts` also works, but then Jenkins is on 8080, so stop the dev API first.)

Open <http://localhost:8081>, unlock with the password at `~/.jenkins/secrets/initialAdminPassword`, choose **Install suggested plugins**, and create an admin user.

### Required plugins

Most are installed by "suggested plugins". Check **Manage Jenkins → Plugins**:

| Plugin | Why |
| --- | --- |
| Pipeline (incl. Declarative, Multibranch) | Runs the Jenkinsfile |
| Git | Checkout |
| GitHub and GitHub Branch Source | Webhooks, pull-request discovery, commit status reporting |
| Credentials Binding | Injects the test-database credentials with log masking |
| JUnit | Publishes test results |
| Timestamper | Timestamps in the console |
| Coverage (optional) | Coverage trend from JaCoCo and Cobertura. If it is missing the pipeline logs a notice and still archives the HTML reports |

## 4. Add credentials

**Manage Jenkins → Credentials → System → Global → Add Credentials**

| ID | Kind | Value |
| --- | --- | --- |
| `meridian-test-db` | Username with password | Username `meridian_test`, the password you chose in step 2 |
| `github-meridian` (any ID) | Username with password (GitHub username + [personal access token](https://github.com/settings/tokens)) or GitHub App | Needed to scan the repo and post commit statuses. Fine-grained token: Contents *read*, Metadata *read*, Commit statuses *read/write*, Pull requests *read* |

The ID `meridian-test-db` is referenced by the Jenkinsfile. Jenkins masks its values (`****`) in console output, and the Jenkinsfile only uses them from single-quoted shell strings so Groovy never interpolates them.

**No JWT secret is stored in Jenkins.** The tests generate a random signing key for every run, and nothing connects to a real deployment.

## 5. Create the pipeline job

Recommended: **Multibranch Pipeline**, which gives you `master` builds, pull-request validation and commit statuses.

1. **New Item → Multibranch Pipeline**, name `Meridian-Digital-Banking`.
2. **Branch Sources → Add source → GitHub**: pick the `github-meridian` credentials, repository URL `https://github.com/domwokorach/Meridian-Digital-Banking`.
3. **Behaviours** (this also avoids duplicate builds):
   - *Discover branches*: **Exclude branches that are also filed as PRs** (a PR branch is built once, as the PR).
   - *Discover pull requests from origin*: **Merging the pull request with the current target branch revision** (tests what will actually land).
   - *Filter by name (with regular expression)*: `master|PR-.*` (only `master` and pull requests are built).
4. **Build Configuration**: by Jenkinsfile, path `Jenkinsfile`.
5. **Scan Multibranch Pipeline Triggers**: tick *Periodically if not otherwise run* and choose 5 minutes (the fallback when webhooks cannot reach Jenkins, see below).
6. Save. Jenkins scans, finds `master` and open PRs, and builds them.

A classic *Pipeline* job ("Pipeline script from SCM", repo URL, branch `*/master`, script path `Jenkinsfile`) also works. It uses the `githubPush()` trigger declared in the Jenkinsfile, but gives no PR validation.

### GitHub webhook (push and pull-request triggers)

Repository → **Settings → Webhooks → Add webhook**

- Payload URL: `https://<public-address-of-jenkins>/github-webhook/`
- Content type `application/json`, events: *Pushes* and *Pull requests*.

A Jenkins on `localhost` is not reachable from GitHub. Either expose it through a tunnel (for example `smee.io`, `ngrok` or `cloudflared`, forwarding to `localhost:8081`) or rely on the periodic scan from step 5 (builds start within a few minutes of a push).

**Commit status reporting:** with GitHub Branch Source and the credentials above, Jenkins posts pending/success/failure statuses on commits and pull requests automatically. To require green builds, add the Jenkins check as a **required status check** in the branch protection rules for `master`.

### Running a build manually

- Multibranch job → branch → **Build with Parameters** → **Build**. The first build of a new Jenkinsfile uses the default parameters.
- Or run the same steps locally without Jenkins:

```bash
source ~/.meridian/test-db.env     # exports TEST_DB_USER and TEST_DB_PASSWORD (or export them yourself)
scripts/ci/run-local.sh
```

### Pipeline parameters

| Parameter | Default | Meaning |
| --- | --- | --- |
| `JAVA_HOME_21` | `/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home` | JDK 21 location |
| `PG_BIN` | `/opt/homebrew/opt/postgresql@15/bin` | Directory with `psql`, `pg_isready` |
| `TEST_DB_HOST` / `TEST_DB_PORT` | `localhost` / `5432` | PostgreSQL location |
| `TEST_DB_NAME` | `meridian_test` | Must end in `_test`; anything else aborts the build |
| `RUN_INTEGRATION_TESTS` | `true` | Skip only for a quick check |
| `CLEAN_WORKSPACE` | `false` | Delete the workspace afterwards |

---

## 6. Pipeline stages

Global limits: 30-minute timeout, timestamps, last 20 builds kept, and a newer build of the same branch or PR **aborts** the older one (`disableConcurrentBuilds(abortPrevious: true)`). Each stage has its own shorter timeout. Any failing stage fails the build.

| # | Stage | What it runs | Output |
| --- | --- | --- | --- |
| 1 | Checkout Source | `checkout scm`, prints the commit being built | none |
| 2 | Environment Validation | `scripts/ci/validate-environment.sh`: Java 21, Maven, Node ≥ 20, npm, `psql`, `pg_isready`, the `_test` name rule, and a real login to `meridian_test` | none |
| 3 | Install Dependencies (parallel) | `mvn clean dependency:resolve dependency:resolve-plugins`; `npm ci` (falls back to `npm install` only if there is no lockfile) | none |
| 4 | Backend Unit Tests | `mvn test` (JUnit 5 + Mockito; no database) | JUnit: `backend/target/surefire-reports` |
| 5 | Backend Integration Tests | `mvn verify -Dskip.unit.tests=true`: `*IT` classes (Spring Boot Test + MockMvc) on `meridian_test`, then the JaCoCo report and 80% gate | JUnit: `failsafe-reports`; HTML coverage |
| 6 | Frontend Tests | `npm run test:demo` (existing `node:test` suite) then `npm run test:coverage` (Vitest + React Testing Library + coverage thresholds) | `frontend/reports/junit.xml`, `frontend/coverage` |
| 7 | TypeScript Validation | `npm run typecheck` (`tsc -b`, strict mode, includes the tests) | none |
| 8 | Frontend Build | `npm run build` | `frontend/dist` |
| 9 | Backend Build | `mvn clean package` (tests were already run, so they are skipped here), then checks the JAR exists and is an executable Spring Boot jar | `backend/target/banking-api-1.0.0.jar` |
| 10 | Publish Reports | Coverage plugin (if installed) and `archiveArtifacts` | build artifacts |

**Reports survive failures.** JUnit publishing and report copying happen in each stage's `post { always { … } }`, and reports are copied to `ci-reports/` before stage 9's `mvn clean` deletes `backend/target`.

### Test suites

| Suite | Count (last run) | Runs against |
| --- | --- | --- |
| Backend unit (`*Test`) | 45 | Mocks only |
| Backend integration (`*IT`) | 39 | PostgreSQL `meridian_test` |
| Frontend Vitest | 94 | jsdom, mocked API |
| Frontend `test:demo` | 5 | Browser-demo data layer |

Backend areas covered: registration, login and password checks, JWT creation/expiry/tampering, the JWT filter, account ownership (another customer's accounts, transactions, statements and transfers return `404`, anonymous requests are refused), balance retrieval, exact `BigDecimal` totals, transaction history, transfers, insufficient funds, idempotency keys (replay, conflict, **concurrent duplicates move money once**), concurrent over-draw protection, rollback after a mid-transfer failure, database constraints (non-negative balance, positive amounts, distinct accounts, unique request IDs and emails, foreign keys), CSV statements (formula-injection protection, date validation), and validation and error responses.

Frontend areas covered: homepage, login and registration forms, dashboard loading, error (with retry), empty and success states, account cards, dynamic totals, transaction history search and filter, transfer validation and success/failure paths, responsive navigation (mobile menu), API client behaviour, and automated accessibility checks (axe-core).

Fixture data is fictional and lives only in `frontend/tests/fixtures.ts` and the test classes. The dashboard test confirms **£1,065.45 + £5,557.24 = £6,622.69** from those fixtures, and a second test proves the total changes with the data, so it is not hardcoded.

### Database isolation

- Separate database and role (`meridian_test` / `meridian_test`), credentials only in Jenkins.
- The integration base class refuses to start Spring if `TEST_DB_URL` does not end in `_test`, and the validation script refuses the same at pipeline level. Pointing the tests at `meridian` was tested and is refused.
- Most integration tests are `@Transactional` and roll back, so the database is left untouched.
- `TransferAtomicityIT` needs real commits (to observe rollback and concurrency). It records the IDs of rows it creates and deletes only those, in foreign-key order, afterwards.
- No pipeline step drops, truncates or alters a database. Verified: after full runs, the development database was unchanged and `meridian_test` was left empty.

### Coverage and the 80% target

| Area | What is enforced | Last measured |
| --- | --- | --- |
| Java (JaCoCo) | **Build fails** below 80% line coverage for any class in `com.meridian.banking.service` and `com.meridian.banking.auth` | `BankingService` 100%, `JwtService` 100%, `JwtFilter` 100%. Also `AuthController` 100%, `SecurityConfig` 100%, `DemoSeeder` 14% (seeding is deliberately off in tests) |
| TypeScript (Vitest, v8) | **Build fails** below 80% for `lib/format.ts`, `lib/api.ts`, `context/AuthContext.tsx`, `context/BankContext.tsx` | Lines 100% for all four; `format.ts` 100% across the board |
| Frontend overall (not gated) | Reported only | 71.7% lines, 66.9% statements, 68.8% branches |

These are the real numbers from the last run, not targets. Overall frontend coverage is below 80% because `lib/demo.ts` (the browser-only demo backend) is exercised by the separate `node:test` suite, which does not feed Vitest's coverage, and some pages (Statements, Settings, Landing details) have light coverage. Raising it is on the roadmap.

### Where to find results in Jenkins

- **Test Result** on the build page: all JUnit results (unit, integration, frontend), including failed tests with stack traces.
- **Coverage Report** (Coverage plugin): JaCoCo and Cobertura trends.
- **Build Artifacts**: `ci-reports/backend/jacoco/index.html`, `ci-reports/frontend/coverage/index.html`, JUnit XML copies, the backend JAR and `frontend/dist`. Open the `index.html` files from the downloaded artifacts.
- **Console Output** for the first failing stage.

---

## 7. Security and reliability

- No secrets, tokens or database passwords are committed. `.env` files are ignored; `scripts/ci/` takes the password from the environment.
- Credentials come from Jenkins Credentials, are masked in logs, and are exported only inside the shell steps that need them.
- The CI database role is least-privilege (no superuser, no create-database, no create-role) and is owner of only `meridian_test`.
- Demo seeding is off in CI (`app.seed-demo: false` in the test profile).
- Timeouts on the pipeline and every stage; stale builds of the same branch are aborted.
- The pipeline deploys nothing and publishes nothing outside Jenkins.
- CI work does not change application behaviour: it adds tests, Maven plugin configuration (Surefire, Failsafe, JaCoCo) and the Vitest toolchain.

## 8. Troubleshooting

| Symptom | Likely cause and fix |
| --- | --- |
| Stage 2: `Java 21 is required` | Jenkins found another JDK. Set `JAVA_HOME_21`; confirm `/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home/bin/java -version`. |
| Stage 2: `psql not found` / `pg_isready not found` | `PG_BIN` is wrong for your PostgreSQL version (`brew --prefix postgresql@15`). |
| Stage 2: `not accepting connections` | `brew services start postgresql@15`. |
| Stage 2: `Cannot log in to meridian_test` | Run `scripts/ci/create-test-db.sh`, and make sure the `meridian-test-db` credential has the same password. |
| `Credentials 'meridian-test-db' not found` | Create the credential with exactly that ID, in a scope the job can see (Global). |
| `Refusing to run integration tests: TEST_DB_URL…` | `TEST_DB_NAME` does not end in `_test`. This guard is intentional. |
| `TEST_DB_PASSWORD is not set` in the tests | The stage did not export it; if you changed the Jenkinsfile, keep the `export TEST_DB_USER=… TEST_DB_PASSWORD=…` lines. |
| Flyway validation failed | Someone edited an applied migration. Add a new migration instead. For a disposable test database only, drop and recreate `meridian_test` by hand, then re-run `create-test-db.sh`. Never automate a drop. |
| `npm ci` fails: lockfile out of sync | `package.json` and `package-lock.json` disagree. Run `npm install` locally and commit the updated lockfile. |
| Vitest: coverage threshold not met | A critical file dropped below 80%. Add tests rather than lowering `vite.config.ts` thresholds. |
| JaCoCo: `Rule violated for class …` | Same, for `service`/`auth` classes (`mvn verify` prints the class and ratio). |
| `localStorage.clear is not a function` in a new frontend test | Node 25 ships an experimental global `localStorage`. `tests/setup.ts` replaces it with an in-memory store; keep that setup. |
| Jenkins cannot bind port 8080 | The dev API or another service uses it. Start Jenkins with `--httpPort=8081`. |
| `Required context class hudson.FilePath is missing` | A step ran outside a `node`/agent context; keep steps inside `stages`. |
| `No such DSL method 'recordCoverage'` | Coverage plugin not installed. Harmless (caught); install it for the trend graph. |
| PR builds do not start | Webhook cannot reach Jenkins (use a tunnel) or wait for the periodic scan; confirm the PR behaviour is enabled in the job. |
| No GitHub commit status | The GitHub credentials lack *Commit statuses: write*, or the job source is not GitHub Branch Source. |
| Two builds for one change | The branch behaviour is not set to *Exclude branches that are also filed as PRs*. |
| Build hangs and times out | A stage hit its timeout. Check for a stuck process or a database lock; the PostgreSQL log (`brew services info postgresql@15`) helps. |

To reproduce any failure without Jenkins, run `scripts/ci/run-local.sh` with the same credentials. It uses identical commands.

## Verification status

What was actually run and observed:

- `scripts/ci/run-local.sh` end to end: **exit 0** with 45 + 39 backend tests, 94 + 5 frontend tests, `tsc -b`, `vite build`, and the executable JAR (about 61 MB) verified.
- Failure paths: a deliberately broken frontend test and a deliberately broken backend test each produced a non-zero exit **and** still wrote JUnit XML; integration tests pointed at the `meridian` database were refused.
- Database safety: after the runs, the development database still held its original 4 accounts, and `meridian_test` held no leftover rows.
- Dependency audit: `npm audit` reports 0 vulnerabilities after upgrading Vitest to 4.1.

Not verified here: execution inside a Jenkins server, plugin behaviour, the GitHub webhook and commit-status reporting, and Jenkins credential masking.
