export type ResearchArticle = {
  opening: string;
  sections: { title: string; text: string }[];
  related: string[];
  references?: { title: string; url: string }[];
};

// Introductions describe current code and research directions, not deployment guarantees.
export const researchArticles: Partial<Record<string, ResearchArticle>> = {
  "philosophy": {
    "opening": "We often face new situations without being told exactly what to do. We use what we know, ask questions and change our approach as we learn more. AI can also reason about a situation and suggest useful steps. But can AI develop the kind of understanding that allows people to learn from experience and adapt to new situations? This is one of the questions behind Sapiens.",
    "sections": [
      {
        "title": "What we mean by intelligence and understanding",
        "text": "For this research, knowing means having information available. Understanding means grasping how it fits together and when it is useful. We use intelligence more broadly: it includes reasoning through a problem, learning from what happens and adapting when circumstances change. These are working meanings that guide what we want to study in Sapiens. We want to explore how these abilities develop and support one another, while keeping open the question of what would count as evidence of understanding."
      },
      {
        "title": "Why this matters to us",
        "text": "Someone joining a team might think two colleagues disagree, then discover that each is describing a different part of the work. Understanding the situation involves connecting what they hear, considering explanations and asking a useful question. An AI can reason about this too when given the details. Our interest is in what makes that ability possible and how it could develop across different situations. This is part of a broader ambition to understand intelligence, including how we form ideas, imagine possibilities and revise what we believe."
      },
      {
        "title": "Why learn from the brain?",
        "text": "Human intelligence gives us a reason to look closely at the brain. We can recognize familiar patterns, imagine what might happen and change our minds. Neuroscience, the study of the brain and nervous system, offers ideas about the processes involved. We want to examine which of those ideas could help us build and study intelligence in software. Each process we explore should have a clear reason to be there and a question it helps us investigate."
      },
      {
        "title": "Why philosophy matters too",
        "text": "What makes an explanation meaningful? When can we say that someone understands, or that a decision is their own? Philosophy helps us examine the assumptions behind questions like these. It shapes what we want to investigate and how we interpret what Sapiens does. A successful answer or a mistake gives us something to examine, but neither settles these questions by itself."
      },
      {
        "title": "Where consciousness fits",
        "text": "Consciousness raises another question: could a system have an experience of what is happening, beyond processing information and acting on it? This interests us because the brain inspires questions about both intelligence and experience. Ideas about how information becomes available for conscious thought can inform our design. Being able to act intelligently does not tell us whether the system experiences anything. Our software uses the name Awareness for a function; that name is not a claim that Sapiens is conscious."
      },
      {
        "title": "Why we are building Sapiens",
        "text": "Sapiens gives us a way to explore these ideas in practice. We can build processes, study how they work together and examine what helps or fails. Our hypothesis is that intelligence could emerge when processes inspired by the brain work together. Building the system lets us investigate that possibility; it does not establish that it will happen. The next article, “Our hypothesis: how intelligence might emerge,” explains the hypothesis and why it guides our approach."
      }
    ],
    "related": [
      "emergence",
      "continuity",
      "inspiration",
      "evaluation"
    ],
    "references": [
      {
        "title": "Stanford Encyclopedia of Philosophy — Consciousness",
        "url": "https://plato.stanford.edu/entries/consciousness/"
      }
    ]
  },
  "emergence": {
    "opening": "Could intelligence grow from many processes working together, with each contributing something different? Our hypothesis is that bringing brain-inspired processes together could support broader abilities than any one of those processes provides alone. This idea guides how we build Sapiens and what we want to investigate.",
    "sections": [
      {
        "title": "What we mean by emergence",
        "text": "Sometimes, parts that affect one another produce a pattern or ability that belongs to the whole. We call this emergence. Looking at each part separately does not give the full explanation; we also need to understand their relationships. This interests us because intelligence involves many abilities working together. We want to explore how their interaction could contribute to understanding, rather than assume that adding more parts will produce it."
      },
      {
        "title": "Imagine a flock of birds",
        "text": "In a simple computer simulation, each bird follows three rules: avoid crowding nearby birds, move in a similar direction to its neighbours and stay near them. Together, the birds form a coordinated flock, even though no bird controls the whole formation. A bird changes direction, its neighbours respond, and their movements affect others. This is the idea behind Boids, a well-known model in computer science created by Craig Reynolds."
      },
      {
        "title": "The pattern comes from how the birds interact",
        "text": "The rules for each bird are programmed, but the flock’s changing formation does not need to be planned bird by bird. It develops as they respond to one another. This makes the example useful for our research: it shows why we should study what parts do together, as well as what each does alone. It explains an emergent pattern, not intelligence. Our question is whether interactions among processes inspired by the brain could contribute to the much broader abilities we are interested in."
      },
      {
        "title": "What the brain inspires us to explore",
        "text": "The brain brings perception, attention and memory together. Think of hearing a familiar voice in a crowded room. Recognizing it can draw your attention; listening more closely gives you information that may change who you think is speaking. What you remember affects what you notice, and what you notice can change your understanding. This kind of relationship motivates our research. We want to explore processes that influence one another as a situation unfolds, rather than treat each ability as an isolated task."
      },
      {
        "title": "How this shapes Sapiens",
        "text": "We organize Sapiens into functions with different responsibilities, which we call engines. Memory can bring earlier information into consideration. Awareness uses the available context to decide how to respond. Motor carries out selected tool actions and returns what happened, giving later decisions new information to work with. These are software choices inspired by questions about the brain, not copies of brain regions. We study what their cooperation contributes, while recognizing that the language model already supplies substantial reasoning and language abilities."
      },
      {
        "title": "What we still need to show",
        "text": "Connecting engines does not establish emergence. Neither does remembering an event, learning a useful lesson or producing an unexpected answer. We would need to identify an ability of the whole system and examine how the interactions contribute to it, including what changes when those interactions are absent. We also need to distinguish that contribution from what the language model, tools or extra information already provide. Our evaluation articles develop these questions; the architecture is a way to investigate the hypothesis, not proof of it."
      }
    ],
    "related": [
      "philosophy",
      "continuity",
      "perception-attention",
      "architecture-overview",
      "evaluation",
      "alternative-explanations"
    ],
    "references": [
      {
        "title": "Craig Reynolds — Boids: a computer model of flocking",
        "url": "https://www.red3d.com/cwr/boids/"
      },
      {
        "title": "Stanford Encyclopedia of Philosophy — Emergent Properties",
        "url": "https://plato.stanford.edu/entries/properties-emergent/"
      }
    ]
  },
  "continuity": {
    "opening": "People can revisit a situation with a different understanding because of what they have encountered, tried and learned. AI systems can also use past information. Our question is how a Sapien’s own history of choices and consequences could shape its understanding over time. Following one individual lets us study that development, as one part of our broader investigation of intelligence.",
    "sections": [
      {
        "title": "Why follow one individual over time?",
        "text": "An answer shows how a system responds at one moment. Following the same individual across encounters lets us ask something more: does earlier experience change how it understands a later situation? Can it recognize a useful connection, question an old assumption or apply an idea somewhere new? For Sapiens, continuity means keeping a meaningful connection between earlier and later experiences. A lasting name and a growing history make that investigation possible, but do not establish that development is happening."
      },
      {
        "title": "A perspective and actions of its own",
        "text": "People can remember, consider alternatives and act while remaining the same person. We use that idea to guide a shared perspective in Sapiens: its different functions belong to one individual. We want to connect its actions to the information and intentions behind them, so that reasons can be examined and reconsidered. Other people’s actions must remain theirs. If someone says “I approved this,” remembering the message should not turn it into the Sapien’s own approval. Here, individuality describes a design choice; it does not establish personhood or moral responsibility."
      },
      {
        "title": "Why taking part may matter",
        "text": "Being told how something works can be valuable. Taking part also gives an individual choices to make and consequences to examine. Suppose a Sapien is told that a colleague needs evidence before approving a proposal. By discussing a real proposal, it might discover which evidence matters, why a detail is missing and how that changes the decision. Participation can reveal information that the original instruction did not contain. A sufficiently detailed account could convey that information too; we want to examine when taking part adds something useful."
      },
      {
        "title": "How an experience could change understanding",
        "text": "In that example, the useful lesson might concern why particular evidence matters, not just which colleague to contact. A later proposal could require different evidence while raising a similar concern. We want to investigate whether a Sapien can use the relationship it learned, notice where the new situation differs and revise its view when needed. For this research, experience means what it encountered and attempted, what followed, and how it interpreted those events. An interpretation may be wrong, so it must remain distinguishable from what actually happened. This use of experience does not imply a felt experience."
      },
      {
        "title": "Development means more than keeping history",
        "text": "More memories can help, distract or reinforce a mistaken idea. A request might succeed because of temporary permission; a failed action might reflect an unavailable service rather than a poor decision. Repeating either outcome should not make its explanation unquestionable. We want to study whether earlier conclusions can be corrected and whether an individual can recognize when an experience no longer applies. Useful development may mean letting go of an assumption, not merely adding another record or repeating a familiar response."
      },
      {
        "title": "What this motivates in Sapiens",
        "text": "These questions give shared identity, memory, feedback and replay distinct reasons to exist. Identity keeps the individual’s perspective consistent. Memory retains experiences and connections; Feedback examines what later evidence suggests about earlier behaviour; replay revisits memories and their associations. Their design articles explain how these functions work and where the limits are. Changes to remembered information and later reasoning are not the same as retraining the language model. Our experience-evaluation work asks whether those changes actually help understanding and behaviour, or sometimes make them worse."
      }
    ],
    "related": [
      "philosophy",
      "identity",
      "memory",
      "action-feedback",
      "hippocampus",
      "experience-evaluation"
    ],
    "references": [
      {
        "title": "Stanford Encyclopedia of Philosophy — Agency",
        "url": "https://plato.stanford.edu/entries/agency/"
      }
    ]
  },
  "inspiration": {
    "opening": "If we want to learn from the brain, which ideas should we bring into Sapiens, and why? Our starting point is a question about an ability we want to understand. We then look for research that could help explain it and ask what we could investigate by adapting that idea in software.",
    "sections": [
      {
        "title": "Start with something we want to understand",
        "text": "A familiar place can remind us of a conversation. We can keep a question in mind while considering an answer, or change an expectation after a surprise. Each gives us a different question: what brings a memory back, what keeps information available, and what changes when an outcome is unexpected? These questions help us choose what to study in Sapiens. A component needs a reason to exist beyond having the name of a brain region."
      },
      {
        "title": "Turn an inspiration into a clear proposal",
        "text": "Consider the idea that activity can strengthen connections. In software, we could record when two memories are recalled together and change the strength of their relationship. That gives us something specific to examine: does this help useful information come back later, or mostly favour what was already familiar? The biological idea suggests a direction. The representation, rules and measurements are choices we make and need to justify."
      },
      {
        "title": "Different ideas explain different parts",
        "text": "We draw on both neuroscience and research on thinking and behaviour. Some ideas concern connections between neurons, the nerve cells of the brain; others concern keeping information in mind or making it available across different functions. These are different levels of explanation. A stored memory is not a neuron, and a software engine is not a brain region. We need to say which relationship or function we are adapting, rather than treat everything as one biological analogy."
      },
      {
        "title": "Give each question its own place",
        "text": "The following articles separate the ideas we use. Attention concerns what receives priority; working memory concerns what stays available during thought. Association concerns what brings an experience to mind, plasticity concerns how connections change, and replay concerns revisiting experience. Prediction and reward introduce questions about expectations and value. They can influence one another, but each has a different job in our research story."
      },
      {
        "title": "From inspiration to evidence",
        "text": "An idea from neuroscience gives us a starting point, not a guarantee. We need to explain our adaptation, check that information reaches the parts meant to use it, and examine whether it makes a useful difference. Engine deep dives describe those adaptations and their current limits. Experiments and findings address what we have observed and what comparisons remain to be made. This separation lets us be ambitious about the hypothesis while being precise about what we have built."
      }
    ],
    "related": [
      "philosophy",
      "emergence",
      "perception-attention",
      "associative-memory",
      "reinforcement-forgetting",
      "architecture-overview",
      "evaluation"
    ]
  },
  "perception-attention": {
    "opening": "How does one concern become the focus of thought while other information stays in the background? And how does that concern become available to the processes that can help with it? These questions matter to Sapiens because receiving information is only a first step; it must also be considered and used.",
    "sections": [
      {
        "title": "Noticing and using information",
        "text": "Imagine discussing a plan when someone mentions that an earlier agreement has changed. That detail may draw your attention, bring the agreement to mind and change the question you ask next. Noticing the update and using it across those activities are related but different steps. For Sapiens, we want to examine both: what receives attention, and whether the relevant information reaches the reasoning and actions that follow."
      },
      {
        "title": "The idea behind a global workspace",
        "text": "Global Workspace Theory, associated with Bernard Baars, proposes that selected information can become widely available to otherwise specialized processes. A later neuronal model by Stanislas Dehaene, Michel Kerszberg and Jean-Pierre Changeux describes how distributed brain activity could support that coordination during effortful tasks. The important inspiration for us is shared availability: information noticed in one place can influence several functions. It is not the idea of a small person inside the brain directing everything."
      },
      {
        "title": "Attention and a workspace are not the same thing",
        "text": "Attention concerns which information receives priority. A workspace account concerns how selected information becomes broadly available. In our plan example, prioritizing the changed agreement does not by itself ensure that it affects the decision. This distinction gives us a useful research question: when Sapiens selects a concern, what else needs to become available for it to understand and respond to that concern? Storing everything in one place would not answer that question."
      },
      {
        "title": "The connection to Awareness",
        "text": "Awareness is where we investigate bringing a concern, supporting context and possible responses together. Its engine article explains our current decision process. Here, the inspiration is that a focus should help coordinate useful information without making other concerns disappear indefinitely. We want to study whether it can keep a relevant concern in view, reconsider it when evidence changes and recognize when a different concern deserves attention."
      },
      {
        "title": "Where the comparison stops",
        "text": "Workspace theories contribute to research on conscious access, but they do not provide a settled recipe for subjective experience. Our prompts, communication layer and decision loop are software choices. Resembling an aspect of a workspace theory would not establish that Sapiens is conscious. We can investigate selection and information use while keeping that deeper question separate, as discussed in our research philosophy."
      }
    ],
    "related": [
      "inspiration",
      "working-memory-foundation",
      "awareness",
      "connections",
      "philosophy"
    ],
    "references": [
      {
        "title": "Bernard Baars — Global workspace theory of consciousness",
        "url": "https://pubmed.ncbi.nlm.nih.gov/16186014/"
      },
      {
        "title": "Dehaene, Kerszberg and Changeux — A neuronal model of a global workspace in effortful cognitive tasks",
        "url": "https://pubmed.ncbi.nlm.nih.gov/9826734/"
      }
    ]
  },
  "working-memory-foundation": {
    "opening": "How do we keep something in mind while using it to think? We may need an earlier instruction while comparing options, even as new information arrives. For Sapiens, this raises a question beyond storing memories: which information should remain available during the current thought, and when should it give way to something else?",
    "sections": [
      {
        "title": "Keeping a constraint in view",
        "text": "Suppose you are choosing a meeting time for people in different time zones. You need to compare the options while remembering that one person cannot attend in the morning. Knowing that constraint somewhere in your history is not enough; it needs to remain available as you compare. If a new message changes their availability, your current view needs to change too. This is the kind of problem that motivates our interest in working memory."
      },
      {
        "title": "What working memory describes",
        "text": "Working memory concerns holding information available and using it during ongoing thought. It differs from simply retaining information for later. Researchers disagree about exactly how it works. Some accounts emphasize separate temporary stores and control processes; others emphasize activated long-term memories and a narrower focus of attention. Nelson Cowan’s review explains these distinctions. We draw from the question they address without treating one software design as a complete account of human working memory."
      },
      {
        "title": "Why more context is not always better",
        "text": "Human working memory is limited, and information can interfere with other information. What counts as an item also depends on how it is organized and understood. We therefore do not take a fixed number from a memory experiment and use it as a biological rule for Sapiens. Our practical question is whether the available context supports the current thinking. A larger prompt may contain more information while still obscuring the constraint that matters."
      },
      {
        "title": "An active set for Sapiens",
        "text": "Our Working Memory keeps references to selected information, allowing its content to be retrieved when needed. This gives us a way to explore what stays active without treating every stored record as equally relevant now. The current Awareness connection uses it for supporting context and retained thoughts. The engine deep dive explains the selection and retention rules; those are engineering choices whose usefulness needs examination."
      },
      {
        "title": "What we want to learn from it",
        "text": "We want to know whether useful information stays available long enough to influence a decision, whether new evidence can displace an outdated assumption, and whether irrelevant material keeps returning. Losing the meeting constraint and holding on to an obsolete version are different failures. Attention determines what takes priority; long-term memory concerns what can be recalled. This article’s question is what remains available while the thinking proceeds."
      }
    ],
    "related": [
      "perception-attention",
      "associative-memory",
      "working-memory-engine",
      "awareness",
      "experience-evaluation"
    ],
    "references": [
      {
        "title": "Nelson Cowan — What are the differences between long-term, short-term, and working memory?",
        "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC2657600/"
      }
    ]
  },
  "associative-memory": {
    "opening": "How can one detail bring a larger experience to mind? People often remember through connections: a name recalls a conversation, or a place recalls something that happened there. For Sapiens, we want to explore how those relationships could make earlier experience useful when a new situation does not use the same words.",
    "sections": [
      {
        "title": "A cue can lead beyond itself",
        "text": "A colleague mentions that a review is delayed. You may remember an earlier discussion about missing evidence, who could provide it and why it mattered. The word “delayed” is only a cue; the useful information lies in the surrounding relationships. In Sapiens, we want to investigate recall that can bring back relevant context, rather than only a record that resembles the latest sentence."
      },
      {
        "title": "Remembering relationships",
        "text": "An associative view of memory asks how parts of an experience become connected and how a cue can help bring back more of it. Models studied by James McClelland, Bruce McNaughton and Randall O’Reilly represent learning through changes in connections and explore how those connections support memory. Their wider account distinguishes retaining particular experiences from learning structure across them. We return to that distinction in the replay article; here, our focus is how a cue leads to related information."
      },
      {
        "title": "Similarity is one kind of connection",
        "text": "Two conversations may use similar language but concern different projects. Two differently worded messages may describe the same unresolved issue. We therefore care about relationships such as shared people, events and context, as well as similarity of meaning. A useful connection should help recover why records belong together. Without that context, recall can bring back a plausible-looking memory that does not apply to the present situation."
      },
      {
        "title": "A connection is a lead, not proof",
        "text": "If a delay followed a team change, remembering them together does not prove that the change caused the delay. Likewise, repeatedly recalling the same explanation does not make it true. For Sapiens, associations should offer information to consider while keeping its source and uncertainty available. We want reasoning to be able to question a remembered connection, especially when a newer experience points in another direction."
      },
      {
        "title": "Why this leads to Engram",
        "text": "Engram is our exploration of connected long-term memory: retaining experiences with context and providing ways to recall related information. Its stored units and links are software representations, not biological neurons and synapses. The engine article covers how recall works. The next foundations ask how relationships might change through use and why revisiting memories could matter. Our aim here is to explain why connected recall belongs in the investigation at all."
      }
    ],
    "related": [
      "continuity",
      "working-memory-foundation",
      "reinforcement-forgetting",
      "replay-consolidation",
      "memory"
    ],
    "references": [
      {
        "title": "McClelland, McNaughton and O’Reilly — Complementary learning systems in the hippocampus and neocortex",
        "url": "https://pubmed.ncbi.nlm.nih.gov/7624455/"
      }
    ]
  },
  "reinforcement-forgetting": {
    "opening": "If experiences are connected, what should make a connection stronger or less prominent over time? Keeping every relationship fixed would ignore experience; strengthening everything repeatedly could make familiar ideas dominate. Hebbian learning and plasticity inspire how we investigate this balance in Sapiens.",
    "sections": [
      {
        "title": "What Hebbian learning suggests",
        "text": "Plasticity means that the nervous system can change. One influential idea, associated with Donald Hebb, is that activity in connected neurons can change how strongly they influence one another. In simplified terms, coordinated activity can strengthen a connection. This gives us a question for memory in software: could repeated use of related information make that relationship easier to use later? It is an inspiration for a rule, not a complete explanation of learning."
      },
      {
        "title": "Connections in the brain can change",
        "text": "A synapse is a connection through which one neuron influences another. Tim Bliss and Terje Lømo showed lasting increases in synaptic transmission after stimulation in the rabbit hippocampus, a brain region involved in memory. This increase is known as long-term potentiation. This supplies evidence that the effectiveness of connections can change. It does not show that every association should strengthen whenever two things occur together, or that a numerical link in our software behaves like a biological synapse."
      },
      {
        "title": "Why strengthening needs balance",
        "text": "A strengthening process can create a feedback loop: stronger connections cause more activity, which can strengthen them again. Research on homeostatic plasticity examines how neural activity stays stable while connections change. Synaptic scaling, described in Gina Turrigiano’s work, is one such mechanism. For Sapiens, the design question is whether familiar memories crowd out other useful information. Stabilizing activity and deciding whether information is correct remain different problems."
      },
      {
        "title": "Less prominent does not mean erased",
        "text": "Imagine repeatedly discussing one explanation for a delay. That explanation may become easy to recall even after evidence points elsewhere. We want a Sapien to reconsider it without losing the record of why it once seemed plausible. Reducing a connection’s prominence and deleting its supporting information have different consequences. The distinction matters to our design: an older account can remain useful for understanding how a situation or belief changed."
      },
      {
        "title": "Our limited adaptation",
        "text": "Engram can strengthen connections between memories recalled together and later reduce those connection weights to keep them from growing without balance. This is our computational interpretation of selected ideas, not a reconstruction of biological plasticity. It changes stored memory relationships, not the language model’s training. The Engram and replay deep dives explain the mechanism; evidence about usefulness requires a separate judgment. Frequent recall can reveal a recurring association while still reinforcing the wrong one."
      }
    ],
    "related": [
      "associative-memory",
      "replay-consolidation",
      "memory",
      "hippocampus",
      "action-feedback",
      "experience-evaluation"
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
    "opening": "Does useful memory processing have to stop when an interaction ends? People can return to earlier experiences, and brain research shows that earlier activity can reappear during later rest or sleep. This inspires a question for Sapiens: could revisiting selected memories help their information become useful in future situations?",
    "sections": [
      {
        "title": "What researchers observed",
        "text": "Matthew Wilson and Bruce McNaughton recorded activity in the hippocampus, a brain region involved in memory, as rats explored locations and slept before and afterward. Cells active together during the behaviour were more likely to be active together during subsequent sleep. This was evidence of earlier activity patterns being reactivated. It did not show a literal recording of the whole experience being played back, or establish that every reactivation produces a useful lesson."
      },
      {
        "title": "Why revisit an experience?",
        "text": "Suppose two conversations contain different parts of an unresolved problem. Returning to the earlier one may help bring its connection to the later one into view. That is an example of what we would like to investigate in Sapiens, not a claim that the rat experiment demonstrated this ability. Replay gives us a way to ask whether information becomes more useful through reconsideration, beyond simply being stored and left untouched."
      },
      {
        "title": "Remembering an event and learning across events",
        "text": "The complementary learning systems account of McClelland, McNaughton and O’Reilly proposes that the hippocampus rapidly learns particular experiences, while the neocortex, part of the brain’s outer layer, more gradually learns patterns across experiences. Reinstating memories is part of the proposed relationship between these systems. This motivates our interest in revisiting experience, while leaving open what kind of integration our software could support. Rereading a record alone is not evidence that it has learned a broader idea."
      },
      {
        "title": "Selection matters as much as repetition",
        "text": "What should a Sapien revisit: a recent encounter, an unresolved question or an experience that challenged an earlier belief? Repeating only the most familiar records could narrow what it considers. Repeating an incorrect interpretation could make it more prominent. These are research questions about selection and consequences. A replay process completing successfully tells us that it ran; we still need to examine what changed and whether that helped."
      },
      {
        "title": "What we currently adapt",
        "text": "Our Hippocampus engine coordinates selected recalls through Engram, followed by balancing of the learned memory connections. This is a limited replay mechanism, not a simulation of sleep or a complete hippocampus–cortex learning system. The engine deep dive describes that boundary. Experience evaluation asks whether revisiting memories improves later recall and behaviour, has little effect or makes misleading associations harder to escape."
      }
    ],
    "related": [
      "associative-memory",
      "reinforcement-forgetting",
      "hippocampus",
      "memory",
      "experience-evaluation"
    ],
    "references": [
      {
        "title": "Wilson and McNaughton — Reactivation of hippocampal ensemble memories during sleep",
        "url": "https://pubmed.ncbi.nlm.nih.gov/8036517/"
      },
      {
        "title": "McClelland, McNaughton and O’Reilly — Complementary learning systems",
        "url": "https://pubmed.ncbi.nlm.nih.gov/7624455/"
      }
    ]
  },
  "prediction-reward-foundation": {
    "opening": "What can a difference between what we expected and what happened tell us? People can use surprises to reconsider a situation, but something unexpected is not necessarily useful or rewarding. For Sapiens, we want to explore these distinctions before deciding how expectations should influence learning and action.",
    "sections": [
      {
        "title": "An outcome needs something to compare with",
        "text": "Imagine expecting a colleague to provide a missing detail. Their reply arrives, but it reveals a different problem instead. The message is new information; the difference from your expectation gives it another meaning. A prediction error describes a mismatch between an expected and an observed outcome. For our research, the question is whether retaining an expectation could help a Sapien notice what needs reconsideration, rather than only record that something happened."
      },
      {
        "title": "Reward prediction error is more specific",
        "text": "Reward prediction error concerns the difference between expected and received reward. Work reviewed by Wolfram Schultz describes dopamine responses that distinguish rewards better than expected, fully predicted rewards and outcomes worse than expected. This is more specific than treating dopamine as a signal of pleasure. It inspires a question about learning from outcomes relative to expectations; it does not give our software a feeling of satisfaction or disappointment."
      },
      {
        "title": "Novel, surprising and useful are different",
        "text": "An unfamiliar document may be novel but irrelevant to the current concern. A familiar colleague saying “no” may be surprising if approval was expected. An entirely expected answer may still be useful. For Sapiens, these distinctions matter because one score should not quietly stand for all three. We want to be able to ask whether information is unfamiliar, whether it challenges an expectation and whether it helps with something the individual is considering."
      },
      {
        "title": "Useful toward which outcome?",
        "text": "A message can be delivered successfully while leaving the recipient confused. If we value only delivery, we miss the purpose of the conversation. Before introducing a reward signal, we need to decide which outcome it concerns and what evidence supports that assessment. We also want to consider whether a useful discovery can matter beyond finishing a task. Those choices belong to our research into motivation and value, not to the name of a brain chemical."
      },
      {
        "title": "Where this stands in Sapiens",
        "text": "We have experimental Cortex, Cerebellum and Dopamine components for aspects of value, expectations, novelty and reward error. They are not connected to the main runtime as a complete learning loop. Their names describe inspirations and limited design roles, not the full functions of the corresponding biology. The predictive-engine article covers those attempts; Future research explores what additional design and evidence would be needed before these ideas could guide ongoing behaviour."
      }
    ],
    "related": [
      "predictive-engines",
      "prediction",
      "reward-emotion",
      "motivation-action",
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
      "continuity",
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
      "continuity",
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
      "continuity",
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
      "philosophy",
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
      "continuity",
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
      "continuity",
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
