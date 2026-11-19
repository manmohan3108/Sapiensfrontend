# Research page: editorial roadmap

This guide applies only to the public Research index and its articles at
`/research` and `/research/:slug`. Follow the frontend `AGENTS.md` for UI work.
This is the editorial plan for review, not authorization to rewrite or publish
all articles. Existing articles may still differ from this direction.

## Purpose and research boundary

The Research section tells the story of **our Sapiens investigation**: what we
want to understand, why we take this approach, which ideas inspire us, what we
build to explore them, and what we learn.

Our central question is whether intelligence can emerge as we bring processes
inspired by neuroscience and philosophical thinking together in software.
Experience, memory, identity and continuity are parts of this investigation;
none should replace the whole ambition. Reducing human supervision is not the
central motivation.

Explain our philosophy first, then our inspirations, then our own design and
investigations. Credit existing scientific and philosophical ideas to their
sources. Distinguish those ideas from our interpretations, engineering choices
and observations. An implementation is not automatically a new scientific finding.

Every topic must answer: **Why does this belong in the story of Sapiens, and
what does it tell readers about our work?** Background explanation earns its
place by helping answer that question. This is not a general course in
neuroscience, philosophy or AI.

## Reading structure and section ownership

These four reading stages use the existing six categories. They clarify the
reader's journey without changing current routes, category names or navigation.

| Reading stage | Existing category | What belongs here | Boundary |
| --- | --- | --- | --- |
| Our philosophy | Research philosophy | Our motivation, questions, working meanings, assumptions and hypothesis | Our position before our solution; no general philosophy survey |
| Our inspirations | Neuroscience foundations | Selected ideas, why we draw from them, the questions they raise for Sapiens, and limits of our interpretation | Brief sourced background; engine articles own the implementation |
| Our research and design | Sapiens architecture | Our choices about how the whole system fits together and why | Relationships and trade-offs; each engine owns its internal design |
| Our research and design | Engine deep dives | Specific questions, relevant inspiration, our interpretation, actual design and open questions | Code is an implementation of an idea, not proof of effectiveness or biological equivalence |
| Findings and open questions | Experiments and findings | Observations, conditions, comparisons, failures and what they support | Separate observation from interpretation and completed experiments from proposals |
| Findings and open questions | Future research | Our unanswered questions, candidate approaches and reasons to explore them | Proposed work, without promises or claims that it already operates |

## Writing approach

- Start with the topic's question or problem and why it matters to Sapiens.
  Do not open with a solution, engine list or general lesson.
- Use the flow that fits: **our question → necessary background → our position
  or approach → what is known or open → related work in Sapiens**. This is a
  reasoning guide, not a repeated set of headings.
- Use short, direct sentences and familiar words. Prefer “We often face” to
  “Everyday life asks us”. Explain necessary terms beside their meaning.
- Examples support the explanation after the motivation is clear. Explain the
  example before naming its academic model or creator, then return to why it
  matters to Sapiens. Do not let it become a separate lesson.
- Where useful, compare human abilities and AI and state the question this raises.
  Avoid blanket claims that AI cannot reason, learn or act. Distinguish a language
  model from its surrounding system when that distinction matters.
- State the question before describing our approach. Do not replace understanding,
  learning and adapting with productivity, reminders or reduced supervision.
- Give each subject one primary home. Other articles explain its relevance briefly
  and link onward. Richness comes from reasons, examples and meaningful choices,
  not repeating attention, memory or curiosity in every article.
- Credit sources and distinguish their findings from our hypothesis, interpretation,
  implementation, observations and proposals. Do not invent historical motivations,
  quantitative results or claims of originality.
- Check current code and composition before describing implementation. A module,
  outdated document or deployed fix does not establish active or proven capability.
- A single success or mistake does not settle whether a person or AI understands.
  Learning, surprising output or connected components alone do not demonstrate
  emergence. Designed local rules can still produce a collective pattern.
