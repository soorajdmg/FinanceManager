import React, { useState, useEffect } from 'react';
import {
    Utensils,
    Car,
    Film,
    ShoppingBag,
    Zap,
    Hospital,
    BookOpen,
    Plane,
    Dumbbell,
    BarChart3,
    Plus,
    X,
    DollarSign,
    Clipboard,
    TrendingUp,
    Trash2
} from 'lucide-react';
import './Budget.css';

const Budget = () => {
    const [budgets, setBudgets] = useState([
        {
            id: 1,
            category: 'Food & Dining',
            budgetAmount: 800,
            spentAmount: 650,
            carryOver: 50,
            icon: 'Utensils',
            color: '#3b82f6'
        },
        {
            id: 2,
            category: 'Transportation',
            budgetAmount: 300,
            spentAmount: 280,
            carryOver: 0,
            icon: 'Car',
            color: '#10b981'
        },
        {
            id: 3,
            category: 'Entertainment',
            budgetAmount: 400,
            spentAmount: 520,
            carryOver: 25,
            icon: 'Film',
            color: '#8b5cf6'
        },
        {
            id: 4,
            category: 'Shopping',
            budgetAmount: 600,
            spentAmount: 450,
            carryOver: 0,
            icon: 'ShoppingBag',
            color: '#f59e0b'
        },
        {
            id: 5,
            category: 'Utilities',
            budgetAmount: 200,
            spentAmount: 180,
            carryOver: 10,
            icon: 'Zap',
            color: '#ef4444'
        },
        {
            id: 6,
            category: 'Healthcare',
            budgetAmount: 250,
            spentAmount: 120,
            carryOver: 0,
            icon: 'Hospital',
            color: '#06b6d4'
        }
    ]);

    const [showAddBudget, setShowAddBudget] = useState(false);
    const [newBudget, setNewBudget] = useState({
        category: '',
        budgetAmount: '',
        carryOver: '',
        icon: 'BarChart3',
        color: '#64748b'
    });

    const [currentMonth, setCurrentMonth] = useState(new Date().toLocaleString('default', { month: 'long', year: 'numeric' }));

    // Icon mapping
    const iconMap = {
        'Utensils': Utensils,
        'Car': Car,
        'Film': Film,
        'ShoppingBag': ShoppingBag,
        'Zap': Zap,
        'Hospital': Hospital,
        'BookOpen': BookOpen,
        'Plane': Plane,
        'Dumbbell': Dumbbell,
        'BarChart3': BarChart3
    };

    // Get icon component
    const getIconComponent = (iconName) => {
        const IconComponent = iconMap[iconName] || BarChart3;
        return IconComponent;
    };

    // Calculate totals
    const totalBudget = budgets.reduce((sum, budget) => sum + budget.budgetAmount + budget.carryOver, 0);
    const totalSpent = budgets.reduce((sum, budget) => sum + budget.spentAmount, 0);
    const totalRemaining = totalBudget - totalSpent;

    const handleAddBudget = (e) => {
        e.preventDefault();
        if (newBudget.category && newBudget.budgetAmount) {
            const budget = {
                id: Date.now(),
                category: newBudget.category,
                budgetAmount: parseFloat(newBudget.budgetAmount),
                spentAmount: 0,
                carryOver: parseFloat(newBudget.carryOver) || 0,
                icon: newBudget.icon,
                color: newBudget.color
            };
            setBudgets([...budgets, budget]);
            setNewBudget({
                category: '',
                budgetAmount: '',
                carryOver: '',
                icon: 'BarChart3',
                color: '#64748b'
            });
            setShowAddBudget(false);
        }
    };

    const handleDeleteBudget = (id) => {
        setBudgets(budgets.filter(budget => budget.id !== id));
    };

    const calculateProgress = (budget) => {
        const totalAvailable = budget.budgetAmount + budget.carryOver;
        return Math.min((budget.spentAmount / totalAvailable) * 100, 100);
    };

    const getBudgetStatus = (budget) => {
        const totalAvailable = budget.budgetAmount + budget.carryOver;
        if (budget.spentAmount > totalAvailable) return 'over';
        if (budget.spentAmount > totalAvailable * 0.8) return 'warning';
        return 'good';
    };

    const categories = [
        { name: 'Food & Dining', icon: 'Utensils' },
        { name: 'Transportation', icon: 'Car' },
        { name: 'Entertainment', icon: 'Film' },
        { name: 'Shopping', icon: 'ShoppingBag' },
        { name: 'Utilities', icon: 'Zap' },
        { name: 'Healthcare', icon: 'Hospital' },
        { name: 'Education', icon: 'BookOpen' },
        { name: 'Travel', icon: 'Plane' },
        { name: 'Fitness', icon: 'Dumbbell' },
        { name: 'Other', icon: 'BarChart3' }
    ];

    return (
        <div className="budget-container loaded">
            <div className="budget-padding">
                <div className="budget-max-width">

                    {/* Header Section */}
                    <div className="budget-header">
                        <div className="budget-header-content">
                            <h1 className="budget-title">Monthly Budgets</h1>
                            <p className="budget-subtitle">{currentMonth}</p>
                        </div>
                        <button
                            className="add-budget-btn"
                            onClick={() => setShowAddBudget(true)}
                        >
                            <Plus className="btn-icon" />
                            Add Budget
                        </button>
                    </div>

                    {/* Summary Cards */}
                    <div className="budget-summary-grid">
                        <div className="summary-card">
                            <div className="summary-card-content">
                                <div className="summary-header">
                                    <div className="summary-icon">
                                        <DollarSign />
                                    </div>
                                </div>
                                <div className="summary-body">
                                    <h3 className="summary-title">Total Budget</h3>
                                    <p className="summary-value">${totalBudget.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="summary-card">
                            <div className="summary-card-content">
                                <div className="summary-header">
                                    <div className="summary-icon">
                                        <Clipboard />
                                    </div>
                                </div>
                                <div className="summary-body">
                                    <h3 className="summary-title">Total Spent</h3>
                                    <p className="summary-value">${totalSpent.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="summary-card">
                            <div className="summary-card-content">
                                <div className="summary-header">
                                    <div className="summary-icon">
                                        <TrendingUp />
                                    </div>
                                </div>
                                <div className="summary-body">
                                    <h3 className="summary-title">Remaining</h3>
                                    <p className={`summary-value ${totalRemaining >= 0 ? 'positive' : 'negative'}`}>
                                        ${Math.abs(totalRemaining).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Budget Categories */}
                    <div className="budget-categories">
                        <div className="categories-header">
                            <h2 className="categories-title">Budget Categories</h2>
                            <p className="categories-subtitle">Track your spending across different categories</p>
                        </div>

                        <div className="categories-list">
                            {budgets.map((budget, index) => {
                                const IconComponent = getIconComponent(budget.icon);
                                return (
                                    <div key={budget.id} className="budget-category-item">
                                        <div className="category-item-header">
                                            <div className="category-item-left">
                                                <div className="category-icon">
                                                    <IconComponent size={20} />
                                                </div>
                                                <div className="category-info">
                                                    <h3 className="category-name">{budget.category}</h3>
                                                    <p className="category-budget">
                                                        ${budget.budgetAmount.toLocaleString()}
                                                        {budget.carryOver > 0 && ` (+$${budget.carryOver.toLocaleString()} carry over)`}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="category-item-stats">
                                                <div className="category-stat">
                                                    <div className="stat-label">Spent</div>
                                                    <div className="stat-value">${budget.spentAmount.toLocaleString()}</div>
                                                </div>
                                                <div className="category-stat">
                                                    <div className="stat-label">Remaining</div>
                                                    <div className={`stat-value ${(budget.budgetAmount + budget.carryOver - budget.spentAmount) >= 0 ? 'positive' : 'negative'}`}>
                                                        ${Math.abs(budget.budgetAmount + budget.carryOver - budget.spentAmount).toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="category-actions">
                                                <button
                                                    className="action-btn"
                                                    onClick={() => handleDeleteBudget(budget.id)}
                                                    title="Delete Budget"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="category-progress-section">
                                            <div className="progress-info">
                                                <span className="progress-label">Progress</span>
                                                <span className="progress-percentage">{Math.round(calculateProgress(budget))}%</span>
                                            </div>
                                            <div className="progress-bar">
                                                <div
                                                    className="progress-fill"
                                                    style={{ width: `${calculateProgress(budget)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Add Budget Modal */}
                    {showAddBudget && (
                        <div className="modal-overlay" onClick={() => setShowAddBudget(false)}>
                            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                                <div className="modal-header">
                                    <h3 className="modal-title">Add New Budget</h3>
                                    <button
                                        className="modal-close"
                                        onClick={() => setShowAddBudget(false)}
                                    >
                                        <X size={16} />
                                    </button>
                                </div>

                                <form onSubmit={handleAddBudget} className="modal-form">
                                    <div className="form-group">
                                        <label className="form-label">Category</label>
                                        <select
                                            className="form-select"
                                            value={newBudget.category}
                                            onChange={(e) => {
                                                const selectedCategory = categories.find(cat => cat.name === e.target.value);
                                                setNewBudget({
                                                    ...newBudget,
                                                    category: e.target.value,
                                                    icon: selectedCategory?.icon || 'BarChart3'
                                                });
                                            }}
                                            required
                                        >
                                            <option value="">Select a category</option>
                                            {categories.map(category => {
                                                const IconComponent = getIconComponent(category.icon);
                                                return (
                                                    <option key={category.name} value={category.name}>
                                                        {category.name}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Budget Amount</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            placeholder="Enter budget amount"
                                            value={newBudget.budgetAmount}
                                            onChange={(e) => setNewBudget({ ...newBudget, budgetAmount: e.target.value })}
                                            required
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Carry Over (Optional)</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            placeholder="Amount to carry over from previous month"
                                            value={newBudget.carryOver}
                                            onChange={(e) => setNewBudget({ ...newBudget, carryOver: e.target.value })}
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>

                                    <div className="form-actions">
                                        <button
                                            type="button"
                                            className="btn-secondary"
                                            onClick={() => setShowAddBudget(false)}
                                        >
                                            Cancel
                                        </button>
                                        <button type="submit" className="btn-primary">
                                            Add Budget
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default Budget;