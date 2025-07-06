import React, { useEffect, useState, useMemo } from 'react';
import {
    Search,
    Filter,
    ChevronDown,
    ArrowUpRight,
    ArrowDownLeft,
    User,
    Building2,
    ShoppingCart,
    Car,
    Utensils,
    Home,
    Gamepad2,
    Heart,
    Plane,
    MoreHorizontal
} from 'lucide-react';
import './Transaction.css';

const Transaction = () => {
    const API_BASE_URL = 'http://localhost:5000/api';
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [scrollButtonClass, setScrollButtonClass] = useState('');
    const [isFirstShow, setIsFirstShow] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState('desc');
    const [filterType, setFilterType] = useState('all');
    const [showFilters, setShowFilters] = useState(false);

    const [transactionsData, setTransactionsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Add useEffect to fetch data
    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const token = localStorage.getItem('authToken'); // Same key as your auth

                if (!token) {
                    throw new Error('No authentication token found');
                }

                console.log('Making transactions request to:', `${API_BASE_URL}/transactions`);

                const response = await fetch(`${API_BASE_URL}/transactions`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                console.log('Response:', response);

                // Check if response is JSON (same pattern as your auth)
                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    const textResponse = await response.text();
                    console.log('Non-JSON response:', textResponse);
                    throw new Error(`Server error: ${textResponse}`);
                }

                const data = await response.json();
                console.log("Data received: ", data)

                if (!response.ok) {
                    throw new Error(data.message || 'Failed to fetch transactions');
                }

                // Assuming your backend returns { success: true, data: [...] }
                // Adjust based on your actual response structure
                setTransactionsData(data.data || data);
            } catch (err) {
                console.error('Fetch transactions error:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, []);

    // Add scroll to top functionality
    useEffect(() => {
        const handleScroll = () => {
            const shouldShow = window.scrollY > 300;

            if (shouldShow && !showScrollTop) {
                setShowScrollTop(true);
                setScrollButtonClass(isFirstShow ? 'show first-show' : 'show');
                if (isFirstShow) {
                    setIsFirstShow(false);
                }
            } else if (!shouldShow && showScrollTop) {
                setScrollButtonClass('hide');
                // Hide the button after animation completes
                setTimeout(() => setShowScrollTop(false), 300);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [showScrollTop, isFirstShow]);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    const getCategoryIcon = (category) => {
        const icons = {
            food: Utensils,
            work: Building2,
            shopping: ShoppingCart,
            transport: Car,
            entertainment: Gamepad2,
            personal: User,
            housing: Home,
            travel: Plane,
            health: Heart
        };
        return icons[category] || User;
    };

    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount);
    };

    const toCamelCase = (str) => {
        if (!str) return '';
        return str.toLowerCase().split(' ').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    // Filter and sort transactions
    const filteredAndSortedTransactions = useMemo(() => {
        let filtered = transactionsData.filter(transaction => {
            // Safe search matching
            const recipient = transaction.recipient || '';
            const description = transaction.description || '';
            const category = transaction.category || '';

            const matchesSearch =
                recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
                description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                category.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesFilter = filterType === 'all' ||
                (filterType === 'received' && transaction.type === 'credit') ||
                (filterType === 'sent' && transaction.type === 'debit');

            return matchesSearch && matchesFilter;
        });

        // Sort transactions
        filtered.sort((a, b) => {
            let aVal, bVal;

            switch (sortBy) {
                case 'date':
                    aVal = new Date(a.transactionDate);
                    bVal = new Date(b.transactionDate);
                    break;
                case 'amount':
                    aVal = a.amount;
                    bVal = b.amount;
                    break;
                case 'name':
                    aVal = a.name.toLowerCase();
                    bVal = b.name.toLowerCase();
                    break;
                default:
                    aVal = new Date(a.date + ' ' + a.time);
                    bVal = new Date(b.date + ' ' + b.time);
            }

            if (sortOrder === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });

        return filtered;
    }, [searchTerm, sortBy, sortOrder, filterType, transactionsData]);

    const totalSent = transactionsData
        .filter(t => t.type === 'debit')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const totalReceived = transactionsData
        .filter(t => t.type === 'credit')
        .reduce((sum, t) => sum + t.amount, 0);

    return (
        <div className="transaction-container">
            <div className="transaction-padding">
                <div className="transaction-max-width">
                    {/* Controls */}
                    <div className="transaction-controls">
                        <div className="search-container">
                            <Search className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search transactions..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>

                        <div className="control-buttons">
                            <div className="sort-container">
                                <select
                                    value={`${sortBy}-${sortOrder}`}
                                    onChange={(e) => {
                                        const [field, order] = e.target.value.split('-');
                                        setSortBy(field);
                                        setSortOrder(order);
                                    }}
                                    className="sort-select"
                                >
                                    <option value="date-desc">Latest First</option>
                                    <option value="date-asc">Oldest First</option>
                                    <option value="amount-desc">Highest Amount</option>
                                    <option value="amount-asc">Lowest Amount</option>
                                    <option value="name-asc">Name A-Z</option>
                                    <option value="name-desc">Name Z-A</option>
                                </select>
                                <ChevronDown className="sort-icon" />
                            </div>

                            <button
                                className={`filter-button ${showFilters ? 'active' : ''}`}
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                <Filter className="filter-icon" />
                                Filter
                            </button>
                        </div>
                    </div>

                    {/* Filter Panel */}
                    {showFilters && (
                        <div className="filter-panel">
                            <div className="filter-group">
                                <span className="filter-label">Transaction Type:</span>
                                <div className="filter-options">
                                    <button
                                        className={`filter-option ${filterType === 'all' ? 'active' : ''}`}
                                        onClick={() => setFilterType('all')}
                                    >
                                        All
                                    </button>
                                    <button
                                        className={`filter-option ${filterType === 'received' ? 'active' : ''}`}
                                        onClick={() => setFilterType('received')}
                                    >
                                        Received
                                    </button>
                                    <button
                                        className={`filter-option ${filterType === 'sent' ? 'active' : ''}`}
                                        onClick={() => setFilterType('sent')}
                                    >
                                        Sent
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* Transactions List */}
                    <div className="transactions-card">
                        <div className="transactions-list">
                            {loading ? (
                                <div className="no-transactions">
                                    <p>Loading transactions...</p>
                                </div>
                            ) : error ? (
                                <div className="no-transactions">
                                    <p>Error: {error}</p>
                                </div>
                            ) : filteredAndSortedTransactions.length === 0 ? (
                                <div className="no-transactions">
                                    <p>No transactions found. Add transactions to get started.</p>
                                </div>
                            ) : (
                                filteredAndSortedTransactions.map((transaction, index) => {
                                    const IconComponent = getCategoryIcon(transaction.category);
                                    const ArrowIcon = transaction.type === 'debit' ? ArrowUpRight : ArrowDownLeft;

                                    return (
                                        <div
                                            key={transaction.id}
                                            className="transaction-item"
                                            style={{ animationDelay: `${index * 50}ms` }}
                                        >
                                            <div className="transaction-content">
                                                {/* Left Section - Icon & Details */}
                                                <div className="transaction-left">
                                                    <div className="transaction-icon">
                                                        <ArrowIcon className="arrow-icon" />
                                                    </div>

                                                    <div className="transaction-details">
                                                        <div className="transaction-main-info">
                                                            <p className="transaction-name">{toCamelCase(transaction.recipient) || 'Unknown Recipient'}</p>
                                                            <p className="transaction-description">{transaction.category || 'Uncategorized'}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Middle Section - Date */}
                                                <div className="transaction-middle">
                                                    <div className="transaction-date">
                                                        {formatDateTime(transaction.transactionDate)}
                                                    </div>
                                                </div>

                                                {/* Right Section - Amount & Arrow */}
                                                <div className="transaction-right">
                                                    <div className="amount-section">
                                                        <p className={`transaction-amount ${transaction.type}`}>
                                                            {transaction.type === 'debit' ? '-' : '+'}
                                                            {formatCurrency(Math.abs(transaction.amount))}
                                                        </p>
                                                    </div>
                                                    <MoreHorizontal className="more-icon" />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
                {/* Scroll to Top Button */}
                {showScrollTop && (
                    <button
                        className={`scroll-to-top ${scrollButtonClass}`}
                        onClick={scrollToTop}
                        aria-label="Scroll to top"
                    >
                        <ChevronDown className="scroll-icon" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default Transaction;