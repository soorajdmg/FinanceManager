import React from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar.jsx';
import Sidebar from './components/Sidebar/Sidebar.jsx';
import Dashboard from './pages/Dashboard/Dashboard.jsx';
import Transactions from './pages/Transactions/Transactions.jsx';
import Budget from './pages/Budget/Budget.jsx';
import DocumentUpload from './pages/DocumentUpload/DocumentUpload.jsx';
import Profile from './pages/Profile/Profile.jsx';
import Settings from './pages/Settings/Settings.jsx';
import './App.css';

const App = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get active section from current pathname
  const getActiveSection = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return 'dashboard';
    if (path === '/transactions') return 'transactions';
    if (path === '/budget') return 'budget';
    if (path === '/upload') return 'upload';
    if (path === '/profile') return 'profile';
    if (path === '/settings') return 'settings';
    return 'dashboard'; // default
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
      case 'upload':
        navigate('/upload');
        break;
      case 'profile':
        navigate('/profile');
        break;
      case 'settings':
        navigate('/settings');
        break;
      default:
        navigate('/dashboard');
    }
  };

  return (
    <div className="container">
      <Sidebar
        activeSection={getActiveSection()}
        onNavigate={handleNavigation}
      />

      <div className="main-content">
        <Navbar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/budget" element={<Budget />} />
          <Route path="/upload" element={<DocumentUpload />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          {/* Fallback route */}
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </div>
    </div>
  );
};

export default App;