# Analyse and Simulation readiness review

Reviewed: 30 October 2026. Status: **Simulation overview and navigation implemented locally; visual verification pending**.
Local baseline: `cd09dea5`. Reference: Rashi, Sapien **65**.

This record works alongside [AGENTS.md](../AGENTS.md). It is a flexible, page-by-page
plan, not a requirement to give every page the same layout. The initial review changed
documentation only. The implementation record below tracks subsequent application
changes. No backend behaviour, production records or simulation controls were
changed; localhost and deployment remain off unless requested.

## Scope and goal

Improve presentation in `/admin/analyse/*` and `/admin/simulations/*`. Preserve the
homepage, Workspace and Your Sapiens, including shared components used by them.
Preserve permissions, engine behaviour, memory/learning rules, scheduling, grading
and simulation execution. Frontend-facing API changes are candidates only where an
existing presentation contract cannot supply the information needed.

The demo should let a first-time reader understand:

1. Which Sapien and situation they are inspecting.
2. What the Sapien actually received, said or did.
3. What understanding, memory or guidance was recorded afterward.
4. Which outcomes are established, still pending or not recorded.

The persistent individual identity should emerge from real evidence across these
views. A successful tool call, a recorded intention, an evaluator verdict and a
lesson applied to later behaviour are different claims. Do not make the demo imply
the last one merely because the first three exist.

## Review method and coverage

Used the in-app browser with the authenticated live site, the `frontend-design`
and `web-design-guidelines` skills, current frontend source and selected backend
read-only contracts. Guidelines source:
[Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md).

The live run was `run-6ebb9124-15e0-48ba-bf5d-67e533fa86b9`, Sentinel Desk version 5,
bound to Sapien 65. It was already running. The review did not start, pause, stop,
advance, send messages into or otherwise modify it. Simulation observations were
primarily at evidence snapshot **430**. Counts and real-time status can change.
Local source was inspected; the exact deployed commit was not independently verified.

| Surface | Live review performed | Limits of this pass |
| --- | --- | --- |
| Analyse overview | Desktop dark and narrow light directory/navigation | Not every destination's keyboard path |
| Awareness | Saved-run list and a multi-action Teams run, source/assessment/action order | Not every failure/trace/graph state |
| Working Memory | Populated list for 65, origin and timestamp display | Full detail/filter matrix remains pending |
| Engram | Dashboard, Browse and one memory detail in dark; narrow light check | Recall/Entities/Graph have source review only; no retrieval submitted |
| Goals & Plans | Four open goals and selected Jira-review goal | No goal comments or replanning submitted |
| Questioning | Eight records and one assessed-answer detail | No synthetic error or long-history case |
| Curiosity | Actual empty result for 65 | No populated live record available in this view |
| Feedback | Five findings, selected interpretation and before/after references | No feedback changes |
| Tool Learning | All-service selector, 18 profiles, a Teams lesson detail | No learning triggered; not all revisions/usages opened |
| Engine Bus | Default empty last-hour view; a signal appears in 24-hour view | No delivery/correlation failure detail reviewed |
| Engine Jobs | Populated window/list, statuses and timing labels | No jobs triggered or retried |
| Analyse Timeline / Debug | Actual entry/empty states | Neither has a selected chat session in this review |
| AI Usage | Populated quota dialog | Quotas not changed |
| Simulation Lab | Running-run entry; setup/control placement | No new-run creation flow submitted; archived states pending |
| Simulation overview | Introduction, two exchanges, unavailable decision detail | Both inspected stories lacked unique response links |
| Test case | Loaded case brief and navigation | Other brief tabs have source-level review, not full interaction QA |
| Messages | Arjun conversation, participant list and channels | No calls/messages sent; no long chat pagination test |
| Jira | 32 issues, SD-1 detail/comments, empty Sapien-actions view | Other action outcomes need fixtures |
| Sapien journey | Populated chronological activity | Full pagination/filter matrix pending |
| Results | Seven not-evaluated checks and one expanded expectation | No finished/evaluated run inspected |
| Simulation diagnostics | Directory, timeline, rule progress, people, connections/tools | Representative records only, not all sub-tabs |
| Overview Old | Navigation presence and source | Legacy comparison, not a new preferred destination |

