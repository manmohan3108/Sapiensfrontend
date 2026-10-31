# Analyse and Simulation presentation reference

Use this alongside [AGENTS.md](../AGENTS.md) when working on these screens. It keeps
agreed design decisions and data constraints, not task history, implementation status
or a mandated rollout order. Inspect the current code and the Sapien requested by
the user before changing a page.

## Reading and navigation

- Preserve the shared Analyse copper theme, scientific grid, typography and navigation.
  Keep Simulation's established design unless a theme change is explicitly requested.
- Keep useful tables for comparing records. Open a selected record for full details;
  do not force every page into cards, a permanent split pane or nested dropdowns.
- Start with a short purpose sentence and compact primary controls. Show meaningful
  excerpts, source/person/service when recorded, state and time. Keep IDs secondary.
- In details, establish what happened and where the evidence came from before asking
  the reader to interpret it. Keep original evidence and Sapiens' conclusion distinct.
  Adapt the reader to messages, tool actions, progress updates or other record types.
- Preserve filters, page, selected Sapien/run and return position. Use native links
  for navigation and an explicit Back/Close with keyboard focus return.
- On small screens, keep the selected record accessible without scrolling through
  the entire directory. Reduce repetition and padding before reducing text size.
- Keep familiar Simulation destinations such as **Jira** and **Messages (Teams)**.
  Use one overview; avoid duplicate navigation or controls with no supported action.

## Page-specific guidance

These are review considerations, not instructions to redesign every page at once.

| Page | Primary reading task | Details and evidence to preserve |
| --- | --- | --- |
| Analyse overview | Choose an investigation area | Grouped destinations with short descriptions; no duplicate live-status dashboard. |
| Awareness | Understand what prompted a run and what followed | Input/source, saved understanding, recorded actions and assessment. Preserve every step, failures, rejected proposals and uncertain action matches; avoid repeating passages. |
| Working Memory | See what context is available | Source, content and distinct activation/event times. Available context does not prove that it was used. |
| Goals & Plans | Inspect an outcome and its progress | Goal/source, state, current plan and recorded assessment. Distinguish completion from success; avoid large panels for absent data. |
| Questioning / Curiosity | Understand a question or information gap | Origin, question, saved context and assessment. Generated, selected, asked and delivered are separate states; an engine producer is not a person. |
| Feedback | Compare linked events and possible lessons | Show messages, tool requests/results or progress updates before the saved conclusion. Keep observe mode distinct from applied feedback. Deduplicate exact repeated evidence without losing raw references. |
| Tool Learning | Find guidance for a service and operation | Service selector must cover all result pages. Show guidance, conditions, limits, evidence and recorded usage; a saved lesson does not prove later use. |
| Engine Bus / Jobs | Inspect signals, delivery or scheduled work | Clear time window, compact records and relevant details. Separate publication/delivery and queue/execution/outcome; provide useful recovery for empty/error states. |
| Timeline / Debug | Inspect a specific conversation's records | Make session requirements explicit and provide a valid entry path. Do not imply that choosing a Sapien alone selects a conversation. |
| AI Usage | Understand recorded consumption and limits | Keep Sapien vs shared-global scope, call types and UTC reset date clear; usage is not a financial-cost estimate. |
| Simulation Lab / overview | Choose a run and understand its situation | Run identity, scenario, assigned role and accessible recorded evidence. Preserve lifecycle safeguards; separate inspection from execution controls. |
| Simulation test case | Read the authored scenario | Brief, people, backlog and expected checks are setup, not observed results. |
| Messages / Jira | Read an exchange or inspect an issue | Participant/service/issue context, original text and exact recorded links. Keep setup/world changes distinct from Sapien actions; avoid redundant third-party navigation shells. |
| Journey / evidence timeline | Follow recorded events | Preserve chronology, actor, category, snapshot and pagination. Order or nearby timestamps do not establish causality. |
| Results / rule progress | Inspect saved evaluation | Expected, observed and evaluated states; pending, partial and failed are different. Do not grade in the frontend or describe unevaluated results as verified. |
| People / connections / tools | Inspect participants and available services | Context before counts. Distinguish configured connections, authorized access, environment activity and Sapien calls. |
| Engram | Explore memory and recorded relationships | Support returned memory types, meaningful linked-memory labels, exact provenance and accessible graph/list alternatives. Preserve retrieval/ranking behaviour. |

## Data boundaries and implementation references

Use shared `AnalyseShell`, `AnalyseControls`, `DiagnosticPrimitives`, navigation
memory and existing context readers where they fit. Keep presentation helpers typed
and separate from fetching and rendering; do not rewrite Workspace to improve Analyse.

- **Origins and relationships:** use explicit source fields and exact record IDs.
  Never infer a person, delivery, causal connection or learned behaviour from prose.
  Unknown, missing, zero and not applicable remain distinct.
- **Time and scope:** retain event time, observation time and fetch time separately.
  Show timezone and simulation scope when supplied. Simulation's `through` watermark
  pins evidence even while runtime status changes.
- **Feedback records:** the backend supplies bounded, redacted snapshots. Tool-event
  text can contain fuller request/result fields than shortened metadata. Parse only
  the known serialization format and complete JSON; never repair cut records or
  discard truncation markers. Keep raw evidence accessible.
- **Engram types:** do not constrain rendering to a hardcoded four-type union; support
  returned categories and unknown values. Existing bounded batch hydration can supply
  related-memory labels without one request per row.
- **Tool Learning previews:** list counts and detail lesson bodies are separate data.
  If a preview is needed, consider an additive bounded field after contract review;
  avoid unbounded detail requests or current-page-only service selectors.
- **Simulation links and outcomes:** missing/non-unique decision links must remain
  honest. Use recorded conversations/actions even when their internal trace is absent.
  A missing error flag is not success, and tool success is not task completion.

Relevant backend contract sources, relative to the backend repository:

- `sapiens/api/engines/feedback/presentation.py` and
  `sapiens/engines/motor_engine/contracts/activity.py`
- `sapiens/api/engines/engram/views.py`
- `sapiens/api/engines/tool_learning/inspection.py`
- `simulation_suite/api/story.py`, `simulation_suite/api/README.md` and
  `simulation_suite/api/WORLD_API.md`

Recheck current consumers, permissions, redaction, pagination, clocks and compatibility
before proposing a frontend-facing API change. These references do not authorize
changes to intelligence, learning, scheduling, grading or simulation execution.

## Engine Bus scope and time

Engine Bus reads retained transport metadata without starting a runtime. Its list
defaults to all saved history across the selected Sapien's runtimes. Exact run
filtering, detail, causation and correlation links must preserve the run ID;
normal-runtime links use an explicit normal scope. Legacy records have no run ID.
Simulations that used in-memory transport cannot supply historical Bus records.

List time filters use real publication time. Event time can be simulated and is
labelled separately in detail. Changing Sapien or filters must invalidate pending
list/detail requests and clear pagination. Verify these states manually against
the matching deployed API; source review is not a live integration check.

## Review standard

Use AGENTS.md's state, accessibility and navigation checks. Verify both themes,
desktop/narrow layouts, missing/long evidence and stale responses. A build or static
render test is not browser approval, and a working example is not proof of all states.

Keep permission-test fixtures aligned with the separate admin and analysis-access
flags; never weaken permissions to satisfy an old fixture. Awareness tests must use
the current diagnostics exports rather than removed legacy helpers.

Report each task's test results and remaining verification in the final response.
Do not append dated reviews, example run IDs, pass/fail logs or implementation diaries
to this reference.
