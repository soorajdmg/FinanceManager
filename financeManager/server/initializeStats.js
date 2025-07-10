require('dotenv').config();
const mongoose = require('mongoose');
const MonthlyStats = require('./models/monthlyStatsModel');
const TotalStats = require('./models/totalStatsModel');
const Transaction = require('./models/txnModel');

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ MongoDB connected successfully');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        process.exit(1);
    }
};

// Utility function to safely calculate savings rate
const calculateSavingsRate = (income, expenses) => {
    if (income <= 0) return 0;
    const rate = ((income - expenses) / income) * 100;
    // Allow negative savings rates but cap at reasonable bounds
    return Math.max(-500, Math.min(100, rate));
};

// Initialize monthly stats for a user
const initializeMonthlyStats = async (userId) => {
    try {
        console.log(`📊 Initializing monthly stats for user: ${userId}`);

        // Get user's transaction date range
        const transactionRange = await Transaction.aggregate([
            {
                $match: { userId: new mongoose.Types.ObjectId(userId) }
            },
            {
                $group: {
                    _id: null,
                    minDate: { $min: '$transactionDate' },
                    maxDate: { $max: '$transactionDate' }
                }
            }
        ]);

        if (!transactionRange.length) {
            console.log(`⚠️  No transactions found for user: ${userId}`);
            return { monthlyCount: 0, error: 'No transactions found' };
        }

        const { minDate, maxDate } = transactionRange[0];
        const startDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
        const endDate = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0);

        console.log(`📅 Processing monthly stats from ${startDate.toISOString().slice(0, 7)} to ${endDate.toISOString().slice(0, 7)}`);

        // Generate all months between start and end dates
        const monthsToProcess = [];
        const current = new Date(startDate);
        
        while (current <= endDate) {
            monthsToProcess.push({
                year: current.getFullYear(),
                month: current.getMonth() + 1
            });
            current.setMonth(current.getMonth() + 1);
        }

        let processedCount = 0;
        let errorCount = 0;

        // Process each month
        for (const { year, month } of monthsToProcess) {
            try {
                // Calculate monthly stats with custom logic to handle negative savings rates
                const monthlyStats = await calculateMonthlyStatsWithValidation(userId, year, month);
                processedCount++;
                console.log(`✅ Monthly stats calculated for ${year}-${month.toString().padStart(2, '0')}`);
            } catch (error) {
                errorCount++;
                console.error(`❌ Failed to calculate monthly stats for ${year}-${month}:`, error.message);
            }
        }

        return { 
            monthlyCount: processedCount, 
            monthlyErrors: errorCount,
            monthsProcessed: monthsToProcess.length
        };

    } catch (error) {
        console.error(`❌ Error initializing monthly stats for user ${userId}:`, error.message);
        return { monthlyCount: 0, error: error.message };
    }
};

