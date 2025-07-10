const mongoose = require('mongoose');

// Total Stats - Overall user financial snapshot
const totalStatsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
        unique: true
    },

    // Current balances
    currentBalance: {
        type: Number,
        default: 0
    },
    availableBalance: {
        type: Number,
        default: 0
    },

    // This month progress
    thisMonthIncome: {
        type: Number,
        default: 0
    },
    thisMonthExpenses: {
        type: Number,
        default: 0
    },
    thisMonthNet: {
        type: Number,
        default: 0
    },

    // User goals
    monthlyBudget: {
        type: Number,
        default: 0
    },
    savingsGoal: {
        type: Number,
        default: 0
    },
    emergencyFundGoal: {
        type: Number,
        default: 0
    },

    // Savings and investments
    totalSavings: {
        type: Number,
        default: 0
    },
    totalInvestments: {
        type: Number,
        default: 0
    },
    emergencyFund: {
        type: Number,
        default: 0
    },

    // Debt information
    totalDebt: {
        type: Number,
        default: 0
    },
    creditLimit: {
        type: Number,
        default: 0
    },
    creditUsed: {
        type: Number,
        default: 0
    },
    creditUtilization: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },

    // Averages (calculated from monthly stats)
    avgMonthlyIncome: {
        type: Number,
        default: 0
    },
    avgMonthlyExpenses: {
        type: Number,
        default: 0
    },
    avgMonthlySavings: {
        type: Number,
        default: 0
    },

    // Performance metrics
    savingsRate: {
        type: Number,
        default: 0,
        min: -500,
        max: 100
    },
    debtToIncomeRatio: {
        type: Number,
        default: 0,
        min: 0
    },
    expenseRatio: {
        type: Number,
        default: 0,
        min: -500,
        max: 500
    },

    // Financial health score
    financialScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },

    // Tracking
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    lastMonthCalculated: {
        year: Number,
        month: Number
    }
}, {
    timestamps: true,
    collection: 'total_stats'
});

// Virtual for net worth calculation
totalStatsSchema.virtual('netWorth').get(function () {
    return this.currentBalance + this.totalSavings + this.totalInvestments - this.totalDebt;
});

// Virtual for budget utilization percentage
totalStatsSchema.virtual('budgetUtilization').get(function () {
    if (this.monthlyBudget === 0) return 0;
    return ((this.thisMonthExpenses / this.monthlyBudget) * 100).toFixed(2);
});

// Virtual for savings goal progress
totalStatsSchema.virtual('savingsProgress').get(function () {
    if (this.savingsGoal === 0) return 0;
    return ((this.totalSavings / this.savingsGoal) * 100).toFixed(2);
});

// Virtual for emergency fund progress
totalStatsSchema.virtual('emergencyFundProgress').get(function () {
    if (this.emergencyFundGoal === 0) return 0;
    return ((this.emergencyFund / this.emergencyFundGoal) * 100).toFixed(2);
});

// Indexes
totalStatsSchema.index({ userId: 1 }, { unique: true });
totalStatsSchema.index({ lastUpdated: -1 });

// Static method to calculate and update total stats
totalStatsSchema.statics.calculateTotalStats = async function (userId) {
    const MonthlyStats = mongoose.model('MonthlyStats');
    const Transaction = mongoose.model('Transaction');

    // Get current month stats
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const currentMonthStats = await MonthlyStats.getCurrentMonthStats(userId);

    // Get last 12 months for averages
    const monthlyHistory = await MonthlyStats.getUserMonthlyHistory(userId, 12);

    // Calculate averages
    const avgIncome = monthlyHistory.length > 0 ?
        monthlyHistory.reduce((sum, month) => sum + month.totalIncome, 0) / monthlyHistory.length : 0;
    const avgExpenses = monthlyHistory.length > 0 ?
        monthlyHistory.reduce((sum, month) => sum + month.totalExpenses, 0) / monthlyHistory.length : 0;
    const avgSavings = monthlyHistory.length > 0 ?
        monthlyHistory.reduce((sum, month) => sum + month.netIncome, 0) / monthlyHistory.length : 0;

    // Get current balance from latest transaction
    const latestTransaction = await Transaction.findOne(
        { userId: new mongoose.Types.ObjectId(userId) },
        { balance: 1 },
        { sort: { transactionDate: -1 } }
    );

    const currentBalance = latestTransaction?.balance || 0;

    // Calculate financial metrics
    const savingsRate = avgIncome > 0 ? ((avgIncome - avgExpenses) / avgIncome) * 100 : 0;
    const expenseRatio = avgIncome > 0 ? (avgExpenses / avgIncome) * 100 : 0;

    // Get existing stats to preserve user-set values
    const existingStats = await this.findOne({ userId: new mongoose.Types.ObjectId(userId) });

    const totalStatsData = {
        userId: new mongoose.Types.ObjectId(userId),
        currentBalance,
        availableBalance: currentBalance,
        thisMonthIncome: currentMonthStats?.totalIncome || 0,
        thisMonthExpenses: currentMonthStats?.totalExpenses || 0,
        thisMonthNet: currentMonthStats?.netIncome || 0,
        avgMonthlyIncome: avgIncome,
        avgMonthlyExpenses: avgExpenses,
        avgMonthlySavings: avgSavings,
        savingsRate,
        expenseRatio,
        lastUpdated: new Date(),
        lastMonthCalculated: {
            year: currentYear,
            month: currentMonth
        },
        // Preserve user-set goals and manual entries
        monthlyBudget: existingStats?.monthlyBudget || 0,
        savingsGoal: existingStats?.savingsGoal || 0,
        emergencyFundGoal: existingStats?.emergencyFundGoal || 0,
        totalSavings: existingStats?.totalSavings || 0,
        totalInvestments: existingStats?.totalInvestments || 0,
        emergencyFund: existingStats?.emergencyFund || 0,
        totalDebt: existingStats?.totalDebt || 0,
        creditLimit: existingStats?.creditLimit || 0,
        creditUsed: existingStats?.creditUsed || 0,
        creditUtilization: existingStats?.creditUtilization || 0
    };

    // Calculate debt to income ratio
    if (avgIncome > 0) {
        totalStatsData.debtToIncomeRatio = (totalStatsData.totalDebt / (avgIncome * 12)) * 100;
    }

    // Calculate financial score
    totalStatsData.financialScore = this.calculateFinancialScore(totalStatsData);

    return await this.findOneAndUpdate(
        { userId: new mongoose.Types.ObjectId(userId) },
        totalStatsData,
        { upsert: true, new: true, runValidators: true }
    );
};

