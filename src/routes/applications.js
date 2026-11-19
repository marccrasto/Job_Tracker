const express = require('express');
const db = require('../db');

const router = express.Router();

const STATUSES = ['applied', 'interview', 'offer', 'rejected'];

// Turns a request body into a clean application object, or returns an error message.
function validateApplication(body) {
  const company = typeof body.company === 'string' ? body.company.trim() : '';
  const role = typeof body.role === 'string' ? body.role.trim() : '';
  const status = body.status || 'applied';

  if (!company) return { error: 'company is required' };
  if (!role) return { error: 'role is required' };
  if (!STATUSES.includes(status)) {
    return { error: `status must be one of: ${STATUSES.join(', ')}` };
  }

  return {
    value: {
      company,
      role,
      status,
      applied_on: body.applied_on || null,
      link: body.link || null,
      notes: body.notes || null,
    },
  };
}

// GET /api/applications            -> all applications, newest first
// GET /api/applications?status=offer -> only that status
router.get('/', async (req, res) => {
  const { status } = req.query;

  if (status && !STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${STATUSES.join(', ')}` });
  }

  const result = status
    ? await db.query(
        'SELECT * FROM applications WHERE status = $1 ORDER BY applied_on DESC, id DESC',
        [status],
      )
    : await db.query('SELECT * FROM applications ORDER BY applied_on DESC, id DESC');

  res.json(result.rows);
});

// POST /api/applications -> create one
router.post('/', async (req, res) => {
  const { value, error } = validateApplication(req.body || {});
  if (error) return res.status(400).json({ error });

  const result = await db.query(
    `INSERT INTO applications (company, role, status, applied_on, link, notes)
     VALUES ($1, $2, $3, COALESCE($4::date, CURRENT_DATE), $5, $6)
     RETURNING *`,
    [value.company, value.role, value.status, value.applied_on, value.link, value.notes],
  );

  res.status(201).json(result.rows[0]);
});

// PATCH /api/applications/:id -> change an application's status
router.patch('/:id', async (req, res) => {
  // ---------------------------------------------------------------------------
  // YOUR CODE GOES HERE
  //
  // Goal: update ONLY the status of one application.
  //   Request:  PATCH /api/applications/7   body: { "status": "interview" }
  //   Response: 200 + the updated row as JSON
  //
  // Steps:
  //   1. Read the id from the URL and the new status from the body.
  //      (Look at how req.query is used in GET above; the URL param equivalent
  //       is req.params.)
  //   2. If the status isn't in STATUSES, respond 400 with { error: '...' }.
  //      (The GET route does the same check; you can reuse that pattern.)
  //   3. Run an UPDATE that sets status AND updated_at = NOW(), for that id.
  //      Use $1 / $2 placeholders, never string concatenation.
  //      Add `RETURNING *` so Postgres hands back the updated row.
  //   4. If no row came back (result.rows.length === 0), the id doesn't exist:
  //      respond 404 with { error: 'application not found' }.
  //   5. Otherwise respond with the row.
  //
  // Test it with curl once the app is running:
  //   curl -X PATCH localhost:3000/api/applications/1 \
  //        -H "Content-Type: application/json" -d '{"status":"interview"}'
  // ---------------------------------------------------------------------------
  const { id } = req.params;
  const { status } = req.body || {};

  if (!STATUSES.includes(status)) {
    return res.status(400).json({
      error: `status must be one of: ${STATUSES.join(', ')}`
    });
  }

  const result = await db.query(
    `UPDATE applications 
     SET status = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
     [status, id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      error: 'application not found'
    });
  }
  
  res.status(200).json(result.rows[0]);
});

// DELETE /api/applications/:id -> remove one
router.delete('/:id', async (req, res) => {
  const result = await db.query('DELETE FROM applications WHERE id = $1 RETURNING id', [
    req.params.id,
  ]);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'application not found' });
  }

  res.status(204).end();
});

module.exports = { router, STATUSES, validateApplication };
