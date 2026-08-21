# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Package manager

This project uses **npm** (`package-lock.json`, `npm ci` in the Dockerfile) — not Bun, despite the user-level default. Node >= 22.13.0.

## Commands

```bash
npm run dev          # next dev
npm run build        # next build
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
npm test             # node --test tests/*.test.mjs
node --test tests/local-stack.test.mjs   # single test file
```

Database (Prisma 7 + PostgreSQL):

```bash
npm run db:migrate   # prisma migrate dev (creates a migration)
npm run db:deploy    # apply migrations
npm run db:seed      # tsx prisma/seed.ts
npm run db:setup     # deploy + seed
npm run db:generate  # regenerate client into generated/prisma (also runs postinstall)
npm run db:studio
```

Local stack:

```bash
docker compose up -d --build            # full stack; app auto-runs db:deploy + db:seed on boot
docker compose up -d postgres mailpit   # services only, then npm run db:setup && npm run dev
```

App on :3000, Mailpit UI on :8025, Postgres on :5432. The only seeded login is `admin@bravestars.local` with password `Flowdesk@123` — other users are created from the admin panel, not seeded.

## Architecture

Single-tenant internal helpdesk, fully self-hosted. Next.js 16 App Router + React 19, Tailwind 4, shadcn on `@base-ui/react` (style `base-nova`, see `components.json`).

**The whole UI is one client component.** `app/page.tsx` (~1750 lines) holds every view — dashboard, kanban, ticket list, ticket detail, requester portal, user admin — switched by a local `View` state. `app/login/page.tsx` is the only other page. It ships with `seedTickets` hardcoded fallback data that is replaced by API results after mount. New UI work generally means editing `app/page.tsx`, not adding routes.

**Data access.** `db/prisma.ts` exports `getPrisma()`, a lazily-created global singleton using the `@prisma/adapter-pg` driver adapter (required — `next.config.ts` marks `@prisma/client`, `@prisma/adapter-pg`, `pg` as `serverExternalPackages`). The generated client lives in `generated/prisma/` (gitignored) — import types from `../generated/prisma/client`, not `@prisma/client`.

**API route conventions** (`app/api/**/route.ts`) — every handler follows the same shape:

1. `const user = await requireUser([...roles])` from `lib/auth.ts` — throws `HttpError(401/403)`.
2. `schema.parse(await request.json())` with a zod v4 schema declared at module top.
3. Business logic via `getPrisma()`.
4. `catch (error) { return apiError(error) }` — `lib/http.ts` maps `ZodError` → 400, `HttpError` → its status, anything else → logged 500.

Deviating from this shape means errors leak as unhandled 500s. All user-facing error strings are Vietnamese.

**Authorization is two-layered.** `requireUser(roles)` gates by role; `canAccessTicket` / `assertTicketAccess` (`lib/tickets.ts`) gates by row: REQUESTER sees only own tickets, AGENT sees own + unassigned, MANAGER/ADMIN see all. List endpoints apply the equivalent filter in the Prisma `where`. Internal comments are stripped for requesters in `GET /api/tickets/[id]`.

**Sessions** are DB-backed, not JWT: a random token in the httpOnly `flowdesk_session` cookie, stored as an HMAC-SHA256 hash (`SESSION_SECRET`) in the `sessions` table, 7-day expiry. Login enforces bcrypt compare plus a 5-attempt / 15-minute lockout, and writes to `audit_logs` via `lib/audit.ts`.

**Ticket IDs are dual.** The UI and URLs use the human `HD-<number>` form; routes parse it back to the integer `Ticket.number` (`ticketNumber()` / `numberFrom()` helpers, duplicated per route) and query by `number`, while `databaseId` carries the UUID. `serializeTicket()` in `lib/tickets.ts` is the single translation boundary — it lowercases enums to UI values (`IN_PROGRESS`→`progress`, `URGENT`→`high`, `CLOSED`→`resolved`), computes remaining SLA minutes, and builds initials/download URLs. Any new ticket field must be added there to reach the UI.

**SLA** deadlines are materialized at creation time (`responseDueAt`, `resolutionDueAt`) from the `SlaPolicy` row matching the priority, falling back to 240/960 minutes. There is no background job — breach is derived on read.

**Attachments** are written to `UPLOAD_DIR` (Docker volume `flowdesk_uploads`) under `<ticketUuid>/<uuid>-<sanitized-name>`, 10 MB cap, with a path-traversal check and `flag: "wx"`; only metadata and ACLs live in Postgres. Downloads go through `/api/attachments/[id]`, which re-checks ticket access.

## Testing

