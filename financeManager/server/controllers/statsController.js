const TotalStats = require('../models/totalStatsModel');
const MonthlyStats = require('../models/monthlyStatsModel');
const Transaction = require('../models/txnModel');
const mongoose = require('mongoose');

// Helper function to validate ObjectId
const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

// Helper function to handle async errors
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// @desc    Get user's financial stats
// @route   GET /api/stats/:userId
// @access  Private
const getUserStats = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid user ID format'
        });
    }

    try {
        let totalStats = await TotalStats.findOne({ userId });

        // If no stats exist, calculate them
        if (!totalStats) {
            totalStats = await TotalStats.calculateTotalStats(userId);
        }

        // Check if stats are outdated (older than 1 hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        if (totalStats.lastUpdated < oneHourAgo) {
            totalStats = await TotalStats.calculateTotalStats(userId);
        }

        res.status(200).json({
            success: true,
            data: totalStats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching user stats',
            error: error.message
        });
        console.error(error)
    }
});

// @desc    Get summary stats for dashboard
// @route   GET /api/stats/:userId/summary
// @access  Private
const getStatsSummary = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid user ID format'
        });
    }

    try {
        const totalStats = await TotalStats.findOne({ userId });

        if (!totalStats) {
            return res.status(404).json({
                success: false,
                message: 'Stats not found for this user'
            });
        }

        // Return only essential summary data
        const summary = {
            currentBalance: totalStats.currentBalance,
            availableBalance: totalStats.availableBalance,
            thisMonthIncome: totalStats.thisMonthIncome,
            thisMonthExpenses: totalStats.thisMonthExpenses,
            thisMonthNet: totalStats.thisMonthNet,
            totalSavings: totalStats.totalSavings,
            totalInvestments: totalStats.totalInvestments,
            netWorth: totalStats.netWorth,
            creditUtilization: totalStats.creditUtilization,
            savingsProgress: totalStats.savingsProgress,
            budgetUtilization: totalStats.budgetUtilization,
            emergencyFundProgress: totalStats.emergencyFundProgress,
            financialScore: totalStats.financialScore,
            savingsRate: totalStats.savingsRate,
            lastUpdated: totalStats.lastUpdated
        };

        res.status(200).json({
            success: true,
            data: summary
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching stats summary',
            error: error.message
        });
    }
});

// @desc    Force refresh user stats
// @route   POST /api/stats/:userId/refresh
// @access  Private
const refreshUserStats = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid user ID format'
        });
    }

    try {
        // First calculate current month stats
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        await MonthlyStats.calculateMonthlyStats(userId, currentYear, currentMonth);

        // Then calculate total stats
        const totalStats = await TotalStats.calculateTotalStats(userId);

        res.status(200).json({
            success: true,
            message: 'Stats refreshed successfully',
            data: totalStats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error refreshing user stats',
            error: error.message
        });
    }
});

