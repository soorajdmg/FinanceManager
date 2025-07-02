const Budget = require('../models/Budget');
const mongoose = require('mongoose');

// Create a new budget
const createBudget = async (req, res) => {
    try {
        const { category, amount, month } = req.body;
        const userId = req.user.id;

        // Validate required fields
        if (!category || !amount || !month) {
            return res.status(400).json({
                success: false,
                message: 'Category, amount, and month are required'
            });
        }

        // Validate month format
        const monthRegex = /^\d{4}-\d{2}$/;
        if (!monthRegex.test(month)) {
            return res.status(400).json({
                success: false,
                message: 'Month must be in YYYY-MM format'
            });
        }

        // Validate amount
        if (amount < 0) {
            return res.status(400).json({
                success: false,
                message: 'Amount must be a positive number'
            });
        }

        // Create budget
        const budget = new Budget({
            userId,
            category: category.trim(),
            amount,
            month
        });

        await budget.save();

        res.status(201).json({
            success: true,
            message: 'Budget created successfully',
            data: budget
        });

    } catch (error) {
        // Handle duplicate budget error
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Budget already exists for this category and month'
            });
        }

        console.error('Create budget error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get all budgets for a user
const getBudgets = async (req, res) => {
    try {
        const userId = req.user.id;
        const { month, category, page = 1, limit = 10 } = req.query;

        // Build filter object
        const filter = { userId };
        
        if (month) {
            // Validate month format
            const monthRegex = /^\d{4}-\d{2}$/;
            if (!monthRegex.test(month)) {
                return res.status(400).json({
                    success: false,
                    message: 'Month must be in YYYY-MM format'
                });
            }
            filter.month = month;
        }

        if (category) {
            filter.category = new RegExp(category, 'i'); // Case-insensitive search
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get budgets with pagination
        const budgets = await Budget.find(filter)
            .sort({ month: -1, category: 1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count for pagination
        const total = await Budget.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: budgets,
            pagination: {
                current: parseInt(page),
                pages: Math.ceil(total / parseInt(limit)),
                total
            }
        });

    } catch (error) {
        console.error('Get budgets error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get a specific budget by ID
const getBudget = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid budget ID'
            });
        }

        const budget = await Budget.findOne({ _id: id, userId });

        if (!budget) {
            return res.status(404).json({
                success: false,
                message: 'Budget not found'
            });
        }

        res.status(200).json({
            success: true,
            data: budget
        });

    } catch (error) {
        console.error('Get budget error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Update a budget
const updateBudget = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { category, amount, month } = req.body;

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid budget ID'
            });
        }

        // Build update object
        const updateData = {};
        
        if (category !== undefined) {
            if (!category.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Category cannot be empty'
                });
            }
            updateData.category = category.trim();
        }

        if (amount !== undefined) {
            if (amount < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Amount must be a positive number'
                });
            }
            updateData.amount = amount;
        }

        if (month !== undefined) {
            const monthRegex = /^\d{4}-\d{2}$/;
            if (!monthRegex.test(month)) {
                return res.status(400).json({
                    success: false,
                    message: 'Month must be in YYYY-MM format'
                });
            }
            updateData.month = month;
        }

        const budget = await Budget.findOneAndUpdate(
            { _id: id, userId },
            updateData,
            { new: true, runValidators: true }
        );

        if (!budget) {
            return res.status(404).json({
                success: false,
                message: 'Budget not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Budget updated successfully',
            data: budget
        });

    } catch (error) {
        // Handle duplicate budget error
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Budget already exists for this category and month'
            });
        }

        console.error('Update budget error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Delete a budget
const deleteBudget = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid budget ID'
            });
        }

        const budget = await Budget.findOneAndDelete({ _id: id, userId });

        if (!budget) {
            return res.status(404).json({
                success: false,
                message: 'Budget not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Budget deleted successfully'
        });

    } catch (error) {
        console.error('Delete budget error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get budget statistics
const getBudgetStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const { month } = req.query;

        // Build match stage for aggregation
        const matchStage = { userId: new mongoose.Types.ObjectId(userId) };
        
        if (month) {
            const monthRegex = /^\d{4}-\d{2}$/;
            if (!monthRegex.test(month)) {
                return res.status(400).json({
                    success: false,
                    message: 'Month must be in YYYY-MM format'
                });
            }
            matchStage.month = month;
        }

        const stats = await Budget.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalBudgets: { $sum: 1 },
                    totalBudgetAmount: { $sum: '$amount' },
                    avgBudgetAmount: { $avg: '$amount' },
                    maxBudgetAmount: { $max: '$amount' },
                    minBudgetAmount: { $min: '$amount' }
                }
            }
        ]);

        // Get budget by category
        const categoryStats = await Budget.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' },
                    avgAmount: { $avg: '$amount' }
                }
            },
            { $sort: { totalAmount: -1 } }
        ]);

        // Get budget by month (if no specific month is requested)
        let monthlyStats = [];
        if (!month) {
            monthlyStats = await Budget.aggregate([
                { $match: { userId: new mongoose.Types.ObjectId(userId) } },
                {
                    $group: {
                        _id: '$month',
                        count: { $sum: 1 },
                        totalAmount: { $sum: '$amount' }
                    }
                },
                { $sort: { _id: -1 } }
            ]);
        }

        const result = {
            overview: stats[0] || {
                totalBudgets: 0,
                totalBudgetAmount: 0,
                avgBudgetAmount: 0,
                maxBudgetAmount: 0,
                minBudgetAmount: 0
            },
            byCategory: categoryStats,
            byMonth: monthlyStats
        };

        res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Get budget stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

module.exports = {
    createBudget,
    getBudgets,
    getBudget,
    updateBudget,
    deleteBudget,
    getBudgetStats
};