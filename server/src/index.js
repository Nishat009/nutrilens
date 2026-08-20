const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    code: 200,
    message: 'NutriLens API service is healthy',
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'NutriLens API',
    uptime: process.uptime(),
  });
});

// Mount Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/meals', require('./routes/meal.routes'));
app.use('/api/foods', require('./routes/food.routes'));
app.use('/api/scans', require('./routes/scan.routes'));
app.use('/api/progress', require('./routes/progress.routes'));

// 404 handler
app.use((req, res) => {
  res.status(422).json({
    success: false,
    code: 422,
    errors: [`Route ${req.originalUrl} not found`],
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  const errors = err.errors
    ? Object.values(err.errors).map((e) => e.message)
    : [err.message || 'Internal Server Error'];

  res.status(422).json({
    success: false,
    code: 422,
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
