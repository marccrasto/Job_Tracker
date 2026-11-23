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

**DevOps (written entirely by you, then reviewed)**
1. `.github/workflows/ci.yml`: install, lint, test, build the image
2. Deploy to EC2 + RDS, then automate the deploy in Actions
3. Logging and monitoring (structured logs, CloudWatch, alarms)

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
