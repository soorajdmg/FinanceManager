import React, { useEffect, useRef, useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, PieChart, Activity, ArrowUpRight, ArrowDownRight, Eye, MoreHorizontal, Car, Bus, Plane, Fuel, Dumbbell, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import './Dashboard.css';


// Move AnimatedPieChart outside of Dashboard component
const AnimatedPieChart = ({ data, size = 200, isDarkMode }) => {
  const svgRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  const total = data.reduce((sum, item) => sum + item.amount, 0);
  const radius = size / 2 - 10;
  const centerX = size / 2;
  const centerY = size / 2;

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const createPath = (startAngle, endAngle) => {
    const start = polarToCartesian(centerX, centerY, radius, endAngle);
    const end = polarToCartesian(centerX, centerY, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return [
      "M", centerX, centerY,
      "L", start.x, start.y,
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      "Z"
    ].join(" ");
  };

  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  const getColor = (colorName) => {
    const colors = {
      blue: '#3b82f6',
      emerald: '#10b981',
      violet: '#8b5cf6',
      amber: '#f59e0b'
    };
    return colors[colorName] || colors.blue;
  };

  let currentAngle = 0;

  return (
    <div className="pie-chart-container">
      <svg
        ref={svgRef}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="pie-chart-svg"
      >
        <defs>
          {data.map((item, index) => (
            <linearGradient key={index} id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={getColor(item.color)} stopOpacity="1" />
              <stop offset="100%" stopColor={getColor(item.color)} stopOpacity="0.8" />
            </linearGradient>
          ))}
        </defs>

        {data.map((item, index) => {
          const angle = (item.amount / total) * 360;
          const path = createPath(currentAngle, currentAngle + angle);
          currentAngle += angle;

          return (
            <path
              key={index}
              d={path}
              fill={`url(#gradient-${index})`}
              stroke={isDarkMode ? "#1e293b" : "white"}
              strokeWidth="2"
              className="pie-slice"
              style={{
                transformOrigin: `${centerX}px ${centerY}px`,
                animation: isVisible ? `pieSliceGrow 0.8s ease-out ${index * 0.1}s both` : 'none'
              }}
            />
          );
        })}

        <circle
          cx={centerX}
          cy={centerY}
          r="3"
          fill={isDarkMode ? "#1e293b" : "white"}
          className="center-dot"
          style={{
            animation: isVisible ? 'centerDotPulse 2s ease-in-out infinite 1s' : 'none'
          }}
        />
      </svg>
    </div>
  );
};

const Dashboard = ({ isDarkMode, userId }) => {
  const incomeExpenseChartRef = useRef(null);
  const [chartInstances, setChartInstances] = useState({ line: null, pie: null });
  const [isLoaded, setIsLoaded] = useState(false);

  // Backend integration state
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // API base URL - adjust according to your backend
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Fetch stats from backend
  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token'); // Adjust based on your auth implementation

      const response = await fetch(`${API_BASE_URL}/stats/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch category breakdown
  const fetchCategoryBreakdown = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/stats/${userId}/categories`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (err) {
      console.error('Error fetching category breakdown:', err);
    }
    return null;
  };

  // Refresh stats
  const refreshStats = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/stats/${userId}/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await fetchStats();
      }
    } catch (err) {
      console.error('Error refreshing stats:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (userId) {
      fetchStats();
    }
  }, [userId]);

  // Generate dashboard cards from stats
  const generateDashboardCards = () => {
    if (!stats) return [];

    const calculateChange = (current, previous) => {
      if (!previous || previous === 0) return 0;
      return ((current - previous) / previous) * 100;
    };

    return [
      {
        title: 'Total Balance',
        value: `₹${stats.totalBalance?.toLocaleString() || '0.00'}`,
        change: `${stats.monthlyGrowth?.netWorth >= 0 ? '+' : ''}${stats.monthlyGrowth?.netWorth?.toFixed(1) || '0.0'}%`,
        changeText: 'from last month',
        isPositive: (stats.monthlyGrowth?.netWorth || 0) >= 0,
        icon: DollarSign,
        color: 'icon',
      },
      {
        title: 'Savings Rate',
        value: `${stats.savingsRate?.toFixed(1) || '0.0'}%`,
        change: `${stats.monthlyGrowth?.savings >= 0 ? '+' : ''}${stats.monthlyGrowth?.savings?.toFixed(1) || '0.0'}%`,
        changeText: 'from last month',
        isPositive: (stats.monthlyGrowth?.savings || 0) >= 0,
        icon: PieChart,
        color: 'violet',
      },
      {
        title: 'Monthly Income',
        value: `₹${stats.monthlyIncome?.toLocaleString() || '0.00'}`,
        change: `${stats.monthlyGrowth?.income >= 0 ? '+' : ''}${stats.monthlyGrowth?.income?.toFixed(1) || '0.0'}%`,
        changeText: 'from last month',
        isPositive: (stats.monthlyGrowth?.income || 0) >= 0,
        icon: TrendingUp,
        color: 'blue',
      },
      {
        title: 'Monthly Expenses',
        value: `₹${stats.monthlyExpenses?.toLocaleString() || '0.00'}`,
        change: `${stats.monthlyGrowth?.expenses >= 0 ? '+' : ''}${stats.monthlyGrowth?.expenses?.toFixed(1) || '0.0'}%`,
        changeText: 'from last month',
        isPositive: (stats.monthlyGrowth?.expenses || 0) < 0, // Negative expense growth is positive
        icon: TrendingDown,
        color: 'amber',
      }
    ];
  };

  // Generate chart data from stats
  const generateChartData = () => {
    if (!stats || !stats.monthlyTrends) return null;

    const last6Months = stats.monthlyTrends.slice(-6);

    return {
      labels: last6Months.map(trend => `${trend.month} ${trend.year}`),
      datasets: [
        {
          label: 'Income',
          data: last6Months.map(trend => trend.income),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointBackgroundColor: '#10b981',
          pointBorderColor: isDarkMode ? '#1e293b' : '#ffffff',
          pointBorderWidth: 2,
        },
        {
          label: 'Expenses',
          data: last6Months.map(trend => trend.expenses),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointBackgroundColor: '#ef4444',
          pointBorderColor: isDarkMode ? '#1e293b' : '#ffffff',
          pointBorderWidth: 2,
        }
      ]
    };
  };

  // Generate pie chart data from category spending
  const generatePieChartData = () => {
    if (!stats || !stats.categorySpending) return [];

    const colors = ['blue', 'emerald', 'violet', 'amber', 'red'];

    return stats.categorySpending.slice(0, 5).map((category, index) => ({
      label: category.category,
      amount: category.amount,
      color: colors[index % colors.length]
    }));
  };

  // Chart initialization
  useEffect(() => {
    if (!stats) return;

    setIsLoaded(true);

    const initChart = async () => {
      if (typeof window.Chart === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js';
        script.onload = () => {
          createChart();
        };
        document.head.appendChild(script);
      } else {
        createChart();
      }
    };

    const createChart = () => {
      const chartData = generateChartData();
      if (!chartData || !incomeExpenseChartRef.current) return;

      // Destroy existing chart if it exists
      if (chartInstances.line) {
        chartInstances.line.destroy();
      }

      const ctx = incomeExpenseChartRef.current.getContext('2d');

      const newChart = new window.Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(0, 0, 0, 0.8)',
              cornerRadius: 8,
              callbacks: {
                label: (context) => context.dataset.label + ': ₹' + context.parsed.y.toLocaleString()
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: isDarkMode ? '#94a3b8' : '#64748b' }
            },
            y: {
              grid: { color: isDarkMode ? '#334155' : '#f1f5f9' },
              ticks: {
                color: isDarkMode ? '#94a3b8' : '#64748b',
                callback: (value) => '₹' + (value / 1000) + 'k'
              }
            }
          }
        }
      });

      setChartInstances(prev => ({ ...prev, line: newChart }));
    };

    setTimeout(initChart, 100);
  }, [stats, isDarkMode]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getColorClasses = (color) => {
    const colors = {
      emerald: 'icon-emerald',
      blue: 'icon-blue',
      amber: 'icon-amber',
      violet: 'icon-violet',
      icon: 'icon-default'
    };
    return colors[color] || colors.blue;
  };

  const getThemeClass = (theme) => {
    const themes = {
      'white': 'card-white'
    };
    return themes[theme] || themes.white;
  };

  // Mock transaction data (you can replace this with real transaction data from your backend)
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

  // Loading state
  if (loading) {
    return (
      <div className={`dashboard-container ${isDarkMode ? 'dark' : ''}`}>
        <div className="dashboard-padding">
          <div className="dashboard-max-width">
            <div className="loading-container">
              <Loader2 className="loading-spinner" />
              <p className="loading-text">Loading your financial data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`dashboard-container ${isDarkMode ? 'dark' : ''}`}>
        <div className="dashboard-padding">
          <div className="dashboard-max-width">
            <div className="error-container">
              <AlertCircle className="error-icon" />
              <p className="error-text">Error loading dashboard data: {error}</p>
              <button
                onClick={fetchStats}
                className="retry-button"
              >
                <RefreshCw className="retry-icon" />
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const dashboardCards = generateDashboardCards();
  const pieChartData = generatePieChartData();

  return (
    <div
      className={`dashboard-container ${isDarkMode ? 'dark' : ''} ${isLoaded ? 'loaded' : ''}`}
    >
      {/* Header Section */}
      <div className="dashboard-padding">
        <div className="dashboard-max-width">
          {/* Header with refresh button */}
          <div className="dashboard-header">
            <div>
              <h1 className="dashboard-title">Financial Dashboard</h1>
              <p className="dashboard-subtitle">
                Last updated: {stats?.lastCalculated ? new Date(stats.lastCalculated).toLocaleDateString() : 'Never'}
              </p>
            </div>
            <button
              onClick={refreshStats}
              disabled={refreshing}
              className="refresh-button"
            >
              <RefreshCw className={`refresh-icon ${refreshing ? 'spinning' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

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
                  <p className="chart-subtitle">Monthly trends</p>
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

              <div className="chart-container">
                <canvas ref={incomeExpenseChartRef}></canvas>
              </div>
            </div>

            {/* Expense Categories */}
            <div className="chart-card chart-secondary">
              <div className="chart-header-simple">
                <h3 className="chart-title">Expense Categories</h3>
                <p className="chart-subtitle">Current breakdown</p>
              </div>

              <div className="pie-chart-wrapper">
                <AnimatedPieChart
                  data={pieChartData}
                  size={160}
                  isDarkMode={isDarkMode}
                />
              </div>

              <div className="expense-breakdown">
                {pieChartData.map((item, index) => (
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

          {/* Recent Transactions */}
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
                          ₹{transaction.amount.toFixed(2)}
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