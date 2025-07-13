const mongoose = require('mongoose');

const statsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
        unique: true
    },
    // Current financial position
    totalBalance: {
        type: Number,
        required: true,
        default: 0
    },
    availableBalance: {
        type: Number,
        required: true,
        default: 0
    },
    // Monthly aggregations
    monthlyIncome: {
        type: Number,
        required: true,
        default: 0
    },
    monthlyExpenses: {
        type: Number,
        required: true,
        default: 0
    },
    monthlyNet: {
        type: Number,
        required: true,
        default: 0
    },
    // Savings and investments
    totalSavings: {
        type: Number,
        required: true,
        default: 0
    },
    totalInvestments: {
        type: Number,
        required: true,
        default: 0
    },
    emergencyFund: {
        type: Number,
        required: true,
        default: 0
    },
    // Goals and targets
    savingsGoal: {
        type: Number,
        required: true,
        default: 0
    },
    monthlyBudget: {
        type: Number,
        required: true,
        default: 0
    },
    budgetRemaining: {
        type: Number,
        required: true,
        default: 0
    },
    // Credit and debt information
    totalDebt: {
        type: Number,
        required: true,
        default: 0
    },
    creditLimit: {
        type: Number,
        required: true,
        default: 0
    },
    creditUsed: {
        type: Number,
        required: true,
        default: 0
    },
    creditUtilization: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
        max: 100
    },
    // Category-wise spending (top 5 categories)
    categorySpending: [{
        category: {
            type: String,
            required: true,
            trim: true
        },
        amount: {
            type: Number,
            required: true,
            min: 0
        },
        percentage: {
            type: Number,
            required: true,
            min: 0,
            max: 100
        }
    }],
    // Monthly trends
    monthlyTrends: [{
        month: {
            type: String,
            required: true
        },
        year: {
            type: Number,
            required: true
        },
        income: {
            type: Number,
            required: true,
            default: 0
        },
        expenses: {
            type: Number,
            required: true,
            default: 0
        },
        savings: {
            type: Number,
            required: true,
            default: 0
        },
        netWorth: {
            type: Number,
            required: true,
            default: 0
        }
    }],
    // Performance metrics
    savingsRate: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
        max: 100
    },
    debtToIncomeRatio: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    expenseRatio: {
        type: Number,
        required: true,
        default: 0,
        min: -500,
        max: 500
    },
    // Growth metrics
    monthlyGrowth: {
        income: {
            type: Number,
            default: 0
        },
        expenses: {
            type: Number,
            default: 0
        },
        savings: {
            type: Number,
            default: 0
        },
        netWorth: {
            type: Number,
            default: 0
        }
    },
    // Financial health score
    financialScore: {
        type: Number,
        required: true,
        default: 0,
        min: -500,
        max: 100
    },
    // Last calculation timestamp
    lastCalculated: {
        type: Date,
        required: true,
        default: Date.now
    },
    // Period for current stats
    statsPeriod: {
        startDate: {
            type: Date,
            required: true
        },
        endDate: {
            type: Date,
            required: true
        }
    }
}, {
    timestamps: true,
    collection: 'stats'
});

// Virtual for net worth calculation
statsSchema.virtual('netWorth').get(function () {
    return this.totalBalance + this.totalSavings + this.totalInvestments - this.totalDebt;
});

// Virtual for budget utilization percentage
statsSchema.virtual('budgetUtilization').get(function () {
    if (this.monthlyBudget === 0) return 0;
    return ((this.monthlyExpenses / this.monthlyBudget) * 100).toFixed(2);
});

// Virtual for savings goal progress
statsSchema.virtual('savingsProgress').get(function () {
    if (this.savingsGoal === 0) return 0;
    return ((this.totalSavings / this.savingsGoal) * 100).toFixed(2);
});

// Indexes for better performance
statsSchema.index({ userId: 1 }, { unique: true });
statsSchema.index({ lastCalculated: -1 });
statsSchema.index({ 'statsPeriod.startDate': 1, 'statsPeriod.endDate': 1 });

// Static method to calculate and update stats for a user
statsSchema.statics.calculateUserStats = async function (userId) {
    const Transaction = mongoose.model('Transaction');

    // Get current date range (current month)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Aggregate transactions for the current month
    const monthlyStats = await Transaction.aggregate([
        {
            $match: {
                userId: new mongoose.Types.ObjectId(userId),
                transactionDate: {
                    $gte: startOfMonth,
                    $lte: endOfMonth
                }
            }
        },
        {
            $group: {
                _id: null,
                totalIncome: {
                    $sum: {
                        $cond: [{ $eq: ['$type', 'credit'] }, '$amount', 0]
                    }
                },
                totalExpenses: {
                    $sum: {
                        $cond: [{ $eq: ['$type', 'debit'] }, '$amount', 0]
                    }
                },
                categoryBreakdown: {
                    $push: {
                        category: '$category',
                        amount: '$amount',
                        type: '$type'
                    }
                }
            }
        }
    ]);

    // Get latest balance
    const latestTransaction = await Transaction.findOne(
        { userId: new mongoose.Types.ObjectId(userId) },
        { balance: 1 },
        { sort: { transactionDate: -1 } }
    );

    const monthlyIncome = monthlyStats[0]?.totalIncome || 0;
    const monthlyExpenses = monthlyStats[0]?.totalExpenses || 0;
    const currentBalance = latestTransaction?.balance || 0;

    // Calculate category spending
    const categorySpending = {};
    if (monthlyStats[0]?.categoryBreakdown) {
        monthlyStats[0].categoryBreakdown.forEach(item => {
            if (item.type === 'debit') {
                categorySpending[item.category] = (categorySpending[item.category] || 0) + item.amount;
            }
        });
    }

    // Convert to array and calculate percentages
    const categoryArray = Object.entries(categorySpending)
        .map(([category, amount]) => ({
            category,
            amount,
            percentage: monthlyExpenses > 0 ? (amount / monthlyExpenses) * 100 : 0
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

    // Calculate financial metrics
    const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;
    const expenseRatio = monthlyIncome > 0 ? (monthlyExpenses / monthlyIncome) * 100 : 0;

    // Update or create stats document
    const statsData = {
        userId: new mongoose.Types.ObjectId(userId),
        totalBalance: currentBalance,
        availableBalance: currentBalance,
        monthlyIncome,
        monthlyExpenses,
        monthlyNet: monthlyIncome - monthlyExpenses,
        categorySpending: categoryArray,
        savingsRate,
        expenseRatio,
        lastCalculated: new Date(),
        statsPeriod: {
            startDate: startOfMonth,
            endDate: endOfMonth
        }
    };

    return await this.findOneAndUpdate(
        { userId: new mongoose.Types.ObjectId(userId) },
        statsData,
        {
            upsert: true,
            new: true,
            runValidators: true
        }
    );
};

// Instance method to refresh stats
statsSchema.methods.refreshStats = async function () {
    return await this.constructor.calculateUserStats(this.userId);
};

const Stats = mongoose.model('Stats', statsSchema);

module.exports = Stats; 