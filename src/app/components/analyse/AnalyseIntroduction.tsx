import type { AnalyseSection } from './AnalyseShell';
import '../../../styles/analyse-introduction.css';

type Introduction = { lead: string; summary: string; details: string[] };

const introductions: Record<Exclude<AnalyseSection, 'simulation'>, Introduction> = {
  overview: {
    lead: 'Explore how this Sapien attends, remembers, learns and acts.',
    summary: 'Each section shows a different capability and the records available to inspect.',
    details: ['These capabilities belong to one persistent Sapien. Recorded observations, generated interpretations and proposed actions have different meanings; open a record to inspect its evidence and origin. Under-development sections describe unfinished capabilities, not demonstrated results.'],
  },
  awareness: {
    lead: 'Awareness brings selected information into the Sapien’s current focus.',
    summary: 'Incoming events, remembered thoughts and unfinished matters compete for attention; it forms a focus, gathers context, decides what to do and reflects on the outcome.',
    details: [
      'This is our computational approach to conscious attention. Its action cycle resembles an AI agent loop, while its broader role is deciding what enters that loop. This describes a design intention, not evidence of subjective consciousness.',
      'An incoming request anchors attention; periodic runs consider available candidates. A run may contain several decisions and tool calls, or select no focus. Saved understanding is distinct from a message actually sent to someone.',
    ],
  },
  'working-memory': {
    lead: 'Not everything remembered needs to stay mentally active.',
    summary: 'Working Memory keeps a limited set of information available for current reasoning, strengthening activated references and letting others fade.',
    details: ['Think of a mental workspace rather than a second archive. It stores references to information owned elsewhere, tracks their activation and retrieves their content when needed. Awareness uses it as supporting context; it does not independently choose the next focus.'],
  },
  engram: {
    lead: 'Experience becomes useful when it can be connected and recalled.',
    summary: 'Engram turns incoming information into meaningful memory units, preserves their sources, and builds relationships that help retrieve related understanding—not just matching words.',
    details: ['Extraction creates memory units; indexing and background enrichment add ways to find and connect them. Recall uses meaning, keywords and stored relationships to assemble relevant context. Source attribution distinguishes reported information from the Sapien’s own interpretation.',
      'Long-term memory and associative recall are useful analogies. This is persistent memory retrieval and enrichment, not retraining the underlying language model.'],
  },
  goals: {
    lead: 'Intentions need continuity beyond a single moment of thought.',
    summary: 'Goals retain desired outcomes and assess progress; plans organise proposed steps, dependencies and results so unfinished work can be reconsidered.',
    details: ['Goals interpret observations against their own records. Plans retain ordered work and can offer due reviews for Awareness to consider. Creating a plan does not execute its steps, and a completed Awareness run does not automatically prove that a goal or task is finished.'],
  },
  questioning: {
    lead: 'Thinking includes asking questions of our own understanding.',
    summary: 'Questioning examines supplied information to generate questions worth considering, retaining their context so Awareness can later understand what each question is about.',
    details: ['Generation runs from supplied content and context, including background requests after Awareness. Saved, unresolved questions for the Sapien’s own thinking can be offered for later attention. A question does not automatically contact someone or start an investigation; Awareness decides whether to pursue it.'],
  },
  curiosity: {
    lead: 'Many things could be explored, but some may be more worthwhile than others.',
    summary: 'Curiosity weighs supplied possibilities and recommends what deserves exploration; its caller supplies those possibilities and decides what happens next.',
    details: ['Possibilities can include observations, unfamiliar patterns, ideas or gaps in understanding—not just questions. The current selection capability can recommend one candidate or none. Automatic source collection and an Awareness connection are not currently wired; this page can still show retained historical records.'],
  },
  feedback: {
    lead: 'The meaning of an action often becomes clearer afterward.',
    summary: 'Feedback relates later observations to earlier behavior, forming evidence-backed interpretations of what worked, what missed the point, or what may need reconsideration.',
    details: ['For example, a later reply may reveal that an earlier answer missed the request. Feedback retains the relationship, interpretation, evidence and uncertainty; the receiving engine decides what to change. Observe mode records findings without influencing cognition; active mode can offer findings to Awareness.'],
  },
  'tool-learning': {
    lead: 'Helps the Sapien improve how it uses tools.',
    summary: 'It turns recorded attempts and results into revisable guidance that later decisions can consult.',
    details: ['Tool definitions and actual attempts provide evidence for lessons. Relevant guidance can accompany later Awareness decisions, which judge whether it applies. A lesson is advice, not permission, an execution rule or a change to the language model’s weights.'],
  },
  motor: {
    lead: 'Carries out tool actions chosen by the Sapien.',
    summary: 'It checks inputs, dispatches requests and records the returned results or errors.',
    details: ['Motor is the tool-execution layer: it discovers available operations and validates arguments before dispatch. It does not use an LLM to choose tasks. Open an attempt to inspect its inputs, saved result and origin; a successful tool response does not by itself establish overall task completion.'],
  },
  'engine-bus': {
    lead: 'Different capabilities contribute to one Sapien by exchanging information.',
    summary: 'The Bus carries their requests, observations and results; each receiving engine remains responsible for interpreting and using them.',
    details: ['Like a message bus in an event-driven system, it routes information and tracks delivery and correlation. Delivery confirms transport, not that a recipient completed its work. Normal runtime and simulation records retain their separate scopes.'],
  },
  'engine-jobs': {
    lead: 'Some processing needs to continue outside the immediate thinking loop.',
    summary: 'Engine Jobs schedules that background work and tracks its progress, failures and supported retries.',
    details: ['Jobs become eligible at their scheduled time and wait for worker capacity. The runtime manages claims and retry scheduling; the owning engine controls processing and whether interrupted work is safe to repeat. A pending job is not necessarily ready to run yet.'],
  },
  hold: {
    lead: 'Waiting should not mean forgetting.',
    summary: 'Hold preserves blocked intentions, giving the Sapien room to gather information, wait for new evidence or permission, or reconsider work at a more suitable time.',
    details: ['It retains what needs doing, why it cannot proceed and what could make it ready. New evidence or a due review can prompt reassessment. Hold does not gather information or perform the work itself; Awareness decides what to do next.',
      'The implementation has off, observe and active modes. Observe mode assesses without influencing decisions; active mode can support deferral and reconsideration. Integration and validation remain in progress, and this analysis view is not available yet.'],
  },
  dopamine: {
    lead: 'Unexpected outcomes can be signals for learning.',
    summary: 'This experimental mechanism measures the difference between expected value and a scored outcome.',
    details: ['The prototype compares a learned value estimate with a score based on supplied goals and novelty, then updates its value and prediction-related stores. Reward-prediction error is the design analogy; this does not represent pleasure or feelings. It is not connected to normal runtime.'],
  },
  prediction: {
    lead: 'Expectations give new observations something to be compared against.',
    summary: 'This prototype retains supplied predictions and measures how unfamiliar observations are; autonomous prediction is not integrated.',
    details: ['Prediction and novelty are handled by Cerebellum code within the experimental predictive loop, alongside Cortex and Dopamine. Callers supply prediction information. This page represents that capability, not a separate newly implemented engine.'],
  },
  abstraction: {
    lead: 'Individual experiences may reveal a reusable pattern.',
    summary: 'Abstraction is intended to extract that broader understanding.',
    details: ['For example, several experiences could support a general concept while their original evidence remains distinguishable. Partial code exists under Weave, but it is not integrated into normal runtime or ready for analysis.'],
  },
  evaluation: {
    lead: 'A plausible idea is not necessarily well supported.',
    summary: 'Evaluation is intended to assess claims against evidence and uncertainty.',
    details: ['This proposed capability concerns the support for a claim, rather than Feedback’s interpretation of earlier behavior. Its Weave implementation is incomplete and is not integrated into normal runtime.'],
  },
  'belief-revision': {
    lead: 'Understanding should remain open to correction.',
    summary: 'Belief revision is intended to strengthen, weaken or reconsider beliefs as evidence changes.',
    details: ['The intended role is to retain the reasons and evidence behind a changed belief, rather than treat the latest statement as automatically true. Partial code exists under Weave; implementation and integration are incomplete.'],
  },
  synthesis: {
    lead: 'Existing knowledge can become the starting point for something new.',
    summary: 'Synthesis is intended to combine understanding into new explanations or ideas.',
    details: ['A generated explanation would still need to be distinguished from established evidence. Partial code exists under Weave, but it is not integrated into normal runtime or ready for analysis.'],
  },
  timeline: {
    lead: 'Sequence helps explain how a conversation unfolded.',
    summary: 'Browse the selected conversation’s recorded messages in time order.',
    details: ['This view uses available conversation history. It is not a complete timeline of every engine, tool call or memory change.'],
  },
  debug: {
    lead: 'Technical details help explain unexpected behavior.',
    summary: 'Inspect the diagnostic information available for this Sapien.',
    details: ['Diagnostics support investigation of requests and processing. Missing diagnostic information does not establish that no activity occurred; use the relevant engine’s saved records for its own history.'],
  },
  usage: {
    lead: 'Understanding resource use helps explain cost and limits.',
    summary: 'Review recorded language-model and embedding usage for this Sapien.',
    details: ['Usage and accounting limits describe model resources, not the quality or completeness of work. The recorded time window and reset rules are shown alongside the usage data.'],
  },
};

export function AnalyseIntroduction({ section }: { section: Exclude<AnalyseSection, 'simulation'> }) {
  const content = introductions[section];
  return <section className="analyse-explanation" aria-label="About this capability">
    <p className="analyse-explanation-lead">{content.lead}</p>
    <p className="analyse-explanation-summary">{content.summary}</p>
    <details key={section}>
      <summary>How it works</summary>
      <div className="analyse-explanation-details">{content.details.map(detail => <p key={detail}>{detail}</p>)}</div>
    </details>
  </section>;
}