// @desc    Get category spending breakdown
// @route   GET /api/stats/:userId/categories
// @access  Private
const getCategoryBreakdown = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { period = 'month', year, month, monthYear } = req.query;

    if (!isValidObjectId(userId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid user ID format'
        });
    }

    try {
        let categoryData;

        // Handle monthYear format (e.g., "January25")
        if (monthYear) {
            const monthlyStats = await MonthlyStats.getMonthStatsByMonthYear(userId, monthYear);

            if (monthlyStats) {
                const totalSpending = monthlyStats.totalExpenses;
                const categoriesWithPercentage = monthlyStats.expensesByCategory.map(cat => ({
                    category: cat.category,
                    amount: cat.amount,
                    percentage: totalSpending > 0 ? ((cat.amount / totalSpending) * 100).toFixed(2) : 0
                }));

                categoryData = {
                    categories: categoriesWithPercentage,
                    totalSpending,
                    period: monthYear,
                    dateRange: {
                        startDate: monthlyStats.periodStart,
                        endDate: monthlyStats.periodEnd
                    }
                };
            } else {
                categoryData = {
                    categories: [],
                    totalSpending: 0,
                    period: monthYear,
                    dateRange: null
                };
            }
        } else if (period === 'month' && year && month) {
            // Get specific month's category breakdown from MonthlyStats
            const monthlyStats = await MonthlyStats.getMonthStats(userId, parseInt(year), parseInt(month));

            if (monthlyStats) {
                const totalSpending = monthlyStats.totalExpenses;
                const categoriesWithPercentage = monthlyStats.expensesByCategory.map(cat => ({
                    category: cat.category,
                    amount: cat.amount,
                    percentage: totalSpending > 0 ? ((cat.amount / totalSpending) * 100).toFixed(2) : 0
                }));

                categoryData = {
                    categories: categoriesWithPercentage,
                    totalSpending,
                    period: `${year}-${month}`,
                    monthYear: MonthlyStats.formatMonthYear(parseInt(year), parseInt(month)),
                    dateRange: {
                        startDate: monthlyStats.periodStart,
                        endDate: monthlyStats.periodEnd
                    }
                };
            } else {
                categoryData = {
                    categories: [],
                    totalSpending: 0,
                    period: `${year}-${month}`,
                    monthYear: MonthlyStats.formatMonthYear(parseInt(year), parseInt(month)),
                    dateRange: null
                };
            }
        } else {
            // Calculate date range based on period for custom date ranges
            const now = new Date();
            let startDate, endDate;

            switch (period) {
                case 'week':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
                    endDate = now;
                    break;
                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                    break;
                case 'quarter':
                    const quarterStart = Math.floor(now.getMonth() / 3) * 3;
                    startDate = new Date(now.getFullYear(), quarterStart, 1);
                    endDate = new Date(now.getFullYear(), quarterStart + 3, 0);
                    break;
                case 'year':
                    startDate = new Date(now.getFullYear(), 0, 1);
                    endDate = new Date(now.getFullYear(), 11, 31);
                    break;
                default:
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            }

            const categoryStats = await Transaction.aggregate([
                {
                    $match: {
                        userId: new mongoose.Types.ObjectId(userId),
                        type: 'debit',
                        transactionDate: {
                            $gte: startDate,
                            $lte: endDate
                        }
                    }
                },
                {
                    $group: {
                        _id: '$category',
                        totalAmount: { $sum: '$amount' },
                        transactionCount: { $sum: 1 },
                        avgAmount: { $avg: '$amount' }
                    }
                },
                {
                    $sort: { totalAmount: -1 }
                }
            ]);

            const totalSpending = categoryStats.reduce((sum, cat) => sum + cat.totalAmount, 0);

            const categoriesWithPercentage = categoryStats.map(cat => ({
                category: cat._id,
                amount: cat.totalAmount,
                percentage: totalSpending > 0 ? ((cat.totalAmount / totalSpending) * 100).toFixed(2) : 0,
                transactionCount: cat.transactionCount,
                avgAmount: cat.avgAmount
            }));

            categoryData = {
                categories: categoriesWithPercentage,
                totalSpending,
                period,
                dateRange: { startDate, endDate }
            };
        }

        res.status(200).json({
            success: true,
            data: categoryData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching category breakdown',
            error: error.message
        });
    }
});

// @desc    Get monthly trends
// @route   GET /api/stats/:userId/trends
// @access  Private
const getMonthlyTrends = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { months = 12 } = req.query;

    if (!isValidObjectId(userId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid user ID format'
        });
    }

    try {
        const monthsBack = parseInt(months) || 12;

        // Get monthly history from MonthlyStats
        const monthlyHistory = await MonthlyStats.getUserMonthlyHistory(userId, monthsBack);

        // Format the data for trends
        const trends = monthlyHistory.reverse().map(monthData => ({
            month: new Date(monthData.year, monthData.month - 1).toLocaleString('default', { month: 'short' }),
            monthYear: monthData.monthYear,
            year: monthData.year,
            income: monthData.totalIncome,
            expenses: monthData.totalExpenses,
            net: monthData.netIncome,
            savings: Math.max(0, monthData.netIncome),
            savingsRate: monthData.savingsRate,
            endingBalance: monthData.endingBalance
        }));

        res.status(200).json({
            success: true,
            data: trends
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching monthly trends',
            error: error.message
        });
    }
});

// @desc    Get specific month stats
// @route   GET /api/stats/:userId/month/:year/:month
// @access  Private
const getMonthStats = asyncHandler(async (req, res) => {
    const { userId, year, month } = req.params;

    if (!isValidObjectId(userId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid user ID format'
        });
    }

    try {
        const monthlyStats = await MonthlyStats.getMonthStats(userId, parseInt(year), parseInt(month));

        if (!monthlyStats) {
            return res.status(404).json({
                success: false,
                message: 'Monthly stats not found'
            });
        }

        res.status(200).json({
            success: true,
            data: monthlyStats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching monthly stats',
            error: error.message
        });
    }
});



// @desc    Get specific month stats by monthYear
// @route   GET /api/stats/:userId/month/:monthYear
// @access  Private
const getMonthStatsByMonthYear = asyncHandler(async (req, res) => {
    const { userId, monthYear } = req.params;

    if (!isValidObjectId(userId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid user ID format'
        });
    }

    try {
        const monthlyStats = await MonthlyStats.getMonthStatsByMonthYear(userId, monthYear);

        if (!monthlyStats) {
            return res.status(404).json({
                success: false,
                message: 'Monthly stats not found'
            });
        }

        res.status(200).json({
            success: true,
            data: monthlyStats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching monthly stats',
            error: error.message
        });
    }
});

// @desc    Update user goals
// @route   PUT /api/stats/:userId/goals
// @access  Private
const updateUserGoals = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const goals = req.body;

    if (!isValidObjectId(userId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid user ID format'
        });
    }

    try {
        const updatedStats = await TotalStats.updateUserGoals(userId, goals);

        res.status(200).json({
            success: true,
            message: 'Goals updated successfully',
            data: updatedStats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating goals',
            error: error.message
        });
    }
});