Desktop observations used 1280px widths. Representative responsive checks used
390px width: Analyse overview, Simulation People and Connections; Simulation Lab
also appeared at the browser's narrower natural width. Both themes were sampled,
not exhaustively approved. Full keyboard, contrast, zoom, reduced-motion and error
verification remain part of each implementation task. Do not describe this audit
as a complete accessibility or performance certification.

## Keep the good foundation

- Keep the copper notebook style and grouped Analyse directory. Do not restart the
  design from a generic dashboard template.
- Keep existing shared navigation, selected-Sapien controls and return links.
- Keep Working Memory's absolute timestamps and distinction between available
  context and current focus; keep Goals' distinction between state and completion.
- Keep Questioning's source/context/understanding distinction and Feedback's
  explicit observe-mode explanation. These are useful, factual boundaries.
- Keep Tool Learning's all-pages service selector and its lesson, conditions,
  limits, evidence and usage views.
- Keep Simulation's read-only conversations and issue records. They demonstrate
  more than decorative illustrations do. Preserve exact reply/operation links,
  snapshot watermarks, pagination and source evidence.

## Findings that matter most

### 1. The product has several competing visual systems

**Observed:** most Analyse pages share copper surfaces, but Engram remains navy
with purple/cyan accents; Timeline and Debug also retain older styling. Simulation
uses violet/natural dark panels, its sidebar is navy, and Jira adds a bright blue
application shell. These feel like different tools joined together. In the narrow
light-theme Engram check, the outer shell switched to light while the dashboard's
inner panels stayed dark and several labels became hard to read.

**Plan:** use the existing copper analysis tokens for diagnostic and simulation
inspection surfaces. Keep service names/icons for recognition, but do not recreate
entire third-party navigation shells. Use the science grid quietly in open areas,
never behind dense prose, tables or message text. Retain the global product bar.
Theme shared surfaces first, then tune each reader; do not add another override
layer over every old inline colour.

Sources: `src/styles/analyse.css`; `src/app/pages/EngramPage.tsx`;
`src/app/pages/SimulationWorldPage.tsx`; `src/styles/simulation-visual-overview.css`.

### 2. Some destinations do not fulfil the promise of their labels

**Observed:** Analyse Timeline opens a workspace-memory dialog with "no session"
and "Click any entry to jump to that message in the chat." Debug says "Send a
message" although the Analyse screen has no message composer. Both consume
workspace store state. Simulation shows "Overview" and "Overview Old" together.
Jira has Board and Timeline buttons with no handlers; Messages has call/options
buttons with no operational function in read-only inspection.

**Plan:** make Timeline/Debug entry context explicit and provide a valid existing
record/session path. Use an Analyse-specific reader or adapter; do not rewrite
Workspace. If required saved data is absent, present that limitation with a useful
route rather than an apparently broken viewer. Remove no-op controls. Move the
legacy overview out of primary navigation while retaining its route during the
comparison period. Use native links for destinations and buttons for local actions.

Sources: `src/app/pages/AnalysePage.tsx:65`;
`src/app/components/workspace/MemoryTimeline.tsx:146`;
`src/app/components/workspace/DebugPanel.tsx:116`;
`src/app/components/analyse/AnalyseShell.tsx:46`;
`src/app/pages/SimulationWorldPage.tsx` (`JiraPortal`, `ChatPortal`, main navigation).

### 3. Meaningful evidence often starts below the first viewport

**Observed:** Feedback, Goals and Tool Learning put large controls/introductions
above readers. In Goals, a long goal fills most of the narrow list column. AI Usage
stacks many quota tiles inside a dialog. Simulation overview spends the first
screen introducing a generic teammate–bot–tools diagram before actual activity.

**Plan:** one purpose sentence, one compact primary toolbar and a content-led first
viewport. Summarize controls when a reader is open, without making search hard to
recover. Use faithful excerpts in the list and full text in the reader. Keep detail
where it answers the current question; do not collapse all content indiscriminately
or reduce font size to make it fit.

### 4. Context and time are inconsistent across evidence

**Observed:** Questioning labels simulation timestamps explicitly, while Goals,
Feedback and Tool Learning show dates without the same clock distinction. Engine
Jobs repeats human time plus raw ISO time in each row. Working Memory's origin
line exposes a long chat UUID. Tool Learning repeats a full simulation run UUID
on every tool row. A direct reload inside Simulation shows "App Sapien: Choose a
Sapiens" while the run is correctly bound to 65; returning to Analyse then asks
for a selection, with picker copy that says it will open Workspace.

