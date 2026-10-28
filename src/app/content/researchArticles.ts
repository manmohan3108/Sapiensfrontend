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
    "opening": "How can interactions among parts produce an organized pattern or ability that no part exhibits on its own? This is the question behind emergence. For Sapiens, it motivates investigating whether intelligence could arise from the organization and interaction of computational mechanisms.",
    "sections": [
      {
        "title": "A property of the whole",
        "text": "We use emergence to describe a pattern or property that belongs to a system’s collective organization. To explain it, we need to examine both the parts and how they influence one another. Different philosophical accounts set different requirements for emergence; our starting point is a computationally explainable form, without assuming that the whole operates beyond the rules governing its parts."
      },
      {
        "title": "Example: a flock from local interactions",
        "text": "In Craig Reynolds’s Boids model, each simulated bird adjusts its movement using nearby birds: it avoids crowding, aligns with their direction and moves toward their local centre. Together, these interactions produce coordinated flocking. No individual bird contains the flock’s overall formation, and the collective pattern need not be choreographed bird by bird. The flocking pattern arises as the local movements continually influence one another."
      },
      {
        "title": "Why this illustrates emergence",
        "text": "The relevant property is the organized movement of the group. Examining one bird’s movement in isolation would miss the relationships that produce it. The local rules are deliberately designed, so emergence does not require a system with no programmed rules. It concerns how interactions generate a pattern at the level of the whole. This example illustrates collective organization; it is not evidence that flocking itself is intelligence."
      },
      {
        "title": "The hypothesis for Sapiens",
        "text": "We ask whether mechanisms informed by neuroscience and philosophy could interact in ways that support broader abilities than their individual functions provide. The object of study is that organization: how the activity of one mechanism changes what others can do, and what abilities the combined system develops. Adding components or connecting them into a workflow is only a design step. Whether their interaction produces the kind of intelligence we seek remains an open question."
      },
      {
        "title": "Keeping the claim precise",
        "text": "Remembering an experience and changing a later decision can demonstrate learning, but does not by itself establish emergence. Neither does an unexpected answer. We would need to identify the proposed ability of the whole and explain the contribution of its interactions, including what the underlying model already supplies. The Experiments section develops that evidence question; this article establishes what our hypothesis means."
      }
    ],
    "related": [
      "philosophy",
      "intelligence-understanding",
      "architecture-overview",
      "evaluation",
      "alternative-explanations"
    ],
    "references": [
      {
        "title": "Craig Reynolds — Boids: local steering and collective flocking",
        "url": "https://www.red3d.com/cwr/boids/"
      },
      {
        "title": "Stanford Encyclopedia of Philosophy — Emergent Properties",
        "url": "https://plato.stanford.edu/entries/properties-emergent/"
      }
    ]
  },
  "intelligence-understanding": {
    "opening": "What would it mean for an artificial system to understand a situation, rather than simply produce a convincing response? This question matters because our research needs a clearer destination than making conversation sound increasingly human.",
    "sections": [
      {
        "title": "Understanding something well enough to use it",
        "text": "Consider someone who learns that a project demonstration is not permission to release the product. Repeating that sentence is one ability. Applying the distinction when a colleague later asks for a release, noticing an exception and explaining what remains uncertain are further abilities. We are interested in how information becomes usable across changing circumstances."
      },
      {
        "title": "A working view of intelligence",
        "text": "For this research, we look at the capacity to interpret situations, learn from experience, adapt decisions and pursue or reconsider outcomes. These are questions to investigate together, rather than a complete definition or a single score. Good performance in one familiar setting need not imply broad understanding."
      },
      {
        "title": "What language can and cannot establish",
        "text": "An explanation gives us evidence about what a system can express. Its actions and revisions show whether that explanation remains connected to the situation. Both matter: successful behaviour without a reliable explanation can be hard to interpret, while a fluent explanation can accompany an unsuitable action."
      },
      {
        "title": "Why this leads to a continuing system",
        "text": "We want to examine understanding across encounters: what the individual retained, how a later event changed its interpretation, and whether it recognized the limits of what it knew. That motivation leads toward experience and continuity. How to test those contributions belongs in our Experiments section; here, they define the kind of understanding we hope to investigate."
      }
    ],
    "related": [
      "firsthand-experience",
      "continuity",
      "emergence",
      "evaluation"
    ]
  },
  "self-agency": {
    "opening": "What makes a decision belong to one individual when many processes contribute to it? Before designing a shared identity for Sapiens, we need to distinguish having a perspective, retaining a history and being able to act for reasons.",
    "sections": [
      {
        "title": "A continuing point of view",
        "text": "An individual can encounter the same situation at different times and understand it differently. The earlier experience still belongs to its history. Our design question is how that continuity could be represented while allowing beliefs, commitments and roles to change. A permanent name alone would not answer it."
      },
      {
        "title": "From a reaction to an action",
        "text": "Philosophical accounts of agency ask how actions relate to intentions, reasons and control, and disagree about which of these are necessary. For Sapiens, this motivates a practical question: can a decision be connected to the information and purpose that informed it, and reconsidered when those reasons change?"
      },
      {
        "title": "One perspective among other people",
        "text": "A message saying “I approved this” belongs to its speaker. Reading it should not make the approval part of the reader’s own authority or history of action. Maintaining a perspective therefore includes recognizing other perspectives, their sources and the boundaries of what each person has done."
      },
      {
        "title": "The engineering question that follows",
        "text": "We interpret the shared self as continuity across the system’s functions: interpreting, remembering and acting belong to the same Sapien. This is a design commitment, not a resolution of philosophical personhood or moral responsibility. The architecture article explains how identity and attribution are supplied to those functions."
      }
    ],
    "related": [
      "identity",
      "continuity",
      "consciousness"
    ],
    "references": [
      {
        "title": "Stanford Encyclopedia of Philosophy — Agency",
        "url": "https://plato.stanford.edu/entries/agency/"
      }
    ]
  },
  "consciousness": {
    "opening": "Could a system coordinate information, describe itself and act intelligently without having subjective experience? Consciousness makes this question unavoidable, but it also requires us to be precise about what our engineering can actually investigate.",
    "sections": [
      {
        "title": "Several questions behind one word",
        "text": "Being awake, having information available for reasoning, and there being something it feels like to have an experience are distinct concerns in the study of consciousness. A system’s ability to report an internal state does not, by itself, settle the question of subjective experience."
      },
      {
        "title": "Why the distinction matters here",
        "text": "We are interested in how information becomes available to a continuing process of consideration and action. Accounts such as Global Workspace Theory offer ideas about that functional organization. They are part of a wider scientific and philosophical debate, not an agreed recipe for producing consciousness."
      },
      {
        "title": "What the name Awareness means",
        "text": "In Sapiens, Awareness names an engineered responsibility: bringing selected information into a present focus, deciding how to respond and assessing what followed. The name reflects an inspiration. Neither the name nor a generated statement such as “I am aware” establishes that the software has conscious experience."
      },
      {
        "title": "Keeping the deeper question open",
        "text": "We can examine information sharing, self-representation and changes in behaviour without treating those observations as a complete account of consciousness. The neuroscience foundations explore workspace ideas; the engine article describes our computational interpretation. Keeping these levels distinct lets us learn from consciousness research without presenting an unresolved question as an achieved capability."
      }
    ],
    "related": [
      "self-agency",
      "perception-attention",
      "awareness",
      "research-limitations"
    ],
    "references": [
      {
        "title": "Stanford Encyclopedia of Philosophy — Consciousness",
        "url": "https://plato.stanford.edu/entries/consciousness/"
      }
    ]
  },
  "firsthand-experience": {
    "opening": "What could an AI learn from taking part in events that it would not get from receiving a description afterward? Our hypothesis is that an individual’s own history of choices and consequences can become useful context for later judgment.",
    "sections": [
      {
        "title": "Knowing a rule and encountering its consequences",
        "text": "Imagine being told that a colleague needs evidence before approving work. Later, you submit a request, discover which evidence is missing and observe how the colleague responds when it is provided. The experience connects a general instruction with a particular situation, an attempted action and its outcome."
      },
      {
        "title": "What we mean by experience",
        "text": "Here, experience means recorded participation: what information was available, what the Sapien attempted, what happened and how it interpreted the result. It does not imply a felt experience. Keeping those parts separate matters because an interpretation can be mistaken even when the underlying event was recorded correctly."
      },
      {
        "title": "Experience can mislead as well as help",
        "text": "A successful request might depend on temporary permission. A failure might come from an unavailable service rather than a poor decision. A useful memory must retain enough context to avoid turning either episode into an unrestricted rule. Later evidence should be able to challenge the lesson."
      },
      {
        "title": "From participation to development",
        "text": "Our interest is whether this history changes future choices in appropriate ways, including recognizing when an earlier experience does not apply. Memory and feedback provide different ingredients for that investigation. The experience-evaluation article asks how to distinguish useful learning from repetition, familiarity or a stronger prompt."
      }
    ],
    "related": [
      "continuity",
      "memory",
      "action-feedback",
      "experience-evaluation"
    ]
  },
  "continuity": {
    "opening": "What would it mean for an artificial individual to develop over time? Keeping a growing archive is only a starting point. The harder question is how earlier experience should influence present understanding while leaving room for correction and change.",
    "sections": [
      {
        "title": "Continuity without becoming fixed",
        "text": "A continuing individual needs some connection between past and present. Yet carrying every earlier judgment forward unchanged would make adaptation difficult. We want continuity of experience alongside revisable interpretations: remembering why an idea once seemed plausible while recognizing why it no longer applies."
      },
      {
        "title": "Development can involve letting go",
        "text": "Suppose a Sapien first learns to ask a manager for a decision. Responsibility later moves to another colleague. Useful development includes retaining the history, updating the relevant understanding and acting according to the current arrangement. Simply retrieving the most repeated instruction could preserve the wrong habit."
      },
      {
        "title": "Several kinds of change",
        "text": "Changes to remembered associations, practical guidance, active context and unfinished intentions serve different purposes. They should not all be called learning without explanation. In our present approach, experience can alter retained state and what is supplied to later reasoning; this does not imply that an experience retrains the underlying language model."
      },
      {
        "title": "A direction for investigation",
        "text": "We want to study whether these changes produce more appropriate behaviour across varied encounters, and whether the individual can recover from misleading experience. This article motivates development as a research direction. The memory and feedback articles explain current mechanisms, while Experiments addresses evidence for improvement."
      }
    ],
    "related": [
      "firsthand-experience",
      "reinforcement-forgetting",
      "experience-evaluation",
      "identity"
    ]
  },
  "inspiration": {
    "opening": "How can studying a biological brain help us design software without confusing a useful analogy with a scientific explanation? The value of neuroscience for Sapiens lies in the questions and mechanisms it suggests, together with the discipline of stating what we have adapted.",
    "sections": [
      {
        "title": "Begin with a phenomenon",
        "text": "A familiar cue can bring back a distant experience. Some information stays available while we solve a problem. Experience can change later expectations. Each phenomenon gives us a problem to explain before we choose a software component or a biological name."
      },
      {
        "title": "Choose the level of interpretation",
        "text": "A scientific account may concern synapses, neural populations, cognitive functions or observable behaviour. An engineering adaptation needs to say which level it addresses. Strengthening a stored relationship between memories, for example, is an interpretation of associative change; it does not reproduce the cellular process of changing a synapse."
      },
      {
        "title": "Make the translation explicit",
        "text": "For each mechanism, we want to identify its inputs, what changes through experience and how those changes could affect later behaviour. This makes the interpretation inspectable. If a brain-inspired name adds no explanatory value, it should not be used as evidence that a design is appropriate."
      },
      {
        "title": "How to read these foundations",
        "text": "The following articles introduce scientific concepts and their limits. Engine deep dives then explain our computational adaptations and whether they are currently connected. Experiments asks whether those adaptations contribute anything useful. These are separate steps: a convincing scientific inspiration does not establish that our particular software implementation works."
      }
    ],
    "related": [
      "philosophy",
      "perception-attention",
      "associative-memory",
      "architecture-overview"
    ]
  },
  "perception-attention": {
    "opening": "Why does some information become central to what we think and do while other information remains in the background? Attention and workspace theories address related parts of this problem: selection, and the availability of selected information to other processes.",
    "sections": [
      {
        "title": "Selection and availability",
        "text": "Attention concerns the prioritization of information. A workspace account asks how selected content can become available across otherwise specialized functions. These ideas are related, but selecting an item and sharing it are different responsibilities. Neither should be reduced to merely storing a large amount of context."
      },
      {
        "title": "The workspace proposal",
        "text": "In the neuronal workspace model developed by Dehaene, Kerszberg and Changeux, a distributed network connects specialized processors and supports effortful tasks that require coordination. This is a scientific model with particular assumptions; it is not a claim that every cognitive process must pass through a central executive."
      },
      {
        "title": "What remains debated",
        "text": "Workspace approaches contribute to the study of conscious access, but the relationship among attention, reportability and subjective experience remains contested. A computational system that shares information cannot be declared conscious simply because its architecture resembles part of a workspace account."
      },
      {
        "title": "The question for Sapiens",
        "text": "The useful engineering question is how a selected concern can bring relevant information together without losing its origin or crowding out other concerns indefinitely. Awareness is our current interpretation of that problem. Its article explains the actual selection and decision flow rather than equating a prompt, a queue or a Bus with a biological workspace."
      }
    ],
    "related": [
      "consciousness",
      "working-memory-foundation",
      "awareness",
      "connections"
    ],
    "references": [
      {
        "title": "Dehaene, Kerszberg and Changeux — A neuronal model of a global workspace in effortful cognitive tasks",
        "url": "https://pubmed.ncbi.nlm.nih.gov/9826734/"
      }
    ]
  },
  "working-memory-foundation": {
    "opening": "How do we keep an earlier part of a sentence in mind while interpreting the next part, or retain a constraint while considering an action? Working memory addresses the limited availability of information for ongoing thought.",
    "sections": [
      {
        "title": "More than a short archive",
        "text": "Working memory concerns information held available for current processing. It is commonly distinguished from long-term retention, but theories differ about how temporary storage, attention and control fit together. Some accounts emphasize separate components; others emphasize activated long-term representations and a focus of attention."
      },
      {
        "title": "Why limits matter",
        "text": "Keeping information available has limits, and interference can change what remains usable. There is no single item count that captures every task: the material, its organization and the way it is used matter. A software capacity setting therefore should not be presented as a discovered biological constant."
      },
      {
        "title": "An example of the problem",
        "text": "While deciding how to respond to a colleague, a person may need the current question, an earlier agreement and a boundary on their authority. Retaining everything they have ever heard would not explain why those particular details remain available now. Selection and maintenance need to work together."
      },
      {
        "title": "The computational interpretation",
        "text": "For Sapiens, this motivates a bounded layer of active references whose relevance can change as thinking proceeds. The Working Memory engine article explains what we currently retain and how it reaches Awareness. The scientific concept provides the question; the software’s activation rules and storage choices remain engineering decisions."
      }
    ],
    "related": [
      "perception-attention",
      "working-memory-engine",
      "memory"
    ],
    "references": [
      {
        "title": "Nelson Cowan — What are the differences between long-term, short-term, and working memory?",
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC2657600/"
      }
    ]
  },
  "associative-memory": {
    "opening": "How can a small cue bring a larger experience to mind? Remembering often involves relationships among parts of experience, which raises a design question: how can stored information remain connected without treating every connection as a reliable explanation?",
    "sections": [
      {
        "title": "A cue and its surrounding experience",
        "text": "A person’s name may remind us of an earlier conversation, the problem being discussed and something still unresolved. An associative account asks how those elements become related and how part of an experience can help reinstate more of it. Shared wording alone is not the only possible connection."
      },
      {
        "title": "Learning episodes and broader structure",
        "text": "The complementary learning systems account of McClelland, McNaughton and O’Reilly proposes different learning roles for hippocampal and neocortical systems: rapidly retaining episodes and gradually integrating structure across experience. It is one influential account of how different learning demands might be reconciled, rather than a complete description of memory."
      },
      {
        "title": "Association is not a conclusion",
        "text": "Two events may occur together without one causing the other. A remembered link can suggest where to look, but the original context still matters when deciding what it means. For software, this distinction is especially important when associations are generated or ranked rather than directly observed."
      },
      {
        "title": "From the idea to a memory system",
        "text": "Engram explores connected memory units, contextual information and multiple routes for recall. Its records are computational representations, not individual biological neurons. The next foundations explain how relationships might strengthen and why revisiting experience matters; the Engram article describes which of those ideas are implemented."
      }
    ],
    "related": [
      "reinforcement-forgetting",
      "replay-consolidation",
      "memory"
    ],
    "references": [
      {
        "title": "McClelland, McNaughton and O’Reilly — Why there are complementary learning systems in the hippocampus and neocortex",
        "url": "https://web.stanford.edu/~jlmcc/papers/McCMcNaughtonOReilly95.pdf"
      }
    ]
  },
  "reinforcement-forgetting": {
    "opening": "How can experience make a connection easier to use later, without making repeatedly encountered information dominate forever? Strengthening and balancing are complementary problems when designing a system that changes through experience.",
    "sections": [
      {
        "title": "Hebbian strengthening",
        "text": "Hebbian learning concerns activity-dependent changes in the effectiveness of connections. Its central inspiration is that coordinated activity can help strengthen a relationship. Research on long-term potentiation provides evidence for lasting changes in synaptic transmission, though biological learning includes many mechanisms and cannot be captured by a single slogan."
      },
      {
        "title": "Why strengthening needs balance",
        "text": "Unrestricted positive feedback would make already strong activity increasingly dominant. Homeostatic plasticity concerns mechanisms that help stabilize neural activity; synaptic scaling is one example. This is a different problem from deciding whether a remembered statement is true."
      },
      {
        "title": "Forgetting has more than one meaning",
        "text": "Reduced accessibility, interference, changed associations and loss of stored information are different possibilities. A software system should likewise distinguish reducing a memory’s prominence from deleting its evidence. A useful old record may need to remain retrievable even when it is no longer routinely selected."
      },
      {
        "title": "Our interpretation to investigate",
        "text": "These ideas motivate experience-dependent association weights and balancing in Engram. Repeated joint recall can change a relationship’s prominence, but it is not proof of usefulness or accuracy. The engine article explains that local mechanism; Feedback addresses a separate question about what later outcomes support."
      }
    ],
    "related": [
      "associative-memory",
      "memory",
      "hippocampus",
      "action-feedback"
    ],
    "references": [
      {
        "title": "Bliss and Lømo — Long-lasting potentiation of synaptic transmission",
        "url": "https://physoc.onlinelibrary.wiley.com/doi/10.1113/jphysiol.1973.sp010273"
      },
      {
        "title": "Gina Turrigiano — The self-tuning neuron: synaptic scaling of excitatory synapses",
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC2834419/"
      }
    ]
  },
  "replay-consolidation": {
    "opening": "Could revisiting an experience after the immediate event help change what becomes useful later? Replay and consolidation research suggests that memory processing need not end when an interaction ends.",
    "sections": [
      {
        "title": "Evidence of reactivation",
        "text": "Wilson and McNaughton observed that hippocampal cells active together during spatial behaviour in rats were more likely to be active together during subsequent sleep. This showed re-expression of earlier activity. It does not mean that replay is a literal recording of an entire experience."
      },
      {
        "title": "A proposal about integration",
        "text": "Complementary learning systems theory connects rapid episode learning with slower integration across experiences. Reinstating earlier patterns is one proposed way to support that integration. The broader question concerns stability and change: how new information can become useful without simply overwriting what was learned before."
      },
      {
        "title": "What should be revisited?",
        "text": "For our engineering work, replay raises a selection problem as well as a scheduling problem. Repeatedly revisiting only familiar or already prominent records could reinforce a narrow history. Revisiting misleading interpretations could strengthen an error. Replay therefore needs evaluation beyond whether the scheduled process completes."
      },
      {
        "title": "A limited adaptation in Sapiens",
        "text": "Our Hippocampus engine schedules selected Engram recall and balancing. That is a narrow computational adaptation, not a simulation of sleep or the full interaction between hippocampus and cortex. Its deep dive distinguishes the currently connected replay path from other ideas that remain inactive."
      }
    ],
    "related": [
      "associative-memory",
      "hippocampus",
      "experience-evaluation"
    ],
    "references": [
      {
        "title": "Wilson and McNaughton — Reactivation of hippocampal ensemble memories during sleep",
        "url": "https://pubmed.ncbi.nlm.nih.gov/8036517/"
      },
      {
        "title": "McClelland, McNaughton and O’Reilly — Complementary learning systems",
        "url": "https://web.stanford.edu/~jlmcc/papers/McCMcNaughtonOReilly95.pdf"
      }
    ]
  },
  "prediction-reward-foundation": {
    "opening": "Why can an ordinary outcome be informative when it was unexpected, while a desirable but fully expected outcome teaches us less? Prediction and reward research separates what happened from what was expected to happen.",
    "sections": [
      {
        "title": "Expectations give outcomes a comparison",
        "text": "A prediction error expresses a difference between an expectation and an observation. Reward prediction error is narrower: it compares received and predicted reward. Research summarized by Schultz relates important patterns of dopamine activity to this difference, rather than treating dopamine as a simple signal of pleasure."
      },
      {
        "title": "Novelty is a different question",
        "text": "An unfamiliar event can be novel without being valuable. An unexpected event may be important even if its content is familiar. These distinctions matter for a computational design: similarity to previous events, prediction accuracy and usefulness should not silently become interchangeable scores."
      },
      {
        "title": "Value depends on what is being pursued",
        "text": "If a colleague replies promptly but does not provide the needed information, the interaction may succeed as message delivery while making little progress toward the intended outcome. Our design needs to specify which outcome a value estimate concerns and what evidence could change it."
      },
      {
        "title": "Where this leads",
        "text": "Sapiens contains limited experimental components for value, expectations, novelty and reward error, described in the predictive-engine article. They are not an account of human emotion or an integrated model of motivation. The Future research section asks how such distinctions could eventually contribute to decisions."
      }
    ],
    "related": [
      "predictive-engines",
      "prediction",
      "reward-emotion",
      "action-feedback"
    ],
    "references": [
      {
        "title": "Wolfram Schultz — Dopamine reward prediction error coding",
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC4826767/"
      }
    ]
  },
  "architecture-overview": {
    "opening": "How can several mechanisms contribute to one continuing individual without duplicating decisions or losing information between them? Sapiens separates responsibilities so that the interaction of mechanisms can be examined and revised.",
    "sections": [
      {
        "title": "Separate the questions each function answers",
        "text": "Choosing what to do, carrying it out and deciding what the result means are different jobs. Awareness owns consideration and assessment. Motor executes tools. Conversation owns transcripts and delivery. Goals interprets progress toward desired outcomes. These are cooperating functions within one Sapien, not a collection of independent characters."
      },
      {
        "title": "Keep information with its owner",
        "text": "Long-term memories, active context, goals and learned tool guidance have different lifecycles. Each owner retains its records and exposes a defined way to use them. References connect those records without requiring every engine to copy or rewrite another engine’s state."
      },
      {
        "title": "Coordinate immediate and background work",
        "text": "Some information is needed during a decision; other work, such as enriching memories, can run later. A shared communication layer, the Bus, carries requests and events; background jobs manage scheduling and retries. Delivering an event does not establish that the recipient has understood it or completed the work."
      },
      {
        "title": "Make the boundaries inspectable",
        "text": "This organization lets us trace a decision from incoming evidence through action and later interpretation. It also creates responsibilities that must be wired correctly: information stored by one function is useful elsewhere only when a consumer actually receives and uses it. The deep dives distinguish active connections from experimental components that remain disconnected."
      }
    ],
    "related": [
      "identity",
      "process",
      "connections",
      "language-models"
    ]
  },
  "identity": {
    "opening": "How can a system use different processing functions while preserving one perspective and recognizing other people’s words as their own? The shared-self design addresses this practical consequence of the questions raised in Self and agency.",
    "sections": [
      {
        "title": "The same individual across functions",
        "text": "A Sapien has a stable identity reference and a current name. Relevant prompts receive common guidance that interpreting, remembering and acting belong to that individual. An instruction addressed to a processing function does not give that function a separate personal identity."
      },
      {
        "title": "Quoted words keep their speaker",
        "text": "If a colleague writes “I will contact the customer,” the first person refers to the colleague. When the Sapien later reads that message, it should not remember the statement as its own commitment. Speaker, recipient and source context therefore accompany the content they explain."
      },
      {
        "title": "Identity and role are different",
        "text": "A workplace role describes responsibilities and authority in a setting. It does not replace the individual’s identity, and it does not transfer another person’s authority merely because their message is being processed. Current self-context and historical attribution serve different purposes and must remain distinguishable."
      },
      {
        "title": "What the shared guidance does",
        "text": "The identity package supplies reusable prompt guidance and current identity through composition. It is not a second personality engine or a new memory store. Clear presentation reduces an avoidable source of confusion, but model interpretation remains fallible; source-aware records and outcome inspection are still necessary."
      }
    ],
    "related": [
      "self-agency",
      "connections",
      "awareness",
      "memory"
    ]
  },
  "process": {
    "opening": "What should happen between encountering information and acting on it? A continuing system needs room to understand the situation, decide whether anything is needed, observe what an action actually did and retain what remains unresolved.",
    "sections": [
      {
        "title": "An event becomes a possible focus",
        "text": "A conversation message, a due review or another observation can supply information for Awareness. The input carries content with its source and supporting context. Preparation interprets what may need consideration; that interpretation remains distinct from the original event. Periodic consideration can also select a focus or find no useful next step."
      },
      {
        "title": "Consider, then act or wait",
        "text": "The controller receives the selected situation, relevant context and available capabilities. It can choose actions, communication or waiting. When it requests a tool, Motor performs the execution and returns the result. Further decisions can use that result within the same bounded cycle."
      },
      {
        "title": "Execution and assessment",
        "text": "A tool may succeed, fail before execution or leave an uncertain outcome. Awareness assesses what this evidence means for the concern it was addressing. Sending a question, receiving an answer and completing the wider task are separate developments; one does not automatically imply the others."
      },
      {
        "title": "What continues afterward",
        "text": "Conversation handles outward delivery and its record. Other engines consume relevant events through their existing connections: Goals may evaluate unfinished work, while memory and learning jobs can process experience later. An assessment is therefore a handoff of evidence, not a promise that every background interpretation or future action has already happened."
      }
    ],
    "related": [
      "awareness",
      "motor-conversation",
      "goals",
      "hold",
      "connections"
    ]
  },
  "connections": {
    "opening": "How can information pass between functions without losing who said it, what happened or what a later interpretation refers to? The architecture needs both a way to transport information and a way to preserve its meaning over time.",
    "sections": [
      {
        "title": "Facts beside their context",
        "text": "An incoming message has text, a speaker, an audience and a time when known. A tool result belongs to a particular attempted operation. We carry that context beside the original content, rather than replacing the content with a summary whose attribution is unclear. Derived interpretations can then remain identifiable as interpretations."
      },
      {
        "title": "Transport and durable references",
        "text": "The Engine Bus is the system’s communication layer. It carries defined requests and events between functions. Shared memory references identify records owned elsewhere, and registered readers resolve supported references when needed. A delivery identifier and a record reference answer different questions: one traces transport, while the other identifies information that can be revisited."
      },
      {
        "title": "A link offers context, not a decision",
        "text": "Suppose an outgoing question relates to an existing goal. A later response may carry enough history or references to help Awareness recognize that connection. The reference does not prove the response completes the goal. The relevant engine must still interpret the evidence, and missing or ambiguous relationships must remain uncertain."
      },
      {
        "title": "Bounded access",
        "text": "The system uses explicit, bounded retrieval rather than assuming every reference will expand into all connected history. Prompt construction presents identified originals with clear references to repeated copies where supported. This makes information available more efficiently, but neither storage nor transport guarantees that the right context will be selected."
      }
    ],
    "related": [
      "identity",
      "process",
      "working-memory-engine",
      "goals",
      "findings"
    ]
  },
  "language-models": {
    "opening": "What does a language model contribute to Sapiens, and what must the surrounding system provide? Understanding that division is essential when deciding whether a behaviour comes from the model, the supplied context or interactions across the architecture.",
    "sections": [
      {
        "title": "Language and interpretation",
        "text": "Models help interpret messages, prepare context, propose decisions and assess evidence. Different tasks can use different prompts and output contracts. The model’s existing capabilities matter greatly: an architecture cannot take credit for every useful response it receives from an already capable model."
      },
      {
        "title": "State beyond a single call",
        "text": "The surrounding system supplies selected history, current identity, capabilities and relevant records. It also persists experiences and schedules later work. These mechanisms determine what a particular call can consider; information absent from its input cannot be assumed to have influenced its decision."
      },
      {
        "title": "Proposals must meet the world",
        "text": "A model can propose a tool call, but the tool layer validates arguments and attempts execution. A well-formed response is not necessarily a correct interpretation, and successful execution is not necessarily progress. The architecture keeps these distinctions visible so later reasoning can use actual outcomes."
      },
      {
        "title": "What changes through experience",
        "text": "Sapiens can retain memories and practical guidance for later calls without changing model weights. This is one form of adaptation at the system level. Comparisons must therefore account for the model, the prompt, accessible experience and computation together; changing the model can alter behaviour even when the surrounding architecture stays the same."
      }
    ],
    "related": [
      "architecture-overview",
      "awareness",
      "tool-learning",
      "alternative-explanations"
    ]
  },
  "awareness": {
    "opening": "How can many incoming observations and remembered concerns become one coherent moment of consideration? Awareness is our attempt to organize a present focus: what the situation means, what is worth doing and what the available evidence supports.",
    "sections": [
      {
        "title": "The inspiration and the boundary",
        "text": "Workspace accounts motivate the idea of making selected information available across functions. Our implementation is a decision process built around that question, not a biological simulation or evidence of consciousness. It must preserve the individual’s perspective while allowing outside messages to retain their original speakers."
      },
      {
        "title": "Preparing a situation for consideration",
        "text": "Preparation interprets the input and identifies a possible focus. Context curation selects supporting information for that focus. The controller receives the original event alongside relevant context and the prepared interpretation, so a derived description does not silently replace the evidence it describes."
      },
      {
        "title": "Decisions can develop within a cycle",
        "text": "The controller can request actions, speak or wait. Tool execution belongs to Motor, whose returned outcomes become evidence for subsequent decisions. A cycle can include several iterations, bounded by runtime limits. Guidance from earlier tool experience may inform a choice, but it is not an instruction to repeat a learned action."
      },
      {
        "title": "Assessment is a handoff",
        "text": "Awareness assesses what happened, including uncertainty and remaining work. Internal understanding is retained separately from an outward message. Goals, Hold and other connected functions own their interpretations and records; Awareness does not directly decide their stored progress or lessons."
      },
      {
        "title": "What still needs examination",
        "text": "A sensible intention can fail if relevant context was omitted, if tools were used inefficiently or if unfinished work was not reconsidered. We study the full sequence of available information and decisions, including periodic runs where taking no action may be appropriate. A completed cycle alone is not evidence that the wider concern was resolved."
      }
    ],
    "related": [
      "perception-attention",
      "process",
      "working-memory-engine",
      "motor-conversation",
      "findings"
    ]
  },
  "memory": {
    "opening": "How can past experience remain useful when a later situation supplies only a partial cue? Engram explores long-term memory as contextual, connected information that can be recalled through more than one route.",
    "sections": [
      {
        "title": "Retain meaning with its origin",
        "text": "Ingestion extracts memory units while retaining source context and attribution. Enrichment can add keywords, clusters and navigation cues. These derived aids help locate information, but they remain distinct from the original experience and can be wrong. Background processing also means a newly recorded event and a fully enriched memory are not the same state."
      },
      {
        "title": "Several routes to recall",
        "text": "Engram combines meaning-based retrieval, keyword evidence and links among records. A recalled memory is returned with context and available relationships, rather than as an isolated sentence. A high retrieval score indicates how the system ranked the result; it does not certify truth or relevance to every later use."
      },
      {
        "title": "A computational Hebbian mechanism",
        "text": "When memories are recalled together, a local rule strengthens selected co-recall relationships. Repeated association can also contribute a small, bounded change to their stored prominence. Periodic downscaling balances these usage-earned links. This is an adaptation of strengthening and balancing ideas, implemented in memory state rather than by retraining the language model."
      },
      {
        "title": "What the mechanism does not establish",
        "text": "Repeated recall can make a relationship easier to encounter without proving it useful or correct. Misattributed memories and misleading links can therefore compound errors. Keeping provenance and uncertainty visible is as important as improving retrieval."
      },
      {
        "title": "Engram’s place in the system",
        "text": "Engram owns long-term ingestion and recall; Working Memory owns active references, and ToolLearning owns practical tool guidance. Those stores are not interchangeable. Replay currently calls Engram through Hippocampus, while automatic Engram-to-Working-Memory integration is disconnected. Stored knowledge still needs an appropriate retrieval and presentation path to influence a decision."
      }
    ],
    "related": [
      "associative-memory",
      "reinforcement-forgetting",
      "replay-consolidation",
      "hippocampus",
      "working-memory-engine"
    ]
  },
  "working-memory-engine": {
    "opening": "How can information remain available for current thinking without copying the entire memory archive into every decision? Working Memory implements a bounded set of active references whose prominence can change as the Sapien continues.",
    "sections": [
      {
        "title": "Pointers rather than another archive",
        "text": "Each active entry points to information owned elsewhere. Working Memory retains activation, identifying context and a representation used for relevance matching. A resolver retrieves supported source content when it is needed. Removing an active pointer does not, by itself, delete the original record."
      },
      {
        "title": "Keeping and releasing active context",
        "text": "Retaining an entry increases its activation with diminishing returns. Activation decays with time, and capacity pressure can remove weaker entries. Selection also considers the current query. These rules are engineering choices inspired by active-context problems; the configured capacity is not a claim about human memory capacity."
      },
      {
        "title": "What is connected today",
        "text": "Awareness uses typed requests to discover and select supporting context and retain assessed thoughts. Working Memory has no independent thinking loop. Automatic integrations with Engram, Goals, Plans and the experimental predictive components are currently disconnected; old records do not establish that those connections remain active."
      },
      {
        "title": "What must be evaluated",
        "text": "A useful active set should preserve a relevant earlier constraint while allowing a new concern to enter. Too much persistence can keep stale context prominent; too little can interrupt continuity. We need to inspect both selection and use, because a record being stored or selected does not establish that it improved the decision."
      }
    ],
    "related": [
      "working-memory-foundation",
      "awareness",
      "connections",
      "experience-evaluation"
    ]
  },
  "hippocampus": {
    "opening": "Could selected experiences become more accessible through revisiting them outside the immediate interaction? The Hippocampus engine explores a limited replay mechanism, inspired by research on memory reactivation and consolidation.",
    "sections": [
      {
        "title": "Separate replay from ordinary recall",
        "text": "Ordinary recall starts with a present need. Replay starts with a scheduled opportunity to revisit retained material. That difference creates a distinct responsibility: deciding when and how much to revisit, while leaving memory storage and relationship changes with Engram."
      },
      {
        "title": "The active path",
        "text": "The current replay job asks Engram for memories worth revisiting, recalls their content and then requests downscaling of co-recall links. Engram performs the local strengthening and balancing. Hippocampus coordinates the replay rather than maintaining a second implementation of those rules."
      },
      {
        "title": "What the name does not imply",
        "text": "This process is a narrow engineering adaptation. It does not reproduce sleep, a full biological hippocampus or the slower cortical learning proposed in complementary learning systems theory. An older bundling mechanism remains in the code but has no active producers or consumers."
      },
      {
        "title": "The experiment ahead",
        "text": "Replay could make useful associations easier to retrieve, but it could also keep already prominent material circulating. A meaningful comparison would examine what changes in subsequent recall and decisions with replay enabled or disabled, holding other conditions comparable. Successful execution of a replay job alone does not establish improved memory."
      }
    ],
    "related": [
      "replay-consolidation",
      "reinforcement-forgetting",
      "memory",
      "experience-evaluation"
    ]
  },
  "goals": {
    "opening": "How can an intention survive interruptions, partial progress and new evidence? Goals preserves desired outcomes so that work can be reconsidered beyond the conversation or decision cycle in which it first became relevant.",
    "sections": [
      {
        "title": "A desired outcome needs interpretation",
        "text": "A colleague’s description of a requirement is not automatically a request to implement it. The current discovery path evaluates assessed Awareness outcomes alongside their source and execution evidence. It can create no goal when the evidence does not establish adopted work. Direct discovery from raw conversation messages is disabled."
      },
      {
        "title": "Progress belongs to the whole goal",
        "text": "Awareness publishes outcomes through the Bus. Goals interprets relevant evidence against its own record and decides whether progress, state, completion or review timing should change. Completing one Awareness cycle or sending one message does not automatically complete a wider goal."
      },
      {
        "title": "Continuing a partially completed intention",
        "text": "Suppose the intended outcome is to contact four colleagues and two have been contacted. A later review needs the original purpose, current state and available evidence about what remains. Source references and retained review context make that information accessible; they do not themselves decide which later replies satisfy the intention."
      },
      {
        "title": "Reviews and plans",
        "text": "A due review can bring work back for Awareness to consider. Scheduling is part of the goal’s lifecycle, not a guarantee of immediate execution. A Plan can represent ordered tasks toward a goal, but a goal does not require a plan, and a plan’s state does not implicitly complete its goal."
      },
      {
        "title": "The open challenge",
        "text": "Matching new evidence to existing work and distinguishing unchanged waiting from useful progress remain fallible interpretations. We inspect the reason and evidence behind updates, rather than treating a stored goal as proof that follow-through will occur."
      }
    ],
    "related": [
      "continuity",
      "connections",
      "hold",
      "awareness",
      "findings"
    ]
  },
  "hold": {
    "opening": "How can a system wait for the right conditions without forgetting the matter or repeatedly attempting the same blocked action? Hold represents deferred work and the evidence needed before it deserves another look.",
    "sections": [
      {
        "title": "Describe what is missing",
        "text": "A useful deferred record includes the desired outcome, its blocker and a condition that could release it. “Waiting” alone is not enough. For example, work requiring access should retain which access is missing and what would count as evidence that it is available."
      },
      {
        "title": "Reconsider when evidence changes",
        "text": "Stored experience can trigger a background readiness assessment. Hold retains its judgment, reason and supporting references. In active mode, changed readiness can surface the matter to Awareness. This separates monitoring a condition from continuously repeating an external action."
      },
      {
        "title": "Ready does not mean done",
        "text": "A readiness judgment permits reconsideration. Awareness still decides whether to proceed in the current context, and Motor executes any selected operation. New access may remove one blocker while another constraint remains. Hold does not grant authority or infer that work has already happened."
      },
      {
        "title": "Durability and limits",
        "text": "The active integration stores deferred matters durably, so waiting need not depend on one process staying alive. The quality of the release condition and later evidence still matters: a vague blocker can produce repeated reconsideration or prolonged waiting. We investigate whether the mechanism reduces unnecessary attempts while allowing appropriate resumption."
      }
    ],
    "related": [
      "goals",
      "awareness",
      "action-feedback",
      "motivation-action"
    ]
  },
  "reasoning-questioning": {
    "opening": "How can a system notice what it does not yet understand without immediately turning every uncertainty into an interruption? Forming a useful question and deciding to pursue its answer are separate responsibilities.",
    "sections": [
      {
        "title": "A question can expose an assumption",
        "text": "A report may describe a delay without explaining whether the cause is missing access or unfinished work. Asking what evidence distinguishes those possibilities can improve the inquiry. A useful question should connect to the supplied situation rather than manufacture a need for information already present."
      },
      {
        "title": "The current Questioning capability",
        "text": "Questioning receives content and context, then generates a bounded set of questions or no questions. Its inputs can identify the content’s origin and the intended audience. The generation method does not independently gather history, answer the questions or choose an external action."
      },
      {
        "title": "Background generation and storage",
        "text": "After an Awareness cycle, its adapter can submit material asynchronously. The existing job system batches background requests and persists generated questions with their sources. Awareness does not wait for this generation, and the current path does not send the questions back into the completed cycle or automatically create a new one."
      },
      {
        "title": "A useful output still needs a consumer",
        "text": "The retained questions support inspection today. They do not automatically contact colleagues, create goals or feed Curiosity. Designing a later consumer requires deciding when an unanswered question matters and when it should remain unexplored. Reasoning within Awareness already serves its immediate decisions; this separate capability is not the owner of every act of reasoning."
      }
    ],
    "related": [
      "curiosity",
      "awareness",
      "weave",
      "initiative"
    ]
  },
  "curiosity": {
    "opening": "What makes something worth exploring when no immediate task requires it? Curiosity concerns the value of looking further, which can involve an unfamiliar pattern, a possible connection or an opportunity as well as an explicit question.",
    "sections": [
      {
        "title": "Uncertainty alone is not enough",
        "text": "Many things are unknown at any moment. Pursuing all of them would consume resources and interrupt other people. Our research question is how exploration can be sensitive to the individual’s context and previous experience without reducing every interest to an urgent work requirement."
      },
      {
        "title": "The available selector",
        "text": "The current Curiosity capability accepts candidate items and supporting context. It uses a language model to select one candidate or none, returning the selected content and a reason. The caller supplies the candidates; Curiosity does not independently discover them or gather missing background."
      },
      {
        "title": "What is deliberately disconnected",
        "text": "Automatic candidate sources, periodic selection and the route from Curiosity into Awareness are currently disconnected pending replanning. Questioning does not automatically invoke it. The callable capability and stored records remain, but their existence should not be read as an active, self-directed exploration loop."
      },
      {
        "title": "What integration must explain",
        "text": "A future connection needs to preserve why a candidate matters, whether it has already been explored and what changed afterward. Selection would be advice for consideration, not permission to act. We want to study whether it leads to meaningful exploration while still allowing rest, ordinary conversation and unfinished work to coexist."
      }
    ],
    "related": [
      "reasoning-questioning",
      "motivation-action",
      "initiative",
      "prediction"
    ]
  },
  "action-feedback": {
    "opening": "How can later events tell an individual whether an earlier action helped, missed the point or had an unintended consequence? Feedback addresses the interpretation of outcomes, beyond knowing that a tool returned successfully.",
    "sections": [
      {
        "title": "An event becomes evidence about behaviour",
        "text": "A colleague’s reply may reveal that an earlier answer misunderstood the request. Feedback considers new experience alongside earlier activity and supporting context. It asks whether a meaningful relationship exists; nearby timestamps or similar words alone do not establish that one event evaluates the other."
      },
      {
        "title": "Retain a finding as an interpretation",
        "text": "A finding connects evidence to earlier behaviour with an explanation and confidence. The cited records remain distinct from that explanation. This lets later inspection ask whether the finding used the right evidence and allows an interpretation to be revised rather than silently becoming an external fact."
      },
      {
        "title": "Delivery does not transfer ownership",
        "text": "Findings travel through the shared Bus and feedback contracts. Each receiving engine owns any resulting changes to its state. In observe mode, findings support inspection; active mode can additionally surface significant findings to Awareness. Feedback does not directly decide another engine’s progress or execute corrective actions."
      },
      {
        "title": "Use is not usefulness",
        "text": "A separate shared usage signal can record that some context or guidance was used. That is valuable attribution, but it does not prove the advice helped. Connecting use to later outcomes is the harder question. ToolLearning independently examines tool experience, while Feedback addresses broader behavioural evidence."
      }
    ],
    "related": [
      "firsthand-experience",
      "motor-conversation",
      "tool-learning",
      "experience-evaluation"
    ]
  },
  "tool-learning": {
    "opening": "How can a system avoid relearning the same practical difficulty every time it uses a tool? ToolLearning retains conditional guidance from experience while keeping execution and permission decisions outside the learning mechanism.",
    "sections": [
      {
        "title": "From an attempt to a possible lesson",
        "text": "A failed directory request followed by a corrected request may reveal a useful constraint. The learning process needs the relationship between those attempts, their arguments and their results. Temporal proximity alone is not enough to conclude that one corrected the other."
      },
      {
        "title": "Documented facts and learned guidance",
        "text": "Tool definitions describe the provider’s operation and schema. Lessons are interpretations of observed use, with conditions, uncertainty and supporting evidence. ToolLearning stores scoped profiles and revision history so a later decision can refer to the guidance that was actually available at the time."
      },
      {
        "title": "How guidance reaches a decision",
        "text": "Motor publishes execution facts, and background jobs interpret relevant experience. Before controller decisions, Awareness can retrieve bounded guidance for relevant tools through an injected interface. That retrieval does not require another model call. The controller judges whether a lesson fits the current situation."
      },
      {
        "title": "Advice remains revisable",
        "text": "A lesson does not grant permission, change tool arguments automatically or guarantee success. Later evidence may support or challenge it. Reported usage records attribution, while the original observations remain available separately. The research question is whether such guidance improves later choices without creating rigid habits from a small or misleading sample."
      }
    ],
    "related": [
      "firsthand-experience",
      "motor-conversation",
      "action-feedback",
      "experience-evaluation"
    ]
  },
  "motor-conversation": {
    "opening": "When a system decides to communicate, who actually sends the message—and how does it know whether it was sent? Separating decisions, execution and conversation records prevents an internal thought from silently becoming another outward action.",
    "sections": [
      {
        "title": "Awareness chooses; Motor executes",
        "text": "Motor discovers available tools, validates supplied arguments and dispatches operations through the configured connection. It does not use a language model to decide the task. Real services and simulation adapters share this execution boundary, while their implementations determine what the operation does."
      },
      {
        "title": "Conversation keeps the exchange coherent",
        "text": "Conversation records incoming messages and presents them to Awareness with their context. Awareness generates any intended reply. Conversation owns its correlation and delivery path, using Motor for external delivery, and records confirmed outbound tool messages through their receipts."
      },
      {
        "title": "A thought is not an extra reply",
        "text": "Awareness can retain an internal assessment without sending it to the person whose message started the cycle. If no outward speech is produced, Conversation does not invent a fallback. This boundary matters when tools have already sent messages: an internal report about those actions should not be delivered as another conversational turn."
      },
      {
        "title": "Make execution evidence explicit",
        "text": "A validation failure before dispatch means the operation was not executed. A connection error after dispatch can leave uncertainty about what happened externally. Subsequent reasoning must see that distinction so it can correct an invalid call or investigate an uncertain one without blindly repeating successful actions."
      }
    ],
    "related": [
      "process",
      "awareness",
      "tool-learning",
      "action-feedback"
    ]
  },
  "predictive-engines": {
    "opening": "Could explicit expectations help a system interpret outcomes more carefully than simply reacting to each new event? The code contains limited experimental components for value, novelty and reward error, providing pieces to examine before designing a broader predictive loop.",
    "sections": [
      {
        "title": "Value and expectation are supplied",
        "text": "The component named Cortex estimates value from stored examples and compares a supplied state with supplied goal representations. The component named Cerebellum stores caller-provided expectations and compares observations with recent examples for novelty. These names identify narrow computational experiments, not implementations of whole brain regions."
      },
      {
        "title": "Comparing an outcome with an estimate",
        "text": "The Dopamine component combines the available value and novelty signals, compares a reward estimate with a predicted value and records the resulting error. Its formula is an engineering choice. Similarity to a goal representation is not direct evidence that the goal progressed."
      },
      {
        "title": "Current integration status",
        "text": "These components are not wired into the main orchestrator as a running predictive cycle. A direct caller must supply the relevant state, goals and prediction. Their presence in the repository does not mean that every Awareness decision is being evaluated by them."
      },
      {
        "title": "The missing research step",
        "text": "Before integrating them, we need a clear account of what each expectation predicts, which observation tests it and why an error should influence another decision. The Future research articles examine those questions. A numeric reward signal alone would not establish understanding, motivation or human-like feeling."
      }
    ],
    "related": [
      "prediction-reward-foundation",
      "prediction",
      "reward-emotion",
      "missing-mechanisms"
    ]
  },
  "weave": {
    "opening": "How could separate experiences become a more general understanding that can also be questioned and revised? Weave names a proposed family of operations around abstraction, synthesis, evaluation and belief revision.",
    "sections": [
      {
        "title": "Different operations on understanding",
        "text": "Abstraction asks what a set of examples has in common. Synthesis considers how pieces fit together. Evaluation examines support and limitations. Belief revision asks what should change when evidence conflicts. Keeping these responsibilities distinct can make it easier to inspect how a broad conclusion was reached."
      },
      {
        "title": "A generalization needs its exceptions",
        "text": "Suppose several delayed replies followed missing access. It may be useful to investigate access when a similar delay occurs. Concluding that every delay has the same cause would go further than the evidence supports. A useful account must preserve the examples, conditions and counterexamples that limit a generalization."
      },
      {
        "title": "What exists today",
        "text": "The repository contains components for these operations, but there is no active Weave coordinator or scheduled workflow joining them. Several component execution paths remain incomplete. Questioning is an independent capability; an optional Weave delegate does not make that capability part of an active Weave process."
      },
      {
        "title": "What should precede integration",
        "text": "A future design needs to state when a generalization is proposed, how it remains linked to evidence and who decides whether to rely on it. We should evaluate the contribution of those operations before presenting their combination as a mature reasoning system. The abstraction article develops that open direction."
      }
    ],
    "related": [
      "abstraction",
      "reasoning-questioning",
      "continuity",
      "missing-mechanisms"
    ]
  },
  "simulation": {
    "opening": "How can we study a continuing individual when its choices affect what happens next? A simulated workplace gives Sapiens an environment with people, responsibilities, tools and changing conditions, where we can inspect a sequence rather than a single answer.",
    "sections": [
      {
        "title": "A world that responds",
        "text": "Case definitions provide employee knowledge, scheduled events, project state and expected outcomes. Reusable simulation services deliver messages and tool results. The Sapien uses its normal cognitive engines with simulated connections, allowing us to examine how it interprets requests, seeks information and follows through."
      },
      {
        "title": "Dialogue and effects serve different roles",
        "text": "The current employee interpreter can compose dialogue from supplied knowledge or select an authored response with defined effects. Ordinary explanation should not require exact wording, while approvals and state changes must remain tied to the case’s rules. The interpreter sees available context rather than future rules or scoring criteria."
      },
      {
        "title": "The environment can be wrong",
        "text": "A simulated employee can misunderstand a reasonable question, repeat an irrelevant introduction or lack necessary information. Generated dialogue can also be unsupported despite instructions to stay grounded. These are limitations of the environment, so an apparent Sapien failure needs a trace of who made the first mistake and what followed."
      },
      {
        "title": "What a run can reveal",
        "text": "Messages, tool attempts, internal assessments and later state changes provide different evidence. Accelerated simulated time also differs from real processing time. A run is useful for finding information-flow and behavioural problems, but success in one authored workplace does not establish general competence or scientific evidence of emergence."
      }
    ],
    "related": [
      "findings",
      "evaluation",
      "alternative-explanations",
      "research-limitations"
    ]
  },
  "findings": {
    "opening": "What have our simulation investigations taught us about where coherent behaviour breaks down? The most useful findings have come from tracing the information and decisions behind a visible error, rather than judging the final message alone.",
    "sections": [
      {
        "title": "Attribution can be lost before the answer",
        "text": "Earlier investigations found that a prepared interpretation could obscure who was speaking even when the original message appeared elsewhere in the context. This motivated keeping source, speaker and recipient beside the event and distinguishing preparation from the original content. Presence somewhere in a large prompt is not the same as clear presentation at the decision point."
      },
      {
        "title": "An intention can outlive its handoff",
        "text": "Outreach investigations found unfinished work retained in an assessment without reliable later follow-through. Separate raw-message goal discovery also created mismatches between work already handled and goals created afterward. The current direction uses assessed outcomes and source references, with Goals responsible for interpreting progress."
      },
      {
        "title": "The simulation can create the confusion",
        "text": "Some reasonable follow-up questions received repeated introductions or no supported answer. The response model and authored coverage therefore had to be examined alongside Sapien’s behaviour. Natural dialogue handling now uses case-owned knowledge, while consequential effects remain separate."
      },
      {
        "title": "Execution needs its own evidence",
        "text": "We also inspected malformed tool arguments despite correct field information being available, and memory-processing failures that were unrelated to reasoning quality. Argument validation, explicit execution outcomes and retryable background work address different failure classes. They should not all be described as prompt problems."
      },
      {
        "title": "What these observations establish",
        "text": "These findings informed engineering changes. They are not controlled measurements of improvement, and a code change does not prove that the corresponding behaviour is resolved. A fuller report should pair the deployed revision and run conditions with before-and-after evidence; the evaluation articles describe the comparisons we want to make."
      }
    ],
    "related": [
      "identity",
      "connections",
      "goals",
      "motor-conversation",
      "simulation",
      "evaluation"
    ]
  },
  "experience-evaluation": {
    "opening": "How would we know that an individual’s experience improves its later behaviour? Remembering an event, mentioning it and benefiting from it are different outcomes, so an evaluation must look beyond the existence of stored memories.",
    "sections": [
      {
        "title": "Compare access to relevant experience",
        "text": "One proposed comparison is to present a later situation to otherwise comparable systems with and without access to an earlier experience. The model, task information and available tools should be kept comparable. This would help isolate whether the retained experience contributes to the later decision."
      },
      {
        "title": "Vary the situation, not just the wording",
        "text": "Repeating the same task can reward memorization. A stronger comparison changes a meaningful condition: responsibility moves to another person, permission expires or a previous solution becomes inappropriate. Useful experience should help recognize both similarities and reasons not to repeat the earlier action."
      },
      {
        "title": "Include misleading history",
        "text": "A system that only improves after helpful examples has not yet shown how it handles bad lessons. We also want to examine whether a later correction changes what is retrieved and trusted, and whether the original evidence remains distinguishable from a mistaken interpretation."
      },
      {
        "title": "Measure contribution and cost",
        "text": "Relevant outcomes include appropriate completion, fewer repeated errors, calibrated uncertainty and unnecessary actions avoided. Processing cost and delay also matter. These are proposed evaluation directions, not results already demonstrated by the current simulations; the comparison must show what experience changed and how reliably."
      }
    ],
    "related": [
      "firsthand-experience",
      "continuity",
      "memory",
      "tool-learning",
      "evaluation"
    ]
  },
  "evaluation": {
    "opening": "What evidence would support the idea that interacting mechanisms contribute to adaptable intelligence? A successful demonstration is a starting observation; the research challenge is to explain why it succeeded and whether the contribution persists.",
    "sections": [
      {
        "title": "Define the behaviour before the comparison",
        "text": "An experiment should specify what counts as progress: remembering a constraint, resuming unfinished work, revising a mistaken interpretation or transferring a lesson to a changed situation. Tool-call volume and fluent explanations are incomplete measures because more activity can accompany less appropriate behaviour."
      },
      {
        "title": "Compare mechanisms and their interaction",
        "text": "A proposed study could compare the same model with basic task context, with relevant stored experience, and with additional mechanisms connected. Removing a component or connection while keeping other conditions comparable can help identify its contribution. To study interaction, we must also compare combinations rather than testing each component only in isolation."
      },
      {
        "title": "Account for resources and variation",
        "text": "More calls, longer prompts or extra time can improve outcomes without supporting our architectural hypothesis. Comparisons should report those differences, repeat runs and vary situations. Conditions need to be defined before selecting the examples that look convincing."
      },
      {
        "title": "Keep causal claims proportional",
        "text": "A trace can explain a particular failure. A repeated comparison can provide stronger evidence of a reliable contribution. Neither automatically establishes general intelligence, emergence or consciousness. These are evaluation plans guiding the work; the current public observations are primarily engineering investigations."
      }
    ],
    "related": [
      "emergence",
      "experience-evaluation",
      "alternative-explanations",
      "research-limitations"
    ]
  },
  "alternative-explanations": {
    "opening": "What else could explain a behaviour that looks like learning or emergence? Considering alternatives helps us decide whether an observation supports our hypothesis or simply shows something the underlying model or environment already supplied.",
    "sections": [
      {
        "title": "The model may already know how",
        "text": "A strong model may solve the situation from the current prompt without using retained experience. A model upgrade can improve behaviour even if the surrounding mechanisms are unchanged. Comparisons therefore need to keep model choice visible and examine what information actually reached it."
      },
      {
        "title": "The prompt or scenario may supply the answer",
        "text": "An instruction can effectively prescribe the desired behaviour, while a simulated colleague can provide unusually convenient guidance. A well-designed environment should support reasonable interaction without quietly doing the participant’s reasoning or exposing future outcomes."
      },
      {
        "title": "More computation can look like better organization",
        "text": "Extra retries, a longer context or more tool calls may explain an improvement. That can still be useful engineering, but it is a different claim from a particular memory or coordination mechanism producing the benefit. Cost and opportunity to act belong in the comparison."
      },
      {
        "title": "Selection and chance",
        "text": "A memorable successful run can conceal less successful attempts. We need varied cases and repeated observations, including failures, before drawing broader conclusions. Alternative explanations are not reasons to stop experimenting; they identify what the next comparison needs to distinguish."
      }
    ],
    "related": [
      "language-models",
      "simulation",
      "evaluation",
      "research-limitations"
    ]
  },
  "research-limitations": {
    "opening": "How far can our current observations take us? A useful research account should make clear where inspection ends, where interpretation begins and what remains untested.",
    "sections": [
      {
        "title": "Engineering evidence has a scope",
        "text": "Logs and stored records can reveal which context was supplied, which action was attempted and what changed afterward. They can support a diagnosis of a particular run. They do not by themselves demonstrate that a mechanism reliably improves behaviour across tasks."
      },
      {
        "title": "The implementation is still evolving",
        "text": "Prompts, memory processing, model choices and engine connections have changed across simulations. Some named components remain disconnected or incomplete. Historical runs therefore cannot be treated as repeated trials of one fixed system, and source-code presence is not proof of deployment or runtime use."
      },
      {
        "title": "A simulated workplace is a limited environment",
        "text": "Authored knowledge, available tools, compressed time and model-generated employee dialogue shape what can happen. Real organizations contain additional uncertainty, implicit knowledge and consequences. Simulation can expose useful problems without establishing that performance transfers unchanged."
      },
      {
        "title": "The claims we leave open",
        "text": "We have not established that Sapiens reproduces biological cognition, has subjective experience or has demonstrated emergent general intelligence. Our present contribution is an evolving computational investigation with inspectable mechanisms and failures. More detailed, reproducible comparisons are needed to support stronger claims about their value."
      }
    ],
    "related": [
      "findings",
      "simulation",
      "evaluation",
      "consciousness",
      "missing-mechanisms"
    ]
  },
  "prediction": {
    "opening": "Could an individual understand an unfolding situation better by forming expectations before the next event arrives? Prediction could make later observations informative about an earlier understanding, rather than treating each observation as a fresh starting point.",
    "sections": [
      {
        "title": "Predict something that can be checked",
        "text": "An expectation needs a subject, a condition and an observable outcome. “Something may go wrong” is difficult to learn from. “Access should become available after the owner approves the request” identifies a relationship that later evidence can support, contradict or leave unresolved."
      },
      {
        "title": "Separate uncertainty from surprise",
        "text": "A low-confidence expectation failing is different from a highly reliable pattern breaking down. Missing evidence is also different from evidence of failure. A future predictive mechanism should preserve these distinctions rather than convert every mismatch into the same urgency signal."
      },
      {
        "title": "Connect expectations to existing experience",
        "text": "Relevant memories and current circumstances could inform expectations, while later observations could provide comparisons. The existing predictive components contain limited value and novelty calculations, but they are not an integrated situation-understanding loop. Choosing what to predict and how to update it remains design work."
      },
      {
        "title": "What would make this useful?",
        "text": "We would look for earlier recognition of changing conditions, more appropriate preparation and better revision after surprises. A comparison should also count false alarms and unnecessary actions. Producing many predictions is not the objective; the question is whether the expectations help the individual understand and respond."
      }
    ],
    "related": [
      "prediction-reward-foundation",
      "predictive-engines",
      "imagination",
      "evaluation"
    ]
  },
  "imagination": {
    "opening": "Could considering possible situations help an individual choose without immediately acting in the world? Imagination, in this research direction, means constructing and comparing possibilities while preserving the distinction between a possibility and an observation.",
    "sections": [
      {
        "title": "Explore consequences before commitment",
        "text": "Before asking a colleague for help, a system might consider whether the request is clear, what information is missing and what a reply could change. Such consideration could reduce avoidable actions, provided it does not become an elaborate substitute for checking the real situation."
      },
      {
        "title": "Keep imagined events out of factual history",
        "text": "A possible reply must not become a remembered reply. A proposed action must not appear as an executed one. Any future representation needs to retain assumptions, alternative branches and their hypothetical status when those ideas are stored or passed to another function."
      },
      {
        "title": "Use the world to correct the model",
        "text": "An imagined outcome can be wrong because relevant information is missing or the internal model is poor. Actual observations should be able to overturn it. We would need explicit links between the considered possibility, the action eventually chosen and what happened afterward."
      },
      {
        "title": "A research direction, not a live subsystem",
        "text": "The language model can already discuss hypothetical situations, but that is not the same as an integrated imagination mechanism with a lifecycle and evidence boundaries. A useful study would compare decision quality, cost and false assumptions with and without such a mechanism."
      }
    ],
    "related": [
      "prediction",
      "weave",
      "connections",
      "alternative-explanations"
    ]
  },
  "abstraction": {
    "opening": "How can several particular experiences support a general idea without erasing the differences that matter? Abstraction could help experience transfer, but it can also create an overconfident rule from a small sample.",
    "sections": [
      {
        "title": "Identify what stays relevant",
        "text": "If several problems were resolved by clarifying who owns a decision, the useful general idea might concern unclear responsibility. It should not become a rule to contact the same person in every project. The challenge is separating the transferable relationship from the accidental details of its examples."
      },
      {
        "title": "Keep the examples and limits",
        "text": "A proposed abstraction should remain connected to supporting episodes, the conditions in which it applies and known exceptions. A counterexample may require narrowing the rule rather than deleting all earlier experience. This is why abstraction and belief revision need to be considered together."
      },
      {
        "title": "What existing pieces provide",
        "text": "Engram can retain contextual memories and associations. ToolLearning already stores a narrower form of conditional practical guidance. Weave contains unfinished operations concerned with broader synthesis and revision, but there is no active general abstraction process joining them."
      },
      {
        "title": "Evaluate transfer rather than elegant summaries",
        "text": "A useful experiment would introduce a changed situation where some earlier structure applies and some does not. We would examine whether the abstraction helps select the right relationship, recognize an exception and explain its uncertainty. A concise general statement is not sufficient evidence that this transfer occurred."
      }
    ],
    "related": [
      "associative-memory",
      "weave",
      "tool-learning",
      "experience-evaluation"
    ]
  },
  "motivation-action": {
    "opening": "When several things could be done, what should make one worth doing now? A continuing individual needs ways to weigh commitments, uncertainty, exploration and the consequences of interrupting others.",
    "sections": [
      {
        "title": "Different reasons to act",
        "text": "An explicit request, a due commitment, an interesting observation and a chance for ordinary conversation can all provide reasons for consideration. They need not have the same priority or justification. Treating every reason as an urgent task could make the system busy without making it thoughtful."
      },
      {
        "title": "Waiting can be a deliberate choice",
        "text": "Sometimes the right information has not arrived, another person needs time, or further action would simply repeat what already happened. A useful account of motivation must explain these choices alongside initiative. It should preserve unresolved commitments without forcing constant activity."
      },
      {
        "title": "Represent competing considerations",
        "text": "A possible future direction is to make the reasons, uncertainty and expected costs behind candidate activities clearer to the decision process. Goals, Hold and Awareness provide some existing ingredients. They do not yet constitute a complete model of motivation, and the disconnected Curiosity selector does not supply that missing integration."
      },
      {
        "title": "What to observe",
        "text": "We would examine whether the system balances progress with appropriate restraint across changing conditions. Useful evidence includes timely follow-through, reduced repetition and exploration that leads to understanding. The frequency of actions alone cannot tell us whether the individual had good reasons to act."
      }
    ],
    "related": [
      "self-agency",
      "goals",
      "hold",
      "curiosity",
      "initiative"
    ]
  },
  "reward-emotion": {
    "opening": "How could a system represent that an event matters to it, and how should that significance influence later behaviour? This direction explores value and prioritization while keeping them distinct from claims about felt emotion.",
    "sections": [
      {
        "title": "Significance has several dimensions",
        "text": "An event can advance a commitment, reveal risk, contradict an expectation or affect a relationship. Compressing all of those into one positive or negative score could hide why it matters. A future design needs to specify what is being evaluated and which later decisions should use it."
      },
      {
        "title": "Reward is a design choice",
        "text": "A numerical reward only has meaning relative to what its designer chose to measure. Rewarding message volume could encourage needless conversation; rewarding rapid completion could encourage premature claims. We need to inspect whether a signal promotes the intended behaviour and what it neglects."
      },
      {
        "title": "Existing ingredients remain limited",
        "text": "The experimental Dopamine component computes a reward-error signal from supplied information. It is not connected as an autonomous runtime loop and does not implement human emotional experience. Feedback findings retain richer explanations of behavioural evidence, but those are not feelings either."
      },
      {
        "title": "An open question about regulation",
        "text": "We want to investigate whether richer, contextual representations of significance could help regulate attention and action over time. That requires observable benefits and ways to detect undesirable persistence or distortion. Human emotion is an important inspiration to study carefully, rather than a label to apply to any stored score."
      }
    ],
    "related": [
      "prediction-reward-foundation",
      "predictive-engines",
      "motivation-action",
      "action-feedback"
    ]
  },
  "senses-roles": {
    "opening": "Could the same individual carry useful experience across different ways of perceiving and different settings of work? Expanding inputs or roles raises questions about continuity, context and what should remain specific to one environment.",
    "sections": [
      {
        "title": "New inputs need more than a connector",
        "text": "A message, a document, a sound and an image supply different kinds of evidence. A useful integration needs to preserve what was observed, where it came from, when it occurred and what remains uncertain. Turning every input into anonymous text could erase distinctions that later reasoning needs."
      },
      {
        "title": "A role changes responsibilities",
        "text": "The same individual may encounter different projects or responsibilities without becoming a different self. Information about authority, available tools and local practice must remain attached to the relevant setting. Experience from one workplace should not silently grant permissions in another."
      },
      {
        "title": "Transfer requires boundaries",
        "text": "An earlier lesson may help recognize a pattern while its specific names, access rules or agreements no longer apply. We want to study whether the system can carry a useful relationship across settings while preserving privacy and recognizing when fresh context is needed."
      },
      {
        "title": "What is proposed",
        "text": "Current conversation and tool boundaries provide an integration pattern, not evidence of a complete multisensory individual. Additional senses and role transitions need explicit design and evaluation. The research question is whether richer participation improves understanding without losing attribution or making unrelated experiences indistinguishable."
      }
    ],
    "related": [
      "identity",
      "connections",
      "firsthand-experience",
      "experience-evaluation"
    ]
  },
  "missing-mechanisms": {
    "opening": "How should we decide which mechanism to add next? A list of brain-inspired names is not a research plan. The stronger starting point is a recurring limitation that current responsibilities and information flow cannot adequately explain.",
    "sections": [
      {
        "title": "Distinguish a missing mechanism from a broken handoff",
        "text": "Failure to resume work might arise because evidence was never delivered, because the relevant record was not selected or because the decision was poor. Those causes call for different responses. Adding another engine before tracing the existing path could hide the problem and create duplicate responsibilities."
      },
      {
        "title": "Describe the contribution before the component",
        "text": "A proposal should identify the situation it addresses, the information it needs, what state it changes and how that change could affect behaviour. It should also explain why an existing mechanism cannot own the responsibility more simply. This keeps biological inspiration connected to an explicit computational question."
      },
      {
        "title": "Integration is part of the proposal",
        "text": "A component that generates useful output still needs a defined consumer, timing and interpretation. Current Questioning, Curiosity, Weave and predictive components illustrate different stages of that problem. Their status should remain visible rather than being filled in by an architecture diagram."
      },
      {
        "title": "Let evidence narrow the roadmap",
        "text": "The next step may be a new mechanism, a better representation or the removal of an unnecessary path. We want experiments to help distinguish these possibilities. Complexity is justified by an observable contribution, not by how closely the set of module names resembles a brain."
      }
    ],
    "related": [
      "architecture-overview",
      "findings",
      "weave",
      "predictive-engines",
      "evaluation"
    ]
  },
  "initiative": {
    "opening": "What could an individual choose to do when nobody has just asked it a question? Initiative may include exploring an unfamiliar topic, checking something already underway, reading available material or starting an ordinary conversation.",
    "sections": [
      {
        "title": "Broader than task completion",
        "text": "Not every interaction needs an immediate work payoff. Casual conversation can be a reasonable choice, and learning about the environment can precede a specific assignment. The challenge is to allow such activity without making it compulsory or repeatedly interrupting the same people."
      },
      {
        "title": "Use the situation that is actually available",
        "text": "An initiative should depend on known context, past interactions and real capabilities. Permission to explore does not create an internet-search tool or imply access to private material. Remembering recent attempts also matters so that an unchanged situation does not trigger the same activity again."
      },
      {
        "title": "What exists now",
        "text": "Awareness’s controller guidance permits initiative, including during periodic consideration, while allowing waiting or no action. This remains a model decision within the available context and limits. The separate Curiosity capability is not automatically selecting explorations for Awareness today."
      },
      {
        "title": "What better initiative would mean",
        "text": "We want to examine whether exploration produces useful understanding, appropriate social interaction and timely recognition of unfinished concerns. That includes observing when the individual chooses to stop. More autonomous messages or tool calls would not, by themselves, demonstrate better initiative."
      }
    ],
    "related": [
      "motivation-action",
      "curiosity",
      "awareness",
      "senses-roles",
      "evaluation"
    ]
  }
};
