
# Sapiens

This is a code bundle for Sapiens. The original project is available at https://www.figma.com/design/O5Q4HuU26a2H8wr74xniqJ/Sapiens.

## Local development

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Without an override, local development uses `http://localhost:8000/api`. Set
`VITE_API_BASE_URL` in a local `.env` file when the API is elsewhere.

## Production build

Vite reads `.env.production` during a production build. The committed value points
the static bundle at `https://api.awareai.in/api`; it is public configuration, not
a secret.

On the VM, build from the repository root:

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm build
```

The complete static site is emitted to `dist/`. The frontend is static and needs
no Node process or systemd service after the build. See [DEPLOYMENT.md](DEPLOYMENT.md)
for the complete VM, Nginx, TLS, update, verification, and rollback procedure.

## Authentication and roles

The SPA signs in customers and app administrators through the JWT endpoints under
`/accounts/api/`. Tokens are kept in tab-scoped `sessionStorage`; authenticated API
requests attach the access token and perform one rotation-aware refresh and retry
after a `401`. Closing the tab ends local persistence, while signing out also asks
the backend to revoke the refresh token.

`sessionStorage` is still readable by scripts running on this origin: it is not
an XSS-proof credential store. Keep TLS and a restrictive deployment CSP, and do
not add untrusted scripts. An HttpOnly-cookie/BFF design would require backend
changes if stronger token isolation is desired.

Run `pnpm test:auth` for isolated session-layer checks and `pnpm build` for the
production bundle. These tests mock network and storage; they do not create or
modify real accounts. Browser smoke checks cover the public auth forms and
unauthenticated route redirects; successful live login requires test credentials.

Customer registration always creates a customer account. The role returned by
`GET /accounts/api/me/` controls frontend routing and navigation: customers enter
the Sapiens workspace and connection management, while app administrators enter
the analysis area. This app-admin flow is separate from Django's `/admin/` session
login.

Frontend role gates are only an interface boundary. Backend authorization remains
authoritative. At present, the backend explicitly restricts only
`PATCH /accounts/api/users/<user_id>/role/` to administrators; most `/api/` feature
endpoints accept both authenticated roles. Product policy must decide whether
customer data should be tenant-scoped and which analysis, engine, connection, and
Sapiens-management endpoints should become admin-only or customer-only.

One legacy exception still exists in the backend: awareness beat diagnostics
check Django `is_staff`, not the app `admin` role. An app-admin who is not Django
staff can therefore receive `403` on that endpoint. The frontend deliberately
does not fall back to Django cookies; align this backend check with the desired
app-role policy before relying on diagnostics for every app-admin account.
