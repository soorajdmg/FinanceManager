import React from 'react';
import {
  BarChart3,
  TrendingUp,
  CreditCard,
  DollarSign,
  Clipboard,
  Upload,
  Settings
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ activeSection, onNavigate, isDarkMode }) => {
  const handleNavClick = (e, sectionId) => {
    e.preventDefault();
    onNavigate(sectionId);
  };

  const navItems = [
    {
      items: [
        { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
        { id: 'transactions', icon: CreditCard, label: 'Transactions' },
        { id: 'budget', icon: DollarSign, label: 'Budget' },
        { id: 'investments', icon: TrendingUp, label: 'Investments' },
        { id: 'reports', icon: Clipboard, label: 'Reports' }
      ]
    },
    {
      items: [
        { id: 'upload', icon: Upload, label: 'Document Upload' },
        { id: 'settings', icon: Settings, label: 'Settings' }
      ]
    }
  ];

  return (
    <div className={`sidebar ${isDarkMode ? 'dark' : ''}`}>
      <div className="sidebar-header">
        <div className="logo">Finance Manager</div>
      </div>

      <nav className="nav-menu">
        {navItems.map((section, sectionIndex) => (
          <div key={sectionIndex} className="nav-section">
            {section.items.map((item) => {
              const IconComponent = item.icon;
              return (
                <a
                  key={item.id}
                  href="#"
                  className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
                  onClick={(e) => handleNavClick(e, item.id)}
                >
                  <IconComponent className="nav-item-icon" size={18} />
                  <span className="nav-item-label">{item.label}</span>
                </a>
              );
            })}
          </div>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;