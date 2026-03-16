const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Student = require('../models/Student');
const { refreshTransactionStatus } = require('../utils/fineCalculator');
const { broadcast } = require('../utils/sseManager');
const emailService = require('../utils/emailService');

// POST /api/transactions — Receive scan approval from mobile app
router.post('/', async (req, res) => {
  try {
    const { studentId, books, timestamp } = req.body;
    if (!studentId || !books || !books.length) {
      return res.status(400).json({ success: false, message: 'studentId and books are required.' });
    }

    // Create one transaction record per book
    const created = [];
    for (const book of books) {
      const txn = new Transaction({
        studentId,
        books: [book],
        issuedAt: timestamp ? new Date(timestamp) : new Date(),
      });
      refreshTransactionStatus(txn);
      await txn.save();
      created.push(txn);
    }

    // Attempt to send email to student (fire & forget)
    // Send email individually for each issued book
    Student.findOne({ studentId }).then(student => {
      if (student && student.email) {
        for (const txn of created) {
          if (txn.books[0].transactionType === 'Issue') {
             emailService.sendIssueConfirmation(
               student.email, 
               student.name, 
               txn.books[0].title, 
               txn.dueDate
             ).catch(e => console.error('Email failed:', e));
          }
        }
      }
    }).catch(e => console.error('Student lookup failed:', e));

    // Broadcast to dashboard
    broadcast('new_transaction', { studentId, count: created.length });

    res.status(201).json({ success: true, count: created.length, data: created });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/transactions — List all, optional ?studentId= filter
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.studentId) filter.studentId = req.query.studentId;

    const txns = await Transaction.find(filter).sort({ issuedAt: -1 });

    // Refresh status & fines dynamically before returning
    const refreshed = txns.map(t => {
      const obj = t.toObject();
      return refreshTransactionStatus(obj);
    });

    res.json({ success: true, count: refreshed.length, data: refreshed });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/transactions/:id/return — Mark a transaction as returned
router.patch('/:id/return', async (req, res) => {
  try {
    const txn = await Transaction.findById(req.params.id);
    if (!txn) return res.status(404).json({ success: false, message: 'Transaction not found.' });
    if (txn.returnedAt) return res.status(400).json({ success: false, message: 'Already returned.' });

    txn.returnedAt = new Date();
    refreshTransactionStatus(txn);
    await txn.save();

    broadcast('transaction_returned', { id: txn._id, studentId: txn.studentId });

    res.json({ success: true, data: txn });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
