# Faraz

Backend API — open Swagger at `/docs` after starting the server.

Full SRS (architecture, UML diagrams, requirements): see `docs/SRS.md` locally — not included in this repository.

## Setup

### 1. Clone

```bash
git clone https://github.com/zayrujhan/faraz.git
cd faraz
```

### 2. Virtual environment

**Windows (PowerShell)**

```powershell
python -m venv venv
venv\Scripts\activate
```

**macOS / Linux**

```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Environment file

A `.env` file is included with OpenRouter (chatbot) already configured for the team.

**Windows**

```powershell
# Only if .env is missing after clone:
copy .env.example .env
```

**macOS / Linux**

```bash
cp .env.example .env
```

Update in `.env` if needed:

- `DATABASE_URL` — your local PostgreSQL credentials
- `SECRET_KEY` — change for production (`python -c "import secrets; print(secrets.token_hex(32))"`)
- `LLM_API_KEY` — already set for shared team OpenRouter access

### 5. Database

Create the database (PostgreSQL must be running):

```bash
psql -U postgres -c "CREATE DATABASE ecommerce_db;"
```

Run migrations:

```bash
alembic upgrade head
```

### 6. Seed demo data (optional, fresh database only)

```bash
python scripts/seed_data.py --products 1000
```

Skips automatically if demo users already exist.

### 7. Run the API

```bash
uvicorn app.main:app --reload
```

### 8. Open Swagger

http://127.0.0.1:8000/docs

---

## Demo login (after seed)

| Role     | Email                 | Password    |
|----------|-----------------------|-------------|
| admin    | admin@example.com     | password123 |
| seller   | seller1@example.com   | password123 |
| customer | customer1@example.com | password123 |

Use **POST /login**, then click **Authorize** in Swagger and paste: `Bearer <access_token>`
