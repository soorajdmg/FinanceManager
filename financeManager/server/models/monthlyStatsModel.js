const mongoose = require('mongoose');

// Monthly Stats - One document per user per month
const monthlyStatsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    year: {
        type: Number,
        required: true
    },
    month: {
        type: Number,
        required: true,
        min: 1,
        max: 12
    },

    // Income breakdown
    totalIncome: {
        type: Number,
        default: 0
    },
    incomeByCategory: [{
        category: {
            type: String,
            required: true
        },
        amount: {
            type: Number,
            required: true,
            min: 0
        }
    }],

    // Expense breakdown
    totalExpenses: {
        type: Number,
        default: 0
    },
    expensesByCategory: [{
        category: {
            type: String,
            required: true
        },
        amount: {
            type: Number,
            required: true,
            min: 0
        }
    }],

    // Calculated fields
    netIncome: {
        type: Number,
        default: 0
    },
    savingsRate: {
        type: Number,
        default: 0,
        min: -500,  // Allow negative savings rates (up to -500%)
        max: 100
    },

    // Balance at end of month
    endingBalance: {
        type: Number,
        default: 0
    },

    // Transaction counts
    totalTransactions: {
        type: Number,
        default: 0
    },
    incomeTransactions: {
        type: Number,
        default: 0
    },
    expenseTransactions: {
        type: Number,
        default: 0
    },

    // Period info
    periodStart: {
        type: Date,
        required: true
    },
    periodEnd: {
        type: Date,
        required: true
    },

    // When this was calculated
    calculatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'monthly_stats'
});

// Indexes for better performance
monthlyStatsSchema.index({ userId: 1, year: 1, month: 1 }, { unique: true });
monthlyStatsSchema.index({ userId: 1, year: -1, month: -1 });
monthlyStatsSchema.index({ calculatedAt: -1 });

// Utility function to safely calculate savings rate
const calculateSavingsRate = (income, expenses) => {
    if (income <= 0) return 0;
    const rate = ((income - expenses) / income) * 100;
    // Allow negative savings rates but cap at reasonable bounds
    return Math.max(-500, Math.min(100, rate));
};

// Static method to calculate monthly stats
monthlyStatsSchema.statics.calculateMonthlyStats = async function (userId, year, month) {
    const Transaction = mongoose.model('Transaction');

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const stats = await Transaction.aggregate([
        {
            $match: {
                userId: new mongoose.Types.ObjectId(userId),
                transactionDate: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $group: {
                _id: null,
                totalIncome: {
                    $sum: { $cond: [{ $eq: ['$type', 'credit'] }, '$amount', 0] }
                },
                totalExpenses: {
                    $sum: { $cond: [{ $eq: ['$type', 'debit'] }, '$amount', 0] }
                },
                incomeTransactions: {
                    $sum: { $cond: [{ $eq: ['$type', 'credit'] }, 1, 0] }
                },
                expenseTransactions: {
                    $sum: { $cond: [{ $eq: ['$type', 'debit'] }, 1, 0] }
                },
                transactions: { $push: '$$ROOT' },
                totalTransactions: { $sum: 1 }
            }
        }
    ]);

    if (!stats.length) {
        // Return empty stats if no transactions
        const emptyStats = {
            userId: new mongoose.Types.ObjectId(userId),
            year,
            month,
            totalIncome: 0,
            totalExpenses: 0,
            netIncome: 0,
            savingsRate: 0,
            endingBalance: 0,
            totalTransactions: 0,
            incomeTransactions: 0,
            expenseTransactions: 0,
            incomeByCategory: [],
            expensesByCategory: [],
            periodStart: startDate,
            periodEnd: endDate,
            calculatedAt: new Date()
        };

        return await this.findOneAndUpdate(
            { userId: new mongoose.Types.ObjectId(userId), year, month },
            emptyStats,
            { upsert: true, new: true, runValidators: true }
        );
    }

    const { totalIncome, totalExpenses, transactions, totalTransactions, incomeTransactions, expenseTransactions } = stats[0];

    // Get ending balance
    const lastTransaction = await Transaction.findOne(
        { userId: new mongoose.Types.ObjectId(userId), transactionDate: { $lte: endDate } },
        { balance: 1 },
        { sort: { transactionDate: -1 } }
    );

    // Calculate category breakdowns
    const incomeByCategory = {};
    const expensesByCategory = {};

    transactions.forEach(tx => {
        if (tx.type === 'credit') {
            incomeByCategory[tx.category] = (incomeByCategory[tx.category] || 0) + tx.amount;
        } else {
            expensesByCategory[tx.category] = (expensesByCategory[tx.category] || 0) + tx.amount;
        }
    });

    // Calculate savings rate safely
    const savingsRate = calculateSavingsRate(totalIncome, totalExpenses);

    const monthlyStatsData = {
        userId: new mongoose.Types.ObjectId(userId),
        year,
        month,
        totalIncome,
        totalExpenses,
        netIncome: totalIncome - totalExpenses,
        savingsRate,
        endingBalance: lastTransaction?.balance || 0,
        totalTransactions,
        incomeTransactions,
        expenseTransactions,
        incomeByCategory: Object.entries(incomeByCategory).map(([category, amount]) => ({ category, amount })),
        expensesByCategory: Object.entries(expensesByCategory).map(([category, amount]) => ({ category, amount })),
        periodStart: startDate,
        periodEnd: endDate,
        calculatedAt: new Date()
    };

    return await this.findOneAndUpdate(
        { userId: new mongoose.Types.ObjectId(userId), year, month },
        monthlyStatsData,
        { upsert: true, new: true, runValidators: true }
    );
};

// Method to get user's monthly history
monthlyStatsSchema.statics.getUserMonthlyHistory = async function (userId, months = 12) {
    return await this.find(
        { userId: new mongoose.Types.ObjectId(userId) },
        null,
        { sort: { year: -1, month: -1 }, limit: months }
    );
};

// Method to get specific month stats
monthlyStatsSchema.statics.getMonthStats = async function (userId, year, month) {
    let stats = await this.findOne({ userId: new mongoose.Types.ObjectId(userId), year, month });

    if (!stats) {
        // Calculate if doesn't exist
        stats = await this.calculateMonthlyStats(userId, year, month);
    }

    return stats;
};

// Method to get current month stats
monthlyStatsSchema.statics.getCurrentMonthStats = async function (userId) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    return await this.getMonthStats(userId, year, month);
};

const MonthlyStats = mongoose.model('MonthlyStats', monthlyStatsSchema);

module.exports = MonthlyStats;