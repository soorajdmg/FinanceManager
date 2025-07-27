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
  const [darkMode, setDarkMode] = useState(false);

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

  const getTimeframeMonths = (timeframe) => {
    switch(timeframe) {
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
    switch(risk) {
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

                return (
                  <div key={investment.id} className="investment-category-item">
                    <div className="category-item-header">
                      <div className="category-item-left">
                        <div className="category-icon">
                          <BarChart3 />
                        </div>
                        <div className="category-info">
                          <h3 className="category-name">{investment.name}</h3>
                          <p className="category-budget">{investment.type} • {investment.category}</p>
                          <div className="investment-meta">
                            <span className={`risk-badge ${getRiskColor(investment.risk)}`}>
                              {investment.risk} Risk
                            </span>
                            <span className="expected-return">
                              Expected: {investment.expectedReturn}% annually
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="category-item-stats">
                        <div className="category-stat">
                          <span className="stat-label">Current Value</span>
                          <span className="stat-value">${investment.currentValue.toLocaleString()}</span>
                        </div>
                        <div className="category-stat">
                          <span className="stat-label">Monthly Investment</span>
                          <span className="stat-value">${investment.monthlyContribution}</span>
                        </div>
                        <div className="category-stat">
                          <span className="stat-label">Current Return</span>
                          <span className={`stat-value ${getPerformanceColor(investment.currentValue, investment.initialAmount)}`}>
                            {currentReturn >= 0 ? '+' : ''}{currentReturn.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      <div className="category-actions">
                        <button className="action-btn">
                          <Edit size={16} />
                        </button>
                        <button 
                          className="action-btn"
                          onClick={() => deleteInvestment(investment.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Projection Section */}
                    <div className="projection-section">
                      <div className="projection-header">
                        <h4 className="projection-title">
                          <Calendar size={16} />
                          {selectedTimeframe === '1month' ? '1 Month' : 
                           selectedTimeframe === '6months' ? '6 Months' :
                           selectedTimeframe === '1year' ? '1 Year' : '5 Years'} Projection
                        </h4>
                      </div>
                      
                      <div className="projection-stats">
                        <div className="projection-stat">
                          <span className="projection-label">Projected Value</span>
                          <span className="projection-value">${projectedValue.toLocaleString()}</span>
                        </div>
                        <div className="projection-stat">
                          <span className="projection-label">Projected Gain</span>
                          <span className={`projection-value ${projectedGain >= 0 ? 'positive' : 'negative'}`}>
                            {projectedGain >= 0 ? '+' : ''}${projectedGain.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Balance Analysis */}
                    <div className="balance-analysis">
                      <div className="balance-header">
                        <h4 className="balance-title">
                          <Target size={16} />
                          Annual Investment Analysis
                        </h4>
                      </div>
                      
                      <div className="balance-status">
                        {isBalanceSufficient ? (
                          <div className="balance-sufficient">
                            <CheckCircle size={16} className="status-icon" />
                            <span>Your balance is sufficient for annual contributions (${investment.monthlyContribution * 12}/year)</span>
                          </div>
                        ) : (
                          <div className="balance-insufficient">
                            <AlertCircle size={16} className="status-icon" />
                            <span>Need ${shortfall.toLocaleString()} more for full annual contributions</span>
                          </div>
                        )}
                      </div>
                    </div>
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
                  onChange={(e) => setNewInvestment({...newInvestment, name: e.target.value})}
                  placeholder="e.g., S&P 500 Index Fund"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Type</label>
                  <select
                    value={newInvestment.type}
                    onChange={(e) => setNewInvestment({...newInvestment, type: e.target.value})}
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
                    onChange={(e) => setNewInvestment({...newInvestment, category: e.target.value})}
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
                    onChange={(e) => setNewInvestment({...newInvestment, initialAmount: e.target.value})}
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
                    onChange={(e) => setNewInvestment({...newInvestment, monthlyContribution: e.target.value})}
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
                    onChange={(e) => setNewInvestment({...newInvestment, risk: e.target.value})}
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
                    onChange={(e) => setNewInvestment({...newInvestment, expectedReturn: e.target.value})}
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