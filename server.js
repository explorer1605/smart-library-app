require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const transactionRoutes = require('./routes/transactions');
const analyticsRoutes = require('./routes/analytics');
const sseRoutes = require('./routes/sse');
const { startCronJobs } = require('./jobs/cronJobs');

const app = express();
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/smart-library';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// CORS — allow the Vite frontend
app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json());

// Routes
app.use('/api/transactions', transactionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/events', sseRoutes);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date() }));

// Connect to MongoDB and start
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅  MongoDB connected:', MONGO_URI);
    startCronJobs();
    app.listen(PORT, () => {
      console.log(`🚀  NFC Backend running at http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌  MongoDB connection failed:', err.message);
    process.exit(1);
  });
