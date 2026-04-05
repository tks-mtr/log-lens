# LogLens

> [日本語版はこちら](README.ja.md)

A web application for centralized management, search, and analysis of application logs. LogLens visualizes meaningful metrics from log data to support system health monitoring, early anomaly detection, and informed decision-making.

---

## Getting Started

```bash
git clone https://github.com/tks-mtr/log-lens.git
cd log-lens
docker-compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger UI) | http://localhost:8000/docs |

---

## Running Tests

```bash
# Backend tests
docker-compose exec backend pytest

# Frontend tests
docker-compose exec frontend npm test
```

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

For details, see [`docs/requirements/personas_usecases.md`](docs/requirements/personas_usecases.md).

### Roles & Permissions

Authentication is out of scope for this implementation. The UI is built assuming an admin role. Roles are defined conceptually as follows:

| Role | Permissions |
|------|------------|
| Admin | Full access (CRUD including delete) |
| General User | Read, search, create, and edit (delete not permitted) |

Role-based authentication is noted as a future improvement in [`docs/backlog.md`](docs/backlog.md).

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

## Architecture

The backend follows a **layered architecture** to keep each concern isolated and testable:

```
Router → Service → Repository → PostgreSQL
```

- **Router**: Handles HTTP routing and delegates request/response validation to Pydantic schemas
- **Service**: Encapsulates business logic; keeps Router and Repository decoupled
- **Repository**: Manages all DB access via SQLAlchemy v2 `AsyncSession`

The frontend uses Next.js **App Router** with a clear separation between Server Components (layout, static content) and Client Components (filters, forms, charts). API communication is managed centrally via TanStack Query.

---

## Future Improvements

The following features were out of scope for this submission but are worth pursuing. See [`docs/backlog.md`](docs/backlog.md) for details.

- **Authentication & Authorization**: JWT-based role separation between Admin and General Users
- **Retention Policy**: Automatic deletion of logs older than a configurable period
- **Real-time Updates**: WebSocket-based push notifications (currently replaced by a manual refresh button)
- **AI Debate Engine**: Automatic insight extraction using two OSS LLMs in a debate-style loop, analyzing logs against requirements and specifications
