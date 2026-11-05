import { useId, useState } from 'react';
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
    lead: "What should the Sapien focus on next?",
    summary: "A message, a memory, an unanswered question, an unfinished goal or its own thoughts may need attention. Awareness brings these together, chooses a focus, considers what to do and reviews the outcome.",
    details: ["This is inspired by how we focus on something while other thoughts stay in the background. In an AI agent, a similar loop gathers information, chooses actions and checks the results. This inspiration does not establish that the Sapien has conscious experiences.", "An incoming request gives the run a starting point; periodic runs consider what is available. A run can make several decisions, use tools or decide that nothing needs attention now. What it records as its own understanding is separate from a message actually sent to someone."],
  },
  'working-memory': {
    lead: "What information should stay close at hand?",
    summary: "While thinking, the Sapien needs some information more readily available than everything else it remembers. Working Memory keeps a limited set active, while less-used information gradually fades from this workspace.",
    details: ["It keeps references to saved information and retrieves the content when needed. Using information can strengthen its place in the workspace. Leaving this workspace does not by itself delete the original memory. Awareness uses it to support thinking; Working Memory does not choose the next focus."],
  },
  engram: {
    lead: "How can earlier experiences help with something new?",
    summary: "Engram organises information into memories, preserves where it came from and connects related ideas. These connections help the Sapien recall relevant understanding, even when the wording is different.",
    details: ["Incoming information becomes memory units: pieces that can be stored, connected and recalled. Background processing adds keywords and connections. Recall uses meaning, words and relationships to find useful context, while keeping sources and uncertainty available.", "This is inspired by long-term memory and the way one idea can bring another to mind. The Sapien builds its own stored memories; this does not retrain the underlying language model."],
  },
  goals: {
    lead: "How does an intention survive beyond the current conversation?",
    summary: "Goals keep track of what the Sapien is trying to achieve. Plans organise the proposed steps, while recorded progress and unfinished work help it reconsider what remains.",
    details: ["Goals assess new observations against the desired outcome. Plans retain steps, dependencies and results, and due reviews can bring work back for Awareness to consider. Writing a plan does not execute it, and finishing a thinking run does not automatically finish the goal."],
  },
  questioning: {
    lead: "What should the Sapien ask itself?",
    summary: "Information can leave uncertainty, reveal an assumption or open another line of thought. Questioning generates questions from that information and keeps their context so they can be considered later.",
    details: ["It receives information and supporting context, including background requests after Awareness. Saved, unresolved questions for the Sapien’s own thinking can be offered for later attention. Awareness decides whether to pursue them; creating a question does not automatically ask another person or start an investigation."],
  },
  curiosity: {
    lead: "Which possibility is worth exploring?",
    summary: "There may be unfamiliar patterns, interesting ideas or gaps in understanding. Curiosity considers the possibilities supplied to it and recommends one—or none—for its caller to pursue.",
    details: ["The part requesting a recommendation supplies the possibilities and context, then decides how to use the result. Curiosity does not currently collect possibilities or send recommendations to Awareness automatically. Older saved records remain available on this page."],
  },
  feedback: {
    lead: "What can the Sapien learn from what happened afterward?",
    summary: "A later reply or result may reveal something about an earlier action. Feedback connects them and considers what worked, what missed the point or what needs another look.",
    details: ["For example, someone’s reply may show that an earlier answer misunderstood the request. Feedback saves that interpretation with its evidence and uncertainty. The receiving engine decides what to change.", "In observe mode, findings are recorded without influencing decisions. In active mode, findings can also be offered for Awareness to consider. A finding is an interpretation that can be reconsidered, not proof that the overall task succeeded."],
  },
  'tool-learning': {
    lead: "How can experience improve the next tool attempt?",
    summary: "Tool Learning examines recorded attempts and their results, then saves useful guidance. The Sapien can consult those lessons when deciding how to use a tool again.",
    details: ["Tool descriptions and actual attempts provide the evidence. Lessons can be revised as more evidence arrives, and Awareness judges whether they apply to the current situation. A lesson does not grant permission, force an action or change the language model’s weights."],
  },
  motor: {
    lead: "How does a chosen action actually happen?",
    summary: "Motor connects the Sapien’s decision to an available tool. It checks the inputs, sends the request and records the result or error.",
    details: ["Motor discovers available operations and validates their inputs before dispatch. It does not use a language model to choose tasks. Open an attempt to see its inputs, saved result and origin; a successful tool response does not by itself establish that the whole task is complete."],
  },
  'engine-bus': {
    lead: "How do the Sapien’s different capabilities share information?",
    summary: "The Bus carries requests, observations and results between them. Each receiving engine decides how to understand and use that information.",
    details: ["It records delivery and links related requests and responses. A delivered message means information reached its recipient, not that the recipient completed the work. Normal activity and simulation runs keep their separate scopes."],
  },
  'engine-jobs': {
    lead: "How does work continue in the background?",
    summary: "Some processing takes time or needs to happen later. Engine Jobs schedules that work and tracks its progress, failures and supported retries.",
    details: ["When a scheduled time arrives, a job becomes eligible and waits for available processing capacity. The owning engine performs the work and decides whether interrupted work is safe to repeat. A pending job may therefore be waiting for its time, processing capacity or a retry."],
  },
  hold: {
    lead: "What if useful work cannot proceed yet?",
    summary: "Hold preserves the intention and what is blocking it. This makes room to gather information, wait for evidence or permission, do other work, or reconsider it at a more suitable time.",
    details: ["It keeps what needs doing, why it cannot proceed and what could make it ready. New evidence or a due review can prompt another assessment. Hold does not gather information or perform the work itself; Awareness decides what to do next.", "Observe mode assesses without influencing decisions; active mode can support deferral and reconsideration. Implementation and validation are still in progress, and this analysis view is not available yet."],
  },
  dopamine: {
    lead: "Was the outcome better or worse than expected?",
    summary: "This experimental capability compares an expected value with a scored outcome. The aim is to use that difference as a learning signal.",
    details: ["The prototype scores observations using supplied goals and how unfamiliar the observation is. It compares that score with a learned expectation and updates its stored estimates. The name refers to an inspiration from reward learning, not pleasure or feelings. It is not connected to normal runtime."],
  },
  prediction: {
    lead: "What was expected, and how does the new information compare?",
    summary: "This prototype keeps supplied predictions and measures how unfamiliar an observation is. Producing predictions autonomously is not yet integrated.",
    details: ["The existing Cerebellum code handles predictions and novelty within the experimental loop alongside Cortex and Dopamine. Callers supply the prediction information. This page names that capability; it does not represent a separate newly implemented engine."],
  },
  abstraction: {
    lead: "What do different experiences have in common?",
    summary: "The aim is to recognise a broader pattern that could be useful beyond the original examples.",
    details: ["Several experiences might support a general idea while their original evidence remains available. Partial code exists under Weave, but implementation and integration are incomplete. It is not ready for analysis."],
  },
  evaluation: {
    lead: "What gives us reason to believe an idea?",
    summary: "The aim is to examine the available evidence and uncertainty before accepting a claim.",
    details: ["Evaluation concerns how well a claim is supported. Feedback instead considers what later observations tell us about earlier behavior. The Evaluation implementation under Weave is incomplete and is not connected to normal runtime."],
  },
  'belief-revision': {
    lead: "What should change when new evidence challenges an earlier belief?",
    summary: "The aim is to reconsider existing understanding while preserving why it changed.",
    details: ["New evidence could strengthen, weaken or challenge a belief. The intended behavior is to retain those reasons and evidence, rather than automatically accept the latest statement. Partial code exists under Weave; implementation and integration are incomplete."],
  },
  synthesis: {
    lead: "What new understanding could come from connecting existing ideas?",
    summary: "The aim is to combine what is already known into possible explanations or new ideas.",
    details: ["A new explanation would still need to be distinguished from established evidence. Partial code exists under Weave, but it is not connected to normal runtime or ready for analysis."],
  },
  imagination: {
    lead: 'What else could be possible?',
    summary: 'The aim is to imagine different explanations, situations and approaches to explore new directions. These possibilities remain separate from established facts and need evidence before being accepted.',
    details: ['A what-if idea can open another direction of thought, even when it is not yet supported by evidence. The intention is to explore alternatives, compare them with what is known and keep clear which parts are imagined. This analysis view is under development and does not show generated possibilities yet.'],
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
  const detailsId = useId();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const expanded = expandedSection === section;
  return <section className="analyse-explanation" aria-label="About this capability">
    <p className="analyse-explanation-preview"><strong>{content.lead}</strong>{' '}{content.summary}</p>
    <div id={detailsId} className="analyse-explanation-continuation" hidden={!expanded}>
      {content.details.map(detail => <p key={detail}>{detail}</p>)}
    </div>
    <button type="button" className="analyse-explanation-toggle" aria-expanded={expanded} aria-controls={detailsId}
      onClick={() => setExpandedSection(expanded ? null : section)}>
      {expanded ? 'Show less' : 'Show more'}
    </button>
  </section>;
}
