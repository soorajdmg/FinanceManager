import React, { useState, useEffect } from 'react';
import {
    Plus,
    TrendingUp,
    DollarSign,
    Calendar,
    BarChart3,
    Edit,
    Trash2,
    Target,
    Wallet,
    AlertCircle,
    CheckCircle,
    PieChart
} from 'lucide-react';
import './Investments.css';

const Investments = () => {
    const [investments, setInvestments] = useState([
        {
            id: 1,
            name: "Tech Growth Fund",
            type: "Mutual Fund",
            initialAmount: 5000,
            currentValue: 5750,
            monthlyContribution: 500,
            startDate: "2024-01-15",
            risk: "Medium",
            expectedReturn: 12,
            category: "Technology"
        },
        {
            id: 2,
            name: "Real Estate Investment Trust",
            type: "REIT",
            initialAmount: 10000,
            currentValue: 10800,
            monthlyContribution: 300,
            startDate: "2023-06-10",
            risk: "Low",
            expectedReturn: 8,
            category: "Real Estate"
        },
        {
            id: 3,
            name: "Cryptocurrency Portfolio",
            type: "Crypto",
            initialAmount: 2000,
            currentValue: 1650,
            monthlyContribution: 200,
            startDate: "2024-03-01",
            risk: "High",
            expectedReturn: 25,
            category: "Cryptocurrency"
        }
    ]);

    const [currentBalance, setCurrentBalance] = useState(15000);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedTimeframe, setSelectedTimeframe] = useState('1month');
    const [showComparison, setShowComparison] = useState(false);
    const [selectedInvestments, setSelectedInvestments] = useState([]);
    const [darkMode, setDarkMode] = useState(false);

    const toggleInvestmentSelection = (investmentId) => {
        setSelectedInvestments(prev =>
            prev.includes(investmentId)
                ? prev.filter(id => id !== investmentId)
                : prev.length < 4 // Limit to 4 investments for comparison
                    ? [...prev, investmentId]
                    : prev
        );
    };

    const [newInvestment, setNewInvestment] = useState({
        name: '',
        type: '',
        initialAmount: '',
        monthlyContribution: '',
        risk: 'Medium',
        expectedReturn: '',
        category: ''
    });

    useEffect(() => {
        const container = document.querySelector('.investments-container');
        if (container) {
            container.classList.add('loaded');
        }
    }, []);

    const calculateTotalValue = () => {
        return investments.reduce((sum, inv) => sum + inv.currentValue, 0);
    };

    const calculateTotalGains = () => {
        return investments.reduce((sum, inv) => sum + (inv.currentValue - inv.initialAmount), 0);
    };

    const calculateProjectedValue = (investment, months) => {
        const monthlyReturn = investment.expectedReturn / 100 / 12;
        let futureValue = investment.currentValue;

        for (let i = 0; i < months; i++) {
            futureValue = (futureValue + investment.monthlyContribution) * (1 + monthlyReturn);
        }

        return futureValue;
    };

    // Add this new function in your component
    const getPortfolioAnalytics = () => {
        const totalValue = calculateTotalValue();
        const totalInvested = investments.reduce((sum, inv) => sum + inv.initialAmount, 0);
        const totalGains = calculateTotalGains();
        const overallReturn = ((totalValue - totalInvested) / totalInvested * 100);

        // Risk distribution
        const riskDistribution = investments.reduce((acc, inv) => {
            acc[inv.risk] = (acc[inv.risk] || 0) + inv.currentValue;
            return acc;
        }, {});

        // Best and worst performers
        const performances = investments.map(inv => ({
            ...inv,
            returnPercent: ((inv.currentValue - inv.initialAmount) / inv.initialAmount * 100)
        })).sort((a, b) => b.returnPercent - a.returnPercent);

        return {
            totalValue,
            totalInvested,
            totalGains,
            overallReturn,
            riskDistribution,
            bestPerformer: performances[0],
            worstPerformer: performances[performances.length - 1],
            avgReturn: performances.reduce((sum, p) => sum + p.returnPercent, 0) / performances.length
        };
    };


    const getTimeframeMonths = (timeframe) => {
        switch (timeframe) {
            case '1month': return 1;
            case '6months': return 6;
            case '1year': return 12;
            case '5years': return 60;
            default: return 12;
        }
    };

    const checkBalanceSufficiency = (investment) => {
        const monthsInYear = 12;
        const yearlyContribution = investment.monthlyContribution * monthsInYear;
        return currentBalance >= yearlyContribution;
    };

    const getShortfallAmount = (investment) => {
        const yearlyContribution = investment.monthlyContribution * 12;
        return Math.max(0, yearlyContribution - currentBalance);
    };

    const handleAddInvestment = () => {
        if (newInvestment.name && newInvestment.initialAmount) {
            const investment = {
                id: Date.now(),
                ...newInvestment,
                initialAmount: parseFloat(newInvestment.initialAmount),
                currentValue: parseFloat(newInvestment.initialAmount),
                monthlyContribution: parseFloat(newInvestment.monthlyContribution) || 0,
                expectedReturn: parseFloat(newInvestment.expectedReturn) || 10,
                startDate: new Date().toISOString().split('T')[0]
            };

            setInvestments([...investments, investment]);
            setNewInvestment({
                name: '',
                type: '',
                initialAmount: '',
                monthlyContribution: '',
                risk: 'Medium',
                expectedReturn: '',
                category: ''
            });
            setShowAddModal(false);
        }
    };

    const deleteInvestment = (id) => {
        setInvestments(investments.filter(inv => inv.id !== id));
    };

    const getRiskColor = (risk) => {
        switch (risk) {
            case 'Low': return 'text-green-600 dark:text-green-400';
            case 'Medium': return 'text-yellow-600 dark:text-yellow-400';
            case 'High': return 'text-red-600 dark:text-red-400';
            default: return 'text-gray-600 dark:text-gray-400';
        }
    };

    const getPerformanceColor = (current, initial) => {
        return current >= initial ? 'positive' : 'negative';
    };

    return (
        <div className={`investments-container ${darkMode ? 'dark-mode' : ''}`}>
            <div className="investments-padding">
                <div className="investments-max-width">
                    {/* Header Section */}
                    <div className="investments-header">
                        <div className="investments-header-content">
                            <h1 className="investments-title">Investment Portfolio</h1>
                            <p className="investments-subtitle">Track and manage your investment performance</p>
                        </div>
                        <div className="header-actions">
                            <select
                                value={selectedTimeframe}
                                onChange={(e) => setSelectedTimeframe(e.target.value)}
                                className="timeframe-select"
                            >
                                <option value="1month">1 Month</option>
                                <option value="6months">6 Months</option>
                                <option value="1year">1 Year</option>
                                <option value="5years">5 Years</option>
                            </select>
                            <button
                                className={`compare-btn ${selectedInvestments.length < 2 ? 'disabled' : ''}`}
                                onClick={() => setShowComparison(true)}
                                disabled={selectedInvestments.length < 2}
                            >
                                <BarChart3 size={16} />
                                Compare ({selectedInvestments.length})
                            </button>
                            <button
                                className="add-investment-btn"
                                onClick={() => setShowAddModal(true)}
                            >
                                <Plus size={16} />
                                Add Investment
                            </button>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="investments-summary-grid">
                        <div className="summary-card">
                            <div className="summary-card-content">
                                <div className="summary-header">
                                    <div className="summary-icon">
                                        <DollarSign />
                                    </div>
                                </div>
                                <div className="summary-body">
                                    <h3 className="summary-title">Total Portfolio Value</h3>
                                    <p className="summary-value">${calculateTotalValue().toLocaleString()}</p>
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
                                    <h3 className="summary-title">Total Gains/Loss</h3>
                                    <p className={`summary-value ${getPerformanceColor(calculateTotalValue(), investments.reduce((sum, inv) => sum + inv.initialAmount, 0))}`}>
                                        ${calculateTotalGains() >= 0 ? '+' : ''}${calculateTotalGains().toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="summary-card">
                            <div className="summary-card-content">
                                <div className="summary-header">
                                    <div className="summary-icon">
                                        <Wallet />
                                    </div>
                                </div>
                                <div className="summary-body">
                                    <h3 className="summary-title">Available Balance</h3>
                                    <p className="summary-value">${currentBalance.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="portfolio-analytics">
                        <div className="analytics-header">
                            <h2 className="analytics-title">Portfolio Analytics</h2>
                            <p className="analytics-subtitle">Comprehensive performance insights</p>
                        </div>

                        <div className="analytics-grid">
                            <div className="analytics-card diversification-card">
                                <h3 className="card-title">
                                    <PieChart size={20} />
                                    Risk Diversification
                                </h3>
                                <div className="diversification-chart">
                                    {Object.entries(getPortfolioAnalytics().riskDistribution).map(([risk, value]) => (
                                        <div key={risk} className="risk-segment">
                                            <div className="risk-bar">
                                                <div
                                                    className={`risk-fill risk-${risk.toLowerCase()}`}
                                                    style={{ width: `${(value / calculateTotalValue()) * 100}%` }}
                                                ></div>
                                            </div>
                                            <div className="risk-info">
                                                <span className="risk-label">{risk} Risk</span>
                                                <span className="risk-value">{((value / calculateTotalValue()) * 100).toFixed(1)}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="analytics-card performance-card">
                                <h3 className="card-title">
                                    <TrendingUp size={20} />
                                    Performance Leaders
                                </h3>
                                <div className="performance-leaders">
                                    <div className="leader-item best">
                                        <span className="leader-label">Best Performer</span>
                                        <span className="leader-name">{getPortfolioAnalytics().bestPerformer?.name}</span>
                                        <span className="leader-return positive">
                                            +{getPortfolioAnalytics().bestPerformer?.returnPercent.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="leader-item worst">
                                        <span className="leader-label">Needs Attention</span>
                                        <span className="leader-name">{getPortfolioAnalytics().worstPerformer?.name}</span>
                                        <span className="leader-return negative">
                                            {getPortfolioAnalytics().worstPerformer?.returnPercent.toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Investments List */}
                    <div className="investments-categories">
                        <div className="categories-header">
                            <h2 className="categories-title">Your Investments</h2>
                            <p className="categories-subtitle">Monitor performance and projections</p>
                        </div>

                        <div className="categories-list">
                            {investments.map((investment) => {
                                const projectedValue = calculateProjectedValue(investment, getTimeframeMonths(selectedTimeframe));
                                const projectedGain = projectedValue - investment.currentValue;
                                const isBalanceSufficient = checkBalanceSufficiency(investment);
                                const shortfall = getShortfallAmount(investment);
                                const currentReturn = ((investment.currentValue - investment.initialAmount) / investment.initialAmount * 100);

                                // Performance classification
                                const getPerformanceClass = (returnPercent) => {
                                    if (returnPercent >= 10) return 'excellent';
                                    if (returnPercent >= 0) return 'good';
                                    return 'poor';
                                };

                                return (
                                    <div key={investment.id} className="investment-category-item">
                                        {/* Performance indicator badge */}
                                        <div className={`performance-indicator ${getPerformanceClass(currentReturn)}`}>
                                            {currentReturn >= 10 ? '🚀 Excellent' : currentReturn >= 0 ? '📈 Performing' : '⚠️ Underperforming'}
                                            <span>{currentReturn >= 0 ? '+' : ''}{currentReturn.toFixed(1)}%</span>
                                        </div>

                                        {/* Existing header content */}
                                        <div className="category-item-header">
                                            <div className="investment-selector">
                                                <input
                                                    type="checkbox"
                                                    id={`select-${investment.id}`}
                                                    checked={selectedInvestments.includes(investment.id)}
                                                    onChange={() => toggleInvestmentSelection(investment.id)}
                                                    className="investment-checkbox"
                                                />
                                                <label htmlFor={`select-${investment.id}`} className="checkbox-label">
                                                    Select for comparison
                                                </label>
                                            </div>

                                            {/* Your existing header content */}
                                            <div className="category-item-left">
                                                {/* ... existing content */}
                                            </div>
                                        </div>

                                        {/* Quick stats overview */}
                                        <div className="quick-stats-grid">
                                            <div className="quick-stat">
                                                <div className="quick-stat-value">${investment.currentValue.toLocaleString()}</div>
                                                <div className="quick-stat-label">Current Value</div>
                                            </div>
                                            <div className="quick-stat">
                                                <div className="quick-stat-value">${(investment.currentValue - investment.initialAmount).toLocaleString()}</div>
                                                <div className="quick-stat-label">Gain/Loss</div>
                                            </div>
                                            <div className="quick-stat">
                                                <div className="quick-stat-value">{investment.expectedReturn}%</div>
                                                <div className="quick-stat-label">Target Return</div>
                                            </div>
                                            <div className="quick-stat">
                                                <div className="quick-stat-value">{((Date.now() - new Date(investment.startDate)) / (1000 * 60 * 60 * 24 * 30)).toFixed(0)}mo</div>
                                                <div className="quick-stat-label">Duration</div>
                                            </div>
                                        </div>

                                        {/* Rest of your existing content */}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Investment Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Add New Investment</h3>
                            <button
                                className="modal-close"
                                onClick={() => setShowAddModal(false)}
                            >
                                ×
                            </button>
                        </div>

                        <div className="modal-form">
                            <div className="form-group">
                                <label>Investment Name</label>
                                <input
                                    type="text"
                                    value={newInvestment.name}
                                    onChange={(e) => setNewInvestment({ ...newInvestment, name: e.target.value })}
                                    placeholder="e.g., S&P 500 Index Fund"
                                    required
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Type</label>
                                    <select
                                        value={newInvestment.type}
                                        onChange={(e) => setNewInvestment({ ...newInvestment, type: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Type</option>
                                        <option value="Stocks">Stocks</option>
                                        <option value="Mutual Fund">Mutual Fund</option>
                                        <option value="ETF">ETF</option>
                                        <option value="Bonds">Bonds</option>
                                        <option value="REIT">REIT</option>
                                        <option value="Crypto">Cryptocurrency</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Category</label>
                                    <input
                                        type="text"
                                        value={newInvestment.category}
                                        onChange={(e) => setNewInvestment({ ...newInvestment, category: e.target.value })}
                                        placeholder="e.g., Technology, Healthcare"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Initial Amount ($)</label>
                                    <input
                                        type="number"
                                        value={newInvestment.initialAmount}
                                        onChange={(e) => setNewInvestment({ ...newInvestment, initialAmount: e.target.value })}
                                        placeholder="5000"
                                        min="0"
                                        step="0.01"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Monthly Contribution ($)</label>
                                    <input
                                        type="number"
                                        value={newInvestment.monthlyContribution}
                                        onChange={(e) => setNewInvestment({ ...newInvestment, monthlyContribution: e.target.value })}
                                        placeholder="500"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Risk Level</label>
                                    <select
                                        value={newInvestment.risk}
                                        onChange={(e) => setNewInvestment({ ...newInvestment, risk: e.target.value })}
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Expected Annual Return (%)</label>
                                    <input
                                        type="number"
                                        value={newInvestment.expectedReturn}
                                        onChange={(e) => setNewInvestment({ ...newInvestment, expectedReturn: e.target.value })}
                                        placeholder="10"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                    />
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => setShowAddModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn-primary"
                                    onClick={handleAddInvestment}
                                >
                                    Add Investment
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Investments;