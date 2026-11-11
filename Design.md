# Meridian — Design and Architecture

This document describes the visual design and technical architecture of Meridian as **currently implemented**. Items marked *(planned)* are not built. See [README.md](README.md) for setup and [RULE.md](RULE.md) for standards.

---

## 1. Product design principles

1. **Clarity before decoration.** The most important number — the total balance — is the largest element on the dashboard.
2. **Calm confidence.** Deep navy surfaces, generous whitespace and restrained motion communicate stability.
3. **Accuracy you can see.** The displayed total always equals the sum of the displayed account balances.
4. **No dead ends.** Every state — loading, empty, error, success — tells the user what happened and what to do next.
5. **Honest simulation.** Meridian is fictional and says so; it never presents itself as a real institution.
6. **Accessible by default.** Keyboard, screen-reader and reduced-motion users get the same capabilities.

## 2. Brand identity

- **Name and mark:** *Meridian*, represented by a stylised **M** monogram (`Brand.tsx`, and the "M" in the dashboard balance graphic). The mark and name are original.
- **Voice:** warm, plain English, short sentences ("It's all yours to manage", "Getting your accounts ready…").
- **Reference policy:** Barclays website screenshots were used **only as visual references** for layout density and the navy/blue mood. No Barclays logos, wordmarks, copy, imagery or code are used or distributed, Meridian is never presented as Barclays, and the MIT License explicitly excludes any third-party material (see [LICENSE.md](LICENSE.md)).

## 3. Colour palette (navy and blue)

Tokens are defined in `frontend/src/styles.css` (`:root`).

| Token / value | Role |
| --- | --- |
| `--navy` `#141c30` | Primary dark surface, headings on light backgrounds |
| `--navy2` `#192237` | Raised dark surface |
| `--navy3` `#262a3c` | Dark borders and dividers |
| `--deepblue` `#0a0e69` | Gradient start, brand depth |
| `--electric` `#3b9bff` | Primary action colour (buttons, focus accents) |
| `--bright` `#08adf6` | Highlights, gradient end |
| `--muted` `#718096` | Secondary text |
| `--line` `#e8edf3` | Hairline borders |
| `#f5f7fb` | Application background |
| `#ffffff` | Cards and panels |
| `#fff0f0` / `#f8cfd3` | Error backgrounds and borders |

**Signature gradient** (balance panel): `linear-gradient(118deg, #07106d, #1027a2 60%, #0098e4)`.

Guidance: use blue for action and emphasis only; reserve red tints for errors; never rely on colour alone to convey meaning (pair with text or icons).

## 4. Typography, spacing and components

- **Typefaces:** *DM Sans* for body and UI; *Manrope* for display figures and headings (loaded from Google Fonts, with system fallbacks).
- **Headings:** tight tracking (`letter-spacing: -.035em`), bold weights.
- **Money:** always formatted through `money()` — `Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' })` — giving two decimals (e.g. `£6,622.69`).
- **Radius and shape:** `--radius: 16px` for cards; 18px for the hero balance panel; pill-shaped chips and buttons.
- **Spacing:** consistent 8px-based rhythm; panel padding ≈ 26–34px on desktop, reduced on mobile.
- **Buttons:** `.btn-primary` (electric blue on navy text), `.btn-white`, text links with arrow icons (lucide-react).
- **Focus:** visible `:focus-visible` styles on buttons, links and form controls.
- **Motion:** subtle; disabled under `prefers-reduced-motion: reduce`.

## 5. Responsive layout

| Range | Behaviour |
| --- | --- |
| Desktop (> 1100px) | Full sidebar/app shell, multi-column account card grid, two-column dashboard content |
| Tablet (≤ 1100px) | Condensed layout, columns reduce, panels stack where needed |
| Mobile (≤ 800px and ≤ 600px) | Single column, compact balance panel (≈ 208px tall), stacked cards, touch-sized controls, no horizontal scroll |

Breakpoints are `max-width: 1100px`, `800px` and `600px` in `styles.css`.

## 6. Key screens

### Homepage (`/`)
Marketing header, hero with calls to action (log in / register), featured products, mobile-banking showcase and footer. A static reference lives at `previews/home.html`.

### Login and registration (`/login`, `/register`)
Single-column form card: labelled inputs (full name on register, email, password with show/hide toggle), a prominent primary button and inline `role="alert"` error text. The login page offers a "Fill demo login" helper for the fictional demo account. Registration requires a password of at least 10 characters.

