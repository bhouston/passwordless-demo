# Passwordless user accounts demo

This app demonstrates **passwordless authentication** with **WebAuthn passkeys** as the primary path and **email one-time codes** as a backup. It is meant as a companion to talks on passkeys and production-style passwordless login.

## Requirements

- **Node.js 24+** (see `engines` in `package.json`; `pnpm setup-db` checks this too)
- **pnpm**

## Getting Started

To set up this project for the first time:

```bash
pnpm install
pnpm setup-db
```

`setup-db` creates a `.env` file and SQLite database. Required variables (validated at runtime) are:

| Variable       | Purpose                                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------------------------- |
| `JWT_SECRET`   | At least 32 characters; encrypts the TanStack Start session cookie and signs short-lived OTP/passkey flow tokens |
| `SITE_URL`     | Public site URL / origin (e.g. `http://localhost:3100` for local dev)                                            |
| `SITE_NAME`    | Display name for WebAuthn (`RP_NAME`)                                                                            |
| `RP_ID`        | WebAuthn relying party id (often the hostname from `SITE_URL`)                                                   |
| `DATABASE_URL` | SQLite path, e.g. `./db.sqlite`                                                                                  |

Optional: `NODE_ENV` (`development` \| `production` \| `test`).

To run this application:

```bash
pnpm dev
```

The dev server listens on port **3100** by default. Set `SITE_URL` in `.env` to the same origin (e.g. `http://localhost:3100`); WebAuthn compares the browser’s origin to this value when registering or using passkey login.

### Auth behavior (implementation)

- **Logged-in session:** [TanStack Start `useSession`](https://tanstack.com/start) with an HTTP-only encrypted cookie (`src/server/appSession.ts`), using `JWT_SECRET` as the session password.
- **OTP and passkey handshakes:** Short-lived signed JWTs ([jose](https://github.com/panva/jose)) for verification tokens and WebAuthn challenges—not the same as the login session cookie.
- **Route protection:** Authed pages sit under a pathless `_authed` layout; unauthenticated access redirects to `/login` with a `redirectTo` search param. The home page `/` redirects to `/user-settings` when you already have a session.

## Development

```bash
pnpm install
pnpm dev
pnpm tsc # typescript-native
pnpm build
pnpm lint # oxlint
pnpm lint:fix
pnpm format # oxfmt
pnpm test # vitest
```

## Testing

- **Unit / integration (Vitest):** `pnpm test` runs Vitest. Playwright E2E specs under `tests/e2e` are excluded (see `vitest.config.ts`). There are no Vitest test files in the repo yet; the config uses `passWithNoTests` so CI/scripts still succeed. Add `*.test.ts` / `*.spec.ts` next to source or under `tests` as you grow coverage.
- **E2E (Playwright):** use `pnpm test:e2e` (see below).

### E2E (Playwright)

The auth OTP and passkey flows can be tested end-to-end using Playwright. The OTP tests use the test-only OTP endpoints to retrieve issued codes, and the passkey tests use a Chromium virtual authenticator to exercise the real WebAuthn flow without hardware.

1. **Bootstrap the test database** (once, or when you need a clean DB):

   ```bash
   pnpm test:e2e-bootstrap
   ```

2. **Start the app with test env** (use the port shown by the bootstrap script, e.g. 3001):

   ```bash
   DATABASE_URL=./db.test.sqlite NODE_ENV=test SITE_URL=http://localhost:3001 pnpm dev --port 3001
   ```

3. **Run the e2e tests** (in another terminal; set `E2E_BASE_URL` to the same port as the running server):

   ```bash
   E2E_BASE_URL=http://localhost:3001 pnpm test:e2e
   ```

The `/test-otp-events` SSE endpoint and `/test-otp-latest` helper only respond when `NODE_ENV` is `development` or `test`; otherwise they return 401. The passkey e2e tests are Chromium-only because Playwright's virtual authenticator support uses Chromium CDP APIs.

## Styling

This project uses [Tailwind CSS](https://tailwindcss.com/) v4. Global colors and layout tokens are aligned with a light, neutral “presentation site” palette (stone/off-white surfaces, sharp borders).

## Linting & Formatting

This project uses [Oxlint](https://oxc.rs/docs/guide/usage/linter.html) for linting and [Oxfmt](https://oxc.rs/docs/guide/usage/formatter.html) for formatting. The following scripts are available:

```bash
pnpm lint
pnpm format
```

## Built with

- [TanStack Start](https://tanstack.com/start) (React, SSR, server functions; [`useSession`](https://tanstack.com/start) for login sessions)
- [TanStack Router](https://tanstack.com/router) (file-based routes, including `_authed` layout routes)
- [TanStack Query](https://tanstack.com/query) (client data fetching)
- [TanStack Form](https://tanstack.com/form) (forms)
- [Drizzle ORM](https://orm.drizzle.team/) + SQLite
- [SimpleWebAuthn](https://simplewebauthn.dev/) for WebAuthn
- [jose](https://github.com/panva/jose) for signed JWTs used in OTP/passkey _flow_ tokens
- [Zod](https://zod.dev/) for validation

Route files live under `src/routes`. Shared UI is under `src/components`. For framework docs, see the [TanStack documentation](https://tanstack.com).

For a security-focused review of the login design, see [SECURITY_ANALYSIS.md](SECURITY_ANALYSIS.md).
