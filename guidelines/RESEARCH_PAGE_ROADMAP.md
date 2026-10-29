# Research page: editorial roadmap

This guide applies only to the public Research index and its articles at
`/research` and `/research/:slug`. It is not a general product, coding or
engine-design policy. Follow the frontend `AGENTS.md` for implementation and UI
work. This file records the agreed content direction so future edits can continue
without reconstructing the discussion.

## What we are building

A connected explanation of the Sapiens research: why we are investigating it,
which ideas inform it, how we interpret those ideas computationally, and what
evidence could support or challenge the approach.

The central question is whether intelligence can emerge from interacting
computational mechanisms informed by neuroscience and philosophical concepts of
intelligence. Persistence, identity and experience support this investigation;
none should replace the broader hypothesis as the entire product philosophy.

Explain how we arrive at mechanisms before introducing their names. Do not begin
with a list of memory, attention, goals and engines as though their necessity and
meaning were already established.

The site should invite curiosity and communicate substantive thinking. It is not
a collection of marketing claims, a code reference, or a claim that we have
reproduced the brain or demonstrated emergence.

## Writing approach

- Start every article with the question, hypothesis, inspiration or problem that
  motivates it. The opening must make sense to someone unfamiliar with Sapiens.
- Explain why that question matters, then develop the idea or approach. Names and
  implementation follow the motivation.
- Use plain language with enough detail to make the reasoning meaningful.
  Introduce necessary technical terms beside their meaning. Explain a familiar
  example before naming its model or creator; the name should add context after
  the reader understands the idea.
- Keep emergence focused on properties or organized patterns arising through
  interactions among parts. Learning from experience, unexpected output and
  connecting components are not sufficient evidence of emergence. Deliberately
  designed local rules do not rule out an emergent collective pattern.
  Connect the example to a specific brain-inspired interaction, then briefly
  explain how Sapiens explores it. Avoid replacing that connection with our
  general research philosophy; keep evidence limits in their dedicated section.
- Give each concept one primary home. Elsewhere, explain its relevance briefly
  and link to that home instead of repeating the whole explanation.
- Richness comes from reasons, concrete examples, trade-offs, competing
  explanations and evidence—not length or repeated claims.
- Distinguish scientific findings, our hypothesis, our engineering interpretation,
  current implementation, observations from experiments and future proposals.
- Describe implementation only after checking current code and composition.
  Documentation can be outdated; a module's presence does not establish runtime
  integration or deployment.
- Do not invent historical motivations, successful experiments or quantitative
  results. Use our discussions for intent and inspected evidence for factual
  claims. Mark uncertain interpretations honestly.
- Cite appropriate scientific sources when explaining research concepts.
  Sources support the scientific account, not the effectiveness of our software.
- Avoid stock disclaimers in every paragraph. State the relevant limits clearly
  where they matter; do not let caveats overwhelm the explanation.
- Keep paragraphs focused. Headings should express the article's actual ideas,
  not force every article into identical generic labels.

## Section boundaries

| Section | Purpose and useful depth | Keep out |
| --- | --- | --- |
| Research philosophy | Motivation, hypotheses, definitions, philosophical questions and alternative viewpoints | Premature engine lists, code details and extended evaluation procedures |
| Neuroscience foundations | Scientific concepts, supporting evidence, debates and limits | Detailed software implementation or claims of biological equivalence |
| Sapiens architecture | Design rationale, ownership, information flow and trade-offs | Re-teaching neuroscience or describing every engine's internals |
| Engine deep dives | Problem, relevant inspiration, our interpretation, current implementation, interactions and limits | Unrelated concepts or future capabilities presented as operational |
| Experiments and findings | Conditions, observations, failures, comparisons and alternative explanations | Treating a demo, successful run or code fix as proof of emergence |
| Future research | Unanswered questions, possible approaches and how their contribution could be investigated | Promises, invented results or another summary of existing engines |

These boundaries guide emphasis. A short explanation or example may cross a
boundary when needed for understanding; link onward for the full treatment.

