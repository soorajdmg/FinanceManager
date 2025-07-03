import React, { useState, useMemo } from 'react';
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
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState('desc');
    const [filterType, setFilterType] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    
    // Static transactions data (you can replace this with your preferred data source)
    const transactionsData = [];

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

    const formatDateTime = (dateString, timeString) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = date.toLocaleDateString('en-US', { month: 'short' });
        const year = date.getFullYear();

        return `${day} ${month} ${year}, ${timeString}`;
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount);
    };

    // Filter and sort transactions
    const filteredAndSortedTransactions = useMemo(() => {
        let filtered = transactionsData.filter(transaction => {
            const matchesSearch = transaction.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                transaction.description.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesFilter = filterType === 'all' || transaction.type === filterType;

            return matchesSearch && matchesFilter;
        });

        // Sort transactions
        filtered.sort((a, b) => {
            let aVal, bVal;

            switch (sortBy) {
                case 'date':
                    aVal = new Date(a.date + ' ' + a.time);
                    bVal = new Date(b.date + ' ' + b.time);
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
        .filter(t => t.type === 'sent')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalReceived = transactionsData
        .filter(t => t.type === 'received')
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
                            {filteredAndSortedTransactions.length === 0 ? (
                                <div className="no-transactions">
                                    <p>No transactions found. Add transactions to get started.</p>
                                </div>
                            ) : (
                                filteredAndSortedTransactions.map((transaction, index) => {
                                    const IconComponent = getCategoryIcon(transaction.category);
                                    const ArrowIcon = transaction.type === 'sent' ? ArrowUpRight : ArrowDownLeft;

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
                                                            <p className="transaction-name">{transaction.name}</p>
                                                            <p className="transaction-description">{transaction.description}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Middle Section - Date */}
                                                <div className="transaction-middle">
                                                    <div className="transaction-date">
                                                        {formatDateTime(transaction.date, transaction.time)}
                                                    </div>
                                                </div>

                                                {/* Right Section - Amount & Arrow */}
                                                <div className="transaction-right">
                                                    <div className="amount-section">
                                                        <p className={`transaction-amount ${transaction.type}`}>
                                                            {transaction.type === 'sent' ? '-' : '+'}
                                                            {formatCurrency(transaction.amount)}
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
            </div>
        </div>
    );
};

export default Transaction;