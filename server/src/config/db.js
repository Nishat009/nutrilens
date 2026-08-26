const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.warn('⚠️ MONGODB_URI is not set in environment variables. Database features will be in fallback mode until configured in Render dashboard.');
      return null;
    }
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Warning: ${error.message}`);
    if (error.message && (error.message.includes('SSL') || error.message.includes('ServerSelection') || error.message.includes('tlsv1'))) {
      console.warn('💡 TIP: Check MongoDB Atlas -> Network Access and ensure your IP is whitelisted (or Allow 0.0.0.0/0).');
    }
    console.warn('⚠️ Server will stay online so health check (/api/health) passes while database reconnects.');
    return null;
  }
};

module.exports = connectDB;

