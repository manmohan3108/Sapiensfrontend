
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
authoritative. Customers receive server-filtered lists and can access only their
own Sapiens and related resources. Customer creation sends name/descriptive role
only; the backend assigns the authenticated owner. Admins see all Sapiens and
create ownerless, admin-only records. Assignment/reassignment uses Django admin's
Sapiens **Owner** field; there is no frontend ownership assignment API.

Global heartbeat/dashboard state, orchestrator status, and LLM/embedding usage
are admin-only. Customers do not poll orchestrator status or mount usage panels.
Selection is revalidated against the server list on entry and window focus.
A scoped resource 404 (including an inaccessible memory batch/child resource)
clears the selection and private state and returns to the accessible picker.
This intentionally conservative behavior does not disclose why access failed.
Selection/account changes discard in-flight response bodies; no Sapiens selection,
chat, or memory data is persisted to browser storage. Theme preference is shared.

Deployment is NOT verified. Apply backend migration `0004_sapiensmodel_owner`
before restarting, verifying the host includes `0003_enginejob_origin`; reconcile
history differences rather than faking migrations. Existing records remain
ownerless/admin-only until assigned. Do not release customer access against an
older backend that does not enforce ownership.

Contract audit: load uses `/api/load-sapien` with `sapiens_id`; save uses
`/api/<id>/save/`. The existing feedback helper still refers to `/api/chat/signal`,
which is absent from the current backend URL configuration. A payload mapping to
the per-Sapiens feedback endpoint must be agreed separately; no alternative
endpoint or ownership parameter is invented here.

One legacy exception still exists in the backend: awareness beat diagnostics
check Django `is_staff`, not the app `admin` role. An app-admin who is not Django
staff can therefore receive `403` on that endpoint. The frontend deliberately
does not fall back to Django cookies; align this backend check with the desired
app-role policy before relying on diagnostics for every app-admin account.
