const pino = require('pino');

const logger = pino({
  // Minimum level written. Silent during tests (Jest sets NODE_ENV=test) so test
  // output isn't flooded with request logs.
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'test' ? 'silent' : 'info'),

  // Fields added to every line: which app, which environment.
  base: { service: 'job-tracker', env: process.env.APP_ENV || 'local' },

  // Human-readable timestamps ("2026-11-23T20:00:00.000Z") instead of epoch milliseconds.
  timestamp: pino.stdTimeFunctions.isoTime,

  // Write the level as a word ("error") instead of a number (50), so CloudWatch
  // metric filters can match { $.level = "error" }.
  formatters: {
    level: (label) => ({ level: label }),
  },
});

module.exports = logger;