- Put uncertainty where it matters without repeating disclaimers. Keep original
  observations separate from explanations of them.
- Do not invent a biological explanation for an ordinary engineering boundary.
  Practical software choices can support the research without being novel theories.
- Preserve the theme and keep internal links aligned with the current articles.
  Retired philosophy URLs have no compatibility redirects. Updating this plan
  alone does not change article content, ordering, titles or publication status.

## Topic map and preparation scope

Slugs identify articles. Research philosophy uses the three-article structure
below; other categories retain their current reading order. Labels describe
editorial purpose. Each row defines content, relevance and boundaries. Suggested connections
are editorial relationships, not a requirement to add every link to every page.

### 1. Research philosophy — three articles about our position

Use three substantial articles, each with clear subsections. Preserve depth by
developing the reasoning within them instead of stretching closely related ideas
across seven introductions. Their distinct jobs are **our motivation → our
hypothesis → why an individual's experience matters**.

The canonical destinations are `philosophy`, `emergence` and `continuity`, in
that reading order. Consolidated topics share those articles rather than
remaining separate introductions.

#### Article 1: Why we are building Sapiens

**Purpose:** Explain the problem that motivates us, the abilities we want to
understand, and why we take inspiration from neuroscience and philosophy.

**Planned content and flow:**

1. **The motivating problem.** Relate human understanding, learning and adapting
   to what we want to investigate in AI. State the research question explicitly
   before introducing our approach. An example can support the opening, but must
   not replace the problem as the starting point.
2. **What we mean by intelligence and understanding.** Briefly explain our working
   distinctions between knowing, understanding, reasoning, learning and adapting.
   Tie these meanings to the abilities we want to investigate in Sapiens rather
   than giving a general definitions lesson.
3. **Why this matters to us.** Explain the broader ambition of understanding
   intelligence. Do not narrow it to reduced supervision, productivity, reminders
   or choosing the next task automatically.
4. **Why neuroscience and philosophy guide us.** Explain why the brain is a source
   of ideas and why questions about understanding and agency shape our choices.
   Specific scientific mechanisms belong in the inspiration articles.
5. **Where consciousness fits.** Include a focused subsection about its influence
   on our thinking, the distinction from intelligence and observable behaviour,
   and what we can and cannot claim about Sapiens. Do not equate the Awareness
   engine with subjective experience. A separate article is warranted only when
   we have a distinct research argument to develop.
6. **Why build Sapiens.** Explain how building and studying a system helps us
   investigate these questions. State the emergence hypothesis briefly and lead
   to Article 2 for its explanation.

**Boundary and links:** This article owns our motivation and working meanings.
It links to selected inspirations and evaluation. It does not explain the flock
example, engine internals or detailed experimental methods.

#### Article 2: Our hypothesis: how intelligence might emerge

**Purpose:** Explain the particular hypothesis guiding our approach and why it
leads us to investigate cooperating processes.

**Planned content and flow:**

1. **Our hypothesis and why we explore it.** Ask whether broader abilities could
   arise through processes working together. Connect this to the intelligence
   questions established in Article 1 without repeating their definitions.
2. **What we mean by emergence.** Explain the idea plainly, using the flock
   example after establishing its relevance. Introduce Craig Reynolds and Boids
   after the reader understands the example; credit the source.
3. **The connection to our inspiration.** Describe a specific brain-inspired
   interaction that helps explain why we are interested in this direction.
   Do not replace this connection with a generic statement about neuroscience.
4. **How the hypothesis shapes Sapiens.** Briefly explain our choice to build
   cooperating functions and investigate what their interaction contributes.
   Distinguish established source ideas from our own interpretation and design.
5. **What remains a hypothesis.** Explain that connected components, learning or
   surprising output alone do not establish emergence. Identify the question we
   would need evidence to answer, then link to evaluation instead of reproducing
   its procedures.

