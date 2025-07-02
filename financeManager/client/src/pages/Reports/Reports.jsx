import React, { useState, useEffect } from 'react';
import './Reports.css';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('monthly');
  const [selectedDateRange, setSelectedDateRange] = useState('last-30-days');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [reportType, setReportType] = useState('spending');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [isCustomDate, setIsCustomDate] = useState(false);

  // Sample data - replace with your actual data
  const sampleData = {
    monthlyReports: {
      totalSpent: 3240.50,
      totalIncome: 5500.00,
      savingsRate: 41.1,
      topCategories: [
        { name: 'Groceries', amount: 650.00, percentage: 20.1 },
        { name: 'Dining Out', amount: 420.00, percentage: 13.0 },
        { name: 'Transportation', amount: 380.00, percentage: 11.7 },
        { name: 'Entertainment', amount: 290.00, percentage: 8.9 }
      ],
      monthComparison: [
        { month: 'Jan', spending: 2800, income: 5500 },
        { month: 'Feb', spending: 3100, income: 5500 },
        { month: 'Mar', spending: 3240, income: 5500 }
      ]
    },
    categories: [
      'All Categories', 'Groceries', 'Dining Out', 'Transportation', 
      'Entertainment', 'Utilities', 'Healthcare', 'Shopping', 'Bills'
    ],
    trendData: [
      { period: '3 Months', spending: 9140, change: '+5.2%' },
      { period: '6 Months', spending: 18250, change: '+3.8%' },
      { period: '12 Months', spending: 35420, change: '+7.1%' }
    ]
  };

  const handleDateRangeChange = (range) => {
    setSelectedDateRange(range);
    setIsCustomDate(range === 'custom');
  };

  const generateReport = () => {
    // Logic to generate report based on selected filters
    console.log('Generating report with filters:', {
      dateRange: selectedDateRange,
      category: selectedCategory,
      reportType: reportType,
      customDate: customDateRange
    });
  };

  const exportReport = (format) => {
    console.log(`Exporting report as ${format}`);
    // Logic to export report
  };

  return (
    <div className="reports-container">
      <div className="reports-padding">
        <div className="reports-max-width">
          
          {/* Header Section */}
          <div className="reports-header">
            <div className="reports-title-section">
              <h1 className="reports-main-title">Financial Reports</h1>
              <p className="reports-subtitle">Analyze your spending patterns and financial trends</p>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="reports-filters">
            <div className="filter-group">
              <label className="filter-label">Date Range</label>
              <select 
                className="filter-select"
                value={selectedDateRange}
                onChange={(e) => handleDateRangeChange(e.target.value)}
              >
                <option value="last-7-days">Last 7 Days</option>
                <option value="last-30-days">Last 30 Days</option>
                <option value="last-3-months">Last 3 Months</option>
                <option value="last-6-months">Last 6 Months</option>
                <option value="last-year">Last Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {isCustomDate && (
              <div className="custom-date-group">
                <div className="date-input-group">
                  <label className="filter-label">From</label>
                  <input 
                    type="date" 
                    className="date-input"
                    value={customDateRange.startDate}
                    onChange={(e) => setCustomDateRange({...customDateRange, startDate: e.target.value})}
                  />
                </div>
                <div className="date-input-group">
                  <label className="filter-label">To</label>
                  <input 
                    type="date" 
                    className="date-input"
                    value={customDateRange.endDate}
                    onChange={(e) => setCustomDateRange({...customDateRange, endDate: e.target.value})}
                  />
                </div>
              </div>
            )}

            <div className="filter-group">
              <label className="filter-label">Category</label>
              <select 
                className="filter-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {sampleData.categories.map((category, index) => (
                  <option key={index} value={category.toLowerCase().replace(' ', '-')}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Report Type</label>
              <select 
                className="filter-select"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                <option value="spending">Spending Analysis</option>
                <option value="income">Income Analysis</option>
              </select>
            </div>

            <button className="generate-btn" onClick={generateReport}>
              Generate Report
            </button>
          </div>

          {/* Report Tabs */}
          <div className="reports-tabs">
            <button 
              className={`tab-btn ${activeTab === 'monthly' ? 'active' : ''}`}
              onClick={() => setActiveTab('monthly')}
            >
              Monthly Reports
            </button>
            <button 
              className={`tab-btn ${activeTab === 'trends' ? 'active' : ''}`}
              onClick={() => setActiveTab('trends')}
            >
              Trend Analysis
            </button>
            <button 
              className={`tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
              onClick={() => setActiveTab('categories')}
            >
              Category Deep Dive
            </button>
            <button 
              className={`tab-btn ${activeTab === 'custom' ? 'active' : ''}`}
              onClick={() => setActiveTab('custom')}
            >
              Custom Reports
            </button>
          </div>

          {/* Monthly Reports Tab */}
          {activeTab === 'monthly' && (
            <div className="tab-content">
              <div className="reports-grid">
                
                {/* Summary Cards */}
                <div className="summary-cards">
                  <div className="summary-card">
                    <div className="summary-icon income">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div className="summary-content">
                      <h3 className="summary-title">Total Income</h3>
                      <p className="summary-value">${sampleData.monthlyReports.totalIncome.toLocaleString()}</p>
                      <span className="summary-change positive">+2.5% from last month</span>
                    </div>
                  </div>

                  <div className="summary-card">
                    <div className="summary-icon expense">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="summary-content">
                      <h3 className="summary-title">Total Expenses</h3>
                      <p className="summary-value">${sampleData.monthlyReports.totalSpent.toLocaleString()}</p>
                      <span className="summary-change negative">+8.2% from last month</span>
                    </div>
                  </div>

                  <div className="summary-card">
                    <div className="summary-icon savings">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div className="summary-content">
                      <h3 className="summary-title">Savings Rate</h3>
                      <p className="summary-value">{sampleData.monthlyReports.savingsRate}%</p>
                      <span className="summary-change positive">+1.3% from last month</span>
                    </div>
                  </div>
                </div>

                {/* Top Categories */}
                <div className="report-card">
                  <div className="report-card-header">
                    <h3 className="report-card-title">Top Spending Categories</h3>
                    <p className="report-card-subtitle">Current month breakdown</p>
                  </div>
                  <div className="categories-list">
                    {sampleData.monthlyReports.topCategories.map((category, index) => (
                      <div key={index} className="category-item">
                        <div className="category-info">
                          <div className="category-dot" style={{backgroundColor: `hsl(${index * 60}, 70%, 60%)`}}></div>
                          <span className="category-name">{category.name}</span>
                        </div>
                        <div className="category-stats">
                          <span className="category-amount">${category.amount.toLocaleString()}</span>
                          <span className="category-percentage">{category.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Month Comparison Chart */}
                <div className="report-card full-width">
                  <div className="report-card-header">
                    <h3 className="report-card-title">Monthly Comparison</h3>
                    <p className="report-card-subtitle">Income vs Expenses trend</p>
                  </div>
                  <div className="chart-placeholder">
                    <div className="chart-placeholder-content">
                      <svg className="chart-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <p className="chart-placeholder-text">Chart visualization would be displayed here</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Trend Analysis Tab */}
          {activeTab === 'trends' && (
            <div className="tab-content">
              <div className="reports-grid">
                <div className="report-card">
                  <div className="report-card-header">
                    <h3 className="report-card-title">Spending Trends</h3>
                    <p className="report-card-subtitle">Historical spending patterns</p>
                  </div>
                  <div className="trends-list">
                    {sampleData.trendData.map((trend, index) => (
                      <div key={index} className="trend-item">
                        <div className="trend-period">{trend.period}</div>
                        <div className="trend-amount">${trend.spending.toLocaleString()}</div>
                        <div className={`trend-change ${trend.change.startsWith('+') ? 'positive' : 'negative'}`}>
                          {trend.change}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="report-card">
                  <div className="report-card-header">
                    <h3 className="report-card-title">Seasonal Patterns</h3>
                    <p className="report-card-subtitle">Spending by season</p>
                  </div>
                  <div className="chart-placeholder chart-placeholder-small">
                    <div className="chart-placeholder-content">
                      <svg className="chart-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="chart-placeholder-text">Seasonal chart</p>
                    </div>
                  </div>
                </div>

                <div className="report-card full-width">
                  <div className="report-card-header">
                    <h3 className="report-card-title">12-Month Trend</h3>
                    <p className="report-card-subtitle">Complete yearly overview</p>
                  </div>
                  <div className="chart-placeholder">
                    <div className="chart-placeholder-content">
                      <svg className="chart-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      <p className="chart-placeholder-text">12-month trend line chart</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Category Deep Dive Tab */}
          {activeTab === 'categories' && (
            <div className="tab-content">
              <div className="reports-grid">
                <div className="report-card full-width">
                  <div className="report-card-header">
                    <h3 className="report-card-title">Category Analysis</h3>
                    <p className="report-card-subtitle">Detailed breakdown by category</p>
                  </div>
                  <div className="category-selector">
                    <select className="category-select">
                      <option>Select category to analyze</option>
                      {sampleData.categories.slice(1).map((category, index) => (
                        <option key={index} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  <div className="chart-placeholder">
                    <div className="chart-placeholder-content">
                      <svg className="chart-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                      </svg>
                      <p className="chart-placeholder-text">Category-specific analysis chart</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Custom Reports Tab */}
          {activeTab === 'custom' && (
            <div className="tab-content">
              <div className="reports-grid">
                <div className="report-card">
                  <div className="report-card-header">
                    <h3 className="report-card-title">Tax-Related Expenses</h3>
                    <p className="report-card-subtitle">Deductible expenses summary</p>
                  </div>
                  <div className="tax-summary">
                    <div className="tax-item">
                      <span className="tax-label">Business Meals</span>
                      <span className="tax-amount">$1,240.00</span>
                    </div>
                    <div className="tax-item">
                      <span className="tax-label">Office Supplies</span>
                      <span className="tax-amount">$340.00</span>
                    </div>
                    <div className="tax-item">
                      <span className="tax-label">Travel Expenses</span>
                      <span className="tax-amount">$890.00</span>
                    </div>
                    <div className="tax-item">
                      <span className="tax-label">Professional Services</span>
                      <span className="tax-amount">$560.00</span>
                    </div>
                  </div>
                </div>

                <div className="report-card">
                  <div className="report-card-header">
                    <h3 className="report-card-title">Business vs Personal</h3>
                    <p className="report-card-subtitle">Expense classification</p>
                  </div>
                  <div className="business-personal-split">
                    <div className="split-item business">
                      <div className="split-label">Business Expenses</div>
                      <div className="split-amount">$2,450.00</div>
                      <div className="split-percentage">75.6%</div>
                    </div>
                    <div className="split-item personal">
                      <div className="split-label">Personal Expenses</div>
                      <div className="split-amount">$790.50</div>
                      <div className="split-percentage">24.4%</div>
                    </div>
                  </div>
                </div>

                <div className="report-card full-width">
                  <div className="report-card-header">
                    <h3 className="report-card-title">Custom Date Range Analysis</h3>
                    <p className="report-card-subtitle">Expenses for selected period</p>
                  </div>
                  <div className="chart-placeholder">
                    <div className="chart-placeholder-content">
                      <svg className="chart-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <p className="chart-placeholder-text">Custom period analysis</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Reports;