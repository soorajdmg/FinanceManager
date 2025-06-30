import React, { useEffect, useRef, useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, PieChart, Activity, ArrowUpRight, ArrowDownRight, Eye, MoreHorizontal, Car, Bus, Plane, Fuel, Dumbbell } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const incomeExpenseChartRef = useRef(null);
  const expensePieChartRef = useRef(null);
  const [chartInstances, setChartInstances] = useState({ line: null, pie: null });
  const [isLoaded, setIsLoaded] = useState(false);

  // Dashboard data with refined presentation and card themes
  const dashboardCards = [
    {
      title: 'Total Balance',
      value: '$12,450.80',
      change: '+8.2%',
      changeText: 'from last month',
      isPositive: true,
      icon: DollarSign,
      color: 'icon',
    },
    {
      title: 'Savings Rate',
      value: '26.2%',
      change: '+2.1%',
      changeText: 'from last month',
      isPositive: true,
      icon: PieChart,
      color: 'violet',
    },
    {
      title: 'Monthly Income',
      value: '$5,200.00',
      change: '+3.1%',
      changeText: 'from last month',
      isPositive: true,
      icon: TrendingUp,
      color: 'blue',
    },
    {
      title: 'Monthly Expenses',
      value: '$3,840.25',
      change: '+12.5%',
      changeText: 'from last month',
      isPositive: false,
      icon: TrendingDown,
      color: 'amber',
    }
  ];

  const recentTransactions = [
    {
      id: 1,
      date: '03 Aug 2022, 15:43',
      description: 'Taxi Trips',
      category: 'Transport',
      amount: 56.50,
      isPositive: false,
      status: 'completed',
      icon: Car
    },
    {
      id: 2,
      date: '01 Aug 2022, 12:58',
      description: 'Public Transport',
      category: 'Transport',
      amount: 2.50,
      isPositive: false,
      status: 'completed',
      icon: Bus
    },
    {
      id: 3,
      date: '28 Jul 2022, 21:40',
      description: 'Plane Tickets',
      category: 'Travel',
      amount: 70.00,
      isPositive: false,
      status: 'completed',
      icon: Plane
    },
    {
      id: 4,
      date: '28 Jul 2022, 09:28',
      description: 'Gas Station',
      category: 'Transport',
      amount: 30.75,
      isPositive: false,
      status: 'completed',
      icon: Fuel
    },
    {
      id: 5,
      date: '26 Jul 2022, 18:25',
      description: 'Gym',
      category: 'Health',
      amount: 100.00,
      isPositive: false,
      status: 'completed',
      icon: Dumbbell
    }
  ];

  useEffect(() => {
    setIsLoaded(true);
    const initCharts = async () => {
      // Simulated chart initialization
      console.log('Charts initialized');
    };

    initCharts();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getColorClasses = (color) => {
    const colors = {
      emerald: 'icon-emerald',
      blue: 'icon-blue',
      amber: 'icon-amber',
      violet: 'icon-violet'
    };
    return colors[color] || colors.blue;
  };

  const getThemeClass = (theme) => {
    const themes = {
      'white': 'card-white'
    };
    return themes[theme] || themes.white;
  };

  return (
    <div className={`dashboard-container ${isLoaded ? 'loaded' : ''}`}>
      {/* Header Section */}
      <div className="dashboard-padding">
        <div className="dashboard-max-width">
          {/* Stats Cards */}
          <div className="stats-grid">
            {dashboardCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <div
                  key={index}
                  className={`stat-card ${getThemeClass(card.theme)}`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="card-hover-overlay"></div>

                  <div className="card-content">
                    <div className="card-header">
                      <div className={`card-icon ${getColorClasses(card.color)}`}>
                        <Icon className="icon" />
                      </div>
                      <MoreHorizontal className="more-icon" />
                    </div>

                    <div className="card-body">
                      <p className="card-title">{card.title}</p>
                      <p className="card-value">{card.value}</p>
                      <div className="card-change">
                        <span className={`change-value ${card.isPositive ? 'positive' : 'negative'}`}>
                          {card.change + ' '}
                        </span>
                        <span className="change-text">{card.changeText}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Charts Section */}
          <div className="charts-grid">
            {/* Income vs Expenses Chart */}
            <div className="chart-card chart-main">
              <div className="chart-header">
                <div className="chart-title-section">
                  <h3 className="chart-title">Income vs Expenses</h3>
                  <p className="chart-subtitle">Last 6 months performance</p>
                </div>
                <div className="chart-legend">
                  <div className="legend-item">
                    <div className="legend-dot emerald"></div>
                    <span className="legend-text">Income</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-dot red"></div>
                    <span className="legend-text">Expenses</span>
                  </div>
                </div>
              </div>

              <div className="chart-placeholder">
                <div className="chart-placeholder-content">
                  <Activity className="chart-icon" />
                  <p className="chart-placeholder-text">Chart visualization would render here</p>
                </div>
              </div>
            </div>

            {/* Expense Categories */}
            <div className="chart-card chart-secondary">
              <div className="chart-header-simple">
                <h3 className="chart-title">Expense Categories</h3>
                <p className="chart-subtitle">This month breakdown</p>
              </div>

              <div className="chart-placeholder chart-placeholder-small">
                <div className="chart-placeholder-content">
                  <PieChart className="chart-icon" />
                  <p className="chart-placeholder-text">Pie chart would render here</p>
                </div>
              </div>

              <div className="expense-breakdown">
                {[
                  { label: 'Housing', amount: 1200, color: 'blue' },
                  { label: 'Food', amount: 450, color: 'emerald' },
                  { label: 'Transport', amount: 320, color: 'violet' },
                  { label: 'Utilities', amount: 180, color: 'amber' }
                ].map((item, index) => (
                  <div key={index} className="expense-item">
                    <div className="expense-info">
                      <div className={`expense-dot ${item.color}`}></div>
                      <span className="expense-label">{item.label}</span>
                    </div>
                    <span className="expense-amount">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Transactions - Updated to match screenshot */}
          <div className="transactions-card-new">
            <div className="transactions-header-new">
              <h3 className="transactions-title-new">Recent transactions</h3>
              <select className="sort-dropdown">
                <option>Sort by</option>
                <option>Date</option>
                <option>Amount</option>
                <option>Category</option>
              </select>
            </div>

            <div className="transactions-list-new">
              {recentTransactions.map((transaction, index) => {
                const IconComponent = transaction.icon;
                return (
                  <div
                    key={transaction.id}
                    className="transaction-item-new"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="transaction-content-new">
                      <div className="transaction-left-new">
                        <div className="transaction-icon">
                          <IconComponent className="transaction-icon-svg" />
                        </div>

                        <div className="transaction-details-new">
                          <p className="transaction-description-new">{transaction.description}</p>
                          <p className="transaction-date-new">{transaction.date}</p>
                        </div>
                      </div>

                      <div className="transaction-right-new">
                        <p className="transaction-amount-new">
                          ${transaction.amount.toFixed(2)}
                        </p>
                        <MoreHorizontal className="transaction-more-icon" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;