**Boundary and links:** This article owns the emergence explanation and its role
in our research. Link to architecture, relevant inspirations and evaluation.
Keep the detailed story of an individual's experience in Article 3; do not use
ordinary learning as if it were proof of emergence.

#### Article 3: Why experience and individuality matter

**Purpose:** Explain why our investigation follows one continuing individual
whose encounters, choices and consequences may affect its later understanding.

**Planned content and flow:**

1. **Why study one individual over time.** Introduce the question of how earlier
   encounters might matter to later understanding. Explain why continuity serves
   our investigation without making persistence the whole research thesis.
2. **A perspective and actions of its own.** Explain our interest in a consistent
   point of view, intentions and responsibility for actions. Different functions
   belong to the same Sapien; other people's words and actions remain theirs.
3. **Why taking part may matter.** Compare receiving information with encountering
   a situation, choosing an action and observing its consequences. Explain what
   we hope to investigate, without claiming that participation guarantees learning.
4. **How experience could change understanding.** Discuss retaining connections,
   questioning earlier ideas and applying what was learned elsewhere. Use a
   supporting example if it makes our research question clearer.
5. **Development rather than accumulation.** Explain why storing more history is
   not enough: we want to examine revision, useful learning and the possibility
   of misleading associations over time.
6. **What this motivates in Sapiens.** Briefly connect the questions to shared
   identity, memory, feedback and replay. Link to their design and evaluation
   articles for what actually exists and what has been observed.

**Boundary and links:** This article combines self/agency, firsthand experience
and continuity. It owns their shared motivation, not their engine implementation.
Link to identity, memory, feedback, replay and experience evaluation. Do not claim
personhood, subjective experience or proven developmental benefits.

#### Canonical articles and consolidated subjects

| Article | URL slug | Subjects retained |
| --- | --- | --- |
| Why we are building Sapiens | `philosophy` | Motivation, working meanings of intelligence and understanding, and consciousness as an open question |
| Our hypothesis: how intelligence might emerge | `emergence` | The hypothesis, flock example, brain inspiration and Sapiens connection |
| Why experience and individuality matter | `continuity` | Perspective, agency, participation and development over time |

Only these three articles appear in this section and its reading order.
Retired article URLs use the existing unavailable-article view; do not retain
aliases or redirects. Internal related links use the current articles without
duplicates. Superseded drafts remain in Git history, not as parallel published
pages or a second content archive.

Keep each article substantial enough to explain its reasoning. Do not compress
the combined subjects into a few summary sentences, or paste the old articles
end to end. Remove repeated explanations and give each subsection a distinct
purpose. Other research categories retain their existing planned scope.

### 2. Neuroscience foundations — the ideas we draw from

Start with why a selected idea matters to Sapiens. Explain enough of the source
concept to understand our interest, cite it, state the research question it
raises, and link to our interpretation. The foundation owns the source idea;
the engine article owns our implementation.

| Topic | What belongs here | Sapiens research connection and boundary |
| --- | --- | --- |
| `inspiration` — Choosing and adapting inspirations | Why neuroscience; how we select ideas, form software interpretations and identify where analogies end | Explain our approach through concrete foundation/engine pairs; no history of neuroscience or claim to copy the whole brain |
| `perception-attention` — Selection and shared availability | Our need to select relevant information; the specific attention and Global Workspace ideas that inform it | Motivate questions behind Awareness. Explain distinctions and limits; leave prompt stages and execution flow to Awareness |
| `working-memory-foundation` — Information available for current thought | Relevant working-memory ideas, limits and distinction from long-term memory | Explain our interest in active context. Link to Working Memory; software capacity settings are not biological facts |
| `associative-memory` — Related experiences coming to mind | Why one encounter might cue another; selected association ideas behind our approach | Motivate connected recall. Link to Engram; leave storage, retrieval and scoring to its article |
| `reinforcement-forgetting` — Hebbian strengthening and plasticity | Strengthening/weakening concepts we draw from and why repeated use need not mean usefulness | Motivate changes in memory associations. Link to Engram, replay and feedback; distinguish these changes from training the language model |
| `replay-consolidation` — Revisiting experience | Replay/consolidation ideas we draw from and why revisiting memories may matter | Motivate our replay investigation. Link to Hippocampus and evaluation; do not imply all biological consolidation is implemented |
| `prediction-reward-foundation` — Expectations, surprise and value | Selected prediction, novelty and reward prediction-error ideas; distinctions needed to explain our interest | Motivate predictive components and future questions. Link there for implementation; no implied full integration or human feelings |