// Custom function to calculate monthly stats with proper validation
const calculateMonthlyStatsWithValidation = async (userId, year, month) => {
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
                transactions: { $push: '$ROOT' },
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

        return await MonthlyStats.findOneAndUpdate(
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

    return await MonthlyStats.findOneAndUpdate(
        { userId: new mongoose.Types.ObjectId(userId), year, month },
        monthlyStatsData,
        { upsert: true, new: true, runValidators: true }
    );
};

// Initialize total stats for a user
const initializeTotalStats = async (userId) => {
    try {
        console.log(`📈 Initializing total stats for user: ${userId}`);

        // Custom calculation to handle negative savings rates
        const totalStats = await calculateTotalStatsWithValidation(userId);
        
        if (totalStats) {
            console.log(`✅ Total stats calculated for user: ${userId}`);
            return { totalStatsCreated: true };
        } else {
            console.log(`⚠️  Failed to create total stats for user: ${userId}`);
            return { totalStatsCreated: false, error: 'Failed to create total stats' };
        }

    } catch (error) {
        console.error(`❌ Error initializing total stats for user ${userId}:`, error.message);
        return { totalStatsCreated: false, error: error.message };
    }
};

// Custom function to calculate total stats with proper validation
const calculateTotalStatsWithValidation = async (userId) => {
    // Get current month stats
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const currentMonthStats = await MonthlyStats.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        year: currentYear,
        month: currentMonth
    });

    // Get last 12 months for averages
    const monthlyHistory = await MonthlyStats.find(
        { userId: new mongoose.Types.ObjectId(userId) },
        null,
        { sort: { year: -1, month: -1 }, limit: 12 }
    );

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

    // Calculate financial metrics safely
    const savingsRate = calculateSavingsRate(avgIncome, avgExpenses);
    const expenseRatio = avgIncome > 0 ? Math.min(1000, (avgExpenses / avgIncome) * 100) : 0;

    // Get existing stats to preserve user-set values
    const existingStats = await TotalStats.findOne({ userId: new mongoose.Types.ObjectId(userId) });

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
        totalStatsData.debtToIncomeRatio = Math.min(1000, (totalStatsData.totalDebt / (avgIncome * 12)) * 100);
    }

    // Calculate financial score safely
    totalStatsData.financialScore = calculateFinancialScoreSafe(totalStatsData);

    return await TotalStats.findOneAndUpdate(
        { userId: new mongoose.Types.ObjectId(userId) },
        totalStatsData,
        { upsert: true, new: true, runValidators: true }
    );
};

// Safe financial score calculation
const calculateFinancialScoreSafe = (stats) => {
    let score = 0;

    // Savings rate (30% weight) - handle negative rates
    const savingsRateScore = Math.max(0, Math.min(100, (Math.max(0, stats.savingsRate) / 20) * 100));
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

    return Math.round(Math.max(0, Math.min(100, score)));
};

// Main initialization function
const initializeAllStats = async () => {
    try {
        console.log('🚀 Starting comprehensive stats initialization...');

        // Get all unique user IDs from transactions
        const userIds = await Transaction.distinct('userId');
        console.log(`👥 Found ${userIds.length} unique users with transactions`);

        if (userIds.length === 0) {
            console.log('⚠️  No users found with transactions. Exiting...');
            return;
        }

        // Optional: Clear existing stats (uncomment if you want to start fresh)
        // console.log('🗑️  Clearing existing stats...');
        // await MonthlyStats.deleteMany({});
        // await TotalStats.deleteMany({});

        let totalResults = {
            usersProcessed: 0,
            usersWithErrors: 0,
            totalMonthlyStats: 0,
            totalStatsCreated: 0,
            monthlyStatsErrors: 0,
            totalStatsErrors: 0
        };

        // Process each user
        for (const userId of userIds) {
            try {
                console.log(`\n🔄 Processing user: ${userId}`);

                // Initialize monthly stats first
                const monthlyResult = await initializeMonthlyStats(userId);
                
                // Initialize total stats (depends on monthly stats)
                const totalResult = await initializeTotalStats(userId);

                // Update results
                totalResults.usersProcessed++;
                totalResults.totalMonthlyStats += monthlyResult.monthlyCount || 0;
                totalResults.monthlyStatsErrors += monthlyResult.monthlyErrors || 0;
                
                if (totalResult.totalStatsCreated) {
                    totalResults.totalStatsCreated++;
                } else {
                    totalResults.totalStatsErrors++;
                }

                if (monthlyResult.error || totalResult.error) {
                    totalResults.usersWithErrors++;
                    console.log(`⚠️  User ${userId} had some errors during processing`);
                } else {
                    console.log(`✅ User ${userId} processed successfully`);
                }

            } catch (error) {
                totalResults.usersWithErrors++;
                console.error(`❌ Failed to process user ${userId}:`, error.message);
            }
        }

        // Final summary
        console.log('\n🎉 INITIALIZATION COMPLETE!');
        console.log('=====================================');
        console.log(`👥 Total users processed: ${totalResults.usersProcessed}`);
        console.log(`📊 Monthly stats created: ${totalResults.totalMonthlyStats}`);
        console.log(`📈 Total stats created: ${totalResults.totalStatsCreated}`);
        console.log(`❌ Users with errors: ${totalResults.usersWithErrors}`);
        console.log(`❌ Monthly stats errors: ${totalResults.monthlyStatsErrors}`);
        console.log(`❌ Total stats errors: ${totalResults.totalStatsErrors}`);
        console.log('=====================================');

        // Verify final counts
        const finalMonthlyCount = await MonthlyStats.countDocuments();
        const finalTotalCount = await TotalStats.countDocuments();
        
        console.log(`\n📊 Final database counts:`);
        console.log(`📅 Monthly stats records: ${finalMonthlyCount}`);
        console.log(`📈 Total stats records: ${finalTotalCount}`);

    } catch (error) {
        console.error('❌ Initialization failed:', error.message);
        console.error('Error details:', error);
    }
};

