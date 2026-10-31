# Analyse and Simulation readiness review

Latest review: 31 October 2026. Status: **Feedback table and evidence reader implemented locally; updated UI browser review pending**.
Reference: Rashi, Sapien **65**. The Simulation redesign was reverted; its legacy
overview was subsequently removed. Engram remains stashed for later review.
The initial 30 October audit used local baseline `cd09dea5`; implementation entries
below are historical and must be read with their rollback notes.

This record works alongside [AGENTS.md](../AGENTS.md). It is a flexible, page-by-page
plan, not a requirement to give every page the same layout. The initial review changed
documentation only. The implementation record below tracks subsequent application
changes. No backend behaviour, production records or simulation controls were
changed; localhost and deployment remain off unless requested.

## Current plan: table-first Analyse review, 31 October 2026

**Implementation order updated by the user:** Feedback first, ahead of Awareness.
Page brief: an admin reviewing Sapien 65 should be able to compare saved feedback
findings and open the original evidence. The current split view repeats long prose
and automatically selects the first record. Use a full-width table with interpretation,
recorded experience/source, state and creation time, then a focused detail dialog.
Keep the mode explanation, multi-state filtering, paging, supporting evidence and
background diagnostics. Use only existing feedback response fields; no API or engine
changes. Retain --an-* copper tokens (dark #1e1916 / #30251f / #ebe2d5 / #deb580;
light #efede7 / #faf8f2 / #352e29 / #874a2b), Source Sans 3, left-aligned evidence
and quiet separators. Acceptance: no automatic reader, full evidence on click,
filter/page/scroll preservation, keyboard return, accurate missing/truncated states,
no stale records on Sapien or filter changes, and no claim that a possible lesson
was applied. Localhost and deployment remain unauthorized.

This plan supersedes the earlier implementation order. Keep compact tables or aligned
record rows as the primary view, opening one record for full details. Preserve the
copper palette, shared navigation, scientific grid and existing useful explanations.
Do not replace these with dashboard cards, a permanent split pane on every page,
or another round of generic collapsible sections. Feedback is first, Awareness follows;
Engram is last.
Simulation, Homepage, Workspace and Your Sapiens are outside this change.

### Feedback implementation, 31 October 2026

- Rechecked the deployed Feedback page for Rashi #65 in the in-app browser: 12
  findings; opened Mei's clarification and its saved activity/experience evidence.
  This was a review of the existing UI, not a preview of the implementation below.
- Replaced the paragraph list and automatically selected reader with a semantic
  table: recorded interpretation, earlier activity, later experience, finding state
  and recorded time. No record is selected automatically. Explicit display fields
  supply people/service/tool labels; nothing is inferred from the interpretation.
- Open an interpretation in the shared accessible dialog. It preserves full saved
  wording, paired evidence, supporting references, truncation notices and technical
  records. Previous/next stays within the returned page. Closing restores focus and
  the list position; URL state retains filters, page and selected finding for this Sapien.
- Kept multi-state filtering, page size, refresh, background diagnostics and the
  existing read-only API. Observe mode and possible lessons remain distinct from
  applied learning. Missing counts are not displayed as zero; event, observation
  and record timestamps retain their separate meanings and include timezone.
- Reused AnalyseControls, DiagnosticPrimitives, Dialog, navigation memory and copper
  tokens. Extracted typed presentation helpers and the evidence reader; removed the
  obsolete split-layout JSX and responsive CSS. No shared workspace or engine changes.
- Checks: `pnpm test:analyse` passes, including table/reader selection, preserved
  scroll/focus callbacks, filters, paging without a total, missing/deep-linked records,
  evidence escaping, truncation, timestamps and stale-response isolation. Production
  Vite build passes with the existing large-chunk warning. These are code/render tests,
  not visual or end-to-end browser approval.
- `pnpm test:navigation` has an unrelated baseline failure: its first admin menu
  assertion calls `appDestinations(true)` without the required `analysisAccess` argument.
  Both that test and the permission helper are unchanged from HEAD. They were not
  modified to make the Feedback check pass.
- Still pending: visual review of the new UI at desktop/narrow widths in both themes,
  real keyboard/focus/scroll behavior, and live integration of the new presentation.
  Localhost was not started, and nothing was committed, pushed or deployed.

### Evidence from this pass

#### Feedback reader follow-up: Sapien 66, 31 October 2026

Implementation brief approved in the next turn: preserve the table and its controls;
redesign only the opened finding and simplify Feedback explanations. Reader: an admin
unfamiliar with engine terms. Primary question: what events were linked, what changed,
and what did Sapiens conclude? Reading order: compact source-specific title, original
events with visible messages/request fields/results, saved interpretation, then extra
context and technical records. Tools, conversations, domain updates and mixed/missing
records need distinct presentations. Use the existing copper tokens (#1e1916,
#30251f, #ebe2d5, #deb580; light equivalents unchanged), Source Sans 3, left-aligned
evidence and quiet dividers. No new cards, theme or animation. Compare only fields
actually recorded; never generate a new conclusion or infer people from prose.
Acceptance: multiple Sapien 66 examples, exact-reference deduplication, safe incomplete
evidence fallback, preserved raw records/navigation, clear observe-mode explanation,
automated interpretation/render checks and build. No server or localhost startup.

User requested inspection of an opened finding, overriding the reference Sapien for
this review. Reviewed the deployed page in the in-app browser, including a screenshot
of the dialog and its expanded original records. Rashi #66 had 31 findings. Opened
`c0a9d267-67ba-596d-af92-6a1a3bb976c1`: failed Teams chat creation followed by a successful
retry with Ben. No production actions or data were changed.

Observed issues:
- The generic dialog header/navigation consumes a large part of the visible area.
  A long recorded interpretation appears before the reader can understand the events.
- Both evidence columns say Teams / create chat, then status and time. The decisive
  facts are hidden in technical details: the earlier request has an empty recipient
  roles array; the retry supplies owner for both members; the earlier error explicitly
  requires owner role and user binding. The retry reports success. These facts can
  be presented without inventing a lesson or causal explanation.
- `FeedbackFindingDetail.tsx` deliberately suppresses tool text when display text
  equals stored content, leaving only a sentence directing readers to technical
  details. Metadata alone contains truncated members, while saved event text contains
  the fuller request/result. A future reader must handle both honestly and avoid
  parsing malformed or shortened text as complete evidence.
- Supporting evidence repeats the exact retry reference
  `activity:e2b016ba-71a4-4fde-86ef-f100ff42b466`; the other supporting record is Marcus's
  earlier instruction about whom to contact. Repeating the retry obscures the useful
  context. Deduplicate by exact reference, retaining access/count scope explicitly.
- "Not evidence that behavior changed" is too broad for this record: the request
  visibly changed. Observe mode means this feedback finding was not applied; it does
  not mean the recorded activity could not change. Keep that distinction precise.

Proposed next brief: keep the table; make the reader lead with the concrete source
events and their outcome, followed by Sapiens' recorded interpretation and additional
context. For two tool attempts, compare meaningful request fields and reported results;
for a message/reply, show the exchange and explicit participants. Do not force every
finding into a retry comparison. Keep raw records, confidence and infrastructure IDs
secondary. Preserve the copper tokens, typography, focus return and paging. Accept only
exact field/reference-based presentation, safe truncated-data fallback, and a clear
distinction between observed changes and feedback being applied. No application code
was changed during this follow-up review; mobile/light theme remain unreviewed.

#### Feedback reader implementation: Sapien 66, 31 October 2026

- Implemented the approved reader change; kept the findings table, columns, filters,
  pagination, selection, focus return and URL state unchanged. Simplified the page
  purpose, mode explanation, empty-state instructions and background-review wording.
- The compact dialog leads with saved events. Messages show the recorded participants
  and message text; tool actions show requests, returned fields/entries and errors;
  progress updates show the recorded state and description. The saved conclusion follows,
  without generating a new summary. Mixed/unknown/missing records retain readable
  fallbacks and all original data remains accessible.
- Matched tool requests get a comparison of differing saved fields. Member roles are
  matched by exact user IDs, including reordered arrays, with names from structured
  returned members. No people or causal relationships are inferred from prose. Exact
  repeated references/snapshots are displayed once; all references remain in raw details.
- Read backend serialization/presentation code to verify the canonical tool envelope
  and domain update format. Only complete JSON fragments are parsed; incomplete JSON
  is never repaired. Existing redaction and truncation are preserved. No backend or
  API changes were made.
- Browser evidence: inspected Sapien 66's Isha message/reply and onboarding progress
  findings, plus the previous turn's Ben chat retry. These were the deployed baseline,
  not the new code. Applied both required skills and fresh Web Interface Guidelines.
- Verification: `pnpm test:analyse` passes with added tool-retry, exact-ID matching,
  duplicate-reference, conversation, progress/mixed/unknown, structured-result, uncertain
  outcome, incomplete JSON, conflicting-identity, zero/false and escaping checks. The
  existing navigation/filter/loading/error/stale-response checks still pass. Build passes
  with the existing large-chunk warning; `git diff --check` passes.
- Pending: browser review of the updated implementation at desktop/narrow widths,
  both themes and real keyboard/scroll interactions. No localhost started or deployment
  performed, as requested. Engram stash and unrelated pages remain untouched.

#### Original table-first review: Sapien 65

Used the authenticated live site in the in-app browser, with **Rashi #65 selected**,
and inspected the corresponding frontend components/types. Applied frontend-design
and the freshly fetched Web Interface Guidelines. Desktop observations used a
1440 x 900 viewport; Awareness was also observed at the browser's narrow width.
The viewport override was reset afterward. These are observations of the deployed
UI, not proof that every local source file matches the deployed build.

| Page | Observed live | Main friction |
| --- | --- | --- |
| Awareness | 92 saved runs; opened Isha's colleague-outreach run, 38 steps, 25 recorded tool actions; expanded the Teams list-users result | The request repeats in the title, focus and assessment. Important action results sit below repeated prose. Many rows say "An external action finished". Expanding a structured directory result exposes JSON first. |
| Working Memory | 25 returned records, with origin, activation and absolute time | Good aligned layout. Long Teams chat IDs crowd the origin column; three-line excerpts plus tags make rows tall. Preserve factual source and timing distinctions. |
| Goals & Plans | Three open goals; opened the Jira SD-1–SD-32 review goal | Existing row/reader navigation works. Selected goal has no plan, assessment or context, each occupying its own section. Source is available in the model but not prominent in the list. |
| Questioning | 15 records; opened the assessed kickoff-readiness answer | Table is useful. "awareness engine" names the producer, not the underlying person/context. Detail puts several metadata lines and a missing-context panel before the answer. |
| Curiosity | Zero returned records with all states selected | Empty table headers, breakdown and disabled pagination add noise. No populated record was available to visually review. |
| Feedback | 12 findings; inspected Mei's recipient clarification and before/after evidence | Long paragraph previews in a narrow list beside the full reader duplicate content and make findings hard to compare. Observe mode is correctly distinguished from applied learning. |
| Tool Learning | 25 profiles; all-service selector includes connections, Jira and Microsoft Teams; opened Teams list-users lesson | Service selector works. List repeats full simulation-run IDs and "View 1 saved lesson" instead of guidance, while detail has useful guidance, conditions and limits. |
| Engine Bus | Last hour: 0 shown of 1 loaded; last 24 hours: one owner-introduction signal, with two delivery records | Empty state needs a direct wider-range action; time-only list labels lose the date. Keep publication and individual delivery status distinct. |
| Engine Jobs | Error state; one read-only retry did not recover | Populated rows could not be reviewed live in this pass. Table/detail plan is based on source, not a successful live response. Diagnose the read failure before claiming this page verified. |
| Timeline / Debug | Timeline opens "no session"; Debug says to send a message | These still depend on workspace session state. Selecting Sapien 65 alone does not establish a conversation. They need a clear scope/entry path before visual polish. |
| AI Usage | Populated quota dialog; Sapien and shared-global accounting are distinguished | Repeated quota cards make the dialog long. Preserve UTC date, scope and call-type distinctions in any compact comparison. |

Counts are a review snapshot, not fixed totals. Several records use simulation dates
later than the browser clock; this alone is not a timestamp bug. No production data,
jobs, feedback, goals, conversations or simulation state were changed.

### Shared interaction decisions

- A short purpose line, compact controls, result scope/count, then the table. Keep
  commonly used search/status/service/time controls immediately visible; secondary
  filters may expand. Do not bury essential filters or add a new filter to every page.
- Each table has a wide meaning column, recorded origin where available, a small
  number of useful status/time columns and a clear record-opening affordance.
  Use real table headers where the content is tabular. Keep readable text sizes;
  reduce repetition and padding before shrinking text.
- Use approximately two lines for long list excerpts, with the complete saved text
  in the reader. Do not invent short titles or generated interpretations. Full IDs
  belong in copyable technical details, with useful service/person/issue fields first.
- Standardize record opening, visible Close/Back, keyboard focus and restoring the
  same filters, page and scroll position. Keep one reader open at a time. Add previous/
  next record navigation within the currently loaded result set where it helps.
  Deep links and browser Back should retain the selected Sapien and scope.
- Details may use chronological rows, a small evidence comparison or structured
  fields as appropriate. Do not force all detail content into another wide table.
- Use recorded origin metadata and exact references. A shared engine name is not a
  sender. A run UUID should be labelled as simulation scope; resolve a friendly run
  name only when available. Do not infer people, outcomes or links from text similarity.
- Keep counts/search bounds explicit. Full-service choices must continue to cover
  all saved pages. Missing context, empty results and read errors remain distinct.

### Next implementation: Awareness

**Reader:** an admin inspecting Rashi's behaviour. **Primary question:** what prompted
this run, what did Rashi understand, and what actually happened? **Primary action:**
choose a run, inspect its evidence and return to the same place in the table.

**Available data:** run/source/focus/assessment fields, saved understanding, ordered
steps and exact matched action arguments/results. The existing renderer already
distinguishes exact/ambiguous matches, activity records, raw results and truncation.
Preserve those distinctions. No new backend logic is needed for this first pass.

1. Keep the current table. Refine headings to **Situation**, **Source / person**,
   **Run state**, **Sapien's assessment**, **Tool actions**, **Started**. The last two
   status concepts must stay separate: finished processing does not establish a
   completed task, and a task assessment does not establish a Jira issue's status.
2. Keep a compact reader header with source, recorded time and status. Show the
   original input and saved understanding without repeating the full focus in the
   title, focus panel and assessment. Preserve distinct saved passages when they
   contain different evidence; reduce rendering duplication, not stored meaning.
3. Make **Recorded actions** easy to scan: action, service/target when recorded,
   reported result and time. For example, show **Teams · List users — tool reported
   success** instead of only **An external action finished**. Known structured
   results become readable fields or a small directory table; raw JSON stays available.
4. Open an action for its exact inputs, result and recorded reason. Preserve errors,
   rejected proposals, reconsiderations and waiting decisions in the accessible full
   trace, retaining event order. Prepared messages must never look like sent messages.
5. Put the recorded assessment and remaining work together. Keep context, original
   source snapshots, full decision trace and technical identifiers available without
   requiring them to read the primary account. No fabricated causal flow or summary.

**Acceptance:** the Isha outreach run must show that 25 tool actions reported success
while the work remained in progress. A multi-action run, a no-action run and a failed/
unresolved run must all remain understandable. Validate exact vs ambiguous action
matching, missing/truncated evidence, long tool results and preserved step access.

### Following pages: brief and reading order

The reader remains an admin inspecting saved evidence; the primary action remains
opening a record unless noted. These are incremental proposals, not approval to
implement every page at once.

| Order / page | Primary question and table contents | Open-record reading order and available-data limit | Page-specific acceptance |
| --- | --- | --- | --- |
| 2. Questioning / Curiosity | What question or gap was recorded, where did it arise, and what is its assessment? Keep question, origin/producer, assessment and recorded time visible. Move the job link to related evidence if it improves the table. | Question → available source context → saved understanding/outcome → related job and technical facts. Treat missing context as a concise note rather than a large empty panel. Preserve distinct Curiosity selection/review fields. | Generated, selected, asked and delivered remain separate; no inferred delivery. Empty Curiosity view has refresh/filters without empty breakdowns or useless paging. Populated Curiosity needs fixtures or another authorized recorded example. |
| 3. Feedback | What possible lesson was identified and from which experience? Use a full-width table: interpretation excerpt, source/service when supplied, finding state and time. | Interpretation → what Rashi did → what happened afterward → evidence limits. Preserve existing before/after evidence but open it on selection, avoiding the permanent paragraph-heavy split view. | Observe-mode findings never appear as applied learning. Actual action result, later feedback, model confidence and truncated evidence retain separate meanings. |
| 4. Tool Learning | Which service/tool has learned guidance? Preserve the all-pages service selector; align tool, guidance preview when supplied, lesson count, scope and update time. | Keep the useful existing lesson, conditions, limits, evidence, versions and guidance-use views. Label run scope as simulation, placing full UUID in details. The list response did not expose guidance in the observed UI, though the detail did. Confirm the API contract before promising a list preview; do not fetch every profile on every render or invent lesson text. | Service list remains complete across pagination; guidance is not tool documentation; consideration/use of guidance is not proof of successful execution. Any additive read-only preview API is a separately documented follow-up if needed. |
| 5. Working Memory / Goals | What context is available, or what goal is open? Retain the good row/reader foundation. Align goal state, plan availability and update time; reduce UUID/tag clutter in memory origins. | Memory: content → origin → activation/time. Goal: goal/status → available assessment/plan → context/history. Collapse multiple absent sections into a short truthful availability note; keep actions that change a goal distinct from inspection. | Activation is not confidence; focus is not a current thought. Missing plan is not zero progress. No recomputed lifecycle or completion logic. Workspace components remain unchanged. |
| 6. Engine Bus / Engine Jobs | What signal was passed, or what work ran? Bus: signal, producer/target, publication status, occurred time. Jobs: engine/action, state, scheduling eligibility, failures and creation time. | Bus: envelope → deliveries → actual correlation links. Jobs: origin/action → status/error → schedule/timing → raw payload. Resolve the live Jobs read error before visual approval. | Completed publication is not delivered work. Job completion is not goal success. Simulation due time stays separate from real audit/execution time. No execution/retry controls triggered by inspection. |
| 7. Timeline / Debug / AI Usage | Timeline/Debug: which conversation or saved execution is being inspected? Usage: whose quota, which call type and UTC period? | Establish an explicit supported session/record selection for Timeline/Debug; inspect current APIs before promising a Sapien-wide history. Usage may use compact tier rows, retaining small real usage bars, with purpose/history on demand. | No "send a message" requirement just to inspect existing evidence; no false zero-history claim when no session is selected. Usage never merges Sapien quota with the shared global pool or converts call counts into invented costs. |
| Last. Engram | Deferred by explicit user preference. | Existing stash stays intact. Revisit the stored-memory workflow after the pages above. | Do not pop or rewrite the stash as part of these changes. |

### Implementation and verification boundary

Use AnalyseShell, AnalyseControls, DiagnosticPrimitives, existing navigation/context
helpers and --an-* tokens. Reuse small presentation helpers for readable names, dates,
status, source references and common reader behaviour; keep page-specific meaning
out of generic components. Remove superseded UI code instead of hiding it.

Before completing each implementation, check desktop/narrow layout, both themes,
keyboard opening/closing and focus return, list position/filter retention, long text,
missing data, empty results, pagination, stale Sapien/run responses and refresh errors.
Use relevant presentation/navigation tests, type checks where available and build;
these do not replace browser review. No local server is authorized by this plan.

This pass reviewed representative live states, not every interaction or both themes
on every page. It changed documentation only. No implementation tests were run because
no application code changed; the Engine Jobs failure and populated Curiosity review
remain outstanding. Implement **Awareness only** as the next reviewable step after
the user approves proceeding.

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
