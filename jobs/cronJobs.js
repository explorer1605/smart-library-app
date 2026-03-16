const cron = require('node-cron');
const Transaction = require('../models/Transaction');
const Student = require('../models/Student');
const { calculateFine } = require('../utils/fineCalculator');
const emailService = require('../utils/emailService');

function startCronJobs() {
  console.log('⏰ Initializing Background Cron Jobs...');

  // Run every morning at 8:00 AM server time
  // The '0 8 * * *' syntax means: Minute 0, Hour 8, Every day, Every month, Every weekday
  cron.schedule('0 8 * * *', async () => {
    console.log('[CRON] Running daily notification scan...');
    try {
      const activeTxns = await Transaction.find({ returnedAt: null });
      const now = new Date();
      
      for (const txn of activeTxns) {
        // Fetch student to get email address
        const student = await Student.findOne({ studentId: txn.studentId });
        if (!student || !student.email) continue; // Skip if no email on file

        const bookTitle = txn.books[0]?.title || 'Unknown Book';
        const dueDate = new Date(txn.dueDate);
        
        // --- 1. Due Today Reminder ---
        // Check if the due date is today
        if (
          dueDate.getFullYear() === now.getFullYear() &&
          dueDate.getMonth() === now.getMonth() &&
          dueDate.getDate() === now.getDate()
        ) {
          await emailService.sendDueDateReminder(student.email, student.name, bookTitle, dueDate);
        }

        // --- 2. Overdue Warnings (Every 3 Days) ---
        // Check if book is overdue
        if (now > dueDate) {
          const fineAmount = calculateFine(txn.dueDate, null);
          const msPerDay = 1000 * 60 * 60 * 24;
          const overdueDays = Math.max(0, Math.floor((now - dueDate) / msPerDay));

          // Send warning every 3rd day
          if (overdueDays > 0 && overdueDays % 3 === 0) {
            await emailService.sendOverdueWarning(student.email, student.name, bookTitle, fineAmount);
          }
        }
      }
      console.log('[CRON] Daily scan completed.');
    } catch (err) {
      console.error('[CRON] Error during scan:', err);
    }
  });

  console.log('⏰ Daily reminder job scheduled (runs at 08:00 AM).');
}

module.exports = { startCronJobs };