`tests/local-stack.test.mjs` is a structural smoke test — it greps `package.json`, `docker-compose.yml`, `prisma/schema.prisma` and route sources to assert the stack stays self-hosted (no `vinext`/`wrangler`/Cloudflare deps), that models exist, and that routes still call `requireUser()` / `assertTicketAccess` / enforce `MAX_FILE_SIZE`. Renaming those symbols breaks the tests by design.

## Rules

### UI: shadcn only

New or edited UI must be built from the shadcn primitives in `components/ui/` (`Button`, `Card`, `Badge`, `Input`, `Label`, `Select`, `Textarea`, `Dialog`, `Table`, `Tabs`, `Avatar`, `Separator`), styled with Tailwind utilities and the design tokens in `app/globals.css`.

- Add a missing primitive with `npx shadcn@latest add <name>` — never hand-write one into `components/ui/`.
- These are **Base UI**–backed, not Radix: `Dialog` uses `disablePointerDismissal` (not `modal={false}`); `Select` is `Select.Root` with `value`/`defaultValue`/`onValueChange`, takes an `items` array so `SelectValue` can render a label instead of the raw value, and submits through a hidden input when given `name`. Check the component source or `node_modules/@base-ui/react/docs/react/components/*.md` before assuming a Radix-shaped API.
- Do **not** add new semantic classes to `app/globals.css`. Its ~2000 lines of hand-written rules (`.panel`, `.kpi`, `.ticket-card`, `.modal-backdrop`…) are legacy; delete a block once its markup is migrated. Migrated so far: login page, `PasswordModal`, `AdminUsers`, `TicketModal`. Not yet migrated: dashboard, kanban, ticket list/detail, requester portal.
- **Base UI's `Button` does not default to `type="submit"`** the way a native `<button>` does. Every `<Button>` must declare `type` explicitly, or it is silently inert inside a form. `tests/ui-forms.test.mjs` enforces this.
- Files under `components/ui/` are generated — regenerate rather than edit, and don't lint-fix them by hand (`eslint.config.mjs` already exempts them from `jsx-a11y/label-has-associated-control`).

### Layout and theming

The application chrome lives in `components/AppShell.tsx` — sidebar, top bar, content well — built from Tailwind utilities and the design tokens, modelled on the NextAdmin template (`NextAdminHQ/nextjs-admin-dashboard`, same Base UI + Tailwind 4 + Next 16 stack). It replaced ~190 lines of `globals.css` that hardcoded hex colours and therefore ignored dark mode.

Note the template's own token scale (`--primary-50..950`) is **not** compatible with the shadcn tokens (`--primary`, `--muted-foreground`) every component here uses. Take layout and proportion from it, not its token names.

Dark mode is `next-themes` with `attribute="class"`; `<html>` needs `suppressHydrationWarning` because the class is written before hydration. Toasts are `sonner` (`toast.success(...)`), not a hand-rolled element. Charts are Recharts with `var(--...)` colours so they follow the theme.

### Admin surface

Admin screens live in `components/admin/` and share three conventions — `DataTable`, `FormDialog`, `AdminPageHeading`. A new admin screen composes those rather than writing its own table or dialog markup, and reads data through a hook in `client/queries/`, never by calling `fetch` directly. `tests/admin-contract.test.mjs` enforces both.

**The envelope contract**: paged endpoints return `{ <plural>, meta }` — e.g. `{ users, meta }`, `{ logs, meta, actions }`. The controller passes the use-case result straight to `NextResponse.json`; wrapping it again in a key (`{ users: { users, meta } }`) type-checks and returns 200 while silently breaking pagination. Page size is clamped in `application/use-cases/paging.ts`.

**TanStack Query**: query keys come from the factory in `client/query-keys.ts` — never inline arrays. Every mutation declares `onSuccess` and invalidates through the per-domain helper in `client/queries/admin.queries.ts`, so a new mutation cannot forget a surface showing the same data. `staleTime` is set per hook to match how fast that data actually changes; the client-level default is 60s.

### Architecture: keep the dependency rule

The `clean-architecture` skill is installed; new code should respect it. In this codebase that concretely means:

- Dependencies point inward: `app/api/**` (delivery) → `lib/**` (policy) → `db/**` (data). Never the reverse — nothing in `lib/` or `db/` may import from `app/`.
- Keep authorization and serialization in `lib/` (`requireUser`, `canAccessTicket`, `serializeTicket`), not inline in route handlers. A route should read as: authenticate → validate → call policy → respond.
- Prisma types stay behind `lib/`; UI components consume the shape `serializeTicket()` returns, never a raw Prisma model.
- Run `/clean-architecture` before landing changes that add a layer, a new `lib/` module, or cross-cutting imports.
