const mongoose = require('mongoose');

// Fail immediately instead of queueing queries for 10s when the database is down.
mongoose.set('bufferCommands', false);

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.warn('⚠️ MONGODB_URI is not set in environment variables. Copy server/.env.example to server/.env and set it (see HowToSetup.md). API requests return 503 until then.');
      return null;
    }
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Warning: ${error.message}`);
    if (error.message && (error.message.includes('SSL') || error.message.includes('ServerSelection') || error.message.includes('tlsv1'))) {
      console.warn('💡 TIP: Check MongoDB Atlas -> Network Access and ensure your IP is whitelisted (or Allow 0.0.0.0/0).');
    }
    console.warn('⚠️ Server stays online for /api/health, but every other API route returns 503 until MongoDB is reachable. See HowToSetup.md.');
    return null;
  }
};

module.exports = connectDB;

