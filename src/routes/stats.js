const express = require('express');
const db = require('../db');
const { STATUSES } = require('./applications');

const router = express.Router();

// GET /api/stats -> how many applications are in each status
//
// The frontend expects exactly this shape (every status present, even if 0):
//   { "total": 12, "applied": 8, "interview": 3, "offer": 1, "rejected": 0 }
router.get('/', async (req, res) => {
  // ---------------------------------------------------------------------------
  // YOUR CODE GOES HERE
  //
  // Steps:
  //   1. Let the database do the counting with one query:
  //        SELECT status, COUNT(*) ... FROM applications GROUP BY status
  //      That returns one row per status that HAS applications, e.g.
  //        [ { status: 'applied', count: '8' }, { status: 'offer', count: '1' } ]
  //      Gotcha: pg returns COUNT(*) as a STRING, because Postgres counts can
  //      exceed JavaScript's safe integer range. Either cast it in SQL
  //      (COUNT(*)::int) or convert with Number() in JS.
  //
  //   2. Start with an object where every status is 0. STATUSES is imported
  //      above; you could build it with a loop, or with
  //      Object.fromEntries(STATUSES.map(s => [s, 0])).
  //
  //   3. Loop over result.rows and fill in the counts.
  //
  //   4. Add a `total` field (the sum of all counts) and res.json(...) it.
  //
  // Why step 2 matters: statuses with zero applications don't appear in the
  // GROUP BY result at all, and the frontend would show "undefined".
  // ---------------------------------------------------------------------------

  // Delete these two lines once you've written your code (they only stop the
  // linter complaining that db and STATUSES are unused).
  const result = await db.query(
  `SELECT status, COUNT(*)::int AS count
   FROM applications
   GROUP BY status`
  );

  const { rows } = result; // [{status: 'applied', count: 2}, {...}]

  let total = 0;
  const formatted = Object.fromEntries(STATUSES.map(s => [s, 0])) // {applied: 0, offer: 0, ...}
  for (let i = 0; i < rows.length; i++) {
    const { status, count } = rows[i];
    formatted[status] = count;
  }
  Object.values(formatted).forEach((val) => {
    total += val;
  });

  res.status(200).json({
    ...formatted,
    total
  });
});

module.exports = router;
