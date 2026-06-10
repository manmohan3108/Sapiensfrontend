You're building a **memory explorer** frontend for the EngramEngine — an AI sapien's long-term memory system. The backend stores three kinds of memory data and connects them:

1. **MemoryUnits** — atomic pieces of memory (a paragraph from a doc, a dialogue turn, an entity name). Each unit has a `memory_type`: `"episodic"` (a real experience), `"entity"` (a person/place/thing), `"semantic"` (concept/chunk), `"summary"` (LLM-generated rollup).
2. **MemoryContext** — versioned observations attached to a unit (provenance, entities extracted, temporal info).
3. **MemoryLinks** — directed weighted edges between units, each with a `mechanism` describing why they're linked (e.g. `semantic_similarity`, `entity_mention`, `narrative_thread`, `temporal_proximity`).

The frontend should help developers and users:
- Browse what the sapien remembers
- Explore the connections between memories
- See exactly how recall works (which stages found what, how they merged)
- Debug recall quality (why did query X return result Y?)

All endpoints are read-only except `/api/engram/recall` which is `POST` because the body carries a query.

---

## Base URL

```
http://localhost:8000/api/engram/
```

No auth currently. All responses are JSON.

---

## Core Data Shapes

### Unit object

```json
{
  "id": "6a28898b3f3d...",            // MongoDB ObjectId (string)
  "sapien_id": 2,
  "memory_type": "episodic",          // "episodic" | "entity" | "summary" | "semantic"
  "content": "Miller had leaned forward...",
  "checksum": "...",                   // dedupe key
  "created_at": "2026-06-09T21:45:27Z"
}
```

### Context (per unit)

A dict keyed by **slot name**. Whatever slots exist appear; common ones:

```json
{
  "provenance": {
    "source_type": "document",
    "source_name": "Book 1 Chapter-1 & 2.docx",
    "source_position": 89
  },
  "temporal": { "system_at": "...", "asserted_at": "...", "validity_window": null },
  "entities": { "nouns": ["Miller", "Dr. Voss"], "activities": ["leaned forward"] }
}
```
Slot keys are not a fixed enum — render generically (key/value table) but treat `provenance.source_name` and `provenance.source_position` as user-facing.

### Link object

```json
{
  "id": "6a28a8a7ccfa...",            // the linked node's id
  "type": "unit",                      // "unit" | "context"
  "relation": "is_mentioned_in",       // semantic relation
  "mechanism": "entity_mention",       // how this link was created
  "mechanism_data": { "noun": "Miller" },
  "weight": 1.0                        // 0.0 – 1.0
}
```

### MemoryRef (lightweight pointer)

```json
{
  "id": "...",
  "source": "unit",                    // "unit" | "context"
  "score": 0.585,                      // meaning depends on origin (see below)
  "meta": {
    "strategy": "meaning",             // "meaning" | "keyword" | "graph" | "entity"
    "qdrant_id": "...",                // for vector hits
    "bm25_score": 17.4,                // for keyword hits
    "mechanism": "semantic_similarity" // for graph hits
  }
}
```

### ComposedMemory (the merged result)

```json
{
  "unit_id": "...",
  "content": "Miller had leaned forward...",
  "memory_type": "episodic",
  "score": 1.300,                      // merged + normalized + WM-boosted
  "strategy": "graph",                 // which source produced the winning ref
  "sapien_id": 2,
  "context": { /* slots */ },
  "links": [ /* link objects */ ]
}
```

---

## Endpoints

### 1. `GET /api/engram/units`

**Purpose:** Paginated list of all units for a sapien, optionally filtered by `memory_type`.

**Query params:**
- `sapien_id` (int, **required**)
- `memory_type` (string, optional) — `"episodic"`, `"entity"`, `"summary"`, etc.
- `page` (int, default 1)
- `page_size` (int, default 50, max 200)

