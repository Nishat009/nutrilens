// Express app definition. Startup (env, DB connection, listen) lives in index.js
// so tests can load the app without opening a port.
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const { errorStatus, errorMessages, sendError } = require('./utils/http');

const app = express();

// Trust exactly one reverse proxy hop (Render). Trusting all hops would let
// clients spoof X-Forwarded-For and bypass per-IP rate limits.
app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS ?? 1));

// CORS_ORIGIN: comma-separated list of allowed frontend origins; unset allows any origin.
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Middleware
app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with'],
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Root endpoint for quick verification
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'NutriLens API Server',
    status: 'online',
    healthCheck: '/api/health',
    version: '1.0.0',
  });
});

// Health check endpoint for Render / monitoring
app.get('/api/health', (req, res) => {
  const dbStateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  const dbState = dbStateMap[mongoose.connection.readyState] || 'unknown';

  res.status(200).json({
    success: true,
    code: 200,
    message: 'NutriLens API service is healthy',
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'NutriLens API',
    uptime: Math.round(process.uptime()),
    database: {
      status: dbState,
      connected: mongoose.connection.readyState === 1,
    },
  });
});

// Mount Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/meals', require('./routes/meal.routes'));
app.use('/api/foods', require('./routes/food.routes'));
app.use('/api/vegetables', require('./routes/vegetable.routes'));
app.use('/api/scans', require('./routes/scan.routes'));
app.use('/api/scan', require('./routes/scan.routes')); // Alias so both /api/scan and /api/scans work
app.use('/api/progress', require('./routes/progress.routes'));
app.use('/api/diets', require('./routes/diet.routes'));
app.use('/api/planner', require('./routes/planner.routes'));

// 404 handler
app.use((req, res) => sendError(res, 404, `Route ${req.originalUrl} not found`));

// Global Error Handler (malformed JSON -> 400, oversized body -> 413, etc.)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = errorStatus(err);
  if (status === 500) console.error('Server error:', err);
  const message = err.type === 'entity.parse.failed' ? 'Malformed JSON request body' : undefined;

  res.status(status).json({
    success: false,
    code: status,
    errors: message ? [message] : errorMessages(err),
    ...(process.env.NODE_ENV === 'development' && status === 500 && { stack: err.stack }),
  });
});

module.exports = app;

