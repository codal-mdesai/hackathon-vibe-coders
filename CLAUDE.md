**Web app** consumes Sanity content via `next-sanity` and `@sanity/client`. The Sanity client is configured in `apps/web/src/sanity/lib/client.ts` with live editing support in `live.ts`. Tailwind v4 uses CSS-first config (`globals.css` with `@import "tailwindcss"`, no `tailwind.config.js`).

**Studio** has an empty `schemaTypes/index.ts` ready for content modeling. Config is in `apps/studio/sanity.config.ts`.

**Sanity App** uses `@sanity/sdk-react` hooks and runs as a standalone app deployable to the Sanity Dashboard. CLI config in `sanity.cli.ts` needs a real `organizationId`.

## Key Constraints

- **Node >=20.9** (pinned in `.nvmrc` as `20`)
- **pnpm 9.15.4** (specified in root `packageManager`)
- **Sanity project ID and dataset**: set in `apps/web/.env.local` (see `.env.example`)
- **Strict TypeScript** with `noUncheckedIndexedAccess` enabled in base config
- **No `tailwind.config.js`** — Tailwind v4 is configured entirely via `globals.css`
- React types are pinned to `^19.0.0` via pnpm overrides in root `package.json`
- **Package manager: pnpm only.** Never use npm or yarn.
- **GROQ only** for all Sanity queries. No SQL, no raw REST calls to Sanity.
- **Server Actions preferred** over API Routes for all mutations.
- **No new package may be added** without a comment justifying why it's needed and why an existing dep can't cover it.

## Approved Dependencies

### Already in boilerplate (do not reinstall)
- `next` 15, `react` 19, `typescript` (strict mode)
- `tailwindcss` v4 (CSS-first, no config file)
- `next-sanity`, `@sanity/client` — Sanity data fetching
- `@sanity/sdk-react` — Sanity App SDK

### Must install in `apps/web` if not present
| Package | Version | Purpose |
|---|---|---|
| `shadcn/ui` | latest | Component library — init with `pnpm dlx shadcn@latest init` |
| `next-auth` | v5 (`beta`) | Auth — email + OTP session strategy |
| `resend` | latest | Transactional email for OTP delivery |
| `zustand` | ^5 | Lightweight global client state |
| `framer-motion` | ^11 | Micro-animations only — no layout animations |
| `lucide-react` | latest | Icons — no other icon library permitted |
| `zod` | ^3 | Schema validation for all Server Actions and forms |
| `@tanstack/react-query` | ^5 | Server state sync and optimistic updates |

### Encryption
- Use the **native Web Crypto API** (`crypto.subtle`) only.
- **Do not install** `crypto-js` or any third-party crypto package.
- AES-256-GCM for all encryption. Key derived from user session via PBKDF2.
- Encrypted values are stored in Sanity. Plain text never persists anywhere.
- Decryption happens client-side at copy time only.

### shadcn/ui Components to use
Only use components from this list. Do not install others without approval:
`Card`, `Dialog`, `Badge`, `Command`, `Tooltip`, `DropdownMenu`, `Toast`,
`Button`, `Input`, `Label`, `Separator`, `ScrollArea`, `Popover`, `Sheet`,
`Select`, `Textarea`, `Switch`, `Avatar`, `Skeleton`

## Fonts
- **UI text**: Geist Sans (`next/font/google` → `Geist`)
- **Code / keys / commands**: Geist Mono (`next/font/google` → `Geist_Mono`)
- Apply via CSS variables in `globals.css`, consume via Tailwind utilities.
- No other fonts permitted.

## Environment Variables

Web app reads from `.env.local` (gitignored). See `apps/web/.env.example` for required vars.
All new env vars must be added to `.env.example` with a descriptive comment.

### Required (existing)
- `NEXT_PUBLIC_SANITY_PROJECT_ID` — Sanity project ID
- `NEXT_PUBLIC_SANITY_DATASET` — Sanity dataset name
- `SANITY_API_READ_TOKEN` — enables live draft previews

### Required (add for DevPanel)
- `AUTH_SECRET` — next-auth v5 secret (`openssl rand -base64 32`)
- `AUTH_URL` — base URL of the app (e.g. `http://localhost:3000`)
- `RESEND_API_KEY` — Resend API key for OTP emails
- `RESEND_FROM_EMAIL` — verified sender address (e.g. `noreply@yourdomain.com`)
- `SANITY_API_WRITE_TOKEN` — Sanity write token for mutations from Server Actions
- `NEXT_PUBLIC_APP_URL` — public base URL (used for share link generation)
- `ENCRYPTION_SALT` — static salt for PBKDF2 key derivation (never expose client-side)

## Design System

- **Theme**: Dark only. `#0a0a0a` page bg · `#18181b` card bg · Zinc palette for all neutrals.
- **Accent**: User-configurable per space (stored in Sanity, applied via CSS variable `--accent`).
- **No `tailwind.config.js`** — define all custom tokens as CSS variables in `globals.css`.
- All sensitive values display as `••••••[last4]` — never show full plain text in UI.
- Copy button resets to original icon after 1500ms — use a shared `useCopyToClipboard` hook.
- Empty states must render a contextual quick-add CTA. Never render a plain "No items" string.
- Keyboard shortcuts must appear in `Tooltip` components, not inline text.
- Consistent section order across all features: **[Favorites] → [Recent / Frequent] → [All]**

## Code Conventions

- All Sanity schema files must export both the schema definition and its TypeScript type.
- Shared types live in `apps/web/src/types/`. No inline type definitions in component files.
- Server Actions live in `apps/web/src/actions/` grouped by feature (e.g. `actions/api-keys.ts`).
- Reusable UI components live in `apps/web/src/components/`. Feature-specific components in `apps/web/src/components/<feature>/`.
- Hooks live in `apps/web/src/hooks/`. One hook per file, named `use<HookName>.ts`.
- GROQ queries live in `apps/web/src/sanity/queries/` grouped by feature.
- Never use `any`. Use `unknown` and narrow with Zod where type is uncertain.
- Optimistic updates via `@tanstack/react-query` for all list mutations.
- No `console.log` in committed code. Use `console.error` only in catch blocks.