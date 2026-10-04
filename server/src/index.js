// Load environment variables before anything reads process.env
require('dotenv').config();

const connectDB = require('./config/db');
const app = require('./app');

// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 NutriLens API Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`📍 Health Check: http://localhost:${PORT}/api/health`);
});
