const mongoose = require('mongoose');

let mongod = null;

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/bodypilot';
  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
    console.log(`✅ Connected to MongoDB: ${conn.connection.host}`);
  } catch (error) {
    console.log(`⚠️ Local MongoDB (${uri}) not reachable: ${error.message}`);
    console.log('🔄 Starting In-Memory MongoDB engine for seamless standalone execution...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongod = await MongoMemoryServer.create();
      const memUri = mongod.getUri();
      const conn = await mongoose.connect(memUri);
      console.log(`✅ In-Memory MongoDB Connected at: ${memUri}`);
    } catch (memError) {
      console.error(`❌ In-Memory MongoDB failed: ${memError.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