## Topic map and reading order

Titles can be refined during review. Existing slugs below identify the current
articles; preserve their URLs unless a change is explicitly agreed. “Why look to
the brain?” currently belongs inside the first article, not a new duplicate page.

### 1. Research philosophy

| Existing article | Question or responsibility |
| --- | --- |
| `philosophy` — Why we are building Sapiens | Establish our ambition, why neuroscience and philosophy guide it, and why we build to investigate; introduce the hypothesis briefly |
| `intelligence-understanding` — Intelligence and understanding | Clarify what we want to investigate and why fluent responses alone do not settle it |
| `emergence` — What we mean by emergence | Explain the intended meaning and what distinguishes it from merely surprising output |
| `self-agency` — Self and agency | Explore continuity, perspective and responsibility before describing shared-self implementation |
| `consciousness` — Consciousness and its boundaries | Distinguish the philosophical question from intelligence and observable behaviour |
| `firsthand-experience` — What can an AI learn by taking part? | Explain why an individual's own history could matter |
| `continuity` — Development over time | Explore development and revision across experience, beyond accumulating records |

The first article should follow:
question → ambition illustrated by a familiar situation → why the brain inspires
us → how philosophical questions guide the work → brief hypothesis → why build
to investigate. Its purpose is motivation, not an explanation of emergence.

Keep these neighbouring articles distinct: the first explains why we are building
Sapiens; Intelligence and understanding examines what those terms mean; Emergence
explains how a whole can have properties its parts lack, with its own examples.
The first article should link onward rather than repeat those explanations or
introduce engine lists. Detailed implementation and evaluation belong in their
respective sections.

### 2. Neuroscience foundations

| Existing article | Question or responsibility |
| --- | --- |
| `inspiration` | How should scientific concepts inform computational design, and where does analogy end? |
| `perception-attention` | Explain attention and workspace accounts of shared availability, including their distinctions |
| `working-memory-foundation` | Why does some information remain available for current thinking? |
| `associative-memory` | How can one experience cue another? |
| `reinforcement-forgetting` | Explain Hebbian strengthening, plasticity and the need for balancing—not repetition as truth |
| `replay-consolidation` | Why might revisiting experience matter beyond immediate interaction? |
| `prediction-reward-foundation` | Distinguish expectations, novelty and reward prediction error |

Link these articles to the relevant engines, where the computational adaptation
is explained. Do not imply that every engine already implements every concept.

### 3. Sapiens architecture

| Existing article | Question or responsibility |
| --- | --- |
| `architecture-overview` | Why separate responsibilities, and how do they cooperate? |
| `identity` | How do different functions belong to one individual while preserving other speakers' perspectives? |
| `process` | How does experience lead to consideration, action or waiting, then assessment? |
| `connections` | How do information and references retain source, context and meaning across boundaries? |
| `language-models` | What does the model provide, and what does the surrounding system contribute? |

### 4. Engine deep dives

| Existing article | Motivating problem |
| --- | --- |
| `awareness` | Form a coherent present focus and decide what to do |
| `memory` — Engram | Make past experience available with context and associations |
| `working-memory-engine` | Maintain selected active context without duplicating all memory |
| `hippocampus` | Revisit experience and coordinate replay |
| `goals` — Goals and planning | Retain desired outcomes and interpret progress over time |
| `hold` | Wait for conditions without forgetting or repeatedly acting |
| `reasoning-questioning` | Identify useful questions and separate generation from pursuing answers |
| `curiosity` | Evaluate what may be worth exploring |
| `motor-conversation` | Separate choosing actions, execution and outward communication |
| `action-feedback` | Interpret what later evidence says about earlier behaviour |
| `tool-learning` | Retain revisable practical guidance from tool experience |
| `predictive-engines` | Explore limited value, expectation, novelty and reward-error mechanisms |
| `weave` | Explore abstraction, synthesis, evaluation and belief revision |

