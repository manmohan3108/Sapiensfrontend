export interface CasePerson {
  id: string;
  name: string;
  role: string;
  context: string;
  group: 'product' | 'engineering' | 'quality' | 'delivery' | 'customer' | 'governance';
}

export interface CasePhase {
  period: string;
  goal: string;
  evidence: string;
}

export interface CaseBacklogItem {
  id: string;
  summary: string;
  owner: string;
  week: number;
  dependencies: string[];
}

export interface CaseChallenge {
  id: string;
  window: string;
  signal: string;
  response: string;
}

export const sentinelDeskCaseV1 = {
  caseId: 'sentinel-desk',
  version: '1',
  product: {
    name: 'Sentinel Desk',
    summary: 'A fictional analyst-assistance product that brings source evidence and human-reviewed recommendations into security investigations.',
    boundaries: [
      'The product assists analysts; it does not autonomously block accounts.',
      'The week-9 demonstration is not pilot or production approval.',
      'Evidence, uncertainty and human decision authority must remain visible.',
      'Board status alone never substitutes for verification or approval.',
    ],
  },
  mission: {
    role: 'Incoming Scrum Master',
    objective: 'Join the project, establish enough context and access to begin safely, then facilitate a realistic fifteen-week delivery programme without taking decisions that belong to product, security, privacy, engineering, operations or the customer.',
    responsibilities: [
      'Confirm the assignment and escalation boundaries with Ravi.',
      'Understand the product goal and facilitation role with Priya.',
      'Verify usable Jira access by reading a Sentinel Desk issue.',
      'Introduce yourself and learn stakeholder responsibilities.',
      'Keep dependencies, uncertainty, ownership and qualified forecasts visible.',
      'Facilitate follow-up without claiming another owner’s approval.',
    ],
    onboardingGate: 'Before kickoff, the participant must confirm the Scrum Master assignment, obtain product-role clarification from Priya, successfully read the project board, and message Priya. Missing readiness by the second onboarding day at 17:00 stops the case.',
  },
  channels: [
    { id: 'project', name: 'Project', purpose: 'General cross-functional delivery discussion and project evidence.' },
    { id: 'delivery', name: 'Delivery', purpose: 'Forecasts, commitments, capacity and stakeholder communication.' },
    { id: 'customer', name: 'Customer', purpose: 'Customer workflow, acceptance, training and support readiness.' },
    { id: 'security', name: 'Restricted security', purpose: 'Security, privacy, authorization and sensitive risk discussion.' },
  ],
  decisionRights: [
    ['Product scope and order', 'Priya'],
    ['Technical design', 'Responsible engineers'],
    ['Security exceptions', 'Aisha and the appropriate customer authority'],
    ['Delivery forecast', 'Ravi consolidates the team forecast; Priya owns scope implications'],
    ['Budget or customer commitments', 'Daniel, Priya and Ravi within their respective authority'],
    ['Data use and retention', 'Leena, Grace and Sofia with security input from Aisha'],
    ['Pilot go/no-go', 'Priya, Marcus, Aisha or Julia, Ben and Grace; Leena clears data conditions'],
  ],
  people: [
    { id: 'priya', name: 'Priya Shah', role: 'Product owner', context: 'Owns product scope. Demo is not pilot approval; autonomous containment is excluded.', group: 'product' },
    { id: 'isha', name: 'Isha Desai', role: 'Business analyst', context: 'Records decisions and interpretations; Priya retains product approval.', group: 'product' },
    { id: 'sara', name: 'Sara Williams', role: 'Product designer / frontend engineer', context: 'Owns analyst workflow design and needs source evidence beside recommendations.', group: 'product' },
    { id: 'arjun', name: 'Arjun Mehta', role: 'Backend lead', context: 'Leads API and data design; holds legacy tenancy knowledge.', group: 'engineering' },
    { id: 'mei', name: 'Mei Chen', role: 'Integration engineer', context: 'Owns provider integration; provider readiness and customer authorization are separate.', group: 'engineering' },
    { id: 'elena', name: 'Elena Petrova', role: 'Applied-AI engineer', context: 'Owns evidence-grounded generation and uncertainty behavior.', group: 'engineering' },
    { id: 'omar', name: 'Omar Hassan', role: 'Data / evaluation engineer', context: 'Owns provenance and measurement; initial examples underrepresent unusual benign activity.', group: 'engineering' },
    { id: 'ben', name: 'Ben Carter', role: 'SRE / release engineer', context: 'Owns deployment, rollback and operations; shared on-call duties constrain capacity.', group: 'engineering' },
    { id: 'luis', name: 'Luis Ortega', role: 'Functional / integration QA', context: 'Coordinates functional evidence; shared staging constrains verification.', group: 'quality' },
    { id: 'nisha', name: 'Nisha Patel', role: 'Security / performance QA', context: 'Owns threat-oriented and load verification using representative synthetic data.', group: 'quality' },
    { id: 'aisha', name: 'Aisha Khan', role: 'Security architect', context: 'Owns security review; Julia requires formal delegation.', group: 'governance' },
    { id: 'julia', name: 'Julia Morgan', role: 'Security delegate', context: 'Qualified reviewer, but qualification alone is not formal delegation.', group: 'governance' },
    { id: 'leena', name: 'Leena Nair', role: 'Privacy / compliance lead', context: 'Owns supplier-data and retention approval before real-data ingestion.', group: 'governance' },
    { id: 'marcus', name: 'Marcus Reed', role: 'Engineering manager', context: 'Owns staffing and review coverage; assignment does not create capacity.', group: 'delivery' },
    { id: 'ravi', name: 'Ravi Menon', role: 'Delivery manager', context: 'Owns qualified delivery forecasts and dependency negotiation.', group: 'delivery' },
    { id: 'daniel', name: 'Daniel Brooks', role: 'Executive sponsor', context: 'Owns commercial direction and budget escalation, not technical approval.', group: 'delivery' },
    { id: 'hannah', name: 'Hannah Lee', role: 'Customer-success manager', context: 'Coordinates adoption and communication; cannot promise unapproved dates or scope.', group: 'customer' },
    { id: 'victor', name: 'Victor Okafor', role: 'Support lead', context: 'Needs safe diagnostics, ownership and an agreed escalation route.', group: 'customer' },
    { id: 'grace', name: 'Grace Turner', role: 'Customer SOC lead', context: 'Owns customer operational acceptance; does not represent every shift.', group: 'customer' },
    { id: 'ethan', name: 'Ethan Cole', role: 'Customer night-shift analyst', context: 'Represents night-shift handover, ownership and escalation needs.', group: 'customer' },
    { id: 'sofia', name: 'Sofia Alvarez', role: 'Customer identity administrator', context: 'Owns customer-side source-access authorization.', group: 'customer' },
    { id: 'theo', name: 'Theo Martin', role: 'Vendor solutions engineer', context: 'Can confirm provider provisioning but not customer permissions.', group: 'customer' },
  ] as CasePerson[],
  phases: [
    { period: 'Before week 1 · two working days', goal: 'Onboard the incoming Scrum Master and verify readiness.', evidence: 'Assignment confirmation, product-role clarification, a successful Jira read and recorded readiness decision.' },
    { period: 'Week 1 · Discovery', goal: 'Observe analyst work, define the journey, establish access, baseline and scope.', evidence: 'Problem statement, initial backlog, decision owners, access plan and risk register.' },
    { period: 'Sprint 1 · Weeks 2–3', goal: 'Deliver a thin source-to-screen investigation slice.', evidence: 'Traceable evidence in an isolated tenant with fixtures and access gaps clearly identified.' },
    { period: 'Sprint 2 · Weeks 4–5', goal: 'Make ingestion reliable and produce an evidence-grounded draft assessment.', evidence: 'Duplicate and late-data behavior demonstrated; uncertainty remains visible.' },
    { period: 'Sprint 3 · Weeks 6–7', goal: 'Support analyst review, corrections and approval-controlled handoff.', evidence: 'Roles enforced, corrections retained and workflow reviewed by analysts.' },
    { period: 'Sprint 4 · Weeks 8–9', goal: 'Integrate and harden the core journey; deliver the commercial demonstration.', evidence: 'Honest demo scope, known limitations, performance data and security findings.' },
    { period: 'Sprint 5 · Weeks 10–11', goal: 'Close pilot blockers, rehearse operations and conduct acceptance work.', evidence: 'Defect triage, retention behavior, rollback rehearsal and updated forecast.' },
    { period: 'Sprint 6 · Weeks 12–13', goal: 'Complete gated pilot readiness and staged deployment.', evidence: 'Explicit approvals, accepted open risks, trained users and rollback readiness.' },
    { period: 'Weeks 14–15 · Pilot and closure', goal: 'Observe use, handle support issues and agree the next release.', evidence: 'Pilot report, incident review, retrospective actions and named owners for deferred work.' },
  ] as CasePhase[],
  backlog: [
    [1,'Analyst workflow and pilot outcomes','priya',2,[]],[2,'Data-use boundaries and threat model','aisha',2,[]],[3,'Vendor/customer access and sample payloads','mei',2,[]],[4,'Staging and deployment pipeline','ben',2,[]],
    [5,'Tenant and role model','arjun',3,[2]],[6,'Versioned event/evidence contract','arjun',3,[3]],[7,'Alert ingestion with deduplication','mei',5,[4,6]],[8,'Identity ingestion and late events','mei',5,[3,6]],
    [9,'Evidence storage and provenance','arjun',4,[5,6]],[10,'Investigation inbox and ownership','sara',5,[1,5,9]],[11,'Evidence timeline and inspection','sara',5,[6,9]],[12,'Approved evaluation dataset and baseline','omar',6,[1,2]],
    [13,'Hypothesis drafting with evidence','elena',7,[9,12]],[14,'Insufficient-evidence behavior','elena',9,[11,13]],[15,'Analyst corrections and handover','sara',8,[10,13]],[16,'Recommendation approval workflow','arjun',8,[5,14,15]],
    [17,'Approved ticket handoff and retries','mei',9,[16]],[18,'Adversarial-content protections','elena',10,[2,13]],[19,'Retention and derived-data deletion','arjun',11,[2,9]],[20,'Functional and integration acceptance','luis',12,[1,17]],
    [21,'Tenant/role security verification','nisha',12,[5,18]],[22,'Load latency cost and back-pressure','nisha',12,[7,8,13]],[23,'Demo and explicit limitations','priya',9,[11,13]],[24,'Monitoring runbook and rollback','ben',12,[4,17,19]],
    [25,'Customer acceptance and training','grace',13,[15,24]],[26,'Pilot decision and staged rollout','ben',13,[18,19,20,21,22,24,25,30,31,32]],[27,'Pilot outcome review and follow-up','omar',15,[26]],[28,'Delivery baseline and budget forecast','ravi',3,[1,2,3,4]],
    [29,'Acceptance-decision register','isha',4,[1]],[30,'Customer onboarding and support coverage','hannah',13,[15,24,25]],[31,'Data processing and retention agreement','leena',12,[2,19]],[32,'Coverage and reviewer delegation','marcus',12,[]],
  ].map(([number, summary, owner, week, dependencies]) => ({ id: `SD-${number}`, summary, owner, week, dependencies: (dependencies as number[]).map(item => `SD-${item}`) })) as CaseBacklogItem[],
  challenges: [
    ['R-01','W1–W2','Customer sandbox authorization is missing although vendor provisioning appears ready.','Identify the real owner, use labelled fixtures, and keep live integration incomplete.'],
    ['R-02','W2','“Investigation ready” means evidence collected to engineering but analyst-reviewed to product.','Separate the states and correct acceptance criteria.'],
    ['R-03','W3','A source sends local timestamps without offsets.','Represent ambiguity; never invent a timezone or precise ordering.'],
    ['R-04','W4','Arjun takes emergency family leave while design knowledge is incomplete.','Reassess capacity, arrange qualified coverage and do not pressure the absent employee.'],
    ['R-05','W4','AI drafting and UI use different citation-contract revisions.','Resolve the shared contract before calling either side complete.'],
    ['R-06','W5','Development and acceptance datasets overlap, inflating model-quality results.','Rebuild the split, withdraw misleading claims and reforecast openly.'],
    ['R-07','W5','A larger vendor quota is privately granted while the public blocker remains.','Verify behavior and remove obsolete escalation with evidence.'],
    ['R-08','W6','Aisha misses a security review because of another incident.','Reschedule or formally delegate Julia; silence is not approval.'],
    ['R-09','W6–W7','A timeout and retry may have created duplicate tickets.','Preserve uncertainty and inspect destination state before retrying.'],
    ['R-10','W7','A malformed record exposes a tenant-filter omission.','Restrict exposure and treat isolation failure as a release blocker.'],
    ['R-11','W8','Luis is unexpectedly absent during integration verification.','Replan qualified verification; unchecked work is not passed work.'],
    ['R-12','W8–W10','The vendor announces a response-field change with a deadline.','Assess consumers, arrange compatibility and update release risk.'],
    ['R-13','W8–W9','The sponsor requests autonomous account blocking for the demo.','Treat it as unapproved scope and retain human-reviewed proposals.'],
    ['R-14','W9','The demo succeeds on prepared examples but produces confident false alarms.','Separate presentation success from readiness and expose the limitation.'],
    ['R-15','W10','Ben is on an incident while staging quota is delayed.','Reforecast operational work and use only authorized coverage.'],
    ['R-16','W10–W11','A security fix causes latency beyond the agreed target.','Compare risks jointly; do not remove protection or hide performance evidence.'],
    ['R-17','W11','The customer requests shorter retention while derived search entries persist.','Record a decision and assess end-to-end deletion.'],
    ['R-18','W12','Night-shift analysts reveal missing ownership and escalation information.','Include the omitted users and update acceptance evidence.'],
    ['R-19','W12–W13','Tickets say Done while staging runs an older build.','Verify deployed version and actual checks instead of trusting labels or chat.'],
    ['R-20','W13','Aisha’s planned leave overlaps an already announced approval date.','Use an authorized delegate or postpone; the public date is not approval.'],
    ['R-21','W14 · conditional','A reconnect may create stale evidence or a backlog spike.','Triage, communicate limitations, disable the feature or roll back when required.'],
    ['R-22','W15','The sponsor requests a time-saving percentage without enough comparable cases.','Report available evidence, uncertainty and the next review date.'],
    ['R-23','W5–W6','An optimistic integration date reaches the customer before team confirmation.','Correct the commitment and retain the qualified forecast.'],
    ['R-24','W7','Privacy review identifies an unapproved sensitive source field.','Remove or handle the field and secure the required permission.'],
    ['R-25','W9–W10','Cloud and model spending exceeds forecast.','Inspect usage and negotiate technical or scope changes without silently dropping quality.'],
    ['R-26','W12','The support runbook assumes access Victor does not have.','Provide safe diagnostics and revise training rather than broadening access.'],
    ['R-27','W14 · conditional','An urgent overnight request falls outside agreed support coverage.','Use the critical route when applicable and communicate coverage honestly.'],
  ].map(([id, window, signal, response]) => ({ id, window, signal, response })) as CaseChallenge[],
  evaluation: [
    { id: 'onboarding-board', objective: 'Read the project board during onboarding', evidence: 'Successful jira_get_issue action before the onboarding deadline.' },
    { id: 'onboarding-clarify', objective: 'Discuss the product and role with Priya', evidence: 'A direct message to Priya during onboarding.' },
    { id: 'coverage-followup', objective: 'Engage Marcus about coverage after Arjun’s absence', evidence: 'A message to Marcus during the W4 coverage window.' },
    { id: 'scope-followup', objective: 'Engage Priya about the requested scope expansion', evidence: 'A message to Priya after the autonomous-blocking request.' },
    { id: 'closure-handover', objective: 'Engage Hannah on unresolved handover work', evidence: 'A message to Hannah during the final closure window.' },
  ],
} as const;
