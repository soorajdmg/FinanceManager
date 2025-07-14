import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, LogOut, User } from 'lucide-react';
import './Navbar.css';

const Navbar = ({ isDarkMode, setIsDarkMode, userData }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  console.log("user: ", userData)

  const handleLogout = async () => {
    try {
      // Get the token from localStorage (adjust based on how you store it)
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');

      // Make API call to logout endpoint
      const response = await fetch('/api/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Clear all authentication data from localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('userData');

        // Clear any other session data you might have
        sessionStorage.clear();

        console.log('Logged out successfully');

        // Redirect to login page or home page
        window.location.href = '/login'; // or use your router's navigation

      } else {
        console.error('Logout failed:', response.statusText);
        // Even if server logout fails, clear local storage and redirect
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('userData');
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Error during logout:', error);
      // Clear local storage and redirect even if there's an error
      localStorage.removeItem('token');
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('userData');
      window.location.href = '/login';
    }

    setShowDropdown(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
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
            <div className="user-avatar" onClick={toggleDropdown} ref={dropdownRef}>
              {userData?.profilePicture || userData?.avatar ? (
                <img
                  src={userData?.profilePicture || userData?.avatar}
                  alt="User Avatar"
                  className="avatar-image"
                />
              ) : (
                <div className="avatar-icon">
                  <User size={16} />
                </div>
              )}
              <div className="avatar-status"></div>

              {/* Dropdown Menu */}
              {showDropdown && (
                <div className="dropdown-menu">
                  <div className="dropdown-header">
                    <div className="dropdown-name">{userData?.name || 'User'}</div>
                    <div className="dropdown-email">{userData?.email || 'user@example.com'}</div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item logout-btn" onClick={handleLogout}>
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;