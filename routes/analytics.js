const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const { refreshTransactionStatus } = require('../utils/fineCalculator');

// GET /api/analytics/overview
router.get('/overview', async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [issuedToday, totalActive, overdueCount] = await Promise.all([
      Transaction.countDocuments({ issuedAt: { $gte: startOfDay } }),
      Transaction.countDocuments({ returnedAt: null }),
      Transaction.countDocuments({ returnedAt: null, dueDate: { $lt: now } }),
    ]);

    res.json({
      success: true,
      data: {
        issuedToday,
        totalActive,
        overdueCount,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/analytics/peak-hour
router.get('/peak-hour', async (req, res) => {
  try {
    const pipeline = [
      {
        $group: {
          _id: { $hour: '$issuedAt' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ];
    const results = await Transaction.aggregate(pipeline);
    const formatted = results.map(r => ({ hour: r._id, count: r.count }));
    res.json({ success: true, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/analytics/search?studentId=…
// Returns full transaction history for a student with live status + fine
router.get('/search', async (req, res) => {
  try {
    const { studentId } = req.query;
    if (!studentId) return res.status(400).json({ success: false, message: 'studentId is required.' });

    const txns = await Transaction.find({ studentId }).sort({ issuedAt: -1 });

    const enriched = txns.map(t => {
      const obj = t.toObject();
      return refreshTransactionStatus(obj);
    });

    const totalFine = enriched.reduce((sum, t) => sum + (t.fineAmount || 0), 0);

    res.json({
      success: true,
      studentId,
      totalFine,
      count: enriched.length,
      data: enriched,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