// Function to reinitialize stats for a specific user (useful for testing)
const reinitializeUserStats = async (userId) => {
    try {
        console.log(`🔄 Reinitializing stats for user: ${userId}`);

        // Clear existing stats for this user
        await MonthlyStats.deleteMany({ userId: new mongoose.Types.ObjectId(userId) });
        await TotalStats.deleteOne({ userId: new mongoose.Types.ObjectId(userId) });

        // Reinitialize
        const monthlyResult = await initializeMonthlyStats(userId);
        const totalResult = await initializeTotalStats(userId);

        console.log(`✅ User ${userId} stats reinitialized`);
        console.log(`📊 Monthly stats: ${monthlyResult.monthlyCount} records`);
        console.log(`📈 Total stats: ${totalResult.totalStatsCreated ? 'Created' : 'Failed'}`);

        return { success: true, monthlyResult, totalResult };

    } catch (error) {
        console.error(`❌ Failed to reinitialize stats for user ${userId}:`, error.message);
        return { success: false, error: error.message };
    }
};

// Function to update stats for current month (useful for regular updates)
const updateCurrentMonthStats = async () => {
    try {
        console.log('🔄 Updating current month stats for all users...');

        const userIds = await Transaction.distinct('userId');
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        let updatedCount = 0;
        let errorCount = 0;

        for (const userId of userIds) {
            try {
                // Update current month stats
                await MonthlyStats.calculateMonthlyStats(userId, currentYear, currentMonth);
                
                // Update total stats
                await TotalStats.calculateTotalStats(userId);
                
                updatedCount++;
                console.log(`✅ Updated stats for user: ${userId}`);
            } catch (error) {
                errorCount++;
                console.error(`❌ Failed to update stats for user ${userId}:`, error.message);
            }
        }

        console.log(`\n📊 Current month update complete:`);
        console.log(`✅ Successfully updated: ${updatedCount} users`);
        console.log(`❌ Errors: ${errorCount} users`);

    } catch (error) {
        console.error('❌ Current month update failed:', error.message);
    }
};

// Main execution
const main = async () => {
    try {
        await connectDB();

        // Check command line arguments for specific operations
        const operation = process.argv[2];
        const userId = process.argv[3];

        switch (operation) {
            case 'reinit-user':
                if (!userId) {
                    console.error('❌ Please provide a user ID: node script.js reinit-user <userId>');
                    process.exit(1);
                }
                await reinitializeUserStats(userId);
                break;

            case 'update-current':
                await updateCurrentMonthStats();
                break;

            case 'full-init':
            default:
                await initializeAllStats();
                break;
        }

        console.log('\n🎉 Script completed successfully!');
        console.log('💡 Your stats are now ready for use in your application.');

    } catch (error) {
        console.error('❌ Script failed:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        process.exit(0);
    }
};

// Run the script
main();