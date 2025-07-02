const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    category: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    month: {
        type: String,
        required: true,
        match: /^\d{4}-\d{2}$/ // Format: YYYY-MM
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: false, // Using custom createdAt
    collection: 'budgets'
});

// Indexes for better performance
budgetSchema.index({ userId: 1 });
budgetSchema.index({ userId: 1, month: 1 });
budgetSchema.index({ userId: 1, category: 1 });
budgetSchema.index({ userId: 1, month: 1, category: 1 }, { unique: true }); // Prevent duplicate budget for same user, month, category

const Budget = mongoose.model('Budget', budgetSchema);

module.exports = Budget;