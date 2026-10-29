
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

Customer registration always creates a customer account. `GET /accounts/api/me/`
returns `role` and the effective `analysis_simulation_access` boolean. Admins retain
analysis/simulation access automatically. Enabled customers can also enter Analyse
and Simulation Lab, including direct links and login redirects, while their home
remains `/home`. Existing `/admin/analyse` and `/admin/simulations` URLs are retained;
the `/admin` directory itself remains admin-only. The shared `canAnalyzeAndSimulate`
helper governs routes, navigation and creation controls. Missing flags default to
false for customers, for compatibility with older current-user responses.

Manage the flag only in Django admin and reload the app after changing it. Deploy
the backend's additive accounts migration, generated only on the VM through its
existing `deploy.sh`, before enabling the flag. This does not grant Django staff
access or change which Sapiens the account can access.

Frontend role gates are only an interface boundary. Backend authorization remains
authoritative. Customers receive server-filtered lists and can access only their
own Sapiens and related resources. Enabled customers additionally see an Enable
simulation checkbox in their creation dialog; ordinary customers omit the field.
The backend assigns the authenticated owner on creation. Admins see all Sapiens.
Assignment/reassignment uses Django admin's
Sapiens **Owner** field; there is no frontend ownership assignment API.

Global heartbeat/dashboard state, orchestrator status, and global LLM/embedding
usage remain admin-only. Enabled customers can inspect usage for their selected
Sapien; the usage dialog does not request global totals for them.
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

The permission-gated Simulation Lab at `/admin/simulations` uses the backend-authored
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
fields added to the authorized Sapiens-list response. Older deployments that
omit those fields fail closed; no numeric-ID fallback is provided. Eligibility
is selected during authorized creation or changed later through Django admin.
The backend scopes customer run lists, controls and archived history to owned
Sapiens, including direct run-ID requests and idempotent creation. Runs without
a Sapien remain admin-only. Manual verification should cover admin, ordinary
customer and enabled customer navigation/creation, owned live and archived runs,
cross-account IDs, and permission revocation after reload.

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

Awareness beat diagnostics and stored analysis use the backend's central
capability and ownership checks. The frontend never falls back to Django cookies.

### Admin Awareness run reader

The admin reader uses `GET /sapien/:id/awareness/runs?offset=…&limit=20`
and fetches `GET /sapien/:id/awareness/runs/:runId` only for the selected run.
Deploy the backend run-inspection APIs and action-detail addition first. The
workspace Awareness panel continues using its existing understanding-history API.

The full-width table shows saved beats, including saved failures/no-focus outcomes,
not a live job queue. Trigger filters and text search cover all saved run records
through the API, before pagination. Search submits on Enter or the search button;
typing alone does not send requests. Refresh starts at
the latest page while retaining an explicit selected run. The URL stores
`awarenessFor`, `awarenessRun`, `awarenessOffset`, `awarenessSearch` and
`awarenessTrigger`; these are
used only when `awarenessFor` matches the globally selected Sapien. They do not
switch the global identity. In-flight page/detail requests are cancelled or
ignored on navigation, and returned Sapien/run identities are checked.

Trigger categories and labels come from the API's `trigger_categories`; the
frontend does not infer them from message wording or the selected focus. Filter
changes reset pagination and selection. Responses must match the requested
filters, preventing older requests or an outdated backend from silently showing
unfiltered data. Search covers retained source/focus/decision/assessment text,
not full prompts, linked memories or complete tool responses. The scope is
explained beside the controls. Deploy the backend filtering addition first.

Columns read left to right: situation/focus, initiating source, processing,
work status, recorded tool actions and start time. Narrow layouts show labelled
rows. Selecting a row opens a detail dialog; no run opens automatically. A saved
run URL still opens its exact record, including records outside the current page.
Closing the dialog retains the filters and page and returns focus to the opener
(or search when no opener remains).

The detail view separates trigger, selected focus, interpretation, processing
status, task assessment and delivery. Historical missing triggers are not
reconstructed from focus text. Only exact `action_detail` matches expose saved
arguments/results, rendered as inert text with backend truncation/redaction
markers retained. The legacy generic diagnostic filter remains separate.
Recorded failure stages and reasons appear in the outcome section, with raw
technical detail still available. Missing source details are labelled honestly.
The original advanced trace/graph loads only when opened and requires both an
exact thought match and the selected beat ID. No runtime or tool is started.

Version-2 run diagnostics show the producer's formed focus separately from its
primary/contributing sources. The detail dialog starts with source/focus previews
and the overall outcome, then a numbered, clickable sequence of all retained
decisions and actions. Lines indicate stored order, not causal relationships.
Each step expands to its explanation, proposed tools and execution evidence.
Optional loop grouping uses the same steps, stored loop indexes and order; older
inferred grouping is labelled. Phase and loop identifiers stay in technical
detail rather than the default flow. Unknown event types retain their supplied
titles and summaries. No-focus checks are distinguished from
failures and task completion, and missing explanations are not invented.
When formed focus is absent but selected input text survives, the overview labels
it as selected source, not a reconstructed focus. Inferred loop numbers remain
labelled inside individual step details even when loop grouping is off.
Full retained source details, contributors, understanding and supporting context
remain in disclosures below the flow. Preview shortening does not replace the
saved values. No API, persistence or Awareness decision behaviour is changed.
Candidate impressions and the supplied Working Memory catalogue are available
in a separate disclosure; the catalogue alone does not prove memory use.
Exact activity-record fallbacks are labelled as saved composite activity text,
not raw tool responses. Existing API fields and old-run views remain supported.

The local reader change has been reviewed by source inspection only. No build,
tests, localhost server, commit or deployment was run for this change; visual
and live API verification remain pending.
