// Load environment variables before any module reads them
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { ensureDemoAccounts } = require('./services/demo-accounts');
const { apiLimiter } = require('./middleware/rate-limit');
const { corsOrigins, BODY_LIMIT, DB_UNAVAILABLE_MESSAGE } = require('./config/app');

// Connect to MongoDB, then make sure the one-click demo accounts exist
connectDB().then((conn) => {
  if (!conn) return;
  ensureDemoAccounts().catch((error) => console.warn(`⚠️ Demo accounts not prepared: ${error.message}`));
});

const app = express();

// Enable Trust Proxy for Render / cloud reverse proxy
app.enable('trust proxy');

// Query values are always plain strings (last value wins). The default `qs` parser turns
// `?category[$ne]=x` into an object that MongoDB reads as an operator, and `?q[]=a` into an array.
app.set('query parser', (str) => Object.fromEntries(new URLSearchParams(str)));

// Middleware
app.use(helmet());
app.use('/api', apiLimiter);
app.use(
  cors({
    origin: corsOrigins(),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with'],
  })
);
app.use(express.json({ limit: BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: BODY_LIMIT }));

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

// Fail fast with a clear setup error when MongoDB is not connected (instead of a hanging request / 500)
app.use('/api', (req, res, next) => {
  if (req.path === '/health' || mongoose.connection.readyState === 1) return next();
  res.status(503).json({
    success: false,
    code: 503,
    errors: [DB_UNAVAILABLE_MESSAGE],
  });
});

// Mount Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/meals', require('./routes/meal.routes'));
app.use('/api/foods', require('./routes/food.routes'));
app.use('/api/vegetables', require('./routes/vegetable.routes'));
app.use('/api/scans', require('./routes/scan.routes'));
app.use('/api/progress', require('./routes/progress.routes'));
app.use('/api/diets', require('./routes/diet.routes'));
app.use('/api/planner', require('./routes/planner.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    code: 404,
    errors: [`Route ${req.originalUrl} not found`],
  });
});

// Global error handler. Status comes from the error: 4xx from body-parser (bad JSON 400, too large 413),
// 422 for Mongoose validation/cast errors, otherwise 500 with a generic message (details stay in the log).
const errorStatus = (err) => {
  const status = Number(err.status || err.statusCode);
  if (status >= 400 && status < 600) return status;
  if (err.name === 'ValidationError' || err.name === 'CastError') return 422;
  return 500;
};

app.use((err, req, res, next) => {
  const status = errorStatus(err);
  if (status >= 500) console.error('Server error:', err);
  let errors;
  if (status >= 500) errors = ['Internal Server Error'];
  else if (err.name === 'ValidationError' && err.errors) errors = Object.values(err.errors).map((e) => e.message);
  else errors = [err.message || 'Request failed'];

  res.status(status).json({
    success: false,
    code: status,
    errors,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 NutriLens API Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`📍 Health Check: http://localhost:${PORT}/api/health`);
});

module.exports = app;

