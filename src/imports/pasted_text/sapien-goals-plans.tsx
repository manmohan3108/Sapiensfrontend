Add a Goals & Plans panel to the Sapien UI.

The backend exposes goals (durable intents) and plans (tactical step lists) for each sapien. Plans live under their goal. Build a panel that lists active goals as cards and lets the user drill into one goal to see its plan, context, and progress.

Endpoints
Method	URL	Returns
GET	/api/sapien/<sapien_id>/goals?active_only=true&include_plan=true&top_k=20	Paginated list of goals (with current_plan embedded when include_plan=true)
GET	/api/sapien/<sapien_id>/goals/<goal_id>	Full goal detail: { goal, context, current_plan, plan_context }
POST	/api/sapien/<sapien_id>/goals/<goal_id>/replan body { "reason": "..." }	Enqueues async replan; new plan visible on re-fetch within ~10–60s
GET	/api/orchestrator/status	{ overloaded, pending, limit } (already used by busy indicator)
Query params for list endpoint (all optional):

active_only (bool, default true)
status_in (csv: pending,active,blocked,done,failed,abandoned)
source_in (csv: user,curiosity,parent,lesson,external)
match (substring on description)
top_k (int, default 20)
order_by (priority | importance | updated_at | created_at)
include_plan (bool, default false)
Data shapes
Goal

{
  id: string
  sapien_id: number
  description: string
  motivation: string
  source: "user" | "curiosity" | "parent" | "lesson" | "external"
  status: "pending" | "active" | "blocked" | "done" | "failed" | "abandoned"
  importance: number   // 0..1
  priority:   number   // 0..1
  progress:   number   // 0..1
  relations:  Array<{ type: string, target_id: string }>
  evidence:   Array<{ kind: string, ref: string }>
  attrs:      object
}
GoalContext (the goal's project-doc state)

{
  id: string
  goal_id: string
  facts:          Array<{ key, value, source, confidence, pinned_at }>
  decisions:      Array<{ at, decision, rationale }>
  assumptions:    Array<{ text, confidence, status }>
  open_questions: Array<{ id, question, asked_at, resolved_at?, resolution? }>
}
Plan (current version for a goal)

{
  id: string
  goal_id: string
  version: number
  status: "active" | "superseded" | "abandoned" | "done"
  steps: Array<{
    id: string
    description: string
    status: "pending" | "active" | "done" | "skipped" | "blocked"
    attrs: object
  }>
}
PlanContext — same shape as GoalContext but plan-specific.

UI requirements
Goals panel (sidebar or dedicated tab)
List active goals as cards (call list endpoint with active_only=true&include_plan=true).
Each card shows: description, source badge, status pill, importance bar, and a progress line based on current_plan.steps (count of done / total).
Sort by priority desc (server already does this with order_by=priority).
Empty state: "No active goals yet. Mention something you want help with and Sapien will track it." Note: extracted intents take ~10 minutes to commit (settling delay) — show a small hint about that.
Goal detail view (modal or right pane when a card is clicked)
Header: description + status + importance.
Plan section: ordered step list from current_plan.steps. Each step shows status (pending/active/done/skipped/blocked). Allow clicking a step to mark done — call (later, no endpoint yet) PATCH .../plan/<plan_id>/step/<step_id> if/when exposed; for now read-only.
Context section ("What Sapien knows about this goal"): render context.facts as a key→value list, context.decisions as a timeline, context.open_questions as an "?" badge with the question text (resolved ones struck through).
Plan context section ("What Sapien knows about this plan"): same shape as goal context but plan-specific.
Replan button: opens a small text input ("Why replan?") → POST .../replan with the reason. Show "Replanning…" while the request is in flight; the actual new plan appears after the backend processes the job (poll every ~10s for ~1 minute, or use the panel's normal refresh).
Status filters
Toggle row: All / Active / Done / Failed / Abandoned. Re-fetch list with status_in matching.
Source filter (chip set): user / curiosity / parent / lesson / external.
Refresh strategy
List endpoint: poll every 30s while the panel is visible.
Detail view: poll every 10s while open.
Re-fetch immediately after replan is triggered, and on every websocket / new chat message (so newly-committed goals appear).
Empty / null handling
current_plan and plan_context may be null (plan hasn't been generated yet — usually within ~10 minutes of goal creation). Render "Sapien is still planning…" placeholder.
context may be null for very old goals created before context was introduced — render "(no context yet)".
Backpressure interplay
When /api/orchestrator/status reports overloaded: true, show an info banner above the Goals panel: "Sapien is processing background work — plans and new goals may take longer than usual to appear." Reuse the existing busy indicator pattern.
Visual hierarchy
Goal description is largest text; plan steps are dense; context is collapsed by default with a chevron to expand. Keep importance/priority/progress as thin meters, not numbers.
Use the app's existing component primitives (cards, modals, status pills, meters). No new dependencies.