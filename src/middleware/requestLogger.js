// Runs on every request: gives it an ID, attaches a logger that includes that ID,
// and writes ONE log line when the response is sent (method, path, status, duration).
// Registered in src/app.js BEFORE the routes, so it sees every request.

const { randomUUID } = require('crypto');
const logger = require('../logger');

function requestLogger(req, res, next) {
  // Reuse an incoming request ID if a caller sent one, otherwise create one.
  const requestId = req.get('x-request-id') || randomUUID();
  req.id = requestId;

  // Send it back, so a user reporting a problem can quote it and you can find
  // their exact request in CloudWatch.
  res.set('X-Request-Id', requestId);

  // A child logger adds requestId to every line it writes. Routes and the error
  // handler use req.log, so their lines carry the ID automatically.
  req.log = logger.child({ requestId });

  const start = process.hrtime.bigint();

  // 'finish' fires once the response has been sent, so the status code is final.
  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

    req.log[level](
      {
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: Math.round(durationMs * 10) / 10,
      },
      'request completed',
    );
  });

  next();
}

module.exports = requestLogger;