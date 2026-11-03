const mongoose = require('mongoose');
const dns = require('dns');
require('dotenv').config();

// Configure reliable DNS servers to resolve MongoDB Atlas SRV records
// Prevents 'querySrv ECONNREFUSED' on Windows routers & ISP DNS that drop SRV queries
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (dnsErr) {
  console.warn('[DNS Warning] Could not override default DNS servers:', dnsErr.message);
}

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri === 'YOUR_MONGODB_ATLAS_CONNECTION_STRING') {
    console.warn('\n================================================================');
    console.warn(' [MongoDB Atlas Setup Notice]');
    console.warn(' MONGODB_URI in backend/.env is currently not set or has placeholder.');
    console.warn(' Please add your actual MongoDB Atlas connection string in backend/.env');
    console.warn('================================================================\n');
    return null;
  }

  try {
    const conn = await mongoose.connect(uri, {
      dbName: 'LoanLedger',
      serverSelectionTimeoutMS: 10000
    });

    console.log(`[MongoDB Atlas] Connected successfully! Host: ${conn.connection.host}, Database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB Atlas] Connection Error: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