**Plan:** a reusable compact origin/clock display, with exact technical values on
demand. Show an explicit simulation scope when the record establishes it. Keep
event time, observation time and real fetch time separate. Preserve the run's fixed
binding independently of global app selection; make return navigation/picker copy
match its destination. Do not broaden this into changing Workspace or auth rules.

### 5. Simulation's current story has gaps that presentation must acknowledge

**Observed:** the first two exchange diagrams showed "Response details unavailable";
"Why this action?" opened "No unique decision trace is available." Messages still
contained actual conversations, including Rashi asking Arjun about tenancy boundaries
and responding to his explanation. That does not establish a unique internal trace.

**Plan:** lead with a recorded conversation/action that can be opened immediately.
Use linked decision branches only when the API provides them. Otherwise show a
plain missing-link explanation and direct access to the surrounding recorded
conversation/activity; never connect by matching time or prose. Do not label a
Results link "Verified results" before a saved evaluation exists. Preserve all
unfavourable, missing and pending evidence.

**Source-only correctness concern:** `Evidence` in
`src/app/components/simulation/SimulationVisualOverview.tsx` currently uses a
truthiness check on `payload.is_error` to choose "tool reported success". Audit
the contract and handle true, false and unavailable separately; an absent flag
must not become a success claim. This was not observed on an opened live action.

### 6. Mobile and data volume need task-specific treatment

**Observed:** on mobile, Simulation People places the 23-person directory before
the selected detail. Connections starts with four large count tiles and multiple
tabs before the actual tool evidence. Rule progress renders 200 of 835 records as
large cards. The evidence timeline begins with repeated setup/seed events. Jira
uses the product sidebar, a Jira sidebar, an issue list and a details pane at once.

**Plan:** single list-or-reader navigation on small screens; restore list position
and focus on Back. Remove the duplicate Jira sidebar. Use compact rules/events
tables with purposeful filters and server pagination. Separate authored setup from
participant activity through explicit record categories, without deleting evidence.

## Page briefs and acceptance criteria

