import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

// Components
import Navbar from './components/Navbar/Navbar.jsx';
import Sidebar from './components/Sidebar/Sidebar.jsx';

// Public Pages
import LandingPage from './pages/Landing/Landing.jsx';

// Private Pages
import Dashboard from './pages/Dashboard/Dashboard.jsx';
import Transactions from './pages/Transactions/Transactions.jsx';
import Budget from './pages/Budget/Budget.jsx';
import Reports from './pages/Reports/Reports.jsx';
import DocumentUpload from './pages/DocumentUpload/DocumentUpload.jsx';
import Profile from './pages/Profile/Profile.jsx';
import Settings from './pages/Settings/Settings.jsx';

import './App.css';

// Auth Context Hook (simple implementation)
const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for token in localStorage on app startup
    const token = localStorage.getItem('authToken');
    setIsAuthenticated(!!token);
    setLoading(false);
  }, []);

  const login = (token) => {
    localStorage.setItem('authToken', token);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
  };

  return { isAuthenticated, login, logout };
};

// Protected Route Component
const ProtectedRoute = ({ children, isAuthenticated }) => {
  return isAuthenticated ? children : <Navigate to="/" replace />;
};

// Public Route Component (redirects authenticated users)
const PublicRoute = ({ children, isAuthenticated }) => {
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
};

// Public Layout Component (no sidebar)
const PublicLayout = ({ children, isDarkMode }) => {
  return (
    <div className={`public-container ${isDarkMode ? 'dark-mode' : ''}`}>
      {/* Optional: Add a minimal public navbar here */}
      <div className="public-content">
        {children}
      </div>
    </div>
  );
};

// Private Layout Component (with sidebar)
const PrivateLayout = ({ children, isDarkMode, onDarkModeChange, activeSection, onNavigate }) => {
  return (
    <div className={`container ${isDarkMode ? 'dark-mode' : ''}`}>
      <Sidebar
        activeSection={activeSection}
        onNavigate={onNavigate}
        isDarkMode={isDarkMode}
      />
      <div className="main-content">
        <Navbar
          isDarkMode={isDarkMode}
          setIsDarkMode={onDarkModeChange}
        />
        {children}
      </div>
    </div>
  );
};

const App = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading, login, logout } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Apply dark mode class to document body when isDarkMode changes
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  // Simple dark mode toggle function
  const handleDarkModeChange = (newDarkMode) => {
    setIsDarkMode(newDarkMode);
  };

  // Get active section from current pathname
  const getActiveSection = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return 'dashboard';
    if (path === '/transactions') return 'transactions';
    if (path === '/budget') return 'budget';
    if (path === '/reports') return 'reports';
    if (path === '/upload') return 'upload';
    if (path === '/profile') return 'profile';
    if (path === '/settings') return 'settings';
    return 'dashboard';
  };

  // Navigation handler
  const handleNavigation = (sectionId) => {
    switch (sectionId) {
      case 'dashboard':
        navigate('/dashboard');
        break;
      case 'transactions':
        navigate('/transactions');
        break;
      case 'budget':
        navigate('/budget');
        break;
      case 'reports':
        navigate('/reports');
        break;
      case 'upload':
        navigate('/upload');
        break;
      case 'profile':
        navigate('/profile');
        break;
      case 'settings':
        navigate('/settings');
        break;
      case 'logout':
        logout();
        navigate('/');
        break;
      default:
        navigate('/dashboard');
    }
  };

  // Handle authentication success (login or signup)
  const handleAuthSuccess = (token) => {
    login(token);
    navigate('/dashboard');
  };

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Route - Landing Page with integrated auth */}
      <Route
        path="/"
        element={
          <PublicRoute isAuthenticated={isAuthenticated}>
            <PublicLayout isDarkMode={isDarkMode}>
              <LandingPage
                onAuthSuccess={handleAuthSuccess}
              />
            </PublicLayout>
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <PrivateLayout
              isDarkMode={isDarkMode}
              onDarkModeChange={handleDarkModeChange}
              activeSection={getActiveSection()}
              onNavigate={handleNavigation}
            >
              <Dashboard />
            </PrivateLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/transactions"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <PrivateLayout
              isDarkMode={isDarkMode}
              onDarkModeChange={handleDarkModeChange}
              activeSection={getActiveSection()}
              onNavigate={handleNavigation}
            >
              <Transactions />
            </PrivateLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/budget"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <PrivateLayout
              isDarkMode={isDarkMode}
              onDarkModeChange={handleDarkModeChange}
              activeSection={getActiveSection()}
              onNavigate={handleNavigation}
            >
              <Budget />
            </PrivateLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/reports"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <PrivateLayout
              isDarkMode={isDarkMode}
              onDarkModeChange={handleDarkModeChange}
              activeSection={getActiveSection()}
              onNavigate={handleNavigation}
            >
              <Reports />
            </PrivateLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/upload"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <PrivateLayout
              isDarkMode={isDarkMode}
              onDarkModeChange={handleDarkModeChange}
              activeSection={getActiveSection()}
              onNavigate={handleNavigation}
            >
              <DocumentUpload />
            </PrivateLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <PrivateLayout
              isDarkMode={isDarkMode}
              onDarkModeChange={handleDarkModeChange}
              activeSection={getActiveSection()}
              onNavigate={handleNavigation}
            >
              <Profile />
            </PrivateLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <PrivateLayout
              isDarkMode={isDarkMode}
              onDarkModeChange={handleDarkModeChange}
              activeSection={getActiveSection()}
              onNavigate={handleNavigation}
            >
              <Settings />
            </PrivateLayout>
          </ProtectedRoute>
        }
      />

      {/* Fallback route - redirect to appropriate page based on auth status */}
      <Route
        path="*"
        element={
          isAuthenticated ?
            <Navigate to="/dashboard" replace /> :
            <Navigate to="/" replace />
        }
      />
    </Routes>
  );
};

export default App;