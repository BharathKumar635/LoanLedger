/**
 * LoanLedger Backend Server
 * Express REST API with MongoDB Atlas Integration and node-cron monthly scheduler
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const borrowingRoutes = require('./routes/borrowingRoutes');
const errorHandler = require('./middleware/errorHandler');
const { initScheduler } = require('./utils/scheduler');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable Cross-Origin Resource Sharing (CORS) for independent frontend access
app.use(cors());

// Middleware for parsing JSON with ample capacity for bond paper images
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'LoanLedger Backend API',
    database: process.env.MONGODB_URI ? 'Configured' : 'Missing MONGODB_URI'
  });
});

// REST API Routes
app.use('/api/borrowings', borrowingRoutes);

// Global Error Handler Middleware
app.use(errorHandler);

// Optional static file serving if frontend is built into frontend directory
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// Fallback for Single-Page Application routing
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, error: 'API endpoint not found' });
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Start Server
async function startServer() {
  try {
    // 1. Connect to MongoDB Atlas
    await connectDB();

    // 2. Start node-cron monthly scheduler
    initScheduler();

    // 3. Listen on configured port
    const server = app.listen(PORT, () => {
      console.log(`================================================================`);
      console.log(` LoanLedger Backend API Server running on port ${PORT}`);
      console.log(` REST API available at: http://localhost:${PORT}/api/borrowings`);
      console.log(`================================================================`);
    });

    return server;
  } catch (error) {
    console.error('Fatal Server Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