| Page / reader question | Focused implementation | Acceptance checkpoint |
| --- | --- | --- |
| Overview: where should I inspect? | Preserve grouped link directory; correct destinations and descriptions after page work. Minor spacing only. | All sections discoverable; valid native links and clear active state. |
| Awareness: what prompted this and what followed? | Remove repeated focus/summary prose. Lead with source, recorded understanding and action result; compact proposal/review/execution within their real phases. Retain full trace/graph. | No lost events, inferred causes, prepared-as-sent replies or successful-tool-as-complete labels. |
| Working Memory: what context is available? | Keep list/reader and current time fix. Replace raw thread IDs in the origin line with an honest readable label, retaining IDs in details. Reduce repeated labels. | Source and clock remain accurate; null times/activation remain unknown; workspace unchanged. |
| Engram: what was retained and how is it connected? | Make Browse the primary memory reader; statistics secondary. Use shared tokens, readable provenance and related-memory excerpts. Support returned working/procedural types as well as existing ones. Keep Entities/Recall/Graph as focused modes. | All actual types selectable; unknown types safe; related records identifiable; graph has legend and list alternative; URL preserves mode/record. |
| Goals & Plans: what is it trying to achieve? | Keep current design, shorten only list excerpts. Compact selected-goal toolbar and combine unavailable assessment/context lines instead of empty panels. Preserve actions and full text. | No inferred completion; long titles usable; missing plan honest; no goal mutation during review. |
| Questioning: what question was investigated? | Keep list/reader. Lead detail with the question and latest understanding; source beside it when available. Move audit metadata out of the top stack. Compact dates and repeated engine label. | Answer assessment not presented as verified fact or sent message; exact source retained. |
| Curiosity: what information gaps are recorded? | Reuse inquiry reader with its distinct purpose. Replace empty table headers, breakdown and disabled paging with a compact empty message and relevant filter reset. | Empty, filtered-empty and unavailable request distinct; no claim the engine is disabled. |
| Feedback: what did an experience suggest? | Compact master/detail with interpretation, prior action and later evidence. Keep observe-mode status visible once. Replace generic event codes with verified readable labels. | Possible lesson not applied learning; confidence not measured accuracy; truncated evidence marked. |
| Tool Learning: which service/tool, what lesson? | Keep all-service selector. Lead rows with service, exact tool, a saved-guidance excerpt where supplied and lesson count. Human-readable scope; full ID secondary. Bring lesson reader higher. | Services cover all pages; no fabricated preview; guidance/usage/effectiveness kept distinct. |
| Engine Bus: which signals were delivered? | Add a short purpose line and a useful clear/widen-range action. Compact signal rows with publisher → recipient, publication and delivery state. | Local time filter scope explicit; publication complete not delivery proof; correlations exact. |
| Engine Jobs: what ran or is waiting? | Lead with readable job/action and state. Keep failure evidence nearby; move repeated IDs/ISO/budget details into selected record. Engine picker from complete supported scope, not current page only. | Simulation scheduling not judged against wall time; no loss of failures/eligibility. |
| Timeline: which session/event history? | Fix context first. Provide an explicit session/source choice using supported reads, or link to the existing appropriate reader. | Works when opened directly without an earlier Workspace visit; no misleading empty session. |
| Debug: what recorded diagnostic is available? | Show source/session requirement and available trace selection, retain engine/latency/raw modes where supported. Style an Analyse adapter. | No instruction to perform an unavailable action; no new core execution. |
| AI Usage: how much quota is consumed? | Compact rows for tiers, clear Sapien vs shared pool; model/embedding distinction remains visible. Keep history and purpose breakdown secondary. | UTC reset date clear; quotas unchanged; not described as financial cost. |
| Simulation Lab: inspect a run or set one up? | Current run/retained history first, setup secondary when a run exists. Compact run identity, clocks and controls; shared theme. Distinct loading/empty/errors. | Existing start/pause/stop safeguards preserved; no zero/empty flash while loading. |
| Simulation overview: what is this run showing? | One-line scenario/role and actual recent evidence before generic illustration. Linked actions where available, useful surrounding-record path when not. | First screen shows meaningful evidence; no invented decision/outcome links; one primary overview. |
| Test case: what was planned? | Keep brief/people/backlog/evaluation tabs. Make role/mission visible without opening several disclosures; counts compact. | Clearly authored expectations, not results; all scenario data preserved. |
| Messages: who spoke and what was said? | Keep readable threads; remove dead call/options controls. Direct/channel switch visible; compact list, selected thread fills reader. | Sender/recipient/time clear; no chat composer implied; exact reply links only; small-screen Back works. |
| Jira: what project evidence exists? | One issue list and reader; Issues / Sapien actions / Notifications as useful modes. Remove duplicate faux Jira navigation. Put meaningful issue context ahead of empty metadata. | Setup/world changes not credited to Sapien; notification not action; read-only state retained. |
| Sapien journey: what happened in order? | Compact activity timeline, real actor/service/action labels, choose chronological/recent order where supported. Summary + selected evidence instead of large repeated cards. | Pagination, exact reply/operation relations and action outcome distinctions retained. |
| Results: what has actually been evaluated? | Show run/evaluation state first. Seven pending checks should not resemble a finished scorecard. Readable expected/observed/evidence rows; direct evidence access where resolvable. | Pending/failure/partial distinct; no client-side grading; saved verdicts unchanged. |
| Diagnostics directory | Compact links to specialist views with clear audience. | Technical tools stay available but do not dominate ordinary inspection. |
| Evidence timeline | Recent/chronological choice, actor/category filters and compact rows; explicit setup category. | Stable watermark/cursors; no hidden deletion or inferred causality. |
| Rule progress | Phase/status/issue filters and compact rows; show recorded vs not-yet-recorded conditions. | Waiting/unavailable not labelled failed; no changes to rule evaluation. |
| People | Compact directory + role/context reader; direct recorded conversation/issue links where IDs support them. On mobile, selected person replaces list. | Subject of counts unambiguous; no organization/authority inferred from prose. |
| Connections/tools | Tool/service reader first, counts inline; distinguish configured tools, environment calls and Sapien calls. Avoid duplicate World tabs for already available destinations. | Configured connection not claimed as authorized access; caller and result provenance retained. |

## Data-contract findings

Read-only backend inspection established several useful boundaries:

