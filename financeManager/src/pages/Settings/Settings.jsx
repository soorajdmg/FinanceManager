import React, { useState } from 'react';
import {
  User,
  Bell,
  Shield,
  Globe,
  Database,
  Download,
  Trash2,
  Eye,
  EyeOff,
  Save,
  ChevronRight,
  Mail,
  Phone,
  Building,
  Calendar,
  Clock,
  BarChart3,
  FileText,
  Zap
} from 'lucide-react';
import './settings.css';

const Settings = () => {
  const [activeSection, setActiveSection] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: 'Sooraj',
    lastName: 'Murugaraj',
    email: 'soorajmurugaraj@gmail.com',
    phone: '+91 9846249930',
    company: '',
    notifications: {
      email: true,
      push: false,
      reports: true,
      alerts: true
    },
    privacy: {
      profileVisibility: 'private',
      dataSharing: false,
      analytics: true
    },
    preferences: {
      language: 'en',
      timezone: 'UTC-5',
      dateFormat: 'MM/DD/YYYY',
      reportFrequency: 'weekly'
    }
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSave = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  };

  const settingsNavigation = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Globe },
    { id: 'data', label: 'Data Management', icon: Database },
    { id: 'account', label: 'Account', icon: Trash2 }
  ];

  return (
    <div className="settings-container">
      <div className="settings-padding">
        <div className="settings-max-width">
          {/* Main Content */}
          <div className="settings-layout">
            {/* Navigation Sidebar */}
            <div className="settings-nav">
              <div className="nav-list">
                {settingsNavigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`settings-nav-item ${activeSection === item.id ? 'active' : ''}`}
                    >
                      <div className="settings-nav-item-content">
                        <Icon className="nav-icon" />
                        <span className="nav-label">{item.label}</span>
                      </div>
                      <ChevronRight className="nav-arrow" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content Area */}
            <div className="settings-content">
              {/* Profile Section */}
              {activeSection === 'profile' && (
                <div className="content-section">
                  <div className="section-header">
                    <h2 className="section-title">Profile Information</h2>
                  </div>

                  <div className="settings-card">
                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label">First Name</label>
                        <input
                          type="text"
                          className="form-input"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Last Name</label>
                        <input
                          type="text"
                          className="form-input"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                        />
                      </div>
                      <div className="form-group full-width">
                        <label className="form-label">
                          <Mail className="label-icon" />
                          Email Address
                        </label>
                        <input
                          type="email"
                          className="form-input"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">
                          <Phone className="label-icon" />
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          className="form-input"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">
                          <Building className="label-icon" />
                          Company
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          value={formData.company}
                          onChange={(e) => handleInputChange('company', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Section */}
              {activeSection === 'notifications' && (
                <div className="content-section">
                  <div className="section-header">
                    <h2 className="section-title">Notification Preferences</h2>
                  </div>

                  <div className="settings-card">
                    <div className="notification-list">
                      <div className="notification-item">
                        <div className="notification-info">
                          <div className="settings-notification-icon">
                            <Mail />
                          </div>
                          <div className="notification-content">
                            <h4>Email Notifications</h4>
                            <p>Receive important updates via email</p>
                          </div>
                        </div>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={formData.notifications.email}
                            onChange={(e) => handleNestedChange('notifications', 'email', e.target.checked)}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>

                      <div className="notification-item">
                        <div className="notification-info">
                          <div className="settings-notification-icon">
                            <Bell />
                          </div>
                          <div className="notification-content">
                            <h4>Push Notifications</h4>
                            <p>Get instant alerts in your browser</p>
                          </div>
                        </div>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={formData.notifications.push}
                            onChange={(e) => handleNestedChange('notifications', 'push', e.target.checked)}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>

                      <div className="notification-item">
                        <div className="notification-info">
                          <div className="settings-notification-icon">
                            <FileText />
                          </div>
                          <div className="notification-content">
                            <h4>Analysis Reports</h4>
                            <p>Weekly reports about your website performance</p>
                          </div>
                        </div>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={formData.notifications.reports}
                            onChange={(e) => handleNestedChange('notifications', 'reports', e.target.checked)}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>

                      <div className="notification-item">
                        <div className="notification-info">
                          <div className="settings-notification-icon">
                            <Zap />
                          </div>
                          <div className="notification-content">
                            <h4>Security Alerts</h4>
                            <p>Immediate notifications for security issues</p>
                          </div>
                        </div>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={formData.notifications.alerts}
                            onChange={(e) => handleNestedChange('notifications', 'alerts', e.target.checked)}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Privacy Section */}
              {activeSection === 'privacy' && (
                <div className="content-section">
                  <div className="section-header">
                    <h2 className="section-title">Privacy & Security</h2>
                  </div>

                  <div className="settings-card">
                    <div className="privacy-section">
                      <h3 className="subsection-title">Account Security</h3>
                      <div className="form-group">
                        <label className="form-label">Current Password</label>
                        <div className="password-input-wrapper">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            className="form-input"
                            placeholder="Enter current password"
                          />
                          <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff /> : <Eye />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="privacy-section">
                      <h3 className="subsection-title">Privacy Controls</h3>
                      <div className="privacy-list">
                        <div className="privacy-item">
                          <div className="privacy-info">
                            <h4>Profile Visibility</h4>
                            <p>Control who can see your profile information</p>
                          </div>
                          <select
                            className="form-select"
                            value={formData.privacy.profileVisibility}
                            onChange={(e) => handleNestedChange('privacy', 'profileVisibility', e.target.value)}
                          >
                            <option value="public">Public</option>
                            <option value="private">Private</option>
                            <option value="team">Team Only</option>
                          </select>
                        </div>

                        <div className="privacy-item">
                          <div className="privacy-info">
                            <h4>Data Sharing</h4>
                            <p>Allow anonymous usage data to improve our services</p>
                          </div>
                          <label className="toggle-switch">
                            <input
                              type="checkbox"
                              checked={formData.privacy.dataSharing}
                              onChange={(e) => handleNestedChange('privacy', 'dataSharing', e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </div>

                        <div className="privacy-item">
                          <div className="privacy-info">
                            <h4>Analytics Tracking</h4>
                            <p>Enable detailed analytics for better insights</p>
                          </div>
                          <label className="toggle-switch">
                            <input
                              type="checkbox"
                              checked={formData.privacy.analytics}
                              onChange={(e) => handleNestedChange('privacy', 'analytics', e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Preferences Section */}
              {activeSection === 'preferences' && (
                <div className="content-section">
                  <div className="section-header">
                    <h2 className="section-title">Preferences</h2>
                  </div>

                  <div className="settings-card">
                    <div className="preferences-grid">
                      <div className="preference-group">
                        <label className="form-label">
                          <Globe className="label-icon" />
                          Language
                        </label>
                        <select
                          className="form-select"
                          value={formData.preferences.language}
                          onChange={(e) => handleNestedChange('preferences', 'language', e.target.value)}
                        >
                          <option value="en">English</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                          <option value="de">German</option>
                        </select>
                      </div>

                      <div className="preference-group">
                        <label className="form-label">
                          <Clock className="label-icon" />
                          Timezone
                        </label>
                        <select
                          className="form-select"
                          value={formData.preferences.timezone}
                          onChange={(e) => handleNestedChange('preferences', 'timezone', e.target.value)}
                        >
                          <option value="UTC-8">Pacific Time (UTC-8)</option>
                          <option value="UTC-5">Eastern Time (UTC-5)</option>
                          <option value="UTC+0">GMT (UTC+0)</option>
                          <option value="UTC+1">Central European (UTC+1)</option>
                        </select>
                      </div>

                      <div className="preference-group">
                        <label className="form-label">
                          <Calendar className="label-icon" />
                          Date Format
                        </label>
                        <select
                          className="form-select"
                          value={formData.preferences.dateFormat}
                          onChange={(e) => handleNestedChange('preferences', 'dateFormat', e.target.value)}
                        >
                          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        </select>
                      </div>

                      <div className="preference-group">
                        <label className="form-label">
                          <BarChart3 className="label-icon" />
                          Report Frequency
                        </label>
                        <select
                          className="form-select"
                          value={formData.preferences.reportFrequency}
                          onChange={(e) => handleNestedChange('preferences', 'reportFrequency', e.target.value)}
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                          <option value="never">Never</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Data Management Section */}
              {activeSection === 'data' && (
                <div className="content-section">
                  <div className="section-header">
                    <h2 className="section-title">Data Management</h2>
                  </div>

                  <div className="settings-card">
                    <div className="data-actions">
                      <div className="data-action-item">
                        <div className="data-action-info">
                          <div className="data-action-icon">
                            <Download />
                          </div>
                          <div className="data-action-content">
                            <h4>Export Data</h4>
                            <p>Download all your website analysis data and reports</p>
                          </div>
                        </div>
                        <button className="action-button secondary">
                          <Download className="button-icon" />
                          Export
                        </button>
                      </div>

                      <div className="data-action-item">
                        <div className="data-action-info">
                          <div className="data-action-icon">
                            <Database />
                          </div>
                          <div className="data-action-content">
                            <h4>Data Retention</h4>
                            <p>View and manage how long we keep your data</p>
                          </div>
                        </div>
                        <button className="action-button secondary">
                          <Database className="button-icon" />
                          Manage
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Account Section */}
              {activeSection === 'account' && (
                <div className="content-section">
                  <div className="section-header">
                    <h2 className="section-title">Account Management</h2>
                  </div>

                  <div className="settings-card">
                    <div className="account-actions">
                      <div className="account-section danger-zone">
                        <h3 className="subsection-title danger">Danger Zone</h3>
                        <div className="danger-action">
                          <div className="danger-info">
                            <h4>Delete Account</h4>
                            <p>Permanently delete your account and all associated data. This action cannot be undone.</p>
                          </div>
                          <button className="action-button danger">
                            <Trash2 className="button-icon" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="save-section">
                <button
                  className={`save-btn ${isLoading ? 'loading' : ''}`}
                  onClick={handleSave}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="save-spinner spinning"></div>
                  ) : (
                    <Save className="save-icon" />
                  )}
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;