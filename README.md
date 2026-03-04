# ESG Compliance Platform

B2B SaaS platform for automated ESG (Environmental, Social, and Governance) compliance auditing across global supply chains.

## Features

- **Automated Audit Engine** - Run compliance checks against CSRD, CBAM and other international standards
- **One-Click Report Generation** - Generate exportable PDF audit reports
- **AI Supplier Matching** - LLM-powered procurement requirement analysis and supplier recommendations
- **Deep Supply Chain Transparency** - Multi-tier supplier visualization with environmental records and geographic data
- **Compliance Alerts** - Automatic risk flagging for certifications (GOTS, OEKO-TEX, etc.) and ESG violations

## Tech Stack

- **Backend**: Python 3.12 + FastAPI + SQLAlchemy 2.0
- **Frontend**: Next.js 15 + React 19 + TypeScript + Tailwind CSS
- **Database**: PostgreSQL 16
- **Cache/Queue**: Redis 7
- **LLM Integration**: OpenAI GPT-4 via LangChain
- **PDF Generation**: WeasyPrint + Jinja2

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local frontend development)
- Python 3.12+ (for local backend development)

### Using Docker Compose

```bash
docker-compose up -d
```

- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Frontend: http://localhost:3000

### Local Development

**Backend:**

```bash
cd backend
python -m venv venv
venv\Scripts\activate      # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

### Database Setup

```bash
cd backend
alembic upgrade head        # Run migrations
python -m app.seed          # Seed demo data (optional)
```

## Project Structure

```
ESG/
├── backend/                # FastAPI backend
│   ├── app/
│   │   ├── api/v1/         # API routes
│   │   ├── core/           # Config, auth, database
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   └── tasks/          # Async tasks
│   └── alembic/            # DB migrations
├── frontend/               # Next.js frontend
│   └── src/
│       ├── app/            # Pages (App Router)
│       ├── components/     # React components
│       ├── lib/            # Utilities
│       └── services/       # API client
└── docker-compose.yml
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/auth/register | Register new organization |
| POST | /api/v1/auth/login | Login |
| GET | /api/v1/suppliers | List suppliers |
| POST | /api/v1/suppliers | Create supplier |
| POST | /api/v1/suppliers/import-csv | Bulk import via CSV |
| GET | /api/v1/suppliers/{id}/supply-chain | Get supply chain tree |
| POST | /api/v1/audits | Create audit task |
| POST | /api/v1/audits/{id}/run | Execute audit |
| POST | /api/v1/reports/{audit_id}/generate | Generate PDF report |
| GET | /api/v1/alerts | List compliance alerts |
| POST | /api/v1/alerts/scan | Trigger compliance scan |

## Environment Variables

Copy `backend/.env` and configure:

| Variable | Description | Default |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | postgresql://postgres:postgres@localhost:5432/esg_platform |
| REDIS_URL | Redis connection string | redis://localhost:6379/0 |
| SECRET_KEY | JWT signing key | (change in production) |
| OPENAI_API_KEY | OpenAI API key for LLM features | (required for AI matching) |

## License

Proprietary - All rights reserved.
