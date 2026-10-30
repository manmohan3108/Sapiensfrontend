# Sapiens UI and UX reference

These are the agreed design guidelines for extending the current Sapiens theme to other pages, one page at a time. They are a flexible reference, not a rigid template. Use judgment to adjust the layout, illustrations, density and interactions to each page's purpose. Prefer a clear, usable result over mechanically following these notes. Explicit user instructions take precedence.

## Required design skills across this repository

Apply these skills to UI/UX work on every page and shared component, including admin, customer, authentication, landing and design-direction screens. This applies to other tasks and chats working in this repository as well.

- **`frontend-design`**: Read its `SKILL.md` before planning or implementing UI changes. Use it to make deliberate decisions about hierarchy, layout, typography, spacing and wording, rather than repeating generic cards or decorative patterns.
- **`web-design-guidelines`**: Read its `SKILL.md` and follow its guideline-fetching workflow when reviewing existing UI and before completing UI changes. Check the changed interface for usability, accessibility, responsive behaviour, interaction states and navigation; fix relevant findings within the task's scope.

Find these skills through the session's available-skills catalogue. On this machine they are installed at:

- `C:/Users/Manmohan Mahapatra/.codex/skills/frontend-design/SKILL.md`
- `C:/Users/Manmohan Mahapatra/.codex/skills/web-design-guidelines/SKILL.md`

Use the equivalent installed paths in other environments. If a skill is unavailable, state that limitation and follow this reference; do not claim to have used it or install dependencies without authorization.

These skills support the agreed Sapiens design, not a new theme for each task. Preserve existing shared tokens, components, typography and page-specific palettes, including copper for Analyse and green for customer/workspace screens. Explicit user instructions and this project's design decisions take precedence over generic skill recommendations. Adapt the guidance to each page rather than following it mechanically, and do not broaden a focused task into an unrelated redesign.

Use visual verification where available and distinguish it from code or render tests. These skills do not authorize starting localhost, committing, pushing or deploying; follow the user's instructions for those actions. Tasks without a UI/UX impact do not need a design pass.

## 1. One consistent theme

Use consistent colours, backgrounds, grid treatment and controls across admin and customer pages. Differences should reflect their tasks and permissions. Reuse shared components and theme tokens where practical; avoid separate palettes drifting apart.

## 2. Dark and light modes

Default to dark mode and remember an explicit user choice in local storage. Dark mode uses deep green surfaces and warm text; light mode uses pale surfaces and dark green text. Check illustrations, grids, borders, icons, inputs, dialogs and interaction states in both modes. Adapt their colours deliberately rather than applying a blanket inversion filter to artwork.

## 3. Colour with purpose

Keep the orange core as the visual identity. Use warm amber for dark-mode primary actions and deep green for light-mode primary actions. Reserve additional colours for meaningful status or feedback. Do not reintroduce the old purple/blue palette during this migration.

Use the established styles as implementation references:

- `src/styles/science-direction.css`: science landing theme.
- `src/styles/auth.css`: login and signup theme.
- `src/styles/home-science.css`: admin and customer identity directories.

Inspect existing tokens and styles before introducing new ones. Keep overrides scoped so they do not accidentally alter unrelated pages.

## 4. Science identity with selective illustrations

Use faint notebook grids and restrained technical details throughout. Mathematical or scientific illustrations may also appear on login, signup, Your Sapiens and other working screens, not only the landing page. Add them where they make the page more distinctive without competing with its content.

Keep illustrations away from text and controls. Use gentle motion where appropriate. Decorative layers must not intercept clicks, interfere with scrolling or reduce readability. Judge each placement visually; do not require decoration on every page.

Possible starting points, to adapt and review per page:

- Login/signup: a small animated scientific figure in the illustration area, keeping the form clear.
- Empty Your Sapiens page: a restrained illustration around the core to make the introduction welcoming.
- Populated Your Sapiens page: small accents near the heading or margins, keeping the directory compact.

These are options for future work, not instructions to add illustrations to every screen automatically. Preserve the established core and illustration assets unless the user requests a change.

## 5. Typography and readability

Use Source Sans 3 for controls, descriptions and data, and Source Serif 4 for selected page headings. Use monospace sparingly for IDs and technical labels. Avoid tiny explanatory text. Maintain clear hierarchy, comfortable line lengths and readable spacing.

## 6. Compact, task-focused layouts

Prefer rows for directories and repeated records. Use cards when grouping information genuinely helps. Avoid large introductions, repeated headings, oversized buttons and unnecessary scrolling. Keep related illustrations and descriptions clearly paired. Preserve useful descriptions rather than shortening them solely to fit a decorative layout.