### 3. Sapiens architecture — our overall design choices

| Topic | What belongs here | Sapiens research connection and boundary |
| --- | --- | --- |
| `architecture-overview` — Bringing functions together | Why separate responsibilities, how they cooperate and the trade-offs | Show how our hypothesis informs design. Link to engines; connection alone is not evidence of emergence |
| `identity` — Identity and the shared self | How the design represents one Sapien, supplies its identity and preserves other speakers' perspectives | Translate the position in “Why experience and individuality matter” into design. Keep its philosophical arguments there and verify implementation claims |
| `process` — From experience to action | One representative experience through consideration, action or waiting, and assessment | Make the experience–behaviour relationship concrete. Link to owners; avoid exhaustive code walkthroughs |
| `connections` — Preserving and sharing information | Why source, context, references and retrieval matter; how information becomes available to consumers | Explain a condition the investigation depends on. Keep API schemas and internal plumbing in technical documentation |
| `language-models` — What the model contributes | Roles of the model and surrounding system in reasoning, memory, tools and ongoing activity | Clarify the basis of our experiments. Link to alternatives; do not attribute a model's existing abilities to our architecture |

### 4. Engine deep dives — specific questions and our approach

For each engine: problem → relevant inspiration → our interpretation and design
→ information it uses and produces → actual integration and open questions.
Link to the inspiration instead of reteaching it. Verify status before writing:
the scope below is not a claim of deployed capability.

| Topic | What belongs here | Sapiens research connection and boundary |
| --- | --- | --- |
| `awareness` | Why a coherent focus is needed; selection, context, decisions and assessment in our design | Examine how available information contributes to behaviour. Link to attention/workspace ideas; do not claim subjective awareness |
| `memory` — Engram | Why experience needs context and associations; ingestion, recall and association changes | Explore when past experience becomes useful. Link to associative memory/plasticity; retrieval alone is not understanding |
| `working-memory-engine` | Why selected information stays active; representation, capacity and activation | Examine the role of current context. Link to its foundation; do not repeat long-term storage design |
| `hippocampus` | Why revisit experience; our replay coordination, effects on memory and actual integration | Investigate whether replay helps later recall. Link to foundations/evaluation; identify dormant capabilities honestly |
| `goals` | Why outcomes and unfinished work persist; how evidence informs progress and revision | Study intentions across changing circumstances. Link to continuity, Hold and feedback; stored goals are not completed actions |
| `hold` | Why waiting can be appropriate; retaining and reconsidering unresolved conditions | Explore waiting without forgetting or repeating actions. Link to Goals/Awareness; no invented biological counterpart |
| `reasoning-questioning` | Why identifying questions matters; generation, storage and actual consumers | Investigate how questions might support understanding. Link to Curiosity; distinguish generating questions from pursuing answers |
| `curiosity` | Why possibilities are worth exploring; our approach to relevance, novelty and uncertainty | Explore how investigation might be selected. Link to Questioning/initiative; no automatic exploration claim without verified wiring |
| `motor-conversation` | Why choosing, executing and communicating have distinct responsibilities; results returned | Explain how decisions encounter consequences and other people. Link to process/feedback; practical boundaries, not biological equivalence |
| `action-feedback` | How later observations inform interpretations of earlier actions, with evidence and uncertainty | Explore how consequences become useful information. Link to experience/learning; distinguish observation from inferred cause |
| `tool-learning` | How tool experience becomes revisable guidance and how it is used | Investigate practical learning from outcomes. Link to feedback/evaluation; guidance is not permission or a guarantee |
| `predictive-engines` | Questions behind Cortex, Cerebellum and Dopamine; exact limited implementations and integration status | Explain what we have attempted around expectations and value. Link to foundations; no claims of complete biological models |
| `weave` | Why synthesis, abstraction and belief revision matter; design, incomplete parts and intended role | Explain our investigation of broader understanding. Link to future abstraction; distinguish code, proposals and active behaviour |

