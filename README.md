> [日本語版はこちら](README.ja.md)

# LogLens

A web application for centralized management, search, and analysis of application logs. LogLens visualizes meaningful metrics from log data to support system health monitoring, early anomaly detection, and informed decision-making.

---

## Features

- **Dashboard** — Real-time severity summary cards, time-series trend chart (Hour / Day / Week), and severity distribution histogram by source
- **Log List** — Filterable, sortable, and paginated log table with CSV export
- **Log Detail** — View, edit, and delete individual log entries
- **Log Creation** — Create new log entries via a validated form
- **Source Combobox** — Auto-complete source field populated from existing sources in the DB
- **Dark / Light Mode** — System-aware theme toggle

---

## Getting Started

### Prerequisites

- Docker and Docker Compose

### Launch the application

```bash
git clone https://github.com/tks-mtr/log-lens.git
cd log-lens

# Copy environment file
cp backend/.env.example backend/.env

# Build and start all services
docker-compose up --build
```

Database migrations run automatically on startup via `alembic upgrade head`.
On first run, the `seed` service inserts 201 fixed test records automatically (skipped on subsequent runs).

| Service | URL |
|---------|-----|
| Backend API | http://localhost:8000 |
| API Docs (Swagger UI) | http://localhost:8000/docs |
| Frontend | http://localhost:3000 |

### Local development (without Docker)

To run the frontend in development mode locally:

```bash
cd frontend
cp .env.local.example .env.local  # set NEXT_PUBLIC_API_URL if needed
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Health check

```bash
curl http://localhost:8000/health
# {"status":"ok"}
```

---

## Running Tests

### Backend tests

Tests are split into two environments:

**Without Docker (unit tests — no DB required):**

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Core config tests
pytest tests/core/

# Schema tests
pytest tests/schemas/

# Service layer tests (Repository is mocked)
pytest tests/services/
```

**With Docker (integration tests — requires db-test container):**

```bash
# Start only the test database
docker-compose up -d db-test

# Repository integration tests (real PostgreSQL)
pytest backend/tests/repositories/

# Router integration tests (full stack with real DB)
pytest backend/tests/routers/
```

**Run all tests with coverage (144 tests):**

```bash
docker-compose up -d db-test
cd backend
pytest --cov=app --cov-report=term-missing
```

### Frontend tests

```bash
cd frontend

# Unit tests (Vitest) — 84 tests
npm run test

# E2E tests (Playwright) — 18 tests
# Requires Docker services running (backend + DB) for API calls
docker-compose up -d app db
npx playwright test
# Playwright auto-starts the frontend dev server via webServer config
```

