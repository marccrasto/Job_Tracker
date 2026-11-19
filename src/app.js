// Builds the Express app WITHOUT starting the server.
// Keeping this separate from server.js lets tests import the app directly.

const path = require('path');
const express = require('express');

const { router: applicationsRouter } = require('./routes/applications');
const statsRouter = require('./routes/stats');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(express.json());

// Serves the frontend (public/index.html, app.js, styles.css)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Liveness check: "is the process up?" No database call, on purpose.
// Your EC2/ECS/load balancer health check will point here later.
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/applications', applicationsRouter);
app.use('/api/stats', statsRouter);

// Unknown /api routes get JSON, not an HTML page
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'not found' });
});

app.use(errorHandler);

module.exports = app;