**Response:**
```json
{
  "sapien_id": 2,
  "memory_type": "episodic",
  "page": 1,
  "page_size": 50,
  "total": 287,
  "results": [ /* Unit objects */ ]
}
```

**Frontend use:** main "browse memory" table. Click a row → detail view (endpoint 2).

---

### 2. `GET /api/engram/units/<unit_id>`

**Purpose:** Single unit + ALL its context slots + ALL its links.

**Response:**
```json
{
  "unit": { /* Unit object */ },
  "context": { /* slot dict */ },
  "links": [ /* link objects */ ]
}
```

**Frontend use:** detail page. Show unit content prominently, context slots as collapsed accordion, links as a clickable list (each goes to another unit detail page).

---

### 3. `GET /api/engram/units/<unit_id>/adjacent`

**Purpose:** One-hop neighbours of a unit.

**Query params:**
- `mechanism` (optional) — filter by edge mechanism (`semantic_similarity`, `entity_mention`, etc.)
- `relation` (optional) — filter by relation (`is_mentioned_in`, `similar`, etc.)
- `direction` (optional, default `both`) — `forward` | `backward` | `both`

**Response:**
```json
{
  "unit_id": "...",
  "direction": "both",
  "mechanism": null,
  "relation": null,
  "neighbors": [ /* MemoryRef objects */ ]
}
```

**Frontend use:** graph view "expand this node". Show filter dropdowns for mechanism/direction.

---

### 4. `GET /api/engram/units/<unit_id>/related`

**Purpose:** Multi-hop graph walk (BFS) starting from this unit.

**Query params:**
- `depth` (int, default 2) — how many hops to walk
- `mechanism` (optional) — filter walks to one edge type
- `min_weight` (float, default 0.3)

**Response:**
```json
{
  "unit_id": "...",
  "depth": 2,
  "results": [ /* MemoryRef objects, sorted by decayed score desc */ ]
}
```

**Frontend use:** "find related memories N hops away". Use for graph-explorer panel.

---

### 5. `GET /api/engram/units/<unit_id>/sequence`

**Purpose:** Walk `narrative_thread` edges in document order.

**Query params:**
- `direction` (`forward` | `backward` | `both`, default `forward`)
- `limit` (int, default 20)

**Response:**
```json
{
  "unit_id": "...",
  "direction": "forward",
  "limit": 20,
  "sequence": [ /* MemoryRef objects, in order */ ]
}
```

**Frontend use:** "what came next in the source document?" — a reading mode where you see surrounding chunks.

---

### 6. `GET /api/engram/entities`

**Purpose:** All entity units (people, places, things) for a sapien.

**Query params:**
- `sapien_id` (int, **required**)
- `page`, `page_size`

**Response:**
```json
{
  "sapien_id": 2,
  "page": 1, "page_size": 50, "total": 42,
  "results": [
    { "id": "...", "memory_type": "entity", "content": "Miller", ... },
    { "id": "...", "memory_type": "entity", "content": "Raj", ... }
  ]
}
```

**Frontend use:** entity sidebar. Each entity is clickable → endpoint 7.

---

### 7. `GET /api/engram/entities/<unit_id>/episodes`

**Purpose:** Given an entity unit, get every episode where it appears (follows `entity_mention` links).

**Response:**
```json
{
  "entity": { /* Unit object: id, content="Miller", ... */ },
  "count": 17,
  "episodes": [
    {
      "id": "...",
      "weight": 1.0,
      "content": "Miller had leaned forward...",   // first 300 chars
      "memory_type": "episodic"
    }
  ]
}
```

**Frontend use:** entity profile page. Show entity name at top, list of all chunks mentioning it as cards.

---

### 8. `POST /api/engram/recall`

**Purpose:** Run the full recall pipeline AND see what each stage found.

**Request body:**
```json
{
  "sapien_id": 2,
  "query": "Tell me about Miller",
  "depth": "shallow"                  // or "deep"
}
```