For each deep dive, establish the problem first, then the relevant inspiration,
our interpretation, actual implementation, important interactions and open
questions. Use an example when it makes the mechanism easier to understand.
Do not force invented biological explanations onto ordinary software boundaries.

### 5. Experiments and findings

| Existing article | Question or responsibility |
| --- | --- |
| `simulation` | Why use simulated workplaces, and what can they reveal? |
| `findings` | What happened, what caused it and what changed? |
| `experience-evaluation` | Does experience improve later behaviour, and when can it mislead? |
| `evaluation` | What comparisons could support or challenge our hypothesis? |
| `alternative-explanations` | Could the model, prompt, extra computation or scenario explain the behaviour? |
| `research-limitations` | How far does our current evidence allow us to conclude? |

Keep observed results separate from proposed experiments. A simulation can cause
an error itself; trace the sequence before assigning responsibility to Sapiens.
Do not imply that a changed implementation has passed runtime verification.

### 6. Future research

| Existing article | Open direction |
| --- | --- |
| `prediction` | Expectations and understanding an unfolding situation |
| `imagination` | Exploring possibilities while preserving evidence boundaries |
| `abstraction` | General ideas, applicability and counterexamples |
| `motivation-action` | Reasons to act, explore, wait or rest |
| `reward-emotion` | Significance and value without claiming human feelings |
| `senses-roles` | Continuity across settings, roles and possible additional senses |
| `missing-mechanisms` | Identify gaps by their purpose, not by adding brain-inspired names |
| `initiative` | Context-sensitive exploration and interaction without forced activity |

## Link design

Previous/Next on every article follows the same section/topic order as the index,
across category boundaries. Only articles with content are destinations:
unpublished topics remain visible in the index but are skipped by Previous/Next.
The sequence has no wraparound, and unavailable directions are omitted.
Search/category filters do not change the reading sequence; they are retained
for returning to the topic list. Related reading remains a separate set of
editorially chosen connections.


- Philosophy points to definitions and scientific foundations before requiring
  readers to understand engine architecture.
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

## Current progress and remaining work

Editorial pass: 28 October 2026.

- All 46 visible topics have been revised under the roadmap. The initial batch
  preserved the reviewed `philosophy` and `emergence` articles and rewrote the
  other 44 introductions. A subsequent emergence review replaced its learning
  example with sourced Boids flocking and refocused the whole article on
  properties arising through interactions.
- Each article begins with its motivating question, problem or inspiration.
  Foundations own the scientific explanations; engine articles describe the
  computational adaptation and its inspected integration status.
- Scientific and philosophical references accompany the relevant foundations.
  These are introductory sources, not an exhaustive literature review.
- Observations from the earlier simulation discussions are separated from proposed
  comparisons. No new VM inspection or experiment was conducted for this editorial
  pass, and no claim is made that an engineering change has passed runtime validation.
- Index and Previous/Next share the roadmap order and skip unpublished topics.
  Related article links are grouped using existing category membership, with
  labels for scientific inspiration, computational interpretations, evidence and
  open questions. Within-category links are labelled “In this section”.
- This editorial pass is tracked with the frontend. Confirm publication against the deployed frontend
  revision; content presence determines availability after deployment.
- Remaining work is editorial feedback, manual page review and progressively
  deeper studies with reproducible evidence. These introductions do not claim
  that those studies have already been completed.

### Implementation sources checked for this pass

Use these backend sources when revising implementation claims. They describe
the inspected code, not a guarantee about any deployed run.

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

Update this progress section as work advances; check Git and deployment state
rather than assuming these notes remain current.

## Incremental workflow

1. Work on one article at a time unless a batch is explicitly requested.
2. Identify its question, section boundary, source evidence and links first.
3. Check current code where making implementation claims; consult reliable
   scientific sources for scientific explanations.
4. Rewrite the article using the existing structured content format.
5. Review whether it explains why before how, introduces terms, avoids overlap,
   distinguishes status and gives readers a useful next step.
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
