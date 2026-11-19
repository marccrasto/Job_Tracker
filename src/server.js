const app = require('./app');
const { pool } = require('./db');

const PORT = Number(process.env.PORT) || 3000;

const server = app.listen(PORT, () => {
  console.log(`Job tracker listening on http://localhost:${PORT}`);
});

// Docker sends SIGTERM when a container stops (docker stop, a new deploy).
// Finish in-flight requests and close DB connections instead of dying mid-request.
function shutdown(signal) {
  console.log(`${signal} received, shutting down`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