---

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/logs` | Create a log entry |
| GET | `/api/v1/logs` | List logs with filtering and pagination |
| GET | `/api/v1/logs/{id}` | Get a single log entry |
| PATCH | `/api/v1/logs/{id}` | Partially update a log entry |
| DELETE | `/api/v1/logs/{id}` | Delete a log entry (204 No Content) |
| GET | `/api/v1/logs/analytics/summary` | Severity summary and source histogram |
| GET | `/api/v1/logs/analytics/timeseries` | Time-series aggregation by interval |
| GET | `/api/v1/logs/export/csv` | Export logs as UTF-8 BOM CSV |
| GET | `/api/v1/logs/sources` | List distinct source names (sorted) |

---

## Design Philosophy

### Concept

> **"See the value through your logs — Log Lens"**

The goal is not just to *display* logs, but to help users *make decisions* from them. The dashboard is designed to answer the following questions at a glance:

- **Is something wrong right now?** → Severity summary cards (ERROR / CRITICAL counts)
- **When and where did the issue occur?** → Time-series trend chart + source filter
- **What does the overall pattern look like?** → Severity distribution histogram

### Personas

| Persona | Primary Use Case |
|---------|----------------|
| Operations Engineer | Daily monitoring and early anomaly detection |
| Backend Developer | Investigating and tracing error causes |
| Team Lead | Tracking system-wide health trends over time |

### Backend Architecture

The backend follows a **layered architecture** to keep each concern isolated and testable:

```
Router → Service → Repository → PostgreSQL
```

- **Router**: HTTP routing and request/response validation via Pydantic schemas
- **Service**: Business logic (date range validation, filter orchestration); keeps Router and Repository decoupled
- **Repository**: All DB access via SQLAlchemy v2 `AsyncSession`

### Key Design Decisions

| Topic | Decision | Rationale |
|-------|----------|-----------|
| `timestamp` default | Set in `LogRepository.create` using `datetime.now(timezone.utc)` | Keeps the Service layer free from infrastructure concerns; Repository owns the DB write |
| Severity validation | Pydantic `Literal` + PostgreSQL `CHECK` constraint | Double-layer defense: reject invalid values at the schema level before hitting the DB |
| Source filter strategy | Partial match (`ilike`) for list endpoint; exact match for analytics | List supports keyword search UX; analytics requires precise grouping by source name |
| Error response on 500 | Stack trace logged via `logger.exception`, never exposed in response | Security best practice: internal errors must not leak implementation details to clients |
| CSV export | UTF-8 BOM + filename `logs_YYYYMMDD.csv` | BOM ensures Excel compatibility without encoding issues |
| `updated_at` update | SQLAlchemy client-side `onupdate=func.now()` + `flush()` + `refresh()` | Triggers the UPDATE statement to propagate the new timestamp from the DB |
| Migration on startup | `alembic upgrade head` in Dockerfile CMD | Ensures schema is always up to date when the container starts; no manual steps required |

---

## Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Backend | FastAPI (Python) | Type-safe implementation via Python type hints, automatic OpenAPI generation, native async support |
| Database | PostgreSQL | Strong support for time-series aggregation via `DATE_TRUNC` and window functions |
| ORM | SQLAlchemy v2 + Alembic | De facto standard Python ORM; schema migration via `--autogenerate` |
| Frontend | Next.js (TypeScript) | File-based routing with App Router; leverages the React ecosystem |
| UI | Tailwind CSS + shadcn/ui | Utility-first rapid development; Radix UI-based customizable components |
| Charts | Recharts | Declarative SVG-based API designed for React |
| Server State | TanStack Query | Automatic cache, loading, and error state management |
| Forms | React Hook Form + Zod | Minimal re-renders; type-safe validation integrated with TypeScript inference |
| Backend Testing | pytest + httpx | FastAPI-recommended; async endpoint testing via `AsyncClient` |
| Frontend Testing | Vitest + React Testing Library | Faster than Jest with better Next.js compatibility; tests co-located with source files |
| Infrastructure | Docker + docker-compose | One-command local setup with reproducible environments |

For detailed comparisons and rationale, see [`docs/design/tech_selection.md`](docs/design/tech_selection.md).

---

## Roles & Permissions

Authentication is out of scope for this implementation. The UI is built assuming an admin role. Roles are defined conceptually as follows:

| Role | Permissions |
|------|------------|
| Admin | Full access (CRUD including delete) |
| General User | Read, search, create, and edit (delete not permitted) |

---

## Viewing Design Documents

Design documents under `docs/system/` use [Mermaid](https://mermaid.js.org/) diagrams (ER diagram, screen flow, sequence diagrams). To preview them locally in VS Code, install the following extension:

- [Markdown Preview Mermaid Support](https://marketplace.visualstudio.com/items?itemName=bierner.markdown-mermaid)

GitHub renders Mermaid diagrams natively, so no extension is needed when viewing on GitHub.

---

## AI-Driven Development

This project was built entirely through AI-driven development using [Claude Code](https://claude.ai/code). The development process itself was treated as an engineering challenge: designing the harness that guides the AI, not just the application.

### Harness Design: Planner / Generator / Evaluator

Inspired by [Anthropic's harness design principles](https://www.anthropic.com/engineering/harness-design-long-running-apps), each sprint was executed by three specialized sub-agents orchestrated via Claude Code's `Agent` tool:

```
Main Claude (Orchestrator)
  │
  ├─ Planner   — Reads requirements + sprint plan → creates Sprint Contract
  ├─ Generator — Implements features + writes tests based on the contract
  └─ Evaluator — Reviews tests → runs pytest / Vitest / Playwright → feeds back
```

The Generator ↔ Evaluator loop repeats per sprint until all acceptance criteria pass. Sprint Contracts (`docs/sprint/`), structured rule files (`.claude/rules/`), custom slash command skills (`/summary`, `/add_memo`), and project-wide instructions (`CLAUDE.md`) were also defined to keep AI behavior consistent across sessions.

---

## Future Improvements

The following features were out of scope for this submission but are worth pursuing:

- **Authentication & Authorization**: JWT-based role separation between Admin and General Users
- **Retention Policy**: Automatic deletion of logs older than a configurable period
- **Real-time Updates**: WebSocket-based push notifications (currently replaced by a manual refresh button)
- **Authentication & Authorization (frontend)**: Route protection and role-based UI
- **LLM Debate for Value Judgement**: Multiple LLMs analyze log data from different perspectives and debate to surface anomaly patterns or root cause candidates that a single model might miss
