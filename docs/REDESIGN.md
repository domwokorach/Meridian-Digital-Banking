# Meridian premium UI redesign

Implementation notes for the signed-in app (`/app/*`). The public site and sign-in screens still use the original stylesheet, loaded into a CSS cascade layer (`legacy`) so Tailwind utilities always win over it.

## Stack decisions
| Requested | Used | Why |
| --- | --- | --- |
| Next.js | **Vite + React 19 + React Router** (kept) | The project is a Vite SPA; migrating the framework was not necessary for the redesign. |
| Tailwind, shadcn/ui, Radix | Tailwind v4, shadcn/ui (**Base UI** primitives, `base-nova` style), all components installed | Chosen at `shadcn init`; Base UI is the accessible-primitive layer, not Radix. |
| Motion, Lucide, Recharts | `motion` (`motion/react`), `lucide-react`, `recharts` via the shadcn `chart` wrapper | |
| React Hook Form + Zod | Transfer, Pay and Support forms (`src/lib/validators.ts`) | Client checks give fast feedback only; the API re-validates. |

## Run
```
cd frontend
npm install
npm run demo      # fictional data, no backend needed (demo@meridian.test / Demo1234!)
npm run dev       # against the Spring Boot API on :8080
npm run build     # tsc -b && vite build
npm test          # vitest (116 tests)
```

## Design system
- Tokens live in `src/index.css` (`:root` light, `.dark` default). Palette: background `#0B1020`, surface `#151D31`, panel `#1D2940`, blue `#2997FF`, cyan `#29C7F6`, success `#22C78A`, warning `#F4B860`, error `#F16B7A`. Mirrored for charts in `src/lib/design-tokens.ts`.
- Theme toggle in the header; choice kept in `localStorage` (`meridian_theme`).
- Font: Geist Variable. Card radius 24px (`rounded-3xl`).
- Motion: 160ms micro, 280ms panels, springs for the nav pill and card flip. `MotionConfig reducedMotion="user"` plus a CSS reduced-motion rule.

## Structure
`components/layout` (BrandLogo, GlobalSearch ⌘K, NotificationsPopover) · `components/banking` · `components/cards/BankCard` · `components/payments` (TransferForm, PayWizard) · `components/charts` · `components/animations` · `lib/{insights,validators,design-tokens}` · `context/NotificationContext` · `hooks/{use-theme,use-dashboard-prefs}`.
`AccountCard`, `TransactionList` and `AppLayout` kept their original paths.

## What is real and what is demo
| Area | Status |
| --- | --- |
| Sign-in, accounts, balances, transactions, own-account transfers, statements CSV | **Real API** (or `npm run demo` mock). Transfers have a review/confirm step and a per-review idempotency key. Success is shown only after the API accepts. |
| Pay someone | **Sandbox rehearsal.** No payment endpoint exists. It always ends in "Nothing was sent". |
| Cards (freeze, limits, toggles), savings goals, notifications, payees, FAQs | **Demo content** from `demoContent` in `lib/demo.ts`, labelled in the UI. Card settings persist in `localStorage` only. Only the last four digits are ever rendered. |
| Support request | Preview only; nothing is sent or stored. |
| Last successful login | Kept client-side per browser until the API returns it. |
| Security / audit log UI, session list | Not built: needs backend endpoints. |

## Needs backend or external work
`/notifications`, `/cards` (+ freeze/limits), `/savings-goals`, `/beneficiaries`, `/payments` with an approved payment provider, last-login and audit-event fields on auth, a support-ticket endpoint. CSRF protection is not needed for the current bearer-token API; revisit if sessions move to cookies.

## Not done
- **Figma:** no Figma file was created. The tokens and component inventory above are the specification to build it from.
- **Sign-in and landing pages** are not yet restyled to the new system.
- **Bundle:** one 1.48 MB chunk (459 KB gzip); route-level code splitting is a follow-up.
- Tablet/mobile were checked for horizontal overflow at 390px across every `/app` page, not on real devices.

## Verification
`tsc -b` clean · `vite build` passes · 116 vitest tests pass (axe checks included; colour contrast is not computable in jsdom).
