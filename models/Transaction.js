const mongoose = require('mongoose');

const bookItemSchema = new mongoose.Schema({
  bookId:  { type: String, required: true },
  rfidTagID: { type: String, required: true },
  title:   { type: String, default: 'Unknown Title' },
  transactionType: { type: String, enum: ['Issue', 'Return'], required: true },
}, { _id: false });

const transactionSchema = new mongoose.Schema({
  studentId:   { type: String, required: true, index: true },
  books:       [bookItemSchema],
  issuedAt:    { type: Date, default: Date.now },
  dueDate:     { type: Date },               // issuedAt + 30 days
  returnedAt:  { type: Date, default: null },
  status:      { type: String, enum: ['Active', 'Returned', 'Overdue'], default: 'Active' },
  fineAmount:  { type: Number, default: 0 }, // ₹1 per extra overdue day
}, { timestamps: true });

// Auto-set dueDate before save
transactionSchema.pre('save', function (next) {
  if (!this.dueDate) {
    const due = new Date(this.issuedAt);
    due.setDate(due.getDate() + 30);
    this.dueDate = due;
  }
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);