// Method to calculate financial score
totalStatsSchema.statics.calculateFinancialScore = function (stats) {
    let score = 0;

    // Savings rate (30% weight)
    const savingsRateScore = Math.min(100, (stats.savingsRate / 20) * 100);
    score += savingsRateScore * 0.3;

    // Credit utilization (20% weight)
    const creditScore = Math.max(0, 100 - (stats.creditUtilization / 30) * 100);
    score += creditScore * 0.2;

    // Debt to income ratio (20% weight)
    const debtScore = Math.max(0, 100 - (stats.debtToIncomeRatio / 40) * 100);
    score += debtScore * 0.2;

    // Emergency fund (15% weight)
    const emergencyScore = stats.emergencyFundGoal > 0 ?
        Math.min(100, (stats.emergencyFund / stats.emergencyFundGoal) * 100) : 0;
    score += emergencyScore * 0.15;

    // Budget adherence (15% weight)
    const budgetScore = stats.monthlyBudget > 0 ?
        Math.max(0, 100 - ((stats.thisMonthExpenses / stats.monthlyBudget) * 100)) : 50;
    score += budgetScore * 0.15;

    return Math.round(score);
};

// Method to update user goals
totalStatsSchema.statics.updateUserGoals = async function (userId, goals) {
    const updateData = { lastUpdated: new Date() };

    if (goals.savingsGoal !== undefined) updateData.savingsGoal = goals.savingsGoal;
    if (goals.monthlyBudget !== undefined) updateData.monthlyBudget = goals.monthlyBudget;
    if (goals.emergencyFundGoal !== undefined) updateData.emergencyFundGoal = goals.emergencyFundGoal;
    if (goals.totalSavings !== undefined) updateData.totalSavings = goals.totalSavings;
    if (goals.totalInvestments !== undefined) updateData.totalInvestments = goals.totalInvestments;
    if (goals.emergencyFund !== undefined) updateData.emergencyFund = goals.emergencyFund;
    if (goals.totalDebt !== undefined) updateData.totalDebt = goals.totalDebt;
    if (goals.creditLimit !== undefined) updateData.creditLimit = goals.creditLimit;
    if (goals.creditUsed !== undefined) updateData.creditUsed = goals.creditUsed;

    // Recalculate credit utilization
    if (goals.creditLimit !== undefined || goals.creditUsed !== undefined) {
        const stats = await this.findOne({ userId: new mongoose.Types.ObjectId(userId) });
        const creditLimit = goals.creditLimit !== undefined ? goals.creditLimit : (stats?.creditLimit || 0);
        const creditUsed = goals.creditUsed !== undefined ? goals.creditUsed : (stats?.creditUsed || 0);

        updateData.creditUtilization = creditLimit > 0 ? (creditUsed / creditLimit) * 100 : 0;
    }

    return await this.findOneAndUpdate(
        { userId: new mongoose.Types.ObjectId(userId) },
        updateData,
        { upsert: true, new: true, runValidators: true }
    );
};

const TotalStats = mongoose.model('TotalStats', totalStatsSchema);

module.exports = TotalStats;