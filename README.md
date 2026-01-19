# Personal AI Assistant API

A TypeScript/Express API for managing personal productivity data — tasks, events, reminders, people, places, documents, memories, and projects. Uses a vector store backend for semantic search capabilities.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create a `.env` file in the project root:

```bash
PORT=3000
VECTOR_STORE_URL=http://localhost:8000/api/products
VECTOR_STORE_API_KEY=your-api-key-here
INDEX_PREFIX=assistant_
```

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `VECTOR_STORE_URL` | URL to the Product Search API | `http://localhost:8000/api/products` |
| `VECTOR_STORE_API_KEY` | Bearer token for API authentication | (empty) |
| `INDEX_PREFIX` | Prefix for all vector store collections | `assistant_` |

### 3. Run the server

```bash
# Development (with hot reload)
npm run dev

# Production
npm run build
npm start
```

---

## Entity Types

All entities share these base fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Auto-generated | Unique identifier (e.g., `tsk_abc123`) |
| `title` | string | **Yes** | Main searchable title |
| `description` | string | No | Additional context for search |
| `created_at` | ISO datetime | Auto | Creation timestamp |
| `updated_at` | ISO datetime | Auto | Last update timestamp |

### Tasks

Actions to complete.

| Field | Type | Description |
|-------|------|-------------|
| `status` | `pending` \| `in_progress` \| `completed` \| `cancelled` | Task status |
| `priority` | `low` \| `medium` \| `high` \| `urgent` | Priority level |
| `due_date` | ISO datetime | When the task is due |
| `person_id` | string | Related person |
| `place_id` | string | Related place |
| `project_id` | string | Parent project |
| `document_id` | string | Related document |

### Events

Calendar items with specific times.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `start_time` | ISO datetime | **Yes** | Event start time |
| `end_time` | ISO datetime | No | Event end time |
| `all_day` | boolean | No | Full day event |
| `person_id` | string | No | Related person |
| `place_id` | string | No | Event location |
| `project_id` | string | No | Parent project |
| `recurring` | string | No | Recurrence pattern (`daily`, `weekly`, `monthly`) |

### Reminders

Time-triggered notifications.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `remind_at` | ISO datetime | **Yes** | When to trigger the reminder |
| `related_id` | string | No | ID of related entity |
| `related_type` | EntityType | No | Type of related entity |
| `recurring` | string | No | Recurrence pattern |
| `snoozed_until` | ISO datetime | No | Snooze timestamp |

### People

Contacts and relationships.

| Field | Type | Description |
|-------|------|-------------|
| `phone` | string | Phone number |
| `email` | string | Email address |
| `relationship` | string | e.g., `friend`, `colleague`, `landlord`, `doctor` |
| `company` | string | Company/organization |
| `address` | string | Physical address |
| `birthday` | ISO date | Birthday |
| `notes` | string | Additional notes |

### Places

Physical locations.

| Field | Type | Description |
|-------|------|-------------|
| `address` | string | Physical address |
| `coordinates` | `{ lat, lng }` | GPS coordinates |
| `person_id` | string | Contact person (e.g., owner) |
| `type` | string | e.g., `home`, `office`, `warehouse`, `restaurant` |
| `notes` | string | Additional notes |

### Documents

Important papers, contracts, files.

| Field | Type | Description |
|-------|------|-------------|
| `type` | string | e.g., `contract`, `agreement`, `receipt`, `id` |
| `expires` | ISO datetime | Expiration date |
| `status` | `active` \| `expired` \| `pending` \| `archived` | Document status |
| `file_url` | string | URL to the file |
| `person_id` | string | Related person |
| `place_id` | string | Related place |

### Memories

Notes, facts, ideas, preferences.

| Field | Type | Description |
|-------|------|-------------|
| `category` | string | e.g., `idea`, `fact`, `preference`, `instruction` |
| `tags` | string[] | Tags for categorization |
| `importance` | `low` \| `medium` \| `high` | Importance level |
| `related_id` | string | ID of related entity |
| `related_type` | EntityType | Type of related entity |

### Projects

Groupings for related items.

| Field | Type | Description |
|-------|------|-------------|
| `status` | `active` \| `completed` \| `on_hold` \| `cancelled` | Project status |
| `deadline` | ISO datetime | Project deadline |
| `goal` | string | Project goal/objective |

---

## API Endpoints

Base URL: `http://localhost:3000/api`

### CRUD Operations

All entity types support the same CRUD operations:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/{entities}` | List/search entities |
| `GET` | `/{entities}/:id` | Get single entity by ID |
| `POST` | `/{entities}` | Create new entity |
| `PUT` | `/{entities}/:id` | Full update (replace) |
| `PATCH` | `/{entities}/:id` | Partial update |
| `DELETE` | `/{entities}/:id` | Delete entity |

**Available resources:**
- `/api/tasks`
- `/api/events`
- `/api/reminders`
- `/api/people`
- `/api/places`
- `/api/documents`
- `/api/memories`
- `/api/projects`

### Unified Search

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/search?q=...` | Simple search |
| `POST` | `/api/search` | Advanced search |

---

## Usage Examples

### Create a Task

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Pick up rental agreement",
    "description": "Get the signed agreement from the warehouse landlord",
    "priority": "high",
    "due_date": "2026-01-22T10:00:00Z"
  }'