### Dashboard (`/app`)
1. **Page header** — "YOUR FINANCIAL OVERVIEW", greeting using the user's first name, "All accounts active" badge.
2. **Total balance panel** — heading **YOUR TOTAL BALANCE**, large GBP total, "Across *N* accounts · It's all yours to manage", decorative orbit graphic with the M monogram, and a **Make a transfer** button linking to `/app/transfer`.
3. **Your accounts *N*** — section heading with account count and **View all accounts** link to `/app/accounts`, followed by account cards.
4. **Quick actions**, **Money in & out** six-month chart, **Recent activity** list and a closing call-to-action banner.

For the demo data the total is **£6,622.69** across **2 accounts**: Everyday account £1,065.45 and Rainy day savings £5,557.24.

### Account cards (`AccountCard.tsx`)
Each card shows an icon (card for current, piggy bank for savings), the account name, the balance, and `Sort code: 20-42-66 · Account ending 1936`. The arrow link opens `/app/accounts?account=<id>`. Savings cards use a distinct tint (`account-card-savings`).

### Transfers (`/app/transfer`)
From/To selects (names plus masked number), amount and optional reference. Inline validation warns when the amount exceeds the source balance. On success a confirmation view ("TRANSFER COMPLETE") replaces the form; failures show a `role="alert"` message. A fresh `requestId` UUID is created per submission.

### Transaction history (`/app/accounts`)
Account selector, searchable and money-in/money-out filterable list of ledger entries with date, description, signed amount and balance after.

### Statements and settings
Statements: choose account and date range, download CSV. Settings: profile, security overview and project limitations.

## 7. Interface states

| State | Implementation |
| --- | --- |
| **Loading** | Dashboard shows a spinner with "Getting your accounts ready…" while `BankContext` loads |
| **Error** | "We couldn't load your banking data." with the message and a **Try again** button that calls `refresh()` |
| **Empty** | When the API returns no accounts: "No accounts yet" panel; total shows £0.00 and "Across 0 accounts" |
| **Success** | Transfer confirmation screen; balances refresh automatically |
| **Form errors** | Server messages (e.g. "Insufficient funds") displayed in an alert region |

## 8. Accessibility (WCAG 2.2 considerations)

Implemented:
- Semantic headings and landmarks; native `button`, `a`, `label`, `input`, `select` elements.
- Programmatic labels on form controls; `aria-label` on icon-only links (e.g. "View Everyday account").
- `role="alert"` for errors.
- Visible keyboard focus; full keyboard operability.
- Reduced-motion support.
- Responsive reflow down to 320px width.

Automated: axe-core checks in the Vitest suite (login, registration, account cards, transaction list, dashboard, transfer) currently report no violations. axe-core cannot evaluate colour contrast in jsdom, so that check is disabled in tests.

Targets still to be audited *(planned)*: formal contrast verification of every colour pair against WCAG AA (4.5:1 text, 3:1 UI), screen-reader testing of the chart (currently conveyed with `title` attributes and the adjacent numbers), `aria-live` announcements for async status changes, and a Lighthouse/axe pass in a real browser in CI.

## 9. Frontend architecture

```text
App.tsx                 routes + RequireAuth
├── context/
│   ├── AuthContext     session (token + user), login/register/logout, sessionStorage
│   └── BankContext     accounts, transactions, loading, error, refresh()
├── lib/
│   ├── api.ts          fetch wrapper (adds Bearer token, handles 401/403, error mapping)
│   ├── demo.ts         browser-only backend substitute (VITE_DEMO_MODE=true)
│   ├── format.ts       money(), sumMoney(), accountEnding(), maskedAccount(), dates
│   └── types.ts        BankAccount, BankTransaction, TransferInput, …
├── components/         AccountCard, AppLayout, TransactionList, Brand, MarketingHeader
└── pages/              Landing, Auth, Dashboard, Accounts, Transfer, Statements, Settings
```

Principles: presentational components receive typed props; data fetching lives in context and `lib/api.ts`; pages compose components; TypeScript `strict` is enabled.

## 10. Backend architecture

```text
Controller (api/)     BankingController, AuthController — HTTP mapping, DTO validation
   │
Service (service/)    BankingService — business rules, @Transactional boundaries
   │
Repository (repo/)    Spring Data JPA — Account/User/Transaction/Transfer repositories
   │
Domain (domain/)      JPA entities — Account, User, BankTransaction, Transfer
Cross-cutting         auth/ (JwtService, JwtFilter), config/ (SecurityConfig, DemoSeeder),
                      ApiErrorHandler (@RestControllerAdvice → {"error": "..."})
```

DTOs are Java records in `Dtos.java` with Bean Validation annotations (`@NotBlank`, `@Email`, `@DecimalMin("0.01")`, `@Digits(integer = 10, fraction = 2)`).

