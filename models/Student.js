const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true },
  name:      { type: String, default: 'Unknown Student' },
  email:     { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
