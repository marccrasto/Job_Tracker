// API tests with Jest + Supertest.
//
// Supertest sends real HTTP requests to the Express app without starting a
// server. The database module is MOCKED, so these tests run anywhere
// (your laptop, GitHub Actions) without a Postgres instance.

jest.mock('../src/db', () => ({
  query: jest.fn(),
  pool: { end: jest.fn() },
}));

const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db');

beforeEach(() => {
  db.query.mockReset();
});

describe('GET /health', () => {
  it('returns ok without touching the database', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
    expect(db.query).not.toHaveBeenCalled();
  });
});

describe('GET /api/applications', () => {
  it('returns the rows from the database', async () => {
    const rows = [{ id: 1, company: 'Shopify', role: 'Junior Developer', status: 'applied' }];
    db.query.mockResolvedValue({ rows });

    const res = await request(app).get('/api/applications');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(rows);
  });

  it('passes the status filter as a query parameter, not in the SQL string', async () => {
    db.query.mockResolvedValue({ rows: [] });

    await request(app).get('/api/applications?status=offer');

    const [sql, params] = db.query.mock.calls[0];
    expect(sql).toContain('WHERE status = $1');
    expect(params).toEqual(['offer']);
  });

  it('rejects an unknown status', async () => {
    const res = await request(app).get('/api/applications?status=ghosted');
    expect(res.status).toBe(400);
  });
});

describe('POST /api/applications', () => {
  it('rejects a missing company', async () => {
    const res = await request(app).post('/api/applications').send({ role: 'Developer' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/company/);
    expect(db.query).not.toHaveBeenCalled();
  });

  it('creates an application and returns 201', async () => {
    const created = { id: 5, company: 'RBC', role: 'Developer', status: 'applied' };
    db.query.mockResolvedValue({ rows: [created] });

    const res = await request(app)
      .post('/api/applications')
      .send({ company: 'RBC', role: 'Developer' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(created);
  });
});

describe('DELETE /api/applications/:id', () => {
  it('returns 404 when the id does not exist', async () => {
    db.query.mockResolvedValue({ rows: [] });
    const res = await request(app).delete('/api/applications/999');
    expect(res.status).toBe(404);
  });
});

// -----------------------------------------------------------------------------
// YOUR TESTS GO HERE
//
// Once your PATCH and stats routes work, turn these into real tests by
// replacing `it.todo(...)` with `it('...', async () => { ... })`.
// Copy the patterns above: mock what db.query should return with
// db.query.mockResolvedValue({ rows: [...] }), call the route, check the result.
// -----------------------------------------------------------------------------
describe('PATCH /api/applications/:id', () => {
  it('updates the status and returns the updated row', async () => {
    const returned = {"id":1,"company":"Shopify","role":"Junior Developer","status":"interview","applied_on":"2026-11-16","link":null,"notes":null,"created_at":"2026-11-16T23:26:11.148Z","updated_at":"2026-11-18T20:45:17.305Z"}
    db.query.mockResolvedValue({ rows: [returned] });
    const res = await request(app)
    .patch('/api/applications/1')
    .send({ status: "interview" });

    expect(res.status).toBe(200)
    expect(res.body).toEqual(returned);
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE'), ['interview', '1']);
  });

  it('returns 400 for an invalid status', async () => {
    const res = await request(app)
    .patch('/api/applications/1')
    .send({ status: "ghosted" });

    expect(res.status).toBe(400);
    // .toMatch(/status/) checks that the string contains “status” somewhere. The /status/ with slashes is a regular expression (regex), a pattern for searching text. This one just means “the word status, anywhere in the string”.
    expect(res.body.error).toMatch(/status/);
    // Ensure database wasn't called
    expect(db.query).not.toHaveBeenCalled();
  });

  it('returns 404 when the id does not exist', async () => {
    db.query.mockResolvedValue({ rows: [] });
    const res = await request(app)
    .patch('/api/applications/1500')
    .send({ status: 'applied' });

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/);
  });
});

describe('GET /api/stats', () => {
  it('returns a count for every status, including zeros, plus a total', async () => {
    const returned = [{status: 'applied', count: 1}];
    db.query.mockResolvedValue({rows: returned});
    const res = await request(app)
    .get('/api/stats/');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({"applied":1,"interview":0,"offer":0,"rejected":0,"total":1});
  });
});
