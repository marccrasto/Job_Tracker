const app = require('./app');
const { pool } = require('./db');
const logger = require('./logger');

const PORT = Number(process.env.PORT) || 3000;

const server = app.listen(PORT, () => {
  logger.info({ port: PORT }, 'job tracker listening');
});

// Docker sends SIGTERM when a container stops (docker stop, a new deploy).
// Finish in-flight requests and close DB connections instead of dying mid-request.
function shutdown(signal) {
  logger.info({ signal }, 'shutting down');
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
