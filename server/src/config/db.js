const mongoose = require('mongoose');

// Disable Mongoose query buffering so queries fail fast with clear errors instead of hanging 10s
mongoose.set('bufferCommands', false);

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('⚠️ MONGODB_URI is not set in environment variables. Database features will run in resilient fallback mode.');
    return null;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.warn('⚠️ Server will stay online so health check (/api/health) passes. Please ensure MongoDB Atlas Network Access (0.0.0.0/0) is configured.');
    return null;
  }
};

module.exports = connectDB;