## 7. Clear, brief wording

Explain what the user can do next. Introduce Sapiens briefly when useful, especially in empty states: a persistent AI individual shaped by experience. Avoid vague slogans, unexplained concepts and claims beyond the product's actual behaviour. Distinguish concepts in development from available functionality when relevant.

### Writing explanations from the reader's perspective

Use the following as flexible defaults, not a mandatory copy template. Adapt the amount, tone and placement of text to the page's audience and task. A technical admin screen can use precise terminology; a familiar control may need only a short label. Do not force an introduction, full sentence, example or explanation into every section. Relax these preferences when another approach is clearer, while keeping factual accuracy and supported behaviour non-negotiable.

- Give context before unfamiliar concepts. When needed, briefly explain what the page is for, why it matters, what the reader is seeing or what they can do next. Do not assume they know our internal architecture.
- Make the subject and source clear. Explain who acted, what information prompted it and what happened when those details are available and relevant. Avoid context-free questions such as “What matters now?” when readers cannot tell whose perspective they represent.
- Explain the purpose where it is not obvious, rather than merely naming an action or capability. Use recorded reasons when describing actual events; do not invent motivation or missing context.
- Prefer concrete, natural wording over vague slogans, unexplained internal labels or fragmented lists. Keep established names consistent, and add a brief explanation beside them when useful.
- Keep explanations proportional. A prominent purpose sentence can orient a new reader; smaller help beside an unfamiliar section or control can explain the rest. Preserve useful detail, but avoid long paragraphs, repeated explanations, extra cards or excessive spacing just to hold text. Let clear visuals and interactions do some of the explaining.
- Describe only what the system supports and the record establishes. Distinguish a proposed action from execution, a prepared reply from a sent reply, and a tool result from successful completion or a learned lesson. Keep deeper technical detail available when relevant without making it the first thing everyone must read.

For example, “To see how a Sapien behaves at work, we place it in a simulated workplace” gives a Simulation page a clear purpose. Use this as an example of helpful context, not wording to repeat on unrelated pages. Judge the final copy by whether the intended reader can understand and use that particular screen, not by whether every guideline appears in it.

## 8. Design every state

Review loading, errors, no items, one item, many items, unmatched searches and actions in progress. Empty states should explain the next step and provide a direct action. An unmatched search is different from an account with no Sapiens. Keep feedback and recovery actions clear.

## 9. Restrained motion

Preserve expressive core animation where it contributes to the experience. Keep working screens calm, text steady and interactions responsive. Respect reduced-motion preferences. Avoid heavy effects and unnecessary animation work outside the visible page area. Do not introduce cursor effects or elaborate motion merely to make a screen feel interactive.

## 10. Accessible interactions

Maintain readable contrast, visible keyboard focus, labelled controls and comfortable touch targets. Information must not depend on colour or hover alone. Check keyboard operation, dialog focus and narrow-screen layouts where relevant.

## 11. Preserve functionality

Styling changes must retain permissions, navigation, validation, search, creation safeguards and existing data behaviour. Keep role-specific tools and actions available to the appropriate users. Do not weaken authentication or change production data to facilitate a visual review.

## 12. Review one page at a time

Check desktop/mobile, both themes and the relevant states. Use the actual page components for visual verification where possible. When a backend is unavailable, use clearly labelled, isolated sample-data previews and distinguish those checks from live integration testing. Remove temporary preview files and mocks after verification unless retaining a preview is requested.

Report what changed, what was tested and any remaining limitations. Keep changes scoped and reversible. Run the build and checks appropriate to the change. Deploy only when requested; local implementation does not imply a production deployment.

## 13. Planning and delivery workflow

Before changing a page, record a short page brief: intended reader, primary question,
primary action, current friction, data available, proposed reading order and acceptance
checks. Inspect the actual implementation and, when accessible, the live page for the
requested Sapien. Distinguish browser observations, source-code findings and proposals.
Do not call a code inspection or static render test a visual review.

Work in small, reviewable page changes:

1. Establish the current state, selected Sapien/run and routes; inspect relevant API
   types and presentation helpers. Check Git status and preserve other work.
2. Plan what stays immediately visible, what belongs beside a record and what can
   be secondary. Decide this per task; do not convert every section into a dropdown.
3. Implement the smallest coherent improvement using the existing theme and shared
   components. Remove superseded code rather than hiding unused implementations.
4. Review the result from a first-time reader's perspective and against the two
   required skills. Test the affected states, navigation and data interpretation.
5. Report changes, evidence, limitations and next review point. Commit, push, start
   localhost or deploy only when requested. For authorized VM deployment, follow
   `DEPLOYMENT.md` and run the VM's `deploy.sh`; verify the deployed build.