- **Engram types:** `sapiens/api/engines/engram/views.py:list_units` accepts a
  `memory_type` filter rather than enforcing the frontend's four-value union.
  Live data includes `working` and `procedural`. Update frontend display/types and
  use complete stats categories with a safe unknown fallback. This does not require
  changing the memory engine. The frontend already has `engramService.batchUnits`
  for bounded hydration of related-memory labels; check access/scope before reuse.
- **Tool lesson preview:** `ToolLearningInspection.profile` returns lesson count
  in list rows, but includes lesson bodies only for detail. This explains the live
  "View 1 saved lesson" placeholder despite useful detail guidance. Candidate:
  additive, redacted `lesson_preview` on the list contract, with explicit truncation,
  rather than an unbounded request per row. The complete service selector currently
  scans all pages; a scoped read-only service facet endpoint is an optional later
  optimization, not a reason to regress to current-page services.
- **Simulation story:** `simulation_suite/api/story.py` distinguishes missing,
  non-unique and linked records. Present its reason codes in reader-friendly copy.
  Do not relax exact matching to make the diagram look complete. Whether the missing
  links reflect retention or another source issue needs a separate backend diagnosis.
- **Clocks and snapshots:** simulation world contracts distinguish simulated
  `occurred_at`, real `observed_at` and the sequence watermark `through`. Runtime
  status can be current while displayed evidence is pinned. Show that distinction.
- **Results:** inspection APIs expose saved evaluation availability and reason.
  Use these rather than making a new judgement from counts, elapsed time or a
  participant's self-assessment. Historical diagnostic totals are not current
  blockers or unique bugs.

Backend references are in `D:/Repo/my-memory-keeper`:
`sapiens/api/engines/engram/views.py`,
`sapiens/api/engines/tool_learning/inspection.py`,
`simulation_suite/api/story.py`, `simulation_suite/api/README.md`, and
`simulation_suite/api/WORLD_API.md`. No backend files were edited.

Before any proposed API edit: confirm consumers, authorization, redaction,
pagination, simulated-vs-real clock and backward compatibility; add a contract test.
No core inference, retrieval ranking, learning application, grading, persistence
or runtime changes belong in this presentation pass.

## Implementation order

1. **Establish the verification baseline.** Update stale tests to the current
   contracts, preserving their intent. Introduce only necessary shared display
   primitives for origin, clock, status and reader navigation. Fix unsupported
   success wording and no-op controls when touching the relevant page.
2. **Simulation overview and shell.** Highest demo impact: context, consistent
   theme, one overview, readable run binding and direct access to actual evidence.
   Review this page before propagating its layout.
3. **Simulation Messages and Jira.** Make actual interactions/actions easy to
   inspect at desktop and mobile widths. Then refine Journey and Results using
   the same evidence vocabulary.
4. **Engram.** Complete the theme migration and content/relationship reader.
   Follow with targeted Working Memory/Goals refinements, not another full rewrite.
5. **Feedback and Tool Learning.** Make learning evidence discoverable while
   keeping observe-only findings and saved/used guidance distinct.
6. **Remaining investigation pages.** Awareness presentation only; Questioning,
   Curiosity, Engine Bus/Jobs, contextual Timeline/Debug and compact Usage.
7. **Simulation specialist screens and final pass.** Test case, diagnostics,
   rules, people, connection evidence; then cross-page walkthrough and states.

Each item is a reviewable page change, not one giant commit. Do not start localhost,
commit, push or deploy merely because the next plan item is ready. Follow the user's
explicit instructions for those operations.

## Coding approach

- Reuse `AnalyseShell`, `AnalyseControls`, `DiagnosticPrimitives`, current navigation
  and context readers. Inspect their exports before designing new abstractions.
- Reuse shared copper token definitions for simulation inspection through a scoped
  wrapper. Avoid copying the palette into every component. Do not alter global
  colours for the excluded pages.
- Split `SimulationWorldPage` into shell and page readers as each is changed;
  separate `SimulationLabPage` setup, run state and inspection UI when touched.
  Preserve requests, polling, validation and lifecycle guards in those extractions.
- Keep typed, pure presentation helpers independent from React fetching/rendering.
  Use request identity/cancellation guards and stable snapshot pagination. Formatting
  cannot turn unknown data into an invented status or normalize away provenance.
- Use URL state for mode/selected record/filter where useful; restore focus and
  scroll on return. Keep the run's fixed identity independent of the app's selector.