// @desc    Get financial health score breakdown
// @route   GET /api/stats/:userId/health-score
// @access  Private
const getHealthScore = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid user ID format'
        });
    }

    try {
        const totalStats = await TotalStats.findOne({ userId });

        if (!totalStats) {
            return res.status(404).json({
                success: false,
                message: 'Stats not found for this user'
            });
        }

        // Calculate detailed health score breakdown
        const healthFactors = {
            savingsRate: {
                score: Math.min(100, Math.max(0, (totalStats.savingsRate / 20) * 100)), // 20% savings rate = 100 points
                weight: 0.3,
                description: 'Savings as percentage of income',
                current: totalStats.savingsRate
            },
            creditUtilization: {
                score: Math.max(0, 100 - (totalStats.creditUtilization / 30) * 100), // <30% = good
                weight: 0.2,
                description: 'Credit utilization percentage',
                current: totalStats.creditUtilization
            },
            budgetAdherence: {
                score: totalStats.monthlyBudget > 0 ?
                    Math.max(0, 100 - Math.max(0, (totalStats.thisMonthExpenses - totalStats.monthlyBudget) / totalStats.monthlyBudget * 100)) : 50,
                weight: 0.2,
                description: 'Staying within monthly budget',
                current: parseFloat(totalStats.budgetUtilization)
            },
            emergencyFund: {
                score: totalStats.emergencyFundGoal > 0 ?
                    Math.min(100, (totalStats.emergencyFund / totalStats.emergencyFundGoal) * 100) : 0,
                weight: 0.15,
                description: 'Emergency fund progress',
                current: parseFloat(totalStats.emergencyFundProgress)
            },
            debtRatio: {
                score: Math.max(0, 100 - (totalStats.debtToIncomeRatio / 40) * 100), // <40% = good
                weight: 0.15,
                description: 'Debt to income ratio',
                current: totalStats.debtToIncomeRatio
            }
        };

        const overallScore = Object.values(healthFactors).reduce((total, factor) => {
            return total + (factor.score * factor.weight);
        }, 0);

        res.status(200).json({
            success: true,
            data: {
                overallScore: Math.round(overallScore),
                factors: healthFactors,
                recommendations: generateRecommendations(healthFactors, totalStats)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error calculating health score',
            error: error.message
        });
    }
});

// @desc    Get current month stats
// @route   GET /api/stats/:userId/current-month
// @access  Private
const getCurrentMonthStats = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid user ID format'
        });
    }

    try {
        const currentMonthStats = await MonthlyStats.getCurrentMonthStats(userId);

        res.status(200).json({
            success: true,
            data: currentMonthStats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching current month stats',
            error: error.message
        });
    }
});

// Helper function to generate recommendations
const generateRecommendations = (factors, totalStats) => {
    const recommendations = [];

    if (factors.savingsRate.score < 50) {
        recommendations.push({
            category: 'Savings',
            message: 'Consider increasing your savings rate to at least 10-15% of income',
            priority: 'high'
        });
    }

    if (factors.creditUtilization.score < 70) {
        recommendations.push({
            category: 'Credit',
            message: 'Try to keep credit utilization below 30% for better credit health',
            priority: 'medium'
        });
    }

    if (factors.budgetAdherence.score < 60) {
        recommendations.push({
            category: 'Budget',
            message: 'Review and adjust your monthly budget to better match spending habits',
            priority: 'medium'
        });
    }

    if (factors.emergencyFund.score < 30) {
        recommendations.push({
            category: 'Emergency Fund',
            message: 'Build an emergency fund covering 3-6 months of expenses',
            priority: 'high'
        });
    }

    if (factors.debtRatio.score < 60) {
        recommendations.push({
            category: 'Debt',
            message: 'Consider strategies to reduce debt-to-income ratio',
            priority: 'high'
        });
    }

    // Add specific recommendations based on current stats
    if (totalStats.thisMonthExpenses > totalStats.avgMonthlyExpenses * 1.2) {
        recommendations.push({
            category: 'Spending',
            message: 'Your spending this month is 20% higher than average - consider reviewing recent expenses',
            priority: 'medium'
        });
    }

    if (totalStats.thisMonthIncome < totalStats.avgMonthlyIncome * 0.8) {
        recommendations.push({
            category: 'Income',
            message: 'Your income this month is lower than average - consider diversifying income sources',
            priority: 'low'
        });
    }

    return recommendations;
};

module.exports = {
    getUserStats,
    getStatsSummary,
    refreshUserStats,
    getCategoryBreakdown,
    getMonthlyTrends,
    getMonthStats,
    getMonthStatsByMonthYear,
    updateUserGoals,
    getHealthScore,
    getCurrentMonthStats
};