
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
`/accounts/api/`. Tokens are kept in origin-scoped `localStorage`; authenticated API
requests attach the access token and perform one rotation-aware refresh and retry
after a `401`. Frontend login, logout, account changes, and rotated tokens synchronize
across tabs. Signing out also asks the backend to revoke the refresh token. This JWT
session remains independent from Django's `/admin/` cookie session.

`localStorage` is readable by scripts running on this origin: it is not
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
Selection is verified against the account-filtered server list when opened or
restored after a reload. Successful verification is held only in memory for the
current selection; navigating between its pages does not repeat the check.
Concurrent checks share a request, with a 15-second deadline. Switching Sapiens,
logging out or changing accounts/roles invalidates verification. Directory and
simulation pages retain their login/role gates without requiring the previous
selected Sapien. Every API request still relies on backend authorization.
For customers, a scoped resource 404 forces a fresh ownership check: a missing
child alone does not discard an accessible Sapien, while an inconclusive check
blocks protected content until retry. Confirmed loss of access clears private
state. Admin scoped-resource 404 handling remains conservative and clears the
selection; job-inspection failures are handled locally.
Selection/account changes discard in-flight response bodies. Only an account-scoped
selected ID is retained for restoration; Sapien records, chat and memory data stay
in memory. Theme preference is shared.

The admin-only Simulation Lab at `/admin/simulations` uses the backend-authored
case catalog and can bind an eligible, normally created Sapiens to Sentinel Desk.
It prepares the runtime immediately and schedules execution for the next real
whole-hour appointment, then exposes only server-authorized controls, read-only
participant activity, runtime diagnostics, evidence and participation checks.
Simulated Jira and Teams never use production credentials, and a finished Sapiens
remains inactive. The selected Sapiens does use and modify its real cognitive
memories; simulation does not clone or reset them, so a dedicated test Sapiens is
recommended but not required. The raw scenario editor is not part of the normal interface.
Live runtime and controls remain process-local and require `/api/simulations/`
to be pinned to one long-lived worker. Run history, evidence and final reports
are persisted in the database and remain inspectable after live cleanup or a
restart, but automatic runtime recovery and continuation are not implemented.
Unfinished archived runs require manual recovery review. Explicit deletion
permanently removes the saved run archive and evidence, not cognitive memories.
Deploy the backend simulation-history migration before enabling this storage
mode. The picker consumes the
authoritative simulation enablement, current availability and unavailable-reason
fields added to the existing admin Sapiens-list response. Older deployments that
omit those fields fail closed; no numeric-ID fallback is provided. Eligibility
remains controlled only through Django admin.

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

### Admin Awareness run reader

The admin reader uses `GET /sapien/:id/awareness/runs?offset=…&limit=20`
and fetches `GET /sapien/:id/awareness/runs/:runId` only for the selected run.
Deploy the backend run-inspection APIs and action-detail addition first. The
workspace Awareness panel continues using its existing understanding-history API.

The compact list shows saved beats, including saved failures/no-focus outcomes,
not a live job queue. Search covers the displayed page only. Refresh starts at
the latest page while retaining an explicit selected run. The URL stores
`awarenessFor`, `awarenessRun`, `awarenessOffset` and `awarenessSearch`; these are
used only when `awarenessFor` matches the globally selected Sapien. They do not
switch the global identity. In-flight page/detail requests are cancelled or
ignored on navigation, and returned Sapien/run identities are checked.

The detail view separates trigger, selected focus, interpretation, processing
status, task assessment and delivery. Historical missing triggers are not
reconstructed from focus text. Only exact `action_detail` matches expose saved
arguments/results, rendered as inert text with backend truncation/redaction
markers retained. The legacy generic diagnostic filter remains separate.
The original advanced trace/graph loads only when opened and requires both an
exact thought match and the selected beat ID. No runtime or tool is started.

Version-2 run diagnostics show the producer's formed focus separately from its
primary/contributing sources. Expand a loop, then a step, for decisions, proposed
tools and execution evidence; grouping follows stored loop indexes and order.
Older inferred grouping is labelled. No-focus checks are distinguished from
failures and task completion, and missing explanations are not invented.
Candidate impressions and the supplied Working Memory catalogue are available
in a separate disclosure; the catalogue alone does not prove memory use.
Exact activity-record fallbacks are labelled as saved composite activity text,
not raw tool responses. Existing API fields and old-run views remain supported.

The local reader change has been reviewed by source inspection only. No build,
tests, localhost server, commit or deployment was run for this change; visual
and live API verification remain pending.