A component may be a practical part of the investigation without being an
original scientific contribution. Do not add an inspiration solely to justify
the component's name.

### 5. Experiments and findings — what our work shows

| Topic | What belongs here | Sapiens research connection and boundary |
| --- | --- | --- |
| `simulation` | Why simulated settings, what the case controls and what the environment can obscure | Explain how we observe Sapiens. Link to findings/limits; no general simulation tutorial |
| `findings` | Specific sequences, conditions, alternative causes, changes and verification status | Show what we learned about our design. Link to affected engines; avoid a release diary or treating fixes as proven gains |
| `experience-evaluation` | Comparisons that reveal when experience helps, has no effect or misleads | Address our experience hypothesis. Link to memory/replay/feedback; separate proposed comparisons from results |
| `evaluation` | Evidence and comparisons that could support or challenge the central hypothesis | Connect ambition to assessable questions. Link to emergence/alternatives; task success alone does not establish emergence |
| `alternative-explanations` | Whether models, prompts, extra computation, tools or simulation explain the behaviour | Keep attribution of our contribution honest. Link to model role/experiments; use alternatives relevant to our observations |
| `research-limitations` | Limits of implementation, experiment coverage, measurements and conclusions | State how far our claims reach. Link to evidence/open questions; avoid repeating generic caveats everywhere |

Observed results and proposed experiments must remain distinct. A simulation can
cause an error itself; trace the sequence before assigning responsibility.
A code change is not evidence of improvement until the relevant behaviour is checked.

### 6. Future research — questions we want to pursue

Each direction needs a reason to exist, relevant current ingredients, what is
missing and what we could learn by trying it. A similarly named engine does not
establish implementation. Do not invent delivery dates.

| Topic | What belongs here | Sapiens research connection and boundary |
| --- | --- | --- |
| `prediction` | How expectations might help interpret unfolding events; candidate approach and questions | Extend understanding through time. Link to predictive components; keep existing implementation details there |
| `imagination` | Why considering possibilities may help; possible representation and evidence boundaries | Explore reasoning beyond observed facts. Link to Questioning/Weave where relevant; imagined events are not observations |
| `abstraction` | How experiences might support general ideas; applicability, revision and counterexamples | Investigate transfer to unfamiliar settings. Link to Weave/memory; summaries are not automatically learned principles |
| `motivation-action` | Reasons to act, explore, wait or rest; candidate ways reasons affect choices | Explore a broader basis for decisions. Link to Goals/Hold/Curiosity; do not reduce intelligence to autonomous task completion |
| `reward-emotion` | Questions about significance and value; specific inspirations and possible interpretations | Explore why experiences might matter differently. Link to prediction/reward; no claim of human emotions |
| `senses-roles` | Why more forms of experience or changing roles matter; possible approaches and difficulties | Explore understanding across settings. Link to identity/experience; distinguish available inputs from proposed ones |
| `missing-mechanisms` | Gaps from questions or evidence, their needed function and plausible alternatives | Prioritize research by what it could explain. Link to concrete directions; no checklist of brain parts to reproduce |
| `initiative` | When exploration or social interaction is worthwhile, how to avoid empty activity and what is untested | Explore encountering new experiences. Link to Curiosity/motivation; frequency of activity is not evidence of intelligence |

