// Database connection pool.
//
// All connection details come from environment variables, so the SAME code
// talks to Postgres in Docker on your laptop and to Amazon RDS in production.
// Only the values in .env (or the container's environment) change.

const { Pool, types } = require('pg');

// By default pg turns a DATE column into a JS Date at local midnight, which can
// shift it by a day depending on the server's timezone. Keep it as 'YYYY-MM-DD'.
// (1082 is Postgres's internal type id for DATE.)
types.setTypeParser(1082, (value) => value);

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'jobtracker',
  // RDS supports (and can require) encrypted connections. Set DB_SSL=true there.
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 10,
});

// Small helper so routes can call db.query(sql, params).
// ALWAYS pass user input through `params` ($1, $2, ...), never by building
// the SQL string yourself. That's what prevents SQL injection.
function query(text, params) {
  return pool.query(text, params);
}

module.exports = { pool, query };
