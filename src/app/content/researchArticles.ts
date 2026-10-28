export type ResearchArticle = {
  opening: string;
  sections: { title: string; text: string }[];
  related: string[];
  references?: { title: string; url: string }[];
};

// Introductions describe current code and research directions, not deployment guarantees.
export const researchArticles: Partial<Record<string, ResearchArticle>> = {
  "philosophy": {
    "opening": "Can we build intelligence by understanding and adapting how the brain’s mechanisms work together? Sapiens begins with this question. Our ambition is to investigate how intelligent behaviour could develop through the interaction of computational mechanisms, guided by neuroscience and philosophical questions about intelligence.",
    "sections": [
      {
        "title": "What we want to understand",
        "text": "Consider someone encountering an unfamiliar situation. They may connect it to an earlier experience, notice a conflict, reconsider what they believe and decide what to try next. We want to understand what makes this continuing process possible: how experience changes later behaviour, how something becomes relevant at a particular moment, and how understanding carries across situations."
      },
      {
        "title": "Why look to the brain?",
        "text": "Human intelligence gives us a concrete example of learning from experience, adapting to unfamiliar situations and coordinating thought with action. Studying the brain offers a way to investigate how those abilities arise and work together. Neuroscience provides concepts and evidence to examine; philosophy helps us ask what understanding and agency mean. We use both to guide computational experiments, while leaving open which biological principles can usefully transfer to software."
      },
      {
        "title": "Our hypothesis",
        "text": "Our hypothesis is that intelligence may emerge when computational mechanisms, informed by neuroscience and philosophical concepts of intelligence, interact and develop through experience. We want to investigate whether their combined activity can give rise to ways of understanding and acting that we have not explicitly prescribed for each situation. Which mechanisms are needed, how they should interact and what their interaction can produce remain open research questions."
      },
      {
        "title": "How questions lead to mechanisms",
        "text": "We begin with a problem, such as how an earlier experience could help in a new situation. We then examine scientific accounts, choose an explicit computational interpretation and connect it to the wider system. The design must explain what information it needs, how experience can change it and how its contribution could be observed. This is how we want to arrive at mechanisms: through the questions they address, with their assumptions visible."
      },
      {
        "title": "An investigation that remains open",
        "text": "This hypothesis needs evidence, and our designs must remain open to revision. The next articles explain what we mean by intelligence and emergence, and introduce the scientific ideas guiding the work. The Experiments section examines how we can evaluate the approach and what our observations can support."
      }
    ],
    "related": [
      "intelligence-understanding",
      "inspiration",
      "emergence",
      "evaluation"
    ]
  },
  "emergence": {
    "opening": "How could intelligence arise from the interaction of processes that each do something more limited? This is the question behind our use of emergence. It directs attention to how a system is organized and how its parts influence one another over time.",
    "sections": [
      {
        "title": "Looking at the whole",
        "text": "We use emergence as a working idea about abilities or patterns that arise through the organization and interaction of a system’s parts. Understanding each part in isolation may leave important questions about the whole unanswered. Different philosophical accounts give this idea different meanings; our starting point is to investigate the contribution of interactions, without assuming that they introduce something beyond computational explanation."
      },
      {
        "title": "An example of the question",
        "text": "Imagine a system encounters a difficulty, retains the experience and later recognizes a related problem in an unfamiliar setting. That recognition changes what it investigates, and the resulting experience changes its future judgment. The ability we are interested in belongs to this continuing relationship between experience and behaviour. This is an illustration of what we want to study, not a claim that Sapiens has already demonstrated it."
      },
      {
        "title": "What we intend to design",
        "text": "We can design ways for information to be retained, connected, reconsidered and used. We can also decide how those processes communicate. Our hypothesis concerns what may develop when they operate together across experience, including responses to situations we did not anticipate individually. The design supplies the conditions for investigation; adding more components does not establish that intelligence will emerge."
      },
      {
        "title": "Surprise is not enough",
        "text": "An unexpected response can be a mistake, a chance result or an ability already present in the underlying model. Equally, a useful outcome can follow directly from a procedure we explicitly designed. Calling something emergent therefore requires a clear account of the behaviour and why the system’s interactions matter to it. We do not use the word as a substitute for that explanation."
      },
      {
        "title": "The question we carry forward",
        "text": "We want to understand whether interacting mechanisms can contribute to adaptable intelligence that develops through experience. This leaves two connected questions: what we mean by intelligence, and how we could establish the contribution of the mechanisms. The linked articles examine those questions without treating emergence or consciousness as an achieved result."
      }
    ],
    "related": [
      "philosophy",
      "intelligence-understanding",
      "firsthand-experience",
      "evaluation",
      "alternative-explanations"
    ],
    "references": [
      {
        "title": "Stanford Encyclopedia of Philosophy — Emergent Properties",
        "url": "https://plato.stanford.edu/entries/properties-emergent/"
      }
    ]
  },
  "intelligence-understanding": {
    "opening": "What should we mean when we say a system understands something? Producing a plausible explanation is different from using an idea appropriately when the situation changes.",
    "sections": [
      {
        "title": "Our working question",
        "text": "We are interested in understanding that connects context, consequences and experience. Can a Sapien distinguish a person's request from background information, explain uncertainty, and revise a decision when the supporting evidence changes?"
      },
      {
        "title": "How we study it",
        "text": "We examine decisions and their consequences alongside the information available at the time. This gives us observable questions to investigate without claiming a complete definition of intelligence or treating fluent language as sufficient evidence."
      }
    ],
    "related": [
      "firsthand-experience",
      "awareness",
      "experience-evaluation"
    ]
  },
  "self-agency": {
    "opening": "What makes an action the action of one continuing individual when many processes contribute to it? Questions about self and agency motivate how we separate identity, decisions and execution.",
    "sections": [
      {
        "title": "Our interpretation",
        "text": "A Sapien has one shared identity. Its engines contribute different functions; they are not separate people taking turns. Incoming statements remain attributed to their speakers, while the Sapien evaluates what they mean for its own role and actions."
      },
      {
        "title": "Responsibility in practice",
        "text": "Receiving a suggestion does not automatically authorize carrying it out. Decisions should consider the request, available evidence, capabilities and role. This is an engineering account of responsibility and continuity, not a resolution of philosophical debates about free will."
      }
    ],
    "related": [
      "identity",
      "awareness",
      "motor-conversation"
    ]
  },
  "consciousness": {
    "opening": "Would coherent behaviour, a persistent identity or a report about internal thoughts establish consciousness? We do not assume that they would.",
    "sections": [
      {
        "title": "Why the question matters",
        "text": "Consciousness motivates questions about attention, shared access to information and the relationship between many processes and a unified perspective. These questions can inform architecture even where subjective experience cannot be established from the system's output."
      },
      {
        "title": "Our boundary",
        "text": "Awareness is the name of a computational function. A stored thought or first-person sentence is not evidence of subjective experience. We distinguish investigating mechanisms associated with conscious access from claiming that Sapiens is conscious."
      }
    ],
    "related": [
      "perception-attention",
      "self-agency",
      "research-limitations"
    ]
  },
  "firsthand-experience": {
    "opening": "If two Sapiens begin with the same language model but encounter different situations, should their later decisions differ? We want their own histories to matter, beyond the knowledge supplied by the model.",
    "sections": [
      {
        "title": "Learning by taking part",
        "text": "A failed tool operation, a person's correction or a changed plan can become experience with a source and outcome. Memories, associations and practical guidance can make that experience available during later decisions. This does not require retraining the underlying model."
      },
      {
        "title": "What we still need to establish",
        "text": "Retaining a transcript is not enough. We need to measure whether an experience helps in a later situation, whether the lesson transfers appropriately, and whether contradictory evidence can correct an earlier interpretation."
      }
    ],
    "related": [
      "memory",
      "tool-learning",
      "experience-evaluation"
    ]
  },
  "continuity": {
    "opening": "How can an individual develop over time without merely accumulating an ever-longer history? Continuity motivates keeping useful experience while allowing earlier understanding to be reconsidered.",
    "sections": [
      {
        "title": "What should persist",
        "text": "Identity, remembered events, unfinished intentions and lessons can outlast a single interaction. They have different purposes: a memory describes experience, a goal describes a desired outcome, and a lesson interprets what may help next time."
      },
      {
        "title": "Development remains an open question",
        "text": "Persistent storage supports continuity, but does not guarantee improving judgment. We need to examine stale beliefs, repeated mistakes and changes across longer histories, not just whether records survived between sessions."
      }
    ],
    "related": [
      "identity",
      "memory",
      "goals"
    ]
  },
  "inspiration": {
    "opening": "What can neuroscience teach us about building interacting computational mechanisms? Our starting point is to understand a concept's purpose before borrowing its name.",
    "sections": [
      {
        "title": "From a concept to a design question",
        "text": "Working memory raises questions about what stays active now. Associative memory suggests ways experience can cue related experience. Workspace theories ask how selected information becomes available across processes. These are different motivations, not interchangeable labels for one language-model prompt."
      },
      {
        "title": "How to read these foundations",
        "text": "The foundation articles introduce scientific ideas and selected reading. Engine articles explain our engineering interpretations and current limits. A memory graph is not a neural circuit, and an engine named after a brain structure does not reproduce that structure."
      }
    ],
    "related": [
      "working-memory-foundation",
      "perception-attention",
      "reinforcement-forgetting"
    ]
  },
  "perception-attention": {
    "opening": "How can one piece of information become available to several processes while much other information remains outside the current focus? Global Workspace Theory and the Global Neuronal Workspace model offer influential ways to investigate this question.",
    "sections": [
      {
        "title": "The scientific idea",
        "text": "Workspace accounts emphasize selected information becoming broadly accessible to otherwise specialized processes. The neuronal model connects this proposal to distributed neural activity. Attention and conscious access are related research topics, but should not be treated as identical concepts."
      },
      {
        "title": "Our engineering interpretation",
        "text": "Awareness draws inspiration from selection and shared availability when assembling a coherent focus. Our Bus transports information, but transport alone is not a global workspace. The current software does not reproduce neuronal dynamics or establish conscious experience."
      }
    ],
    "related": [
      "awareness",
      "working-memory-foundation",
      "consciousness"
    ],
    "references": [
      {
        "title": "Dehaene, Kerszberg & Changeux — A neuronal model of a global workspace (1998)",
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC24407/"
      },
      {
        "title": "Dehaene & Changeux — Experimental and theoretical approaches to conscious processing (2011)",
        "url": "https://pubmed.ncbi.nlm.nih.gov/21521609/"
      }
    ]
  },
  "working-memory-foundation": {
    "opening": "How do we keep information available while using it, without bringing everything we have ever learned into the same moment? This is the motivation for studying working memory.",
    "sections": [
      {
        "title": "The scientific idea",
        "text": "Working memory concerns information maintained and used for ongoing cognition. Theories differ in how they describe storage, attention and control. Its relationship to long-term memory is important: information can be retained over time without being active in the current task."
      },
      {
        "title": "Where this leads in Sapiens",
        "text": "Our Working Memory engine keeps a bounded set of active references. That is a computational interpretation of selective availability, not a claim to reproduce human working-memory capacity or its full biological mechanisms."
      }
    ],
    "related": [
      "working-memory-engine",
      "associative-memory"
    ],
    "references": [
      {
        "title": "Cowan — What are the differences between long-term, short-term, and working memory? (2008)",
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC2657600/"
      }
    ]
  },
  "associative-memory": {
    "opening": "Why might one experience bring another to mind? Associative memory motivates connecting experiences so that retrieval can use relationships as well as matching words.",
    "sections": [
      {
        "title": "The idea we borrow",
        "text": "Learning can change relationships between representations. In our design, an event may be connected to its context, related events or experiences recalled alongside it. These relationships have different meanings; appearing together does not establish causation or prove a factual claim."
      },
      {
        "title": "From inspiration to implementation",
        "text": "Engram combines searchable content with stored relationships and source context. Its co-recall strengthening is one specific mechanism, described separately under Hebbian strengthening. The practical question is whether those connections help retrieve useful evidence without amplifying mistaken associations."
      }
    ],
    "related": [
      "memory",
      "reinforcement-forgetting",
      "replay-consolidation"
    ],
    "references": [
      {
        "title": "Kennedy — Synaptic signaling in learning and memory",
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC4743082/"
      }
    ]
  },
  "reinforcement-forgetting": {
    "opening": "Could repeated joint use make a relationship easier to recover later? Hebbian learning and synaptic plasticity inspire this question about how experience changes connections.",
    "sections": [
      {
        "title": "The scientific inspiration",
        "text": "Hebbian ideas associate coordinated activity with changes in connection strength. Biological plasticity includes many interacting mechanisms; it is not a universal rule that repetition makes an idea correct. Strengthening and balancing processes must be considered together."
      },
      {
        "title": "Our interpretation and its risk",
        "text": "Engram strengthens a bounded set of links between memories recalled together. Replay also reduces co-recall weights proportionally to keep strengthening relative. These are changes to memory associations, not to the language model's weights. Repeated retrieval can reinforce a poor association too, so usefulness must be evaluated separately."
      }
    ],
    "related": [
      "memory",
      "hippocampus",
      "experience-evaluation"
    ],
    "references": [
      {
        "title": "Kennedy — Synaptic signaling in learning and memory",
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC4743082/"
      }
    ]
  },
  "replay-consolidation": {
    "opening": "Can revisiting experience change memory even when no new event arrives? Research on neural reactivation and consolidation motivates studying learning beyond immediate interaction.",
    "sections": [
      {
        "title": "The scientific inspiration",
        "text": "Studies of hippocampal activity have found reactivation during sleep of patterns related to earlier experience. This supports investigation of how offline activity contributes to memory. It does not imply that replaying text or database records reproduces biological sleep."
      },
      {
        "title": "Our adaptation",
        "text": "Hippocampus schedules revisiting selected memories, while Engram owns the resulting association changes. We also balance co-recall strengths rather than only increasing them. Whether this improves later recall and decisions remains a separate experimental question."
      }
    ],
    "related": [
      "hippocampus",
      "reinforcement-forgetting",
      "experience-evaluation"
    ],
    "references": [
      {
        "title": "Wilson & McNaughton — Reactivation of hippocampal ensemble memories during sleep (1994)",
        "url": "https://pubmed.ncbi.nlm.nih.gov/8036517/"
      }
    ]
  },
  "prediction-reward-foundation": {
    "opening": "How does an expected outcome differ from what actually happens, and why should that difference matter? Prediction, novelty and reward prediction error address related but distinct questions.",
    "sections": [
      {
        "title": "The scientific idea",
        "text": "Novelty concerns unfamiliarity; a reward prediction error concerns a difference between expected and obtained reward. Research on dopamine signals connects such errors to learning. A surprising event is not necessarily rewarding, and a useful event is not necessarily novel."
      },
      {
        "title": "Our research direction",
        "text": "We explore whether expectations and outcome differences could help a Sapien interpret experience. The current experimental predictive engines are not integrated into the main runtime. Their numerical signals should not be confused with feelings or a complete biological reward system."
      }
    ],
    "related": [
      "predictive-engines",
      "prediction",
      "reward-emotion"
    ],
    "references": [
      {
        "title": "Schultz — Dopamine reward prediction error coding (2016)",
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC4826767/"
      }
    ]
  },
  "architecture-overview": {
    "opening": "If intelligence depends on interacting mechanisms, how should those mechanisms cooperate without losing their distinct responsibilities? This question shapes the Sapiens architecture.",
    "sections": [
      {
        "title": "One individual, several responsibilities",
        "text": "Awareness selects and assesses action. Motor executes tools. Conversation owns communication records and delivery. Memory, Goals and learning engines retain different kinds of state. They contribute to one individual rather than acting as independently invented personalities."
      },
      {
        "title": "Connecting the parts",
        "text": "Shared contracts and an event bus carry observations and references between components. Each engine owns its interpretations and stored state. Some functions operate in the current decision flow; others run as background work. A module's existence does not mean it is connected to every other engine."
      }
    ],
    "related": [
      "identity",
      "process",
      "connections"
    ]
  },
  "identity": {
    "opening": "How do multiple functions remain part of one individual, and how does that individual distinguish its own perspective from someone else's words? Shared identity is our response to this architectural question.",
    "sections": [
      {
        "title": "One shared self",
        "text": "Current identity is supplied to the system's processing functions. Awareness, memory and goals operate for the same Sapien. An engine does not acquire a separate personal identity merely because its instructions address it as 'you'."
      },
      {
        "title": "Preserving other perspectives",
        "text": "Messages retain their original speaker, audience and context. If someone says 'I own this decision', the system should not interpret that as its own authority. This distinction matters in both live reasoning and remembered experience; it supports consistent attribution without proving consciousness."
      }
    ],
    "related": [
      "self-agency",
      "connections",
      "awareness"
    ]
  },
  "process": {
    "opening": "How does an incoming experience become a considered action, and what happens after that action? We want a continuing process rather than an isolated answer with no remembered consequences.",
    "sections": [
      {
        "title": "The current flow",
        "text": "Incoming information or scheduled reconsideration can enter Awareness. It prepares a focus, gathers supporting context and decides whether to act, communicate, defer or wait. When tools are used, Motor returns execution evidence so subsequent reasoning can consider what actually happened."
      },
      {
        "title": "After the decision",
        "text": "Assessment describes the outcome and unfinished work. Other engines can receive that evidence and apply their own responsibilities, such as evaluating a goal or retaining an experience. An intended action, a successful tool response and a completed objective remain different things."
      }
    ],
    "related": [
      "awareness",
      "motor-conversation",
      "goals",
      "action-feedback"
    ]
  },
  "connections": {
    "opening": "How can information move between engines without losing who said it, when it happened or what it refers to? A bare text summary can lose the relationships needed to interpret it.",
    "sections": [
      {
        "title": "References beside information",
        "text": "Shared references identify the source records an engine may need to revisit. The owner of a record provides access through the resolver boundary. Source content, attribution and derived interpretations remain distinguishable as they move through the system."
      },
      {
        "title": "What a connection does not decide",
        "text": "The Bus delivers information; it does not decide whether it is true or whether a goal is complete. A reference is a way to locate evidence, not proof of relevance. Retrieval is bounded, and unavailable records must remain explicitly unavailable rather than being reconstructed by guesswork."
      }
    ],
    "related": [
      "identity",
      "architecture-overview",
      "goals"
    ]
  },
  "language-models": {
    "opening": "What should a language model contribute when the aim is a continuing individual with experience? We treat the model as a powerful processing capability within a wider system.",
    "sections": [
      {
        "title": "What the model supplies",
        "text": "Models help interpret language, evaluate context, propose actions and produce structured interpretations. Memory, identity, tools and persistent records supply information about this particular Sapien and its situation that model training alone cannot provide."
      },
      {
        "title": "Why the distinction matters",
        "text": "Different models or prompt presentations can change behaviour substantially. Remembering a lesson is not the same as updating model weights. Evaluating Sapiens therefore requires separating the model's abilities from the contribution of the surrounding mechanisms."
      }
    ],
    "related": [
      "firsthand-experience",
      "architecture-overview",
      "alternative-explanations"
    ]
  },
  "awareness": {
    "opening": "How can many incoming observations and remembered concerns become one coherent present focus? Awareness is motivated by this question, with attention and workspace ideas informing the design.",
    "sections": [
      {
        "title": "What the engine does",
        "text": "The current flow prepares a focus, selects supporting context, makes decisions and assesses outcomes. It can use tool results in further decisions within the same cycle. Original events retain their attribution beside derived interpretations, so a proposed task is not silently substituted for what someone actually said."
      },
      {
        "title": "Where its responsibility ends",
        "text": "Awareness decides; Motor executes; Conversation delivers messages; Goals interprets progress against its own records. Waiting is a valid decision, but unfinished work needs an explicit continuation path. This loop is a computational approach to coordinated activity, not a claim of consciousness."
      }
    ],
    "related": [
      "perception-attention",
      "process",
      "hold",
      "motor-conversation"
    ]
  },
  "memory": {
    "opening": "How can an experience remain useful after the immediate interaction has ended? Engram is motivated by long-term memory, associative recall and the need to preserve the context of what was learned.",
    "sections": [
      {
        "title": "What happens to an experience",
        "text": "Ingestion extracts memory units with source context. Enrichment adds retrieval aids and relationships, and recall assembles relevant material for a consumer. The system distinguishes original observations from interpretations rather than treating every remembered sentence as an established fact."
      },
      {
        "title": "How connections change",
        "text": "Recalling memories together strengthens selected co-recall links. Replay revisits memories through this same mechanism. These changes concern stored associations; Tool Learning owns its separate practical lessons. A retrieved memory can still be incomplete, stale or misleading, so retrieval is not a guarantee of correctness."
      }
    ],
    "related": [
      "associative-memory",
      "reinforcement-forgetting",
      "hippocampus",
      "working-memory-engine"
    ]
  },
  "working-memory-engine": {
    "opening": "What should remain active for the next decision without copying the entire long-term memory store? Our Working Memory engine adapts the idea of maintaining a limited current context.",
    "sections": [
      {
        "title": "What it retains",
        "text": "It stores references and activation information, resolving content from the owning records when needed. Activation can decay, repeated activation can strengthen an entry, and capacity pressure removes weaker entries from the active set. Removing an active reference does not delete its original memory."
      },
      {
        "title": "Current integration",
        "text": "Awareness selects supporting context and retains assessed thoughts through the shared interfaces. Engram and the other memory-related engines are not automatically connected through Working Memory. Its limits are engineering choices, not claims about human memory capacity."
      }
    ],
    "related": [
      "working-memory-foundation",
      "memory",
      "awareness"
    ]
  },
  "hippocampus": {
    "opening": "Why revisit memories when there is no immediate request to answer? Research on replay motivates a separate responsibility for bringing selected experiences back into use.",
    "sections": [
      {
        "title": "The implemented replay flow",
        "text": "The Hippocampus engine drives scheduled replay: it asks Engram for memories to revisit, recalls their content, and requests balancing of co-recall links. Engram owns the association changes. Hippocampus determines the replay activity rather than directly rewriting memory content."
      },
      {
        "title": "What remains separate",
        "text": "An older design for bundling co-active information is dormant. The live replay driver is not a complete model of the biological hippocampus, and its usefulness must be assessed through later retrieval and behaviour rather than the number of replay operations."
      }
    ],
    "related": [
      "replay-consolidation",
      "memory",
      "experience-evaluation"
    ]
  },
  "goals": {
    "opening": "How can a Sapien retain an intention after the interaction that introduced it has ended? Goals and planning address continuity of purpose and the difference between activity and progress.",
    "sections": [
      {
        "title": "Desired outcomes and evidence",
        "text": "Goals owns desired outcomes, progress, completion and review decisions. Assessed Awareness outcomes reach it through the Bus. It interprets that evidence against the whole goal rather than treating a successful call or a completed Awareness cycle as automatic completion."
      },
      {
        "title": "Reconsidering unfinished work",
        "text": "A due review can surface a goal for Awareness to reconsider. Plans can represent steps, but not every goal needs a plan. References help connect the work to its supporting context; they do not guarantee that every later conversation will be correctly recognized as relevant progress."
      }
    ],
    "related": [
      "continuity",
      "hold",
      "connections",
      "awareness"
    ]
  },
  "hold": {
    "opening": "How can a Sapien wait for a missing condition without either forgetting the work or repeatedly attempting the same blocked action? Hold gives deferred matters an explicit place.",
    "sections": [
      {
        "title": "What is retained",
        "text": "A held matter records the intended outcome, the blocker and evidence that could make reconsideration useful. Later experience can lead to a readiness assessment and, when the configured integration is active, bring the matter back to Awareness."
      },
      {
        "title": "Ready is not done",
        "text": "Hold does not perform the action or prove that all uncertainty has disappeared. Awareness still decides what to do with the new evidence. This separates waiting from abandonment and readiness from execution."
      }
    ],
    "related": [
      "goals",
      "awareness",
      "action-feedback"
    ]
  },
  "reasoning-questioning": {
    "opening": "What question would help clarify a situation, and who should decide whether to pursue it? Generating a question and acting on it are separate responsibilities.",
    "sections": [
      {
        "title": "What exists today",
        "text": "Awareness uses the language model for reasoning in its decision flow. The independent Questioning engine generates questions from supplied content and context. Its background path saves generated questions for later inspection without making the current Awareness cycle wait for them."
      },
      {
        "title": "What is not connected yet",
        "text": "Saved questions do not automatically contact people, create goals or start another Awareness cycle. Curiosity is a distinct capability for evaluating what is worth exploring. Connecting these capabilities requires a deliberate decision about how questions become useful future work."
      }
    ],
    "related": [
      "curiosity",
      "awareness",
      "initiative"
    ]
  },
  "curiosity": {
    "opening": "Why explore one possibility rather than another? Curiosity may begin with an unfamiliar pattern, a possible connection or interest in another person, not only a missing answer.",
    "sections": [
      {
        "title": "The current capability",
        "text": "The Curiosity engine can evaluate caller-supplied candidates and context, select a candidate or none, and explain its judgment. It does not independently gather all possible interests or decide how to carry out an exploration."
      },
      {
        "title": "Integration is still open",
        "text": "Automatic connections to Questioning, memory and Awareness are currently disconnected. The capability remains callable, but there is no continuous curiosity-driven exploration loop. We want future integration to support context-sensitive interest without forcing activity at fixed intervals."
      }
    ],
    "related": [
      "initiative",
      "reasoning-questioning",
      "motivation-action"
    ]
  },
  "action-feedback": {
    "opening": "How can a later observation change our understanding of an earlier action? Feedback is motivated by the gap between what we intended, what executed and what eventually happened.",
    "sections": [
      {
        "title": "Interpreting consequences",
        "text": "Motor records execution facts. Feedback examines new observations alongside earlier behaviour and supporting evidence, then retains a finding with its source and uncertainty. For example, a person's reply may show that an apparently successful message did not answer their question."
      },
      {
        "title": "Learning has an owner",
        "text": "A finding is a revisable interpretation, not a command to rewrite every engine's state. Receivers own their responses. Feedback can operate in observation or active modes; a shared signal saying that context was used does not, by itself, establish that the context helped."
      }
    ],
    "related": [
      "motor-conversation",
      "tool-learning",
      "experience-evaluation"
    ]
  },
  "tool-learning": {
    "opening": "Why should a Sapien repeat the same tool-use mistake after encountering a useful correction? Tool Learning explores retaining practical experience without turning it into rigid instructions.",
    "sections": [
      {
        "title": "From attempts to guidance",
        "text": "The engine considers linked tool activities and results, retaining bounded lessons with conditions, uncertainty and evidence. Awareness can retrieve relevant guidance during its decision flow and judge whether it applies to the present situation."
      },
      {
        "title": "Advice rather than authority",
        "text": "A lesson does not execute a tool, change its schema or grant permission. Motor remains responsible for execution, and the original evidence remains separate from the interpretation. Later experience can support revision; using a lesson is not proof that it was beneficial."
      }
    ],
    "related": [
      "firsthand-experience",
      "motor-conversation",
      "action-feedback"
    ]
  },
  "motor-conversation": {
    "opening": "How do we keep choosing an action separate from carrying it out, and internal reasoning separate from speaking to another person? These boundaries matter whenever a decision has an external effect.",
    "sections": [
      {
        "title": "Motor and Conversation",
        "text": "Motor discovers and executes tools and returns execution facts. Conversation retains messages, correlates responses and handles outward delivery. Awareness decides what to attempt and what to communicate; neither execution nor transcript storage should invent a second decision."
      },
      {
        "title": "Why this matters",
        "text": "Sending through a messaging tool and delivering a conversational reply can otherwise produce duplicate or misplaced messages. A successful delivery confirms transport, not understanding or task completion. Clear ownership makes failures and later feedback easier to interpret."
      }
    ],
    "related": [
      "process",
      "awareness",
      "action-feedback"
    ]
  },
  "predictive-engines": {
    "opening": "Could expectations, novelty and differences in value help organize learning? The experimental Cortex, Cerebellum and Dopamine modules explore a narrow computational version of this idea.",
    "sections": [
      {
        "title": "What the prototypes represent",
        "text": "Cortex estimates value from supplied state examples. Cerebellum stores supplied expectations and compares observations for novelty. Dopamine combines observed value with prediction to compute an error signal and drive their updates."
      },
      {
        "title": "Current boundary",
        "text": "These modules are not wired into the main orchestrated runtime. Their names identify inspirations, not full models of the corresponding brain structures or chemistry. Goal inputs and predictions must be supplied explicitly; they do not yet form an autonomous predictive understanding system."
      }
    ],
    "related": [
      "prediction-reward-foundation",
      "prediction",
      "reward-emotion"
    ]
  },
  "weave": {
    "opening": "How could several experiences become a broader idea, and how should that idea change when evidence conflicts with it? Weave names our exploration of higher-level understanding.",
    "sections": [
      {
        "title": "The intended responsibilities",
        "text": "Abstraction would identify patterns; synthesis would connect them; evaluation would examine their support; belief revision would reconsider them as evidence changes. Keeping evidence traceable matters so that a persuasive generalization does not become detached from its origins."
      },
      {
        "title": "Current implementation",
        "text": "The repository contains preliminary components, but no active Weave coordinator or integrated workflow. Several components need implementation work before use. Questioning is an independent capability and should not be taken as evidence that the wider Weave design is running."
      }
    ],
    "related": [
      "abstraction",
      "imagination",
      "intelligence-understanding"
    ]
  },
  "simulation": {
    "opening": "How can we observe a continuing Sapien across conversations, tool use and changing circumstances? Simulated workplaces let us examine sequences of behaviour rather than only isolated answers.",
    "sections": [
      {
        "title": "How the experiments work",
        "text": "Cases define people, knowledge, events and expected boundaries. Simulated tool adapters provide the workplace while the Sapien uses its core engines. We inspect messages, actions, memory, goals and background work to understand the path from information to outcome."
      },
      {
        "title": "What the simulation can tell us",
        "text": "The simulated world can also be wrong: missing responses or misleading dialogue can cause downstream mistakes. We therefore trace who introduced an error before attributing it to the Sapien. These runs are diagnostic experiments, not yet evidence of general intelligence."
      }
    ],
    "related": [
      "findings",
      "evaluation",
      "research-limitations"
    ]
  },
  "findings": {
    "opening": "When behaviour goes wrong, is the cause the model, missing context, a broken handoff or the simulated world? Our investigations start by reconstructing what information reached each decision.",
    "sections": [
      {
        "title": "What earlier runs exposed",
        "text": "We observed attribution confusion, unfinished outreach, malformed tool arguments and repetitive simulated replies. Inspection showed different causes: some involved model interpretation, while others involved how source context, progress or execution evidence travelled through the system."
      },
      {
        "title": "How we use a finding",
        "text": "We try to fix the general mechanism rather than prescribe the right answer to one case. Changes to attribution, outcome handling, validation and simulation dialogue need verification in subsequent runs. A code correction is not itself a measured improvement in intelligence."
      }
    ],
    "related": [
      "connections",
      "simulation",
      "experience-evaluation"
    ]
  },
  "experience-evaluation": {
    "opening": "Does retaining experience actually improve the next decision? More memories, stronger associations or more lessons are not sufficient answers.",
    "sections": [
      {
        "title": "Comparisons we want to make",
        "text": "We want to compare equivalent situations with and without relevant prior experience, replay or learned guidance. Useful measures include appropriate action, fewer repeated mistakes, correction after contradictory evidence and transfer to unfamiliar situations."
      },
      {
        "title": "Keep the cost and failure modes visible",
        "text": "Memory can introduce stale assumptions, replay can reinforce weak associations, and guidance can be applied outside its scope. Evaluations should record these failures and the processing cost, while separating model changes from changes to the memory mechanisms. This is an evaluation plan, not a published benchmark result."
      }
    ],
    "related": [
      "firsthand-experience",
      "reinforcement-forgetting",
      "tool-learning"
    ]
  },
  "evaluation": {
    "opening": "What observation would strengthen our hypothesis, and what observation would challenge it? We need questions that can be tested rather than defining every successful behaviour as emergence.",
    "sections": [
      {
        "title": "A proposed evaluation approach",
        "text": "Hold the underlying model and task conditions comparable, then change one mechanism or connection. Examine whether useful behaviour persists across unfamiliar situations and repeated runs. Removing a component can help reveal whether it contributes beyond extra context or additional model calls."
      },
      {
        "title": "Evidence before conclusions",
        "text": "We should publish conditions, failures and alternative explanations alongside successful examples. Current simulations help identify engineering problems, but do not yet provide a controlled demonstration that interacting mechanisms produce emergent intelligence."
      }
    ],
    "related": [
      "emergence",
      "alternative-explanations",
      "research-limitations"
    ]
  },
  "alternative-explanations": {
    "opening": "If a Sapien behaves impressively, what else could explain it? Considering alternatives protects the research question from becoming a conclusion assumed in advance.",
    "sections": [
      {
        "title": "Possible explanations",
        "text": "The underlying model may already know how to handle the task. A prompt may contain the needed answer, a simulation may guide the expected behaviour, or repeated attempts may produce a successful result by chance. More computation can also improve performance without any lasting learning."
      },
      {
        "title": "How to distinguish them",
        "text": "Compare models and prompts carefully, preserve unsuccessful runs, and vary the mechanisms under study. A compelling demonstration can motivate an experiment, but cannot replace one. We want explanations that survive these comparisons."
      }
    ],
    "related": [
      "language-models",
      "evaluation",
      "simulation"
    ]
  },
  "research-limitations": {
    "opening": "How far can our present evidence support the claims we want to make? Making the limits explicit helps separate a research direction from an established capability.",
    "sections": [
      {
        "title": "Limits of the current system",
        "text": "Several mechanisms are incomplete or disconnected. Decisions and interpretations remain fallible, and retrieval may omit relevant information. A simulated workplace only samples a small part of the situations an individual could encounter."
      },
      {
        "title": "Limits of the conclusions",
        "text": "Biological names do not establish biological equivalence. Persistent memory does not establish understanding, and a coherent account of internal activity does not establish consciousness. We have not demonstrated the central emergence hypothesis; these pages explain what we are building and how we intend to investigate it."
      }
    ],
    "related": [
      "consciousness",
      "evaluation",
      "missing-mechanisms"
    ]
  },
  "prediction": {
    "opening": "Could a Sapien understand an unfolding situation better by retaining expectations and comparing them with new evidence? This is a direction for research, rather than a deployed predictive narrative engine.",
    "sections": [
      {
        "title": "The possibility",
        "text": "An expectation could connect earlier events to likely next developments. When observations differ, the system might reconsider its explanation, ask a question or update confidence. The useful object would include what was expected, why, and what later happened."
      },
      {
        "title": "What needs design",
        "text": "We need to decide how expectations are formed, scoped, checked and revised without treating guesses as facts. The existing predictive prototypes provide limited ingredients, not this complete process. Their integration and value still need to be established."
      }
    ],
    "related": [
      "prediction-reward-foundation",
      "predictive-engines",
      "imagination"
    ]
  },
  "imagination": {
    "opening": "How could a Sapien consider a possibility that has not happened without remembering it as something that did? Imagination and hypothesis generation require room to explore alongside clear evidence boundaries.",
    "sections": [
      {
        "title": "A direction to explore",
        "text": "Possible explanations or alternative actions could help guide investigation. A hypothesis should retain its status as a possibility, the evidence that motivated it and what could support or contradict it."
      },
      {
        "title": "What remains open",
        "text": "We have not established a dedicated imagination workflow. Its design needs a way to distinguish imagined events from observations during storage, recall and action. Generating a plausible story is only the beginning; deciding how to check it is essential."
      }
    ],
    "related": [
      "prediction",
      "weave",
      "connections"
    ]
  },
  "abstraction": {
    "opening": "When do several experiences support a general idea, and when are they merely similar examples? Abstraction is motivated by the possibility of using experience beyond its original setting.",
    "sections": [
      {
        "title": "The research direction",
        "text": "A useful abstraction would preserve the pattern, the conditions in which it applies and links to its supporting experiences. For example, a lesson about checking authority should not become an instruction to refuse every request."
      },
      {
        "title": "What needs to be established",
        "text": "Weave contains preliminary abstraction-related work, but there is no integrated higher-level learning process. We need ways to test generalizations against counterexamples and revise them without erasing the evidence that led to the earlier view."
      }
    ],
    "related": [
      "weave",
      "firsthand-experience",
      "experience-evaluation"
    ]
  },
  "motivation-action": {
    "opening": "Why act on one concern now, explore another later, or choose to rest? Motivation concerns the relationship between interests, goals, circumstances and the effort an action requires.",
    "sections": [
      {
        "title": "Our direction",
        "text": "We want decisions to reflect the available context and experience rather than fixed rules that force continual activity. Curiosity, uncertainty and ongoing intentions may contribute different reasons to act, while interruption and cost provide reasons to wait."
      },
      {
        "title": "What exists and what does not",
        "text": "Awareness already chooses actions or waiting, and Goals and Hold retain different kinds of unfinished work. That does not amount to a unified motivational system. How broader interests and value signals should influence decisions remains open."
      }
    ],
    "related": [
      "curiosity",
      "goals",
      "hold",
      "reward-emotion"
    ]
  },
  "reward-emotion": {
    "opening": "What makes an experience significant enough to influence later attention or action? Reward and emotion-inspired ideas motivate investigating value beyond merely finishing the latest request.",
    "sections": [
      {
        "title": "A research question",
        "text": "Success, surprise, uncertainty and social context may carry different kinds of significance. We want to explore how such signals could affect learning without collapsing them into a single measure that rewards repetitive or unhelpful behaviour."
      },
      {
        "title": "Present limits",
        "text": "There is an experimental reward-error module, but it is outside the main runtime. We do not claim that a numerical signal is a feeling or that Sapiens has human emotions. Designing the meaning and consequences of these signals is still research work."
      }
    ],
    "related": [
      "prediction-reward-foundation",
      "predictive-engines",
      "motivation-action"
    ]
  },
  "senses-roles": {
    "opening": "How could one individual participate in different settings without becoming a different self each time? Roles and possible future senses raise questions about continuity, context and capability.",
    "sections": [
      {
        "title": "What changes with a setting",
        "text": "A role can change responsibilities, available tools and permitted actions while experience remains part of the same individual. Workplace integrations supply access to information; their presence does not automatically provide complete knowledge of a company or project."
      },
      {
        "title": "Future directions",
        "text": "Voice and vision could add new observations to shared understanding, but this page does not claim a fully integrated multimodal system. New inputs would need to preserve their source, timing and uncertainty rather than create disconnected identities."
      }
    ],
    "related": [
      "identity",
      "connections",
      "firsthand-experience"
    ]
  },
  "missing-mechanisms": {
    "opening": "What is missing from the current architecture, and how do we decide what deserves to be added? A longer list of brain-inspired engine names is not a research outcome.",
    "sections": [
      {
        "title": "Where the gaps are",
        "text": "Our discussions include predictive understanding, imagination, abstraction and broader motivation. Existing Curiosity and Weave work also needs deliberate integration. These are different problems, each requiring a clear purpose and information flow."
      },
      {
        "title": "How we want to proceed",
        "text": "For each addition, identify the question, the evidence it needs and the behaviour that would show a useful contribution. Prefer extending an existing responsibility when it already fits. General mechanisms should leave room for learning through experience rather than embedding answers to specific scenarios."
      }
    ],
    "related": [
      "prediction",
      "weave",
      "curiosity",
      "evaluation"
    ]
  },
  "initiative": {
    "opening": "Should a Sapien only think when somebody asks it to? Our ambition includes exploration and ordinary interaction that can arise from its own continuing context.",
    "sections": [
      {
        "title": "What initiative could include",
        "text": "It might revisit an unresolved idea, inspect available information, notice a connection or begin a casual conversation. Usefulness need not mean an immediate work deliverable, but consideration for other people and available capabilities still matters."
      },
      {
        "title": "Current approach and open work",
        "text": "Awareness can consider initiative during scheduled or incoming activity, using the tools and context available to it. This does not guarantee useful exploration, and Curiosity is not automatically driving that process. We want to study initiative without forcing messages or activity at fixed intervals."
      }
    ],
    "related": [
      "curiosity",
      "motivation-action",
      "awareness"
    ]
  }
};
