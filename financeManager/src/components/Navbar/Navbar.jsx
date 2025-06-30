import React from 'react';
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Search Section */}
        <div className="search-container">
          <div className="search-wrapper">
            <svg 
              className="search-icon" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <path d="M21 21l-4.35-4.35"></path>
            </svg>
            <input 
              type="text" 
              placeholder="Search" 
              className="search-input"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="navbar-right">
          {/* Language Selector */}
          <div className="language-selector">
            <span className="language-text">EN</span>
            <svg 
              className="dropdown-icon" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <polyline points="6,9 12,15 18,9"></polyline>
            </svg>
          </div>

          {/* Notification Icon */}
          <div className="notification-container">
            <svg 
              className="notification-icon" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          </div>

          {/* User Avatar */}
          <div className="user-avatar">
            <img 
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face" 
              alt="User Avatar" 
              className="avatar-image"
            />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;