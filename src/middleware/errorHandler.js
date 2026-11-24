// Catches any error thrown in a route (Express 5 forwards rejected async
// handlers here automatically) and turns it into a JSON response.

const logger = require('../logger');

// eslint-disable-next-line no-unused-vars -- Express needs all 4 args to treat this as an error handler
function errorHandler(err, req, res, next) {
  // 22P02 = Postgres "invalid text representation", e.g. /api/applications/abc
  if (err.code === '22P02') {
    return res.status(400).json({ error: 'invalid id or value' });
  }

  // Malformed JSON body
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'invalid JSON body' });
  }

  // Log under the key "err": pino's built-in serializer turns it into
  // { type, message, stack }. req.log includes the requestId.
  (req.log || logger).error({ err }, 'unhandled error');
  res.status(500).json({ error: 'internal server error' });
}

module.exports = errorHandler;