## Link design

Previous/Next on every article follows the same section/topic order as the index,
across category boundaries. Only articles with content are destinations:
unpublished topics remain visible in the index but are skipped by Previous/Next.
The sequence has no wraparound, and unavailable directions are omitted.
Search/category filters do not change the reading sequence; they are retained
for returning to the topic list. Related reading remains a separate set of
editorially chosen connections.


- Philosophy links to our working meanings and selected inspirations before
  requiring readers to understand engine architecture.
- Foundations link to their computational interpretations in engine articles.
- Architecture links to the engines that own the responsibilities it describes.
- Engines link back to relevant foundations and onward to experiments or open
  questions.
- Experiments link to the mechanisms examined and explain what the evidence
  supports.
- Future topics link to existing ingredients without implying the proposed
  integration already works.

Related article links use the destination category’s relationship label, such as
“Scientific inspiration,” “Computational interpretations,” “Evidence and evaluation”
and “Open research questions.” Links within the current category appear under
“In this section”. Existing article IDs and category membership determine these
groups; there is no separate per-article navigation store.

## Implementation references

Consult these backend sources when revising implementation claims. Source code
alone does not establish what happened in a deployed run.

| Topic | Backend sources |
| --- | --- |
| Ownership and composition | `sapiens/engines/README.md`, `sapiens/orchestrator/setup.py` |
| Shared self and attribution | `sapiens/engines/identity/README.md` |
| Awareness and prompt presentation | `sapiens/engines/awareness_engine/README.md` |
| Memory and replay | `sapiens/engines/engram_engine/README.md`, `engram_engine/consolidation.py`, `hippocampus_engine/README.md` |
| Active context | `sapiens/engines/working_memory/README.md` and setup registrations |
| Goals and waiting | `sapiens/engines/goal_engine/README.md`, `hold_engine/README.md` |
| Execution and communication | `sapiens/engines/motor_engine/README.md`, `conversation_engine/README.md` |
| Experience interpretation | `sapiens/engines/feedback_engine/README.md`, `tool_learning_engine/README.md` |
| Questioning and Curiosity | Their engine READMEs and setup connections |
| Unconnected research components | `weave_engine/README.md`, Cortex/Cerebellum/Dopamine READMEs and setup |
| Simulation boundaries | `simulation_suite/README.md`, `cases/sentinel_desk/README.md`, `world/interpreter.py` |

Paths abbreviated after the first engine path remain relative to
`sapiens/engines/`; abbreviated simulation paths are relative to
`simulation_suite/`. The latest code must be checked again when expanding the
articles, especially for integrations that are currently disconnected.

Keep this guide focused on editorial direction and source references. Report task
progress, test results and publication status in the conversation, not in this file.

## Incremental workflow

1. Work on one article at a time unless a batch is explicitly requested.
2. Identify its Sapiens-specific question, section boundary, source evidence and
   links first. State what readers should learn about our research from it.
3. Check current code where making implementation claims; consult reliable
   scientific sources for scientific explanations.
4. Rewrite the article using the existing structured content format.
5. Review whether each explanation serves our research story, explains why before
   how, uses plain language, avoids overlap and distinguishes status. Remove
   background that does not support the topic's purpose.
6. Retain the current theme and responsive hierarchy. Make presentation changes
   only when the content needs them.
7. Report the article changed and its local/deployment status briefly. Follow
   existing instructions for manual verification, commits and deployment.

## Files

- `src/app/content/researchArticles.ts`: article openings, sections, references
  and related-topic IDs.
- `src/app/pages/ResearchPage.tsx`: topic catalogue, category membership, index
  and article presentation.
- `src/styles/research.css`: Research-specific styling.
- `AGENTS.md`: frontend design and implementation guidance.

This roadmap does not authorize backend changes, automatic publication or a
site-wide redesign.