- Render real excerpts, not newly generated summaries of private records. Keep
  complete content and technical evidence accessible. Do not put infrastructure IDs
  in the primary reading path when a meaningful recorded label is available.
- Keep changes scoped; remove superseded code after replacement is verified.
  Preserve explicit experimental routes until their retirement is agreed.

## Baseline checks and known test debt

Run during this documentation/audit pass, without a server:

| Check | Result |
| --- | --- |
| `pnpm test:analyse` | Passed; existing Analyse and Working Memory/Goals regressions |
| `node scripts/test-awareness-reader.mjs` | Passed; matching, evidence and uncertain-outcome checks |
| `pnpm test:navigation` | Failed at line 14: fixture calls `appDestinations(true)` although the implementation now takes a separate `analysisAccess` argument. Update fixtures/permission cases; do not change permissions to satisfy the old assertion. |
| `node scripts/test-awareness-analysis.mjs` | Failed at line 22: script imports `runSteps`, no longer exported by the current presentation module. Rewrite around the current diagnostics contract while retaining intent. |

The two failures predate this pass's documentation edits. Neither establishes a
production permission bug by itself. No production build was run for docs-only
changes; a build and relevant tests are required for each application change.

## Definition of ready for review, then demo

For every changed page:

- [ ] Purpose, record meaning and next action are understandable without internal knowledge.
- [ ] Selected Sapien/run, source identity, evidence scope and clock are clear.
- [ ] Primary content is visible without navigating through several empty panels.
- [ ] Every visible control works or is deliberately disabled with a clear reason.
- [ ] Dark/light, narrow/desktop, keyboard focus and open/back navigation reviewed.
- [ ] Loading, empty, filtered-empty, long/partial content, failures and stale responses tested.
- [ ] Relevant tests, type checks available in the repo, and build pass; baseline failures tracked honestly.
- [ ] No Workspace/homepage/directory or core backend behaviour changed unintentionally.
- [ ] User review recorded; deployment remains a separate requested step.

Final walkthrough: enter Rashi's run, understand the scenario/role, open a recorded
conversation, inspect an actual action, inspect retained understanding or guidance,
and see the saved evaluation state. Link only records with supported relationships.
If a learned lesson's later use is not recorded, say so. Do not manufacture the
experience → learning → changed-action chain to complete a demo narrative.

Remaining review coverage includes finalized/archived runs, error recovery,
long-run pagination, all Engram modes, complete keyboard/mobile coverage and both
themes on every changed page. The current running run with seven pending checks
is evidence for presentation review, not proof of final demo readiness.

## Implementation: Simulation overview and navigation — 30 October 2026

### Follow-up: retire Overview Old — 31 October 2026

- Reader/task: an admin inspecting a simulation should have one overview, while
  retaining useful recorded assessments and failure details from the duplicate page.
- Comparison: the current overview already covers the setting, participant role,
  exchanges, timeline and check verdicts. The old page additionally exposed assessment
  explanations and run reasons; its other panels duplicate existing destinations.
- Removed Overview Old's navigation, rendering branch and dedicated helpers/code.
  Old bookmarks fall through to the existing overview redirect, preserving query/hash.
- Kept the current overview's design and guided story. Check rows in its existing
  Timeline & results disclosure now expand to show the saved explanation and any
  recorded missing actions. A compact run-detail line appears when a reason is recorded
  or the run failed. Familiar Messages (Teams), Jira and Results & evidence links remain.
- No new data requests or backend changes; Journey and Results implementations remain.
  Acceptance checks: removed exports/imports and links, old-route redirect, missing
  explanations, absent/failed run details, retained evidence, build and Analyse tests.
  Both themes use the existing variables; disclosures have native keyboard controls,
  visible focus and wrapping. Browser verification remains pending; no server/deploy.
  Production build, Analyse tests and isolated renders of the migrated assessment/
  run-detail components passed, including missing, long and failed-record cases.

**Reverted locally at the user's request on 30 October 2026.** The implementation
described below is historical, not the current working version. Restored Simulation
World's overview, navigation and styling from the parent of `f8098b42`, including the
previous overview route. Removed the new shell, record reader, request/model helpers,
styles and their implementation-specific test. Analyse's existing copper palette is
unchanged; its token definitions are back in `analyse.css`. The audit and AGENTS.md
guidance remain, and the separate Engram stash is untouched. No deployment requested.
Rollback verification: production build and `pnpm test:analyse` passed. Restored
Simulation sources match the earlier version (apart from a trailing blank line
cleanup); removed modules have no remaining imports. No browser preview was started.