```

**Response:**
```json
{
  "id": "tsk_m5x8k2abc",
  "title": "Pick up rental agreement",
  "description": "Get the signed agreement from the warehouse landlord",
  "priority": "high",
  "due_date": "2026-01-22T10:00:00Z",
  "created_at": "2026-01-19T12:00:00Z",
  "updated_at": "2026-01-19T12:00:00Z"
}
```

### Create a Person

```bash
curl -X POST http://localhost:3000/api/people \
  -H "Content-Type: application/json" \
  -d '{
    "title": "John Smith",
    "description": "Warehouse landlord on Oak Street",
    "relationship": "landlord",
    "phone": "555-1234",
    "email": "john@example.com"
  }'
```

### Create an Event

```bash
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Meet landlord for agreement",
    "start_time": "2026-01-22T10:00:00Z",
    "end_time": "2026-01-22T11:00:00Z",
    "person_id": "per_abc123",
    "place_id": "plc_xyz789"
  }'
```

### Create a Reminder

```bash
curl -X POST http://localhost:3000/api/reminders \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Rental agreement expires in 30 days",
    "remind_at": "2026-12-01T09:00:00Z",
    "related_id": "doc_abc123",
    "related_type": "document"
  }'
```

### Create a Place

```bash
curl -X POST http://localhost:3000/api/places \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Storage Warehouse",
    "description": "My rented warehouse for inventory storage",
    "address": "123 Oak Street, City",
    "type": "warehouse",
    "person_id": "per_abc123"
  }'
```

### Create a Document

```bash
curl -X POST http://localhost:3000/api/documents \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Warehouse Rental Agreement",
    "description": "Annual lease for storage space at Oak Street warehouse",
    "type": "contract",
    "expires": "2027-01-01T00:00:00Z",
    "status": "active",
    "person_id": "per_abc123",
    "place_id": "plc_xyz789"
  }'
```

### Create a Memory

```bash
curl -X POST http://localhost:3000/api/memories \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Warehouse access code",
    "description": "Gate code is 4521. Landlord prefers calls before 6pm.",
    "category": "fact",
    "importance": "high"
  }'
```

### Create a Project

```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Warehouse Setup",
    "description": "Everything related to setting up the new storage space",
    "status": "active",
    "deadline": "2026-02-01T00:00:00Z",
    "goal": "Have warehouse fully operational"
  }'
```

### Get Entity by ID

```bash
curl http://localhost:3000/api/tasks/tsk_m5x8k2abc
```

### Update Entity (Full)

```bash
curl -X PUT http://localhost:3000/api/tasks/tsk_m5x8k2abc \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Pick up rental agreement",
    "status": "completed",
    "priority": "high"
  }'
```

### Update Entity (Partial)

```bash
curl -X PATCH http://localhost:3000/api/tasks/tsk_m5x8k2abc \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed"
  }'
```

### Delete Entity

```bash
curl -X DELETE http://localhost:3000/api/tasks/tsk_m5x8k2abc
```

### List with Filters

```bash
# List pending high-priority tasks
curl "http://localhost:3000/api/tasks?status=pending&priority=high&limit=20"

# Search tasks by query
curl "http://localhost:3000/api/tasks?q=warehouse&limit=10"
```

### Unified Search (GET)

Search across all entity types:

```bash
curl "http://localhost:3000/api/search?q=warehouse&limit=10"
```

Search specific types:

```bash
curl "http://localhost:3000/api/search?q=warehouse&types=task,document,memory&limit=10"
```

### Unified Search (POST)

```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "warehouse agreement",
    "types": ["task", "document", "person", "place"],
    "limit": 10,
    "search_type": "hybrid"
  }'
```

**Response:**
```json
{
  "query": "warehouse agreement",
  "types": ["task", "document", "person", "place"],
  "total": 4,
  "results": [
    {
      "id": "doc_abc123",
      "title": "Warehouse Rental Agreement",
      "_type": "document",
      "_score": 0.95
    },
    {
      "id": "tsk_xyz789",
      "title": "Pick up rental agreement",
      "_type": "task",
      "_score": 0.87
    }
  ],
  "by_type": {
    "task": { "results": [...], "total": 1 },
    "document": { "results": [...], "total": 1 },
    "person": { "results": [...], "total": 1 },
    "place": { "results": [...], "total": 1 }
  }
}
```

**Search types:**
- `hybrid` (default) — Multi-vector search with reranking
- `openai_dense` — OpenAI embeddings only (fastest)
- `bge_m3_dense` — BGE-M3 dense embeddings
- `bge_m3_sparse` — BGE-M3 sparse embeddings (keyword-like)

---

## Health Check

```bash
curl http://localhost:3000/health
```

```json
{
  "status": "ok",
  "timestamp": "2026-01-19T12:00:00.000Z"
}
```

---

## ID Format

Each entity type has a unique ID prefix:

| Type | Prefix | Example |
|------|--------|---------|
| Task | `tsk_` | `tsk_m5x8k2abc` |
| Event | `evt_` | `evt_n6y9l3def` |
| Reminder | `rem_` | `rem_o7z0m4ghi` |
| Person | `per_` | `per_p8a1n5jkl` |
| Place | `plc_` | `plc_q9b2o6mno` |
| Document | `doc_` | `doc_r0c3p7pqr` |
| Memory | `mem_` | `mem_s1d4q8stu` |
| Project | `prj_` | `prj_t2e5r9vwx` |

---

## Error Responses

**400 Bad Request** — Missing required fields
```json
{
  "error": "title is required"
}
```

**404 Not Found** — Entity doesn't exist
```json
{
  "error": "task not found"
}
```

**500 Internal Server Error** — Server/database error
```json
{
  "error": "Failed to create task"
}
```