## 11. PostgreSQL data model

```text
users 1───* accounts 1───* transactions
  │                           ▲
  └───* transfers ────────────┘ (transfer_id, nullable for opening deposits)
```

- `accounts.balance NUMERIC(19,2) CHECK (balance >= 0)` — the database itself refuses negative balances.
- `transactions.amount` and `transfers.amount` are `NUMERIC(19,2)` with `CHECK (amount > 0)`.
- `transfers` has `UNIQUE (user_id, request_id)` (idempotency) and `CHECK (from_account_id <> to_account_id)`.
- `accounts.version` supports optimistic locking in JPA (`@Version`).
- Schema is created and evolved only by Flyway migrations; Hibernate runs in `validate` mode.

## 12. API integration and data flow

**Dashboard load**
1. `AuthContext` holds the session; `BankProvider` runs `refresh()` when a session exists.
2. `api.accounts()` → `GET /api/accounts` with the Bearer token.
3. For each account, `GET /api/accounts/{id}/transactions?limit=100`; results are merged and sorted by date.
4. `DashboardPage` computes the total from the accounts in state and renders cards.

**Transfer**
1. `TransferPage` posts `{ requestId, fromAccountId, toAccountId, amount: "25.50", reference }` to `POST /api/transfers`.
2. On success it awaits `refresh()` so the dashboard and account cards show updated balances, then shows the confirmation.

**Errors:** non-2xx responses surface the server's `error` text; 401/403 clear the session and redirect to `/login`.

## 13. Security architecture

- **Passwords:** BCrypt, cost 12; plaintext is never stored or logged.
- **Tokens:** HMAC-signed JWT (subject = user UUID), 2-hour expiry, secret ≥ 32 bytes from `JWT_SECRET`; the app refuses to start with a shorter secret.
- **Stateless API:** no server sessions; `JwtFilter` validates the token and confirms the user exists on each request.
- **Authorization:** every account read uses `findByIdAndUserId`; transfers re-check ownership after locking; foreign accounts return `404`, not `403`, to avoid revealing existence.
- **CORS:** allow-list from `CORS_ORIGIN`; methods GET/POST/OPTIONS; headers Authorization and Content-Type.
- **CSRF:** disabled because no cookies authenticate requests (revisit if cookie sessions are added).
- **Input hardening:** Bean Validation on all request bodies; generic error bodies; CSV exports escape quotes and neutralise leading `= + - @` characters.
- **Secrets:** supplied via environment variables; `.env` is git-ignored.
- **Known limitations:** token in `sessionStorage` (XSS-exposed), no rate limiting, no MFA, no audit trail *(planned)*.

## 14. Balance calculation and financial accuracy

- **Storage:** `NUMERIC(19,2)` in PostgreSQL; `BigDecimal` (scale 2) in Java. No `double`/`float` is used for money on the server.
- **Transport:** the API returns balances as JSON numbers with two decimal places; transfer amounts are sent as two-decimal **strings** (`amount.toFixed(2)`) and parsed straight into `BigDecimal`.
- **Total balance:** never hardcoded. `DashboardPage` calls `sumMoney(accounts.map(a => a.balance))`, which converts each balance to whole pence, sums integers and divides by 100 once — so the total always equals the sum of the displayed account balances (e.g. 1,065.45 + 5,557.24 = **6,622.69**).
- **Display:** `money()` formats GBP with two decimal places.
- **Transfers:** one `@Transactional` unit — lock the user row, check idempotency, lock both accounts in ID order, verify ownership and funds, update balances, insert the transfer and two ledger rows. Any failure rolls everything back.
- **Ledger:** each transaction stores `balance_after`, so history can be audited against the account balance.
- **Idempotency:** the same `requestId` returns the original result and never moves money twice.

## 15. Automated testing strategy

Tests are layered so that most run fast with no infrastructure, and only the tests that genuinely need PostgreSQL use it.

| Layer | Tooling | Scope | Database |
| --- | --- | --- | --- |
| Backend unit (`*Test`) | JUnit 5, Mockito | `BankingService` rules, `JwtService`, `JwtFilter`, `AuthController`, DTO validation | None (mocked repositories) |
| Backend integration (`*IT`) | Spring Boot Test, MockMvc | Full HTTP → security → service → JPA → PostgreSQL, Flyway schema and constraints | Isolated `meridian_test` |
| Frontend unit/component | Vitest, React Testing Library, jsdom | Pages, components, contexts, `format.ts`, API client | None (API module mocked) |
| Accessibility | axe-core (vitest-axe) | Forms, cards, lists, dashboard, transfer | None |
| Browser-demo logic | `node:test` | `lib/demo.ts` data layer | None |