Review feedback: this is the first implementation step, not completion of the
Analyse/Simulation audit. The new overview layout is not visually approved.
Keep the concrete workplace destinations **Jira** and **Messages (Teams)** in
navigation, headings and overview links; replacing those names with generic
labels made the simulation's purpose less clear. Label correction is local only.

### Page brief and design decision

- Reader: an admin or first-time demo viewer inspecting Sapien 65's simulation.
- Primary question: what did this Sapien actually receive, say or do in this run?
- Primary action: select a saved record, then open its conversation, project board,
  activity history or evaluation when more context is needed.
- Friction: generic introduction occupied the first viewport; missing unique story
  links looked like absent activity; navigation repeated two overview destinations.
- Available evidence: existing read-only overview, specification, descending journey
  and exact story-link APIs. No new API or core behaviour changes.
- Reading order: purpose and assigned role → compact workplace links → recent
  records with an adjacent reader → scenario context and saved-evaluation availability.
- Palette: existing copper base #1e1916, panel #30251f, text #ebe2d5,
  muted #bdb0a3 and accent #deb580; established light equivalents. Source Sans 3
  for records/controls; Source Serif 4 for selected headings. Left-aligned content.
- Layout: a record list and reader, not a step-by-step illustration that depends on
  missing causal evidence. Mobile opens a reader with an explicit Back to activity.
  No decorative motion or new imagery; the faint shared grid remains secondary.

### Implemented

- Extracted SimulationShell with grouped destinations, visible run/Sapien identity,
  mobile section navigation and compact run details. Native links retain the run,
  known identity and valid return path. Existing workspace-opening component retained.
- The current working copy also removes the legacy overview implementation. Navigation
  has one overview, with no links to removed code. Old URLs use the existing unknown-
  section redirect to the supported overview.
- Replaced the generic opening diagram with the real recorded-activity list and
  reader. Sender/recipient or actor/service/issue are visible; long saved text can be
  expanded. Tool requests are readable fields; raw evidence remains accessible.
- Decision traces load on demand for incoming participant messages. Missing and
  ambiguous links do not invent a response; direct links lead to conversations and
  activity. Linked actions remain distinct from proven completion.
- Tool outcome requires an explicit boolean result. Unknown is not success.
  Multiple deliveries of one message are grouped by its ID while all delivery
  evidence remains available. Text or timestamp proximity never creates links.
- Evidence pagination retains its snapshot and uses the server's descending cursor.
  Refresh failures retain loaded records; run switches abort stale requests.
  Missing selected records are explained rather than silently replaced.
- Extracted the existing Analyse palette into inspection-theme.css. Analyse retains
  its original values; Simulation opts in inside its own shell. Global product
  navigation and excluded product screens retain their theme.
- Reused Button, DiagnosticText/Badge/Disclosure and OpenRunWorkspace. Source modules
  separate shell, overview, record reader, request state and presentation helpers.

### Verification and remaining review

- pnpm test:simulation: passed. Covers actual component render trees/handlers, missing,
  error and partial records, message grouping, unknown/failed/successful tool outcomes,
  selection/back controls, mobile-menu handlers, supported destinations, return
  context, pinned pagination, refresh failure and stale responses after run changes.
- pnpm test:analyse: passed after shared-token extraction.
- pnpm run build: passed; existing large-chunk warning remains. No type-check script
  is configured; transpilation/build is not a full TypeScript check.
- Required skill review: source checked for visible focus, labelled controls, native
  links, heading hierarchy, responsive list/reader, both theme token sets and truthful
  clock/result labels. No new animation requiring reduced-motion handling was added.
- No localhost server, deployment or live record mutations. Browser visual review of
  this implementation (desktop/mobile, both themes and keyboard) is pending until
  a preview is authorized. Static rendering is not visual verification.
- Global app destination selection, Simulation Lab and individual subpage readers
  are subsequent tasks. Their legacy hardcoded colours/layouts still need review;
  this change does not claim the whole Simulation area is finalized.
