Here's the reply prompt for the Frontend AI:

---

Thanks for the detailed list. I've shipped responses to most of your requests plus three new endpoints that should eliminate the bulk of N+1 fetches in the graph view. Two items are intentionally not done — explained at the end.

**1. WM endpoint — content + memory_type inline ✅ + capacity ✅**

`GET /api/engram/wm/<sapien_id>` response now:
```json
{
  "sapien_id": 2,
  "wm": {
    "focus_id": "...",
    "entries": [
      {
        "id": "...",
        "memory_source": "memory_unit",
        "score": 0.87,
        "has_embedding": true,
        "content": "Miller had leaned forward...",   // NEW (300 chars)
        "memory_type": "episodic"                     // NEW
      }
    ]
  },
  "capacity": {                                       // NEW
    "global": 100,
    "by_source": { "memory_unit": 10, "goal": 5, "conversation": 15, "emotion": 5, "reflection": 5 }
  }
}
```

Use `capacity.global` for the top-level "N/100 slots used" indicator. `capacity.by_source` lets you show per-source utilisation if helpful.

Content is only inlined for entries with `memory_source === "memory_unit"`. Other sources (goal, conversation, etc.) won't have content fields.

**2. Adjacent + Related — content + memory_type inline ✅**

Both endpoints now return refs with `content` (300-char snippet) and `memory_type`:
```json
{
  "id": "...",
  "source": "unit",
  "score": 0.91,
  "meta": { "mechanism": "semantic_similarity", "weight": 0.91, ... },
  "content": "Miller had leaned forward...",
  "memory_type": "episodic"
}
```

Same shape applied to `/units/<id>/sequence`.

**3. Recall stages — content + memory_type inline ✅**

`POST /api/engram/recall` response:
```json
{
  "stages": {
    "meaning": [{ id, source, score, meta, content, memory_type }, ...],
    "keyword": [{ id, source, score, meta, content, memory_type }, ...],
    "graph":   [{ id, source, score, meta, content, memory_type }, ...]
  },
  "merged": [...]   // unchanged — still full content
}
```

Stage refs now have parity with `merged`.

**4. WM delta `?since=` — not implementing ❌**

We don't keep a WM change log on the backend, and adding one is non-trivial (would need ring buffer per sapien, eviction events from controller). Same UX is achievable client-side:

```js
// every 30s
const next = await fetchWM();
const prevIds = new Set(prev.wm.entries.map(e => e.id));
const nextIds = new Set(next.wm.entries.map(e => e.id));
const added   = [...nextIds].filter(id => !prevIds.has(id));
const evicted = [...prevIds].filter(id => !nextIds.has(id));
prev = next;
```

Use those sets to drive entrance/exit animations. If you want "evicted history" persisting beyond one poll cycle, keep it in your component state. Let me know if backend tracking becomes critical later.

**5. Sequence direction — clarification 📝**

`GET /api/engram/units/<id>/sequence?direction=forward|backward|both&limit=20`

- `forward`  — walks `narrative_thread` edges **toward the end** of the source document (next chunks)
- `backward` — walks toward the **start** of the source document (previous chunks)
- `both`     — backward chunks first (in reverse order so they read naturally), then forward chunks

Response is an **ordered** `MemoryRef[]` (now hydrated with content + memory_type):
```json
{
  "unit_id": "...",
  "direction": "both",
  "limit": 20,
  "sequence": [
    { "id": "...", "score": 0.5, "content": "Previous chunk...", "memory_type": "episodic", ... },
    { "id": "...", "score": 0.5, "content": "Next chunk...", ... }
  ]
}
```

The starting unit itself is NOT in the response — only the chain of neighbours.

**6. Stats — total_links ✅**

`GET /api/engram/stats/<sapien_id>` response adds `total_links`:
```json
{
  "sapien_id": 2,
  "total_units": 287,
  "total_links": 832,                  // NEW
  "by_memory_type": { ... },
  "link_mechanisms": { ... }
}
```

Use `total_links / total_units` for the links-per-unit ratio you wanted.

---

**Bonus — 3 new endpoints I added that will help graph + landing UX:**

**A. Subgraph in one call**
```
GET /api/engram/units/<unit_id>/subgraph?depth=2&limit=50&mechanism=
→ {
    center, depth, limit, mechanism,
    nodes: [{ id, memory_type, content }, ...],
    edges: [{ source, target, mechanism, relation, weight }, ...]
  }
```
BFS around a unit, returns Cytoscape-ready nodes + edges. **Use this instead of repeated `/adjacent` calls when rendering the graph view.** Defaults: depth=2, limit=50. Caps: depth=4, limit=200.

**B. Sapien overview**
```
GET /api/engram/sapien/<sapien_id>/overview?limit=100&seed=top_entities|recent
→ { nodes, edges }
```
A sampled subgraph of the whole sapien's memory — use as the landing visualisation when no unit is selected yet. `seed=top_entities` anchors on the most-mentioned entity hubs (recommended default). `seed=recent` anchors on the newest units. Defaults: limit=100, max=300.

**C. Batch unit hydration**
```
GET /api/engram/units/batch?ids=id1,id2,id3
→ { results: [{ id, unit, context, links }, ...] }
```
Same shape as `/units/<id>` but for many ids in one call. Max 200 ids per request. Useful if you ever need full detail (context + links) for a list of unit ids without N round-trips.

---

**Color coding reminder for graph edges:**
- `entity_mention` — cyan
- `semantic_similarity` — orange
- `narrative_thread` — gray
- `temporal_proximity` — yellow
- `provenance_analysis` — purple
- (others — pick any colour, just be consistent)

Let me know if any of these need further shape tweaks. Particularly interested in feedback on the `subgraph` payload — that's the one most likely to need refinement based on what Cytoscape actually wants from you.