Principles:

- **Test behaviour users and attackers can observe**, for example that customer A receives `404` for customer B's account, rather than internal method calls.
- **Money tests use exact values.** Backend assertions use `BigDecimal.compareTo`; frontend tests check displayed strings such as `£6,622.69` and that the displayed total equals the sum of the displayed card balances.
- **Fictional fixtures only.** The numbers £1,065.45, £5,557.24 and £6,622.69 live in test fixtures; production code never contains them. A second dashboard test uses different balances to prove totals are computed.
- **Hard cases get dedicated tests:** replayed and conflicting idempotency keys, concurrent duplicate requests (money moves once), concurrent over-draw attempts (never goes negative), and rollback after a failure in the middle of a transfer.
- **Coverage is measured, reported and gated for critical logic.** JaCoCo (≥ 80% lines for the `service` and `auth` packages) and Vitest thresholds (≥ 80% for `format`, `api` and the two context modules) fail the build; overall frontend coverage is reported but not gated.
- **jsdom limits:** axe-core cannot compute colour contrast in jsdom, so contrast is *not* verified automatically (see section 8).

## 16. Continuous integration (Jenkins)

### Architecture

```text
GitHub ──push / pull request──► Jenkins (macOS, Homebrew)
(webhook or periodic scan)        │  Multibranch Pipeline + Jenkinsfile
                                  ├── Java 21, Maven, Node, npm      (Homebrew)
                                  ├── PostgreSQL localhost:5432
                                  │     ├── meridian        development data  ── never touched by CI
                                  │     └── meridian_test   CI-owned, least-privilege role
                                  ├── Jenkins Credentials: meridian-test-db  (masked in logs)
                                  └── publishes: JUnit results, JaCoCo/Cobertura coverage, HTML reports, JAR, frontend build
                                  ──► commit status on GitHub (via GitHub Branch Source)
```

CI is **verification only**: it never deploys, never publishes packages and needs no Docker.

### Pipeline workflow

```text
Checkout ─► Environment Validation ─► Install Dependencies (Maven ∥ npm ci)
   ─► Backend Unit Tests ─► Backend Integration Tests (PostgreSQL)
   ─► Frontend Tests (test:demo + Vitest coverage) ─► TypeScript Validation
   ─► Frontend Build ─► Backend Build (mvn clean package + JAR check) ─► Publish Reports
```

- **Fail fast, cheap first:** environment and dependency problems surface before any test runs; database-free unit tests run before database tests.
- **Any required failure fails the build**, but JUnit results and coverage reports are published in each stage's `post { always }` block, and copied to `ci-reports/` before the final `mvn clean` removes `backend/target`.
- **Triggers:** GitHub webhook (push and pull request) or a periodic scan; manual *Build with Parameters*; `master` and `PR-*` only; PRs are built merged with the target branch, and branches that are also PRs are not built twice. A newer build of the same branch aborts the older one.
- **Time limits:** 30 minutes overall, 2–10 minutes per stage.
- **Reproducibility:** `scripts/ci/run-local.sh` runs the same commands locally.

### Integration-test database isolation

| Concern | Design |
| --- | --- |
| Separate target | Database `meridian_test`, role `meridian_test` (`NOSUPERUSER NOCREATEDB NOCREATEROLE`), owner of that database only; `PUBLIC` access revoked |
| Provisioning | `scripts/ci/create-test-db.sh`, create-only and idempotent. It refuses names not ending in `_test` and never drops or alters existing roles or databases |
| Credentials | Jenkins Credentials (`meridian-test-db`) → environment variables inside the shell step; never in the repository, never echoed. No JWT secret is stored: tests generate a random signing key per run |
| Guards | Pipeline script and the test base class both refuse a database name that does not end in `_test`. Verified by pointing the tests at `meridian`: refused, data unchanged |
| Schema | Flyway runs the real migrations against `meridian_test`; `ddl-auto: validate` |
| Seeding | Disabled (`app.seed-demo: false` in the `test` profile) |
| Data isolation | Most tests are `@Transactional` and roll back. The few that need real commits (rollback and concurrency) create unique fixtures and delete only their own rows by ID |
| Determinism | Deterministic fixtures with unique emails and account numbers per test, no reliance on seed data or test order |

### What CI deliberately does not do

It does not run browser end-to-end tests, measure colour contrast, load-test, scan dependencies beyond `npm audit` run manually, or deploy. These are roadmap items.

## 17. Future design work

Dark mode, payee-management flows, richer charts with accessible data tables, a documented component library, automated visual regression tests and a contrast audit in CI are *planned*, not implemented.
