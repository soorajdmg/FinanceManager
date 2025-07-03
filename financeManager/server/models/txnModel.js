const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  type: {
    type: String,
    required: true,
    enum: ['debit', 'credit'],
    lowercase: true
  },
  category: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  description: {
    type: String,
    trim: true,
    maxlength: 200
  },
  transactionDate: {
    type: Date,
    required: true
  },
  valueDate: {
    type: Date,
    required: true
  },
  source: {
    type: String,
    required: true,
    enum: ['bank_statement', 'manual'],
    lowercase: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false, // Using custom createdAt
  collection: 'transactions'
});

// Indexes for better performance
transactionSchema.index({ userId: 1 });
transactionSchema.index({ userId: 1, transactionDate: -1 });
transactionSchema.index({ userId: 1, type: 1 });
transactionSchema.index({ userId: 1, category: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;