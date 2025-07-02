import React from 'react';
import { Sun, Moon } from 'lucide-react';
import './Navbar.css';

const Navbar = ({ isDarkMode, setIsDarkMode }) => {
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <nav className={`navbar ${isDarkMode ? 'dark' : ''}`}>
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
              className="navbar-search-input"
            />
          </div>
        </div>
        {/* Right Section */}
        <div className="navbar-right">
          {/* Dark Mode Toggle */}
          <div className="dark-mode-toggle" onClick={toggleDarkMode}>
            <div className="toggle-wrapper">
              <Sun className={`sun-icon ${isDarkMode ? 'hidden' : 'visible'}`} size={18} />
              <Moon className={`moon-icon ${isDarkMode ? 'visible' : 'hidden'}`} size={18} />
            </div>
          </div>
          {/* User Avatar */}
          <div className="user-avatar">
            <img
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
              alt="User Avatar"
              className="avatar-image"
            />
            <div className="avatar-status"></div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;