Use the in-app browser by default. Do not request Chrome/Edge access unless the user
asks for it. If visual verification requires localhost and it has not been authorized,
report that verification as pending; do not bypass browser restrictions. Never mutate
production records, launch a simulation, advance a run, submit feedback or trigger a
Sapien action just to obtain attractive screenshots.

## 14. Analyse and Simulation presentation contract

For the current readiness pass, review only Analyse and Simulation, using Sapien 65
as the reference account data. Homepage, Workspace and Your Sapiens are outside this
pass. This is a presentation initiative, not a change to Sapiens' intelligence,
decision-making, memory, learning, scheduling or simulation behaviour.

- Keep the selected Sapien and, where applicable, simulation run unambiguous. A
  simulation record must not appear to be a live-world action. Preserve selection,
  useful filters and return paths while moving between related evidence.
- Lead with the record's meaning and origin: who/what supplied it, relevant service,
  conversation or issue, recorded understanding/action and outcome. Surface available
  origin metadata before saying context is unknown. Never infer identities from prose.
- Distinguish source evidence, Sapiens' interpretation and an evaluator's assessment.
  Proposed, queued, prepared, executed, tool-reported success, verified outcome and
  learned guidance are different states. A finished flag alone is not proof of success.
- Labels must state the scope of counts, search, charts and filters: all records,
  one run, server matches, returned page or locally filtered results. Never build an
  apparently complete service/category selector from one paginated result page.
- Null, unavailable, empty, zero and not applicable have different meanings. Show
  missing information honestly, without a screen full of empty metric tiles.
- Preserve event time, creation time, last activation and fetch time as distinct
  concepts. Display recorded timestamps with timezone. Do not turn null ages into
  zero or compare simulated time to the browser clock as if it were real elapsed time.
- Explain unfamiliar controls beside the control. Keep diagnosis/evidence accessible;
  hide raw JSON and infrastructure IDs until requested, without dropping records.
- Use graphs when they reveal actual relationships, order or change. Provide readable
  labels and a list/text alternative. Never invent connections, equations or metrics.
- Prefer task-specific layouts: directories for choosing, lists/readers for records,
  timelines for sequence, tables for comparison and graphs for connected evidence.
  Keep the scientific grid restrained; decoration must not replace useful context.

## 15. Code structure and API boundary

Use `AnalyseShell`, `AnalyseControls`, `DiagnosticPrimitives`, the existing context
readers/navigation helpers and shared theme tokens where they fit. Inspect current
exports before adding a new abstraction. Keep Analyse-specific renderers under
`src/app/components/analyse` and Simulation renderers under
`src/app/components/simulation`. Keep route components focused on composition.

Prefer pure, typed presentation helpers for origin labels, dates, status and display
normalization. Reuse verified helpers rather than copying transformations between
screens. Keep rendering, request state and data interpretation separable. Do not
rewrite shared workspace components to achieve an Analyse-only change.

Use scoped CSS and existing `--an-*` or Simulation tokens, Source Sans 3 and Source
Serif 4. Avoid new hardcoded palettes, new dependencies for simple UI, broad override
chains, and compressed multi-purpose components that are difficult to review. Extract
shared primitives when behaviour genuinely repeats, not just because markup looks alike.

Backend code may be read to establish field semantics. Frontend-facing API changes
are allowed within an authorized task only after identifying the endpoint, consumers,
permissions, clock/scope semantics and backward-compatibility impact. Prefer an additive
read-only field or bounded query over changing an engine. Document and test the contract.
Changes to core behaviour, authorization, scoring, ranking, learning, persistence or
simulation execution require a separate explicit scope; do not disguise them as UI fixes.

## 16. Readiness checks and review evidence

For each page, check desktop and narrow layout, both themes, keyboard operation,
opening/closing detail and returning to the same list position. Exercise loading,
empty, partial/missing data, long content, errors, stale responses after switching
Sapien/run, filtering/pagination, and request-in-progress states where applicable.
Keep primary actions identifiable and separate read-only inspection from actions
that start or change work. Do not shrink text to optimize space.

Use meaningful tests for changed interpretation and interaction behaviour. Available
checks include `pnpm test:analyse`, `pnpm test:navigation`, the awareness scripts under
`scripts/`, and `pnpm run build`; select those relevant to the change. The Vite build
does not replace type checking, browser review or live API integration tests.

The readiness record is `docs/analyse-simulation-readiness.md`. Update its observed
coverage, priorities and outstanding checks as work proceeds. A page is not visually
approved because its build passes, and a polished UI is not evidence of an unsupported
capability. Keep this document a flexible reference, not a forced layout template.