**Response:**
```json
{
  "query": "Tell me about Miller",
  "sapien_id": 2,
  "depth": "shallow",
  "stages": {
    "meaning": [ /* MemoryRef[] — vector hits, cosine scores */ ],
    "keyword": [ /* MemoryRef[] — BM25 hits, raw BM25 scores */ ],
    "graph":   [ /* MemoryRef[] — graph-expanded units */ ]
  },
  "merged": [ /* ComposedMemory[] — final ranked + assembled output */ ]
}
```

**Frontend use:** the **recall debugger**. This is the most important view.

Layout suggestion:
- Top: query input + depth toggle + submit button
- Three columns: meaning / keyword / graph — each shows refs in order with score
- Bottom: merged final results with content snippets and which source contributed
- Highlight units that appear in multiple stages

`meaning` scores are cosine `[0, 1]`. `keyword` scores are unbounded BM25 (often 5–25). `graph` scores are `link_weight × hop_decay`. Don't try to compare scores across stages — they're on different scales. The `merged` list normalizes them.

---

### 9. `GET /api/engram/wm/<sapien_id>`

**Purpose:** Current working memory state — what's "warm" in this session.

**Response:**
```json
{
  "sapien_id": 2,
  "wm": {
    "focus_id": "...",
    "entries": [
      { "id": "...", "memory_source": "memory_unit", "score": 0.87, "has_embedding": true }
    ]
  }
}
```

**Frontend use:** sidebar "active in working memory". Shows what just got recalled — helps explain why the next query surfaces it.

---

### 10. `GET /api/engram/stats/<sapien_id>`

**Purpose:** Overview stats.

**Response:**
```json
{
  "sapien_id": 2,
  "total_units": 287,
  "by_memory_type": {
    "episodic": 230,
    "entity": 42,
    "summary": 15
  },
  "link_mechanisms": {
    "narrative_thread": 215,
    "semantic_similarity": 178,
    "entity_mention": 312,
    "temporal_proximity": 94,
    "provenance_analysis": 33
  }
}
```

**Frontend use:** dashboard hero. Show totals + a bar chart of memory_type breakdown + link mechanism counts.

---

## Error Format

All errors return:
```json
{ "error": "human-readable message" }
```
Status codes: `400` (bad input), `404` (not found), `405` (wrong method), `500` (server error).

---

## Suggested Page Structure

1. **Dashboard** — `/api/engram/stats/<sapien_id>` for the hero numbers
2. **Browse Memory** — `/api/engram/units` table with type filter, click row → detail
3. **Memory Detail** — `/api/engram/units/<id>` showing content, slots, links as clickable graph
4. **Entity Browser** — `/api/engram/entities` sidebar, click → `/api/engram/entities/<id>/episodes` panel
5. **Recall Debugger** — `/api/engram/recall` POST form with stage-by-stage visualization
6. **Graph Explorer** — pick a unit, use `/api/engram/units/<id>/adjacent` and `/related` to render a node-link diagram (Cytoscape.js or D3 work well)
7. **WM Panel** — sticky sidebar showing `/api/engram/wm/<sapien_id>` so users see session continuity

---

## Things to Get Right

- **Unit IDs are MongoDB ObjectIds (24 hex chars)** — pass them as strings, don't truncate in API calls. Display can truncate to first 8 chars for compactness.
- **Render content text BEFORE metadata** when showing units in lists. Metadata can mislead users (the entity-extraction LLM sometimes misses names).
- **Color-code links by mechanism** in graph views — `entity_mention` (cyan), `semantic_similarity` (orange), `narrative_thread` (gray), `temporal_proximity` (yellow), `provenance_analysis` (purple).
- **Stage scores are NOT comparable across stages** in `/api/engram/recall` response. Show them per-stage but use the `merged` array for final ranking.
- **Empty results are normal** — many endpoints can legitimately return zero (e.g. entity_episodes for a newly created entity hub). Don't show "error" UI for empty.
- **Sapien IDs are integers**, unit IDs are strings.