# Meridian — Development Rules and Coding Standards

These rules are **mandatory** for all contributions. "MUST" and "MUST NOT" are strict. Where the current code does not yet fully meet a rule, that is noted under [Known gaps](#known-gaps); new code must still comply.

---

## 1. Frontend (React + TypeScript)

1. TypeScript `strict` mode MUST stay enabled; `any` and `@ts-ignore` are not allowed without a written justification.
2. Components are function components with typed props. Extract anything used twice into `src/components/`.
3. Data fetching belongs in `src/lib/api.ts` and context providers, not scattered across components. Do not call `fetch` directly from pages.
4. Naming: components and files `PascalCase.tsx`; hooks `useThing`; helpers and variables `camelCase`; types `PascalCase`; constants `UPPER_SNAKE_CASE`; CSS classes `kebab-case`.
5. Structure: `components/`, `context/`, `lib/`, `pages/` as in [README.md](README.md). New routes are registered in `App.tsx`.
6. Every data-driven view MUST handle loading, empty and error states.
7. Money display MUST use `money()`/`shortMoney()` from `lib/format.ts` (GBP, en-GB). Never hand-format currency.
8. The frontend MUST NOT hardcode balances or totals (demo data lives only in `lib/demo.ts`).
9. `npm run build` (which runs `tsc -b`) MUST pass before merging.

## 2. Backend (Java + Spring Boot)

1. Java 21, Spring Boot 3.x. Packages: `api`, `auth`, `config`, `domain`, `repo`, `service`.
2. Controllers stay thin: map HTTP, validate, delegate. **Business rules live in services**; repositories only query.
3. Use records for request/response DTOs; never return JPA entities from controllers.
4. Names: classes `PascalCase`, methods and fields `camelCase`, constants `UPPER_SNAKE_CASE`, one top-level class per file (DTO records may be grouped in `Dtos`).
5. Constructor injection only; no field injection.
6. Do not log passwords, tokens or full account numbers.
7. Prefer immutability and small methods; comment *why*, not *what*.

## 3. REST API conventions

- Base path `/api`; plural nouns, lowercase, kebab-case where multi-word (`/accounts`, `/transfers`).
- Verbs: `GET` reads (safe, no side effects), `POST` creates or performs an action. Add `PUT`/`PATCH`/`DELETE` only with a clear need.
- JSON in/out (CSV only for statements). Dates ISO-8601; IDs are UUIDs.
- Errors use `{ "error": "human-readable message" }` with correct status: `400` validation, `401` unauthenticated, `404` not found **or not owned**, `409` idempotency conflict.
- Monetary request fields are sent as decimal **strings** (`"25.50"`).
- Breaking changes require a new versioned path or a documented migration.

## 4. Validation and exception handling

1. Validate at the boundary with Bean Validation (`@Valid`, `@NotNull`, `@DecimalMin`, `@Digits`, `@Size`, `@Email`).
2. Re-check business invariants in the service (ownership, funds, limits, distinct accounts) — never rely on client checks alone.
3. Throw `ApiException(status, message)` for expected failures; handle centrally in `ApiErrorHandler`.
4. Error messages MUST NOT leak stack traces, SQL or whether an email/account exists beyond what the API contract states.
5. Login failures return one generic message for unknown email and wrong password.

## 5. Authentication, passwords and authorization

1. Passwords MUST be hashed with BCrypt (cost ≥ 12) via Spring's `PasswordEncoder`. Never store, log or return plaintext or hashes.
2. Registration passwords MUST be at least 10 characters.
3. Authentication uses signed JWTs; the secret MUST be at least 32 bytes, supplied via `JWT_SECRET`, and different in every non-local environment. Tokens expire (currently 2 hours).
4. Every endpoint except `/api/auth/**` and `/actuator/health` MUST require authentication.
5. **Account ownership MUST be verified server-side on every account-scoped operation** (`findByIdAndUserId` or an explicit `userId` comparison). Never trust an ID from the client. Return `404` for accounts the caller does not own.
6. The authenticated user ID comes from the security context, never from the request body or query string.
7. Do not widen CORS beyond explicit origins; never use `*` with credentials.

## 6. Database and transactions

1. The schema changes ONLY through new Flyway migrations (`V<n>__description.sql`). **Never edit an applied migration.** `ddl-auto` stays `validate`.
2. Migrations MUST be additive and backwards-safe for existing data; never drop or rewrite production-like data without an explicit, reviewed plan.
3. Preserve existing account IDs, transactions and balances across changes.
4. Keep integrity in the database as well as in code: foreign keys, `NOT NULL`, `CHECK (balance >= 0)`, `CHECK (amount > 0)`, unique constraints.
5. Any operation that changes more than one row of financial state MUST run in a single `@Transactional` method.
6. Seed/demo data is for development only and MUST NOT overwrite existing records. Disable with `SEED_DEMO=false` in shared environments.

## 7. Financial data rules

1. Money on the server MUST be `BigDecimal` with scale 2 and `NUMERIC(19,2)` in PostgreSQL. Construct from strings (`new BigDecimal("25.50")`), never from `double`.
2. **Never use floating-point arithmetic for monetary calculations.** In TypeScript, sum and compare money in whole pence (`sumMoney()`), not by adding raw floats. Format only at display time.
3. Compare `BigDecimal` with `compareTo`, not `equals`.
4. **Total balances are calculated dynamically** from the authenticated user's accounts (`GET /api/accounts`); never hardcode or cache totals as data.
5. The displayed total MUST equal the sum of the displayed account balances.
6. **Balances MUST NOT go negative.** Reject insufficient-funds transfers before mutating anything.
7. **Transfers MUST be atomic, ownership-checked and limited** (currently £0.01–£50,000, two decimals, distinct accounts, both accounts owned by the caller).
8. Locks MUST be taken in a consistent order (user row, then accounts by ascending ID) to avoid deadlocks.
9. **Transfers MUST be idempotent:** each request carries a client-generated `requestId` (UUID); `(user_id, request_id)` is unique; replays return the original result; a reused ID with different details is rejected with `409`.
10. Every balance change MUST write ledger rows with `balance_after`.
11. **No one modifies production financial data (balances, transactions, transfers) outside the application's audited flows without explicit written authorization**, a reviewed script and a backup.

## 8. Secrets and configuration

1. **Never commit credentials, secrets, tokens or `.env` files.** `.env` stays in `.gitignore`; only `.env.example` with placeholder/dev-only values is committed.
2. Configuration comes from environment variables with safe local defaults in `application.yml`. Defaults MUST NOT be used in production.
3. Separate configuration per environment (local, test, production); production requires its own database credentials, `JWT_SECRET` and `CORS_ORIGIN`, with `SEED_DEMO=false`.
4. If a secret is ever committed, rotate it immediately and treat it as compromised.
5. Never put secrets in frontend code or `VITE_*` variables — they are public.

## 9. Testing requirements

| Level | Requirement |
| --- | --- |
| Unit | Every service rule (transfer success, insufficient funds, same-account, ownership, idempotent replay, limits) has a JUnit test. Money assertions use `compareTo`. |
| Integration | Repository and migration behaviour against real PostgreSQL (Testcontainers preferred) for anything touching constraints or locking. |
| API | Controller/security tests for auth required, validation errors, `404` on foreign accounts, and `GET /api/accounts` returning only the caller's accounts. |
| Frontend | Test formatting and totals helpers (`sumMoney`, `money`); verify loading, empty and error states and post-transfer refresh. |

Bug fixes include a regression test. `mvn test` and `npm run build` MUST pass before merging. Never weaken or delete a test to make a build pass.

## 10. Accessibility and responsive design

1. Meet WCAG 2.2 AA: text contrast ≥ 4.5:1, UI components ≥ 3:1, no information by colour alone.
2. Use semantic HTML; every input has a visible or programmatic label; icon-only controls have `aria-label`.
3. Everything is keyboard operable with a visible focus indicator; do not remove outlines without a replacement.
4. Errors use `role="alert"`; status changes should be announced.
5. Respect `prefers-reduced-motion`.
6. Layouts MUST work from 320px to desktop with no horizontal scroll, at the existing breakpoints (1100px, 800px, 600px), and keep the navy-and-blue design language.
7. Maintain original Meridian branding. Do not add Barclays or other third-party logos, trademarks, screenshots or copy to the repository or build output.

## 11. Git and code review

1. Branch from `main`: `feature/…`, `fix/…`, `docs/…`, `chore/…`.
2. Commits follow Conventional Commits: `type(scope): imperative summary` — e.g. `feat(dashboard): show total balance from accounts API`. Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `ci`.
3. Keep commits small and focused; no secrets, build output (`dist/`, `target/`, `node_modules/`) or `.env` files.
4. Every change goes through a pull request with a clear description, test evidence and screenshots for UI changes.
5. Reviewers check: correctness, ownership/authorization, money handling, migration safety, tests, accessibility, and documentation updates. At least one approval is required.
6. **Documentation MUST be updated in the same PR** when behaviour, setup, API, schema or architecture changes: `README.md`, `Design.md`, `RULE.md` as relevant.

## Known gaps

Honest status against these rules (to be closed, not hidden):

- Test coverage is below Section 9 (only transfer-success and insufficient-funds unit tests plus a demo-mode script; no Testcontainers, API-security or frontend component tests).
- JWT is kept in `sessionStorage`; no rate limiting, MFA or audit log.
- `Design.md` accessibility targets (full contrast audit, live regions) are not yet verified.
- No CI pipeline enforces `mvn test` / `npm run build`.
