/**
 * Calculates the fine for a transaction.
 * ₹1 per day overdue after the 30-day allowance.
 */
function calculateFine(dueDate, returnedAt) {
  const now = returnedAt ? new Date(returnedAt) : new Date();
  const due = new Date(dueDate);
  const msPerDay = 1000 * 60 * 60 * 24;
  const overdueDays = Math.max(0, Math.floor((now - due) / msPerDay));
  return overdueDays; // ₹1 × overdueDays
}

/**
 * Updates status and fine on a transaction object (not saved — caller saves).
 */
function refreshTransactionStatus(txn) {
  const now = new Date();
  const fineAmount = calculateFine(txn.dueDate, txn.returnedAt);

  if (txn.returnedAt) {
    txn.status = 'Returned';
    txn.fineAmount = fineAmount; 
  } else if (now > new Date(txn.dueDate)) {
    txn.status = 'Overdue';
    txn.fineAmount = fineAmount;
  } else {
    txn.status = 'Active';
    txn.fineAmount = 0;
  }
  return txn;
}

module.exports = { calculateFine, refreshTransactionStatus };
