# Job Tracker

Track job applications: company, role, date, status, and notes, with a summary
of how many are applied / interviewing / offered / rejected.

**Stack:** Node.js + Express 5 · PostgreSQL (Amazon RDS in production) · plain
JavaScript frontend · Jest + Supertest · Docker · GitHub Actions · CloudWatch

## Project layout

```
job-tracker/
├── src/
│   ├── server.js              starts the server, handles shutdown
│   ├── app.js                 builds the Express app (tests import this)
│   ├── db.js                  Postgres connection pool, configured by env vars
│   ├── routes/
│   │   ├── applications.js    CRUD for /api/applications   ← TODO: PATCH
│   │   └── stats.js           GET /api/stats                ← TODO
│   ├── middleware/
│   │   └── errorHandler.js
│   └── scripts/initDb.js      runs db/schema.sql (npm run db:init)
├── db/schema.sql              the applications table
├── public/                    frontend, served by Express
│   ├── index.html
│   ├── styles.css
│   └── app.js                                               ← TODO x3
├── tests/app.test.js                                         ← TODO tests
├── .env.example               copy to .env
└── eslint.config.js
```

## Your tasks

Search the code for `YOUR CODE GOES HERE`. Each one explains the goal and
gives hints.

**Backend (Node/Express)**
1. `src/routes/applications.js`: `PATCH /api/applications/:id` (update status)
2. `src/routes/stats.js`: `GET /api/stats` (counts per status)

**Frontend (JavaScript)**
3. `public/app.js`: `renderStats()`, fill in the stat cards
4. `public/app.js`: `updateStatus()`, save a status change via your PATCH route
5. `public/app.js`: the "Show" filter dropdown

**Tests**
6. `tests/app.test.js`: turn the `it.todo(...)` lines into real tests

**DevOps (written entirely by you, then reviewed)**
7. `Dockerfile` (and a `.dockerignore`)
8. `docker-compose.yml` with the app + a Postgres container
9. `.github/workflows/ci.yml`: install, lint, test, build the image
10. Deploy to EC2 + RDS, then automate the deploy in Actions
11. Logging and monitoring (structured logs, CloudWatch, alarms)

Suggested order: 1 → 2 → 3 → 4 → 5 → 6, then the DevOps items in order.

## Running it locally

You need Node 20+ and Docker.

```bash
npm install
cp .env.example .env

# Temporary Postgres until your docker-compose.yml replaces this:
docker run -d --name jobtracker-db -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=jobtracker postgres:16

npm run db:init     # creates the table
npm run dev         # http://localhost:3000, restarts on file changes
```

Other commands:

```bash
npm test            # Jest (database is mocked, no Postgres needed)
npm run lint        # ESLint
npm start           # production start (no file watching, no .env loading)
```

Note: `npm start` doesn't read `.env`. In Docker and on AWS, environment
variables come from the container/host, which is the normal way to do it.

## API

| Method | Path                          | Body                                   | Returns            |
|--------|-------------------------------|----------------------------------------|--------------------|
| GET    | `/health`                     |                                        | `{ status: "ok" }` |
| GET    | `/api/applications?status=…`  |                                        | array              |
| POST   | `/api/applications`           | `company`, `role`, optional `status`, `applied_on`, `link`, `notes` | 201 + row |
| PATCH  | `/api/applications/:id`       | `{ status }`                           | updated row        |
| DELETE | `/api/applications/:id`       |                                        | 204                |
| GET    | `/api/stats`                  |                                        | `{ total, applied, interview, offer, rejected }` |

Statuses: `applied`, `interview`, `offer`, `rejected`.

## Configuration

| Variable      | Local default | On RDS                                   |
|---------------|---------------|------------------------------------------|
| `PORT`        | 3000          | 3000                                     |
| `DB_HOST`     | localhost     | the RDS endpoint                         |
| `DB_PORT`     | 5432          | 5432                                     |
| `DB_USER`     | postgres      | your RDS master user                     |
| `DB_PASSWORD` | postgres      | from Secrets Manager or the host env     |
| `DB_NAME`     | jobtracker    | jobtracker                               |
| `DB_SSL`      | false         | true                                     |
