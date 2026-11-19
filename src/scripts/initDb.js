// Creates the tables by running db/schema.sql against whatever database the
// environment variables point to (local Docker Postgres or RDS).
//
//   npm run db:init

const fs = require('fs');
const path = require('path');
const { pool } = require('../db');

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, '..', '..', 'db', 'schema.sql'), 'utf8');
  await pool.query(sql);
  console.log(`Schema applied to ${process.env.DB_HOST || 'localhost'}`);
}

main()
  .catch((err) => {
    console.error('Failed to apply schema:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
